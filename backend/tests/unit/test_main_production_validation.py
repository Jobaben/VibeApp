"""Tests for the production settings startup validation in main.py."""
import logging
import pytest


def _import_validator():
    """Lazy import so each test gets a fresh module-level reference."""
    from main import _validate_production_config

    return _validate_production_config


def test_dev_with_default_secret_warns_but_boots(monkeypatch, caplog):
    from app import config

    monkeypatch.setattr(config.settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(config.settings, "SECRET_KEY", "your-secret-key-change-in-production")
    monkeypatch.setattr(config.settings, "DEBUG", True)

    with caplog.at_level(logging.WARNING):
        _import_validator()()

    assert any("SECRET_KEY" in r.message for r in caplog.records)


def test_dev_with_real_secret_is_silent(monkeypatch, caplog):
    from app import config

    monkeypatch.setattr(config.settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(config.settings, "SECRET_KEY", "a-real-generated-secret")

    with caplog.at_level(logging.WARNING):
        _import_validator()()

    assert all("SECRET_KEY" not in r.message for r in caplog.records)


def test_production_raises_on_default_secret(monkeypatch):
    from app import config

    monkeypatch.setattr(config.settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(config.settings, "SECRET_KEY", "your-secret-key-change-in-production")
    monkeypatch.setattr(config.settings, "DEBUG", False)

    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        _import_validator()()


def test_production_raises_on_empty_secret(monkeypatch):
    from app import config

    monkeypatch.setattr(config.settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(config.settings, "SECRET_KEY", "")
    monkeypatch.setattr(config.settings, "DEBUG", False)

    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        _import_validator()()


def test_production_raises_on_debug(monkeypatch):
    from app import config

    monkeypatch.setattr(config.settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(config.settings, "SECRET_KEY", "a-real-generated-secret")
    monkeypatch.setattr(config.settings, "DEBUG", True)

    with pytest.raises(RuntimeError, match="DEBUG"):
        _import_validator()()


def test_production_passes_with_safe_settings(monkeypatch):
    from app import config

    monkeypatch.setattr(config.settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(config.settings, "SECRET_KEY", "a-real-generated-secret")
    monkeypatch.setattr(config.settings, "DEBUG", False)

    _import_validator()()
