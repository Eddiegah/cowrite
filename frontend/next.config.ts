import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React strict mode to avoid Yjs double-effect issues
  reactStrictMode: false,

  // Empty turbopack config to silence the webpack/turbopack conflict warning
  // y-codemirror.next and Yjs work fine with Turbopack without extra config
  turbopack: {},
};

export default nextConfig;
