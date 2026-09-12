# Qwen3-TTS Mac Studio

**English** | [中文](#中文)

A native macOS client for [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS) — local speech synthesis and voice cloning with a friendly GUI and a bundled HTTP API.

- 🎙️ **Preset voices** — 9 built-in voices, 10 languages, natural-language style instructs
- 🧬 **Voice cloning** — record ~3 seconds with your mic (or upload a file) and speak anything in that voice
- 👥 **Voice presets** — save cloned voices, reuse them anytime; stored in your user data folder and **survive app updates**
- ⚙️ **Model manager** — configure model paths or one-click download from **ModelScope** or **HuggingFace**
- 🌐 **Bilingual UI** — 中文 / English, light theme
- 🔔 **Update checks** — notifies you when a new GitHub release is available

> ⚠️ **Ethics notice**: only clone voices you own or have explicit permission to use. Impersonating others without consent is prohibited.

## Quick start (macOS, Apple Silicon)

### 1. Install the app

Grab `Qwen3-TTS-x.x.x-arm64.dmg` from [Releases](../../releases), open it, drag **Qwen3-TTS** into *Applications*.

### 2. Prepare the backend

The app is a GUI on top of a local Python backend. Clone this repo, then:

```bash
cd qwen3-tts-mac-studio
python3.11 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

### 3. Point the app at the backend

Launch the app → **Settings → Backend directory** → select the cloned repo folder → restart the app.

### 4. Download models

**Settings → Models** — download either or both (each ~3.9 GB):

| Model | Purpose | Required by |
|---|---|---|
| `Qwen3-TTS-12Hz-1.7B-CustomVoice` | 9 preset voices, 10 languages, style instructs | Preset Voices tab |
| `Qwen3-TTS-12Hz-1.7B-Base` | Voice cloning from ~3 s reference audio | Voice Clone / My Voices tabs |

Choose **ModelScope** (fast in mainland China) or **HuggingFace** as the source. If you prefer to manage model files yourself, type a custom path instead — the download UI hides itself and the app reports an error at synthesis time if the model is missing.

### 5. Use it

- **Preset Voices** — pick a voice, type text, Generate. Add a style instruct like *"Very happy."* (built-in voices only).
- **Voice Clone** — record/upload reference audio + its transcript → Clone & Synthesize. Or **💾 Save as voice preset** to keep the voice.
- **My Voices** — registered presets; synthesize with one click, delete with 🗑.
- Generated audio can be saved as WAV.

## HTTP API

The backend also exposes a local REST API (`127.0.0.1:9880`) you can call from scripts:

```bash
# Preset voice synthesis
curl -s -X POST http://127.0.0.1:9880/tts -H "Content-Type: application/json" \
  -d '{"text": "Hello!", "speaker": "ryan"}' -o out.wav

# One-shot voice clone (ref_audio: local path / URL / base64)
curl -s -X POST http://127.0.0.1:9880/clone -H "Content-Type: application/json" \
  -d '{"text": "Hello!", "ref_audio": "ref.wav", "ref_text": "reference words"}' -o out.wav

# Register a reusable preset, then generate by voice_id
curl -s -X POST http://127.0.0.1:9880/clone/voice -H "Content-Type: application/json" \
  -d '{"ref_audio": "ref.wav", "ref_text": "reference words", "name": "me"}'
curl -s -X POST http://127.0.0.1:9880/clone/generate -H "Content-Type: application/json" \
  -d '{"voice_id": "<id>", "text": "Hi again"}' -o out.wav
```

Other endpoints: `GET /health`, `GET /speakers`, `GET /config`, `POST /config`, `POST /models/download`, `GET /models/download/status`, `GET /clone/voices`, `DELETE /clone/voice/{id}`.

## CLI scripts

```bash
# Preset voice
.venv/bin/python infer.py "今天天气真不错" --speaker vivian -o hello.wav

# Voice clone
.venv/bin/python infer_clone.py "要说的话" --ref-audio ref.wav --ref-text "参考音频原话" -o clone.wav
```

## Data & config locations

| Item | Path (macOS) |
|---|---|
| Config | `~/Library/Application Support/Qwen3-TTS-Mac-Studio/config.json` |
| Voice presets | `~/Library/Application Support/Qwen3-TTS-Mac-Studio/voices/` |
| Default models | `~/Library/Application Support/Qwen3-TTS-Mac-Studio/models/` |

Model files are never committed to this repo — download them in-app or place them manually.

## FAQ

- **Synthesis fails with a model-missing error** — Settings → Models shows each model's status; download it or fix the path.
- **Microphone denied** — System Settings → Privacy & Security → Microphone → allow Qwen3-TTS.
- **Cloning sounds off** — use clean 3–10 s reference audio and always provide the transcript.
- **Clone presets don't react to style instructs** — instruct control is a CustomVoice-only capability by design; bake emotion into the reference audio or the text instead.
- **Linux/NVIDIA** — the backend picks CUDA automatically when available; the packaged .app targets macOS but the server/scripts run anywhere.

## License

MIT. Model weights are released by the [Qwen team](https://github.com/QwenLM/Qwen3-TTS) under Apache-2.0.

---

## 中文

[English](#qwen3-tts-mac-studio) | **中文**

基于 [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS) 的 macOS 原生客户端:本地语音合成 + 声音克隆,带图形界面和 HTTP API。

- 🎙️ **预置音色** —— 9 种内置音色、10 种语言、自然语言风格指令
- 🧬 **声音克隆** —— 麦克风录 3 秒(或上传音频)+ 逐字稿,即可用该音色说任意内容
- 👥 **我的音色** —— 克隆音色保存为预设,可随时复用;存于用户数据目录,**应用更新不丢失**
- ⚙️ **模型管理** —— 自定义模型路径,或从 **ModelScope / HuggingFace** 一键下载
- 🌐 **中英文界面**、浅色主题
- 🔔 **版本更新提示** —— 有新 Release 时自动提醒

> ⚠️ **使用规范**:仅克隆自己拥有或已获授权的声音,禁止未经授权模仿他人。

### 快速开始

1. 从 [Releases](../../releases) 下载 `Qwen3-TTS-x.x.x-arm64.dmg`,拖入「应用程序」;
2. 克隆本仓库并安装后端依赖:
   ```bash
   cd qwen3-tts-mac-studio
   python3.11 -m venv .venv
   .venv/bin/pip install -r requirements.txt
   ```
3. 启动应用 → **设置 → 后端服务目录** → 选择仓库文件夹 → 重启应用;
4. **设置 → 模型管理** → 按需下载两个模型之一或全部(各约 3.9GB,ModelScope 国内快,HuggingFace 国际快;也可自己填写已有模型路径);
5. 开始使用:「预置音色」选音色合成;「声音克隆」录音克隆并可「💾 存为预设音色」。

### 常见问题

- **合成报模型缺失** —— 设置 → 模型管理 里查看状态,下载或修正路径;
- **麦克风被拒** —— 系统设置 → 隐私与安全性 → 麦克风 → 勾选 Qwen3-TTS;
- **克隆不像** —— 用 3~10 秒干净人声,并务必填写逐字稿;
- **克隆预设不支持风格指令** —— 指令控制是 CustomVoice 模型独有能力;想带情绪,把它录进参考音频或写进文本。

### 数据位置

配置、音色预设、默认模型目录均在 `~/Library/Application Support/Qwen3-TTS-Mac-Studio/`。模型文件不进仓库,应用内下载或自行放置。

## License

MIT。模型权重由 [Qwen 团队](https://github.com/QwenLM/Qwen3-TTS)以 Apache-2.0 发布。
