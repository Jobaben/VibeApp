# VibeApp as a Windows App

This project can be packaged into a **single Windows executable** (`VibeApp.exe`)
that anyone can run by double-clicking — no Python, no Node.js, no terminal, and
no setup. The executable bundles the backend, the Python runtime, and the
pre-built web interface, starts a local server, and opens the browser
automatically.

## For end users

1. Download `VibeApp-Windows.zip` (from the project's GitHub **Releases** page,
   or from the **Actions → Build Windows App** run as a build artifact).
2. Right-click the zip → **Extract All**.
3. Double-click **`VibeApp.exe`**.
4. The browser opens to the app. Keep the small black window open while using it;
   close it to stop the app.

See `packaging/README-WINDOWS.txt` for the full, plain-language guide that ships
inside the zip.

> First launch may trigger Windows SmartScreen ("Windows protected your PC")
> because the build is unsigned. Click **More info → Run anyway**.

## How it works

| Piece | Role |
|-------|------|
| `backend/desktop_app.py` | Launcher: configures zero-config defaults, seeds sample data on first run, serves the built frontend and the API from one origin, and opens the browser. |
| `packaging/vibeapp.spec` | PyInstaller recipe that freezes everything into `VibeApp.exe`. |
| `.github/workflows/windows-build.yml` | Builds, smoke-tests, and publishes the `.exe` on a Windows runner. |

The frontend is built with `VITE_API_URL=/api` so it talks to the same server
that serves it — there is no separate port or CORS configuration for users.

User data (the SQLite database and optional `.env`) lives in
`%LOCALAPPDATA%\VibeApp`, so the app works even from a read-only install
location.

## Building the executable

### Automatically (recommended)

Push to the build branch or create a `v*` tag, or run the **Build Windows App**
workflow manually from the GitHub Actions tab. Download `VibeApp-Windows.zip`
from the run's artifacts (or the release, for tags).

### Locally on a Windows machine

```powershell
# 1. Build the frontend
cd frontend
npm ci
$env:VITE_API_URL = "/api"
npm run build
cd ..

# 2. Build the executable
cd backend
python -m pip install -r requirements.txt
pip install pyinstaller==6.20.0
cd ..
pyinstaller packaging/vibeapp.spec --noconfirm

# Result: dist/VibeApp.exe
```

> PyInstaller does not cross-compile. A Windows `.exe` must be built on Windows
> (which is exactly what the GitHub Actions workflow does for you).

## Enabling AI insights (optional)

AI insights are off by default so the app never errors for users without an API
key. To enable them, place a `.env` next to `VibeApp.exe` with:

```
ANTHROPIC_API_KEY=sk-ant-...
LLM_ENABLED=true
```
