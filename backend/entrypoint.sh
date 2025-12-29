#!/bin/bash
set -e

echo "🚀 Starting backend initialization..."

# Run database seeding (idempotent - skips existing stocks)
echo "🌱 Running database seed..."
python seed_data.py

echo "✅ Initialization complete, starting server..."

# Execute the CMD (uvicorn)
exec "$@"
