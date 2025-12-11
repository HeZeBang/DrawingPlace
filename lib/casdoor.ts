"use client";

import Sdk from "casdoor-js-sdk";
import { RuntimeConfig } from './runtime-config';

// 动态配置，将在运行时设置
let dynamicConfig: RuntimeConfig | null = null;

export const setRuntimeConfig = (config: RuntimeConfig) => {
  dynamicConfig = config;
};

export const getSdkConfig = () => {
  if (!dynamicConfig) {
    // 返回默认配置作为回退
    return {
      serverUrl: "https://door.casdoor.com",
      clientId: "client_id",
      clientSecret: "client_secret",
      appName: "app_name",
      organizationName: "casbin",
      redirectPath: "/callback",
      signinPath: "/signin",
    };
  }

  return {
    serverUrl: dynamicConfig.CASDOOR_SERVER_URL,
    clientId: dynamicConfig.CASDOOR_CLIENT_ID,
    clientSecret: dynamicConfig.CASDOOR_CLIENT_SECRET,
    appName: dynamicConfig.CASDOOR_APP_NAME,
    organizationName: dynamicConfig.CASDOOR_ORGANIZATION_NAME,
    redirectPath: "/callback",
    signinPath: "/signin",
  };
};

let casdoorSdk: any = null;

export const getCasdoorSdk = () => {
  if (typeof window !== "undefined" && !casdoorSdk) {
    const config = getSdkConfig();
    casdoorSdk = new Sdk(config);
  }
  return casdoorSdk;
};

// 重新初始化 SDK（当配置更新时调用）
export const reinitializeCasdoorSdk = () => {
  if (typeof window !== "undefined") {
    const config = getSdkConfig();
    casdoorSdk = new Sdk(config);
  }
  return casdoorSdk;
};

// Helper function to generate PKCE code_verifier and code_challenge
export const generatePKCE = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let codeVerifier = '';
  for (let i = 0; i < 128; i++) {
    codeVerifier += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  // Generate code_challenge from code_verifier using SHA256
  const sha256 = async (str: string) => {
    const msgUint8 = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return btoa(hashHex).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };
  
  return { codeVerifier, sha256 };
};

// Initiate login with proper PKCE flow
export const initiateLogin = async () => {
  const sdk = getCasdoorSdk();
  if (!sdk) return;
  
  try {
    sdk.signinRedirect();
  } catch (error) {
    console.error('Failed to initiate login:', error);
  }
};
