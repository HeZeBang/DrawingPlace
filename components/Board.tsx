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
  Brush,
  View,
  Bot,
} from "lucide-react";
import Canvas, { CanvasRef } from "./Canvas";
import Dock from "./Dock";
import LoginModal from "./LoginModal";
import AutoDrawModal from "./AutoDrawModal";
import { getCasdoorSdk } from "@/lib/casdoor";
import { useRuntimeConfigContext } from "./RuntimeConfigProvider";
import { toast } from "sonner";
import { AppError, AppErrorCode } from "@/lib/err";
import GuideModal from "./GuideModal";
import { useBackpack } from "@/lib/use-backpack";
import { DrawRequestSchema } from "@/lib/schemas";
import { useSettingsConfigContext } from "./SettingsProvider";
import { ViewMode } from "@/lib/frontend-settings";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import AnnounceModal from "./AnnounceModal";

const Board = () => {
  const { config } = useRuntimeConfigContext();
  const pointsRef = useRef<any[]>([]);
  const canvasRef = useRef<CanvasRef>(null);
  const [colors, setColors] = useState([]);
  const [delay, setDelay] = useState(0);
  const [selectedColor, setSelectedColor] = useState("#000000");

  const [location, setLocation] = useState({ x: 0, y: 0 });
  const [ratio, setRatio] = useState(1);
  const [editable, setEditable] = useState(true);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showAnnounce, setShowAnnounce] = useState(false);
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
  const {
    config: settingsConfig,
    updateConfig: updateSettingsConfig,
    status: statusConfig,
    updateStatus: updateStatusConfig,
  } = useSettingsConfigContext();
  const isFetchingRef = useRef(false);
  const bufferRef = useRef<any[]>([]);
  const socketRef = useRef(null);

  useEffect(() => {
    setTitle(process.env.META_TITLE || document.title || "Drawing Place");
    if (settingsConfig.showGuideOnLoad) {
      setShowGuideModal(true);
    }
    if (settingsConfig.announcementVersion !== process.env.NEXT_PUBLIC_APP_VERSION) {
      setShowAnnounce(true);
      // updateSettingsConfig({ announcementVersion: process.env.NEXT_PUBLIC_ANNOUNCEMENT_VERSION || "" });
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

      const fetchPromise = fetch("/api/place")
        .then((res) => res.json())
        .then((res) => {
          if (res.status) {
            const buffered = bufferRef.current;
            const newPoints = [...res.data.points, ...buffered];
            pointsRef.current = newPoints;
            canvasRef.current?.init(newPoints);
            setColors(res.data.colors);
            setDelay(res.data.delay || config.DRAW_DELAY_MS);
            return { pointCount: newPoints.length };
          }
          throw new Error("Failed to fetch data");
        })
        .finally(() => {
          isFetchingRef.current = false;
          bufferRef.current = [];
        });

      toast.promise(fetchPromise, {
        loading: "加载画板数据中...",
        success: (data) => `已加载 ${data.pointCount} 个绘制点`,
        error: "画板数据加载失败",
      });
    };

    // Load initial data
    fetchData();

    // Connect socket
    if (!token || token.length === 0) {
      console.error("No draw token found in localStorage");
    }

    // 如果已经有连接，先断开（防止热重载或依赖变化时的重复连接）
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const newSocket = io({
      auth: {
        token: token,
      },
      transports: ["websocket"],
      reconnectionDelay: 1000,
    });

    // 将实例保存到 ref 中供其他地方使用
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      console.log("Connected to socket", {
        socketId: newSocket.id,
        connected: newSocket.connected,
        transport: newSocket.io.engine.transport.name,
      });
      // toast.success("已连接到服务器");
      updateStatusConfig({ isConnected: true });
      fetchData();
    });

    newSocket.on("authenticated", (data) => {
      console.log("Authenticated with token", data);
      updateStatusConfig({ isTokenValid: true });

      // 同步服务器返回的 points 和 lastUpdate
      if (data.pointsLeft !== undefined && data.lastUpdate !== undefined) {
        syncFromServer(data.pointsLeft, data.lastUpdate);
        console.log("Synced points on authentication", {
          pointsLeft: data.pointsLeft,
          lastUpdate: data.lastUpdate,
        });
      }
    });

    newSocket.on("connect_error", (err) => {
      console.error("Connection error:", {
        message: err.message,
        socketId: newSocket.id,
      });
      updateStatusConfig({ isConnected: false, isTokenValid: false });
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected from socket", { reason });
      toast.error("与服务器的连接已断开");
      updateStatusConfig({ isConnected: false });
    });

    newSocket.on("onlineClientsUpdated", (data) => {
      console.log("Current connected clients:", data.count);
      updateStatusConfig({ onlineClients: data.count });
    });

    newSocket.on("draw", (data) => {
      if (isFetchingRef.current) {
        bufferRef.current.push(data);
      } else {
        pointsRef.current.push(data);
        canvasRef.current?.drawPoint(data);
      }
    });

    newSocket.on("sync", (data) => {
      syncFromServer(data.pointsLeft, data.lastUpdate);
      console.log("Synced from server", data);
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
        if (socketRef.current === newSocket) {
          socketRef.current = null;
        }
      }
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
    (params): Promise<{ success: boolean; nextRecoverIn?: number }> => {
      return new Promise((resolve) => {
        const token = localStorage.getItem("draw_token") || "";
        if (!user || !token) {
          setShowLoginModal(true);
          resolve({ success: false });
          return;
        }

        if (!editable || pointsLeft <= 0) {
          resolve({ success: false, nextRecoverIn });
          return;
        }

        if (!socketRef.current || !socketRef.current.connected) {
          console.warn("Socket not connected", {
            connected: socketRef.current?.connected,
            socketId: socketRef.current?.id,
            readyState: socketRef.current?.io.engine.readyState,
          });
          toast.error("未连接到服务器，正在重连...");
          resolve({ success: false, nextRecoverIn });
          return;
        }

        const payload = {
          token: token,
          data: params,
        };

        const validation = DrawRequestSchema.safeParse(payload);
        if (!validation.success) {
          const errorMsg = validation.error.message || "Invalid draw request";
          toast.error(`验证失败: ${errorMsg}`);
          resolve({ success: false });
          return;
        }

        // Emit to server with token and handle response
        socketRef.current?.emit("draw", payload, (result: AppError) => {
          console.log("Draw response received", {
            code: result.code,
            message: result.message,
            pointsLeft: result.pointsLeft,
          });

          if (result.code === AppErrorCode.Success) {
            // Success: Add point and sync from server
            pointsRef.current.push(params);
            canvasRef.current?.drawPoint(params);
            // Always sync from server to avoid conflicts
            if (
              result.pointsLeft !== undefined &&
              result.lastUpdate !== undefined
            ) {
              syncFromServer(result.pointsLeft, result.lastUpdate);
            }
            resolve({ success: true });
          } else if (result.code === AppErrorCode.InsufficientPoints) {
            // Handle rate limit countdown
            syncFromServer(
              result.pointsLeft || 0,
              result.lastUpdate || Date.now(),
            );
            toast.info(`请等待 ${Math.ceil(nextRecoverIn / 1000)}s 后再绘制`);
            resolve({ success: false, nextRecoverIn });
          } else if (result.code === AppErrorCode.InvalidToken) {
            toast.error("Token 已经失效，请刷新");
            updateStatusConfig({ isTokenValid: false });
            resolve({ success: false });
          } else {
            // Failed: Show error message or handle failure
            // Could add a toast notification here
            toast.error(`绘制失败：${result.message || "未知错误"}`);
            resolve({ success: false });
          }
        });
      });
    },
    [
      editable,
      delay,
      user,
      pointsLeft,
      nextRecoverIn,
      consumePoint,
      config.DRAW_MAX_POINTS,
      syncFromServer,
    ],
  );

  const handleAutoDraw = useCallback(
    (params): Promise<{ success: boolean; nextRecoverIn?: number }> => {
      return new Promise((resolve) => {
        const token = localStorage.getItem("draw_token") || "";
        if (!token) {
          resolve({ success: false, nextRecoverIn: 1000 });
          return;
        }

        if (!editable || pointsLeft <= 0) {
          resolve({ success: false, nextRecoverIn });
          return;
        }

        // 检查连接状态
        if (!socketRef.current || !socketRef.current.connected) {
          console.warn("Socket not connected during AutoDraw", {
            connected: socketRef.current?.connected,
            socketId: socketRef.current?.id,
          });
          resolve({ success: false, nextRecoverIn: 1000 });
          return;
        }

        const payload = {
          token: token,
          data: params,
        };

        const validation = DrawRequestSchema.safeParse(payload);
        if (!validation.success) {
          const errorMsg = validation.error.message || "Invalid draw request";
          resolve({ success: false });
          return;
        }

        // Emit to server with token and handle response
        socketRef.current.emit("draw", payload, (result: AppError) => {
          console.log("AutoDraw response received", {
            code: result.code,
            message: result.message,
            pointsLeft: result.pointsLeft,
          });

          if (result.code === AppErrorCode.Success) {
            // Success: Add point and sync from server
            pointsRef.current.push(params);
            canvasRef.current?.drawPoint(params);
            // Always sync from server to avoid conflicts
            if (
              result.pointsLeft !== undefined &&
              result.lastUpdate !== undefined
            ) {
              syncFromServer(result.pointsLeft, result.lastUpdate);
            }
            resolve({ success: true });
          } else if (result.code === AppErrorCode.InsufficientPoints) {
            // Handle rate limit countdown
            syncFromServer(
              result.pointsLeft || 0,
              result.lastUpdate || Date.now(),
            );
            resolve({ success: false, nextRecoverIn });
          } else if (result.code === AppErrorCode.InvalidToken) {
            toast.error("Token 已经失效，请刷新");
            updateStatusConfig({ isTokenValid: false });
            resolve({ success: false });
          } else {
            // Failed: Show error message or handle failure
            // Could add a toast notification here
            toast.error(`绘制失败：${result.message || "未知错误"}`);
            resolve({ success: false });
          }
        });
      });
    },
    [
      editable,
      delay,
      pointsLeft,
      nextRecoverIn,
      consumePoint,
      config.DRAW_MAX_POINTS,
      syncFromServer,
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
            className={`w-2 h-2 rounded-full ${statusConfig.isConnected ? "bg-green-500" : "bg-red-500"}`}
            title={statusConfig.isConnected ? "Connected" : "Disconnected"}
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
            allowLeftClickPan: editable ? false : true,
            allowMiddleClickPan: true,
            allowRightClickPan: true,
          }} // Middle or Right click to pan
          onTransformed={(e) => setRatio(e.state.scale)}
          doubleClick={{ disabled: true }}
        >
          <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
            <div
              className="bg-background shadow-2xl border border-border"
              style={{
                backgroundImage:
                  statusConfig.currentViewMode !== ViewMode.CanvasOnly
                    ? `url(/map.png)`
                    : undefined,
                imageRendering: ratio > 1 ? "pixelated" : "auto",
              }}
            >
              <Canvas
                ref={canvasRef}
                color={selectedColor}
                onMove={handleMove}
                onDraw={handleDraw}
                editable={pointsLeft > 0 && editable}
                opacity={
                  statusConfig.currentViewMode !== ViewMode.MapOnly ? "1" : "0"
                }
              />
              {settingsConfig.useOverlay && (
                <div
                  className={cn(
                    "h-[1px] w-[1px] pointer-events-none z-10 absolute ring-[0.1px] ring-black ring-offset-[0.1px]",
                    editable ? "animate-pulse" : "opacity-50",
                  )}
                  style={{
                    left: location.x + 1,
                    top: location.y + 1,
                    backgroundColor:
                      (editable && selectedColor) || "transparent",
                  }}
                />
              )}
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
            updateSettingsConfig({ showGuideOnLoad: false });
            setShowGuideModal(false);
          }}
          onClose={() => {
            updateSettingsConfig({ showGuideOnLoad: false });
            setShowGuideModal(false);
          }}
        />
        <AnnounceModal
          isOpen={showAnnounce}
          onClickBtn={() => {
            updateSettingsConfig({ announcementVersion: process.env.NEXT_PUBLIC_APP_VERSION || "" });
            setShowAnnounce(false);
          }}
          onClose={() => {
            updateSettingsConfig({ announcementVersion: process.env.NEXT_PUBLIC_APP_VERSION || "" });
            setShowAnnounce(false);
          }}
        />
        <div className="absolute bottom-4 mx-auto flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-fit h-8 rounded-full px-3 border-none transition-all duration-500",
              editable ? "" : "opacity-30",
              "hover:opacity-100 delay-1000 hover:delay-0",
            )}
            onClick={() => {
              setEditable((val) => !val);
            }}
          >
            {editable ? (
              <Brush className="h-4 w-4" />
            ) : (
              <View className="h-4 w-4" />
            )}
            {editable ? (
              <span className="">绘制模式</span>
            ) : (
              <span className="">浏览模式</span>
            )}
          </Button>
        </div>
      </div>

      {/* Bottom Control Area */}
      <div className="bg-card border-t p-4 z-10 shrink-0">
        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              "transition-all ease-in-out duration-500 overflow-hidden",
              editable ? "max-h-60" : "max-h-0",
            )}
          >
            <Dock
              dataSource={colors}
              onSelectColor={setSelectedColor}
              selectedColor={selectedColor}
              updateToken={setToken}
              handleDraw={handleAutoDraw}
            />
          </div>
          <div className="text-xs text-center flex flex-col">
            <span className="">
              {title} v{process.env.NEXT_PUBLIC_APP_VERSION}
            </span>
            <span className="text-muted-foreground">
              Made with ❤️ by{" "}
              <a
                href="https://github.com/HeZeBang"
                className="underline hover:text-foreground"
              >
                ZAMBAR
              </a>{" "}
              at{" "}
              <a
                href="https://geekpie.club"
                className="underline hover:text-foreground"
              >
                GeekPie
              </a>
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
                href="#"
                className="underline hover:text-foreground"
                onClick={() => {
                  setShowAnnounce(true);
                }}
              >
                更新公告
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
                加入 GeekPie
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Board;
