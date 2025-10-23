"""Main FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.infrastructure.database import Base, engine
from app.features.ai.router import router as ai_router

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Avanza Stock Finder",
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    description="AI-powered stock analysis platform for Avanza Bank"
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
