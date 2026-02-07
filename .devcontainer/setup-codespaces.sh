#!/bin/bash
# Codespaces post-create setup script
# Runs automatically when the Codespace is created

set -e

echo "=== VibeApp Codespaces Setup ==="

# --- Backend ---
echo ""
echo "[1/4] Creating Python virtual environment..."
cd backend
python3 -m venv venv
source venv/bin/activate

echo "[2/4] Installing Python dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo "[3/4] Configuring backend environment..."
if [ ! -f .env ]; then
  cat > .env << 'EOF'
DATABASE_URL=sqlite:///./stockfinder.db
DEBUG=True
ENVIRONMENT=development
REDIS_ENABLED=False
ENABLE_AI_ENDPOINTS=True
FORCE_MOCK_DATA=false
CORS_ORIGINS=*
EOF
fi

echo "Initializing SQLite database..."
python -c "from app.infrastructure.database import Base, engine; Base.metadata.create_all(bind=engine)"

deactivate
cd ..

# --- Frontend ---
echo "[4/4] Installing frontend dependencies..."
cd frontend

if [ ! -f .env ]; then
  echo "VITE_API_URL=http://localhost:8000/api" > .env
fi

npm install --silent
cd ..

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Start the app:"
echo "  Backend:  cd backend && source venv/bin/activate && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Or use the helper scripts:"
echo "  ./run_backend.sh   (in one terminal)"
echo "  ./run_frontend.sh  (in another terminal)"
