import type { NextConfig } from "next";
const config: NextConfig = {
  serverExternalPackages:["pdf-parse","@prisma/client","bcryptjs","nodemailer"],
  poweredByHeader:false,
  experimental:{cpus:2},
};
export default config;
