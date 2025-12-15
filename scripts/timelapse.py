import os
import argparse
import subprocess
import numpy as np
from pymongo import MongoClient
from tqdm import tqdm
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFont

# Load environment variables from .env file in the parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

def hex_to_rgb(hex_color):
    """Convert hex color string to RGB tuple."""
    if not isinstance(hex_color, str):
        return (0, 0, 0)
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 3:
        hex_color = ''.join([c*2 for c in hex_color])
    try:
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    except ValueError:
        return (0, 0, 0)

def main():
    parser = argparse.ArgumentParser(description="Generate timelapse from drawing actions using FFmpeg + rawvideo.")
    
    # Configuration defaults
    default_mongo = os.environ.get("MONGO_URI") or os.environ.get("MONGO_URI_CLIENT") or "mongodb://localhost:27017/place"
    default_width = int(os.environ.get("CANVAS_WIDTH", 620))
    default_height = int(os.environ.get("CANVAS_HEIGHT", 300))

    parser.add_argument("--mongo-uri", default=default_mongo, help="MongoDB URI")
    parser.add_argument("--width", type=int, default=default_width, help="Canvas width")
    parser.add_argument("--height", type=int, default=default_height, help="Canvas height")
    parser.add_argument("--output", default="timelapse.mp4", help="Output video file")
    parser.add_argument("--fps", type=int, default=60, help="Output video FPS")
    parser.add_argument("--steps", type=int, default=10, help="Actions per frame (higher = faster timelapse)")
    parser.add_argument("--encoder", default="libx264", help="FFmpeg video encoder (e.g., libx264, h264_nvenc, h264_qsv, h264_videotoolbox)")
    parser.add_argument("--bg-color", default="#ffffff", help="Background color (hex)")
    parser.add_argument("--bg-image", default="../public/map.png", help="Path to background image")
    parser.add_argument("--footer-height", type=int, default=60, help="Height of the footer for timestamp")
    
    args = parser.parse_args()

    print(f"Connecting to MongoDB: {args.mongo_uri}")
    try:
        client = MongoClient(args.mongo_uri)
        # Assume database name is in the URI, otherwise default to 'place'
        db_name = args.mongo_uri.split('/')[-1].split('?')[0] or 'place'
        db = client.get_database(db_name)
        actions_col = db.actions
        
        # Test connection
        client.admin.command('ping')
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return

    # Count total actions
    total_actions = actions_col.count_documents({})
    print(f"Found {total_actions} actions.")

    if total_actions == 0:
        print("No actions found. Exiting.")
        return

    # Ensure dimensions are even for yuv420p
    if args.width % 2 != 0:
        args.width += 1
        print(f"Adjusted width to {args.width} (must be even for yuv420p)")
    if args.height % 2 != 0:
        args.height += 1
        print(f"Adjusted height to {args.height} (must be even for yuv420p)")

    video_height = args.height + args.footer_height
    if video_height % 2 != 0:
        video_height += 1
        print(f"Adjusted video height to {video_height} (must be even for yuv420p)")

    # Initialize Canvas
    print(f"Initializing canvas: {args.width}x{video_height}")
    
    # Create base image with background color
    base_img = Image.new("RGB", (args.width, args.height), args.bg_color)
    
    # Load background image or set color
    bg_img_path = os.path.join(os.path.dirname(__file__), args.bg_image)
    if os.path.exists(bg_img_path):
        print(f"Loading background image: {bg_img_path}")
        try:
            # Load as RGBA to handle transparency
            img = Image.open(bg_img_path).convert('RGBA')
            # Resize with high quality resampling
            # Use Image.LANCZOS for high quality downsampling
            resample_method = getattr(Image, 'Resampling', Image).LANCZOS
            img = img.resize((args.width, args.height), resample_method)
            
            # Paste image onto background using alpha channel as mask
            base_img.paste(img, (0, 0), img)
        except Exception as e:
            print(f"Error loading background image: {e}")
    else:
        print(f"Background image not found: {bg_img_path}, using color {args.bg_color}")

    # Convert to numpy array
    canvas_rgb = np.array(base_img)
    
    # Initialize full canvas
    canvas = np.zeros((video_height, args.width, 3), dtype=np.uint8)
    # Copy drawing area
    canvas[:args.height, :] = canvas_rgb
    # Initialize footer (white)
    canvas[args.height:, :] = [255, 255, 255]

    # Font setup
    try:
        # Try to load a system font, or fallback to default
        font = ImageFont.truetype("DejaVuSans.ttf", 24)
    except:
        try:
            font = ImageFont.truetype("arial.ttf", 24)
        except:
            font = ImageFont.load_default()

    # FFmpeg command
    # Input: raw video, pixel format rgb24, resolution WxH, framerate FPS
    # Output: MP4, yuv420p (for compatibility)
    
    ffmpeg_cmd = [
        'ffmpeg',
        '-y', # Overwrite output
        '-f', 'rawvideo',
        '-vcodec', 'rawvideo',
        '-s', f'{args.width}x{video_height}',
        '-pix_fmt', 'rgb24',
        '-r', str(args.fps),
        '-i', '-', # Input from pipe
        '-c:v', args.encoder,
        '-pix_fmt', 'yuv420p',
        '-preset', 'medium', # Adjust for speed/quality
        args.output
    ]
    
    # Add encoder specific flags
    if args.encoder == 'libx264':
        ffmpeg_cmd.extend(['-crf', '23'])
    elif 'nvenc' in args.encoder:
        ffmpeg_cmd.extend(['-cq', '23']) # Constant Quality for NVENC
    elif 'videotoolbox' in args.encoder:
        ffmpeg_cmd.extend(['-q:v', '50'])

    print(f"Starting FFmpeg: {' '.join(ffmpeg_cmd)}")
    
    log_file = open('ffmpeg_log.txt', 'w')
    try:
        process = subprocess.Popen(
            ffmpeg_cmd,
            stdin=subprocess.PIPE,
            stderr=log_file # Log ffmpeg output to file
        )
    except FileNotFoundError:
        print("Error: 'ffmpeg' command not found. Please install FFmpeg.")
        return

    # Fetch actions sorted by time
    cursor = actions_col.find().sort("create_at", 1)

    count = 0
    frames_written = 0
    if (process.stdin is None):
        print("FFmpeg process stdin is not available.")
        return
    
    # Use tqdm for progress bar
    for action in tqdm(cursor, total=total_actions, unit="act"):
        point = action.get('point')
        if not point:
            continue
            
        x = point.get('x')
        y = point.get('y')
        w = point.get('w', 1)
        h = point.get('h', 1)
        c = point.get('c')

        if x is None or y is None or c is None:
            continue

        # Parse color
        rgb = hex_to_rgb(c)

        # Draw on canvas (numpy array)
        # Ensure bounds
        x_start = max(0, int(x))
        y_start = max(0, int(y))
        x_end = min(args.width, x_start + int(w))
        y_end = min(args.height, y_start + int(h))

        if x_start < x_end and y_start < y_end:
            # Numpy array indexing: [row, col] -> [y, x]
            canvas[y_start:y_end, x_start:x_end] = rgb

        count += 1
        
        # Write frame every 'steps' actions
        if count % args.steps == 0:
            # Draw timestamp on footer
            create_at = action.get('create_at')
            if create_at:
                # Clear footer
                canvas[args.height:, :] = [255, 255, 255]
                
                # Convert footer to PIL image to draw text
                footer_img = Image.fromarray(canvas[args.height:, :])
                draw = ImageDraw.Draw(footer_img)
                
                text = create_at.strftime("%Y-%m-%d %H:%M:%S")
                
                # Calculate text position (centered)
                # getbbox returns (left, top, right, bottom)
                bbox = draw.textbbox((0, 0), text, font=font)
                text_w = bbox[2] - bbox[0]
                text_h = bbox[3] - bbox[1]
                
                x_pos = (args.width - text_w) // 2
                y_pos = (args.footer_height - text_h) // 2
                
                draw.text((x_pos, y_pos), text, font=font, fill=(0, 0, 0))
                
                # Copy back to canvas
                canvas[args.height:, :] = np.array(footer_img)

            try:
                process.stdin.write(canvas.tobytes())
                frames_written += 1
            except BrokenPipeError:
                print("FFmpeg process crashed. Check arguments.")
                print("See ffmpeg_log.txt for details.")
                break

    # Write the final frame a few times to pause at the end (2 seconds)
    print("Finalizing video...")
    for _ in range(args.fps * 2): 
        try:
            process.stdin.write(canvas.tobytes())
        except:
            break

    # Close stdin to signal EOF to ffmpeg
    if process.stdin:
        process.stdin.close()
    process.wait()
    log_file.close()
    
    print(f"Done! Video saved to {args.output}")
    print(f"Total frames: {frames_written}")

if __name__ == "__main__":
    main()
