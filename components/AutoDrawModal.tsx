"use clilent";

import { useState, useRef, useEffect } from "react";
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
import GuideCarousel from "./GuideCarousel";
import { useMediaQuery } from "@/hooks/use-media-query";
import InputPicture from "./ui/drop-zone";

const AutoDrawModal = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [originalPictureUrl, setOriginalPictureUrl] = useState<string|null>(null);

  if (isDesktop) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>自动绘图</DialogTitle>
            <DialogDescription>
              这是我们基于现有 API 开发的基础版自动绘图。有了它，你可以解放双手！
              <br />
              只需上传图片、指定起点，系统将自动为你绘制出图案！（官方外挂）
            </DialogDescription>
          </DialogHeader>
          <InputPicture setPictureUrl={setOriginalPictureUrl} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>自动绘图</DrawerTitle>
          <DrawerDescription>
            这是我们基于现有 API 开发的基础版自动绘图。有了它，你可以解放双手！
            <br />
            只需上传图片、指定起点，系统将自动为你绘制出图案！（官方外挂）
          </DrawerDescription>
        </DrawerHeader>
        <InputPicture setPictureUrl={setOriginalPictureUrl} />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">取消</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default AutoDrawModal;
