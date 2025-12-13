import { useState } from "react";
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import GuideCarousel from "./GuideCarousel";
import { useMediaQuery } from "@/hooks/use-media-query";

const GuideModal = ({
  isOpen,
  onClickBtn,
  onClose,
}: {
  isOpen: boolean;
  onClickBtn: () => void;
  onClose: () => void;
}) => {
  const [isFinished, setIsFinished] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>初来乍到？这是使用Tips！</DialogTitle>
            <DialogDescription>
              你可以随时在页面底部点击“使用说明”再次查看本指南。
            </DialogDescription>
          </DialogHeader>
          <GuideCarousel setIsFinished={setIsFinished} />
          <Button disabled={!isFinished} onClick={onClickBtn}>明白啦</Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>初来乍到？这是使用Tips！</DrawerTitle>
          <DrawerDescription>
            你可以随时在页面底部点击“使用说明”再次查看本指南。
          </DrawerDescription>
        </DrawerHeader>
        <GuideCarousel setIsFinished={setIsFinished} />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button disabled={!isFinished} onClick={onClickBtn}>明白啦</Button>
          </DrawerClose>
          <DrawerClose asChild>
            <Button variant="outline">跳过</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
};

export default GuideModal;
