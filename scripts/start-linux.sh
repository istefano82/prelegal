#!/bin/bash
set -e

CONTAINER_NAME="prelegal_app"
IMAGE_NAME="prelegal_app"
PORT=8000
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/backend/.env"

echo "Starting PreLegal..."

# Check Docker is available
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running. Start it with: sudo systemctl start docker"
    exit 1
fi

# Check .env exists and has the API key
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: $ENV_FILE not found."
    echo "Create it with at least: OPENROUTER_API_KEY=your-key-here"
    exit 1
fi

if ! grep -q "OPENROUTER_API_KEY" "$ENV_FILE"; then
    echo "ERROR: OPENROUTER_API_KEY not found in $ENV_FILE"
    exit 1
fi

# Stop and remove existing container if running
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Stopping existing container..."
    docker rm -f "$CONTAINER_NAME" > /dev/null
fi

# Build image
echo "Building Docker image..."
docker build -t "$IMAGE_NAME" "$PROJECT_DIR"

# Start container
echo "Starting container..."
docker run -d \
    -p "${PORT}:8000" \
    --env-file "$ENV_FILE" \
    --name "$CONTAINER_NAME" \
    "$IMAGE_NAME"

echo ""
echo "PreLegal is running at http://localhost:${PORT}"
echo "API docs:          http://localhost:${PORT}/docs"
echo ""
echo "View logs:  docker logs -f $CONTAINER_NAME"
echo "Stop:       ./scripts/stop-linux.sh"
