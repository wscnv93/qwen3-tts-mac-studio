#!/bin/sh
# Build the standalone backend binary (PyInstaller) consumed by electron-builder
# as extraResources. Run from anywhere; paths are repo-relative.
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
PY="$ROOT/.venv/bin/python"

if [ ! -x "$PY" ]; then
  echo "error: $PY not found — the backend venv is required to build" >&2
  exit 1
fi

"$PY" -m PyInstaller --noconfirm \
  --distpath "$ROOT/app/backend-dist" \
  --workpath "$ROOT/build/pyinstaller" \
  "$ROOT/backend.spec"

echo "backend binary ready: $ROOT/app/backend-dist/server/server"
