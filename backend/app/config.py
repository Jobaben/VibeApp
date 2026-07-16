"""Application configuration."""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "Avanza Stock Finder"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Database
    # Default to SQLite for local development (no PostgreSQL required)
    # Set DATABASE_URL env var to use PostgreSQL: postgresql://user:pass@localhost:5432/dbname
    DATABASE_URL: str = "sqlite:///./stockfinder.db"

    # Redis Caching
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = False  # Set to True via docker-compose env
    CACHE_TTL_DEFAULT: int = 300  # 5 minutes
    CACHE_TTL_SCORES: int = 600  # 10 minutes for leaderboards/scores

    # AI Features
    ENABLE_AI_ENDPOINTS: bool = True

    # Admin endpoints (stock import, score recalculation, cache flush).
    # When set, these require a matching X-Admin-Token header. When empty:
    # open in development, disabled (503) in production.
    ADMIN_API_KEY: str = ""

    # JWT Authentication (for future use)
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Avanza API (for future use)
    AVANZA_USERNAME: str = ""
    AVANZA_PASSWORD: str = ""
    AVANZA_TOTP_SECRET: str = ""

    # Stock Data API
    # Real Yahoo Finance data is fetched by default; every fetch automatically
    # falls back to mock data if Yahoo blocks or the network is unavailable.
    # Set USE_REAL_STOCK_API=false to skip the network entirely (CI, offline dev).
    USE_REAL_STOCK_API: bool = True

    # If true, uses mock data even if USE_REAL_STOCK_API is true (override for testing)
    FORCE_MOCK_DATA: bool = False

    # LLM (AI insights)
    ANTHROPIC_API_KEY: str = ""
    LLM_ENABLED: bool = True
    LLM_MODEL: str = "claude-sonnet-4-6"
    LLM_MAX_TOKENS: int = 600
    LLM_TEMPERATURE: float = 0.3
    LLM_TIMEOUT_SECONDS: float = 30.0
    LLM_MAX_RETRIES: int = 3
    LLM_INSIGHT_TTL_SECONDS: int = 86_400
    LLM_INSIGHT_RATE_LIMIT_PER_MIN: int = 5

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
