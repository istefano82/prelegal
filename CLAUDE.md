# PreLegal Project Specification

## Project Overview
PreLegal is an AI-powered legal document assistant that helps create and manage Mutual Non-Disclosure Agreements (NDAs). The application combines a Next.js frontend with a FastAPI backend, integrated with OpenRouter's LLM capabilities.

## Technology Stack
- **Frontend**: Next.js 16 with TypeScript, Tailwind CSS, static export
- **Backend**: FastAPI with Python 3.12, SQLAlchemy ORM
- **Database**: SQLite (async with aiosqlite)
- **LLM Integration**: LiteLLM with OpenRouter (openai/gpt-oss-120b:free by default)
- **Deployment**: Docker (`docker build` + `docker run`) via `scripts/start-linux.sh`

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
- **Initial Greeting**: Auto-send AI greeting on page load to start conversation
- **Error Handling**: User-facing error messages for parse failures

### ✅ Completed (PL-6)
- **User Authentication**: OAuth with Google via backend-driven OAuth flow
- **JWT Token Pair**: Access (15min) and refresh (7day) tokens with HttpOnly cookies
- **Conversation Ownership**: User conversations isolated by user_id or session_id
- **Anonymous Sessions**: 30-day TTL sessions for unauthenticated users with automatic migration
- **SSE Streaming**: Real-time message responses via Server-Sent Events with field_updates
- **Auth Context**: React Context + useReducer state machine (loading, unauthenticated, authenticated)
- **Auth Hooks**: useAuth, useSession, useSSEChat for component integration
- **Auth UI**: AuthModal (Google Sign-In), UserMenu (user profile + logout), AuthButton (toggle)
- **Session Headers**: X-Session-ID for guests, Authorization Bearer for authenticated users
- **OAuth Callback**: Popup-based flow with postMessage signaling
- **StreamingResponse**: Frontend async generator consuming SSE events with field_updates parsing
- **2-Panel Layout**: Chat (left) | Document Preview (right) — form removed, all fields via chat
- **PDF Download**: Button in header (emerald style), validates fields before generating
- **Conversation Resume**: Page reload restores prior conversation via localStorage + history endpoint
- **Ownership Fix**: AnonymousSession correctly persists frontend session ID (no new UUID per request)
- **AI Follow-on Questions**: System prompt enforces AI always asks next question after each answer

### ✅ Completed (PL-7)
- **Email/Password Authentication**: Complete sign-up and login with email + password
- **Password Hashing**: bcrypt password hashing with passlib integration (version-pinned: bcrypt >=4.0.0,<5.0.0)
- **Password Strength Validation**: Enforced requirements: 8+ chars, uppercase, digit, special char, max 72 bytes (bcrypt limit)
- **User Registration Endpoint**: `POST /auth/register` with validation and error logging
- **User Login Endpoint**: `POST /auth/login` with credential verification
- **Token Refresh Endpoint**: `POST /auth/refresh` with refresh token cookie support
- **AuthModal Redesign**: Tab-based modal with separate Sign In and Create Account flows
- **Password Requirements Display**: Real-time validation feedback with checkmark indicators
- **User Profile Display**: Shows authenticated user name and avatar in navbar (initial avatar)
- **Multi-user Conversations**: Each user's conversations isolated from others
- **Navbar Navigation**: Enhanced with PreLegal branding and "New NDA" / "My Documents" links
- **My Documents Page**: Dedicated page at `/my-documents` for viewing and managing saved documents
- **Route Resolution**: Fixed routing conflict between API endpoint and frontend page
- **Draft Disclaimer**: Warning message visible on all document previews
- **Error Handling**: Comprehensive error logging and user-facing error messages

### 🔄 Configuration
- Model: `openrouter/openai/gpt-oss-120b:free` (default, configurable via .env)
- Alternative paid option: `openrouter/anthropic/claude-3-5-sonnet`
- Environment variables: Load from `backend/.env` (passed via `--env-file` to Docker)
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
# Start (builds Docker image and runs container)
sudo ./scripts/start-linux.sh
# Access at http://localhost:8000

# Stop
./scripts/stop-linux.sh

# Development (without Docker)
cd backend && python -m venv venv && source venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Scripts use `docker build -t prelegal_app <project_dir>` + `docker run -d -p 8000:8000 --env-file backend/.env --name prelegal_app prelegal_app`. No docker-compose required.

### 🔐 Security
- ✅ Input validation via Pydantic with EmailStr validation
- ✅ Prompt injection protection (sanitized context)
- ✅ Type-safe path parameters (UUID validation)
- ✅ CORS middleware
- ✅ Exception handling without data leakage
- ✅ Backend-authoritative field validation (allow-list + enum constraints)
- ✅ User authentication (OAuth 2.0 with Google + email/password)
- ✅ Password hashing with bcrypt (PBKDF2 alternative available)
- ✅ Password strength requirements enforced (8+ chars, uppercase, digit, special, max 72 bytes)
- ✅ Conversation ownership enforcement (user_id + session_id)
- ✅ JWT token verification with HS256 signing
- ✅ HttpOnly secure cookies for token storage
- ✅ Refresh token rotation support
- ⏳ Rate limiting on authentication endpoints (future)

### 📊 Database Schema
- `conversations` - conversation metadata, timestamps, ownership (user_id, session_id)
- `messages` - message history with role (user/assistant), timestamps
- `users` - authenticated user profiles (email, google_id, avatar, timestamps)
- `anonymous_sessions` - guest session ownership with expiry and migration tracking

### 📦 Deployment Status
- ✅ Code merged to main branch (commit ba5c68b)
- ✅ Docker builds and runs via `scripts/start-linux.sh`
- ✅ Production-ready for PL-7 scope (with known limitations below)
- ✅ Email/password authentication tested and working
- ✅ Multi-user support with conversation ownership isolation

### ⚠️ Known Limitations
1. Free model (`gpt-oss-120b:free`) occasionally rate-limits → retry resolves; upgrade to paid model via `.env` for reliability
2. SQLite write serialization → upgrade to PostgreSQL for >100 concurrent writes
3. Conversation context limited to 20 messages → adequate for current scope, enhance in future releases
4. Manual edit mode not implemented → users can't directly edit NDA fields, only via chat
5. No rate limiting on API endpoints → add in future releases
6. Document snapshots (save/rename/tag) UI infrastructure exists but backend integration incomplete

### 📝 Future Features

**PL-8+ (Backlog):**
- Complete NDA snapshot save/rename/tag functionality with backend persistence
- Document download as PDF (snapshot management)
- Multi-document support (MSA, DPA, etc.)
- Conversation sharing with other users
- Conversation history export (PDF, JSON)
- Field validation feedback in chat
- Advanced conversation search
- Template library
- PostgreSQL migration for production scale
- Comprehensive integration test coverage
- Rate limiting with sliding window
- Webhook support for external integrations

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
sudo ./scripts/start-linux.sh
# Access at http://localhost:8000

# Unauthenticated Flow
# - Chat interface loads and AI sends greeting automatically
# - AI guides through all 18 NDA fields sequentially, always asking a follow-up
# - Document Preview (right panel) updates live as fields are collected with draft disclaimer visible
# - Page reload resumes previous conversation from localStorage

# Authentication Flow (PL-7)
# - Sign In button opens AuthModal with Sign In and Create Account tabs
# - Create Account tab shows email, password, name fields with strength requirements
# - Password strength requirements display with real-time validation checkmarks
# - Registration succeeds with valid credentials; user profile appears in navbar
# - Login with registered credentials returns user to authenticated state

# Authenticated User Flow
# - User profile shows name and avatar initial in top-right corner
# - "My Documents" navigation link available in navbar
# - My Documents page at /my-documents displays empty state (no documents yet)
# - Chat continues working for authenticated users
# - PDF download button (header, emerald) generates and downloads NDA
# - Original Google OAuth flow still works for quick sign-in
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
