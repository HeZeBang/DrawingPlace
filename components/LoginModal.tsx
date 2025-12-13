import { useEffect, useState } from "react";
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
} from "@/components/ui/alert-dialog"

const LoginModal = ({
  isOpen,
  onClickBtn,
  onClose,
}: {
  isOpen: boolean;
  onClickBtn: () => void;
  onClose: () => void;
}) => {
  const [title, setTitle] = useState("Drawing Place");

  useEffect(() => {
    setTitle(process.env.META_TITLE || document.title || "Drawing Place");
  }, []);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>需要登录</AlertDialogTitle>
          <AlertDialogDescription>
            您需要登录才能在 {title} 上绘画！
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>取消</AlertDialogCancel>
          <AlertDialogAction onClick={onClickBtn}>登录</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LoginModal;
