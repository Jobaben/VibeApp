"""Tests for the LLM config startup validation in main.py."""
import logging
import pytest


def _import_validator():
    """Lazy import so each test gets a fresh module-level reference."""
    from main import _validate_llm_config

    return _validate_llm_config


def test_passes_when_llm_disabled(monkeypatch, caplog):
    from app import config

    monkeypatch.setattr(config.settings, "LLM_ENABLED", False)
    monkeypatch.setattr(config.settings, "ANTHROPIC_API_KEY", "")
    monkeypatch.setattr(config.settings, "ENVIRONMENT", "production")

    with caplog.at_level(logging.WARNING):
        _import_validator()()

    assert all("ANTHROPIC_API_KEY" not in r.message for r in caplog.records)


def test_passes_when_key_present(monkeypatch, caplog):
    from app import config

    monkeypatch.setattr(config.settings, "LLM_ENABLED", True)
    monkeypatch.setattr(config.settings, "ANTHROPIC_API_KEY", "sk-ant-test")
    monkeypatch.setattr(config.settings, "ENVIRONMENT", "production")

    with caplog.at_level(logging.WARNING):
        _import_validator()()

    assert all("ANTHROPIC_API_KEY" not in r.message for r in caplog.records)


def test_dev_logs_warning_when_key_missing(monkeypatch, caplog):
    from app import config

    monkeypatch.setattr(config.settings, "LLM_ENABLED", True)
    monkeypatch.setattr(config.settings, "ANTHROPIC_API_KEY", "")
    monkeypatch.setattr(config.settings, "ENVIRONMENT", "development")

    with caplog.at_level(logging.WARNING):
        _import_validator()()

    assert any("ANTHROPIC_API_KEY" in r.message for r in caplog.records)


def test_production_raises_when_key_missing(monkeypatch):
    from app import config

    monkeypatch.setattr(config.settings, "LLM_ENABLED", True)
    monkeypatch.setattr(config.settings, "ANTHROPIC_API_KEY", "")
    monkeypatch.setattr(config.settings, "ENVIRONMENT", "production")

    with pytest.raises(RuntimeError, match="ANTHROPIC_API_KEY"):
        _import_validator()()
