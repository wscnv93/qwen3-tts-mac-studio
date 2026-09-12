#!/usr/bin/env python3
"""Qwen3-TTS 命令行推理脚本。

用法示例:
    .venv/bin/python infer.py "今天天气真不错,一起去公园走走吧。" \
        --speaker Vivian --instruct "Very happy." -o hello.wav
"""
import argparse
import os
import sys
import time

import soundfile as sf
import torch

from qwen_tts import Qwen3TTSModel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_ID = "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice"


def default_model_dir() -> str:
    if sys.platform == "darwin":
        root = os.path.join(os.path.expanduser("~"), "Library", "Application Support", "Qwen3-TTS-Mac-Studio", "models")
    else:
        root = os.path.join(os.path.expanduser("~"), ".config", "qwen3-tts-mac-studio", "models")
    return os.path.join(root, MODEL_ID.split("/")[-1])


MODEL_DIR = os.environ.get("QWEN_TTS_MODEL_DIR") or default_model_dir()


def pick_device() -> str:
    if torch.cuda.is_available():
        return "cuda:0"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def load_model() -> Qwen3TTSModel:
    device = os.environ.get("QWEN_TTS_DEVICE") or pick_device()
    dtype = torch.bfloat16 if device != "cpu" else torch.float32
    print(f"加载模型: {MODEL_DIR}\n设备: {device}, dtype: {dtype}")
    model = Qwen3TTSModel.from_pretrained(MODEL_DIR, device_map=device, dtype=dtype)
    if device == "mps":
        print("提示: 若 MPS 报错,可用 QWEN_TTS_DEVICE=cpu 重跑")
    return model


def main() -> None:
    parser = argparse.ArgumentParser(description="Qwen3-TTS 文本转语音")
    parser.add_argument("text", help="要合成的文本")
    parser.add_argument("-o", "--output", default="output.wav", help="输出 wav 路径")
    parser.add_argument("--speaker", default="vivian", help="预置音色(小写),见 README 音色列表")
    parser.add_argument("--language", default="Auto", help="Auto/Chinese/English/...")
    parser.add_argument("--instruct", default=None, help="风格指令,例如 'Very happy.'")
    args = parser.parse_args()

    t0 = time.time()
    model = load_model()
    print(f"模型加载耗时 {time.time() - t0:.1f}s")

    t1 = time.time()
    kwargs = {}
    if args.instruct:
        kwargs["instruct"] = args.instruct
    wavs, sr = model.generate_custom_voice(
        text=args.text,
        language=args.language,
        speaker=args.speaker,
        **kwargs,
    )
    print(f"合成耗时 {time.time() - t1:.1f}s")

    audio = wavs[0]
    if hasattr(audio, "float"):  # torch.Tensor → numpy
        audio = audio.float().cpu().numpy()
    sf.write(args.output, audio, sr)
    print(f"已写入 {args.output} (采样率 {sr} Hz)")


if __name__ == "__main__":
    main()
