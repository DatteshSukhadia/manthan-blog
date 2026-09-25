import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  experimental: {cpus:2},
  async rewrites() {
    const target=(process.env.API_PROXY_TARGET || "http://127.0.0.1:3001").replace(/\/$/,"");
    return [{source:"/api/:path*",destination:`${target}/api/:path*`}];
  },
};
export default config;
