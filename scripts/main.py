import os
import argparse
import numpy as np
from pymongo import MongoClient
from tqdm import tqdm
from dotenv import load_dotenv
from PIL import Image

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
    parser = argparse.ArgumentParser(description="Composite final image by overlaying all points on background.")
    
    # Configuration defaults
    default_mongo = os.environ.get("MONGO_URI") or os.environ.get("MONGO_URI_CLIENT") or "mongodb://localhost:27017/place"
    default_width = int(os.environ.get("CANVAS_WIDTH", 620))
    default_height = int(os.environ.get("CANVAS_HEIGHT", 300))

    parser.add_argument("--mongo-uri", default=default_mongo, help="MongoDB URI")
    parser.add_argument("--width", type=int, default=default_width, help="Canvas width")
    parser.add_argument("--height", type=int, default=default_height, help="Canvas height")
    parser.add_argument("--output", default="final_composite.png", help="Output image file")
    parser.add_argument("--bg-color", default="#ffffff", help="Background color (hex)")
    parser.add_argument("--bg-image", default="../public/map.png", help="Path to background image")
    
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

    # Initialize Canvas
    print(f"Initializing canvas: {args.width}x{args.height}")
    
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
            resample_method = getattr(Image, 'Resampling', Image).LANCZOS
            img = img.resize((args.width, args.height), resample_method)
            
            # Paste image onto background using alpha channel as mask
            base_img.paste(img, (0, 0), img)
        except Exception as e:
            print(f"Error loading background image: {e}")
    else:
        print(f"Background image not found: {bg_img_path}, using color {args.bg_color}")

    # Convert to numpy array
    canvas = np.array(base_img)
    
    # Fetch all actions sorted by time
    cursor = actions_col.find().sort("create_at", 1)
    
    print("Overlaying all points...")
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
    
    # Convert back to PIL Image and save
    print(f"Saving final composite to {args.output}...")
    final_image = Image.fromarray(canvas)
    final_image.save(args.output, quality=95)
    
    print(f"Done! Image saved to {args.output}")


if __name__ == "__main__":
    main()
