# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec that freezes VibeApp into one self-contained executable.

Bundles the FastAPI backend, the Python runtime, and the pre-built React
frontend (``frontend/dist``) so end users get a single file to double-click.

Build (from the repo root, on the target OS):

    pyinstaller packaging/vibeapp.spec --noconfirm

The frontend must be built first (``npm run build`` in ``frontend/``).
"""
import os

from PyInstaller.utils.hooks import (
    collect_data_files,
    collect_submodules,
    copy_metadata,
)

# SPECPATH is the directory containing this spec file (injected by PyInstaller).
REPO_ROOT = os.path.abspath(os.path.join(SPECPATH, os.pardir))
BACKEND_DIR = os.path.join(REPO_ROOT, "backend")
FRONTEND_DIST = os.path.join(REPO_ROOT, "frontend", "dist")

if not os.path.isdir(FRONTEND_DIST):
    raise SystemExit(
        "frontend/dist not found. Build the frontend first: "
        "cd frontend && npm ci && npm run build"
    )

# Ship the built single-page app alongside the backend so the server can serve
# it from the same origin. It lands at <bundle>/frontend_dist at runtime.
datas = [(FRONTEND_DIST, "frontend_dist")]

# Some libraries read their distribution metadata at runtime (version checks).
for dist in ("anthropic", "fastapi", "starlette", "uvicorn", "yfinance"):
    try:
        datas += copy_metadata(dist)
    except Exception:
        pass

# Pull in dynamically-imported submodules PyInstaller can't see statically.
hiddenimports = ["main", "seed_data"]
for package in (
    "app",
    "uvicorn",
    "anthropic",
    "passlib.handlers",
    "email_validator",
    "sqlalchemy.dialects.sqlite",
):
    hiddenimports += collect_submodules(package)

# pydantic-settings / dotenv style data files, if any.
datas += collect_data_files("anthropic")


a = Analysis(
    [os.path.join(BACKEND_DIR, "desktop_app.py")],
    pathex=[BACKEND_DIR],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["tkinter", "pytest", "black", "mypy", "flake8"],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="VibeApp",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # keep a window so users can see the "running" banner / close to stop
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
