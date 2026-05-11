"""Orchestrates stock-data fetch + LLM call + Redis cache for AI insights."""
from __future__ import annotations

import hashlib
import json
from typing import Callable, Optional

from app.features.ai.schemas import (
    AIInsight,
    Fundamentals,
    ScoreBreakdown,
    StockAnalysis,
)
from app.llm.anthropic_client import AnthropicClient


StockProvider = Callable[[str], StockAnalysis]
"""Callable that resolves a ticker to a fully assembled StockAnalysis,
raising app.shared.exceptions.NotFoundException for unknown tickers."""


_HASHED_FUNDAMENTAL_FIELDS = (
    "pe_ratio",
    "roic",
    "roe",
    "debt_equity",
    "fcf_yield",
)


class InsightService:
    def __init__(
        self,
        *,
        anthropic_client: AnthropicClient,
        cache_service,
        stock_provider: StockProvider,
        config,
    ):
        self._llm = anthropic_client
        self._cache = cache_service
        self._stock_provider = stock_provider
        self._config = config

    def get_stock_with_insight(self, ticker: str) -> StockAnalysis:
        stock = self._stock_provider(ticker)  # may raise NotFoundException

        if not self._config.LLM_ENABLED:
            stock.ai_insights = AIInsight(strengths=[], weaknesses=[], catalyst_watch=[])
            return stock

        score_hash = self._score_hash(stock.scores, stock.fundamentals)
        cache_key = f"ai:insight:{ticker}:{score_hash}"

        cached = self._cache.get(cache_key)
        if cached is not None:
            stock.ai_insights = AIInsight(**cached)
            return stock

        payload = {
            "ticker": stock.ticker,
            "name": stock.name,
            "sector": stock.sector,
            "signal": stock.signal,
            "scores": stock.scores.model_dump(),
            "fundamentals": stock.fundamentals.model_dump(),
        }
        insight = self._llm.generate_insight(payload)

        self._cache.set(
            cache_key,
            insight.model_dump(),
            ttl_seconds=self._config.LLM_INSIGHT_TTL_SECONDS,
        )

        stock.ai_insights = insight
        return stock

    @staticmethod
    def _score_hash(scores: ScoreBreakdown, fundamentals: Fundamentals) -> str:
        canonical = {
            "scores": {
                "total": scores.total,
                "value": scores.value,
                "quality": scores.quality,
                "momentum": scores.momentum,
                "health": scores.health,
            },
            "fundamentals": {
                k: getattr(fundamentals, k) for k in _HASHED_FUNDAMENTAL_FIELDS
            },
        }
        encoded = json.dumps(canonical, sort_keys=True, separators=(",", ":")).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()[:16]
