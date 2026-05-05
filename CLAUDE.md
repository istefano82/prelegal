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
- ✅ Backend-authoritative field validation (allow-list + enum constraints)
- ⏳ User authentication (PL-6)
- ⏳ Conversation ownership enforcement (PL-6)
- ⏳ Rate limiting (PL-6)

### 📊 Database Schema
- `conversations` - conversation metadata, timestamps, ownership (user_id, session_id)
- `messages` - message history with role (user/assistant), timestamps
- `users` - authenticated user profiles (email, google_id, avatar, timestamps)
- `anonymous_sessions` - guest session ownership with expiry and migration tracking

### 🔄 Recent Changes (Session 4 - PL-6 In Progress)

**Backend - Complete (Auth, Ownership, Streaming):**
- ✅ User model with OAuth integration (Google profile, timestamps, active status)
- ✅ AnonymousSession model for guest conversation ownership with 30-day TTL
- ✅ AuthService: Google OAuth exchange, JWT minting/verification, session management, conversation migration
- ✅ Auth router: GET /auth/google/authorize, GET /auth/google/callback, POST /auth/refresh, POST /auth/logout, GET /auth/me
- ✅ Updated dependencies: get_current_user, require_user, get_conversation_owner (ConversationOwner dataclass)
- ✅ Chat router ownership enforcement: Both POST /chat/message and GET /chat/{id}/history verify ownership
- ✅ ChatService: Modified to accept ConversationOwner, set/verify ownership on conversation creation/access
- ✅ StreamService: Streaming responses via SSE with token events, field_updates, done, error events
- ✅ POST /chat/stream endpoint: Real-time message streaming with Media Type text/event-stream
- ✅ Exception handlers: AuthError (401), OwnershipError (403) with structured JSON responses
- ✅ Added httpx to runtime dependencies for Google OAuth token exchange
- ✅ Updated docker-compose with Google OAuth and token expiry settings

**Frontend - Pending (Sessions 5-8):**
- ⏳ AuthContext + useReducer for auth state machine
- ⏳ useAuth, useSession, useSSEChat custom hooks
- ⏳ AuthModal component with Google Sign-In button
- ⏳ UserMenu component for authenticated user profile
- ⏳ AuthButton toggle (login / user menu)
- ⏳ Session-based ownership for unauthenticated users
- ⏳ SSE streaming in ChatPanel via fetch ReadableStream
- ⏳ Token/session ID header injection (credentials: include, X-Session-ID)

### 🔄 Recent Changes (Session 3 - PL-5 Complete)

**Backend:**
- Extended `NDAContextSchema` to support all 18 NDA fields (was 5, now all optional)
- Added `NDAFieldKey` Literal type for field name validation
- Added explicit `field_updates: dict[str, str]` to `LegalAnalysisResponse`
- Implemented `_sanitize_field_updates()` in `ChatService` with:
  - Allow-list validation (frozenset of 18 valid fields)
  - Enum constraint validation (mndaTerm, confidentialityTerm)
  - Type safety for field values
- Rewrote `_build_system_prompt()` for sequential field-by-field guidance
- Added 307-line test suite (17 tests) covering all validation logic

**Frontend:**
- Created `ChatPanel` component (259 lines): message history, API communication, error handling
- Created `FieldHighlight` component: visual feedback on field updates (1.5s animation)
- Created `api.ts` utility: `sendChatMessage()`, `getConversationHistory()` functions
- Implemented 3-panel responsive layout: Chat (left) | Form (center) | Preview (right)
- Added `NDA_FIELD_LABELS` export for field display names
- Updated `NDAForm` to accept and display field highlights
- Added 206-line test suite (9 tests) for API utilities

**Features:**
- Conversation persistence via localStorage (resume previous conversations)
- Auto-send initial AI greeting on page load
- Real-time form field updates from chat with visual highlights
- Sequential field collection guidance (all 18 fields in order)
- Backend-authoritative field validation (no client-side regex)

**Status: Merged to main (commit 2deaaa1), Ready for Production**
- 26 unit tests (17 backend + 9 frontend)
- Full syntax validation passing
- Backward compatible (all existing features preserved)

### 📦 Deployment Status
- ✅ Code merged to main branch (commit 2deaaa1)
- ✅ All tests passing (26/26)
- ✅ Docker builds successfully
- ✅ Production-ready (with known limitations below)
- ⏳ GitHub PR pending manual creation (auth issue with MCP tool)

### ⚠️ Known Limitations
1. Free model (gpt-oss-120b) has limited structured output support → graceful degradation with error messages
2. SQLite write serialization → upgrade to PostgreSQL for >100 concurrent writes
3. Conversation context limited to 20 messages → adequate for current scope, enhance in PL-6
4. No user authentication → conversation ownership not enforced (PL-6)
5. No message streaming → responses display after complete LLM call (WebSocket/SSE in PL-6)

### 📝 Future Features

**PL-6 (In Progress - Backend Complete, Frontend Pending):**
- ✅ Backend: User authentication (OAuth with Google via Google Identity Services)
- ✅ Backend: JWT token pair (access + refresh) with HttpOnly cookies
- ✅ Backend: Conversation ownership enforcement (user_id + session_id)
- ✅ Backend: Anonymous session ownership for unauthenticated users
- ✅ Backend: SSE message streaming (token-by-token display)
- ⏳ Frontend: AuthContext + auth hooks (useAuth, useSession, useSSEChat)
- ⏳ Frontend: Google Sign-In modal UI
- ⏳ Frontend: SSE streaming integration in ChatPanel
- ⏳ Frontend: Token/session header injection on API calls
- ⏳ Frontend: Error messages for auth failures (401, 403)

**PL-6 Optional (Deferred to PL-7):**
- Manual edit mode toggle (chat + form editing simultaneously)

**PL-7+ (Backlog):**
- Multi-document support (MSA, DPA, etc.)
- Conversation sharing with other users
- Conversation history export (PDF, JSON)
- Field validation feedback in chat
- Advanced conversation search
- Template library
- PostgreSQL migration for production scale
- Comprehensive integration test coverage

## Testing & Verification

### Unit Tests (26 Total)
```bash
# Backend tests
cd backend && python -m pytest app/tests/test_chat_service.py -v

# Frontend tests
cd frontend && npm test -- __tests__/utils/api.test.ts
```

### Manual E2E Testing
```bash
cd /home/ivopc/Projects/prelegal
sudo ./scripts/start-linux.sh
# Access at http://localhost:8000
# - Chat interface loads and auto-sends greeting
# - Typing field values highlights and updates form
# - Form fields persist through conversation
# - PDF download works
```

### Syntax Validation
- Python 3.12: `python -m py_compile backend/app/**/*.py`
- TypeScript: `frontend npm run build` (includes type checking)

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
