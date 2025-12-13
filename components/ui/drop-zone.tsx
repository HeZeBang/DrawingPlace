"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ImageIcon, XCircleIcon, SlidersHorizontal } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Dropzone from "react-dropzone";

const PixelCanvas = ({
  originalUrl,
  targetSize, // 改名：不再是 Width，而是统称 Size (最长边)
  onPixelated,
}: {
  originalUrl: string;
  targetSize: number;
  onPixelated: (dataUrl: string) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !originalUrl) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = originalUrl;

    img.onload = () => {
      const maxSide = Math.max(img.width, img.height);
      const scale = targetSize / maxSide;

      const finalWidth = Math.round(img.width * scale);
      const finalHeight = Math.round(img.height * scale);
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      ctx.imageSmoothingEnabled = false;

      // Fill white background to ensure opacity
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, finalWidth, finalHeight);

      ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

      const dataUrl = canvas.toDataURL("image/png");
      onPixelated(dataUrl);
    };
  }, [originalUrl, targetSize, onPixelated]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full object-contain rounded-md border border-border bg-black/5"
      style={{ imageRendering: "pixelated" }}
    />
  );
};

export default function InputPicture({
  setPictureUrl,
}: {
  setPictureUrl: (url: string) => void;
}) {
  const [originalFileUrl, setOriginalFileUrl] = useState<string | null>(null);
  const [pixelSize, setPixelSize] = useState<number>(32);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOriginalFileUrl(null);
    setPictureUrl("");
  };

  return (
    <div className="mx-auto w-2/3 space-y-4" style={{ maxWidth: "80%" }}>
      <Dropzone
        onDrop={(acceptedFiles) => {
          const file = acceptedFiles[0];
          if (file) {
            const objectUrl = URL.createObjectURL(file);
            setOriginalFileUrl(objectUrl);
          }
        }}
        accept={{
          "image/png": [".png", ".jpg", ".jpeg", ".webp"],
        }}
        maxFiles={1}
      >
        {({
          getRootProps,
          getInputProps,
          isDragActive,
          isDragAccept,
          isDragReject,
        }) => (
          <div
            {...getRootProps()}
            className={cn(
              "relative group border border-dashed flex items-center justify-center aspect-square rounded-md focus:outline-hidden cursor-pointer overflow-hidden transition-colors",
              {
                "border-primary bg-secondary/50": isDragActive && isDragAccept,
                "border-destructive bg-destructive/20":
                  isDragActive && isDragReject,
                "hover:bg-secondary/20": !originalFileUrl,
              },
            )}
          >
            <input {...getInputProps()} id="sample" />

            {originalFileUrl ? (
              <>
                <PixelCanvas
                  originalUrl={originalFileUrl}
                  targetSize={pixelSize}
                  onPixelated={(dataUrl) => setPictureUrl(dataUrl)}
                />

                <button
                  className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-destructive hover:text-white transition-colors shadow-xs z-10"
                  onClick={handleRemove}
                  title="移除图片"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>

                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <p className="text-white font-medium flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" /> 点击或拖拽替换
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <ImageIcon className="h-16 w-16 mb-2" strokeWidth={1.25} />
                <span className="text-xs min-w-fit">
                  点击或将图片拖动到此处以上传
                </span>
              </div>
            )}
          </div>
        )}
      </Dropzone>

      {originalFileUrl && (
        <div className="bg-secondary/30 p-4 rounded-lg border space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm">
              <SlidersHorizontal className="h-4 w-4" />
              像素密度 (最长边)
            </Label>
            <span className="text-xs font-mono bg-background px-2 py-1 rounded border">
              {pixelSize}px
            </span>
          </div>

          <div className="flex items-center gap-4 max-w-full">
            <span className="text-xs min-w-fit text-muted-foreground">
              粗糙
            </span>
            <input
              type="range"
              min="8"
              max="64"
              step="4"
              value={pixelSize}
              onChange={(e) => setPixelSize(Number(e.target.value))}
              className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80 min-w-8"
            />
            <span className="text-xs min-w-fit text-muted-foreground">
              精细
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            * 无论原图横竖，其最长边将被压缩至 {pixelSize} 像素。
          </p>
        </div>
      )}
    </div>
  );
}
