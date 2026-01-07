"""Celery application configuration."""
import os
from celery import Celery
from celery.schedules import crontab

# Get Redis URL from environment, defaulting to localhost
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

# Create Celery app
celery_app = Celery(
    "vibeapp",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        "app.tasks.stock_tasks",
        "app.tasks.score_tasks",
    ]
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="US/Eastern",
    enable_utc=True,

    # Retry settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,

    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour

    # Worker settings
    worker_prefetch_multiplier=1,
    worker_concurrency=2,
)

# Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    "refresh-stock-data-hourly": {
        "task": "app.tasks.stock_tasks.refresh_stock_data",
        # Run every hour from 9 AM to 4 PM, Monday through Friday (market hours)
        "schedule": crontab(minute=0, hour="9-16", day_of_week="1-5"),
        "options": {"queue": "default"},
    },
    "snapshot-scores-daily": {
        "task": "app.tasks.score_tasks.snapshot_daily_scores",
        # Run at 4:30 PM ET Monday through Friday (after market close)
        "schedule": crontab(minute=30, hour=16, day_of_week="1-5"),
        "options": {"queue": "default"},
    },
}
