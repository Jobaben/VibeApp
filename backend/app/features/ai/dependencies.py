"""DI factories for AI feature router."""
from functools import lru_cache

from fastapi import Depends
from sqlalchemy.orm import Session

from app.config import Settings
from app.features.ai.schemas import (
    AIInsight,
    Fundamentals,
    ScoreBreakdown,
    StockAnalysis,
    Technicals,
)
from app.infrastructure.cache import get_cache_service
from app.infrastructure.database.session import get_db
from app.infrastructure.repositories import get_stock_repository
from app.llm.anthropic_client import AnthropicClient
from app.llm.insight_service import InsightService
from app.shared.exceptions import NotFoundException


@lru_cache
def _get_settings() -> Settings:
    return Settings()


def get_settings() -> Settings:
    return _get_settings()


def get_anthropic_client(settings: Settings = Depends(get_settings)) -> AnthropicClient:
    return AnthropicClient(
        api_key=settings.ANTHROPIC_API_KEY,
        model=settings.LLM_MODEL,
        max_tokens=settings.LLM_MAX_TOKENS,
        temperature=settings.LLM_TEMPERATURE,
        timeout_seconds=settings.LLM_TIMEOUT_SECONDS,
        max_retries=settings.LLM_MAX_RETRIES,
    )


def _build_stock_analysis(stock, fundamentals) -> StockAnalysis:
    """Map ORM Stock + StockFundamental → StockAnalysis schema.

    `ai_insights` is initialised empty; InsightService fills it.

    Notes:
    - `stock.scores` is the relationship (uselist=False), not `stock.score`.
    - `stock.current_price` does not exist on the ORM model; price defaults to 0.0
      until StockPrice is joinedloaded upstream (tracked for T13 follow-up).
    - `peg_ratio` is the ORM column name; schema field is `peg`.
    """
    score = stock.scores  # uselist=False relationship; may be None for unseeded stocks
    score_breakdown = ScoreBreakdown(
        total=int(getattr(score, "total_score", 0) or 0),
        value=int(getattr(score, "value_score", 0) or 0),
        quality=int(getattr(score, "quality_score", 0) or 0),
        momentum=int(getattr(score, "momentum_score", 0) or 0),
        health=int(getattr(score, "health_score", 0) or 0),
    )

    fund = Fundamentals(
        pe_ratio=getattr(fundamentals, "pe_ratio", None),
        ev_ebitda=getattr(fundamentals, "ev_ebitda", None),
        peg=getattr(fundamentals, "peg_ratio", None),  # ORM col is peg_ratio; schema field is peg
        pb_ratio=getattr(fundamentals, "pb_ratio", None),
        ps_ratio=getattr(fundamentals, "ps_ratio", None),
        roic=getattr(fundamentals, "roic", None),
        roe=getattr(fundamentals, "roe", None),
        gross_margin=getattr(fundamentals, "gross_margin", None),
        operating_margin=getattr(fundamentals, "operating_margin", None),
        net_margin=getattr(fundamentals, "net_margin", None),
        debt_equity=getattr(fundamentals, "debt_equity", None),
        current_ratio=getattr(fundamentals, "current_ratio", None),
        fcf_yield=getattr(fundamentals, "fcf_yield", None),
        interest_coverage=getattr(fundamentals, "interest_coverage", None),
    )

    return StockAnalysis(
        ticker=stock.ticker,
        name=stock.name,
        # current_price is not a column on Stock; StockPrice.close is not joinedloaded by
        # get_with_full_data, so we default to 0.0 safely. T13 will surface this if needed.
        price=float(getattr(stock, "current_price", 0) or 0),
        sector=stock.sector,
        industry=getattr(stock, "industry", None),
        instrument_type=getattr(stock, "instrument_type", "STOCK"),
        scores=score_breakdown,
        signal=getattr(score, "signal", "HOLD") if score else "HOLD",
        fundamentals=fund,
        vs_sector=None,
        technicals=None,
        ai_insights=AIInsight(strengths=[], weaknesses=[], catalyst_watch=[]),
    )


def get_insight_service(
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    anthropic_client: AnthropicClient = Depends(get_anthropic_client),
) -> InsightService:
    stock_repo = get_stock_repository(db)
    cache_service = get_cache_service()

    def stock_provider(ticker: str) -> StockAnalysis:
        stock = stock_repo.get_by_ticker(ticker)
        if stock is None:
            raise NotFoundException("Stock", ticker)
        full = stock_repo.get_with_full_data(stock.id)
        # fundamentals is uselist=False — a single object or None, not a list
        fundamentals = getattr(full, "fundamentals", None)
        return _build_stock_analysis(full, fundamentals)

    return InsightService(
        anthropic_client=anthropic_client,
        cache_service=cache_service,
        stock_provider=stock_provider,
        config=settings,
    )
