"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SettingsConfig, defaultSettingsConfig } from "@/lib/frontend-settings";

const SettingsContext = createContext<{
  config: SettingsConfig;
  updateConfig: (updates: Partial<SettingsConfig>) => void;
} | null>(null);

export function SettingsConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<SettingsConfig>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("settingsConfig");
      if (stored) {
        try {
          return { ...defaultSettingsConfig, ...JSON.parse(stored) };
        } catch (e) {
          console.error("Failed to parse settings from localStorage", e);
        }
      }
    }
    return defaultSettingsConfig;
  });

  useEffect(() => {
    localStorage.setItem("settingsConfig", JSON.stringify(config));
  }, [config]);

  const updateConfig = (updates: Partial<SettingsConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  return (
    <SettingsContext.Provider value={{ config, updateConfig }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsConfigContext() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error(
      "useSettingsConfigContext must be used within SettingsConfigProvider",
    );
  }
  return context;
}
