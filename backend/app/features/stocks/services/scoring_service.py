"""
Stock scoring service implementing the multi-factor scoring methodology.

This module calculates a 0-100 score for stocks based on four equal-weighted factors:
1. Value Score (0-25): Valuation metrics (P/E, EV/EBITDA, PEG, P/B)
2. Quality Score (0-25): Profitability metrics (ROIC, ROE, margins, FCF)
3. Momentum Score (0-25): Price trends (RSI, moving averages, volume) - Phase 4
4. Financial Health Score (0-25): Balance sheet strength (debt, liquidity, coverage)

See /backend/SCORING_METHODOLOGY.md for detailed methodology and validation.

IMPORTANT: This is for educational/research purposes only. Not financial advice.
"""
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import statistics

from app.features.stocks.models import StockFundamental, Signal
from app.features.stocks.services.momentum_service import get_momentum_service


@dataclass
class ScoreBreakdown:
    """Detailed breakdown of a stock's score."""
    total_score: float
    value_score: float
    quality_score: float
    momentum_score: float
    health_score: float
    signal: Signal
    strengths: List[str]
    weaknesses: List[str]
    reasoning: str
    percentile: Optional[int] = None  # Percentile vs all stocks (0-100)


@dataclass
class SectorBenchmarks:
    """Sector average metrics for comparison."""
    sector: str
    avg_pe: Optional[float]
    avg_ev_ebitda: Optional[float]
    avg_roic: Optional[float]
    avg_roe: Optional[float]
    avg_debt_equity: Optional[float]
    avg_gross_margin: Optional[float]
    avg_operating_margin: Optional[float]
    avg_net_margin: Optional[float]
    stock_count: int


class ScoringService:
    """Service for calculating stock scores based on fundamental metrics."""

    # Score component weights (must sum to 100)
    WEIGHT_VALUE = 25.0
    WEIGHT_QUALITY = 25.0
    WEIGHT_MOMENTUM = 25.0  # Defaults to neutral (12.5) until Phase 4
    WEIGHT_HEALTH = 25.0

    # Signal thresholds
    SIGNAL_STRONG_BUY_THRESHOLD = 90.0
    SIGNAL_BUY_THRESHOLD = 75.0
    SIGNAL_HOLD_THRESHOLD = 50.0
    SIGNAL_SELL_THRESHOLD = 25.0

    def __init__(self, all_stocks_fundamentals: List[StockFundamental], sector_benchmarks: Dict[str, SectorBenchmarks]):
        """
        Initialize scoring service.

        Args:
            all_stocks_fundamentals: All stock fundamentals for percentile calculations
            sector_benchmarks: Sector average metrics for comparison
        """
        self.all_stocks = all_stocks_fundamentals
        self.sector_benchmarks = sector_benchmarks
        self._calculate_global_percentiles()

    def _calculate_global_percentiles(self):
        """Calculate percentile thresholds for ROIC across all stocks."""
        roic_values = [float(s.roic) for s in self.all_stocks if s.roic is not None and s.roic > 0]

        if not roic_values:
            # Fallback if no data
            self.roic_p90 = 25.0
            self.roic_p75 = 18.0
            self.roic_p50 = 12.0
            self.roic_p25 = 6.0
        else:
            self.roic_p90 = statistics.quantiles(roic_values, n=10)[8] if len(roic_values) >= 10 else max(roic_values)
            self.roic_p75 = statistics.quantiles(roic_values, n=4)[2] if len(roic_values) >= 4 else statistics.median(roic_values)
            self.roic_p50 = statistics.median(roic_values)
            self.roic_p25 = statistics.quantiles(roic_values, n=4)[0] if len(roic_values) >= 4 else min(roic_values)

    def calculate_score(
        self,
        fundamentals: StockFundamental,
        sector: Optional[str] = None,
        technical_indicators: Optional[Dict[str, float]] = None,
    ) -> ScoreBreakdown:
        """
        Calculate total score and breakdown for a stock.

        Args:
            fundamentals: Stock fundamental metrics
            sector: Stock's sector for comparison
            technical_indicators: Technical indicators (RSI, MAs, volume) for momentum scoring.
                                If None, defaults to neutral momentum score.

        Returns:
            ScoreBreakdown with total score, component scores, and explanations
        """
        # Get sector benchmarks if available
        sector_bench = self.sector_benchmarks.get(sector) if sector else None

        # Calculate component scores
        value_score, value_details = self._calculate_value_score(fundamentals, sector_bench)
        quality_score, quality_details = self._calculate_quality_score(fundamentals, sector_bench)
        health_score, health_details = self._calculate_health_score(fundamentals, sector)

        # Momentum score - use real calculation if indicators available, otherwise neutral
        if technical_indicators:
            momentum_service = get_momentum_service()
            momentum_score, momentum_calc = momentum_service.calculate_momentum_score(technical_indicators)
            momentum_details = {
                "score": momentum_score,
                "components": momentum_calc.components,
                "indicators": momentum_calc.indicators,
            }
        else:
            # Default to neutral if no price data available yet
            momentum_score = 12.5
            momentum_details = {
                "score": momentum_score,
                "components": [],
                "note": "No price data available - using neutral momentum score"
            }

        # Calculate total score
        total_score = value_score + quality_score + momentum_score + health_score

        # Determine signal
        signal = self._calculate_signal(total_score)

        # Generate strengths and weaknesses
        strengths, weaknesses = self._analyze_strengths_weaknesses(
            value_details, quality_details, health_details, momentum_details
        )

        # Generate reasoning
        reasoning = self._generate_reasoning(
            total_score, signal, value_score, quality_score, health_score, strengths, weaknesses
        )

        return ScoreBreakdown(
            total_score=round(total_score, 2),
            value_score=round(value_score, 2),
            quality_score=round(quality_score, 2),
            momentum_score=round(momentum_score, 2),
            health_score=round(health_score, 2),
            signal=signal,
            strengths=strengths,
            weaknesses=weaknesses,
            reasoning=reasoning,
        )

    def _calculate_value_score(
        self,
        f: StockFundamental,
        sector_bench: Optional[SectorBenchmarks],
    ) -> Tuple[float, Dict]:
        """
        Calculate Value Score (0-25 points).

        Components:
        - P/E ratio vs sector (8 pts)
        - EV/EBITDA vs sector (6 pts)
        - PEG ratio (6 pts)
        - P/B ratio (5 pts)
        """
        score = 0.0
        details = {"components": []}

        # A) P/E Ratio vs Sector (8 points)
        pe_score = self._score_pe_ratio(f.pe_ratio, sector_bench)
        score += pe_score
        details["components"].append({"name": "P/E vs Sector", "score": pe_score, "max": 8})

        # B) EV/EBITDA vs Sector (6 points)
        ev_ebitda_score = self._score_ev_ebitda(f.ev_ebitda, sector_bench)
        score += ev_ebitda_score
        details["components"].append({"name": "EV/EBITDA vs Sector", "score": ev_ebitda_score, "max": 6})

        # C) PEG Ratio (6 points)
        peg_score = self._score_peg_ratio(f.peg_ratio, f.pe_ratio)
        score += peg_score
        details["components"].append({"name": "PEG Ratio", "score": peg_score, "max": 6})

        # D) P/B Ratio (5 points)
        pb_score = self._score_pb_ratio(f.pb_ratio, sector_bench)
        score += pb_score
        details["components"].append({"name": "P/B Ratio", "score": pb_score, "max": 5})

        details["score"] = score
        return score, details

    def _score_pe_ratio(self, pe: Optional[Decimal], sector_bench: Optional[SectorBenchmarks]) -> float:
        """Score P/E ratio vs sector average (0-8 points)."""
        if pe is None or pe <= 0:
            return 0.0  # Negative P/E = losses

        pe_val = float(pe)

        # Cap outliers
        if pe_val > 100:
            pe_val = 100

        # Get sector average or use reasonable default
        sector_avg = float(sector_bench.avg_pe) if sector_bench and sector_bench.avg_pe else 20.0

        ratio = pe_val / sector_avg

        if ratio < 0.5:  # <50% of sector avg
            return 8.0
        elif ratio < 0.75:  # <75% of sector avg
            return 6.0
        elif ratio <= 1.25:  # 75-125% of sector avg (fairly valued)
            return 4.0
        elif ratio <= 2.0:  # 125-200% of sector avg
            return 2.0
        else:  # >200% of sector avg
            return 0.0

    def _score_ev_ebitda(self, ev_ebitda: Optional[Decimal], sector_bench: Optional[SectorBenchmarks]) -> float:
        """Score EV/EBITDA ratio vs sector average (0-6 points)."""
        if ev_ebitda is None or ev_ebitda <= 0:
            return 3.0  # Neutral if missing

        ev_val = float(ev_ebitda)

        # Cap outliers
        if ev_val > 100:
            ev_val = 100

        # Get sector average or use reasonable default
        sector_avg = float(sector_bench.avg_ev_ebitda) if sector_bench and sector_bench.avg_ev_ebitda else 15.0

        ratio = ev_val / sector_avg

        if ratio < 0.6:  # <60% of sector avg
            return 6.0
        elif ratio < 0.85:  # <85% of sector avg
            return 4.0
        elif ratio <= 1.15:  # 85-115% of sector avg
            return 3.0
        elif ratio <= 2.0:
            return 1.0
        else:
            return 0.0

    def _score_peg_ratio(self, peg: Optional[Decimal], pe: Optional[Decimal]) -> float:
        """Score PEG ratio (0-6 points). Peter Lynch's favorite metric."""
        if peg is None:
            return 3.0  # Neutral if missing

        peg_val = float(peg)

        # Negative growth makes PEG meaningless
        if peg_val < 0:
            return 0.0

        # Very high P/E even with growth is risky
        if pe and float(pe) > 50:
            return min(2.0, self._peg_score_helper(peg_val))

        return self._peg_score_helper(peg_val)

    def _peg_score_helper(self, peg_val: float) -> float:
        """Helper for PEG scoring."""
        if peg_val < 0.5:
            return 6.0  # Steal!
        elif peg_val < 1.0:
            return 5.0  # Excellent
        elif peg_val < 1.5:
            return 4.0  # Good
        elif peg_val < 2.0:
            return 2.0  # Fair
        else:
            return 0.0  # Expensive

    def _score_pb_ratio(self, pb: Optional[Decimal], sector_bench: Optional[SectorBenchmarks]) -> float:
        """Score P/B ratio (0-5 points). Context-dependent by sector."""
        if pb is None:
            return 2.5  # Neutral if missing

        pb_val = float(pb)

        if pb_val < 0:
            return 0.0  # Negative book value = problem

        # Sector-specific scoring (simplified - could be more granular)
        # For now, use general tech/service scoring
        if pb_val < 2.0:
            return 5.0
        elif pb_val < 5.0:
            return 3.0
        else:
            return 1.0

    def _calculate_quality_score(
        self,
        f: StockFundamental,
        sector_bench: Optional[SectorBenchmarks],
    ) -> Tuple[float, Dict]:
        """
        Calculate Quality Score (0-25 points).

        Components:
        - ROIC percentile (10 pts) - Buffett's favorite
        - ROE vs sector (7 pts)
        - Margin quality (5 pts)
        - FCF consistency (3 pts)
        """
        score = 0.0
        details = {"components": []}

        # A) ROIC Percentile (10 points)
        roic_score = self._score_roic_percentile(f.roic)
        score += roic_score
        details["components"].append({"name": "ROIC Percentile", "score": roic_score, "max": 10})

        # B) ROE vs Sector (7 points)
        roe_score = self._score_roe(f.roe, sector_bench)
        score += roe_score
        details["components"].append({"name": "ROE vs Sector", "score": roe_score, "max": 7})

        # C) Margin Quality (5 points)
        margin_score = self._score_margins(f.net_margin)
        score += margin_score
        details["components"].append({"name": "Margin Quality", "score": margin_score, "max": 5})

        # D) FCF Consistency (3 points)
        fcf_score = self._score_fcf_yield(f.fcf_yield)
        score += fcf_score
        details["components"].append({"name": "FCF Yield", "score": fcf_score, "max": 3})

        details["score"] = score
        return score, details

    def _score_roic_percentile(self, roic: Optional[Decimal]) -> float:
        """Score ROIC based on percentile vs all stocks (0-10 points)."""
        if roic is None or roic <= 0:
            return 0.0

        roic_val = float(roic)

        # Cap outliers
        if roic_val > 200:
            roic_val = 200

        # Score based on percentiles
        if roic_val >= self.roic_p90:  # Top 10%
            return 10.0
        elif roic_val >= self.roic_p75:  # Top 25%
            return 8.0
        elif roic_val >= self.roic_p50:  # Top 50%
            return 5.0
        elif roic_val >= self.roic_p25:  # Bottom 50%
            return 3.0
        else:  # Bottom 25%
            return 0.0

    def _score_roe(self, roe: Optional[Decimal], sector_bench: Optional[SectorBenchmarks]) -> float:
        """Score ROE vs sector average (0-7 points)."""
        if roe is None:
            return 3.5  # Neutral if missing

        roe_val = float(roe)

        if roe_val <= 0:
            return 0.0  # Losing money

        # Cap outliers
        if roe_val > 200:
            roe_val = 200

        # Get sector average or use reasonable default
        sector_avg = float(sector_bench.avg_roe) if sector_bench and sector_bench.avg_roe else 15.0

        ratio = roe_val / sector_avg

        if ratio > 1.5:  # >150% of sector avg
            return 7.0
        elif ratio > 1.25:  # >125% of sector avg
            return 5.0
        elif ratio >= 0.75:  # 75-125% of sector avg
            return 3.0
        elif ratio >= 0.5:
            return 1.0
        else:
            return 0.0

    def _score_margins(self, net_margin: Optional[Decimal]) -> float:
        """Score net margin level (0-5 points)."""
        if net_margin is None:
            return 2.5  # Neutral if missing

        margin_val = float(net_margin)

        if margin_val < 0:
            return 0.0  # Losing money
        elif margin_val >= 20:
            return 5.0  # Excellent
        elif margin_val >= 15:
            return 4.0  # Good
        elif margin_val >= 10:
            return 3.0  # Decent
        elif margin_val >= 5:
            return 2.0  # Thin
        else:
            return 1.0  # Concerning

    def _score_fcf_yield(self, fcf_yield: Optional[Decimal]) -> float:
        """Score FCF yield (0-3 points). Cash is king."""
        if fcf_yield is None:
            return 1.5  # Neutral if missing

        fcf_val = float(fcf_yield)

        if fcf_val < 0:
            return 0.0  # Burning cash

        if fcf_val >= 8:
            return 3.0  # Excellent
        elif fcf_val >= 5:
            return 2.0  # Good
        elif fcf_val >= 2:
            return 1.0  # Okay
        else:
            return 0.0  # Weak

    def _calculate_health_score(
        self,
        f: StockFundamental,
        sector: Optional[str],
    ) -> Tuple[float, Dict]:
        """
        Calculate Financial Health Score (0-25 points).

        Components:
        - Debt/Equity ratio (10 pts)
        - Current ratio (6 pts)
        - Interest coverage (5 pts)
        - FCF yield (4 pts)
        """
        score = 0.0
        details = {"components": []}

        # A) Debt/Equity Ratio (10 points)
        de_score = self._score_debt_equity(f.debt_equity, sector)
        score += de_score
        details["components"].append({"name": "Debt/Equity Ratio", "score": de_score, "max": 10})

        # B) Current Ratio (6 points)
        cr_score = self._score_current_ratio(f.current_ratio, sector)
        score += cr_score
        details["components"].append({"name": "Current Ratio", "score": cr_score, "max": 6})

        # C) Interest Coverage (5 points)
        ic_score = self._score_interest_coverage(f.interest_coverage)
        score += ic_score
        details["components"].append({"name": "Interest Coverage", "score": ic_score, "max": 5})

        # D) FCF Yield (4 points)
        fcf_health_score = self._score_fcf_for_health(f.fcf_yield)
        score += fcf_health_score
        details["components"].append({"name": "FCF Yield (Health)", "score": fcf_health_score, "max": 4})

        details["score"] = score
        return score, details

    def _score_debt_equity(self, de: Optional[Decimal], sector: Optional[str]) -> float:
        """Score Debt/Equity ratio (0-10 points). Lower is better (usually)."""
        if de is None:
            return 5.0  # Neutral if missing

        de_val = float(de)

        if de_val < 0:
            return 0.0  # Negative equity = big problem

        # Sector adjustments
        is_financial = sector in ["Financial Services", "Banks"]
        is_utility = sector in ["Utilities"]

        if is_financial:
            # Banks use debt as product - different scoring
            # Focus more on capital ratios (not implemented in MVP)
            return 5.0  # Neutral for now

        if is_utility:
            # Utilities are capital intensive, higher D/E is normal
            if de_val < 0.5:
                return 10.0
            elif de_val < 1.0:
                return 8.0
            elif de_val < 2.0:
                return 5.0
            elif de_val < 3.0:
                return 2.0
            else:
                return 0.0
        else:
            # Standard companies
            if de_val < 0.3:
                return 10.0  # Fortress balance sheet
            elif de_val < 0.5:
                return 8.0  # Conservative
            elif de_val < 1.0:
                return 5.0  # Moderate
            elif de_val < 2.0:
                return 2.0  # Concerning
            else:
                return 0.0  # Dangerous

    def _score_current_ratio(self, cr: Optional[Decimal], sector: Optional[str]) -> float:
        """Score current ratio (0-6 points). Can they pay short-term bills?"""
        # Banks don't use current ratio
        if sector in ["Financial Services", "Banks"]:
            return 3.0  # Neutral for banks

        if cr is None:
            return 3.0  # Neutral if missing

        cr_val = float(cr)

        if cr_val < 0:
            return 0.0  # Problem

        if cr_val >= 2.5:
            return 6.0  # Very safe
        elif cr_val >= 2.0:
            return 5.0  # Safe
        elif cr_val >= 1.5:
            return 4.0  # Adequate
        elif cr_val >= 1.0:
            return 2.0  # Tight
        else:
            return 0.0  # Liquidity crisis

    def _score_interest_coverage(self, coverage: Optional[Decimal]) -> float:
        """Score interest coverage (0-5 points). Can they afford debt service?"""
        if coverage is None:
            return 2.5  # Neutral if missing

        cov_val = float(coverage)

        if cov_val < 0:
            return 0.0  # Losing money

        if cov_val >= 10:
            return 5.0  # No problem
        elif cov_val >= 5:
            return 4.0  # Comfortable
        elif cov_val >= 3:
            return 3.0  # Okay
        elif cov_val >= 1.5:
            return 1.0  # Risky
        else:
            return 0.0  # In trouble

    def _score_fcf_for_health(self, fcf_yield: Optional[Decimal]) -> float:
        """Score FCF yield for health assessment (0-4 points)."""
        if fcf_yield is None:
            return 2.0  # Neutral if missing

        fcf_val = float(fcf_yield)

        if fcf_val < 0:
            return 0.0  # Burning cash

        if fcf_val >= 8:
            return 4.0
        elif fcf_val >= 5:
            return 3.0
        elif fcf_val >= 3:
            return 2.0
        elif fcf_val >= 1:
            return 1.0
        else:
            return 0.0

    def _calculate_signal(self, total_score: float) -> Signal:
        """Determine buy/sell signal from total score."""
        if total_score >= self.SIGNAL_STRONG_BUY_THRESHOLD:
            return Signal.STRONG_BUY
        elif total_score >= self.SIGNAL_BUY_THRESHOLD:
            return Signal.BUY
        elif total_score >= self.SIGNAL_HOLD_THRESHOLD:
            return Signal.HOLD
        elif total_score >= self.SIGNAL_SELL_THRESHOLD:
            return Signal.SELL
        else:
            return Signal.STRONG_SELL

    def _analyze_strengths_weaknesses(
        self,
        value_details: Dict,
        quality_details: Dict,
        health_details: Dict,
        momentum_details: Dict,
    ) -> Tuple[List[str], List[str]]:
        """
        Analyze component scores to identify strengths and weaknesses.

        Returns:
            Tuple of (strengths, weaknesses) as lists of human-readable strings
        """
        strengths = []
        weaknesses = []

        # Value factor
        if value_details["score"] >= 20:  # 80%+ of max
            strengths.append(f"Excellent valuation (scored {value_details['score']:.1f}/25)")
        elif value_details["score"] >= 15:  # 60%+
            strengths.append(f"Good valuation (scored {value_details['score']:.1f}/25)")
        elif value_details["score"] < 8:  # <32%
            weaknesses.append(f"Expensive valuation (scored {value_details['score']:.1f}/25)")

        # Quality factor
        if quality_details["score"] >= 20:
            strengths.append(f"High-quality business (scored {quality_details['score']:.1f}/25)")
        elif quality_details["score"] >= 15:
            strengths.append(f"Good quality metrics (scored {quality_details['score']:.1f}/25)")
        elif quality_details["score"] < 10:
            weaknesses.append(f"Weak profitability (scored {quality_details['score']:.1f}/25)")

        # Health factor
        if health_details["score"] >= 20:
            strengths.append(f"Strong balance sheet (scored {health_details['score']:.1f}/25)")
        elif health_details["score"] >= 15:
            strengths.append(f"Solid financial health (scored {health_details['score']:.1f}/25)")
        elif health_details["score"] < 10:
            weaknesses.append(f"Concerning financial health (scored {health_details['score']:.1f}/25)")

        # Component-level analysis
        for details in [value_details, quality_details, health_details]:
            for comp in details.get("components", []):
                score_pct = (comp["score"] / comp["max"]) * 100 if comp["max"] > 0 else 0

                # Highlight specific strong components
                if score_pct >= 90 and comp["max"] >= 5:
                    strengths.append(f"Excellent {comp['name'].lower()} ({comp['score']:.1f}/{comp['max']})")

                # Highlight specific weak components
                elif score_pct <= 20 and comp["max"] >= 5:
                    weaknesses.append(f"Weak {comp['name'].lower()} ({comp['score']:.1f}/{comp['max']})")

        # Limit to top 5 of each
        strengths = strengths[:5]
        weaknesses = weaknesses[:5]

        # Always mention momentum status
        if momentum_details.get("note"):
            weaknesses.append("Momentum score not yet available (Phase 4)")

        return strengths, weaknesses

    def _generate_reasoning(
        self,
        total_score: float,
        signal: Signal,
        value_score: float,
        quality_score: float,
        health_score: float,
        strengths: List[str],
        weaknesses: List[str],
    ) -> str:
        """Generate human-readable reasoning for the score and signal."""

        # Signal-based opening
        if signal == Signal.STRONG_BUY:
            intro = "Exceptional investment opportunity with strong fundamentals across all factors."
        elif signal == Signal.BUY:
            intro = "Attractive investment candidate with solid fundamentals."
        elif signal == Signal.HOLD:
            intro = "Mixed signals - some strengths but also notable weaknesses."
        elif signal == Signal.SELL:
            intro = "Multiple concerning factors make this unattractive at current levels."
        else:  # STRONG_SELL
            intro = "Significant fundamental problems across multiple areas."

        # Component summary
        component_summary = []
        if value_score >= 18:
            component_summary.append("attractively valued")
        elif value_score < 10:
            component_summary.append("expensive")

        if quality_score >= 18:
            component_summary.append("high-quality business model")
        elif quality_score < 10:
            component_summary.append("weak profitability")

        if health_score >= 18:
            component_summary.append("strong balance sheet")
        elif health_score < 10:
            component_summary.append("concerning financial health")

        if component_summary:
            component_text = "This stock is " + ", ".join(component_summary) + ". "
        else:
            component_text = ""

        # Strengths/weaknesses summary
        strength_text = f"Key strengths: {'; '.join(strengths[:3])}. " if strengths else ""
        weakness_text = f"Key weaknesses: {'; '.join(weaknesses[:3])}. " if weaknesses else ""

        # Action recommendation
        if signal in [Signal.STRONG_BUY, Signal.BUY]:
            action = "Consider for further research and potential investment."
        elif signal == Signal.HOLD:
            action = "Wait for better entry point or improvement in weak areas."
        else:
            action = "Better opportunities likely available elsewhere."

        return f"{intro} {component_text}{strength_text}{weakness_text}{action}"
