# PreLegal Backend API

FastAPI backend for the PreLegal legal document drafting platform. Provides AI-powered chat for legal document assistance via OpenRouter/LiteLLM integration.

## Quick Start

### Development (Local, without Docker)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env
# Edit .env with your OPENROUTER_API_KEY
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.
API docs (Swagger): `http://localhost:8000/docs`

### Production (Docker)

```bash
# From project root
./scripts/start-mac.sh      # macOS
./scripts/start-linux.sh    # Linux
./scripts/start-windows.ps1 # Windows
```

## Architecture

Clean architecture with clear separation of concerns:

```
app/
├── main.py           # FastAPI app, lifespan, CORS, routes
├── config.py         # Settings management (env vars)
├── database.py       # SQLAlchemy async engine setup
├── dependencies.py   # Dependency injection (get_db)
├── models/           # SQLAlchemy ORM models (Conversation, Message)
├── schemas/          # Pydantic request/response models
├── services/         # Business logic (ChatService with LiteLLM)
├── routers/          # API route handlers
└── tests/            # Pytest fixtures and test files
```

## API Endpoints

### Health Check
- `GET /health` - Server status

### Chat
- `POST /chat/message` - Send a chat message to the AI assistant
  - Request: `{conversation_id?, message, document_context?}`
  - Response: `{conversation_id, message_id, analysis, created_at}`
  
- `GET /chat/{conversation_id}/history` - Get conversation history
  - Response: `[{id, conversation_id, role, content, created_at}, ...]`

## Environment Variables

See `.env.example` for all options. Key variables:

- `OPENROUTER_API_KEY` - Required for LiteLLM/OpenRouter integration
- `DATABASE_URL` - SQLite path (default: `./prelegal.db`)
- `SECRET_KEY` - JWT signing key (should be random in production)
- `LITELLM_MODEL` - Model to use (default: `openrouter/anthropic/claude-3-5-sonnet`)
- `LOG_LEVEL` - Logging level (DEBUG, INFO, WARNING, ERROR)

## Testing

```bash
pytest app/tests/ -v
pytest app/tests/ --cov=app  # With coverage
```

## Key Features

- **Async/await throughout** - All I/O operations are non-blocking
- **SQLAlchemy ORM** - Type-safe database queries with async support
- **LiteLLM Integration** - Structured Outputs for consistent AI responses
- **Pydantic Validation** - Request/response schema validation
- **Dependency Injection** - Testable, loosely-coupled architecture
- **Conversation Persistence** - Messages and context stored in SQLite
- **Error Handling** - Comprehensive exception handling for LiteLLM failures

## Future Enhancements (PL-5+)

- User authentication (JWT + refresh tokens)
- Multi-document type support (beyond NDA)
- Message streaming responses
- Rate limiting and usage tracking
- PostgreSQL support (swap from SQLite)
- Conversation sharing and collaboration
- Message search and filtering
- Prompt versioning and A/B testing

## Development Notes

- The `ChatService` is the core business logic - all AI calls go through `_call_llm()`
- Message history is limited to `MAX_CONVERSATION_TURNS` to prevent context overflow
- Database transactions are handled by the `get_db()` dependency - never commit inside a service
- All HTTP errors include descriptive messages for debugging
- Logging is structured at service and route layers for traceability

## Database Schema

### Conversations
- `id` (UUID, PK)
- `created_at` (timestamp)
- `document_context` (JSON, nullable)

### Messages
- `id` (UUID, PK)
- `conversation_id` (FK)
- `role` ("user" | "assistant")
- `content` (text)
- `created_at` (timestamp)

## Troubleshooting

**LiteLLM Auth Error**
- Check that `OPENROUTER_API_KEY` is set correctly and has quotes in .env
- Ensure the API key is valid in the OpenRouter dashboard

**Database Locked**
- SQLite locks on concurrent writes. Development environment uses WAL mode
- For production loads, migrate to PostgreSQL

**Conversation Not Found (404)**
- Verify the conversation ID is correct
- Conversations are ephemeral - they exist only until deleted or timeout

## License

See LICENSE file in project root.
