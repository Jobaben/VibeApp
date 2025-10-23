#!/bin/bash
# Setup script for backend (Python)

echo "🚀 Setting up Avanza Stock Finder Backend..."

# Check Python version
echo "📋 Checking Python version..."
python3 --version || { echo "❌ Python 3.11+ required"; exit 1; }

# Create virtual environment if it doesn't exist
if [ ! -d "backend/venv" ]; then
    echo "🔧 Creating virtual environment..."
    cd backend
    python3 -m venv venv
    cd ..
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment and install dependencies
echo "📦 Installing dependencies..."
cd backend
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
DATABASE_URL=sqlite:///./stockfinder.db
DEBUG=True
ENVIRONMENT=development
REDIS_ENABLED=False
ENABLE_AI_ENDPOINTS=True
EOF
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

# Initialize database
echo "🗄️  Initializing database..."
python -c "from app.infrastructure.database import Base, engine; Base.metadata.create_all(bind=engine); print('✅ Database initialized')"

cd ..

echo ""
echo "✅ Backend setup complete!"
echo ""
echo "To start the backend:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "Or use: ./run_backend.sh"
