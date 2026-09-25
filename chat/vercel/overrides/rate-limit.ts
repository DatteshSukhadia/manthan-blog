import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { db } from "./db";

// Shared across serverless instances. A restart must not reset login limits.
export async function throttle(req: NextRequest, scope: string, limit = 15) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const window = Math.floor(Date.now() / 900000);
  const key = createHash("sha256").update(`${scope}:${ip}:${window}`).digest("hex");
  const expiresAt = (window + 1) * 900000;
  const rows = await db.$queryRaw<Array<{ count: number | bigint }>>`
    INSERT INTO "_RateLimit" ("key", "count", "expiresAt")
    VALUES (${key}, 1, ${expiresAt})
    ON CONFLICT("key") DO UPDATE SET "count" = MIN("count" + 1, 10000)
    RETURNING "count"`;
  if (Math.random() < 0.02) {
    await db.$executeRaw`DELETE FROM "_RateLimit" WHERE "expiresAt" < ${Date.now()}`;
  }
  if (Number(rows[0]?.count) > limit) {
    throw new Error("Too many requests. Please try again in 15 minutes.");
  }
}
