#!/bin/bash

echo "🚀 Starting VibeApp..."
echo ""

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "✓ Docker found - starting with Docker Compose"
    docker-compose up -d
    echo ""
    echo "✅ VibeApp is running!"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:8000"
    echo "   API Docs: http://localhost:8000/docs"
else
    echo "⚠️  Docker not found"
    echo ""
    echo "To run manually:"
    echo "1. Start PostgreSQL database"
    echo "2. Backend: cd backend && python main.py"
    echo "3. Frontend: cd frontend && npm run dev"
fi
