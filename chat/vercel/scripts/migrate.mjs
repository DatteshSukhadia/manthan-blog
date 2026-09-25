import { createClient } from "@libsql/client";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const url = process.env.TURSO_DATABASE_URL || process.env.LOCAL_DATABASE_URL;
if (!url) throw new Error("Connect the Turso database before building. No temporary production database is created.");
if (process.env.VERCEL && !url.startsWith("libsql://")) throw new Error("A remote Turso database is required on Vercel.");
if (url.startsWith("libsql://") && !process.env.TURSO_AUTH_TOKEN) throw new Error("TURSO_AUTH_TOKEN is missing.");
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const directory = resolve(dirname(fileURLToPath(import.meta.url)), "../../database/migrations");
try {
  await client.execute('CREATE TABLE IF NOT EXISTS "_ManthanMigrations" ("name" TEXT PRIMARY KEY, "checksum" TEXT NOT NULL, "appliedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
  for (const entry of (await readdir(directory, { withFileTypes: true })).filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const sql = await readFile(join(directory, entry.name, "migration.sql"), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const tx = await client.transaction("write");
    try {
      const applied = await tx.execute({ sql: 'SELECT "checksum" FROM "_ManthanMigrations" WHERE "name" = ?', args: [entry.name] });
      if (applied.rows.length) {
        if (applied.rows[0].checksum !== checksum) throw new Error(`Applied migration changed: ${entry.name}`);
      } else {
        // These checked-in SQLite migrations contain plain DDL, not triggers.
        const statements = sql.replace(/--[^\n]*/g, "").split(";").map(s => s.trim()).filter(Boolean);
        for (const statement of statements) await tx.execute(statement);
        await tx.execute({ sql: 'INSERT INTO "_ManthanMigrations" ("name", "checksum") VALUES (?, ?)', args: [entry.name, checksum] });
      }
      await tx.commit();
      console.log(`Migration verified: ${entry.name}`);
    } catch (error) {
      await tx.rollback();
      throw error;
    } finally { tx.close(); }
  }
  await client.execute('CREATE TABLE IF NOT EXISTS "_RateLimit" ("key" TEXT PRIMARY KEY, "count" INTEGER NOT NULL, "expiresAt" INTEGER NOT NULL)');
  await client.execute('CREATE INDEX IF NOT EXISTS "_RateLimit_expiry" ON "_RateLimit" ("expiresAt")');
  console.log("Database migrations ready. No demo account seeded.");
} finally { client.close(); }
