#!/bin/bash
# Main setup script - sets up both backend and frontend

echo "🎯 Avanza Stock Finder - Complete Setup"
echo "========================================"
echo ""

# Setup backend
echo "1️⃣  Setting up Backend (Python)..."
./setup_backend.sh
if [ $? -ne 0 ]; then
    echo "❌ Backend setup failed"
    exit 1
fi

echo ""
echo "2️⃣  Setting up Frontend (Node/React)..."
./setup_frontend.sh
if [ $? -ne 0 ]; then
    echo "❌ Frontend setup failed"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Complete setup finished!"
echo ""
echo "🚀 To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  ./run_backend.sh"
echo "  (or cd backend && source venv/bin/activate && python -m uvicorn main:app --reload)"
echo ""
echo "Terminal 2 (Frontend):"
echo "  ./run_frontend.sh"
echo "  (or cd frontend && npm run dev)"
echo ""
echo "Then visit: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
