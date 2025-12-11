"use client";

import Sdk from "casdoor-js-sdk";
import { RuntimeConfig } from "./runtime-config";

let dynamicConfig: RuntimeConfig | null = null;

export const setRuntimeConfig = (config: RuntimeConfig) => {
  dynamicConfig = config;
};

export const getSdkConfig = () => {
  if (!dynamicConfig) {
    console.warn("Dynamic config not available, using default config");
    return {
      serverUrl: "https://door.casdoor.com",
      clientId: "",
      clientSecret: "",
      appName: "",
      organizationName: "",
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
  if (typeof window !== "undefined") {
    const config = getSdkConfig();
    console.log("Getting Casdoor SDK with config:", config);

    if (
      !casdoorSdk ||
      (dynamicConfig &&
        (!casdoorSdk.config ||
          casdoorSdk.config.clientId !== config.clientId ||
          casdoorSdk.config.serverUrl !== config.serverUrl))
    ) {
      casdoorSdk = new Sdk(config);
      casdoorSdk.config = config;
    }
  }
  return casdoorSdk;
};

export const reinitializeCasdoorSdk = () => {
  if (typeof window !== "undefined") {
    const config = getSdkConfig();
    console.log("Reinitializing Casdoor SDK with config:", {
      serverUrl: config.serverUrl,
      clientId: config.clientId ? "[SET]" : "[EMPTY]",
      appName: config.appName,
      organizationName: config.organizationName,
    });
    casdoorSdk = new Sdk(config);
    casdoorSdk.config = config;
  }
  return casdoorSdk;
};

// Helper function to generate PKCE code_verifier and code_challenge
export const generatePKCE = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let codeVerifier = "";
  for (let i = 0; i < 128; i++) {
    codeVerifier += characters.charAt(
      Math.floor(Math.random() * characters.length),
    );
  }

  // Generate code_challenge from code_verifier using SHA256
  const sha256 = async (str: string) => {
    const msgUint8 = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return btoa(hashHex)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
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
    console.error("Failed to initiate login:", error);
  }
};
