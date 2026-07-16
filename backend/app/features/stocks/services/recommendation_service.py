"""
Horizon-based recommendation service.

Ranks the stock universe as investment candidates for a user-selected
investment period. The four component scores (value, quality, momentum,
financial health — 0-25 each) are re-weighted per horizon:

- SHORT  (up to ~3 months):  momentum dominates — entry timing matters most.
- MEDIUM (3-12 months):      balanced across all four factors.
- LONG   (1 year or more):   value, quality and health dominate — short-term
                             momentum barely matters over multi-year holds.

The result is a "horizon fit" score (0-100) used to rank top candidates.

IMPORTANT: Educational/research purposes only. Not financial advice.
"""
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.features.stocks.models import Stock, StockScore

# Weights per horizon; each set sums to 1.0.
HORIZON_PROFILES: Dict[str, Dict[str, Any]] = {
    "short": {
        "key": "short",
        "label": "Short term",
        "period": "Up to 3 months",
        "description": (
            "Momentum-weighted ranking: for short holds, price trend and entry "
            "timing matter more than long-term fundamentals."
        ),
        "weights": {"value": 0.15, "quality": 0.15, "momentum": 0.50, "health": 0.20},
    },
    "medium": {
        "key": "medium",
        "label": "Medium term",
        "period": "3-12 months",
        "description": (
            "Balanced ranking: over a few quarters both the price trend and the "
            "underlying business quality drive returns."
        ),
        "weights": {"value": 0.25, "quality": 0.25, "momentum": 0.25, "health": 0.25},
    },
    "long": {
        "key": "long",
        "label": "Long term",
        "period": "1 year or more",
        "description": (
            "Fundamentals-weighted ranking: over years, valuation, business "
            "quality and balance-sheet strength dominate — short-term momentum "
            "barely matters."
        ),
        "weights": {"value": 0.30, "quality": 0.30, "momentum": 0.15, "health": 0.25},
    },
}

_COMPONENT_LABELS = {
    "value": "valuation",
    "quality": "business quality",
    "momentum": "price momentum",
    "health": "financial health",
}

# Each component score is 0-25; scale to 0-100 before weighting.
_COMPONENT_MAX = 25.0


class RecommendationService:
    """Ranks stocks as top candidates for a given investment horizon."""

    def __init__(self, db: Session):
        self.db = db

    def get_top_candidates(
        self,
        horizon: str,
        limit: int = 10,
        sector: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Rank stocks by horizon-weighted score.

        Args:
            horizon: 'short', 'medium' or 'long'
            limit: Maximum number of candidates to return
            sector: Optional sector filter

        Returns:
            Dict with the horizon profile used and the ranked candidates.

        Raises:
            ValueError: If horizon is not a known profile.
        """
        profile = HORIZON_PROFILES.get(horizon)
        if profile is None:
            raise ValueError(
                f"Unknown horizon '{horizon}'. Must be one of: {', '.join(HORIZON_PROFILES)}"
            )

        query = self.db.query(Stock, StockScore).join(StockScore, Stock.id == StockScore.stock_id)
        if sector:
            query = query.filter(Stock.sector == sector)

        weights = profile["weights"]
        candidates: List[Dict[str, Any]] = []

        for stock, score in query.all():
            components = {
                "value": float(score.value_score),
                "quality": float(score.quality_score),
                "momentum": float(score.momentum_score),
                "health": float(score.health_score),
            }
            horizon_score = sum(
                weights[name] * (value / _COMPONENT_MAX) * 100.0
                for name, value in components.items()
            )

            candidates.append({
                "ticker": stock.ticker,
                "name": stock.name,
                "sector": stock.sector,
                "horizon_score": round(horizon_score, 1),
                "total_score": float(score.total_score),
                "signal": score.signal.value,
                "value_score": components["value"],
                "quality_score": components["quality"],
                "momentum_score": components["momentum"],
                "health_score": components["health"],
                "why": self._explain(components, weights),
            })

        candidates.sort(key=lambda c: c["horizon_score"], reverse=True)
        candidates = candidates[:limit]
        for rank, candidate in enumerate(candidates, start=1):
            candidate["rank"] = rank

        return {
            "horizon": profile["key"],
            "label": profile["label"],
            "period": profile["period"],
            "description": profile["description"],
            "weights": weights,
            "count": len(candidates),
            "candidates": candidates,
        }

    @staticmethod
    def _explain(components: Dict[str, float], weights: Dict[str, float]) -> str:
        """One-sentence reason naming the two strongest weighted contributors."""
        contributions = sorted(
            components.items(),
            key=lambda item: weights[item[0]] * item[1],
            reverse=True,
        )
        top = [
            f"{_COMPONENT_LABELS[name]} ({value:.0f}/25)"
            for name, value in contributions[:2]
        ]
        return f"Ranked on {' and '.join(top)} for this horizon."


def get_horizon_profiles() -> List[Dict[str, Any]]:
    """Return the available horizon profiles (for the period picker UI)."""
    return list(HORIZON_PROFILES.values())
