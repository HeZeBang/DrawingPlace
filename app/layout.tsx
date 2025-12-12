import { Toaster } from "sonner";
import { CasdoorSDKWrapper } from "@/components/CasdoorSDKWrapper";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: process.env.META_TITLE || "Drawing Place",
    description:
      process.env.META_DESCRIPTION || "A collaborative drawing board.",
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <CasdoorSDKWrapper>{children}</CasdoorSDKWrapper>
        <Toaster richColors />
      </body>
    </html>
  );
}
