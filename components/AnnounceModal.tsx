"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
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

const AnnounceContent = () => {
  return (
    <div className="prose p-4 leading-tight prose-sm">
      <p>
        大家好！我们很高兴地宣布，绘板应用已更新至 v
        {process.env.NEXT_PUBLIC_APP_VERSION} 版本！
      </p>
      <p>本次版本更新带来了以下变化和改进：</p>
      <ul className="list-disc pl-5">
        <li>
          🔧 <s>修复已知问题、提升用户体验。</s>
        </li>
        <li>
          💬 支持<b>弹幕系统</b>！快来弹幕发送你的新年愿望吧！
        </li>
        <li>
          🎆 支持发送<b>烟花</b>！点击烟花按钮或者发送带有 🎆 Emoji
          的弹幕即可触发！快用烟花霸占屏幕吧！
        </li>
        <li>
          📹 我们将会在 bilibili
          上更新我们的延时摄影。发送弹幕有机会入选合影哦！
        </li>
      </ul>
      <p>距离新年只有不到12小时了！提前祝大家新年快乐！</p>
      <p>感谢大家的支持与反馈！祝大家玩得开心！</p>
    </div>
  );
};

const AnnounceModal = ({
  isOpen,
  onClickBtn,
  onClose,
}: {
  isOpen: boolean;
  onClickBtn: () => void;
  onClose: () => void;
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (!isOpen) return;
    const end = Date.now() + 3 * 1000; // 3 seconds
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

    const frame = () => {
      if (Date.now() > end) return;

      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      });

      requestAnimationFrame(frame);
    };

    frame();
  }, [isOpen]);

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              版本更新公告 v{process.env.NEXT_PUBLIC_APP_VERSION}
            </DialogTitle>
            <DialogDescription>
              你可以随时在页面底部点击“更新公告”再次查看本次更新公告。
            </DialogDescription>
          </DialogHeader>
          <AnnounceContent />
          <Button onClick={onClickBtn}>明白啦</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>
            版本更新公告 v{process.env.NEXT_PUBLIC_APP_VERSION}
          </DrawerTitle>
          <DrawerDescription>
            你可以随时在页面底部点击“更新公告”再次查看本次更新公告。
          </DrawerDescription>
        </DrawerHeader>
        <AnnounceContent />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button onClick={onClickBtn}>明白啦</Button>
          </DrawerClose>
          <DrawerClose asChild>
            <Button variant="outline">忽略</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default AnnounceModal;
