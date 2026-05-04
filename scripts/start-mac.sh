#!/bin/bash
set -e

echo "🚀 Starting PreLegal on macOS..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Load environment variables from root .env if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

# Check for OPENROUTER_API_KEY
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "❌ OPENROUTER_API_KEY not found in .env file"
    echo "Please add it to .env file or export it as an environment variable"
    exit 1
fi

# Build and start containers
echo "📦 Building Docker image..."
docker-compose build

echo "✅ Starting containers..."
docker-compose up -d

echo ""
echo "🎉 PreLegal is running!"
echo "   Frontend: http://localhost:8000"
echo "   API: http://localhost:8000/docs"
echo ""
echo "To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "To stop:"
echo "   ./scripts/stop-mac.sh"
