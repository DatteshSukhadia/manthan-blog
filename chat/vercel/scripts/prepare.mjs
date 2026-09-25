import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "..");
// Generated build directories only. Uploaded source folders remain unchanged.
for (const dir of ["app", "components", "lib", "public", "prisma"]) {
  await rm(join(root, dir), { recursive: true, force: true });
}
for (const item of ["app", "components", "lib", "public", "tsconfig.json", "next-env.d.ts", "postcss.config.js", "tailwind.config.ts"]) {
  await cp(join(source, "frontend", item), join(root, item), { recursive: true });
}
await mkdir(join(root, "app/api/[...route]"), { recursive: true });
await mkdir(join(root, "prisma"), { recursive: true });
await cp(join(source, "backend/lib/generator.ts"), join(root, "lib/generator.ts"));
await cp(join(root, "overrides/db.ts"), join(root, "lib/db.ts"));
await cp(join(root, "overrides/rate-limit.ts"), join(root, "lib/rate-limit.ts"));

function replaceRequired(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`Source changed; update deployment transformation: ${label}`);
  return text.replaceAll(from, to);
}

let schema = await readFile(join(source, "database/schema.prisma"), "utf8");
schema = schema.replace(/generator client \{[\s\S]*?\}/, 'generator client {\n  provider = "prisma-client-js"\n  engineType = "client"\n}');
schema = replaceRequired(schema, 'url      = env("DATABASE_URL")', 'url      = "file:./build-only.db"', "schema URL");
await writeFile(join(root, "prisma/schema.prisma"), schema);

let api = await readFile(join(source, "backend/app/api/[...route]/route.ts"), "utf8");
api = 'import { throttle } from "@/lib/rate-limit";\n' + api;
api = replaceRequired(api, 'export const dynamic = "force-dynamic";', 'export const dynamic = "force-dynamic";\nexport const maxDuration = 60;', "duration");
api = replaceRequired(api, 'const cookieAuth = () => process.env.AUTH_MODE === "cookie";', 'const cookieAuth = () => true;', "cookie-only authentication");
api = replaceRequired(api, 'process.env.DEMO_ENABLED !== "false"', 'process.env.DEMO_ENABLED === "true"', "demo off by default");
api = api.replace(/const attempts = new Map[\s\S]*?(?=const emailSchema)/, "");
api = replaceRequired(api, 'throttle(req,', 'await throttle(req,', "durable rate limits");
api = replaceRequired(api, '[process.env.APP_URL,process.env.RENDER_EXTERNAL_URL]', '[process.env.APP_URL || "https://chat.manthan.education", process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined, process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined]', "allowed origins");
api = replaceRequired(api, 'const voice=await fetch(', 'if(!process.env.NARRATION_URL) return json({ok:true,narration:"device"});\n        const voice=await fetch(', "optional voice readiness");
api = replaceRequired(api, 'if(length>21*1024*1024)', 'if(length>4*1024*1024)', "request size");
api = replaceRequired(api, 'file.size>10*1024*1024', 'file.size>3*1024*1024', "file size");
api = replaceRequired(api, '10 MB', '3 MB', "upload explanation");
api = replaceRequired(api, 'if(uploadEntries.length>2)', 'if(uploadEntries.reduce((sum, item) => sum + item.file.size, 0)>3*1024*1024) return json({error:"Keep all attachments together under 3 MB."},413);\n      if(uploadEntries.length>2)', "total upload size");
api = replaceRequired(api, 'if(path==="auth/forgot") {', 'if(path==="auth/forgot") {\n        if(!process.env.RESEND_API_KEY && !process.env.SMTP_HOST) return json({error:"Password-reset email is not configured for this no-cost deployment. No email has been sent."},503);', "honest reset status");
await writeFile(join(root, "app/api/[...route]/route.ts"), api);

let playback = await readFile(join(root, "components/useLessonPlayback.ts"), "utf8");
playback = replaceRequired(playback, 'let preferredVoice: Voice = "warm";', 'let preferredVoice: Voice = process.env.NEXT_PUBLIC_NARRATION_MODE === "device" ? "device" : "warm";', "voice default");
await writeFile(join(root, "components/useLessonPlayback.ts"), playback);
let player = await readFile(join(root, "components/Player.tsx"), "utf8");
player = replaceRequired(player, '<span>Neural narration, made on this server. No external speech service.</span>', '<span>{process.env.NEXT_PUBLIC_NARRATION_MODE === "device" ? "Device narration on this no-cost deployment. Server neural voices are not connected." : "Neural narration from the configured voice service."}</span>', "narration disclosure");
player = replaceRequired(player, '<option value="warm">', '<option disabled={process.env.NEXT_PUBLIC_NARRATION_MODE === "device"} value="warm">', "warm availability");
player = replaceRequired(player, '<option value="clear">', '<option disabled={process.env.NEXT_PUBLIC_NARRATION_MODE === "device"} value="clear">', "clear availability");
await writeFile(join(root, "components/Player.tsx"), player);
let studio = await readFile(join(root, "components/Studio.tsx"), "utf8");
studio = studio.replaceAll("10 MB", "3 MB").replaceAll("10*1024*1024", "3*1024*1024").replaceAll("10 * 1024 * 1024", "3 * 1024 * 1024");
await writeFile(join(root, "components/Studio.tsx"), studio);
console.log("Prepared unified Next.js app from the original frontend/backend sources.");
