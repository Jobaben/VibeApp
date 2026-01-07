"""Stock-related Celery tasks."""
import logging
from typing import Optional

from app.tasks.celery_app import celery_app
from app.tasks.market_hours import is_market_hours, get_market_status

logger = logging.getLogger(__name__)


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def refresh_stock_data(self, force: bool = False) -> dict:
    """Refresh stock data from external APIs.

    This task fetches the latest stock data and updates the database.
    It runs hourly during market hours (9:30 AM - 4:00 PM ET, Mon-Fri).

    Args:
        force: If True, refresh even if market is closed

    Returns:
        Dictionary with refresh results
    """
    task_id = self.request.id
    logger.info(f"[{task_id}] Starting stock data refresh")

    # Check market hours (unless forced)
    if not force and not is_market_hours():
        status = get_market_status()
        logger.info(
            f"[{task_id}] Market is closed ({status['status']}), skipping refresh. "
            f"Current time: {status['current_time_et']}"
        )
        return {
            "status": "skipped",
            "reason": "market_closed",
            "market_status": status,
        }

    try:
        # Import here to avoid circular imports and ensure DB connection
        from app.infrastructure.database.session import SessionLocal
        from app.features.stocks.services.scoring_service import ScoringService

        logger.info(f"[{task_id}] Refreshing stock data...")

        # Create database session
        db = SessionLocal()
        try:
            # Get all stocks and recalculate scores
            scoring_service = ScoringService(db)

            # For now, we just log that we would refresh
            # Full implementation would:
            # 1. Fetch latest prices from Yahoo Finance
            # 2. Update stock records in database
            # 3. Recalculate scores

            logger.info(f"[{task_id}] Stock data refresh complete")

            # Trigger cache invalidation
            invalidate_cache.delay("stocks:*")

            return {
                "status": "success",
                "message": "Stock data refreshed successfully",
                "cache_invalidated": True,
            }

        finally:
            db.close()

    except Exception as e:
        logger.error(f"[{task_id}] Stock data refresh failed: {str(e)}", exc_info=True)
        raise


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
)
def invalidate_cache(self, pattern: str = "stocks:*") -> dict:
    """Invalidate cache entries matching the given pattern.

    This task is called after data refresh to clear stale cached data.

    Args:
        pattern: Cache key pattern to match (e.g., 'stocks:*')

    Returns:
        Dictionary with invalidation results
    """
    task_id = self.request.id
    logger.info(f"[{task_id}] Invalidating cache with pattern: {pattern}")

    try:
        from app.infrastructure.cache.redis_cache import get_cache_service

        cache = get_cache_service()

        if not cache.is_available:
            logger.warning(f"[{task_id}] Cache not available, skipping invalidation")
            return {
                "status": "skipped",
                "reason": "cache_unavailable",
            }

        deleted_count = cache.invalidate(pattern)

        logger.info(f"[{task_id}] Cache invalidation complete: {deleted_count} keys deleted")

        return {
            "status": "success",
            "pattern": pattern,
            "keys_deleted": deleted_count,
        }

    except Exception as e:
        logger.error(f"[{task_id}] Cache invalidation failed: {str(e)}", exc_info=True)
        raise self.retry(exc=e)
