"use client";

import Sdk from "casdoor-js-sdk";

export const sdkConfig = {
  serverUrl: process.env.NEXT_PUBLIC_CASDOOR_SERVER_URL || "https://door.casdoor.com",
  clientId: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_ID || "client_id",
  clientSecret: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_SECRET || "client_secret",
  appName: process.env.NEXT_PUBLIC_CASDOOR_APP_NAME || "app_name",
  organizationName: process.env.NEXT_PUBLIC_CASDOOR_ORGANIZATION_NAME || "casbin",
  redirectPath: "/callback",
  signinPath: "/signin",
};

let casdoorSdk: any = null;

export const getCasdoorSdk = () => {
  if (typeof window !== "undefined" && !casdoorSdk) {
    casdoorSdk = new Sdk(sdkConfig);
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
