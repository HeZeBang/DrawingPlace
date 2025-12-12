"use client";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ColorPicker } from "@/components/ui/color-picker";
import { Button } from "@/components/ui/button";
import { Paintbrush, Palette } from "lucide-react";
import { Input } from "./ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRuntimeConfigContext } from "./RuntimeConfigProvider";
import { toast } from "sonner";

const Dock = ({ dataSource, onSelectColor, selectedColor, updateToken, isValid }) => {
  const { config } = useRuntimeConfigContext();
  if (!dataSource) return null;
  const [token, setToken] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem("draw_token") || "");
    setIsLoggedIn(!!localStorage.getItem("casdoor_token"));
  }, []);

  return (
    <div
      className={`flex flex-wrap gap-2 justify-center items-center max-w-[${config.CANVAS_WIDTH}px] mx-auto p-2 bg-card rounded-xl border shadow-sm`}
    >
      {dataSource.map((color) => (
        <Button
          key={color}
          className={cn(
            "hidden sm:block w-8 h-8 rounded-full border-none transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            selectedColor === "#" + color
              ? "border-primary scale-110 ring-2 ring-ring ring-offset-2"
              : "border-transparent",
          )}
          style={{ backgroundColor: "#" + color }}
          onClick={() => onSelectColor("#" + color)}
          aria-label={`Select color #${color}`}
        />
      ))}

      <Button
        key={`cur_${selectedColor}`}
        className={cn(
          "w-8 h-8 rounded-full border-none sm:hidden transition-all border cursor-default",
        )}
        style={{ backgroundColor: selectedColor }}
        aria-label={`Select color ${selectedColor}`}
      />

      <div className="w-px h-8 bg-border mx-2" />

      <ColorPicker
        value={selectedColor || "#000000"}
        // swatches={dataSource.map((color) => "#" + color)}
        onValueChange={(color) => onSelectColor(color.hex)}
      >
        <Button
          variant="outline"
          size="icon"
          className={cn(
            `w-8 h-8 rounded-full p-0 border-none`,
            selectedColor &&
              !dataSource.includes(selectedColor.replace("#", "")) &&
              "ring-2 ring-ring ring-offset-2",
          )}
          style={{
            backgroundColor:
              selectedColor &&
              !dataSource.includes(selectedColor.replace("#", ""))
                ? selectedColor
                : undefined,
          }}
        >
          {(!selectedColor ||
            dataSource.includes(selectedColor.replace("#", ""))) && (
            <Palette className="h-4 w-4" />
          )}
        </Button>
      </ColorPicker>

      <div className="w-px h-8 bg-border mx-2" />

      <div className="flex gap-2">
        <Input
          placeholder="当前 Token"
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
          }}
          onBlur={() => {
            updateToken(token);
            localStorage.setItem("draw_token", token);
          }}
          className={cn("transition-all", isValid ? "border-green-500" : "border-red-500")}
          disabled={isFetching}
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={isFetching || !isLoggedIn}>
              {isLoggedIn ? "刷新" : "请先登录"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认刷新 Token?</AlertDialogTitle>
              <AlertDialogDescription>
                请注意，一个账号只能拥有一个 token，刷新后之前的 token 将失效！
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  // Exchange for Draw Token
                  setIsFetching(true);
                  fetch("/api/auth/exchange", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      token: localStorage.getItem("casdoor_token"),
                    }),
                  })
                    .then((res) => {
                      if (res.ok) return res.json();
                      else
                        throw new Error(
                          `HTTP ${res.status} - ${res.statusText}`,
                        );
                    })
                    .then((data) => {
                      if (data.token) {
                        console.log("Draw token received", data.token);
                        setToken(data.token);
                        updateToken(data.token);
                        localStorage.setItem("draw_token", data.token);
                      }
                    })
                    .then(() => {
                      toast.info("Token 刷新成功");
                    })
                    .catch((error: Error) => {
                      toast.error(`Token 刷新失败: ${error.message}`);
                    })
                    .finally(() => {
                      setIsFetching(false);
                    });
                }}
              >
                继续
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Dock;
