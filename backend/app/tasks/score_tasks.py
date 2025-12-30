"""Score-related Celery tasks."""
import logging
from .celery_app import celery_app
from .market_hours import get_market_status

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def snapshot_daily_scores(self):
    """Create daily snapshot of all stock scores.

    This task:
    1. Captures current scores for all stocks
    2. Stores in score history table
    3. Enables tracking of score changes over time

    Scheduled to run daily at 4:30 PM ET (after market close).
    """
    logger.info("Starting snapshot_daily_scores task")

    market_status = get_market_status()
    logger.info(f"Creating daily score snapshot. Time: {market_status['current_time_et']}")

    try:
        # Import here to avoid circular imports and ensure DB session is fresh
        from app.infrastructure.database.session import SessionLocal
        from app.features.stocks.services.score_tracking_service import ScoreTrackingService

        db = SessionLocal()
        try:
            tracking_service = ScoreTrackingService(db)
            count = tracking_service.snapshot_all_scores()

            logger.info(f"Successfully created {count} score snapshots")

            return {
                "status": "completed",
                "snapshots_created": count,
                "time": market_status["current_time_et"],
            }

        finally:
            db.close()

    except Exception as exc:
        logger.error(f"Error creating score snapshot: {exc}", exc_info=True)
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def recalculate_all_scores(self):
    """Recalculate scores for all stocks.

    This task:
    1. Calculates sector averages
    2. Recalculates scores for all stocks
    3. Updates score table

    Can be triggered manually or scheduled for weekly recalculation.
    """
    logger.info("Starting recalculate_all_scores task")

    try:
        from app.infrastructure.database.session import SessionLocal
        from app.features.stocks.services.sector_service import SectorService

        db = SessionLocal()
        try:
            sector_service = SectorService(db)

            # Calculate sector averages
            sector_benchmarks = sector_service.calculate_and_cache_sector_averages()
            logger.info(f"Calculated benchmarks for {len(sector_benchmarks)} sectors")

            # Calculate scores for all stocks
            scored_count = sector_service.calculate_scores_for_all_stocks()
            logger.info(f"Recalculated scores for {scored_count} stocks")

            # Invalidate leaderboard cache
            from .stock_tasks import invalidate_cache
            invalidate_cache.delay("leaderboard:*")
            invalidate_cache.delay("stocks:top:*")

            return {
                "status": "completed",
                "scored_count": scored_count,
                "sectors_analyzed": len(sector_benchmarks),
            }

        finally:
            db.close()

    except Exception as exc:
        logger.error(f"Error recalculating scores: {exc}", exc_info=True)
        raise self.retry(exc=exc)
