#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3.12 -m venv .venv-voice
.venv-voice/bin/pip install -r voice/requirements.txt
mkdir -p voice/models
curl -L --fail --retry 2 https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.0.onnx -o voice/models/kokoro-v1.0.onnx
curl -L --fail --retry 2 https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/voices-v1.0.bin -o voice/models/voices-v1.0.bin
printf '\nReady. Start narration with:\n.venv-voice/bin/python -m uvicorn voice.server:app --host 127.0.0.1 --port 8101\n'
