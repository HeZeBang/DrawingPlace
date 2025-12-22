/** @type {import('next').NextConfig} */
const pkg = require("./package.json");
const nextConfig = {
  reactStrictMode: false, // Canvas manipulation might have issues with strict mode double render
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
};

module.exports = nextConfig;
