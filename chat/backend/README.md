# Manthan MVP: backend

This is a separate Next.js API service for authentication, profiles, lesson
generation, PDF/text parsing, quizzes, saved progress, and private neural narration.
It runs on port 3001; the frontend proxies its API from port 3000.

No Render, Vercel, or other paid hosting is configured in these downloads. No paid
AI or email API is enabled. All three folders must be siblings; see `START-HERE.md`.

```sh
npm ci
cp .env.example .env
npm run db:setup
npm run dev
```

Database generation/migrations use `../database/schema.prisma`. The seed is
idempotent and creates only the documented sample account and sample lessons:
`ada@manthan.education` / `ManthanDemo!`. Use separate accounts for personal data.

## Natural narration

Requires Python 3.12 and curl. macOS/Linux/WSL:

```sh
bash voice/setup.sh
.venv-voice/bin/python -m uvicorn voice.server:app --host 127.0.0.1 --port 8101
```

Keep this third terminal running while using Warm or Clear. The setup downloads
about 350 MB of public model assets plus Python packages; synthesis then runs on
your own computer, without a paid speech API. Allow roughly 2 GB RAM for the app
and model at light usage, with additional headroom for your OS and other programs.

For native Windows PowerShell:

```powershell
py -3.12 -m venv .venv-voice
.\.venv-voice\Scripts\python.exe -m pip install -r voice\requirements.txt
New-Item -ItemType Directory -Force voice\models
curl.exe -L --fail https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.0.onnx -o voice\models\kokoro-v1.0.onnx
curl.exe -L --fail https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/voices-v1.0.bin -o voice\models\voices-v1.0.bin
.\.venv-voice\Scripts\python.exe -m uvicorn voice.server:app --host 127.0.0.1 --port 8101
```

The Python engine uses [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx)
and the [Kokoro model](https://huggingface.co/hexgrad/Kokoro-82M).
If the worker is not running, the player shows a recoverable error and allows
silent reading or the explicit Device voice option. It does not silently switch
back to robotic dictation. Model binaries are deliberately excluded from the ZIP.

## Local sessions and reset testing

Open the app using `http://localhost:3000` so it matches `APP_URL`. Modern browsers
treat localhost as a special secure development context, allowing the Secure
HttpOnly cookie used here. If your browser blocks it, use local HTTPS rather than
removing cookie security flags. On another device or domain, use HTTPS and update
`APP_URL`; this package does not deploy or provision a public host.

In development, password resets appear in the local development mailbox:
http://localhost:3000/dev/mailbox. No email is sent. Production-mode reset email
requires a separately configured provider.

The default generator supports a small set of curated topics and extractive lessons
from your notes. Unknown topics yield an explicitly labeled study framework; this
is not an unrestricted AI tutor. Assignments use practice examples, not answer keys.

Do not expose this local demo as a public production service without reviewing
demo access, email delivery, backups, rate limiting, and privacy/deletion policies.
