"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  ZoomIn,
  MapPin,
  Clock,
  LogIn,
  LogOut,
  PaintBucket,
} from "lucide-react";
import Canvas from "./Canvas";
import Dock from "./Dock";
import LoginModal from "./LoginModal";
import { getCasdoorSdk } from "@/lib/casdoor";
import { useRuntimeConfigContext } from "./RuntimeConfigProvider";
import { toast } from "sonner";
import { AppError, AppErrorCode } from "@/lib/err";
import GuideModal from "./GuideModal";
import { useBackpack } from "@/lib/use-backpack";
import { DrawRequestSchema } from "@/lib/schemas";
import { useSettingsConfigContext } from "./SettingsProvider";

let socket;

const Board = () => {
  const { config } = useRuntimeConfigContext();
  const [points, setPoints] = useState([]);
  const [colors, setColors] = useState([]);
  const [delay, setDelay] = useState(0);
  const [selectedColor, setSelectedColor] = useState("#000000");

  const [location, setLocation] = useState({ x: 0, y: 0 });
  const [ratio, setRatio] = useState(1);
  const [editable, setEditable] = useState(true);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [title, setTitle] = useState("Drawing Place");
  const {
    points: pointsLeft,
    nextRecoverIn,
    consumePoint,
    syncFromServer,
  } = useBackpack(
    config.DRAW_MAX_POINTS,
    config.DRAW_MAX_POINTS,
    config.DRAW_DELAY_MS,
  );
  const [token, setToken] = useState<string | null>(null);
  const { config: settingsConfig } = useSettingsConfigContext();
  const [isConnected, setIsConnected] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const isFetchingRef = useRef(false);
  const bufferRef = useRef<any[]>([]);

  useEffect(() => {
    setTitle(process.env.META_TITLE || document.title || "Drawing Place");
    if (!localStorage.getItem("opened_guide_modal")) {
      setShowGuideModal(true);
    }
    setToken(localStorage.getItem("draw_token") || "");
  }, []);

  // Initialize socket and load data
  useEffect(() => {
    if (token === null) return;

    setDelay(config.DRAW_DELAY_MS);

    // Check for user
    const storedUser = localStorage.getItem("casdoor_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Invalid user data");
      }
    }

    const fetchData = () => {
      isFetchingRef.current = true;
      bufferRef.current = [];
      fetch("/api/place")
        .then((res) => res.json())
        .then((res) => {
          if (res.status) {
            const buffered = bufferRef.current;
            setPoints([...res.data.points, ...buffered]);
            setColors(res.data.colors);
            setDelay(res.data.delay || config.DRAW_DELAY_MS);
          }
        })
        .finally(() => {
          isFetchingRef.current = false;
          bufferRef.current = [];
        });
    };

    // Load initial data
    fetchData();

    // Connect socket
    if (!token || token.length === 0) {
      console.error("No draw token found in localStorage");
    }

    socket = io({
      auth: {
        token: token,
      },
    });

    socket.on("connect", () => {
      console.log("Connected to socket");
      setIsConnected(true);
      fetchData();
    });

    socket.on("authenticated", () => {
      console.log("Authenticated");
      setIsValid(true);
    });

    socket.on("connect_error", (err) => {
      console.error("Connection error:", err);
      setIsConnected(false);
      setIsValid(false);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from socket");
      setIsConnected(false);
      setIsValid(false);
    });

    socket.on("draw", (data) => {
      if (isFetchingRef.current) {
        bufferRef.current.push(data);
      } else {
        setPoints((prev) => [...prev, data]);
      }
    });

    socket.on("sync", (data) => {
      syncFromServer(data.pointsLeft, data.lastUpdate);
      console.log("Synced from server", data);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [config.DRAW_DELAY_MS, syncFromServer, token]);

  const handleLogin = () => {
    const sdk = getCasdoorSdk();
    sdk.signin_redirect();
  };

  const handleLogout = () => {
    localStorage.removeItem("casdoor_user");
    localStorage.removeItem("casdoor_token");
    setUser(null);
    toast.info("已登出");
  };

  const handleDraw = useCallback(
    (params) => {
      const token = localStorage.getItem("draw_token") || "";
      if (!user || !token) {
        setShowLoginModal(true);
        return;
      }

      if (!editable || pointsLeft <= 0) return;

      const payload = {
        token: token,
        data: params,
      };

      const validation = DrawRequestSchema.safeParse(payload);
      if (!validation.success) {
        const errorMsg = validation.error.message || "Invalid draw request";
        toast.error(`验证失败: ${errorMsg}`);
        return;
      }

      // Emit to server with token and handle response
      socket.emit(
        "draw",
        payload,
        (result: AppError) => {
          if (result.code === AppErrorCode.Success) {
            // Success: Add point and start delay
            setPoints((prev) => [...prev, params]);
            consumePoint();
          } else if (result.code === AppErrorCode.InsufficientPoints) {
            // Handle rate limit countdown
            syncFromServer(
              result.pointsLeft || 0,
              result.lastUpdate || Date.now(),
            );
            toast.info(`请等待 ${Math.ceil(nextRecoverIn / 1000)}s 后再绘制`);
          } else {
            // Failed: Show error message or handle failure
            // Could add a toast notification here
            toast.error(`绘制失败：${result.message || "未知错误"}`);
          }
        },
      );
    },
    [
      editable,
      delay,
      user,
      pointsLeft,
      nextRecoverIn,
      consumePoint,
      config.DRAW_MAX_POINTS,
    ],
  );

  const handleMove = (loc) => {
    setLocation(loc);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Top Info Bar */}
      <div className="bg-card border-b p-3 flex justify-between items-center text-sm font-medium z-10 shrink-0 shadow-sm">
        <div className="hidden items-center gap-2 sm:flex">
          <ZoomIn className="w-4 h-4 text-muted-foreground" />
          <span>{Math.round(ratio * 100)}%</span>
        </div>
        <div className="flex items-center gap-2 min-w-[100px]">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span>
            ({location.x}, {location.y})
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-[100px]">
          <PaintBucket className="w-4 h-4 text-muted-foreground" />
          <span>
            {pointsLeft}/{config.DRAW_MAX_POINTS}{" "}
          </span>
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{Math.ceil(nextRecoverIn / 1000)}s</span>
        </div>
        <div className="flex items-center gap-2 ml-4 border-l pl-4">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
            title={isConnected ? "Connected" : "Disconnected"}
          />
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs truncate max-w-[100px]">
                {user.displayName || user.name || user.username}
              </span>
              <button
                onClick={handleLogout}
                title="Logout"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-1 text-primary hover:underline text-xs"
            >
              <LogIn className="w-4 h-4" />
              <span className="sm:block hidden">登录</span>
            </button>
          )}
        </div>
      </div>

      {/* Canvas Area - Flexible */}
      <div className="flex-1 overflow-hidden relative bg-muted/20 flex items-center justify-center">
        <TransformWrapper
          initialScale={1}
          minScale={0.3}
          maxScale={20}
          centerOnInit={true}
          smooth={false}
          wheel={{ step: ratio * 0.1, touchPadDisabled: false }}
          panning={{
            allowLeftClickPan: false,
            allowMiddleClickPan: true,
            allowRightClickPan: true,
          }} // Middle or Right click to pan
          onTransformed={(e) => setRatio(e.state.scale)}
          doubleClick={{ disabled: true }}
        >
          <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
            <div className="bg-background shadow-2xl border border-border">
              <Canvas
                dataSource={points}
                color={selectedColor}
                onMove={handleMove}
                onDraw={handleDraw}
                editable={pointsLeft > 0 && editable}
              />
              {settingsConfig.useOverlay &&
                <div
                  className={`h-[1px] w-[1px] pointer-events-none z-10 absolute animate-pulse ring-[0.1px] ring-black ring-offset-[0.1px]`}
                  style={{
                    left: location.x + 1,
                    top: location.y + 1,
                    backgroundColor: selectedColor || "transparent",
                  }}
                />}
            </div>
          </TransformComponent>
        </TransformWrapper>
        <LoginModal
          isOpen={showLoginModal}
          onClickBtn={handleLogin}
          onClose={() => setShowLoginModal(false)}
        />
        <GuideModal
          isOpen={showGuideModal}
          onClickBtn={() => {
            localStorage.setItem("opened_guide_modal", "true");
            setShowGuideModal(false);
          }}
          onClose={() => {
            localStorage.setItem("opened_guide_modal", "true");
            setShowGuideModal(false);
          }}
        />
      </div>

      {/* Bottom Control Area */}
      <div className="bg-card border-t p-4 z-10 shrink-0">
        <div className="flex flex-col items-center gap-4">
          <Dock
            dataSource={colors}
            onSelectColor={setSelectedColor}
            selectedColor={selectedColor}
            updateToken={setToken}
            isValid={isValid}
          />
          <div className="text-xs text-center flex flex-col">
            <span className="">{title}</span>
            <span className="text-muted-foreground">
              Made with ❤️ by ZAMBAR at GeekPie_
            </span>
            <div className="text-muted-foreground flex gap-3 pt-1 justify-center">
              <a
                href="#"
                className="underline hover:text-foreground"
                onClick={() => {
                  setShowGuideModal(true);
                }}
              >
                使用说明
              </a>
              <a
                href="https://github.com/HeZeBang/DrawingPlace"
                className="underline hover:text-foreground"
              >
                开放源代码
              </a>
              <a
                href="https://github.com/HeZeBang/DrawingPlace/issues"
                className="underline hover:text-foreground"
              >
                问题上报
              </a>
              <a
                href="https://join.geekpie.club/qq"
                className="underline hover:text-foreground"
              >
                加入 GeekPie_
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Board;
