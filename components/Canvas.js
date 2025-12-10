'use client';
import React, { useRef, useEffect } from 'react';

const Canvas = ({ dataSource, color, onMove, onDraw, editable }) => {
    const canvasRef = useRef(null);
    
    const size = { width: 620, height: 300 };

    // Helper to draw a point
    const drawPoint = (ctx, p) => {
        if (!p) return;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.w, p.h);
    };

    // Initialize and redraw canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to logical size
        canvas.width = size.width;
        canvas.height = size.height;
        
        // Redraw all points
        if (dataSource) {
            dataSource.forEach(p => drawPoint(ctx, p));
        }
    }, [dataSource]);

    const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        if (!editable || !color) return;
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        // Calculate position relative to the canvas element
        // Since we rely on CSS transform for zoom, rect will be the zoomed size.
        // canvas.width is the unzoomed logical size (620).
        
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);
        
        onDraw({
            x, y, w: 1, h: 1, c: color
        });
    };

    const handleMouseMove = (e) => {
        const canvas = canvasRef.current;
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
            className="cursor-crosshair block react-zoom-pan-pinch-no-pan"
            style={{ 
                width: size.width + 'px', 
                height: size.height + 'px',
                imageRendering: 'pixelated' // Ensure crisp edges when zoomed
            }}
        />
    );
};

export default Canvas;
