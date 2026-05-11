"""Tests for InsightService."""
from unittest.mock import MagicMock

import pytest

from app.features.ai.schemas import AIInsight, ScoreBreakdown, Fundamentals, StockAnalysis
from app.llm.insight_service import InsightService


def _stock_analysis(**overrides) -> StockAnalysis:
    defaults = dict(
        ticker="VOLV-B",
        name="Volvo",
        price=245.5,
        sector="Industrials",
        scores=ScoreBreakdown(total=78, value=18, quality=22, momentum=20, health=18),
        signal="BUY",
        fundamentals=Fundamentals(pe_ratio=9.8, roic=21.3, roe=18.5, debt_equity=0.42, fcf_yield=7.1),
        ai_insights=AIInsight(strengths=[], weaknesses=[], catalyst_watch=[]),
    )
    defaults.update(overrides)
    return StockAnalysis(**defaults)


def _config(**overrides) -> MagicMock:
    cfg = MagicMock()
    cfg.LLM_ENABLED = True
    cfg.LLM_INSIGHT_TTL_SECONDS = 86_400
    for k, v in overrides.items():
        setattr(cfg, k, v)
    return cfg


def test_score_hash_is_stable_across_calls():
    s = _stock_analysis()
    h1 = InsightService._score_hash(s.scores, s.fundamentals)
    h2 = InsightService._score_hash(s.scores, s.fundamentals)
    assert h1 == h2
    assert len(h1) == 16


def test_score_hash_ignores_price_changes():
    """Different prices, same scores+selected fundamentals → identical hash."""
    a = _stock_analysis(price=245.5)
    b = _stock_analysis(price=999.99)
    assert InsightService._score_hash(a.scores, a.fundamentals) == \
           InsightService._score_hash(b.scores, b.fundamentals)


def test_score_hash_changes_when_scores_change():
    a = _stock_analysis()
    b = _stock_analysis(
        scores=ScoreBreakdown(total=50, value=10, quality=10, momentum=15, health=15)
    )
    assert InsightService._score_hash(a.scores, a.fundamentals) != \
           InsightService._score_hash(b.scores, b.fundamentals)


def test_disabled_mode_returns_sentinel_without_llm_call():
    stock_provider = MagicMock(return_value=_stock_analysis())
    llm = MagicMock()
    cache = MagicMock()

    service = InsightService(
        anthropic_client=llm,
        cache_service=cache,
        stock_provider=stock_provider,
        config=_config(LLM_ENABLED=False),
    )

    result = service.get_stock_with_insight("VOLV-B")

    assert result.ai_insights.strengths == []
    assert result.ai_insights.weaknesses == []
    assert result.ai_insights.catalyst_watch == []
    llm.generate_insight.assert_not_called()
    cache.get.assert_not_called()
    cache.set.assert_not_called()
