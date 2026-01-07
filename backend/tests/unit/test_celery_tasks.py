"""Unit tests for Celery tasks."""
import pytest
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock
import pytz


class TestMarketHours:
    """Tests for market hours utility functions."""

    def test_is_market_hours_during_trading(self):
        """Test that market is open during trading hours on a weekday."""
        from app.tasks.market_hours import is_market_hours

        # Mock datetime to be 11:00 AM ET on a Monday
        eastern = pytz.timezone("US/Eastern")
        mock_now = datetime(2024, 1, 8, 11, 0, 0, tzinfo=eastern)  # Monday

        with patch("app.tasks.market_hours.datetime") as mock_datetime:
            mock_datetime.now.return_value = mock_now
            assert is_market_hours() is True

    def test_is_market_hours_before_open(self):
        """Test that market is closed before 9:30 AM ET."""
        from app.tasks.market_hours import is_market_hours

        eastern = pytz.timezone("US/Eastern")
        mock_now = datetime(2024, 1, 8, 8, 0, 0, tzinfo=eastern)  # Monday 8 AM

        with patch("app.tasks.market_hours.datetime") as mock_datetime:
            mock_datetime.now.return_value = mock_now
            assert is_market_hours() is False

    def test_is_market_hours_after_close(self):
        """Test that market is closed after 4:00 PM ET."""
        from app.tasks.market_hours import is_market_hours

        eastern = pytz.timezone("US/Eastern")
        mock_now = datetime(2024, 1, 8, 17, 0, 0, tzinfo=eastern)  # Monday 5 PM

        with patch("app.tasks.market_hours.datetime") as mock_datetime:
            mock_datetime.now.return_value = mock_now
            assert is_market_hours() is False

    def test_is_market_hours_weekend(self):
        """Test that market is closed on weekends."""
        from app.tasks.market_hours import is_market_hours

        eastern = pytz.timezone("US/Eastern")
        mock_now = datetime(2024, 1, 6, 11, 0, 0, tzinfo=eastern)  # Saturday

        with patch("app.tasks.market_hours.datetime") as mock_datetime:
            mock_datetime.now.return_value = mock_now
            assert is_market_hours() is False

    def test_get_market_status_returns_dict(self):
        """Test that get_market_status returns expected structure."""
        from app.tasks.market_hours import get_market_status

        status = get_market_status()

        assert isinstance(status, dict)
        assert "is_open" in status
        assert "current_time_et" in status
        assert "weekday" in status
        assert "status" in status


class TestRefreshStockDataTask:
    """Tests for refresh_stock_data task."""

    def test_refresh_stock_data_task_is_registered(self):
        """Test that refresh_stock_data task is registered with Celery."""
        from app.tasks.stock_tasks import refresh_stock_data

        assert refresh_stock_data.name == "app.tasks.stock_tasks.refresh_stock_data"

    def test_refresh_stock_data_has_retry_config(self):
        """Test that refresh_stock_data has retry configuration."""
        from app.tasks.stock_tasks import refresh_stock_data

        assert refresh_stock_data.max_retries == 3
        assert refresh_stock_data.default_retry_delay == 60


class TestInvalidateCacheTask:
    """Tests for invalidate_cache task."""

    def test_invalidate_cache_task_is_registered(self):
        """Test that invalidate_cache task is registered with Celery."""
        from app.tasks.stock_tasks import invalidate_cache

        assert invalidate_cache.name == "app.tasks.stock_tasks.invalidate_cache"

    def test_invalidate_cache_has_retry_config(self):
        """Test that invalidate_cache has retry configuration."""
        from app.tasks.stock_tasks import invalidate_cache

        assert invalidate_cache.max_retries == 3
        assert invalidate_cache.default_retry_delay == 30


class TestSnapshotDailyScoresTask:
    """Tests for snapshot_daily_scores task."""

    def test_snapshot_daily_scores_task_is_registered(self):
        """Test that snapshot_daily_scores task is registered with Celery."""
        from app.tasks.score_tasks import snapshot_daily_scores

        assert snapshot_daily_scores.name == "app.tasks.score_tasks.snapshot_daily_scores"

    def test_snapshot_daily_scores_has_retry_config(self):
        """Test that snapshot_daily_scores has retry configuration."""
        from app.tasks.score_tasks import snapshot_daily_scores

        assert snapshot_daily_scores.max_retries == 3
        assert snapshot_daily_scores.default_retry_delay == 60


class TestCeleryAppConfiguration:
    """Tests for Celery app configuration."""

    def test_celery_app_has_beat_schedule(self):
        """Test that Celery app has beat schedule configured."""
        from app.tasks.celery_app import celery_app

        assert hasattr(celery_app.conf, "beat_schedule")
        schedule = celery_app.conf.beat_schedule

        assert "refresh-stock-data-hourly" in schedule
        assert "snapshot-scores-daily" in schedule

    def test_celery_app_includes_tasks(self):
        """Test that Celery app includes task modules."""
        from app.tasks.celery_app import celery_app

        assert "app.tasks.stock_tasks" in celery_app.conf.include
        assert "app.tasks.score_tasks" in celery_app.conf.include

    def test_celery_app_uses_json_serializer(self):
        """Test that Celery app uses JSON serialization."""
        from app.tasks.celery_app import celery_app

        assert celery_app.conf.task_serializer == "json"
        assert celery_app.conf.result_serializer == "json"

    def test_beat_schedule_refresh_hourly(self):
        """Test that refresh task is scheduled correctly."""
        from app.tasks.celery_app import celery_app
        from celery.schedules import crontab

        schedule = celery_app.conf.beat_schedule["refresh-stock-data-hourly"]

        assert schedule["task"] == "app.tasks.stock_tasks.refresh_stock_data"
        assert isinstance(schedule["schedule"], crontab)

    def test_beat_schedule_snapshot_daily(self):
        """Test that snapshot task is scheduled correctly."""
        from app.tasks.celery_app import celery_app
        from celery.schedules import crontab

        schedule = celery_app.conf.beat_schedule["snapshot-scores-daily"]

        assert schedule["task"] == "app.tasks.score_tasks.snapshot_daily_scores"
        assert isinstance(schedule["schedule"], crontab)


class TestTaskModuleExports:
    """Tests for task module exports."""

    def test_tasks_init_exports_celery_app(self):
        """Test that tasks module exports celery_app."""
        from app.tasks import celery_app

        assert celery_app is not None

    def test_tasks_init_exports_refresh_stock_data(self):
        """Test that tasks module exports refresh_stock_data."""
        from app.tasks import refresh_stock_data

        assert refresh_stock_data is not None

    def test_tasks_init_exports_invalidate_cache(self):
        """Test that tasks module exports invalidate_cache."""
        from app.tasks import invalidate_cache

        assert invalidate_cache is not None

    def test_tasks_init_exports_snapshot_daily_scores(self):
        """Test that tasks module exports snapshot_daily_scores."""
        from app.tasks import snapshot_daily_scores

        assert snapshot_daily_scores is not None
