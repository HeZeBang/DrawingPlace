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
        大家好！我们很高兴地宣布，绘板应用已更新至 v
        {process.env.NEXT_PUBLIC_APP_VERSION} 版本！
      </p>
      <p>本次版本更新带来了以下变化和改进：</p>
      <ul className="list-disc pl-5">
        <li>
          <s>修复已知问题、提升用户体验。</s>
        </li>
        <li>背包容量缩小至 64，冷却时间提升至 5 秒。</li>
        <li>自动绘图支持跳过纯透明像素。</li>
        <li>
          现在新的 API 允许你省略 <code>h</code>, <code>w</code>，
          <code>token</code>参数。
        </li>
        <li>
          之前的<code>/api/place</code>将标记为废弃，建议使用新的 API 端点{" "}
          <code>/api/v2/place</code>，这将省略宽高参数从而减少初始化时间。
        </li>
        <li>
          前端使用了新的 API 端点<code>/api/v2/init</code>
          ，使用二进制格式减少开销，并支持增量更新。
        </li>
        <li>
          我们也同步<b>更新了</b>官方 API 手册，前往{" "}
          <a
            href="https://geekpie.club/posts/blog/2025-12-22-paint2025/"
            target="_blank"
          >
            GeekPie 博客页面
          </a>
          或者
          <a
            href="https://ohmygpa.icu/topic/11/2025-%E6%96%B0%E5%B9%B4%E7%BB%98%E6%9D%BF-%E8%A7%84%E5%88%99%E8%AF%B4%E6%98%8E-api-%E6%96%87%E6%A1%A3%E5%8F%8A%E6%A0%B7%E4%BE%8B"
            target="_blank"
          >
            OhMyGPA 论坛专栏
          </a>
          查看。
        </li>
      </ul>
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
