"""Test configuration and fixtures."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.infrastructure.database import Base, get_db
from main import app


# Test database (in-memory SQLite)
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def test_db():
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(test_db):
    """Create a test client with overridden dependencies."""
    def override_get_db():
        try:
            yield test_db
        finally:
            test_db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def mock_stock_data():
    """Sample stock data for testing."""
    return {
        "ticker": "VOLV-B",
        "name": "Volvo Group",
        "price": 245.50,
        "sector": "Industrials",
        "industry": "Commercial Vehicles",
        "instrument_type": "STOCK",
        "scores": {
            "total": 82,
            "value": 20,
            "quality": 22,
            "momentum": 18,
            "health": 22
        },
        "signal": "BUY",
        "fundamentals": {
            "pe_ratio": 12.5,
            "ev_ebitda": 8.2,
            "peg": 1.3,
            "pb_ratio": 2.1,
            "ps_ratio": 0.8,
            "roic": 18.5,
            "roe": 22.3,
            "gross_margin": 28.5,
            "operating_margin": 14.2,
            "net_margin": 9.8,
            "debt_equity": 0.45,
            "current_ratio": 1.8,
            "fcf_yield": 6.2,
            "interest_coverage": 8.5
        },
        "vs_sector": {
            "pe_percentile": 65,
            "roic_percentile": 78,
            "roe_percentile": 72
        },
        "technicals": {
            "rsi": 58.5,
            "price_vs_50ma": 1.05,
            "price_vs_200ma": 1.12,
            "trend": "uptrend"
        },
        "ai_insights": {
            "strengths": [
                "Strong ROIC above industry average",
                "Low debt-to-equity ratio indicates financial stability",
                "Positive momentum with price above moving averages"
            ],
            "weaknesses": [
                "P/E ratio slightly above sector median",
                "Operating margin could be improved"
            ],
            "catalyst_watch": [
                "Upcoming earnings report in Q4",
                "Electric vehicle product launches"
            ]
        }
    }
