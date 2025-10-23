# Quick Start Guide - Local Development

Get the Avanza Stock Finder running locally with Python and Node.js (no Docker required).

---

## 📋 Prerequisites

- **Python 3.11+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** (to clone the repository)

### Verify Installation

```bash
python3 --version   # Should be 3.11 or higher
node --version      # Should be 18 or higher
npm --version       # Should be 9 or higher
```

---

## 🚀 Quick Setup (Automated)

### Option 1: One-Command Setup

```bash
# From project root
./setup.sh
```

This will set up both backend and frontend automatically.

### Option 2: Manual Setup

If the automated script doesn't work, follow the manual steps below.

---

## 🐍 Backend Setup (Python/FastAPI)

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Create Virtual Environment

```bash
# Create venv
python3 -m venv venv

# Activate it
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Create Environment File

```bash
# Create .env file in backend directory
cat > .env << EOF
DATABASE_URL=sqlite:///./stockfinder.db
DEBUG=True
ENVIRONMENT=development
REDIS_ENABLED=False
ENABLE_AI_ENDPOINTS=True
EOF
```

Or manually create `backend/.env` with the content above.

### 5. Initialize Database

```bash
# Still in backend directory with venv activated
python -c "from app.infrastructure.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### 6. Run Backend

```bash
# From backend directory
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Backend should now be running at:**
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

---

## ⚛️ Frontend Setup (React/Vite)

### 1. Navigate to Frontend Directory

```bash
# From project root
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

```bash
# Create .env file in frontend directory
echo "VITE_API_URL=http://localhost:8000/api" > .env
```

Or manually create `frontend/.env`:
```
VITE_API_URL=http://localhost:8000/api
```

### 4. Run Frontend

```bash
# From frontend directory
npm run dev
```

**Frontend should now be running at:**
- App: http://localhost:3000

---

## ✅ Verify Everything Works

### Test Backend

```bash
# Health check
curl http://localhost:8000/health
# Expected: {"status":"healthy"}

# AI endpoints
curl http://localhost:8000/api/ai/health
# Expected: {"status":"healthy","service":"AI API",...}
```

### Test Frontend

Open browser and navigate to:
- http://localhost:3000 - Should see "Avanza Stock Finder - Coming Soon"

### Test AI Client (Python)

```bash
# From backend directory with venv activated
python

# In Python REPL:
>>> from app.ai_client import get_client
>>> client = get_client()
>>> health = client.health_check()
>>> print(health)
{'status': 'healthy'}
>>> exit()
```

---

## 🔄 Running After Initial Setup

After initial setup, you just need to start both services.

### Start Backend

```bash
# Option 1: Use script
./run_backend.sh

# Option 2: Manual
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend

```bash
# Option 1: Use script
./run_frontend.sh

# Option 2: Manual
cd frontend
npm run dev
```

**Tip:** Run backend and frontend in separate terminal windows/tabs.

---

## 🔧 Development Workflow

### Backend Changes

When you modify backend code:
- FastAPI auto-reloads (if `--reload` flag is used)
- Changes appear immediately
- Check terminal for errors

### Frontend Changes

When you modify frontend code:
- Vite HMR (Hot Module Replacement) auto-updates
- Browser refreshes automatically
- Check browser console for errors

### Database Changes

SQLite database is stored at `backend/stockfinder.db`

```bash
# View database (requires sqlite3)
sqlite3 backend/stockfinder.db

# In sqlite3:
.tables                  # List tables
.schema stocks          # View table schema
SELECT * FROM stocks;   # Query data
.quit                   # Exit
```

### Install New Python Package

```bash
cd backend
source venv/bin/activate
pip install package-name
pip freeze > requirements.txt  # Update requirements
```

### Install New Node Package

```bash
cd frontend
npm install package-name
# package.json and package-lock.json are updated automatically
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
source venv/bin/activate
pytest

# With coverage
pytest --cov=app --cov-report=html
```

### Frontend Tests

```bash
cd frontend
npm test
```

---

## 🐛 Troubleshooting

### Backend Won't Start

**Issue:** `ModuleNotFoundError`
```bash
# Make sure venv is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Reinstall dependencies
pip install -r requirements.txt
```

**Issue:** `Database locked`
```bash
# Close any other processes using the database
# Delete the database and reinitialize
rm backend/stockfinder.db
cd backend
python -c "from app.infrastructure.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

**Issue:** Port 8000 already in use
```bash
# Find and kill the process
# macOS/Linux:
lsof -ti:8000 | xargs kill -9

# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or change port in uvicorn command
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### Frontend Won't Start

**Issue:** `Cannot find module`
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue:** Port 3000 already in use
```bash
# Vite will automatically try ports 3001, 3002, etc.
# Or specify a port
npm run dev -- --port 3001
```

**Issue:** API calls failing (CORS errors)
```bash
# Make sure backend is running
curl http://localhost:8000/health

# Check CORS settings in backend/app/config.py
# Should include http://localhost:3000 in CORS_ORIGINS
```

### Python Version Issues

If you have multiple Python versions:
```bash
# Use specific version
python3.11 -m venv venv

# Or use pyenv
pyenv install 3.11.7
pyenv local 3.11.7
```

### Node Version Issues

If you have multiple Node versions:
```bash
# Use nvm (Node Version Manager)
nvm install 18
nvm use 18
```

---

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React web application |
| Backend API | http://localhost:8000 | FastAPI REST API |
| API Docs (Swagger) | http://localhost:8000/docs | Interactive API documentation |
| API Docs (ReDoc) | http://localhost:8000/redoc | Alternative API docs |
| Health Check | http://localhost:8000/health | Backend health status |
| AI Health | http://localhost:8000/api/ai/health | AI endpoints status |

---

## 📊 Database

### SQLite (Default)

- **Location:** `backend/stockfinder.db`
- **Type:** File-based database
- **Pros:** No setup required, portable
- **Cons:** Single user, limited concurrency

### Using PostgreSQL (Optional)

If you want to use PostgreSQL instead:

1. Install PostgreSQL locally
2. Create database:
   ```bash
   createdb stockfinder_db
   ```
3. Update `backend/.env`:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/stockfinder_db
   ```
4. Restart backend

---

## 📚 Next Steps

Once everything is running:

1. **Explore API Docs** - http://localhost:8000/docs
2. **Read AI_USAGE.md** - Learn how to use the AI client
3. **Read PROJECT_PLAN.md** - Understand the architecture
4. **Start Phase 1** - Integrate Avanza API and add stock data

---

## 🎯 Useful Commands

```bash
# Setup everything
./setup.sh

# Run backend
./run_backend.sh

# Run frontend
./run_frontend.sh

# Backend with custom port
cd backend && source venv/bin/activate
python -m uvicorn main:app --reload --port 8001

# Frontend with custom port
cd frontend && npm run dev -- --port 3001

# View backend logs (if using script)
cd backend && python -m uvicorn main:app --reload 2>&1 | tee backend.log

# Python REPL with AI client
cd backend && source venv/bin/activate && python
>>> from app.ai_client import get_client
>>> client = get_client()
```

---

## 🆘 Need Help?

- **Documentation:** See `AI_USAGE.md` and `PROJECT_PLAN.md`
- **API Reference:** http://localhost:8000/docs (when running)
- **Issues:** Check terminal output for error messages
- **Database:** View with `sqlite3 backend/stockfinder.db`

---

## 🎉 You're Ready!

Your local development environment is set up. You can now:
- ✅ Modify backend code in `backend/app/`
- ✅ Modify frontend code in `frontend/src/`
- ✅ Use the AI client for stock analysis
- ✅ Test API endpoints via http://localhost:8000/docs

**Next:** Proceed with Phase 1 to integrate Avanza API and add real stock data!

---

**Last Updated:** 2025-10-23
**Status:** Phase 0 Complete - Ready for Development
