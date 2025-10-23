"""AI API schemas for LLM-friendly responses."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class AIInsight(BaseModel):
    """AI-generated insights for a stock."""
    strengths: List[str] = Field(description="Key strengths of the stock")
    weaknesses: List[str] = Field(description="Key weaknesses or risks")
    catalyst_watch: List[str] = Field(default_factory=list, description="Upcoming catalysts to monitor")


class ScoreBreakdown(BaseModel):
    """Breakdown of stock scoring."""
    total: int = Field(ge=0, le=100, description="Total score (0-100)")
    value: int = Field(ge=0, le=25, description="Value score (0-25)")
    quality: int = Field(ge=0, le=25, description="Quality score (0-25)")
    momentum: int = Field(ge=0, le=25, description="Momentum score (0-25)")
    health: int = Field(ge=0, le=25, description="Financial health score (0-25)")


class Fundamentals(BaseModel):
    """Fundamental metrics for a stock."""
    pe_ratio: Optional[float] = Field(None, description="Price-to-Earnings ratio")
    ev_ebitda: Optional[float] = Field(None, description="EV/EBITDA ratio")
    peg: Optional[float] = Field(None, description="PEG ratio")
    pb_ratio: Optional[float] = Field(None, description="Price-to-Book ratio")
    ps_ratio: Optional[float] = Field(None, description="Price-to-Sales ratio")
    roic: Optional[float] = Field(None, description="Return on Invested Capital (%)")
    roe: Optional[float] = Field(None, description="Return on Equity (%)")
    gross_margin: Optional[float] = Field(None, description="Gross margin (%)")
    operating_margin: Optional[float] = Field(None, description="Operating margin (%)")
    net_margin: Optional[float] = Field(None, description="Net margin (%)")
    debt_equity: Optional[float] = Field(None, description="Debt-to-Equity ratio")
    current_ratio: Optional[float] = Field(None, description="Current ratio")
    fcf_yield: Optional[float] = Field(None, description="Free Cash Flow yield (%)")
    interest_coverage: Optional[float] = Field(None, description="Interest coverage ratio")


class SectorComparison(BaseModel):
    """Stock metrics compared to sector averages."""
    pe_percentile: Optional[int] = Field(None, ge=0, le=100)
    roic_percentile: Optional[int] = Field(None, ge=0, le=100)
    roe_percentile: Optional[int] = Field(None, ge=0, le=100)


class Technicals(BaseModel):
    """Technical indicators for a stock."""
    rsi: Optional[float] = Field(None, description="Relative Strength Index")
    price_vs_50ma: Optional[float] = Field(None, description="Price vs 50-day MA (ratio)")
    price_vs_200ma: Optional[float] = Field(None, description="Price vs 200-day MA (ratio)")
    trend: Optional[str] = Field(None, description="Current trend (uptrend, downtrend, sideways)")


class StockAnalysis(BaseModel):
    """Complete stock analysis for AI consumption."""
    ticker: str
    name: str
    price: float
    sector: Optional[str] = None
    industry: Optional[str] = None
    instrument_type: str = Field(default="STOCK", description="STOCK, FUND, ETF, etc.")

    scores: ScoreBreakdown
    signal: str = Field(description="BUY, STRONG_BUY, HOLD, SELL, STRONG_SELL")

    fundamentals: Fundamentals
    vs_sector: Optional[SectorComparison] = None
    technicals: Optional[Technicals] = None

    ai_insights: AIInsight


class MarketContext(BaseModel):
    """Market-wide context for analysis."""
    timestamp: datetime
    market_avg_pe: Optional[float] = None
    market_avg_roic: Optional[float] = None
    market_avg_roe: Optional[float] = None


class AISummary(BaseModel):
    """High-level summary of analysis results."""
    key_findings: str
    sector_distribution: Dict[str, int]
    avg_score: float
    best_opportunity: Optional[str] = None
    highest_risk: Optional[str] = None


class AIAnalysisResponse(BaseModel):
    """Response for AI stock analysis queries."""
    query_metadata: Dict[str, Any] = Field(description="Query metadata including criteria and context")
    market_context: MarketContext
    stocks: List[StockAnalysis]
    ai_summary: AISummary


class DeepAnalysisResponse(BaseModel):
    """Deep dive analysis of a single stock."""
    stock: StockAnalysis
    historical_trends: Dict[str, List[float]] = Field(
        description="Historical data for key metrics (e.g., roic_history, margin_history)"
    )
    peer_comparison: Optional[List[StockAnalysis]] = Field(
        None,
        description="Comparison with peer stocks in same sector"
    )


class ComparisonResponse(BaseModel):
    """Side-by-side comparison of multiple stocks."""
    stocks: List[StockAnalysis]
    comparison_matrix: Dict[str, Dict[str, Any]] = Field(
        description="Matrix showing which stock wins in each category"
    )


class AnalysisCriteria(BaseModel):
    """Criteria for stock analysis queries."""
    min_pe: Optional[float] = None
    max_pe: Optional[float] = None
    min_roic: Optional[float] = None
    min_roe: Optional[float] = None
    max_debt_equity: Optional[float] = None
    min_fcf_yield: Optional[float] = None
    sectors: Optional[List[str]] = None
    min_market_cap: Optional[float] = None
    max_market_cap: Optional[float] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    instrument_types: Optional[List[str]] = Field(
        default=None,
        description="STOCK, FUND, ETF, etc."
    )
