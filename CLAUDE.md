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

### ✅ Completed (PL-5)
- **Chat-Driven NDA Creation**: Conversational interface guiding users through NDA field population
- **AI Field Extraction**: Backend extracts and validates field updates from user responses
- **Backend Schema Extension**: `NDAContextSchema` extended to all 18 NDA fields
- **Field Validation**: Allow-list validation and enum coercion on backend
- **Conversation Persistence**: localStorage support for resuming previous conversations
- **Field Highlights**: Visual feedback when AI updates form fields
- **3-Panel Layout**: Chat (left) | Form with highlights (center) | Preview (right)
- **Error Handling**: User-facing error messages for parse failures
- **Initial Greeting**: Auto-send AI greeting on page load to start conversation

### 🔄 Configuration
- Model: `openrouter/anthropic/claude-3-5-sonnet` (default, configurable via .env)
- Free tier option: `openrouter/openai/gpt-oss-120b:free`
- Environment variables: Load from `backend/.env` via docker-compose
- CORS: Configured for `http://localhost:3000` and `http://localhost:8000`
- Static files: Served from `/app/backend/static` directory

### 📋 Form Fields
All 18 NDA fields are now managed through the chat interface:

**Document Context:**
- purpose, effectiveDate, mndaTerm, confidentialityTerm
- governingLaw, jurisdiction

**Party 1 Information:**
- party1Name, party1Title, party1Company
- party1Address, party1Email, party1Date

**Party 2 Information:**
- party2Name, party2Title, party2Company
- party2Address, party2Email, party2Date

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

### 🔄 Recent Changes (Session 3 - PL-5)
- Implemented chat-guided NDA creation interface
- Extended backend `LegalAnalysisResponse` with `field_updates` dict for explicit field mapping
- Added `_sanitize_field_updates()` in `ChatService` with allow-list validation and enum coercion
- Rewrote system prompt to guide sequential field collection
- Created `ChatPanel` component with message history and conversation persistence via localStorage
- Added `FieldHighlight` component for visual feedback on field updates
- Implemented 3-panel responsive layout (chat | form | preview)
- Updated `NDAForm` to accept and apply highlights on AI-updated fields
- Extended `NDAContextSchema` to support all 18 NDA fields (previously 5)

### ⚠️ Known Limitations
1. Free model has limited structured output support (responses may show "Unable to parse AI response")
2. SQLite write serialization (upgrade to PostgreSQL for >100 concurrent writes)
3. Conversation context loss beyond 20-message window (history truncated on backend)
4. No user authentication yet (coming in PL-6)
5. No rate limiting (coming in PL-6)

### 📝 Future Features (PL-6+)

**Manual Edit Mode Override:**
- [ ] Add toggle to switch between chat-only and chat + form edit modes
- [ ] Allow power users to edit form fields manually while in chat mode
- [ ] Preserve chat context while accepting manual field corrections
- [ ] Consider adding a "Corrections" panel for tracking manual overrides

**Other Planned Features:**
- User authentication (JWT)
- Multi-document support (MSA, DPA, etc.)
- Message streaming for real-time responses (WebSocket or SSE)
- Conversation sharing with other users
- PostgreSQL migration for production scale
- Comprehensive test coverage
- Conversation history export (PDF, JSON)
- Field validation feedback in chat

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
