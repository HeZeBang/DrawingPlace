'use client';
import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, MapPin, Clock, LogIn, LogOut } from 'lucide-react';
import Canvas from './Canvas';
import Plate from './Plate';
import LoginModal from './LoginModal';
import { getCasdoorSdk } from '@/lib/casdoor';
import { toast } from 'sonner';

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
    const [user, setUser] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    
    // Initialize socket and load data
    useEffect(() => {
        // Check for user
        const storedUser = localStorage.getItem('casdoor_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Invalid user data');
            }
        }

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
        const token = localStorage.getItem('draw_token');
        socket = io({
            auth: {
                token: token
            }
        });

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

    const handleLogin = () => {
        const sdk = getCasdoorSdk();
        sdk.signin_redirect();
    };

    const handleLogout = () => {
        localStorage.removeItem('casdoor_user');
        localStorage.removeItem('casdoor_token');
        setUser(null);
        toast.info('已登出');
    };

    const handleDraw = useCallback((params) => {
        const token = localStorage.getItem('draw_token');
        if (!user || !token) {
            setShowLoginModal(true);
            return;
        }

        if (!editable) return;

        // Emit to server with token and handle response
        socket.emit('draw', {
            token: token,
            data: params
        }, (result: number) => {
            if (result === 0) {
                // Success: Add point and start delay
                setPoints(prev => [...prev, params]);
                setEditable(false);
                setCountdown(delay);
            } else if (result > 0) {
                // Handle rate limit countdown
                setCountdown(result);
                setEditable(false);
            } else {
                // Failed: Show error message or handle failure
                console.warn('Token not valid, result:', result);
                // Could add a toast notification here
                alert('Token not valid. Server returned error code: ' + result);
            }
        });
        
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

    }, [editable, delay, user]);

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
                <div className="flex items-center gap-2 ml-4 border-l pl-4">
                    {user ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs truncate max-w-[100px]">{user.displayName || user.name || user.username}</span>
                            <button onClick={handleLogout} title="Logout" className="text-muted-foreground hover:text-foreground">
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleLogin} className="flex items-center gap-1 text-primary hover:underline text-xs">
                            <LogIn className="w-4 h-4" />
                            <span>登录</span>
                        </button>
                    )}
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
                    panning={{ allowLeftClickPan: false, allowMiddleClickPan: true, allowRightClickPan: true }} // Middle or Right click to pan
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
                <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
            </div>

            {/* Bottom Control Area */}
            <div className="bg-card border-t p-4 z-10 shrink-0">
                <div className="flex flex-col items-center gap-4">
                    <Plate 
                        dataSource={colors} 
                        onSelectColor={setSelectedColor} 
                        selectedColor={selectedColor}
                    />
                    <div className="text-xs text-center">
                        <span className='pb-1'>GeekPie_ 秋日绘版简易教程</span>
                        <div className="text-muted-foreground text-xs text-center flex gap-4">
                            <span>1. 调色盘中选择颜色，点击即可绘制1个像素点。</span>
                            <span>2. Ctrl + 滚轮/双指捏合实现缩放</span>
                            <span>3. 中键和右键/手指拖动实现平移</span>
                            <span>4. 每个 token 每次绘制有 {delay}s 冷却时间，快来创作吧！</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Board;
