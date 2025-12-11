'use client';

import { useEffect, useState } from 'react';
import { RuntimeConfig } from '@/lib/runtime-config';

const defaultConfig: RuntimeConfig = {
  CASDOOR_SERVER_URL: 'https://door.casdoor.com',
  CASDOOR_CLIENT_ID: '',
  CASDOOR_CLIENT_SECRET: '',
  CASDOOR_APP_NAME: '',
  CASDOOR_ORGANIZATION_NAME: '',
  MONGO_URI_CLIENT: 'mongodb://localhost:27017/place',
  DRAW_DELAY_MS: 5000,
};

export function useRuntimeConfig() {
  const [config, setConfig] = useState<RuntimeConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch('/api/config');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const runtimeConfig = await response.json();
        setConfig(runtimeConfig);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch runtime config:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch config');
        // 使用默认配置作为回退
        setConfig(defaultConfig);
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  return { config, loading, error };
}