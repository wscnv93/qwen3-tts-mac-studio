#!/usr/bin/env python3
"""Qwen3-TTS 音色克隆推理脚本(Base 模型)。

用法示例:
    .venv/bin/python infer_clone.py "用克隆音色说的任意文本" \
        --ref-audio ref.wav --ref-text "参考音频里说的原话" -o clone.wav

省略 --ref-text 时自动使用 x-vector-only 模式(无需文字,音质略降)。
"""
import argparse
import os
import sys
import time

import soundfile as sf
import torch

from qwen_tts import Qwen3TTSModel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_ID = "Qwen/Qwen3-TTS-12Hz-1.7B-Base"


def default_model_dir() -> str:
    if sys.platform == "darwin":
        root = os.path.join(os.path.expanduser("~"), "Library", "Application Support", "Qwen3-TTS-Mac-Studio", "models")
    else:
        root = os.path.join(os.path.expanduser("~"), ".config", "qwen3-tts-mac-studio", "models")
    return os.path.join(root, MODEL_ID.split("/")[-1])


CLONE_MODEL_DIR = os.environ.get("QWEN_TTS_MODEL_DIR") or default_model_dir()


def pick_device() -> str:
    if torch.cuda.is_available():
        return "cuda:0"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def load_model() -> Qwen3TTSModel:
    device = os.environ.get("QWEN_TTS_DEVICE") or pick_device()
    dtype = torch.bfloat16 if device != "cpu" else torch.float32
    print(f"加载克隆模型: {CLONE_MODEL_DIR}\n设备: {device}, dtype: {dtype}")
    return Qwen3TTSModel.from_pretrained(CLONE_MODEL_DIR, device_map=device, dtype=dtype)


def main() -> None:
    parser = argparse.ArgumentParser(description="Qwen3-TTS 音色克隆")
    parser.add_argument("text", help="要合成的文本")
    parser.add_argument("--ref-audio", required=True, help="参考音频路径(约 3 秒以上)")
    parser.add_argument("--ref-text", default=None, help="参考音频对应的文字(省略则用 x-vector-only 模式)")
    parser.add_argument("--language", default="Auto")
    parser.add_argument("-o", "--output", default="clone.wav", help="输出 wav 路径")
    args = parser.parse_args()

    t0 = time.time()
    model = load_model()
    print(f"模型加载耗时 {time.time() - t0:.1f}s")

    t1 = time.time()
    if args.ref_text:
        wavs, sr = model.generate_voice_clone(
            text=args.text,
            language=args.language,
            ref_audio=args.ref_audio,
            ref_text=args.ref_text,
        )
    else:
        wavs, sr = model.generate_voice_clone(
            text=args.text,
            language=args.language,
            ref_audio=args.ref_audio,
            x_vector_only_mode=True,
        )
    print(f"合成耗时 {time.time() - t1:.1f}s")

    audio = wavs[0]
    if hasattr(audio, "float"):  # torch.Tensor → numpy
        audio = audio.float().cpu().numpy()
    sf.write(args.output, audio, sr)
    print(f"已写入 {args.output} (采样率 {sr} Hz)")


if __name__ == "__main__":
    main()
