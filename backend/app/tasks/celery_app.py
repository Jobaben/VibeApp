"""Celery application configuration."""
import os
from celery import Celery
from celery.schedules import crontab

# Get Redis URL from environment
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
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="US/Eastern",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes max per task
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)

# Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    # Refresh stock data hourly during market hours (9:30 AM - 4:00 PM ET, Mon-Fri)
    # Runs at minute 0 of each hour from 10-16 (covers 9:30-16:00)
    "refresh-stock-data-hourly": {
        "task": "app.tasks.stock_tasks.refresh_stock_data",
        "schedule": crontab(minute=0, hour="10-16", day_of_week="1-5"),
        "options": {"queue": "default"},
    },
    # Snapshot daily scores after market close (4:30 PM ET, Mon-Fri)
    "snapshot-scores-daily": {
        "task": "app.tasks.score_tasks.snapshot_daily_scores",
        "schedule": crontab(minute=30, hour=16, day_of_week="1-5"),
        "options": {"queue": "default"},
    },
}
