# Running VibeApp in GitHub Codespaces

## Automatic Setup

When you open this repo in a Codespace, the dev container installs all dependencies automatically. Once the Codespace finishes building, you're ready to start the app.

## Starting the App

Open **two terminals** in your Codespace (Terminal > New Terminal):

**Terminal 1 -- Backend:**

```bash
./run_backend.sh
```

**Terminal 2 -- Frontend:**

```bash
./run_frontend.sh
```

The Codespace will detect the forwarded ports and show a notification. Click **Open in Browser** for port 3000 to see the frontend.

### Manual start (alternative)

```bash
# Terminal 1
cd backend
source venv/bin/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2
cd frontend
npm run dev
```

## Accessing the App

After starting both services, go to the **Ports** tab in your Codespace:

| Port | Service              | Visibility |
|------|----------------------|------------|
| 3000 | Frontend (React)     | Public URL auto-generated |
| 8000 | Backend API (FastAPI) | Public URL auto-generated |

Click the globe icon or the forwarded URL next to port 3000 to open the app in your browser.

- **API Docs (Swagger):** Open the port-8000 URL and append `/docs`
- **Health check:** Open the port-8000 URL and append `/health`

## First-Time Setup (if automatic setup didn't run)

If you opened the repo without the dev container, run the setup manually:

```bash
./setup.sh
```

This creates virtual environments, installs dependencies, configures `.env` files, and initializes the SQLite database.

## Environment Details

- **Database:** SQLite (file-based, no external service needed)
- **Redis:** Disabled in local/Codespaces dev mode
- **Stock data:** Mock data enabled by default (no API keys required)
- **Hot reload:** Both backend (uvicorn) and frontend (Vite HMR) auto-reload on file changes

## Troubleshooting

### Port not forwarding
Open the **Ports** tab, click **Add Port**, and enter `3000` or `8000`.

### Backend won't start
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python -c "from app.infrastructure.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### Frontend won't start
```bash
cd frontend
rm -rf node_modules
npm install
```

### CORS errors in browser
The backend is configured to accept requests from any origin in development (`CORS_ORIGINS=*`). If you still see CORS errors, make sure both services are running and you're using the Codespaces forwarded URLs (not `localhost`).
