"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CommentItem {
  _id: string;
  comment: string;
  likes: number;
  isLiked: boolean;
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comments: CommentItem[];
  userId: string | null;
  onLikeToggle: (voteId: string, isLiked: boolean) => Promise<void>;
}

const CommentsList = ({
  comments,
  userId,
  onLikeToggle,
}: {
  comments: CommentItem[];
  userId: string | null;
  onLikeToggle: (voteId: string, isLiked: boolean) => Promise<void>;
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleLike = async (item: CommentItem) => {
    if (!userId) {
      toast.error("Please login to like comments");
      return;
    }
    setLoadingId(item._id);
    try {
      await onLikeToggle(item._id, item.isLiked);
    } finally {
      setLoadingId(null);
    }
  };

  if (comments.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No comments in this area
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto p-4">
      {comments.map((item) => (
        <div
          key={item._id}
          className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-100 dark:border-zinc-700"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 dark:text-gray-200 break-words">
              {item.comment}
            </p>
          </div>
          <button
            onClick={() => handleLike(item)}
            disabled={loadingId === item._id || !userId}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all shrink-0",
              item.isLiked
                ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                : "bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500",
              !userId && "opacity-50 cursor-not-allowed"
            )}
          >
            {loadingId === item._id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Heart
                className={cn("h-3 w-3", item.isLiked && "fill-current")}
              />
            )}
            <span>{item.likes}</span>
          </button>
        </div>
      ))}
    </div>
  );
};

const CommentsModal = ({
  isOpen,
  onClose,
  comments,
  userId,
  onLikeToggle,
}: CommentsModalProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Comments ({comments.length})</DialogTitle>
          </DialogHeader>
          <CommentsList
            comments={comments}
            userId={userId}
            onLikeToggle={onLikeToggle}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Comments ({comments.length})</DrawerTitle>
        </DrawerHeader>
        <CommentsList
          comments={comments}
          userId={userId}
          onLikeToggle={onLikeToggle}
        />
      </DrawerContent>
    </Drawer>
  );
};

export default CommentsModal;
