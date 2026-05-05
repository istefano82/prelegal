from pydantic_settings import BaseSettings
from pydantic import field_validator, Field, ConfigDict


class Settings(BaseSettings):
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        json_schema_extra={"cors_origins": "comma-separated string"},
    )

    database_url: str = "sqlite+aiosqlite:///./prelegal.db"
    secret_key: str
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    anonymous_session_expire_days: int = 30
    litellm_model: str = "openai/gpt-oss-120b:free"
    openrouter_api_key: str
    log_level: str = "INFO"
    cors_origins: str | list[str] = Field(default="http://localhost:3000")
    max_conversation_turns: int = 20
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"
    frontend_url: str = "http://localhost:8000"
    cookie_secure: bool = False

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v


settings = Settings()
