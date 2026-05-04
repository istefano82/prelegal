param (
    [switch]$BuildOnly = $false
)

Write-Host "🚀 Starting PreLegal on Windows..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Load environment variables from .env if it exists
if (Test-Path ".env") {
    Write-Host "📝 Loading environment variables from .env..."
    Get-Content .env | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$" -and $_ -notmatch "^#") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "User")
        }
    }
}

# Check for OPENROUTER_API_KEY
if (-not $env:OPENROUTER_API_KEY) {
    Write-Host "❌ OPENROUTER_API_KEY not found in environment" -ForegroundColor Red
    Write-Host "Please add it to .env file or set as environment variable" -ForegroundColor Red
    exit 1
}

# Build Docker image
Write-Host "📦 Building Docker image..." -ForegroundColor Yellow
docker-compose build

if ($BuildOnly) {
    Write-Host "✅ Docker image built successfully" -ForegroundColor Green
    exit 0
}

# Start containers
Write-Host "✅ Starting containers..." -ForegroundColor Yellow
docker-compose up -d

Write-Host ""
Write-Host "🎉 PreLegal is running!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "   API: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Yellow
Write-Host "   docker-compose logs -f" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop:" -ForegroundColor Yellow
Write-Host "   .\scripts\stop-windows.ps1" -ForegroundColor Gray
