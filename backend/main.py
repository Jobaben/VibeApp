"""Main FastAPI application entry point."""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.config import settings
from app.infrastructure.database import Base, engine
from app.features.ai.router import router as ai_router
from app.features.stocks.router import router as stocks_router
from app.features.cache.router import router as cache_router
from app.limiter import limiter

logger = logging.getLogger(__name__)


def _validate_llm_config() -> None:
    """Surface a missing ANTHROPIC_API_KEY before the first request hits the LLM.

    In production we refuse to start; in development we log a loud warning so
    test suites and local boots without a key still work, but the operator
    notices immediately on stdout.
    """
    if not settings.LLM_ENABLED:
        return
    if settings.ANTHROPIC_API_KEY:
        return
    msg = (
        "LLM_ENABLED=True but ANTHROPIC_API_KEY is empty. "
        "Set ANTHROPIC_API_KEY or set LLM_ENABLED=False."
    )
    if settings.ENVIRONMENT == "production":
        raise RuntimeError(msg)
    logger.warning(msg)


_validate_llm_config()

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Avanza Stock Finder",
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    description="AI-powered stock analysis platform for Avanza Bank"
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": {"detail": "Too many requests. Please wait a minute.", "code": "rate_limited"}},
        headers={"Retry-After": "60"},
    )


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ai_router)
app.include_router(stocks_router)
app.include_router(cache_router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Avanza Stock Finder",
        "version": settings.APP_VERSION,
        "status": "running",
        "description": "AI-powered stock analysis platform"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
