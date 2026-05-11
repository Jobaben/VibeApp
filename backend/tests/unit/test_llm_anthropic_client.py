"""Tests for AnthropicClient."""
import json
from unittest.mock import MagicMock

import pytest

from app.features.ai.schemas import AIInsight
from app.llm.anthropic_client import AnthropicClient
from app.llm.errors import InsightGenerationError, InsightSchemaError


def _fake_response(text: str) -> MagicMock:
    """Build an Anthropic SDK-shaped response containing a single text block."""
    block = MagicMock()
    block.text = text
    resp = MagicMock()
    resp.content = [block]
    return resp


def _good_json() -> str:
    return json.dumps({
        "strengths": ["Strong ROIC of 21%.", "Low debt-to-equity ratio."],
        "weaknesses": ["Cyclical exposure to industrial demand."],
        "catalyst_watch": ["Q4 truck order book.", "European rate decisions."],
    })


def test_generate_insight_happy_path():
    fake_client = MagicMock()
    fake_client.messages.create.return_value = _fake_response(_good_json())

    client = AnthropicClient(api_key="ignored", client=fake_client)
    insight = client.generate_insight({
        "ticker": "VOLV-B", "name": "Volvo", "sector": "Industrials",
        "signal": "BUY",
        "scores": {"total": 78, "value": 18, "quality": 22, "momentum": 20, "health": 18},
        "fundamentals": {"pe_ratio": 9.8, "roic": 21.3, "roe": 18.5, "debt_equity": 0.42, "fcf_yield": 7.1},
    })

    assert isinstance(insight, AIInsight)
    assert len(insight.strengths) == 2
    assert insight.catalyst_watch[1] == "European rate decisions."


def test_generate_insight_passes_model_and_tunables():
    fake_client = MagicMock()
    fake_client.messages.create.return_value = _fake_response(_good_json())

    client = AnthropicClient(
        api_key="ignored",
        model="claude-haiku-4-5-20251001",
        max_tokens=400,
        temperature=0.1,
        client=fake_client,
    )
    client.generate_insight({"ticker": "X", "name": "X", "scores": {}, "fundamentals": {}})

    kwargs = fake_client.messages.create.call_args.kwargs
    assert kwargs["model"] == "claude-haiku-4-5-20251001"
    assert kwargs["max_tokens"] == 400
    assert kwargs["temperature"] == 0.1


def test_generate_insight_marks_system_and_schema_for_cache():
    fake_client = MagicMock()
    fake_client.messages.create.return_value = _fake_response(_good_json())

    client = AnthropicClient(api_key="ignored", client=fake_client)
    client.generate_insight({"ticker": "X", "name": "X", "scores": {}, "fundamentals": {}})

    kwargs = fake_client.messages.create.call_args.kwargs
    system_blocks = kwargs["system"]
    assert isinstance(system_blocks, list)
    # Both system and schema instruction blocks should carry cache_control
    cached = [b for b in system_blocks if b.get("cache_control") == {"type": "ephemeral"}]
    assert len(cached) == 2
    # The user message must NOT carry cache_control
    user_msg = kwargs["messages"][0]
    assert "cache_control" not in user_msg


def test_generate_insight_rejects_malformed_json():
    fake_client = MagicMock()
    fake_client.messages.create.return_value = _fake_response("not json at all")
    client = AnthropicClient(api_key="ignored", client=fake_client)

    with pytest.raises(InsightSchemaError) as exc:
        client.generate_insight({"ticker": "X", "name": "X", "scores": {}, "fundamentals": {}})
    assert "not json at all" in exc.value.raw_output


def test_generate_insight_rejects_schema_violation():
    bad = json.dumps({"strengths": "not a list", "weaknesses": [], "catalyst_watch": []})
    fake_client = MagicMock()
    fake_client.messages.create.return_value = _fake_response(bad)
    client = AnthropicClient(api_key="ignored", client=fake_client)

    with pytest.raises(InsightSchemaError):
        client.generate_insight({"ticker": "X", "name": "X", "scores": {}, "fundamentals": {}})


def test_generate_insight_rejects_overlong_items():
    long_item = " ".join(["word"] * 25)  # 25 words, exceeds <=20 cap
    bad = json.dumps({
        "strengths": [long_item],
        "weaknesses": ["ok"],
        "catalyst_watch": ["ok"],
    })
    fake_client = MagicMock()
    fake_client.messages.create.return_value = _fake_response(bad)
    client = AnthropicClient(api_key="ignored", client=fake_client)

    with pytest.raises(InsightSchemaError) as exc:
        client.generate_insight({"ticker": "X", "name": "X", "scores": {}, "fundamentals": {}})
    assert "word count" in str(exc.value).lower() or "20" in str(exc.value)
