"use client";

import React, { useEffect, useRef } from 'react';
import { CommentManager } from '@wiidede/comment-core-library';
import 'comment-core-library/dist/css/style.css'; 

const DanmakuPlayer = ({ children }: { children: React.ReactNode }) => {
    const stageRef = useRef<HTMLDivElement>(null); 
    const cmRef = useRef<any>(null);

    useEffect(() => {
        if (!stageRef.current) return;

        const cm = new CommentManager(stageRef.current);
        cm.init();
        cm.start();

        cm.setBounds();

        cmRef.current = cm;

        const handleResize = () => cm.setBounds();
        window.addEventListener('resize', handleResize);

        return () => {
            cm.stop();
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const sendTestComment = () => {
        if (cmRef.current) {
            cmRef.current.send({
                text: "这是一条测试弹幕 " + Math.random().toFixed(2),
                mode: 1, // 滚动模式
                size: 25,
                color: 0xffffff,
                dur: 4000
            });
        }
    };

    return (
        <div className="abp" style={{ 
            position: 'relative', 
            // width: '100%', 
            // height: '100%',
            overflow: 'hidden'
        }}>
            <div 
                ref={stageRef} 
                className="container !max-w-none " 
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 20
                }}
            />
            {children}
            {/* <button 
                onClick={sendTestComment} 
                style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 100 }}
            > 
                发送弹幕 
            </button> */}
        </div>
    );
};

export default DanmakuPlayer;