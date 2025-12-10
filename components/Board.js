'use client';
import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, MapPin, Clock } from 'lucide-react';
import Canvas from './Canvas';
import Plate from './Plate';

let socket;

const Board = () => {
    const [points, setPoints] = useState([]);
    const [colors, setColors] = useState([]);
    const [delay, setDelay] = useState(0);
    const [selectedColor, setSelectedColor] = useState(null);
    
    const [location, setLocation] = useState({ x: 0, y: 0 });
    const [ratio, setRatio] = useState(1);
    const [editable, setEditable] = useState(true);
    const [countdown, setCountdown] = useState(0);
    
    // Initialize socket and load data
    useEffect(() => {
        // Load initial data
        fetch('/api/place')
            .then(res => res.json())
            .then(res => {
                if (res.status) {
                    setPoints(res.data.points);
                    setColors(res.data.colors);
                    setDelay(res.data.delay);
                }
            });

        // Connect socket
        // We need to connect to the same host
        socket = io();

        socket.on('connect', () => {
            console.log('Connected to socket');
        });

        socket.on('draw', (data) => {
            setPoints(prev => [...prev, data]);
        });

        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

    const handleDraw = useCallback((params) => {
        if (!editable) return;

        // Optimistic update
        setPoints(prev => [...prev, params]);
        
        // Emit to server
        socket.emit('draw', {
            user: { username: 'anonymous' }, // Replace with real user if auth implemented
            data: params
        });

        // Start delay
        setEditable(false);
        setCountdown(delay);
        
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setEditable(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

    }, [editable, delay]);

    const handleMove = (loc) => {
        setLocation(loc);
    };

    return (
        <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
            {/* Top Info Bar */}
            <div className="bg-card border-b p-3 flex justify-between items-center text-sm font-medium z-10 shrink-0 shadow-sm">
                <div className="flex items-center gap-2">
                    <ZoomIn className="w-4 h-4 text-muted-foreground" />
                    <span>{Math.round(ratio * 100)}%</span>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>({location.x}, {location.y})</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className={countdown > 0 ? "text-destructive font-bold" : "text-muted-foreground"}>
                        {countdown > 0 ? `${countdown}s` : 'Ready'}
                    </span>
                </div>
            </div>

            {/* Canvas Area - Flexible */}
            <div className="flex-1 overflow-hidden relative bg-muted/20 flex items-center justify-center">
                <TransformWrapper
                    initialScale={1}
                    minScale={1}
                    maxScale={20}
                    centerOnInit={true}
                    wheel={{ step: 0.1, activationKeys: ['Control'] }}
                    panning={{ mouseButtons: [1, 2] }} // Middle or Right click to pan
                    onTransformed={(e) => setRatio(e.state.scale)}
                    doubleClick={{ disabled: true }}
                >
                    <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                        <div className="bg-background shadow-2xl border border-border">
                            <Canvas
                                dataSource={points}
                                color={selectedColor}
                                onMove={handleMove}
                                onDraw={handleDraw}
                                editable={editable}
                            />
                        </div>
                    </TransformComponent>
                </TransformWrapper>
            </div>

            {/* Bottom Control Area */}
            <div className="bg-card border-t p-4 z-10 shrink-0">
                <div className="flex flex-col items-center gap-4">
                    <Plate 
                        dataSource={colors} 
                        onSelectColor={setSelectedColor} 
                        selectedColor={selectedColor}
                    />
                    <div className="text-muted-foreground text-xs text-center flex gap-4">
                        <span>1. Select color & click to draw</span>
                        <span>2. Ctrl + Scroll to zoom</span>
                        <span>3. Middle/Right Click to Pan</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Board;
