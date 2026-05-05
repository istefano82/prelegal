# Build stage for frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

# Add output: 'export' to next.config
RUN echo "const nextConfig = { output: 'export' }; module.exports = nextConfig;" > next.config.js

RUN npm run build

# Main stage - Python backend with static frontend
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend
COPY backend/pyproject.toml backend/pyproject.toml
COPY backend/app backend/app

# Install Python dependencies
WORKDIR /app/backend
RUN pip install --no-cache-dir -e .

# Copy frontend static files to backend static directory
COPY --from=frontend-builder /app/frontend/out /app/backend/static

WORKDIR /app/backend

# Create .env if it doesn't exist
ENV DATABASE_URL=sqlite:///./prelegal.db
ENV SECRET_KEY=change-me-in-production
ENV OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
ENV LITELLM_MODEL=openai/gpt-oss-120b:free
ENV ACCESS_TOKEN_EXPIRE_MINUTES=10080
ENV LOG_LEVEL=INFO
ENV CORS_ORIGINS=http://localhost:3000,http://localhost

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
