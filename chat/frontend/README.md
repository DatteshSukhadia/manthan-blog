# Manthan MVP: frontend

This is the complete Next.js/React interface, not a screenshot or a static mockup.
It includes the studio, tutorial player, voice controls, quiz, learning path,
accounts, dark mode, responsive styling, and official logo.

Extract the three downloads into the same parent folder:

```text
manthan-mvp/
  frontend/
  backend/
  database/
```

Read `START-HERE.md` first. This frontend expects the backend on port 3001 and proxies
`/api/*` to it, so the browser uses a single origin and does not require CORS setup.
It is not a GitHub Pages static export. No hosting service is required for local use.

```sh
npm ci
cp .env.example .env
npm run dev
```

Open http://localhost:3000. Keep the backend running in a second terminal.
For a local optimized build: `npm run build`, then `npm start`.

If you change ports, update `API_PROXY_TARGET` and the backend's `APP_URL` together.
The backend origin allow-list must match the URL you actually open in the browser.
Never place API keys or database credentials in this frontend.
