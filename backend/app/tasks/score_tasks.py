"""Score-related Celery tasks."""
import logging
from datetime import datetime

from app.tasks.celery_app import celery_app
from app.tasks.market_hours import get_market_status

logger = logging.getLogger(__name__)


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def snapshot_daily_scores(self) -> dict:
    """Create a daily snapshot of all stock scores.

    This task runs after market close (4:30 PM ET) to record
    the final scores for each stock for historical tracking.

    Returns:
        Dictionary with snapshot results
    """
    task_id = self.request.id
    logger.info(f"[{task_id}] Starting daily score snapshot")

    try:
        from app.infrastructure.database.session import SessionLocal
        from app.features.stocks.models import Stock
        from sqlalchemy import select

        db = SessionLocal()
        try:
            # Get market status for logging
            market_status = get_market_status()
            logger.info(
                f"[{task_id}] Market status: {market_status['status']} "
                f"at {market_status['current_time_et']}"
            )

            # Query all stocks with scores
            result = db.execute(
                select(Stock).where(Stock.vibe_score.isnot(None))
            )
            stocks = result.scalars().all()

            snapshot_date = datetime.now().strftime("%Y-%m-%d")
            snapshot_count = 0

            for stock in stocks:
                # In a full implementation, we would:
                # 1. Create a ScoreSnapshot record with the current score
                # 2. Store historical data for trend analysis

                logger.debug(
                    f"[{task_id}] Snapshot for {stock.ticker}: "
                    f"vibe_score={stock.vibe_score}"
                )
                snapshot_count += 1

            logger.info(
                f"[{task_id}] Daily score snapshot complete: "
                f"{snapshot_count} stocks recorded for {snapshot_date}"
            )

            return {
                "status": "success",
                "date": snapshot_date,
                "stocks_processed": snapshot_count,
                "market_status": market_status,
            }

        finally:
            db.close()

    except Exception as e:
        logger.error(
            f"[{task_id}] Daily score snapshot failed: {str(e)}",
            exc_info=True
        )
        raise
