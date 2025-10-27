"""
Momentum scoring service for Phase 4.

Calculates momentum score (0-25 points) based on technical indicators:
1. Price vs 50-day MA (7 pts) - Short-term trend
2. Price vs 200-day MA (7 pts) - Long-term trend
3. RSI (6 pts) - Relative Strength Index
4. Volume trend (5 pts) - Increasing volume on up days

This replaces the neutral 12.5 default from Phase 3.
"""
from typing import Dict, Tuple, Optional, List
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class MomentumDetails:
    """Details of momentum scoring components."""
    score: float
    components: List[Dict[str, float]]
    indicators: Dict[str, float]


class MomentumScoringService:
    """Service for calculating momentum scores from technical indicators."""

    def calculate_momentum_score(
        self,
        indicators: Dict[str, float]
    ) -> Tuple[float, MomentumDetails]:
        """
        Calculate momentum score (0-25 points) from technical indicators.

        Args:
            indicators: Dictionary with technical indicator values:
                - price: Current price
                - sma_50: 50-day simple moving average
                - sma_200: 200-day simple moving average
                - rsi: 14-day RSI (0-100)
                - volume_trend: Volume vs 20-day average (%)

        Returns:
            Tuple of (score, details)
        """
        score = 0.0
        components = []

        # A) Price vs 50-day MA (7 points) - Short-term trend
        sma50_score = self._score_price_vs_sma50(
            indicators.get('price_vs_sma50', 0)
        )
        score += sma50_score
        components.append({
            "name": "Price vs 50-day MA",
            "score": sma50_score,
            "max": 7,
            "value": indicators.get('price_vs_sma50', 0)
        })

        # B) Price vs 200-day MA (7 points) - Long-term trend
        sma200_score = self._score_price_vs_sma200(
            indicators.get('price_vs_sma200', 0)
        )
        score += sma200_score
        components.append({
            "name": "Price vs 200-day MA",
            "score": sma200_score,
            "max": 7,
            "value": indicators.get('price_vs_sma200', 0)
        })

        # C) RSI (6 points) - Relative strength
        rsi_score = self._score_rsi(indicators.get('rsi', 50))
        score += rsi_score
        components.append({
            "name": "RSI",
            "score": rsi_score,
            "max": 6,
            "value": indicators.get('rsi', 50)
        })

        # D) Volume Trend (5 points) - Confirmation
        volume_score = self._score_volume_trend(
            indicators.get('volume_trend', 0)
        )
        score += volume_score
        components.append({
            "name": "Volume Trend",
            "score": volume_score,
            "max": 5,
            "value": indicators.get('volume_trend', 0)
        })

        details = MomentumDetails(
            score=score,
            components=components,
            indicators=indicators
        )

        return score, details

    def _score_price_vs_sma50(self, price_vs_sma50: float) -> float:
        """
        Score price position relative to 50-day MA (0-7 points).

        Philosophy: Price above MA = uptrend, below = downtrend.
        But don't chase extremes (too far above = overbought).

        Args:
            price_vs_sma50: Price vs SMA50 in % (e.g., 5.0 = 5% above MA)

        Returns:
            Score from 0 to 7
        """
        if price_vs_sma50 >= 10:  # >10% above = overbought
            return 4.0
        elif price_vs_sma50 >= 5:  # 5-10% above = strong uptrend
            return 7.0
        elif price_vs_sma50 >= 2:  # 2-5% above = uptrend
            return 6.0
        elif price_vs_sma50 >= 0:  # 0-2% above = mild uptrend
            return 4.5
        elif price_vs_sma50 >= -2:  # 0-2% below = mild downtrend
            return 3.0
        elif price_vs_sma50 >= -5:  # 2-5% below = downtrend
            return 2.0
        elif price_vs_sma50 >= -10:  # 5-10% below = strong downtrend
            return 1.0
        else:  # >10% below = oversold (could be opportunity or red flag)
            return 0.0

    def _score_price_vs_sma200(self, price_vs_sma200: float) -> float:
        """
        Score price position relative to 200-day MA (0-7 points).

        Philosophy: 200-day MA is the "line in the sand" for long-term trend.
        Above = bull market, below = bear market.

        Args:
            price_vs_sma200: Price vs SMA200 in % (e.g., 5.0 = 5% above MA)

        Returns:
            Score from 0 to 7
        """
        if price_vs_sma200 >= 20:  # >20% above = extended rally
            return 5.0
        elif price_vs_sma200 >= 10:  # 10-20% above = strong bull trend
            return 7.0
        elif price_vs_sma200 >= 5:  # 5-10% above = bull trend
            return 6.0
        elif price_vs_sma200 >= 0:  # 0-5% above = mild bull
            return 4.5
        elif price_vs_sma200 >= -5:  # 0-5% below = mild bear
            return 3.0
        elif price_vs_sma200 >= -10:  # 5-10% below = bear trend
            return 2.0
        elif price_vs_sma200 >= -20:  # 10-20% below = strong bear
            return 1.0
        else:  # >20% below = deep bear (capitulation zone)
            return 0.0

    def _score_rsi(self, rsi: float) -> float:
        """
        Score RSI (Relative Strength Index) (0-6 points).

        Philosophy: RSI 40-60 is optimal (not overbought or oversold).
        Extremes (<30 or >70) can signal reversals or exhaustion.

        Args:
            rsi: RSI value (0-100)

        Returns:
            Score from 0 to 6
        """
        if rsi >= 80:  # Severely overbought
            return 1.0
        elif rsi >= 70:  # Overbought (could reverse)
            return 3.0
        elif rsi >= 60:  # Mild overbought
            return 5.0
        elif rsi >= 40:  # Goldilocks zone (not too hot, not too cold)
            return 6.0
        elif rsi >= 30:  # Mild oversold
            return 5.0
        elif rsi >= 20:  # Oversold (could bounce)
            return 3.0
        else:  # Severely oversold (<20)
            return 1.0

    def _score_volume_trend(self, volume_trend: float) -> float:
        """
        Score volume trend (0-5 points).

        Philosophy: "Volume confirms price".
        Rising volume on uptrends = healthy. Rising volume on downtrends = capitulation.
        We score based on above-average volume (buying interest).

        Args:
            volume_trend: Volume vs 20-day average in % (e.g., 20 = 20% above average)

        Returns:
            Score from 0 to 5
        """
        if volume_trend >= 100:  # Extreme volume (2x average)
            return 4.0  # Could be good or bad (volatility)
        elif volume_trend >= 50:  # Strong volume (1.5x average)
            return 5.0
        elif volume_trend >= 20:  # Above average volume (1.2x)
            return 4.0
        elif volume_trend >= 0:  # Normal to slightly above
            return 3.0
        elif volume_trend >= -20:  # Slightly below average
            return 2.0
        elif volume_trend >= -50:  # Low volume
            return 1.0
        else:  # Very low volume (<50% of average)
            return 0.0

    def get_momentum_signal(self, score: float) -> str:
        """
        Get momentum signal from score.

        Args:
            score: Momentum score (0-25)

        Returns:
            Signal string (STRONG, POSITIVE, NEUTRAL, NEGATIVE, WEAK)
        """
        if score >= 20:
            return "STRONG"
        elif score >= 15:
            return "POSITIVE"
        elif score >= 10:
            return "NEUTRAL"
        elif score >= 5:
            return "NEGATIVE"
        else:
            return "WEAK"

    def explain_momentum_score(self, details: MomentumDetails) -> str:
        """
        Generate human-readable explanation of momentum score.

        Args:
            details: MomentumDetails object

        Returns:
            Explanation string
        """
        score = details.score
        indicators = details.indicators

        # Overall signal
        signal = self.get_momentum_signal(score)

        if signal == "STRONG":
            intro = "Strong positive momentum with favorable technical indicators."
        elif signal == "POSITIVE":
            intro = "Positive momentum with most indicators supporting uptrend."
        elif signal == "NEUTRAL":
            intro = "Mixed momentum signals - no clear trend."
        elif signal == "NEGATIVE":
            intro = "Negative momentum with technical weakness."
        else:
            intro = "Weak momentum with concerning technical indicators."

        # Key observations
        observations = []

        price_vs_50 = indicators.get('price_vs_sma50', 0)
        if price_vs_50 >= 5:
            observations.append(f"price {price_vs_50:.1f}% above 50-day MA (strong uptrend)")
        elif price_vs_50 <= -5:
            observations.append(f"price {abs(price_vs_50):.1f}% below 50-day MA (downtrend)")

        rsi = indicators.get('rsi', 50)
        if rsi >= 70:
            observations.append(f"RSI at {rsi:.0f} (overbought)")
        elif rsi <= 30:
            observations.append(f"RSI at {rsi:.0f} (oversold)")

        volume_trend = indicators.get('volume_trend', 0)
        if volume_trend >= 50:
            observations.append(f"volume {volume_trend:.0f}% above average (strong interest)")
        elif volume_trend <= -30:
            observations.append(f"volume {abs(volume_trend):.0f}% below average (low interest)")

        if observations:
            obs_text = "; ".join(observations[:3])
            return f"{intro} {obs_text.capitalize()}."
        else:
            return f"{intro}"


# Singleton instance
_momentum_service_instance: Optional[MomentumScoringService] = None


def get_momentum_service() -> MomentumScoringService:
    """
    Get or create the momentum scoring service singleton.

    Returns:
        MomentumScoringService instance
    """
    global _momentum_service_instance

    if _momentum_service_instance is None:
        _momentum_service_instance = MomentumScoringService()

    return _momentum_service_instance
