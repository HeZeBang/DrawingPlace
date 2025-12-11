'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useRuntimeConfig } from '@/hooks/useRuntimeConfig';
import { setRuntimeConfig, reinitializeCasdoorSdk } from '@/lib/casdoor';
import { RuntimeConfig } from '@/lib/runtime-config';

const RuntimeConfigContext = createContext<{
  config: RuntimeConfig;
  loading: boolean;
  error: string | null;
} | null>(null);

export function RuntimeConfigProvider({ children }: { children: React.ReactNode }) {
  const { config, loading, error } = useRuntimeConfig();

  useEffect(() => {
    if (!loading && !error) {
      // 设置 Casdoor 配置
      setRuntimeConfig(config);
      // 重新初始化 Casdoor SDK
      reinitializeCasdoorSdk();
    }
  }, [config, loading, error]);

  return (
    <RuntimeConfigContext.Provider value={{ config, loading, error }}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}

export function useRuntimeConfigContext() {
  const context = useContext(RuntimeConfigContext);
  if (!context) {
    throw new Error('useRuntimeConfigContext must be used within RuntimeConfigProvider');
  }
  return context;
}