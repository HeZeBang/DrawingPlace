"use client";

import Sdk from "casdoor-js-sdk";

export const sdkConfig = {
  serverUrl: process.env.NEXT_PUBLIC_CASDOOR_SERVER_URL || "https://door.casdoor.com",
  clientId: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_ID || "client_id",
  clientSecret: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_SECRET || "client_secret",
  appName: process.env.NEXT_PUBLIC_CASDOOR_APP_NAME || "app_name",
  organizationName: process.env.NEXT_PUBLIC_CASDOOR_ORGANIZATION_NAME || "casbin",
  redirectPath: "/callback", // We will create this route
  signinPath: "/signin",
};

let casdoorSdk = null;

export const getCasdoorSdk = () => {
  if (typeof window !== "undefined" && !casdoorSdk) {
    casdoorSdk = new Sdk(sdkConfig);
  }
  return casdoorSdk;
};
