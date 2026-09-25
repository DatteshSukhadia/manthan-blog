import type { NextConfig } from "next";

// One project serves both the UI and /api. No localhost proxy in production.
const config: NextConfig = {
  poweredByHeader: false,
  experimental: { cpus: 2 },
  // Prisma's client engine loads its WASM compiler dynamically. Next's
  // dependency tracer does not discover that binary from the JS loader.
  outputFileTracingIncludes: {
    "/api/*": ["./node_modules/.prisma/client/query_compiler_bg.wasm"],
  },
  serverExternalPackages: ["pdf-parse", "@prisma/client", "@prisma/adapter-libsql", "@libsql/client", "bcryptjs", "nodemailer"],
  env: {
    NEXT_PUBLIC_NARRATION_MODE: process.env.NARRATION_URL ? "neural" : "device",
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
      ],
    }];
  },
};
export default config;
