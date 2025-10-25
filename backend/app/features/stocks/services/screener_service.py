"""
Stock screener service with pre-built investment strategies.

Implements 5 proven investment strategies:
1. Value Gems - Low P/E + High ROIC + Low Debt
2. Quality Compounders - High ROIC + High Margins + Growing Revenue
3. Dividend Kings - High Yield + Low Payout + Consistent History
4. Deep Value - Low P/B + Positive FCF + Not Overleveraged
5. Explosive Growth - High Revenue Growth + Improving Margins + Low PEG
"""
from typing import List, Dict, Any, Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.features.stocks.models import Stock, StockFundamental, StockScore
from app.features.stocks.schemas import (
    ScreenerCriteria,
    ScreenerResult,
    ScreenerResponse,
)


class ScreenerService:
    """Service for screening stocks based on custom criteria and pre-built strategies."""

    def __init__(self, db: Session):
        """Initialize screener service with database session."""
        self.db = db

    def screen_stocks(self, criteria: ScreenerCriteria) -> ScreenerResponse:
        """
        Screen stocks based on custom criteria.

        Args:
            criteria: Filtering criteria

        Returns:
            ScreenerResponse with matching stocks
        """
        # Start with all stocks
        query = (
            self.db.query(Stock)
            .join(StockFundamental, Stock.id == StockFundamental.stock_id, isouter=True)
            .join(StockScore, Stock.id == StockScore.stock_id, isouter=True)
        )

        filters = []

        # Apply valuation filters
        if criteria.pe_min is not None:
            filters.append(StockFundamental.pe_ratio >= criteria.pe_min)
        if criteria.pe_max is not None:
            filters.append(StockFundamental.pe_ratio <= criteria.pe_max)
        if criteria.peg_min is not None:
            filters.append(StockFundamental.peg_ratio >= criteria.peg_min)
        if criteria.peg_max is not None:
            filters.append(StockFundamental.peg_ratio <= criteria.peg_max)
        if criteria.pb_min is not None:
            filters.append(StockFundamental.pb_ratio >= criteria.pb_min)
        if criteria.pb_max is not None:
            filters.append(StockFundamental.pb_ratio <= criteria.pb_max)

        # Apply profitability filters
        if criteria.roic_min is not None:
            filters.append(StockFundamental.roic >= criteria.roic_min)
        if criteria.roic_max is not None:
            filters.append(StockFundamental.roic <= criteria.roic_max)
        if criteria.roe_min is not None:
            filters.append(StockFundamental.roe >= criteria.roe_min)
        if criteria.roe_max is not None:
            filters.append(StockFundamental.roe <= criteria.roe_max)
        if criteria.net_margin_min is not None:
            filters.append(StockFundamental.net_margin >= criteria.net_margin_min)
        if criteria.net_margin_max is not None:
            filters.append(StockFundamental.net_margin <= criteria.net_margin_max)

        # Apply financial health filters
        if criteria.debt_equity_min is not None:
            filters.append(StockFundamental.debt_equity >= criteria.debt_equity_min)
        if criteria.debt_equity_max is not None:
            filters.append(StockFundamental.debt_equity <= criteria.debt_equity_max)
        if criteria.current_ratio_min is not None:
            filters.append(StockFundamental.current_ratio >= criteria.current_ratio_min)
        if criteria.fcf_yield_min is not None:
            filters.append(StockFundamental.fcf_yield >= criteria.fcf_yield_min)

        # Apply growth filters
        if criteria.revenue_growth_min is not None:
            filters.append(StockFundamental.revenue_growth >= criteria.revenue_growth_min)
        if criteria.earnings_growth_min is not None:
            filters.append(StockFundamental.earnings_growth >= criteria.earnings_growth_min)

        # Apply dividend filters
        if criteria.dividend_yield_min is not None:
            filters.append(StockFundamental.dividend_yield >= criteria.dividend_yield_min)
        if criteria.dividend_yield_max is not None:
            filters.append(StockFundamental.dividend_yield <= criteria.dividend_yield_max)
        if criteria.payout_ratio_min is not None:
            filters.append(StockFundamental.payout_ratio >= criteria.payout_ratio_min)
        if criteria.payout_ratio_max is not None:
            filters.append(StockFundamental.payout_ratio <= criteria.payout_ratio_max)

        # Apply market filters
        if criteria.market_cap_min is not None:
            filters.append(Stock.market_cap >= criteria.market_cap_min)
        if criteria.market_cap_max is not None:
            filters.append(Stock.market_cap <= criteria.market_cap_max)
        if criteria.sector:
            filters.append(Stock.sector == criteria.sector)

        # Apply all filters
        if filters:
            query = query.filter(and_(*filters))

        # Apply sorting
        sort_field = getattr(Stock, criteria.sort_by, None) or \
                    getattr(StockFundamental, criteria.sort_by, None) or \
                    getattr(StockScore, criteria.sort_by, None)

        if sort_field is not None:
            if criteria.sort_order == "asc":
                query = query.order_by(sort_field.asc())
            else:
                query = query.order_by(sort_field.desc())

        # Apply limit
        stocks = query.limit(criteria.limit).all()

        # Convert to ScreenerResult with additional analysis
        results = []
        for stock in stocks:
            result = ScreenerResult(
                **stock.__dict__,
                match_score=100,  # Calculate based on criteria
                strengths=self._analyze_strengths(stock),
                weaknesses=self._analyze_weaknesses(stock),
            )
            results.append(result)

        return ScreenerResponse(
            results=results,
            criteria=self._describe_criteria(criteria),
            total_matches=len(results),
            strategy_name=None,
        )

    def value_gems_strategy(self, limit: int = 50) -> ScreenerResponse:
        """
        Value Gems Strategy: Low P/E + High ROIC + Low Debt

        Target: Undervalued quality companies
        Criteria:
        - P/E < 15 (undervalued)
        - ROIC > 15% (high quality)
        - Debt/Equity < 0.5 (financially healthy)
        """
        criteria = ScreenerCriteria(
            pe_max=Decimal("15"),
            roic_min=Decimal("15"),
            debt_equity_max=Decimal("0.5"),
            sort_by="roic",
            sort_order="desc",
            limit=limit,
        )

        response = self.screen_stocks(criteria)
        response.strategy_name = "Value Gems 💎"
        response.criteria = "Low P/E (<15) + High ROIC (>15%) + Low Debt (<0.5 D/E)"

        return response

    def quality_compounders_strategy(self, limit: int = 50) -> ScreenerResponse:
        """
        Quality Compounders Strategy: High ROIC + High Margins + Growing Revenue

        Target: Long-term wealth builders
        Criteria:
        - ROIC > 20% (exceptional capital efficiency)
        - Net Margin > 15% (highly profitable)
        - Revenue Growth > 0% (growing business)
        """
        criteria = ScreenerCriteria(
            roic_min=Decimal("20"),
            net_margin_min=Decimal("15"),
            revenue_growth_min=Decimal("0"),
            sort_by="roic",
            sort_order="desc",
            limit=limit,
        )

        response = self.screen_stocks(criteria)
        response.strategy_name = "Quality Compounders 🚀"
        response.criteria = "High ROIC (>20%) + High Net Margin (>15%) + Growing Revenue"

        return response

    def dividend_kings_strategy(self, limit: int = 50) -> ScreenerResponse:
        """
        Dividend Kings Strategy: High Yield + Sustainable Payout

        Target: Income + stability
        Criteria:
        - Dividend Yield > 3% (good income)
        - Payout Ratio < 70% (sustainable)
        - Debt/Equity < 1.0 (healthy balance sheet)
        """
        criteria = ScreenerCriteria(
            dividend_yield_min=Decimal("3.0"),
            payout_ratio_max=Decimal("70"),
            debt_equity_max=Decimal("1.0"),
            sort_by="dividend_yield",
            sort_order="desc",
            limit=limit,
        )

        response = self.screen_stocks(criteria)
        response.strategy_name = "Dividend Kings 👑"
        response.criteria = "Dividend Yield >3% + Payout Ratio <70% + Healthy Balance Sheet"

        return response

    def deep_value_strategy(self, limit: int = 50) -> ScreenerResponse:
        """
        Deep Value Strategy: Low P/B + Positive FCF + Not Overleveraged

        Target: Distressed turnarounds
        Criteria:
        - P/B < 2.0 (trading below book value)
        - FCF Yield > 3% (positive cash generation)
        - Debt/Equity < 1.0 (not too leveraged)
        """
        criteria = ScreenerCriteria(
            pb_max=Decimal("2.0"),
            fcf_yield_min=Decimal("3.0"),
            debt_equity_max=Decimal("1.0"),
            sort_by="pb_ratio",
            sort_order="asc",
            limit=limit,
        )

        response = self.screen_stocks(criteria)
        response.strategy_name = "Deep Value 🔍"
        response.criteria = "P/B <2.0 + FCF Yield >3% + Debt/Equity <1.0"

        return response

    def explosive_growth_strategy(self, limit: int = 50) -> ScreenerResponse:
        """
        Explosive Growth Strategy: High Revenue Growth + Low PEG

        Target: Growth at reasonable price
        Criteria:
        - Revenue Growth > 30% (explosive growth)
        - PEG < 2.0 (not overvalued relative to growth)
        - Net Margin > 0% (profitable or near profitability)
        """
        criteria = ScreenerCriteria(
            revenue_growth_min=Decimal("30"),
            peg_max=Decimal("2.0"),
            net_margin_min=Decimal("0"),
            sort_by="revenue_growth",
            sort_order="desc",
            limit=limit,
        )

        response = self.screen_stocks(criteria)
        response.strategy_name = "Explosive Growth ⚡"
        response.criteria = "Revenue Growth >30% + PEG <2.0 + Positive Margins"

        return response

    def _analyze_strengths(self, stock: Stock) -> List[str]:
        """Analyze stock strengths based on fundamentals."""
        strengths = []

        if not stock.fundamentals:
            return strengths

        f = stock.fundamentals

        # Check valuation strengths
        if f.pe_ratio and f.pe_ratio < 15:
            strengths.append(f"Low P/E ratio ({f.pe_ratio:.1f})")
        if f.peg_ratio and f.peg_ratio < 1.5:
            strengths.append(f"Attractive PEG ratio ({f.peg_ratio:.1f})")

        # Check profitability strengths
        if f.roic and f.roic > 20:
            strengths.append(f"Excellent ROIC ({f.roic:.1f}%)")
        if f.roe and f.roe > 20:
            strengths.append(f"Strong ROE ({f.roe:.1f}%)")
        if f.net_margin and f.net_margin > 15:
            strengths.append(f"High net margin ({f.net_margin:.1f}%)")

        # Check financial health strengths
        if f.debt_equity and f.debt_equity < 0.3:
            strengths.append(f"Low debt ({f.debt_equity:.2f} D/E)")
        if f.current_ratio and f.current_ratio > 2.0:
            strengths.append(f"Strong liquidity ({f.current_ratio:.1f} current ratio)")
        if f.fcf_yield and f.fcf_yield > 5:
            strengths.append(f"High FCF yield ({f.fcf_yield:.1f}%)")

        # Check growth strengths
        if f.revenue_growth and f.revenue_growth > 20:
            strengths.append(f"Strong revenue growth ({f.revenue_growth:.1f}%)")

        # Check dividend strengths
        if f.dividend_yield and f.dividend_yield > 3:
            strengths.append(f"Good dividend yield ({f.dividend_yield:.2f}%)")

        return strengths[:5]  # Limit to top 5 strengths

    def _analyze_weaknesses(self, stock: Stock) -> List[str]:
        """Analyze stock weaknesses based on fundamentals."""
        weaknesses = []

        if not stock.fundamentals:
            return weaknesses

        f = stock.fundamentals

        # Check valuation weaknesses
        if f.pe_ratio and f.pe_ratio > 40:
            weaknesses.append(f"High P/E ratio ({f.pe_ratio:.1f})")
        if f.peg_ratio and f.peg_ratio > 2.5:
            weaknesses.append(f"Expensive PEG ratio ({f.peg_ratio:.1f})")

        # Check profitability weaknesses
        if f.roic and f.roic < 10:
            weaknesses.append(f"Low ROIC ({f.roic:.1f}%)")
        if f.net_margin and f.net_margin < 5:
            weaknesses.append(f"Low net margin ({f.net_margin:.1f}%)")

        # Check financial health weaknesses
        if f.debt_equity and f.debt_equity > 1.0:
            weaknesses.append(f"High debt ({f.debt_equity:.2f} D/E)")
        if f.current_ratio and f.current_ratio < 1.0:
            weaknesses.append(f"Weak liquidity ({f.current_ratio:.1f} current ratio)")

        # Check growth weaknesses
        if f.revenue_growth and f.revenue_growth < 0:
            weaknesses.append(f"Declining revenue ({f.revenue_growth:.1f}%)")
        if f.earnings_growth and f.earnings_growth < -10:
            weaknesses.append(f"Declining earnings ({f.earnings_growth:.1f}%)")

        return weaknesses[:5]  # Limit to top 5 weaknesses

    def _describe_criteria(self, criteria: ScreenerCriteria) -> str:
        """Generate a human-readable description of the screening criteria."""
        parts = []

        if criteria.pe_min or criteria.pe_max:
            pe_desc = []
            if criteria.pe_min:
                pe_desc.append(f"P/E ≥ {criteria.pe_min}")
            if criteria.pe_max:
                pe_desc.append(f"P/E ≤ {criteria.pe_max}")
            parts.append(" and ".join(pe_desc))

        if criteria.roic_min:
            parts.append(f"ROIC ≥ {criteria.roic_min}%")

        if criteria.debt_equity_max:
            parts.append(f"D/E ≤ {criteria.debt_equity_max}")

        if criteria.dividend_yield_min:
            parts.append(f"Dividend Yield ≥ {criteria.dividend_yield_min}%")

        if criteria.revenue_growth_min:
            parts.append(f"Revenue Growth ≥ {criteria.revenue_growth_min}%")

        if not parts:
            return "No filters applied"

        return " | ".join(parts)
