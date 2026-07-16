"""Integration tests for horizon recommendations and trade-signal endpoints."""
from decimal import Decimal

import pytest
from fastapi import status

from main import app
from app.features.stocks.models import Stock, StockScore, Signal
from app.features.stocks.services.price_data_service import PriceDataService, get_price_data_service


def add_scored_stock(db, ticker, value, quality, momentum, health, sector="Technology"):
    stock = Stock(ticker=ticker, name=f"{ticker} Inc.", sector=sector)
    db.add(stock)
    db.flush()
    db.add(StockScore(
        stock_id=stock.id,
        total_score=Decimal(value + quality + momentum + health),
        value_score=Decimal(value),
        quality_score=Decimal(quality),
        momentum_score=Decimal(momentum),
        health_score=Decimal(health),
        signal=Signal.BUY,
    ))
    db.commit()
    return stock


@pytest.fixture
def mock_price_service():
    """Force deterministic mock price data regardless of environment."""
    service = PriceDataService()
    service.use_real_api = False
    app.dependency_overrides[get_price_data_service] = lambda: service
    yield service
    app.dependency_overrides.pop(get_price_data_service, None)


class TestHorizonsEndpoint:
    def test_lists_three_horizons(self, client):
        response = client.get("/api/stocks/recommendations/horizons")

        assert response.status_code == status.HTTP_200_OK
        horizons = response.json()["horizons"]
        assert {h["key"] for h in horizons} == {"short", "medium", "long"}
        for h in horizons:
            assert h["label"]
            assert h["period"]
            assert set(h["weights"]) == {"value", "quality", "momentum", "health"}


class TestTopCandidatesEndpoint:
    def test_returns_ranked_candidates(self, client, test_db):
        add_scored_stock(test_db, "MOMO", value=10, quality=10, momentum=24, health=12)
        add_scored_stock(test_db, "FUND", value=22, quality=22, momentum=6, health=20)

        response = client.get("/api/stocks/recommendations/top?horizon=short&limit=10")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["horizon"] == "short"
        assert data["count"] == 2
        assert data["candidates"][0]["ticker"] == "MOMO"
        assert data["candidates"][0]["rank"] == 1

    def test_invalid_horizon_returns_400(self, client):
        response = client.get("/api/stocks/recommendations/top?horizon=forever")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_empty_universe(self, client):
        response = client.get("/api/stocks/recommendations/top?horizon=long")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["candidates"] == []


class TestTradeSignalsEndpoint:
    def test_returns_signals_and_outlook(self, client, test_db, mock_price_service):
        test_db.add(Stock(ticker="AAPL", name="Apple Inc.", sector="Technology"))
        test_db.commit()

        response = client.get("/api/stocks/AAPL/trade-signals?period=1y")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["ticker"] == "AAPL"
        assert data["count"] == len(data["signals"])
        for event in data["signals"]:
            assert event["type"] in ("BUY", "SELL")
            assert event["indicator"] in (
                "GOLDEN_CROSS", "DEATH_CROSS", "RSI_RECOVERY", "RSI_REVERSAL"
            )
            assert event["strength"] in ("STRONG", "MODERATE")
            assert event["price"] > 0
            assert event["reason"]
        assert data["outlook"]["stance"] in ("BULLISH", "BEARISH", "NEUTRAL")
        assert "summary" in data["outlook"]

    def test_unknown_ticker_returns_404(self, client, mock_price_service):
        response = client.get("/api/stocks/NOPE/trade-signals")
        assert response.status_code == status.HTTP_404_NOT_FOUND
