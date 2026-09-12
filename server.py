#!/usr/bin/env python3
"""Qwen3-TTS Mac Studio — local HTTP backend (English API, bilingual app UI).

Data layout (user-level, survives app updates):
    <data_dir>/config.json      model paths & download settings
    <data_dir>/voices/          registered voice presets (persisted)
    <data_dir>/models/          default model download target

Env override: QWEN_TTS_DATA_DIR
"""
import base64
import io
import json
import os
import re
import subprocess
import sys
import threading
import time
import urllib.request
import uuid

import numpy as np
import soundfile as sf
import torch
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

from qwen_tts import Qwen3TTSModel

APP_NAME = "Qwen3-TTS-Mac-Studio"
VERSION = "1.0.0"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("QWEN_TTS_PORT", "9880"))

MODEL_IDS = {
    "custom_voice": "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice",
    "clone": "Qwen/Qwen3-TTS-12Hz-1.7B-Base",
}


def default_data_dir() -> str:
    if sys.platform == "darwin":
        return os.path.join(os.path.expanduser("~"), "Library", "Application Support", APP_NAME)
    return os.path.join(os.path.expanduser("~"), ".config", APP_NAME.lower())


DATA_DIR = os.environ.get("QWEN_TTS_DATA_DIR") or default_data_dir()
CONFIG_PATH = os.path.join(DATA_DIR, "config.json")
VOICES_DIR = os.path.join(DATA_DIR, "voices")
VOICES_META = os.path.join(VOICES_DIR, "voices.json")
DEFAULT_MODEL_ROOT = os.path.join(DATA_DIR, "models")

DEFAULT_CONFIG = {
    "custom_voice_model_path": "",   # empty -> DEFAULT_MODEL_ROOT/<model short name>
    "clone_model_path": "",
    "hf_endpoint": "https://huggingface.co",
}


# ---------- config ----------

def load_config() -> dict:
    cfg = dict(DEFAULT_CONFIG)
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH) as f:
                cfg.update({k: v for k, v in json.load(f).items() if k in DEFAULT_CONFIG})
        except Exception as e:  # noqa: BLE001
            print(f"[config] failed to read {CONFIG_PATH}: {e}")
    return cfg


def save_config(cfg: dict) -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(CONFIG_PATH, "w") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)


CONFIG = load_config()


def model_dir(key: str) -> str:
    custom = CONFIG.get("custom_voice_model_path") if key == "custom_voice" else CONFIG.get("clone_model_path")
    if custom:
        return custom
    short = MODEL_IDS[key].split("/")[-1]
    return os.path.join(DEFAULT_MODEL_ROOT, short)


def model_ready(key: str) -> bool:
    return os.path.exists(os.path.join(model_dir(key), "model.safetensors"))


# ---------- migrate legacy repo-level data (pre-open-source layout) ----------

def _migrate_legacy() -> None:
    legacy_voices = os.path.join(BASE_DIR, "voices")
    if os.path.exists(os.path.join(legacy_voices, "voices.json")) and not os.path.exists(VOICES_META):
        os.makedirs(DATA_DIR, exist_ok=True)
        try:
            os.rename(legacy_voices, VOICES_DIR)
            print(f"[migrate] moved {legacy_voices} -> {VOICES_DIR}")
        except Exception as e:  # noqa: BLE001
            print(f"[migrate] voices move failed: {e}")


_migrate_legacy()


# ---------- device & models (lazy) ----------

def pick_device() -> str:
    if torch.cuda.is_available():
        return "cuda:0"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


DEVICE = os.environ.get("QWEN_TTS_DEVICE") or pick_device()
DTYPE = torch.bfloat16 if DEVICE != "cpu" else torch.float32

_loaded: dict[str, Qwen3TTSModel | None] = {"custom_voice": None, "clone": None}
_load_locks = {k: threading.Lock() for k in _loaded}


def get_model(key: str) -> Qwen3TTSModel:
    if not model_ready(key):
        raise HTTPException(
            status_code=503,
            detail=f"Model {MODEL_IDS[key]} not found at '{model_dir(key)}'. "
                   "Open Settings in the app to configure the path or download it.",
        )
    if _loaded[key] is None:
        with _load_locks[key]:
            if _loaded[key] is None:
                print(f"[model] loading {MODEL_IDS[key]} from {model_dir(key)} ({DEVICE}, {DTYPE})")
                t0 = time.time()
                _loaded[key] = Qwen3TTSModel.from_pretrained(model_dir(key), device_map=DEVICE, dtype=DTYPE)
                print(f"[model] {key} loaded in {time.time() - t0:.1f}s")
    return _loaded[key]


def reset_models() -> None:
    """Drop loaded models (used after config path changes)."""
    for k in _loaded:
        _loaded[k] = None
    print("[model] loaded models reset (paths changed)")


SPEAKERS_FALLBACK = ["aiden", "dylan", "eric", "ono_anna", "ryan", "serena", "sohee", "uncle_fu", "vivian"]
LANGUAGES_FALLBACK = ["auto", "chinese", "english", "french", "german", "italian", "japanese",
                      "korean", "portuguese", "russian", "spanish"]


def speakers_list() -> list:
    m = _loaded.get("custom_voice")
    try:
        return m.get_supported_speakers() if m else SPEAKERS_FALLBACK
    except Exception:  # noqa: BLE001
        return SPEAKERS_FALLBACK


def languages_list() -> list:
    m = _loaded.get("custom_voice")
    try:
        return m.get_supported_languages() if m else LANGUAGES_FALLBACK
    except Exception:  # noqa: BLE001
        return LANGUAGES_FALLBACK


# ---------- model download ----------

_download = {"state": "idle", "model": None, "source": None, "percent": 0, "message": "", "target": ""}
_dl_lock = threading.Lock()
_PERCENT_RE = re.compile(r"(\d+)%")


def _bin_dir() -> str:
    return os.path.dirname(sys.executable)


def _download_worker(key: str, source: str, target: str) -> None:
    try:
        if source == "modelscope":
            exe = os.path.join(_bin_dir(), "modelscope")
            cmd = [exe, "download", "--model", MODEL_IDS[key], "--local_dir", target]
        else:
            exe = os.path.join(_bin_dir(), "hf")
            if not os.path.exists(exe):
                exe = os.path.join(_bin_dir(), "huggingface-cli")
            cmd = [exe, "download", MODEL_IDS[key], "--local-dir", target]
        env = dict(os.environ)
        if source == "hf":
            env["HF_ENDPOINT"] = CONFIG.get("hf_endpoint") or "https://huggingface.co"
        _download.update(message="starting", percent=0)
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env)
        for line in proc.stdout:
            m = _PERCENT_RE.search(line)
            if m:
                _download["percent"] = min(int(m.group(1)), 100)
            _download["message"] = line.strip()[-160:]
        proc.wait()
        if proc.returncode == 0 and os.path.exists(os.path.join(target, "model.safetensors")):
            _download.update(state="done", percent=100, message="download complete")
            print(f"[download] {key} ({source}) -> {target} complete")
        else:
            _download.update(state="error", message=f"download failed (exit {proc.returncode})")
    except Exception as e:  # noqa: BLE001
        _download.update(state="error", message=str(e)[:200])


def start_download(key: str, source: str) -> dict:
    if _download["state"] == "downloading":
        raise HTTPException(status_code=409, detail="Another download is already running")
    if key not in MODEL_IDS:
        raise HTTPException(status_code=400, detail=f"Unknown model key: {key!r}")
    if source not in ("modelscope", "hf"):
        raise HTTPException(status_code=400, detail=f"Unknown source: {source!r}")
    target = model_dir(key)
    os.makedirs(target, exist_ok=True)
    _download.update(state="downloading", model=key, source=source, percent=0,
                     message="starting", target=target)
    threading.Thread(target=_download_worker, args=(key, source, target), daemon=True).start()
    return {"detail": "download started", "model": key, "source": source, "target": target}


# ---------- voice preset persistence ----------

_meta_lock = threading.Lock()
_VOICES: dict[str, dict] = {}


def _load_voices_meta() -> dict:
    if not os.path.exists(VOICES_META):
        return {}
    try:
        with open(VOICES_META) as f:
            return json.load(f)
    except Exception as e:  # noqa: BLE001
        print(f"[voices] failed to read {VOICES_META}: {e}")
        return {}


def _save_voices_meta(meta: dict) -> None:
    os.makedirs(VOICES_DIR, exist_ok=True)
    with open(VOICES_META, "w") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)


def _restore_voices() -> None:
    for vid, m in _load_voices_meta().items():
        wav_path = os.path.join(VOICES_DIR, m["wav"])
        if not os.path.exists(wav_path):
            print(f"[voices] skip {vid}: missing {wav_path}")
            continue
        _VOICES[vid] = {"prompt": None, "wav_path": wav_path, "name": m.get("name"),
                        "ref_text": m.get("ref_text"), "created_at": m.get("created_at", "")}
    if _VOICES:
        print(f"[voices] restored {len(_VOICES)} preset(s) from disk")


_restore_voices()


def get_voice_prompt(voice_id: str):
    voice = _VOICES[voice_id]
    if voice.get("prompt") is None:
        clone_model = get_model("clone")
        voice["prompt"] = clone_model.create_voice_clone_prompt(
            ref_audio=voice["wav_path"],
            **({"ref_text": voice["ref_text"]} if voice["ref_text"] else {"x_vector_only_mode": True}),
        )
    return voice["prompt"]


def _ref_audio_bytes(ref_audio: str) -> bytes:
    if ref_audio.startswith("data:"):
        return base64.b64decode(ref_audio.split(",", 1)[1])
    if ref_audio.startswith(("http://", "https://")):
        with urllib.request.urlopen(ref_audio) as r:
            return r.read()
    with open(ref_audio, "rb") as f:
        return f.read()


# ---------- helpers ----------

def normalize_ref_audio(ref_audio: str) -> str:
    ref_audio = ref_audio.strip()
    if ref_audio.startswith(("http://", "https://", "data:")):
        return ref_audio
    if os.path.exists(ref_audio):
        return ref_audio
    if len(ref_audio) > 256:
        try:
            base64.b64decode(ref_audio, validate=True)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"ref_audio is neither an existing file nor valid base64: {e}") from e
        return "data:audio/wav;base64," + ref_audio
    raise HTTPException(status_code=400, detail=f"Reference audio not found: {ref_audio}")


def _wav_response(wavs, sr: int, t0: float, tag: str) -> Response:
    audio = wavs[0]
    if hasattr(audio, "float"):
        audio = audio.float().cpu().numpy()
    audio = np.squeeze(audio)
    buf = io.BytesIO()
    sf.write(buf, audio, sr, format="WAV")
    duration = len(audio) / sr
    print(f"[{tag}] generated {duration:.1f}s audio in {time.time() - t0:.1f}s")
    return Response(content=buf.getvalue(), media_type="audio/wav",
                    headers={"X-Audio-Duration": f"{duration:.2f}",
                             "X-Generation-Time": f"{time.time() - t0:.2f}"})


_lock = threading.Lock()  # serialize inference

app = FastAPI(title=f"{APP_NAME} API", version=VERSION)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ---------- system ----------

class ConfigUpdate(BaseModel):
    custom_voice_model_path: str | None = None
    clone_model_path: str | None = None
    hf_endpoint: str | None = None


@app.get("/health")
def health():
    return {
        "status": "ok", "app": APP_NAME, "version": VERSION, "device": DEVICE,
        "models": {
            "custom_voice": {"id": MODEL_IDS["custom_voice"], "path": model_dir("custom_voice"), "ready": model_ready("custom_voice")},
            "clone": {"id": MODEL_IDS["clone"], "path": model_dir("clone"), "ready": model_ready("clone")},
        },
        "registered_voices": len(_VOICES),
    }


@app.get("/config")
def get_config():
    return {"config": CONFIG, "data_dir": DATA_DIR,
            "defaults": {"custom_voice": os.path.join(DEFAULT_MODEL_ROOT, MODEL_IDS["custom_voice"].split("/")[-1]),
                         "clone": os.path.join(DEFAULT_MODEL_ROOT, MODEL_IDS["clone"].split("/")[-1])}}


@app.post("/config")
def update_config(req: ConfigUpdate):
    changed = False
    for field in ("custom_voice_model_path", "clone_model_path", "hf_endpoint"):
        val = getattr(req, field)
        if val is not None:
            val = val.strip()
            if CONFIG.get(field) != val:
                CONFIG[field] = val
                changed = True
    if changed:
        save_config(CONFIG)
        reset_models()
    return {"detail": "config updated", "config": CONFIG}


class DownloadRequest(BaseModel):
    model: str  # custom_voice | clone
    source: str  # modelscope | hf


@app.post("/models/download")
def models_download(req: DownloadRequest):
    return start_download(req.model, req.source)


@app.get("/models/download/status")
def models_download_status():
    return {k: v for k, v in _download.items()}


# ---------- preset voices (CustomVoice) ----------

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    speaker: str = Field("vivian")
    language: str = Field("auto")
    instruct: str | None = None


@app.get("/speakers")
def speakers():
    return {"speakers": speakers_list(), "languages": languages_list()}


@app.post("/tts")
def tts(req: TTSRequest):
    speaker = req.speaker.strip().lower()
    language = req.language.strip().lower()
    if speaker not in speakers_list():
        raise HTTPException(status_code=400, detail=f"Unknown speaker {req.speaker!r}, available: {speakers_list()}")
    model = get_model("custom_voice")
    t0 = time.time()
    with _lock:
        try:
            wavs, sr = model.generate_custom_voice(
                text=req.text, language=language, speaker=speaker,
                **({"instruct": req.instruct} if req.instruct else {}),
            )
        except HTTPException:
            raise
        except Exception as e:  # noqa: BLE001
            raise HTTPException(status_code=500, detail=f"Synthesis failed: {e}") from e
    return _wav_response(wavs, sr, t0, f"tts/{speaker}")


# ---------- voice cloning (Base) ----------

class CloneRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    ref_audio: str
    ref_text: str | None = None
    language: str = Field("auto")


class VoiceRegisterRequest(BaseModel):
    ref_audio: str
    ref_text: str | None = None
    name: str | None = None


class VoiceGenerateRequest(BaseModel):
    voice_id: str
    text: str = Field(..., min_length=1, max_length=2000)
    language: str = Field("auto")


@app.post("/clone")
def clone(req: CloneRequest):
    req.ref_audio = normalize_ref_audio(req.ref_audio)
    clone_model = get_model("clone")
    t0 = time.time()
    with _lock:
        try:
            wavs, sr = clone_model.generate_voice_clone(
                text=req.text, language=req.language, ref_audio=req.ref_audio,
                **({"ref_text": req.ref_text} if req.ref_text else {"x_vector_only_mode": True}),
            )
        except Exception as e:  # noqa: BLE001
            raise HTTPException(status_code=500, detail=f"Voice clone failed: {e}") from e
    return _wav_response(wavs, sr, t0, "clone")


@app.post("/clone/voice")
def register_voice(req: VoiceRegisterRequest):
    ref_audio = normalize_ref_audio(req.ref_audio)
    clone_model = get_model("clone")
    try:
        prompt = clone_model.create_voice_clone_prompt(
            ref_audio=ref_audio,
            **({"ref_text": req.ref_text} if req.ref_text else {"x_vector_only_mode": True}),
        )
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Voice registration failed: {e}") from e
    voice_id = uuid.uuid4().hex[:8]
    _VOICES[voice_id] = {"prompt": prompt, "wav_path": None, "name": req.name,
                         "ref_text": req.ref_text, "created_at": time.strftime("%Y-%m-%d %H:%M:%S")}
    try:  # persist: survives app updates & restarts
        os.makedirs(VOICES_DIR, exist_ok=True)
        wav_name = f"{voice_id}.wav"
        with open(os.path.join(VOICES_DIR, wav_name), "wb") as f:
            f.write(_ref_audio_bytes(ref_audio))
        _VOICES[voice_id]["wav_path"] = os.path.join(VOICES_DIR, wav_name)
        with _meta_lock:
            meta = _load_voices_meta()
            meta[voice_id] = {"wav": wav_name, "name": req.name, "ref_text": req.ref_text,
                              "created_at": _VOICES[voice_id]["created_at"]}
            _save_voices_meta(meta)
    except Exception as e:  # noqa: BLE001
        print(f"[voices] persist failed for {voice_id} (usable in this session): {e}")
    return {"voice_id": voice_id, "name": req.name, "detail": "Voice preset saved"}


@app.get("/clone/voices")
def list_voices():
    return {"voices": [
        {"voice_id": vid, "name": v["name"], "ref_text": v["ref_text"], "created_at": v["created_at"]}
        for vid, v in _VOICES.items()
    ]}


@app.get("/clone/voice/{voice_id}/reference")
def get_voice_reference(voice_id: str):
    if voice_id not in _VOICES:
        raise HTTPException(status_code=404, detail=f"Unknown voice_id: {voice_id!r}, see GET /clone/voices")
    wav_path = _VOICES[voice_id]["wav_path"]
    if not os.path.exists(wav_path):
        raise HTTPException(status_code=404, detail="Reference audio file is missing")
    return Response(content=_ref_audio_bytes(wav_path), media_type="audio/wav")


@app.delete("/clone/voice/{voice_id}")
def delete_voice(voice_id: str):
    if voice_id not in _VOICES:
        raise HTTPException(status_code=404, detail=f"Unknown voice_id: {voice_id!r}")
    _VOICES.pop(voice_id)
    with _meta_lock:
        meta = _load_voices_meta()
        info = meta.pop(voice_id, None)
        _save_voices_meta(meta)
    if info:
        wav_path = os.path.join(VOICES_DIR, info["wav"])
        if os.path.exists(wav_path):
            os.remove(wav_path)
    return {"detail": f"Voice {voice_id} deleted"}


@app.post("/clone/generate")
def clone_generate(req: VoiceGenerateRequest):
    if req.voice_id not in _VOICES:
        raise HTTPException(status_code=404, detail=f"Unknown voice_id: {req.voice_id!r}, see GET /clone/voices")
    clone_model = get_model("clone")
    t0 = time.time()
    with _lock:
        try:
            wavs, sr = clone_model.generate_voice_clone(
                text=req.text, language=req.language, voice_clone_prompt=get_voice_prompt(req.voice_id),
            )
        except Exception as e:  # noqa: BLE001
            raise HTTPException(status_code=500, detail=f"Synthesis failed: {e}") from e
    return _wav_response(wavs, sr, t0, f"clone/{req.voice_id}")


if __name__ == "__main__":
    print(f"[{APP_NAME}] v{VERSION} | data dir: {DATA_DIR}")
    uvicorn.run(app, host=os.environ.get("QWEN_TTS_HOST", "127.0.0.1"), port=PORT)
