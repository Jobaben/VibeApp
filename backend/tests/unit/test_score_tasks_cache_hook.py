"""Tests for the AI insight cache invalidation helper in score_tasks."""
import sys
from types import ModuleType
from unittest.mock import MagicMock, patch


def _import_score_tasks():
    """Import score_tasks while mocking the celery dependency."""
    # Stub out celery so the package __init__ and decorator machinery don't blow up.
    if "celery" not in sys.modules:
        fake_celery = ModuleType("celery")
        fake_celery.Celery = MagicMock()
        sys.modules["celery"] = fake_celery

    if "celery.schedules" not in sys.modules:
        fake_schedules = ModuleType("celery.schedules")
        fake_schedules.crontab = MagicMock()
        sys.modules["celery.schedules"] = fake_schedules

    # Reload so that our stubs take effect if the module was previously imported.
    import importlib
    import app.tasks.score_tasks as _st
    importlib.reload(_st)
    return _st


def test_helper_invalidates_when_available():
    """When the cache is available, invalidate is called with the ai:insight:* pattern."""
    score_tasks = _import_score_tasks()

    fake = MagicMock()
    fake.is_available = True
    fake.invalidate.return_value = 4

    with patch("app.infrastructure.cache.get_cache_service", return_value=fake):
        score_tasks._invalidate_ai_insight_cache()

    fake.invalidate.assert_called_once_with("ai:insight:*")


def test_helper_skips_when_unavailable():
    """When the cache is not available, invalidate is never called."""
    score_tasks = _import_score_tasks()

    fake = MagicMock()
    fake.is_available = False

    with patch("app.infrastructure.cache.get_cache_service", return_value=fake):
        score_tasks._invalidate_ai_insight_cache()

    fake.invalidate.assert_not_called()


def test_helper_swallows_cache_errors():
    """Errors from get_cache_service must not propagate — task stability matters more."""
    score_tasks = _import_score_tasks()

    with patch("app.infrastructure.cache.get_cache_service", side_effect=RuntimeError("redis down")):
        score_tasks._invalidate_ai_insight_cache()  # must not raise
