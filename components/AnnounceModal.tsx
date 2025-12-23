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
import GuideCarousel from "./GuideCarousel";
import { useMediaQuery } from "@/hooks/use-media-query";

const AnnounceContent = () => {
  return (
    <div className="prose p-4 leading-tight prose-sm">
      <p>
        各位玩家朋友们好！我们的新年绘板在短短两天正式上线就突破了 100 人注册和
        30,000 次绘制！可喜可贺！
      </p>
      <p>
        随着新年越来越近，为了公平起见，我们也会随时间逐渐提高绘画成本，避免覆盖。本次版本更新带来了以下变化和改进：
      </p>
      <ul className="list-disc pl-5">
        <li>背包容量缩小至 96，冷却时间提升至 3 秒。</li>
        <li>
          我们发布了官方 API 手册和 Python 例程，前往{" "}
          <a
            href="https://geekpie.club/posts/blog/2025-12-22-paint2025/"
            target="_blank"
          >
            GeekPie 博客页面
          </a>
          查看。
        </li>
      </ul>

      <p>
        此外，我们在合作论坛{" "}
        <a href="https://ohmygpa.icu/category/9/paint" target="_blank">
          OhMyGPA 论坛
        </a>{" "}
        开设了专栏，
        <b>
          欢迎大家在上面发起组队或者发送反馈。之后我们的评比和开奖也会在这个平台进行
        </b>
        ，敬请期待！
      </p>
      <p>P.S. 论坛直接使用绘图的 GeekPie 账号即可免注册登录！</p>
      <p>感谢大家的支持与反馈！祝大家玩得开心！</p>
      <p>🎄圣诞愉快！🎄</p>
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
    // const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
    const colors = ["#228B22", "#FF0000", "#FFFF00", "#FFA500", "#FFFFFF"]; // Christmas colors

    const frame = () => {
      if (Date.now() > end) return;

      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      });
      confetti({
        particleCount: 6,
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
              你可以随时在页面底部点击“使用说明”再次查看本次更新公告。
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
            你可以随时在页面底部点击版本号再次查看本次更新公告。
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
