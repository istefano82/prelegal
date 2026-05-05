# PreLegal Project Specification

## Project Overview
PreLegal is an AI-powered legal document assistant that helps create and manage Mutual Non-Disclosure Agreements (NDAs). The application combines a Next.js frontend with a FastAPI backend, integrated with OpenRouter's LLM capabilities.

## Technology Stack
- **Frontend**: Next.js 16 with TypeScript, Tailwind CSS, static export
- **Backend**: FastAPI with Python 3.12, SQLAlchemy ORM
- **Database**: SQLite (async with aiosqlite)
- **LLM Integration**: LiteLLM with OpenRouter (openai/gpt-oss-120b:free by default)
- **Deployment**: Docker with docker-compose

## Current Implementation Status

### ✅ Completed (PL-4)
- **Frontend**: Mutual NDA Creator with form inputs and live document preview
- **Backend**: Production-grade FastAPI with async/await throughout
- **Database**: SQLite with Conversation and Message tables
- **Static Serving**: Next.js frontend served from FastAPI at `/`
- **Docker**: Multi-stage builds, docker-compose setup
- **API Endpoints**:
  - `GET /health` - Health check
  - `POST /chat/message` - Send message to AI assistant
  - `GET /chat/{conversation_id}/history` - Retrieve conversation history
  - `GET /docs` - Swagger UI
- **PDF Export**: PDFDownloadButton component for downloading NDAs as PDF
- **Code Quality**: Clean architecture with dependency injection, proper error handling

### 🔄 Configuration
- Model: `openrouter/anthropic/claude-3-5-sonnet` (default, configurable via .env)
- Free tier option: `openrouter/openai/gpt-oss-120b:free`
- Environment variables: Load from `backend/.env` via docker-compose
- CORS: Configured for `http://localhost:3000` and `http://localhost:8000`
- Static files: Served from `/app/backend/static` directory

### 📋 Form Fields
**Document Context:**
- party1_company, party2_company
- purpose
- governing_law
- jurisdiction

**Party Information:**
- name, title, company, email
- notice_address
- signature_date

### 🚀 Running Locally
```bash
# Development (Docker)
sudo ./scripts/start-linux.sh
# Access at http://localhost:8000

# Development (without Docker)
cd backend && python -m venv venv && source venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

### 🔐 Security
- ✅ Input validation via Pydantic
- ✅ Prompt injection protection (sanitized context)
- ✅ Type-safe path parameters (UUID validation)
- ✅ CORS middleware
- ✅ Exception handling without data leakage
- ⏳ User authentication (PL-5)
- ⏳ Conversation ownership enforcement (PL-5)

### 📊 Database Schema
- `conversations` - conversation metadata, timestamps
- `messages` - message history with role (user/assistant), timestamps

### 🔄 Recent Fixes (Session 2)
- Fixed TypeScript errors in PDFDownloadButton.tsx (margin, image.type, orientation literal types)
- Fixed CORS_ORIGINS parsing in Pydantic (changed field type to `str | list[str]`)
- Added static file serving to FastAPI via StaticFiles middleware
- Updated model to `openrouter/openai/gpt-oss-120b:free` (user preference)
- Fixed docker-compose to load `.env` file properly

### ⚠️ Known Limitations
1. Free model has limited structured output support (responses may show "Unable to parse AI response")
2. SQLite write serialization (upgrade to PostgreSQL for >100 concurrent writes)
3. No user authentication yet (coming in PL-5)
4. No rate limiting (coming in PL-5)

### 📝 Next Steps (PL-5+)
- User authentication (JWT)
- Multi-document support (MSA, DPA, etc.)
- Message streaming for real-time responses
- Conversation sharing
- PostgreSQL migration
- Comprehensive test coverage

## Environment Configuration
Required `.env` values:
```
OPENROUTER_API_KEY=your-api-key
LITELLM_MODEL=openrouter/openai/gpt-oss-120b:free
SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

## Architecture Notes
- Clean layered architecture: routes → services → database
- Dependency injection for testability
- Async I/O throughout
- Pydantic validation at API boundary
- Service layer handles all LLM logic
