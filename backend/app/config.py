"""Application configuration."""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "Avanza Stock Finder"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql://stockfinder:stockfinder123@db:5432/stockfinder_db"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # AI Features
    ENABLE_AI_ENDPOINTS: bool = True

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

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
