"""Service for tracking stock score changes over time."""
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
from uuid import UUID
from decimal import Decimal

from sqlalchemy import select, and_, desc, func
from sqlalchemy.orm import Session

from app.features.stocks.models import (
    Stock,
    StockScore,
    StockScoreHistory,
    Signal
)


class ScoreTrackingService:
    """Service for tracking and analyzing score changes."""

    def __init__(self, db: Session):
        self.db = db

    def snapshot_all_scores(self, snapshot_date: Optional[date] = None) -> int:
        """
        Snapshot current scores for all stocks.

        Args:
            snapshot_date: Date for the snapshot (defaults to today)

        Returns:
            Number of snapshots created
        """
        if snapshot_date is None:
            snapshot_date = date.today()

        # Get all current stock scores
        stmt = select(StockScore).join(Stock).where(Stock.is_deleted == False)
        current_scores = self.db.execute(stmt).scalars().all()

        snapshots_created = 0

        for score in current_scores:
            # Check if snapshot already exists for this date
            existing = self.db.execute(
                select(StockScoreHistory).where(
                    and_(
                        StockScoreHistory.stock_id == score.stock_id,
                        StockScoreHistory.snapshot_date == snapshot_date
                    )
                )
            ).scalar_one_or_none()

            if existing:
                # Update existing snapshot
                existing.total_score = score.total_score
                existing.value_score = score.value_score
                existing.quality_score = score.quality_score
                existing.momentum_score = score.momentum_score
                existing.health_score = score.health_score
                existing.signal = score.signal
                existing.updated_at = datetime.utcnow()
            else:
                # Create new snapshot
                snapshot = StockScoreHistory(
                    stock_id=score.stock_id,
                    snapshot_date=snapshot_date,
                    total_score=score.total_score,
                    value_score=score.value_score,
                    quality_score=score.quality_score,
                    momentum_score=score.momentum_score,
                    health_score=score.health_score,
                    signal=score.signal
                )
                self.db.add(snapshot)
                snapshots_created += 1

        self.db.commit()
        return snapshots_created

    def get_score_history(
        self,
        ticker: str,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Get score history for a stock.

        Args:
            ticker: Stock ticker symbol
            days: Number of days of history to retrieve

        Returns:
            List of historical score records
        """
        cutoff_date = date.today() - timedelta(days=days)

        stmt = (
            select(StockScoreHistory)
            .join(Stock, Stock.id == StockScoreHistory.stock_id)
            .where(
                and_(
                    Stock.ticker == ticker,
                    Stock.is_deleted == False,
                    StockScoreHistory.snapshot_date >= cutoff_date
                )
            )
            .order_by(StockScoreHistory.snapshot_date.asc())
        )

        history = self.db.execute(stmt).scalars().all()

        return [
            {
                "date": h.snapshot_date.isoformat(),
                "total_score": float(h.total_score),
                "value_score": float(h.value_score),
                "quality_score": float(h.quality_score),
                "momentum_score": float(h.momentum_score),
                "health_score": float(h.health_score),
                "signal": h.signal.value
            }
            for h in history
        ]

    def get_score_change(
        self,
        ticker: str,
        days: int = 7
    ) -> Optional[Dict[str, Any]]:
        """
        Calculate score change over a period.

        Args:
            ticker: Stock ticker symbol
            days: Number of days to look back

        Returns:
            Score change information or None if insufficient data
        """
        # Get stock
        stock = self.db.execute(
            select(Stock).where(
                and_(
                    Stock.ticker == ticker,
                    Stock.is_deleted == False
                )
            )
        ).scalar_one_or_none()

        if not stock or not stock.scores:
            return None

        # Get current score
        current_score = stock.scores

        # Get historical score from N days ago
        past_date = date.today() - timedelta(days=days)

        # Find the closest historical snapshot
        historical = self.db.execute(
            select(StockScoreHistory)
            .where(
                and_(
                    StockScoreHistory.stock_id == stock.id,
                    StockScoreHistory.snapshot_date <= past_date
                )
            )
            .order_by(desc(StockScoreHistory.snapshot_date))
            .limit(1)
        ).scalar_one_or_none()

        if not historical:
            return None

        # Calculate changes
        total_change = float(current_score.total_score - historical.total_score)
        value_change = float(current_score.value_score - historical.value_score)
        quality_change = float(current_score.quality_score - historical.quality_score)
        momentum_change = float(current_score.momentum_score - historical.momentum_score)
        health_change = float(current_score.health_score - historical.health_score)

        return {
            "ticker": ticker,
            "period_days": days,
            "current": {
                "total_score": float(current_score.total_score),
                "value_score": float(current_score.value_score),
                "quality_score": float(current_score.quality_score),
                "momentum_score": float(current_score.momentum_score),
                "health_score": float(current_score.health_score),
                "signal": current_score.signal.value
            },
            "historical": {
                "date": historical.snapshot_date.isoformat(),
                "total_score": float(historical.total_score),
                "value_score": float(historical.value_score),
                "quality_score": float(historical.quality_score),
                "momentum_score": float(historical.momentum_score),
                "health_score": float(historical.health_score),
                "signal": historical.signal.value
            },
            "changes": {
                "total_score": total_change,
                "value_score": value_change,
                "quality_score": quality_change,
                "momentum_score": momentum_change,
                "health_score": health_change,
                "signal_changed": current_score.signal != historical.signal
            },
            "percent_change": round((total_change / float(historical.total_score) * 100), 2) if historical.total_score else 0
        }

    def get_top_movers(
        self,
        days: int = 7,
        limit: int = 10,
        direction: str = "up"
    ) -> List[Dict[str, Any]]:
        """
        Get stocks with largest score changes.

        Args:
            days: Number of days to look back
            limit: Number of results to return
            direction: "up" for gainers, "down" for losers

        Returns:
            List of stocks with biggest score changes
        """
        past_date = date.today() - timedelta(days=days)

        # Subquery to get the latest historical snapshot for each stock
        subq = (
            select(
                StockScoreHistory.stock_id,
                func.max(StockScoreHistory.snapshot_date).label('max_date')
            )
            .where(StockScoreHistory.snapshot_date <= past_date)
            .group_by(StockScoreHistory.stock_id)
            .subquery()
        )

        # Join current scores with historical scores
        stmt = (
            select(
                Stock,
                StockScore,
                StockScoreHistory
            )
            .join(StockScore, Stock.id == StockScore.stock_id)
            .join(subq, Stock.id == subq.c.stock_id)
            .join(
                StockScoreHistory,
                and_(
                    StockScoreHistory.stock_id == subq.c.stock_id,
                    StockScoreHistory.snapshot_date == subq.c.max_date
                )
            )
            .where(Stock.is_deleted == False)
        )

        results = self.db.execute(stmt).all()

        # Calculate changes and filter
        movers = []
        for stock, current_score, historical_score in results:
            change = float(current_score.total_score - historical_score.total_score)

            movers.append({
                "ticker": stock.ticker,
                "name": stock.name,
                "sector": stock.sector,
                "current_score": float(current_score.total_score),
                "historical_score": float(historical_score.total_score),
                "score_change": change,
                "percent_change": round((change / float(historical_score.total_score) * 100), 2) if historical_score.total_score else 0,
                "current_signal": current_score.signal.value,
                "historical_signal": historical_score.signal.value,
                "signal_changed": current_score.signal != historical_score.signal
            })

        # Sort by score change
        movers.sort(key=lambda x: x["score_change"], reverse=(direction == "up"))

        return movers[:limit]

    def get_signal_changes(
        self,
        days: int = 7
    ) -> List[Dict[str, Any]]:
        """
        Get stocks that had signal changes (e.g., HOLD -> BUY).

        Args:
            days: Number of days to look back

        Returns:
            List of stocks with signal changes
        """
        past_date = date.today() - timedelta(days=days)

        # Subquery to get the latest historical snapshot for each stock
        subq = (
            select(
                StockScoreHistory.stock_id,
                func.max(StockScoreHistory.snapshot_date).label('max_date')
            )
            .where(StockScoreHistory.snapshot_date <= past_date)
            .group_by(StockScoreHistory.stock_id)
            .subquery()
        )

        # Find stocks where signal changed
        stmt = (
            select(
                Stock,
                StockScore,
                StockScoreHistory
            )
            .join(StockScore, Stock.id == StockScore.stock_id)
            .join(subq, Stock.id == subq.c.stock_id)
            .join(
                StockScoreHistory,
                and_(
                    StockScoreHistory.stock_id == subq.c.stock_id,
                    StockScoreHistory.snapshot_date == subq.c.max_date
                )
            )
            .where(
                and_(
                    Stock.is_deleted == False,
                    StockScore.signal != StockScoreHistory.signal
                )
            )
        )

        results = self.db.execute(stmt).all()

        changes = []
        for stock, current_score, historical_score in results:
            score_change = float(current_score.total_score - historical_score.total_score)

            changes.append({
                "ticker": stock.ticker,
                "name": stock.name,
                "sector": stock.sector,
                "previous_signal": historical_score.signal.value,
                "current_signal": current_score.signal.value,
                "score_change": score_change,
                "current_score": float(current_score.total_score),
                "historical_score": float(historical_score.total_score),
                "change_date": historical_score.snapshot_date.isoformat()
            })

        return changes

    def cleanup_old_snapshots(self, keep_days: int = 90) -> int:
        """
        Remove snapshots older than specified days.

        Args:
            keep_days: Number of days to keep

        Returns:
            Number of snapshots deleted
        """
        cutoff_date = date.today() - timedelta(days=keep_days)

        result = self.db.execute(
            select(func.count(StockScoreHistory.id))
            .where(StockScoreHistory.snapshot_date < cutoff_date)
        )
        count = result.scalar()

        # Delete old snapshots
        self.db.execute(
            StockScoreHistory.__table__.delete().where(
                StockScoreHistory.snapshot_date < cutoff_date
            )
        )
        self.db.commit()

        return count or 0
