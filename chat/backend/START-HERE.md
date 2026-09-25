# Manthan: free local MVP

These three source packages run together on your computer. No paid service has
been activated, and no deployment or DNS change is required.

## Extract the downloads

Extract all three ZIPs into the same parent directory, preserving these siblings:

```text
manthan-mvp/
  frontend/
  backend/
  database/
```

Requires Node.js 20 or newer and npm. Natural narration additionally requires
Python 3.12 and approximately 350 MB of downloaded model files plus dependencies.

## Start the backend

In terminal one:

```sh
cd backend
npm ci
cp .env.example .env
npm run db:setup
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp` if needed.
The API runs at http://127.0.0.1:3001. SQLite lives in `database/manthan.db`.

## Start the frontend

In terminal two:

```sh
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Open **http://localhost:3000**. Create an account or choose the seeded demo:
`ada@manthan.education` / `ManthanDemo!`.

## Start the natural narrator

In terminal three, from `backend/`:

```sh
bash voice/setup.sh
.venv-voice/bin/python -m uvicorn voice.server:app --host 127.0.0.1 --port 8101
```

Run the setup only once. Keep the Python worker running for Warm and Clear voices.
Native Windows steps are included in `backend/README.md`. Without the worker you
can still read lessons silently or explicitly select Device narration.

## What works without paid APIs

- Account creation, login, onboarding, profiles, and saved learning paths.
- Curated local topic tutorials and extractive lessons from uploaded notes.
- Animated scenes, quizzes, progress, transcripts, and local neural narration.
- Local development-mailbox testing for password resets; no real emails are sent.

The local generator is deliberately limited, not a general-purpose model. No paid
model keys, hosting subscriptions, learner data, or Render configuration are in
these archives. Initial dependency/model downloads require internet access.

## Technical layout

The frontend and backend are independently runnable Next.js projects. A frontend
rewrite proxies `/api/*` to the backend, keeping cookies on the frontend origin.
The database package is a SQLite file and Prisma schema, not a third server.

Source is suitable for an MVP. Public hosting, a custom-domain deployment,
production email, and production hardening are separate tasks, not included here.
Your original blog and Squarespace domain remain unchanged.
