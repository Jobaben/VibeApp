"""Live Anthropic smoke test.

Skipped unless RUN_LIVE_LLM=1 is set in the environment.
Run manually before shipping prompt or model changes:

    RUN_LIVE_LLM=1 ANTHROPIC_API_KEY=sk-ant-... \\
        .venv/bin/pytest tests/smoke/test_live_anthropic.py -v
"""
import os
import pytest

from app.config import Settings
from app.features.ai.schemas import AIInsight
from app.llm.anthropic_client import AnthropicClient


pytestmark = pytest.mark.skipif(
    os.getenv("RUN_LIVE_LLM") != "1",
    reason="Set RUN_LIVE_LLM=1 to run live LLM smoke tests.",
)


def test_live_generate_insight_returns_valid_schema():
    settings = Settings()
    assert settings.ANTHROPIC_API_KEY, "ANTHROPIC_API_KEY must be set for live smoke test"

    client = AnthropicClient(
        api_key=settings.ANTHROPIC_API_KEY,
        model=settings.LLM_MODEL,
        max_tokens=settings.LLM_MAX_TOKENS,
        temperature=settings.LLM_TEMPERATURE,
        timeout_seconds=settings.LLM_TIMEOUT_SECONDS,
        max_retries=settings.LLM_MAX_RETRIES,
    )

    insight = client.generate_insight({
        "ticker": "VOLV-B",
        "name": "Volvo Group",
        "sector": "Industrials",
        "signal": "BUY",
        "scores": {"total": 78, "value": 18, "quality": 22, "momentum": 20, "health": 18},
        "fundamentals": {
            "pe_ratio": 9.8, "roic": 21.3, "roe": 18.5,
            "debt_equity": 0.42, "fcf_yield": 7.1,
        },
    })

    assert isinstance(insight, AIInsight)
    assert 2 <= len(insight.strengths) <= 4
    assert 2 <= len(insight.weaknesses) <= 4
    assert 2 <= len(insight.catalyst_watch) <= 4
