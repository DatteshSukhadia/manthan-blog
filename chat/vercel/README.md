# Manthan Chat on Vercel

This deployment target assembles the original frontend and API at build time.
It does not overwrite the uploaded local-development application or the blog.

## Vercel configuration

- Create a separate project named `manthan-chat` from this repository.
- Root directory: `chat/vercel`.
- Framework: Next.js. Node.js: 22.x.
- Install: `npm ci`. Build: `npm run build`.
- Enable access to source files outside the root directory in the build step.
- Connect a Turso Cloud **Starter ($0/month)** database to this project only.
- Let the integration supply `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
- Set `APP_URL=https://chat.manthan.education`.
- Attach only `chat.manthan.education`, keeping the blog project unchanged.

The free Starter option was displayed in Vercel's integration setup on
September 25, 2026. Verify the selected price and limits before provisioning;
never enable a paid or overage plan without approval.
Provider information: https://vercel.com/marketplace/tursocloud

The build applies the checked-in SQLite migrations to Turso transactionally,
using a migration ledger and checksum. It does not reset existing data, create
sample accounts, or upload the downloaded database binary.
Prisma's Turso adapter documentation:
https://www.prisma.io/docs/orm/v6/overview/databases/turso

## No-cost limitations

- Lessons use the supplied local generator, not a paid AI API.
- Browser/device narration is the default. Warm/Clear server neural voices are
  unavailable until a separately approved voice service is connected.
- Password-reset emails are not configured; the API reports this rather than
  claiming an email was sent. Signup, login, and in-account password changes
  do not require an email provider.
- Attachments must total at most 3 MB per request for serverless deployment.
- Free-plan quotas apply. No paid upgrade or overage plan is authorized.
- Cookies are secure and HttpOnly; preview visitor-header auth is disabled.
- Rate limits are stored in the shared database, not serverless process memory.

## Local deployment test

From this directory:

```sh
npm ci
LOCAL_DATABASE_URL=file:/tmp/manthan-vercel-test.db npm run build
LOCAL_DATABASE_URL=file:/tmp/manthan-vercel-test.db APP_URL=http://localhost:3000 npm start
```

Local SQLite is permitted for tests only. Production refuses a local database
when Vercel's environment is detected.
