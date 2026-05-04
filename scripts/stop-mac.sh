#!/bin/bash
set -e

echo "🛑 Stopping PreLegal..."

docker-compose down

echo "✅ PreLegal stopped successfully"
