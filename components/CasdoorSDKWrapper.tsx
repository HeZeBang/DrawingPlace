import React from "react";
import { getRuntimeConfig } from "@/lib/runtime-config";
import { RuntimeConfigProvider } from "./RuntimeConfigProvider";

export function CasdoorSDKWrapper({ children }: { children: React.ReactNode }) {
  const config = getRuntimeConfig();
  
  return (
    <RuntimeConfigProvider config={config}>
      {children}
    </RuntimeConfigProvider>
  );
}
