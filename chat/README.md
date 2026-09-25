# Manthan Chat

Application source imported from the supplied frontend, backend, and database
packages. The existing root `index.html` and `blog.html` are unchanged.

## Structure

- `frontend/`: Next.js user interface.
- `backend/`: Next.js API, Prisma client, and separate Python narration worker.
- `database/`: Prisma schema and migrations. Database binaries are deliberately
  excluded from Git. Migrations create a fresh database.

Keep these three directories as siblings. Follow `frontend/START-HERE.md` for
local development; `npm run db:migrate` creates the database, and seeding is
optional. The original database README describes the downloaded ZIP, not a
database binary committed to this repository.

## Deployment status

The Vercel-compatible deployment lives in `vercel/`. It combines the frontend
and API during the build and uses a Turso database instead of ephemeral local
SQLite. See [the deployment guide](vercel/README.md) for configuration and
explicit no-cost feature limitations. The uploaded source folders remain intact.
Production builds pass locally; deployment and final-domain runtime verification
are separate launch steps.

The target address is `chat.manthan.education`, a subdomain, not an HTML filename.
Do not change the root directory of the existing blog's Vercel project.

## No-cost requirement

Do not provision paid hosting, paid databases, paid narration, paid email, or paid
AI services. The repository upload does not create any of these services.
Free-tier limits and billing settings must be verified before activating any
provider. If a required feature has no verified no-cost deployment, leave it
unconfigured and explain the limitation rather than silently enabling billing.

The original local application is preserved. A redirect requires an already
running, publicly accessible service; it cannot execute these source files,
provide database persistence, or start the Python narration worker.
Do not use an expiring or private development-preview URL as the production
redirect destination.

## Vercel deployment

Create a separate project with root directory `chat/vercel`, including files
outside the root directory. Use the free Turso Starter database integration.
The build applies versioned SQL migrations, and authentication uses secure
same-origin cookies. Rate limits are stored in the shared database.
No paid AI, email, or narration service is configured. Device narration replaces
the separate neural voice worker in this deployment.

## Original persistent-server architecture

Use a separate Vercel project for the frontend, connected to this repository
with root directory `chat/frontend`. Attach `chat.manthan.education` to that project.
Keep the existing blog project and its domain settings untouched.

Run `backend/` and the Python voice worker on a persistent Linux server, with
`database/` beside `backend/`. Keep SQLite on durable storage with tested backups.
The voice worker should listen only on loopback or a private network.
Expose the backend through HTTPS, not its raw internal port.

Vercel Functions do not provide the persistent local filesystem required by this
SQLite application. Uploading its database file to Vercel will not solve this:
https://vercel.com/kb/guide/is-sqlite-supported-in-vercel

Alternatively, adapt the backend to a managed database and deploy its API to
Vercel. That requires a database-provider change and fresh compatible migrations;
the SQLite migration SQL must not be applied unchanged to PostgreSQL. The Python
voice worker still needs an appropriate host or replacement service.

## Production configuration

Frontend:

- `API_PROXY_TARGET`: the real HTTPS backend origin, without `/api`.
  Configure it before building, since Next.js builds the rewrite configuration.

Backend:

- `DATABASE_URL`: an absolute SQLite URL on durable storage, such as
  `file:/srv/manthan-data/manthan.db`.
- `APP_URL`: `https://chat.manthan.education`.
- `AUTH_MODE`: `cookie`.
- `DEMO_ENABLED`: `false`.
- `INSTITUTION_PREVIEW`: `false`.
- `NARRATION_URL`: the private voice worker address.
- Configure and test SMTP or another supported mail provider before offering
  password resets. Do not commit provider secrets.

The application already sends frontend API requests through `/api`; preserve
this same-origin proxy so secure session cookies and origin checks work.
Do not enable the preview visitor-header authentication mode in production.

## Before launch

- Choose a verified no-cost backend option. Do not activate paid resources.
- Review rate limiting, signup abuse protection, privacy/deletion practices,
  and backup/restore procedures. Existing in-memory rate limits are not shared
  across processes or durable across restarts.
- Disable shared demo access and do not seed shared accounts in production.
- Apply migrations and confirm that data survives a backend restart.
- Start and verify the voice service, or clearly communicate its unavailability.
- Verify signup, login, logout, password reset, lesson creation, uploads, quizzes,
  and saved progress through the frontend origin.
- In the separate frontend project's domain settings, add `chat.manthan.education`
  and use the exact DNS record Vercel supplies. Do not alter apex or `www` records.
- Verify HTTPS and repeat the runtime checks on the final subdomain.

No hosting subscription or paid service has been provisioned by this import.
