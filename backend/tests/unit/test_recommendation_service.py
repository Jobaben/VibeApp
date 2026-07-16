"""Unit tests for the horizon-based recommendation service."""
from decimal import Decimal

import pytest

from app.features.stocks.models import Stock, StockScore, Signal
from app.features.stocks.services.recommendation_service import (
    RecommendationService,
    HORIZON_PROFILES,
    get_horizon_profiles,
)


def add_scored_stock(db, ticker, value, quality, momentum, health, sector="Technology"):
    stock = Stock(ticker=ticker, name=f"{ticker} Inc.", sector=sector)
    db.add(stock)
    db.flush()
    total = value + quality + momentum + health
    db.add(StockScore(
        stock_id=stock.id,
        total_score=Decimal(total),
        value_score=Decimal(value),
        quality_score=Decimal(quality),
        momentum_score=Decimal(momentum),
        health_score=Decimal(health),
        signal=Signal.BUY if total >= 75 else Signal.HOLD,
    ))
    db.commit()
    return stock


class TestHorizonProfiles:
    def test_three_profiles_exist(self):
        assert set(HORIZON_PROFILES) == {"short", "medium", "long"}

    def test_weights_sum_to_one(self):
        for profile in HORIZON_PROFILES.values():
            assert sum(profile["weights"].values()) == pytest.approx(1.0)

    def test_get_horizon_profiles_returns_all(self):
        assert len(get_horizon_profiles()) == 3


class TestGetTopCandidates:
    def test_unknown_horizon_raises(self, test_db):
        with pytest.raises(ValueError):
            RecommendationService(test_db).get_top_candidates("decade")

    def test_horizon_changes_ranking(self, test_db):
        # MOMO: strong momentum, weak fundamentals. FUND: the opposite.
        add_scored_stock(test_db, "MOMO", value=10, quality=10, momentum=24, health=12)
        add_scored_stock(test_db, "FUND", value=22, quality=22, momentum=6, health=20)

        service = RecommendationService(test_db)

        short = service.get_top_candidates("short")["candidates"]
        long_ = service.get_top_candidates("long")["candidates"]

        assert short[0]["ticker"] == "MOMO"
        assert long_[0]["ticker"] == "FUND"

    def test_candidates_ranked_and_limited(self, test_db):
        for i in range(5):
            add_scored_stock(test_db, f"TICK{i}", value=10 + i, quality=10 + i,
                             momentum=10 + i, health=10 + i)

        result = RecommendationService(test_db).get_top_candidates("medium", limit=3)

        assert result["count"] == 3
        ranks = [c["rank"] for c in result["candidates"]]
        assert ranks == [1, 2, 3]
        scores = [c["horizon_score"] for c in result["candidates"]]
        assert scores == sorted(scores, reverse=True)
        assert result["candidates"][0]["ticker"] == "TICK4"

    def test_sector_filter(self, test_db):
        add_scored_stock(test_db, "TECH1", 20, 20, 20, 20, sector="Technology")
        add_scored_stock(test_db, "BANK1", 20, 20, 20, 20, sector="Financials")

        result = RecommendationService(test_db).get_top_candidates("medium", sector="Financials")

        assert [c["ticker"] for c in result["candidates"]] == ["BANK1"]

    def test_response_shape(self, test_db):
        add_scored_stock(test_db, "AAPL", 20, 22, 18, 21)

        result = RecommendationService(test_db).get_top_candidates("long")

        assert result["horizon"] == "long"
        assert result["weights"] == HORIZON_PROFILES["long"]["weights"]
        candidate = result["candidates"][0]
        for field in ("rank", "ticker", "name", "sector", "horizon_score",
                      "total_score", "signal", "why"):
            assert field in candidate
        # Perfect-score sanity: horizon score is on a 0-100 scale.
        assert 0 <= candidate["horizon_score"] <= 100
