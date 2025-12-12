import { X } from "lucide-react";
import { useEffect, useState } from "react";
import GuideCarousel from "./GuideCarousel";

const GuideModal = ({
  isOpen,
  onClickBtn,
  onClose,
}: {
  isOpen: boolean;
  onClickBtn: () => void;
  onClose: () => void;
}) => {
  const [title, setTitle] = useState("Drawing Place");
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    setTitle(process.env.META_TITLE || document.title || "Drawing Place");
  }, []);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg bg-background p-6 shadow-lg border">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        <div className="flex flex-col space-y-4 text-center">
          <h2 className="text-lg font-semibold">初来乍到？这是使用Tips！</h2>
          <GuideCarousel setIsFinished={setIsFinished} />
          <button
            onClick={onClickBtn}
            disabled={!isFinished}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
          >
            明白了
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuideModal;
