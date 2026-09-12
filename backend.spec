# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec for the Qwen3-TTS backend (server.py) — macOS arm64, onedir.
# Slimmed: drops heavy transitive deps the server never touches at runtime.
from PyInstaller.utils.hooks import collect_all, collect_submodules, collect_data_files

datas, binaries, hiddenimports = [], [], []

# qwen_tts may load config/tokenizer data by path — keep its files and submodules
for pkg in ("qwen_tts",):
    d, b, h = collect_all(pkg)
    datas += d
    binaries += b
    hiddenimports += h

hiddenimports += [
    # uvicorn[standard] resolves these through importlib at runtime
    "uvicorn.logging",
    "uvicorn.loops", "uvicorn.loops.auto", "uvicorn.loops.asyncio", "uvicorn.loops.uvloop",
    "uvicorn.protocols", "uvicorn.protocols.http", "uvicorn.protocols.http.auto",
    "uvicorn.protocols.http.h11_impl", "uvicorn.protocols.http.httptools_impl",
    "uvicorn.protocols.websockets", "uvicorn.protocols.websockets.auto",
    "uvicorn.protocols.websockets.websockets_impl", "uvicorn.protocols.websockets.wsproto_impl",
    "uvicorn.lifespan", "uvicorn.lifespan.on", "uvicorn.lifespan.off",
]

a = Analysis(
    ["server.py"],
    pathex=["."],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    excludes=[
        # transitive deps of modelscope/gradio chains — unused by server.py
        # (onnxruntime / numba+llvmlite look trimmable but qwen_tts→librosa needs them)
        "gradio", "pandas", "sklearn",
        "matplotlib", "IPython", "jupyter", "tkinter", "pyarrow", "tensorboard",
        "torch.utils.tensorboard",
    ],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="server",
    console=True,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    name="server",
)
