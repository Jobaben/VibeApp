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

        # Cache + LLM flow is added in subsequent tasks; for now, sentinel only.
        stock.ai_insights = AIInsight(strengths=[], weaknesses=[], catalyst_watch=[])
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
