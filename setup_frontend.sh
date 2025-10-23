#!/bin/bash
# Setup script for frontend (Node/React)

echo "🚀 Setting up Avanza Stock Finder Frontend..."

# Check Node version
echo "📋 Checking Node version..."
node --version || { echo "❌ Node.js 18+ required"; exit 1; }
npm --version || { echo "❌ npm required"; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
cd frontend
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
VITE_API_URL=http://localhost:8000/api
EOF
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

cd ..

echo ""
echo "✅ Frontend setup complete!"
echo ""
echo "To start the frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Or use: ./run_frontend.sh"
