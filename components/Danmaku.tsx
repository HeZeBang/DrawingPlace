"use client";

import React, { useEffect, useRef } from 'react';
// 确保包名和路径正确。如果是原生 CCL，路径通常是 'comment-core-library/dist/style.css'
import { CommentManager } from '@wiidede/comment-core-library';
import 'comment-core-library/dist/css/style.css'; 

const DanmakuPlayer = ({ children }: { children: React.ReactNode }) => {
    const stageRef = useRef<HTMLDivElement>(null); 
    const cmRef = useRef<any>(null);

    useEffect(() => {
        if (!stageRef.current) return;

        // 1. 初始化管理器
        const cm = new CommentManager(stageRef.current);
        cm.init();
        cm.start();

        // 2. 这里的逻辑很重要：如果容器初始宽度是 0，CCL 会出 Bug
        // 使用 setTimeout 确保在 DOM 渲染完成后计算边界
        // const timer = setTimeout(() => {
            cm.setBounds();
        // }, 100);

        cmRef.current = cm;

        const handleResize = () => cm.setBounds();
        window.addEventListener('resize', handleResize);

        return () => {
            // clearTimeout(timer);
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
        /* 1. 外层必须加 abp 类名，因为 CCL 的 CSS 很多是 .abp .container ... */
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