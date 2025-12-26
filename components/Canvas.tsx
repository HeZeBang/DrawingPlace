"use client";
import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { useRuntimeConfigContext } from "./RuntimeConfigProvider";
import { cn } from "@/lib/utils";

export interface CanvasRef {
  drawPoint: (p: any) => void;
  drawBatch: (points: any[]) => void;
  clear: () => void;
  init: (points: any[]) => void;
}

const Canvas = forwardRef(
  ({ color, onMove, onDraw, editable, opacity }: any, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { config } = useRuntimeConfigContext();
    const size = { width: config.CANVAS_WIDTH, height: config.CANVAS_HEIGHT };

    // Helper to draw a point
    const drawPoint = (ctx: CanvasRenderingContext2D, p: any) => {
      if (!p) return;
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x, p.y, p.w || 1, p.h || 1);
    };

    useImperativeHandle(ref, () => ({
      drawPoint: (p: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (ctx) drawPoint(ctx, p);
      },
      drawBatch: (points: any[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        points.forEach((p) => drawPoint(ctx, p));
      },
      clear: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      },
      init: (points: any[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = size.width;
        canvas.height = size.height;
        points.forEach((p) => drawPoint(ctx, p));
      },
    }));

    // Initialize canvas size
    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = size.width;
        canvas.height = size.height;
      }
    }, [size.width, size.height]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.addEventListener("contextmenu", (e) => e.preventDefault());
      }
    }, [canvasRef]);

    const handleMouseDown = (e: any) => {
      if (e.button !== 0) return;
      if (!editable || !color) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      // Calculate position relative to the canvas element
      // Since we rely on CSS transform for zoom, rect will be the zoomed size.

      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);

      onDraw({
        x,
        y,
        w: 1,
        h: 1,
        c: color,
      });
    };

    const handleMouseMove = (e: any) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);

      if (onMove) onMove({ x, y });
    };

    return (
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        className={cn(
          "block react-zoom-pan-pinch-no-pan z-0",
          editable ? "cursor-crosshair" : "cursor-default",
        )}
        style={{
          width: size.width + "px",
          height: size.height + "px",
          imageRendering: "pixelated", // Ensure crisp edges when zoomed
          opacity: opacity,
        }}
      />
    );
  },
);

Canvas.displayName = "Canvas";

export default Canvas;
