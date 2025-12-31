"use client";

import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { CommentManager } from "@wiidede/comment-core-library";
import io, { Socket } from "socket.io-client";
import confetti from "canvas-confetti";
import "comment-core-library/dist/css/style.css";
import { useSettingsConfigContext } from "./SettingsProvider";
import { useRuntimeConfigContext } from "./RuntimeConfigProvider";
import { toast } from "sonner";

export interface RawDanmakuData {
  id?: number;
  text: string;
  mode: number;
  size: number;
  color: number;
  time: number;
  dur?: number;
  addons?: Record<string, any>;
}

export interface DanmakuHandle {
  send: (data: any) => void;
}

interface DanmakuPlayerProps {
  children: React.ReactNode;
  activityId?: string;
  tokenName?: string;
  token?: string;
  rootPath?: string;
  socketPath?: string;
}

const DanmakuPlayer = forwardRef<DanmakuHandle, { children: React.ReactNode }>(
  ({ children }, ref) => {
    const stageRef = useRef<HTMLDivElement>(null);
    const cmRef = useRef<any>(null);
    const socketRef = useRef<Socket | null>(null);
    const { config, updateStatus } = useSettingsConfigContext();
    const { config: runtimeConfig } = useRuntimeConfigContext();

    const activityId = runtimeConfig.DANMAKU_ACTIVITY_ID;
    const tokenName = runtimeConfig.DANMAKU_TOKEN_NAME;
    const token = runtimeConfig.DANMAKU_TOKEN;
    const rootPath = runtimeConfig.DANMAKU_ROOT_PATH;
    const socketPath = runtimeConfig.DANMAKU_SOCKET_PATH;

    useImperativeHandle(ref, () => ({
      send: (data: any) => {
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit("push", data);
        } else {
          // toast.error("弹幕服务未连接");
        }
      },
    }));

    useEffect(() => {
      if (!stageRef.current) return;

      const cm = new CommentManager(stageRef.current);
      cm.init();
      cm.start();

      // 动态调整弹幕缩放比例，基于屏幕宽度
      // cm.options.scroll.scale = Math.round(document.body.clientWidth / 500);

      cm.setBounds();
      cmRef.current = cm;

      const handleResize = () => cm.setBounds();
      window.addEventListener("resize", handleResize);

      return () => {
        cm.stop();
        window.removeEventListener("resize", handleResize);
      };
    }, []);

    // Socket connection
    useEffect(() => {
      if (!activityId || !rootPath) {
        return;
      }

      // 注意：Namespace 是 /danmaku
      const socket = io(`${rootPath}/danmaku`, {
        path: socketPath,
        query: {
          activity: activityId,
          tokenName: tokenName,
          token: token,
        },
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => {
        console.log(`已连接到弹幕服务器 (Activity: ${activityId})`);
        // toast.info("已连接到弹幕服务器");
        updateStatus({ isDanmakuConnected: true });
      });

      socket.on("disconnect", () => {
        console.log("与弹幕服务器断开连接");
        toast.warning("与弹幕服务器断开连接");
        updateStatus({ isDanmakuConnected: false });
      });

      socket.on("danmaku", (data: RawDanmakuData) => {
        console.log("收到弹幕:", data);

        if (data.text.includes("🎆")) {
          {
            const duration = 5 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = {
              startVelocity: 30,
              spread: 360,
              ticks: 60,
              zIndex: 0,
            };

            const randomInRange = (min: number, max: number) =>
              Math.random() * (max - min) + min;

            const interval = window.setInterval(() => {
              const timeLeft = animationEnd - Date.now();

              if (timeLeft <= 0) {
                return clearInterval(interval);
              }

              const particleCount = 50 * (timeLeft / duration);
              confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
              });
              confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
              });
            }, 250);
          }
        }

        if (cmRef.current) {
          cmRef.current.send({
            text: data.text,
            mode: data.mode,
            size: data.size,
            color: data.color,
            dur: data.dur * 2,
            stime: data.time,
            shadow: data.color === 0xffffff,
            ...data.addons,
          });
        }
      });

      socketRef.current = socket;

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          updateStatus({ isDanmakuConnected: false });
        }
      };
    }, [activityId, tokenName, token, rootPath, socketPath]);

    const sendTestComment = () => {
      if (cmRef.current) {
        cmRef.current.send({
          text: "这是一条测试弹幕 " + Math.random().toFixed(2),
          mode: 1, // 滚动模式
          size: 25,
          color: 0xffffff,
          dur: 4000,
        });
      }
    };

    return (
      <div
        className="abp"
        style={{
          position: "relative",
          // width: '100%',
          // height: '100%',
          overflow: "hidden",
        }}
      >
        <div
          ref={stageRef}
          className="container !max-w-none "
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 20,
            visibility: config.enableDanmaku ? "visible" : "hidden",
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
  },
);

export default DanmakuPlayer;
