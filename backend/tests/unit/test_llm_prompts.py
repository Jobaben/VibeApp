"""Tests for LLM prompt construction."""
from app.llm.prompts import SYSTEM_PROMPT, SCHEMA_INSTRUCTION, build_user_message


def _sample_payload() -> dict:
    return {
        "ticker": "VOLV-B",
        "name": "Volvo Group",
        "sector": "Industrials",
        "signal": "BUY",
        "scores": {"total": 78, "value": 18, "quality": 22, "momentum": 20, "health": 18},
        "fundamentals": {
            "pe_ratio": 9.8,
            "roic": 21.3,
            "roe": 18.5,
            "debt_equity": 0.42,
            "fcf_yield": 7.1,
        },
    }


def test_system_prompt_is_neutral_analyst():
    assert "financial analyst" in SYSTEM_PROMPT.lower()
    assert "not investment advice" in SYSTEM_PROMPT.lower() or "no buy/sell" in SYSTEM_PROMPT.lower()


def test_schema_instruction_describes_required_keys():
    for key in ("strengths", "weaknesses", "catalyst_watch"):
        assert key in SCHEMA_INSTRUCTION


def test_build_user_message_includes_required_fields():
    msg = build_user_message(_sample_payload())
    assert "VOLV-B" in msg
    assert "Industrials" in msg
    assert "21.3" in msg     # roic
    assert "9.8" in msg      # pe
    assert "78" in msg       # total score


def test_build_user_message_is_deterministic():
    payload = _sample_payload()
    assert build_user_message(payload) == build_user_message(payload)


def test_build_user_message_under_2kb():
    msg = build_user_message(_sample_payload())
    assert len(msg.encode("utf-8")) < 2048


def test_build_user_message_handles_none_fundamentals():
    payload = _sample_payload()
    payload["fundamentals"]["pe_ratio"] = None
    msg = build_user_message(payload)
    assert "None" not in msg     # nulls should be omitted or labelled, not leaked
