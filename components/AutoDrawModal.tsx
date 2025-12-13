"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import InputPicture from "./ui/drop-zone";
import { useSettingsConfigContext } from "./SettingsProvider";
import { useRuntimeConfigContext } from "./RuntimeConfigProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { extractPixels, AutoDrawPixel } from "@/lib/auto-draw";
import { AutoDrawProgress } from "./AutoDrawProgress";
import { BotOff } from "lucide-react";

const AutoDrawModal = ({
  children,
  handleDraw,
}: {
  children: React.ReactNode;
  handleDraw: (params: any) => Promise<{ success: boolean; nextRecoverIn?: number }>;
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [originalPictureUrl, setOriginalPictureUrl] = useState<string | null>(null);
  const { config: runtimeConfig } = useRuntimeConfigContext();
  const { config, updateConfig } = useSettingsConfigContext();
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [pixels, setPixels] = useState<AutoDrawPixel[]>([]);
  const [eta, setEta] = useState(0);

  // Load saved coords
  useEffect(() => {
    if (config.xAutoDraw >= 0) setStartX(config.xAutoDraw);
    if (config.yAutoDraw >= 0) setStartY(config.yAutoDraw);
  }, [config.xAutoDraw, config.yAutoDraw]);

  // Auto draw loop
  useEffect(() => {
    if (!config.startAutoDraw) return;

    let isCancelled = false;

    const run = async () => {
      let currentPixels = pixels;

      // Load pixels if needed (or reload if data changed)
      if ((currentPixels.length === 0 || config.progressAutoDraw === 0) && config.dataAutoDraw) {
        try {
          currentPixels = await extractPixels(config.dataAutoDraw, config.xAutoDraw, config.yAutoDraw);
          setPixels(currentPixels);
        } catch (e) {
          console.error("Failed to extract pixels", e);
          toast.error("无法解析图片数据");
          updateConfig({ startAutoDraw: false });
          return;
        }
      }

      if (currentPixels.length === 0) {
        updateConfig({ startAutoDraw: false });
        return;
      }

      let index = config.progressAutoDraw || 0;

      while (index < currentPixels.length && !isCancelled) {
        const p = currentPixels[index];

        // Update ETA
        const remaining = currentPixels.length - index;
        setEta(remaining * 0.25); // 0.25s per pixel conservative estimate

        const result = await handleDraw({ x: p.x, y: p.y, w: 1, h: 1, c: p.c });

        if (result.success) {
          index++;
          updateConfig({ progressAutoDraw: index });
          // Small delay to prevent UI freeze and allow socket events to process
          await new Promise((r) => setTimeout(r, 20));
        } else {
          if (result.nextRecoverIn && result.nextRecoverIn > 0) {
            // Wait for the full recovery time + buffer
            const waitTime = result.nextRecoverIn + 500;
            console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
            await new Promise((r) => setTimeout(r, waitTime));
          } else {
            // Error, wait and retry
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
      }

      if (index >= currentPixels.length && !isCancelled) {
        updateConfig({ startAutoDraw: false, progressAutoDraw: 0 });
        toast.success("自动绘图完成！");
        setPixels([]);
      }
    };

    run();

    return () => {
      isCancelled = true;
    };
  }, [config.startAutoDraw, config.dataAutoDraw, config.xAutoDraw, config.yAutoDraw]);

  const handleStart = async () => {
    if (!originalPictureUrl) {
      toast.error("请先上传图片");
      return;
    }

    // Validate bounds
    const img = new Image();
    img.src = originalPictureUrl;
    await new Promise((r) => (img.onload = r));

    const endX = startX + img.width;
    const endY = startY + img.height;

    if (startX < 0 || startY < 0 || endX > runtimeConfig.CANVAS_WIDTH || endY > runtimeConfig.CANVAS_HEIGHT) {
      toast.error(`图片超出画布范围 (${runtimeConfig.CANVAS_WIDTH}x${runtimeConfig.CANVAS_HEIGHT})`);
      return;
    }

    // Save config and start
    updateConfig({
      startAutoDraw: true,
      xAutoDraw: startX,
      yAutoDraw: startY,
      dataAutoDraw: originalPictureUrl,
      progressAutoDraw: 0,
    });

    // Force reload pixels on new draw
    setPixels([]);

    setIsOpen(false);
    toast.success("自动绘图已启动");
  };

  const content = (
    <div className="space-y-4">
      <InputPicture setPictureUrl={setOriginalPictureUrl} />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>起始 X 坐标</Label>
          <Input
            type="number"
            value={startX}
            onChange={(e) => setStartX(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>起始 Y 坐标</Label>
          <Input
            type="number"
            value={startY}
            onChange={(e) => setStartY(Number(e.target.value))}
          />
        </div>
      </div>
      <Button className="w-full" onClick={handleStart}>开始绘图</Button>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      {isDesktop ? (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>{!config.startAutoDraw && children}</DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>自动绘图</DialogTitle>
              <DialogDescription>
                上传图片并指定起点，系统将自动绘制。（官方外挂）
                <br/>
                由于资源有限，官方自动绘图只支持小规模图片 + 单 Token 绘图。
                <br/>
                如需更多自定义，可以组队或自行编写脚本！
              </DialogDescription>
            </DialogHeader>
            {content}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>{!config.startAutoDraw && children}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>自动绘图</DrawerTitle>
              <DrawerDescription>
                上传图片并指定起点，系统将自动绘制。（官方外挂）
                <br/>
                由于资源有限，官方自动绘图只支持小规模图片 + 单 Token 绘图。
                <br/>
                如需更多自定义，可以组队或自行编写脚本！
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4">{content}</div>
            <DrawerFooter className="pt-2">
              <DrawerClose asChild>
                <Button variant="outline">取消</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {config.startAutoDraw && (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
          {isDesktop ? (
            <>
              <AutoDrawProgress
                current={config.progressAutoDraw || 0}
                total={pixels.length || 1}
                etaSeconds={eta}
              />
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-destructive/20 hover:text-destructive"
                onClick={() => updateConfig({ startAutoDraw: false })}
                title="停止自动绘图"
              >
                <span className="sr-only">停止</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M9 9h6v6H9z" /></svg>
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="h-8 px-3 rounded-full hover:bg-destructive/20 hover:text-destructive"
              onClick={() => updateConfig({ startAutoDraw: false })}
              title="停止自动绘图"
            >
              <BotOff className="h-4 w-4 mr-2" />
              <span>{config.progressAutoDraw || 0} / {pixels.length || 1}</span>
            </Button>
          )}

        </div>
      )}
    </div>
  );
};

export default AutoDrawModal;
