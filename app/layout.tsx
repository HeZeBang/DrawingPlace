import { Toaster } from "sonner";
import { RuntimeConfigProvider } from "@/components/RuntimeConfigProvider";
import { getRuntimeConfig } from "@/lib/runtime-config";
import "./globals.css";

export const metadata = {
  title: process.env.META_TITLE || "Drawing Place",
  description: process.env.META_DESCRIPTION || "A collaborative drawing board.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = getRuntimeConfig();

  return (
    <html lang="zh-CN">
      <body>
        <RuntimeConfigProvider config={config}>
          {children}
        </RuntimeConfigProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
