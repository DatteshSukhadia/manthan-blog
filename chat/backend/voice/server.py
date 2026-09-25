"""Private, local neural narration worker. Only the authenticated Next API calls it."""
import hashlib
import io
import os
import re
import threading
from pathlib import Path
from typing import Literal

import numpy as np
import onnxruntime as ort
import soundfile as sf
from fastapi import FastAPI
from fastapi.responses import Response
from kokoro_onnx import Kokoro
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
CACHE = Path(os.environ.get("VOICE_CACHE_DIR", str(ROOT / "cache")))
CACHE.mkdir(parents=True, exist_ok=True)
options = ort.SessionOptions()
options.intra_op_num_threads = 2
options.inter_op_num_threads = 1
session = ort.InferenceSession(
    str(ROOT / "models/kokoro-v1.0.onnx"),
    sess_options=options,
    providers=["CPUExecutionProvider"],
)
engine = Kokoro.from_session(session, str(ROOT / "models/voices-v1.0.bin"))
lock = threading.Lock()
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
VOICES = {"warm": "af_heart", "clear": "am_michael"}


class SpeechRequest(BaseModel):
    text: str = Field(min_length=1, max_length=6000)
    voice: Literal["warm", "clear"] = "warm"


def spoken_text(text: str) -> str:
    # Pronunciation only: keep the learner's transcript and facts unchanged.
    replacements = {
        "AI": "A I", "ML": "M L", "API": "A P I", "PDF": "P D F",
        "SQL": "S Q L", "SaMD": "software as a medical device",
    }
    for written, spoken in replacements.items():
        text = re.sub(r"\b" + written + r"\b", spoken, text)
    return text.replace("→", ", then ").replace(" ≠ ", " is not equal to ")


@app.get("/health")
def health():
    return {"ready": True, "engine": "kokoro", "voices": list(VOICES)}


@app.post("/synthesize")
def synthesize(body: SpeechRequest):
    text = spoken_text(body.text.strip())
    key = hashlib.sha256(f"v1|{body.voice}|{text}".encode()).hexdigest()
    destination = CACHE / f"{key}.wav"
    with lock:
        if destination.exists():
            data = destination.read_bytes()
        else:
            samples, sample_rate = engine.create(
                text, voice=VOICES[body.voice], speed=0.98, lang="en-us"
            )
            # A short, intentional breath at each scene boundary.
            samples = np.concatenate([samples, np.zeros(int(sample_rate * 0.22))])
            output = io.BytesIO()
            sf.write(output, samples, sample_rate, format="WAV", subtype="PCM_16")
            data = output.getvalue()
            temporary = destination.with_suffix(".tmp")
            temporary.write_bytes(data)
            os.replace(temporary, destination)
            # Bound cache growth; narration is reproducible, not source-of-truth data.
            entries = sorted(CACHE.glob("*.wav"), key=lambda p: p.stat().st_mtime)
            total = sum(p.stat().st_size for p in entries)
            for entry in entries:
                if total <= 500 * 1024 * 1024:
                    break
                total -= entry.stat().st_size
                entry.unlink(missing_ok=True)
    return Response(data, media_type="audio/wav")
