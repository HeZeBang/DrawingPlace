export interface AutoDrawPixel {
  x: number;
  y: number;
  w: number;
  h: number;
  c: string;
}

export const extractPixels = (
  dataUrl: string,
  startX: number,
  startY: number,
): Promise<AutoDrawPixel[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const pixels: AutoDrawPixel[] = [];

      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const index = (y * img.width + x) * 4;
          const r = imageData.data[index];
          const g = imageData.data[index + 1];
          const b = imageData.data[index + 2];
          // Alpha is ignored as we expect opaque image or treat as opaque

          const hex =
            "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

          pixels.push({
            x: startX + x,
            y: startY + y,
            w: 1,
            h: 1,
            c: hex,
          });
        }
      }
      resolve(pixels);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
};
