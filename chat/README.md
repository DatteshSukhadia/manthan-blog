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

Frontend and backend production builds passed in the preparation environment.
No public application deployment, domain attachment, or DNS change has been made.
Build success does not verify runtime authentication, database persistence,
password-reset delivery, or narration.

The target address is `chat.manthan.blog`, a subdomain, not an HTML filename.
Do not change the root directory of the existing blog's Vercel project.

## Recommended architecture

Use a separate Vercel project for the frontend, connected to this repository
with root directory `chat/frontend`. Attach `chat.manthan.blog` to that project.
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
- `APP_URL`: `https://chat.manthan.blog`.
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

- Choose and authorize the persistent backend host, including any costs.
- Review rate limiting, signup abuse protection, privacy/deletion practices,
  and backup/restore procedures. Existing in-memory rate limits are not shared
  across processes or durable across restarts.
- Disable shared demo access and do not seed shared accounts in production.
- Apply migrations and confirm that data survives a backend restart.
- Start and verify the voice service, or clearly communicate its unavailability.
- Verify signup, login, logout, password reset, lesson creation, uploads, quizzes,
  and saved progress through the frontend origin.
- In the separate frontend project's domain settings, add `chat.manthan.blog`
  and use the exact DNS record Vercel supplies. Do not alter apex or `www` records.
- Verify HTTPS and repeat the runtime checks on the final subdomain.

No hosting subscription or paid service has been provisioned by this import.
