"""Settings smoke tests for LLM keys."""
import os
import pytest
from app.config import Settings


def test_llm_defaults():
    settings = Settings()
    assert settings.LLM_ENABLED is True
    assert settings.LLM_MODEL == "claude-sonnet-4-6"
    assert settings.LLM_MAX_TOKENS == 600
    assert settings.LLM_TEMPERATURE == 0.3
    assert settings.LLM_TIMEOUT_SECONDS == 30.0
    assert settings.LLM_MAX_RETRIES == 3
    assert settings.LLM_INSIGHT_TTL_SECONDS == 86_400
    assert settings.LLM_INSIGHT_RATE_LIMIT_PER_MIN == 5
    assert settings.ANTHROPIC_API_KEY == ""


def test_llm_env_override(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test")
    monkeypatch.setenv("LLM_ENABLED", "false")
    monkeypatch.setenv("LLM_MODEL", "claude-haiku-4-5-20251001")
    monkeypatch.setenv("LLM_INSIGHT_TTL_SECONDS", "60")
    settings = Settings()
    assert settings.ANTHROPIC_API_KEY == "sk-ant-test"
    assert settings.LLM_ENABLED is False
    assert settings.LLM_MODEL == "claude-haiku-4-5-20251001"
    assert settings.LLM_INSIGHT_TTL_SECONDS == 60
