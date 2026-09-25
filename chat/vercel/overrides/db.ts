import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalDb = globalThis as unknown as { manthanPrisma?: PrismaClient };
function makeClient() {
  const url = process.env.TURSO_DATABASE_URL || process.env.LOCAL_DATABASE_URL;
  if (!url) throw new Error("Configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN before deploying.");
  if (process.env.VERCEL && !url.startsWith("libsql://")) {
    throw new Error("Vercel requires the remote Turso database, not a local SQLite file.");
  }
  if (url.startsWith("libsql://") && !process.env.TURSO_AUTH_TOKEN) {
    throw new Error("TURSO_AUTH_TOKEN is missing.");
  }
  return new PrismaClient({
    adapter: new PrismaLibSQL({ url, authToken: process.env.TURSO_AUTH_TOKEN }),
    transactionOptions: { maxWait: 10000, timeout: 15000 },
  });
}
export const db = globalDb.manthanPrisma || makeClient();
globalDb.manthanPrisma = db;
