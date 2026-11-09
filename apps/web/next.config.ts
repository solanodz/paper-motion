import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // self-hosted fonts (Geist Serif) are loaded by the engine from the user's own origin: they need CORS
  async headers() {
    return [{ source: "/fonts/:path*", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }, { key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
