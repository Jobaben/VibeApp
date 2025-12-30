"""Stock-related Celery tasks."""
import logging
from .celery_app import celery_app
from .market_hours import is_market_hours, get_market_status

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def refresh_stock_data(self):
    """Refresh stock data from external APIs.

    This task:
    1. Checks if market is open
    2. Fetches latest quotes for all stocks
    3. Updates database
    4. Invalidates cache

    Scheduled to run hourly during market hours.
    """
    logger.info("Starting refresh_stock_data task")

    # Check market hours
    market_status = get_market_status()
    if not is_market_hours():
        logger.info(
            f"Market closed ({market_status['status']}), "
            f"skipping refresh. Time: {market_status['current_time_et']}"
        )
        return {
            "status": "skipped",
            "reason": market_status["status"],
            "time": market_status["current_time_et"],
        }

    logger.info(f"Market is open, refreshing stock data. Time: {market_status['current_time_et']}")

    try:
        # Import here to avoid circular imports and ensure DB session is fresh
        from app.infrastructure.database.session import SessionLocal
        from app.infrastructure.repositories import get_stock_repository
        from app.features.integrations.yahoo_finance_client import get_yahoo_finance_client

        db = SessionLocal()
        try:
            repo = get_stock_repository(db)
            yahoo_client = get_yahoo_finance_client()

            # Get all stocks
            stocks = repo.get_all(limit=1000)
            tickers = [s.ticker for s in stocks]

            if not tickers:
                logger.warning("No stocks found in database to refresh")
                return {"status": "completed", "refreshed": 0, "message": "No stocks to refresh"}

            logger.info(f"Refreshing data for {len(tickers)} stocks")

            # Fetch quotes (batch)
            quotes = yahoo_client.get_multiple_quotes(tickers)

            updated_count = 0
            for quote in quotes:
                if quote and quote.get("symbol"):
                    ticker = quote["symbol"]
                    stock = repo.get_by_ticker(ticker)
                    if stock:
                        # Update stock data
                        stock.market_cap = quote.get("marketCap")
                        db.commit()
                        updated_count += 1

            logger.info(f"Successfully refreshed {updated_count} stocks")

            # Invalidate cache after refresh
            invalidate_cache.delay("stocks:*")

            return {
                "status": "completed",
                "refreshed": updated_count,
                "total": len(tickers),
                "time": market_status["current_time_et"],
            }

        finally:
            db.close()

    except Exception as exc:
        logger.error(f"Error refreshing stock data: {exc}", exc_info=True)
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=2, default_retry_delay=30)
def invalidate_cache(self, pattern: str = "*"):
    """Invalidate cache entries matching pattern.

    Args:
        pattern: Cache key pattern (e.g., 'stocks:*', 'leaderboard:*')

    Returns:
        Dict with invalidation results
    """
    logger.info(f"Invalidating cache with pattern: {pattern}")

    try:
        from app.infrastructure.cache import get_cache_service

        cache = get_cache_service()

        if not cache.is_available:
            logger.warning("Cache service not available")
            return {"status": "skipped", "reason": "Cache not available"}

        if pattern == "*":
            success = cache.clear_all()
            return {
                "status": "completed" if success else "failed",
                "pattern": pattern,
                "message": "All cache cleared" if success else "Failed to clear cache",
            }

        deleted = cache.invalidate(pattern)
        logger.info(f"Invalidated {deleted} cache entries matching '{pattern}'")

        return {
            "status": "completed",
            "pattern": pattern,
            "keys_deleted": deleted,
        }

    except Exception as exc:
        logger.error(f"Error invalidating cache: {exc}", exc_info=True)
        raise self.retry(exc=exc)
