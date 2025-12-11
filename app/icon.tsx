import { ImageResponse } from "next/og";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  const colors = [
    "#F8371A",
    "#F97C1B",
    "#FAC81C",
    "#3FD0B6",
    "#2CADF6",
    "#6462FC",
  ];
  const background = `linear-gradient(135deg, ${colors.join(", ")})`;
  return new ImageResponse(
    <div
      style={{
        background: background,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "20%",
        color: "black",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        className="lucide lucide-brush-icon lucide-brush"
      >
        <path d="m11 10 3 3" />
        <path d="M6.5 21A3.5 3.5 0 1 0 3 17.5a2.62 2.62 0 0 1-.708 1.792A1 1 0 0 0 3 21z" />
        <path d="M9.969 17.031 21.378 5.624a1 1 0 0 0-3.002-3.002L6.967 14.031" />
      </svg>
    </div>,
    {
      ...size,
    },
  );
}
