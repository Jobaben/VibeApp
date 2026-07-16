"""Desktop launcher for VibeApp — one self-contained server for non-technical users.

This module boots the FastAPI backend, serves the pre-built React frontend from
the *same* origin (so there is nothing to configure), seeds sample stock data on
first run, and opens the user's default web browser. It is designed to be frozen
into a single Windows ``.exe`` with PyInstaller so the whole app is a
double-click away — no Python, Node, terminal, or setup required.

Run from source for testing:

    python desktop_app.py
"""
from __future__ import annotations

import os
import socket
import sys
import threading
import time
import urllib.request
import webbrowser
from pathlib import Path

APP_NAME = "VibeApp"
PREFERRED_PORT = 8000


def _is_frozen() -> bool:
    """True when running from a PyInstaller-built executable."""
    return getattr(sys, "frozen", False)


def _resource_dir() -> Path:
    """Directory that holds bundled, read-only resources (frontend build, etc.)."""
    if _is_frozen():
        # PyInstaller unpacks data files here at runtime.
        return Path(getattr(sys, "_MEIPASS"))
    return Path(__file__).resolve().parent


def _exe_dir() -> Path:
    """Directory the executable (or this script) lives in."""
    if _is_frozen():
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def _data_dir() -> Path:
    """Per-user writable directory for the database and user config.

    Using a user-writable location means the app works even when installed in a
    read-only folder like ``C:\\Program Files``.
    """
    if os.name == "nt":
        base = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
        directory = Path(base) / APP_NAME
    else:
        directory = Path(os.path.expanduser("~")) / ".vibeapp"
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def _frontend_dist() -> Path | None:
    """Locate the built frontend (``index.html`` + assets), if present."""
    candidates = [
        _resource_dir() / "frontend_dist",  # bundled into the executable
        Path(__file__).resolve().parent.parent / "frontend" / "dist",  # source tree
    ]
    for candidate in candidates:
        if (candidate / "index.html").exists():
            return candidate
    return None


def _find_free_port(preferred: int = PREFERRED_PORT) -> int:
    """Return a usable localhost port, preferring the well-known one."""
    for port in (preferred, 8080, 8888, 0):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            try:
                sock.bind(("127.0.0.1", port))
                return sock.getsockname()[1]
            except OSError:
                continue
    return preferred


def _load_user_env() -> None:
    """Load optional user overrides from a ``.env`` beside the exe or in app data.

    Existing real environment variables always win, so this only fills gaps. Users
    who want AI insights can drop a ``.env`` with ``ANTHROPIC_API_KEY=...`` and
    ``LLM_ENABLED=true`` next to the executable.
    """
    try:
        from dotenv import load_dotenv
    except Exception:  # pragma: no cover - dotenv is a hard dependency in practice
        return
    for env_path in (_exe_dir() / ".env", _data_dir() / ".env"):
        if env_path.exists():
            load_dotenv(env_path, override=False)


def _configure_environment() -> None:
    """Apply sensible, zero-config defaults for an offline desktop user.

    Must run *before* importing the application so ``Settings`` picks these up.
    """
    data_dir = _data_dir()
    db_path = (data_dir / "stockfinder.db").as_posix()
    defaults = {
        "DATABASE_URL": f"sqlite:///{db_path}",
        "DEBUG": "false",
        "ENVIRONMENT": "production",
        "REDIS_ENABLED": "false",
        # Real data by default; the Yahoo client falls back to bundled mock
        # data automatically when the machine is offline.
        "USE_REAL_STOCK_API": "true",
        # AI insights require an Anthropic API key. Off by default so the app
        # never errors for users without one; enable via a user .env file.
        "LLM_ENABLED": "false",
    }
    for key, value in defaults.items():
        os.environ.setdefault(key, value)


def _seed_if_empty() -> None:
    """Populate the database with sample stocks the first time the app runs."""
    from app.infrastructure.database import Base, engine
    from app.infrastructure.database.session import SessionLocal
    from app.features.stocks.models import Stock

    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        already_seeded = session.query(Stock).count() > 0
    finally:
        session.close()

    if already_seeded:
        return

    try:
        from seed_data import seed_stocks

        print("Setting up sample data (first run only)...")
        seed_stocks()
    except Exception as exc:  # pragma: no cover - seeding is best-effort
        print(f"Warning: could not seed sample data: {exc}")


def _build_app():
    """Import the FastAPI app and attach static frontend serving."""
    from main import app

    dist = _frontend_dist()
    if dist is None:
        print("Warning: frontend build not found; only the API will be available.")
        return app

    from fastapi.staticfiles import StaticFiles
    from starlette.responses import FileResponse

    index_file = dist / "index.html"

    # The API defines a JSON handler at "/"; drop it so the browser landing page
    # is the actual app instead of a raw JSON blob.
    app.router.routes = [
        route
        for route in app.router.routes
        if not (getattr(route, "path", None) == "/" and "GET" in getattr(route, "methods", set()))
    ]

    # Serve hashed build assets directly with correct mime types.
    assets_dir = dist / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # SPA fallback: this catch-all is registered last, so the API routes and
    # /docs declared earlier always take precedence. Any other GET serves a real
    # file when one exists, otherwise index.html for client-side routing.
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        candidate = dist / full_path
        if full_path and candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(str(index_file))

    return app


def _open_browser_when_ready(url: str, timeout: float = 30.0) -> None:
    """Poll the health endpoint, then open the browser once the server is up."""
    health_url = f"{url}/health"
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(health_url, timeout=1) as response:
                if response.status == 200:
                    break
        except Exception:
            time.sleep(0.3)
    try:
        webbrowser.open(url)
    except Exception:
        pass


def main() -> None:
    _load_user_env()
    _configure_environment()
    _seed_if_empty()

    app = _build_app()
    port = _find_free_port()
    url = f"http://127.0.0.1:{port}"

    threading.Thread(target=_open_browser_when_ready, args=(url,), daemon=True).start()

    banner = (
        "\n"
        "  ============================================================\n"
        f"   {APP_NAME} is now running!\n"
        "\n"
        f"   Open this address in your browser if it doesn't open\n"
        f"   automatically:  {url}\n"
        "\n"
        "   Keep this window open while you use the app.\n"
        "   Close this window (or press Ctrl+C) to stop the app.\n"
        "  ============================================================\n"
    )
    print(banner, flush=True)

    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")


if __name__ == "__main__":
    import multiprocessing

    # Required so PyInstaller one-file builds don't re-spawn the app.
    multiprocessing.freeze_support()
    main()
