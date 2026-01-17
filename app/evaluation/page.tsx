"use client";

import React, { useState, useEffect, useRef } from "react";
import { Cropper, CropperRef } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Layers,
  User,
  Check,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Vote {
  voteIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HeatmapVote {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function EvaluationPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [allVotes, setAllVotes] = useState<HeatmapVote[]>([]);
  
  // View State
  const [viewMode, setViewMode] = useState<"mine" | "all">("mine");
  const [selectedSlot, setSelectedSlot] = useState<number>(0); // 0, 1, 2
  
  // Cropper State
  const cropperRef = useRef<CropperRef>(null);
  const [cropperEnabled, setCropperEnabled] = useState(false);

  // Initialize Auth
  useEffect(() => {
    const t = localStorage.getItem("draw_token");
    setToken(t);
    fetchVotes(t);
  }, []);

  const fetchVotes = async (authToken: string | null) => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const res = await fetch("/api/evaluation/votes", { headers });
      if (res.ok) {
        const data = await res.json();
        setVotes(data.myVotes || []);
        setAllVotes(data.allVotes || []);
      } else {
        toast.error("Failed to load votes");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  // Sync cropper with selected slot
  useEffect(() => {
    if (viewMode === "mine" && cropperRef.current) {
      const vote = votes.find((v) => v.voteIndex === selectedSlot);
      if (vote) {
        cropperRef.current.setCoordinates({
          left: vote.x,
          top: vote.y,
          width: vote.width,
          height: vote.height,
        });
        setCropperEnabled(false); // View mode initially
      } else {
        // No vote for this slot, default to center or similar?
        // Cropper loads with default full image or centered.
        // We probably want to enable editing immediately if empty or just wait for user interaction
        setCropperEnabled(true); 
      }
    }
  }, [selectedSlot, votes, viewMode]);

  const handleSave = async () => {
    if (!token) {
      toast.error("Please login to vote");
      return;
    }
    if (!cropperRef.current) return;

    const coords = cropperRef.current.getCoordinates();
    if (!coords) return;

    try {
      const res = await fetch("/api/evaluation/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          voteIndex: selectedSlot,
          x: Math.round(coords.left),
          y: Math.round(coords.top),
          width: Math.round(coords.width),
          height: Math.round(coords.height),
        }),
      });

      if (res.ok) {
        toast.success("Vote saved!");
        fetchVotes(token);
        setCropperEnabled(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save");
      }
    } catch (e) {
      toast.error("Error saving vote");
    }
  };

  const handleDelete = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/evaluation/vote?index=${selectedSlot}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success("Vote removed");
        fetchVotes(token);
        setCropperEnabled(true); // Reset to edit mode for empty slot
      } else {
        toast.error("Failed to delete");
      }
    } catch (e) {
      toast.error("Error deleting vote");
    }
  };

  const currentVote = votes.find((v) => v.voteIndex === selectedSlot);

  const [heatmapCanvas, setHeatmapCanvas] = useState<HTMLCanvasElement | null>(null);
  const [heatmapData, setHeatmapData] = useState<Uint8ClampedArray | null>(null);
  const [heatmapWidth, setHeatmapWidth] = useState(0);
  const [hoverInfo, setHoverInfo] = useState<{ x: number, y: number, count: number } | null>(null);
  const lastUpdateRef = useRef(0);

  // Heatmap Illustration Effect
  useEffect(() => {
    if (!heatmapCanvas || viewMode !== "all") return;

    const ctx = heatmapCanvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = "/map_result.png";
    
    // Ensure we draw only after image metadata is known to match size
    img.onload = () => {
        // Set canvas resolution to match the map source
        if (heatmapCanvas.width !== img.width || heatmapCanvas.height !== img.height) {
            heatmapCanvas.width = img.width;
            heatmapCanvas.height = img.height;
        }
        // Create an offscreen canvas to calculate heat density
        const heatCanvas = document.createElement('canvas');
        heatCanvas.width = heatmapCanvas.width;
        heatCanvas.height = heatmapCanvas.height;
        const heatCtx = heatCanvas.getContext('2d');
        if (!heatCtx) return;

        // 1. Accumulate votes using 'lighter' blending to count overlaps
        heatCtx.globalCompositeOperation = "lighter";
        // Use the smallest increment (1) in the red channel to count votes
        // Hex #010000 ensures Red increases by 1 per overlap (up to 255)
        heatCtx.fillStyle = "#010000"; 
        
        allVotes.forEach(v => {
          heatCtx.fillRect(v.x, v.y, v.width, v.height);
        });

        // 2. Process pixel data to normalize transparency
        const imgData = heatCtx.getImageData(0, 0, heatCanvas.width, heatCanvas.height);
        const data = imgData.data; // RGBA array
        
        // Save raw vote data for tooltip lookup 
        // We clone it because the next loop modifies 'data' in place for display
        setHeatmapData(new Uint8ClampedArray(data)); 
        setHeatmapWidth(heatCanvas.width);
        
        // Find maximum overlap count (max value in Red channel)
        let maxOverlap = 0;
        for (let i = 0; i < data.length; i += 4) {
             if (data[i] > maxOverlap) maxOverlap = data[i];
        }

        // Avoid division by zero if no votes exist
        if (maxOverlap === 0) maxOverlap = 1;

        // 3. Generate the white mask
        // Rule: 
        // - Max overlap => 0% opacity (Transparent / Clear)
        // - 0 overlap   => 60% opacity (White Mask) - Adjusted to 0.6 for better contrast
        const MAX_MASK_OPACITY = 0.9; 
        
        for (let i = 0; i < data.length; i += 4) {
            const votes = data[i]; // Red channel holds the count
            
            // Calculate alpha: Invert/Normalize heat
            // More votes = Lower Alpha (More Transparent)
            // 0 votes = MAX_MASK_OPACITY
            // max votes = 0 Opacity
            const normalizedHeat = votes / maxOverlap;
            const alpha = MAX_MASK_OPACITY * (1 - normalizedHeat);
            
            // Write White Pixel with calculated Alpha
            data[i] = 255;     // R
            data[i + 1] = 255; // G
            data[i + 2] = 255; // B
            data[i + 3] = alpha * 255; // A
        }

        // 4. Put the processed mask onto the visible canvas
        ctx.putImageData(imgData, 0, 0);

    };
  }, [heatmapCanvas, allVotes, viewMode]);
  
  const handleHeatmapInteraction = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!heatmapData || heatmapWidth === 0) return;

    // Throttle to ~30fps to avoid lag
    const now = Date.now();
    if (now - lastUpdateRef.current < 32) return;
    lastUpdateRef.current = now;

    // Get click coordinates relative to the original image size
    // We need to look up the event target's bounding box and the current scale
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    
    // For touches
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Since the image is potentially scaled by TransformWrapper, but the data is 1:1 with natural resolution,
    // we need to know the natural size vs rendered size. 
    // BUT: The event handler is on the WRAPPER (TransformComponent's child), which scales WITH the content.
    // So the click coordinates (offset) on the element should be local to that element's current size?
    // Actually, getting coordinates on a transformed element is tricky.
    
    // Better approach: Attach handler to the IMAGE/CANVAS itself. The click event usually reports 
    // coordinates in screen space, and we map to element space.
    // If the element is scaled CSS transform, rect.width will be the SCALED width.
    
    // Let's assume the native image width is available in heatmapWidth.
    // Scale factor = rect.width / heatmapWidth.
    const scaleX = heatmapWidth / rect.width;
    // Approximating height from array length since we don't store heatmapHeight explicitly
    // Best would be to store heatmapHeight too, but this works if rectangular
    const estimatedHeight = heatmapData.length / 4 / heatmapWidth; 
    const scaleY = estimatedHeight / rect.height; 
    
    const trueX = Math.floor(x * scaleX);
    const trueY = Math.floor(y * scaleY);

    if (trueX >= 0 && trueX < heatmapWidth) { // Basic bounds check
        const index = (trueY * heatmapWidth + trueX) * 4;
        if (index < heatmapData.length) {
            const count = heatmapData[index]; // Red channel has the count
            setHoverInfo({ x: clientX, y: clientY, count });
            return;
        }
    }
    setHoverInfo(null);
  };
  
  // Clear tooltip on zoom/interaction start
  const onInteractionStart = () => {
      setHoverInfo(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100 dark:bg-zinc-950 overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 flex items-center justify-between px-4 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 z-20 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-lg">Evaluation & Voting</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Main Content */}
      <div className="flex-1 relative bg-gray-500 overflow-hidden flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50 text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        
        {viewMode === "mine" ? (
          <Cropper
            ref={cropperRef}
            src="/map_result.png"
            className="h-full w-full object-contain"
            stencilProps={{
              aspectRatio: NaN, // Free aspect ratio
              movable: cropperEnabled,
              resizable: cropperEnabled,
              previewClassName: "border-2 border-primary",
              handlers: cropperEnabled ? undefined : { west: false, east: false, north: false, south: false, "east-north": false, "north-west": false, "south-west": false, "south-east": false }
            }}
            defaultCoordinates={
              currentVote 
                ? { left: currentVote.x, top: currentVote.y, width: currentVote.width, height: currentVote.height }
                : undefined
            }
            style={{
                imageRendering: 'pixelated',
            }}
            backgroundClassName="bg-gray-800"
          />
        ) : (
          <div className="relative h-full w-full flex items-center justify-center overflow-hidden bg-gray-800">
             {/* Simple Image + Overlay for Heatmap mode, using regular img to easier overlay */}
             <TransformWrapper
                initialScale={1}
                minScale={0.1}
                maxScale={20}
                centerOnInit
                onPanning={onInteractionStart}
                onZoom={onInteractionStart}
             >
                <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-min !h-min">
                  <div 
                    className="relative cursor-crosshair"
                    onClick={handleHeatmapInteraction}
                    onMouseMove={handleHeatmapInteraction}
                    onMouseLeave={() => setHoverInfo(null)}
                  >
                    {/* Use standard img tag but ensure it displays natural size so coordinates match */}
                    <img src="/map_result.png" alt="Map" className="pointer-events-none select-none max-w-none" style={{
                        imageRendering: 'pixelated',
                    }} />
                    <canvas 
                        ref={setHeatmapCanvas} 
                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                        style={{ zIndex: 10, imageRendering: 'pixelated' }}
                    />
                  </div>
                </TransformComponent>
             </TransformWrapper>
             
             {/* Tooltip */}
             {hoverInfo && (
                <div 
                    className="fixed pointer-events-none z-50 px-3 py-1.5 bg-black/80 text-white text-xs rounded shadow-lg backdrop-blur-sm transition-all duration-75 border border-white/10"
                    style={{ 
                        left: hoverInfo.x + 15, 
                        top: hoverInfo.y + 15,
                        transform: 'translate(0, 0)'
                    }}
                >
                    <span className="font-bold text-yellow-400">{hoverInfo.count}</span> votes here
                </div>
             )}
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 p-4 shrink-0 z-20 pb-8">
        <div className="flex flex-col gap-4 max-w-lg mx-auto">
          
          {/* Mode Switcher */}
          <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("mine")}
              className={cn(
                "flex-1 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                viewMode === "mine" 
                  ? "bg-white dark:bg-zinc-700 shadow-sm text-primary" 
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <User size={16} />
              My Votes
            </button>
            <button
              onClick={() => setViewMode("all")}
              className={cn(
                "flex-1 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                viewMode === "all" 
                  ? "bg-white dark:bg-zinc-700 shadow-sm text-primary" 
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <Layers size={16} />
              Global Heatmap
            </button>
          </div>

          {/* Controls Area */}
          {viewMode === "mine" && (
            <div className="flex flex-col gap-3">
              {/* Slot Selectors */}
              <div className="flex gap-2 justify-center">
                {[0, 1, 2].map((idx) => {
                  const hasVote = votes.some(v => v.voteIndex === idx);
                  const isSelected = selectedSlot === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedSlot(idx);
                        // If switching to a slot that has a vote, disable editing initially
                        const v = votes.find(vote => vote.voteIndex === idx);
                        setCropperEnabled(!v); 
                      }}
                      className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all",
                        isSelected 
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20" 
                          : "border-gray-300 dark:border-zinc-700",
                        hasVote && !isSelected && "bg-green-500/10 border-green-500/50"
                      )}
                    >
                      {hasVote ? <Check size={20} className="text-green-600" /> : <span className="text-sm font-bold text-gray-400">{idx + 1}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {currentVote && !cropperEnabled ? (
                   <Button 
                    className="flex-1" 
                    onClick={() => setCropperEnabled(true)}
                  >
                    Modify Selection {selectedSlot + 1}
                  </Button>
                ) : (
                  <Button 
                    className="flex-1" 
                    onClick={handleSave}
                    disabled={!token}
                  >
                   {currentVote ? "Update Selection" : "Confirm Selection"} {selectedSlot + 1}
                  </Button>
                )}
                
                {currentVote && (
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={handleDelete}
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
              </div>
              
              {!token && (
                 <p className="text-center text-xs text-red-500">Please login on the main page to vote.</p>
              )}
            </div>
          )}

           {viewMode === "all" && (
             <div className="text-center text-sm text-gray-500 py-2">
               Showing accumulated selections from all users (including you). 
               <br/>
               Popular areas are clearer and revealed through the white mask.
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
