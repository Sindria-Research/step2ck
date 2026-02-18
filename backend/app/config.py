"""Application configuration from environment."""
from functools import lru_cache
from typing import List, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _parse_cors_origins(v: Union[str, List[str]]) -> List[str]:
    """Parse CORS_ORIGINS from comma-separated string or list (e.g. production env)."""
    if isinstance(v, str):
        return [x.strip() for x in v.split(",") if x.strip()]
    return list(v) if v else []


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database: sqlite for dev, postgres for production
    DATABASE_URL: str = "sqlite:///./step2ck.db"

    # Auth
    SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    GOOGLE_CLIENT_ID: str = ""  # Optional; used to verify Google ID tokens (audience check)

    # CORS: comma-separated string in production (e.g. CORS_ORIGINS=https://app.com)
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Logging
    LOG_LEVEL: str = "INFO"

    # AI (OpenAI-compatible API)
    AI_API_KEY: str = ""
    AI_MODEL: str = "gpt-4o-mini"
    AI_BASE_URL: str = "https://api.openai.com/v1"
    AI_TIMEOUT_SECONDS: float = 25.0

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        return _parse_cors_origins(v) if v else []


@lru_cache
def get_settings() -> Settings:
    return Settings()
