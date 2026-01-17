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
        大家好！绘板应用已更新至 v
        {process.env.NEXT_PUBLIC_APP_VERSION} 版本！
      </p>
      <p>本次版本更新正式加入了<b>投票</b>功能！点击屏幕下方的奖杯图标即可参与投票！快来投出你心目中的<b>灵魂画手</b>吧！</p>
      <p>我们为本次赛事提供了丰厚的奖金：</p>
      <ul className="list-disc pl-5">
        <li>
          🎨 <b>灵魂画手奖</b>：进入投票界面，按照重叠区域人气排名，第1名 200 RMB / 第2名 150 RMB / 第3名 100 RMB
        </li>
        <li>
          💬 <b>广而告之奖</b>：我们将从转发说说的用户中随机抽取 2 名各 50 RMB 奖励
        </li>
        <li>
          🎁 <b>天选之子奖</b>：从注册用户随机抽取 2 名，各 50 RMB
        </li>
      </ul>
      <p>投票将持续至 2026 年 3 月 1 日，结果将在 3 月 14 日左右的 GeekPie Day 大会上公布，敬请期待！</p>
      <p>同时我们将会在 bilibili 上更新我们的延时摄影，记得关注我们的 QQ 群动态！</p>
      <p>感谢大家的支持与反馈！祝大家新年快乐！</p>
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
