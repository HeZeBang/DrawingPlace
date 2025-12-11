"use client";

import React, { createContext, useContext, useRef } from "react";
import { setRuntimeConfig, reinitializeCasdoorSdk } from "@/lib/casdoor";
import { RuntimeConfig } from "@/lib/runtime-config";

const RuntimeConfigContext = createContext<{
  config: RuntimeConfig;
} | null>(null);

export function RuntimeConfigProvider({
  children,
  config,
}: {
  children: React.ReactNode;
  config: RuntimeConfig;
}) {
  const initialized = useRef(false);
  const prevConfig = useRef<RuntimeConfig | null>(null);

  if (!initialized.current || prevConfig.current !== config) {
    console.log("Initializing runtime config from server props:", {
      serverUrl: config.CASDOOR_SERVER_URL,
      clientId: config.CASDOOR_CLIENT_ID ? "[SET]" : "[EMPTY]",
    });
    setRuntimeConfig(config);
    reinitializeCasdoorSdk();
    initialized.current = true;
    prevConfig.current = config;
  }

  return (
    <RuntimeConfigContext.Provider value={{ config }}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}

export function useRuntimeConfigContext() {
  const context = useContext(RuntimeConfigContext);
  if (!context) {
    throw new Error(
      "useRuntimeConfigContext must be used within RuntimeConfigProvider",
    );
  }
  return context;
}
