export interface ParsedInitData {
  actionCount: number;
  delay: number;
  colors: string[];
  points: { x: number; y: number; c: string }[];
}

export function parseInitData(buffer: ArrayBuffer): ParsedInitData {
  const view = new DataView(buffer);
  let offset = 0;

  // 1. Action Count (Uint32)
  const actionCount = view.getUint32(offset, true);
  offset += 4;

  // 2. Delay (Float32)
  const delay = view.getFloat32(offset, true);
  offset += 4;

  // 3. Palette Size (Uint8)
  const paletteSize = view.getUint8(offset);
  offset += 1;

  // 4. Palette Colors
  const colors: string[] = [];
  for (let i = 0; i < paletteSize; i++) {
    const r = view.getUint8(offset++);
    const g = view.getUint8(offset++);
    const b = view.getUint8(offset++);
    colors.push(
      `${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`,
    );
  }

  // 5. Points Count (Uint32)
  const pointsCount = view.getUint32(offset, true);
  offset += 4;

  // 6. Points
  const points: { x: number; y: number; c: string }[] = [];

  for (let i = 0; i < pointsCount; i++) {
    const x = view.getUint16(offset, true);
    offset += 2;
    const y = view.getUint16(offset, true);
    offset += 2;
    const r = view.getUint8(offset++);
    const g = view.getUint8(offset++);
    const b = view.getUint8(offset++);
    const c = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    points.push({ x, y, c });
  }

  return {
    actionCount,
    delay,
    colors,
    points,
  };
}
