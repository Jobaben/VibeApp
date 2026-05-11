# AI Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/api/ai/stock/{ticker}/deep-analysis` stub with a real LLM-backed implementation (Claude) that returns structured `AIInsight` content, surfaced through a collapsible panel on the React `StockDetail` page.

**Architecture:** A thin SDK wrapper (`AnthropicClient`) owns network policy; an orchestration service (`InsightService`) handles caching, score-hashing, and disabled-mode fallback; the existing FastAPI router gets rewired with rate limiting and explicit error mappings. The frontend gets a single new component, mounted once on `StockDetail`.

**Tech Stack:** FastAPI · Pydantic Settings · Redis (existing `CacheService`) · Anthropic Python SDK · slowapi · React + TypeScript + axios (existing).

**Spec:** `docs/superpowers/specs/2026-05-11-ai-integration-design.md`

**Out of scope for this plan (covered in the spec's "Out of Scope" section):** the other four `/api/ai/*` endpoints, `historical_trends`, `peer_comparison`, streaming responses, frontend automated tests (project has no vitest setup; adding it is its own task — frontend verification here is manual smoke only).

---

## File Map

| File | Action |
|---|---|
| `backend/requirements.txt` | Modify — add `anthropic`, `slowapi` |
| `backend/.env.example` | Modify — add LLM env keys |
| `backend/app/config.py` | Modify — add `LLM_*` settings |
| `backend/app/llm/__init__.py` | Create |
| `backend/app/llm/errors.py` | Create |
| `backend/app/llm/prompts.py` | Create |
| `backend/app/llm/anthropic_client.py` | Create |
| `backend/app/llm/insight_service.py` | Create |
| `backend/app/features/ai/router.py` | Modify — replace `deep_analysis` stub, add limiter |
| `backend/app/features/ai/dependencies.py` | Create — DI factories |
| `backend/app/tasks/score_tasks.py` | Modify — add cache invalidation after recompute |
| `backend/tests/unit/test_llm_prompts.py` | Create |
| `backend/tests/unit/test_llm_anthropic_client.py` | Create |
| `backend/tests/unit/test_llm_insight_service.py` | Create |
| `backend/tests/integration/test_ai_endpoints.py` | Modify — extend `TestDeepAnalysisEndpoint` |
| `backend/tests/smoke/__init__.py` | Create |
| `backend/tests/smoke/test_live_anthropic.py` | Create |
| `frontend/src/types/ai.ts` | Create |
| `frontend/src/services/api.ts` | Modify — add `aiApi` |
| `frontend/src/components/AIAnalysisPanel.tsx` | Create |
| `frontend/src/pages/StockDetail.tsx` | Modify — mount panel |

---

## Task 1: Add Python dependencies

**Files:**
- Modify: `backend/requirements.txt`

- [ ] **Step 1: Edit `backend/requirements.txt`**

Append (keep alphabetical-ish under the existing groups):

```
# LLM provider
anthropic>=0.40.0

# Rate limiting
slowapi>=0.1.9
```

- [ ] **Step 2: Install**

Run:
```bash
cd backend && .venv/bin/pip install -r requirements.txt
```
Expected: `Successfully installed anthropic-... slowapi-...`

- [ ] **Step 3: Verify importable**

Run:
```bash
cd backend && .venv/bin/python -c "import anthropic, slowapi; print(anthropic.__version__, slowapi.__version__)"
```
Expected: prints two version strings, exit 0.

- [ ] **Step 4: Commit**

```bash
git add backend/requirements.txt
git commit -m "feat(ai): add anthropic and slowapi dependencies"
```

---

## Task 2: Extend Settings with `LLM_*` keys

**Files:**
- Modify: `backend/app/config.py`
- Test: `backend/tests/unit/test_config_llm.py` (Create)

- [ ] **Step 1: Write the failing test**

Create `backend/tests/unit/test_config_llm.py`:

```python
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
```

- [ ] **Step 2: Run test, verify fail**

Run:
```bash
cd backend && .venv/bin/pytest tests/unit/test_config_llm.py -v
```
Expected: `AttributeError: 'Settings' object has no attribute 'LLM_ENABLED'` (or similar).

- [ ] **Step 3: Add settings**

Append to `backend/app/config.py` `Settings` class (above the closing `class Config:` block):

```python
    # LLM (AI insights)
    ANTHROPIC_API_KEY: str = ""
    LLM_ENABLED: bool = True
    LLM_MODEL: str = "claude-sonnet-4-6"
    LLM_MAX_TOKENS: int = 600
    LLM_TEMPERATURE: float = 0.3
    LLM_TIMEOUT_SECONDS: float = 30.0
    LLM_MAX_RETRIES: int = 3
    LLM_INSIGHT_TTL_SECONDS: int = 86_400
    LLM_INSIGHT_RATE_LIMIT_PER_MIN: int = 5
```

- [ ] **Step 4: Run test, verify pass**

Run:
```bash
cd backend && .venv/bin/pytest tests/unit/test_config_llm.py -v
```
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/app/config.py backend/tests/unit/test_config_llm.py
git commit -m "feat(ai): add LLM_* configuration keys"
```

---

## Task 3: Create LLM error types

**Files:**
- Create: `backend/app/llm/__init__.py`
- Create: `backend/app/llm/errors.py`
- Test: `backend/tests/unit/test_llm_errors.py` (Create)

- [ ] **Step 1: Write the failing test**

Create `backend/tests/unit/test_llm_errors.py`:

```python
"""Tests for LLM error types."""
import pytest
from app.llm.errors import InsightGenerationError, InsightSchemaError


def test_insight_generation_error_is_exception():
    err = InsightGenerationError("upstream unavailable")
    assert isinstance(err, Exception)
    assert str(err) == "upstream unavailable"


def test_insight_schema_error_carries_raw_output():
    err = InsightSchemaError("bad json", raw_output='{"strengths": "not a list"}')
    assert isinstance(err, Exception)
    assert err.raw_output == '{"strengths": "not a list"}'
    assert "bad json" in str(err)
```

- [ ] **Step 2: Run test, verify fail**

Run:
```bash
cd backend && .venv/bin/pytest tests/unit/test_llm_errors.py -v
```
Expected: `ModuleNotFoundError: No module named 'app.llm'`.

- [ ] **Step 3: Create the package + errors module**

Create `backend/app/llm/__init__.py`:

```python
"""LLM integration package."""
```

Create `backend/app/llm/errors.py`:

```python
"""Exception types raised by the LLM layer."""


class InsightGenerationError(Exception):
    """Raised when the LLM call fails after SDK-level retries are exhausted."""


class InsightSchemaError(Exception):
    """Raised when the LLM response does not conform to the AIInsight schema."""

    def __init__(self, message: str, raw_output: str = ""):
        super().__init__(message)
        self.raw_output = raw_output
```

- [ ] **Step 4: Run test, verify pass**

Run:
```bash
cd backend && .venv/bin/pytest tests/unit/test_llm_errors.py -v
```
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/app/llm/__init__.py backend/app/llm/errors.py backend/tests/unit/test_llm_errors.py
git commit -m "feat(ai): add LLM error types"
```

---

## Task 4: Create prompts module

**Files:**
- Create: `backend/app/llm/prompts.py`
- Test: `backend/tests/unit/test_llm_prompts.py` (Create)

- [ ] **Step 1: Write the failing test**

Create `backend/tests/unit/test_llm_prompts.py`:

```python
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
```

- [ ] **Step 2: Run test, verify fail**

Run:
```bash
cd backend && .venv/bin/pytest tests/unit/test_llm_prompts.py -v
```
Expected: `ModuleNotFoundError: No module named 'app.llm.prompts'`.

- [ ] **Step 3: Implement prompts module**

Create `backend/app/llm/prompts.py`:

```python
"""Prompt templates for stock insight generation."""
from typing import Any, Mapping

SYSTEM_PROMPT = """You are a financial analyst summarising publicly listed Swedish stocks for retail investors.

Constraints you MUST follow:
- Use a neutral, factual tone.
- Do not give buy, sell, or hold recommendations.
- Do not predict prices.
- Base every observation strictly on the data the user provides; never invent metrics.
- Output JSON only, no preamble, no markdown, no commentary.
- Not investment advice."""


SCHEMA_INSTRUCTION = """Return a single JSON object with exactly these keys:
{
  "strengths": [string, ...],         // 2-4 items, each <= 20 words
  "weaknesses": [string, ...],        // 2-4 items, each <= 20 words
  "catalyst_watch": [string, ...]     // 2-4 items, each <= 20 words; near-term events or trends to monitor
}

Plain text per item. No markdown. No numbering. No leading/trailing punctuation beyond a period."""


def _fmt(value: Any) -> str:
    """Format a value for prompt inclusion; omit/label None instead of leaking 'None'."""
    if value is None:
        return "n/a"
    if isinstance(value, float):
        return f"{value:.2f}"
    return str(value)


def build_user_message(payload: Mapping[str, Any]) -> str:
    """Compose the per-ticker user message from a stock payload.

    `payload` is expected to contain: ticker, name, sector, signal, scores, fundamentals.
    """
    scores = payload.get("scores", {})
    fundamentals = payload.get("fundamentals", {})

    lines = [
        f"Ticker: {payload.get('ticker')}",
        f"Name: {payload.get('name')}",
        f"Sector: {_fmt(payload.get('sector'))}",
        f"Signal: {_fmt(payload.get('signal'))}",
        "",
        "Scores (0-100 total, 0-25 per pillar):",
        f"  total={scores.get('total')}, value={scores.get('value')}, "
        f"quality={scores.get('quality')}, momentum={scores.get('momentum')}, "
        f"health={scores.get('health')}",
        "",
        "Fundamentals:",
        f"  P/E: {_fmt(fundamentals.get('pe_ratio'))}",
        f"  ROIC: {_fmt(fundamentals.get('roic'))}%",
        f"  ROE: {_fmt(fundamentals.get('roe'))}%",
        f"  Debt/Equity: {_fmt(fundamentals.get('debt_equity'))}",
        f"  FCF Yield: {_fmt(fundamentals.get('fcf_yield'))}%",
        "",
        "Generate the AIInsight JSON now.",
    ]
    return "\n".join(lines)
```

- [ ] **Step 4: Run test, verify pass**

Run:
```bash
cd backend && .venv/bin/pytest tests/unit/test_llm_prompts.py -v
```
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/app/llm/prompts.py backend/tests/unit/test_llm_prompts.py
git commit -m "feat(ai): add system/schema prompts and user message builder"
```

---

## Task 5: AnthropicClient — constructor + happy-path generation

**Files:**
- Create: `backend/app/llm/anthropic_client.py`
- Test: `backend/tests/unit/test_llm_anthropic_client.py` (Create)

- [ ] **Step 1: Write the failing test**

Create `backend/tests/unit/test_llm_anthropic_client.py`:

```python
"""Tests for AnthropicClient."""
import json
from unittest.mock import MagicMock

import pytest

from app.features.ai.schemas import AIInsight
from app.llm.anthropic_client import AnthropicClient


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
```

- [ ] **Step 2: Run test, verify fail**

Run:
```bash
cd backend && .venv/bin/pytest tests/unit/test_llm_anthropic_client.py -v
```
Expected: `ModuleNotFoundError: No module named 'app.llm.anthropic_client'`.

- [ ] **Step 3: Implement the client (happy path only — schema/error mapping in next tasks)**

Create `backend/app/llm/anthropic_client.py`:

```python
"""Anthropic SDK wrapper for stock insight generation."""
from __future__ import annotations

import json
from typing import Any, Mapping, Optional

import anthropic

from app.features.ai.schemas import AIInsight
from app.llm.errors import InsightGenerationError, InsightSchemaError
from app.llm.prompts import SCHEMA_INSTRUCTION, SYSTEM_PROMPT, build_user_message


class AnthropicClient:
    """Thin wrapper that handles prompt-cache markers and SDK invocation."""

    def __init__(
        self,
        api_key: str,
        *,
        model: str = "claude-sonnet-4-6",
        max_tokens: int = 600,
        temperature: float = 0.3,
        timeout_seconds: float = 30.0,
        max_retries: int = 3,
        client: Optional[anthropic.Anthropic] = None,
    ):
        self._client = client or anthropic.Anthropic(
            api_key=api_key,
            timeout=timeout_seconds,
            max_retries=max_retries,
        )
        self._model = model
        self._max_tokens = max_tokens
        self._temperature = temperature

    def generate_insight(self, stock_payload: Mapping[str, Any]) -> AIInsight:
        user_text = build_user_message(stock_payload)
        system_blocks = [
            {"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}},
            {"type": "text", "text": SCHEMA_INSTRUCTION, "cache_control": {"type": "ephemeral"}},
        ]
        messages = [{"role": "user", "content": user_text}]

        response = self._client.messages.create(
            model=self._model,
            max_tokens=self._max_tokens,
            temperature=self._temperature,
            system=system_blocks,
            messages=messages,
        )

        raw = "".join(block.text for block in response.content if hasattr(block, "text"))
        return self._parse(raw)

    @staticmethod
    def _parse(raw: str) -> AIInsight:
        # Schema validation arrives in the next task; for now just parse JSON.
        data = json.loads(raw)
        return AIInsight(**data)
```

- [ ] **Step 4: Run test, verify pass**

Run:
```bash
cd backend && .venv/bin/pytest tests/unit/test_llm_anthropic_client.py -v
```
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/app/llm/anthropic_client.py backend/tests/unit/test_llm_anthropic_client.py
git commit -m "feat(ai): add AnthropicClient with constructor wiring and happy-path generation"
```

---

## Task 6: AnthropicClient — schema validation

**Files:**
- Modify: `backend/app/llm/anthropic_client.py`
- Modify: `backend/tests/unit/test_llm_anthropic_client.py`

- [ ] **Step 1: Write the failing tests**

Append to `backend/tests/unit/test_llm_anthropic_client.py`:

```python
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
```

Add the missing imports at top of the test file if absent:

```python
from app.llm.errors import InsightGenerationError, InsightSchemaError
```

- [ ] **Step 2: Run tests, verify fail**

Run:
```bash
cd backend && .venv/bin/pytest tests/unit/test_llm_anthropic_client.py -v
```
Expected: the 3 new tests fail (json.JSONDecodeError, pydantic ValidationError, no validation respectively).

- [ ] **Step 3: Replace `_parse` with validating version**

In `backend/app/llm/anthropic_client.py`, replace the existing `_parse` method:

```python
    @staticmethod
    def _parse(raw: str) -> AIInsight:
        try:
            data = json.loads(raw)
        except json.JSONDecodeError as e:
            raise InsightSchemaError(f"LLM output is not valid JSON: {e}", raw_output=raw) from e

        try:
            insight = AIInsight(**data)
        except Exception as e:     # pydantic ValidationError or TypeError
            raise InsightSchemaError(f"LLM output failed AIInsight schema: {e}", raw_output=raw) from e

        for field_name in ("strengths", "weaknesses", "catalyst_watch"):
            for item in getattr(insight, field_name):
                if len(item.split()) > 20:
                    raise InsightSchemaError(
                        f"Item in '{field_name}' exceeds 20-word count: {item!r}",
                        raw_output=raw,
                    )

        return insight
```

- [ ] **Step 4: Run tests, verify pass**

Run:
```bash
cd backend && .venv/bin/pytest tests/unit/test_llm_anthropic_client.py -v
```
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/app/llm/anthropic_client.py backend/tests/unit/test_llm_anthropic_client.py
git commit -m "feat(ai): validate AIInsight schema and 20-word item cap in AnthropicClient"
```

---

## Task 7: AnthropicClient — map SDK exceptions to `InsightGenerationError`

**Files:**
- Modify: `backend/app/llm/anthropic_client.py`
- Modify: `backend/tests/unit/test_llm_anthropic_client.py`

- [ ] **Step 1: Write the failing tests**

Append to `backend/tests/unit/test_llm_anthropic_client.py`:

```python
def test_generate_insight_maps_connection_error():
    fake_client = MagicMock()
    fake_client.messages.create.side_effect = anthropic.APIConnectionError(request=MagicMock())
    client = AnthropicClient(api_key="ignored", client=fake_client)
    with pytest.raises(InsightGenerationError):
        client.generate_insight({"ticker": "X", "name": "X", "scores": {}, "fundamentals": {}})


def test_generate_insight_maps_timeout_error():
    fake_client = MagicMock()
    fake_client.messages.create.side_effect = anthropic.APITimeoutError(request=MagicMock())
    client = AnthropicClient(api_key="ignored", client=fake_client)
    with pytest.raises(InsightGenerationError):
        client.generate_insight({"ticker": "X", "name": "X", "scores": {}, "fundamentals": {}})


def test_generate_insight_maps_5xx_status_error():
    fake_client = MagicMock()
    fake_client.messages.create.side_effect = anthropic.APIStatusError(
        message="bad gateway", response=MagicMock(status_code=502), body=None
    )
    client = AnthropicClient(api_key="ignored", client=fake_client)
    with pytest.raises(InsightGenerationError):
        client.generate_insight({"ticker": "X", "name": "X", "scores": {}, "fundamentals": {}})


def test_constructor_forwards_timeout_and_retries_to_sdk(monkeypatch):
    captured = {}

    class FakeAnthropic:
        def __init__(self, *, api_key, timeout, max_retries):
            captured.update(api_key=api_key, timeout=timeout, max_retries=max_retries)
            self.messages = MagicMock()

    monkeypatch.setattr("app.llm.anthropic_client.anthropic.Anthropic", FakeAnthropic)

    AnthropicClient(api_key="sk-test", timeout_seconds=12.5, max_retries=7)

    assert captured == {"api_key": "sk-test", "timeout": 12.5, "max_retries": 7}
```

Add at top of the file if absent:

```python
import anthropic
```

- [ ] **Step 2: Run tests, verify fail**

Run:
```bash
cd backend && .venv/bin/pytest tests/unit/test_llm_anthropic_client.py -v
```
Expected: the 4 new tests fail (uncaught Anthropic exception or wiring mismatch).

- [ ] **Step 3: Add error mapping in `generate_insight`**

In `backend/app/llm/anthropic_client.py`, replace the body of `generate_insight` with:

```python
    def generate_insight(self, stock_payload: Mapping[str, Any]) -> AIInsight:
        user_text = build_user_message(stock_payload)
        system_blocks = [
            {"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}},
            {"type": "text", "text": SCHEMA_INSTRUCTION, "cache_control": {"type": "ephemeral"}},
        ]
        messages = [{"role": "user", "content": user_text}]

        try:
            response = self._client.messages.create(
                model=self._model,
                max_tokens=self._max_tokens,
                temperature=self._temperature,
                system=system_blocks,
                messages=messages,
            )
        except (anthropic.APIConnectionError, anthropic.APITimeoutError) as e:
            raise InsightGenerationError(f"LLM transport error: {e}") from e
        except anthropic.APIStatusError as e:
            raise InsightGenerationError(f"LLM HTTP error: {e}") from e

        raw = "".join(block.text for block in response.content if hasattr(block, "text"))
        return self._parse(raw)
```

- [ ] **Step 4: Run tests, verify pass**

Run:
```bash
cd backend && .venv/bin/pytest tests/unit/test_llm_anthropic_client.py -v
```
Expected: 10 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/app/llm/anthropic_client.py backend/tests/unit/test_llm_anthropic_client.py
git commit -m "feat(ai): map Anthropic SDK errors to InsightGenerationError"
```

---

## Task 8: InsightService — score_hash + disabled-mode sentinel

**Files:**
- Create: `backend/app/llm/insight_service.py`
- Test: `backend/tests/unit/test_llm_insight_service.py` (Create)

- [ ] **Step 1: Write the failing test**

Create `backend/tests/unit/test_llm_insight_service.py`:

```python
"""Tests for InsightService."""
from unittest.mock import MagicMock

import pytest

from app.features.ai.schemas import AIInsight, ScoreBreakdown, Fundamentals, StockAnalysis
from app.llm.insight_service import InsightService


def _stock_analysis(**overrides) -> StockAnalysis:
    defaults = dict(
        ticker="VOLV-B",
        name="Volvo",
        price=245.5,
        sector="Industrials",
        scores=ScoreBreakdown(total=78, value=18, quality=22, momentum=20, health=18),
        signal="BUY",
        fundamentals=Fundamentals(pe_ratio=9.8, roic=21.3, roe=18.5, debt_equity=0.42, fcf_yield=7.1),
        ai_insights=AIInsight(strengths=[], weaknesses=[], catalyst_watch=[]),
    )
    defaults.update(overrides)
    return StockAnalysis(**defaults)


def _config(**overrides) -> MagicMock:
    cfg = MagicMock()
    cfg.LLM_ENABLED = True
    cfg.LLM_INSIGHT_TTL_SECONDS = 86_400
    for k, v in overrides.items():
        setattr(cfg, k, v)
    return cfg


def test_score_hash_is_stable_across_calls():
    s = _stock_analysis()
    h1 = InsightService._score_hash(s.scores, s.fundamentals)
    h2 = InsightService._score_hash(s.scores, s.fundamentals)
    assert h1 == h2
    assert len(h1) == 16


def test_score_hash_ignores_price_changes():
    """Different prices, same scores+selected fundamentals → identical hash."""
    a = _stock_analysis(price=245.5)
    b = _stock_analysis(price=999.99)
    assert InsightService._score_hash(a.scores, a.fundamentals) == \
           InsightService._score_hash(b.scores, b.fundamentals)


def test_score_hash_changes_when_scores_change():
    a = _stock_analysis()
    b = _stock_analysis(
        scores=ScoreBreakdown(total=50, value=10, quality=10, momentum=15, health=15)
    )
    assert InsightService._score_hash(a.scores, a.fundamentals) != \
           InsightService._score_hash(b.scores, b.fundamentals)


def test_disabled_mode_returns_sentinel_without_llm_call():
    stock_provider = MagicMock(return_value=_stock_analysis())
    llm = MagicMock()
    cache = MagicMock()

    service = InsightService(
        anthropic_client=llm,
        cache_service=cache,
        stock_provider=stock_provider,
        config=_config(LLM_ENABLED=False),
    )

    result = service.get_stock_with_insight("VOLV-B")

    assert result.ai_insights.strengths == []
    assert result.ai_insights.weaknesses == []
    assert result.ai_insights.catalyst_watch == []
    llm.generate_insight.assert_not_called()
    cache.get.assert_not_called()
    cache.set.assert_not_called()
```

- [ ] **Step 2: Run test, verify fail**

Run:
```bash
cd backend && .venv/bin/pytest tests/unit/test_llm_insight_service.py -v
```
Expected: `ModuleNotFoundError: No module named 'app.llm.insight_service'`.

- [ ] **Step 3: Implement skeleton + score_hash + disabled mode**

Create `backend/app/llm/insight_service.py`:

```python
"""Orchestrates stock-data fetch + LLM call + Redis cache for AI insights."""
from __future__ import annotations

import hashlib
import json
from typing import Callable, Optional

from app.features.ai.schemas import (
    AIInsight,
    Fundamentals,
    ScoreBreakdown,
    StockAnalysis,
)
from app.llm.anthropic_client import AnthropicClient


StockProvider = Callable[[str], StockAnalysis]
"""Callable that resolves a ticker to a fully assembled StockAnalysis,
raising app.shared.exceptions.NotFoundException for unknown tickers."""


_HASHED_FUNDAMENTAL_FIELDS = (
    "pe_ratio",
    "roic",
    "roe",
    "debt_equity",
    "fcf_yield",
)


class InsightService:
    def __init__(
        self,
        *,
        anthropic_client: AnthropicClient,
        cache_service,
        stock_provider: StockProvider,
        config,
    ):
        self._llm = anthropic_client
        self._cache = cache_service
        self._stock_provider = stock_provider
        self._config = config

    def get_stock_with_insight(self, ticker: str) -> StockAnalysis:
        stock = self._stock_provider(ticker)  # may raise NotFoundException

        if not self._config.LLM_ENABLED:
            stock.ai_insights = AIInsight(strengths=[], weaknesses=[], catalyst_watch=[])
            return stock

        # Cache + LLM flow is added in subsequent tasks; for now, sentinel only.
        stock.ai_insights = AIInsight(strengths=[], weaknesses=[], catalyst_watch=[])
        return stock

    @staticmethod
    def _score_hash(scores: ScoreBreakdown, fundamentals: Fundamentals) -> str:
        canonical = {
            "scores": {
                "total": scores.total,
                "value": scores.value,
                "quality": scores.quality,
                "momentum": scores.momentum,
                "health": scores.health,
            },
            "fundamentals": {
                k: getattr(fundamentals, k) for k in _HASHED_FUNDAMENTAL_FIELDS
            },
        }
        encoded = json.dumps(canonical, sort_keys=True, separators=(",", ":")).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()[:16]
```

- [ ] **Step 4: Run test, verify pass**

Run:
```bash
cd backend && .venv/bin/pytest tests/unit/test_llm_insight_service.py -v
```
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/app/llm/insight_service.py backend/tests/unit/test_llm_insight_service.py
git commit -m "feat(ai): add InsightService with score_hash and disabled-mode sentinel"
```

---

## Task 9: InsightService — cache miss → LLM → cache set

**Files:**
- Modify: `backend/app/llm/insight_service.py`
- Modify: `backend/tests/unit/test_llm_insight_service.py`

- [ ] **Step 1: Write the failing tests**

Append to `backend/tests/unit/test_llm_insight_service.py`:

```python
def _real_insight() -> AIInsight:
    return AIInsight(
        strengths=["High ROIC."],
        weaknesses=["Cyclical demand."],
        catalyst_watch=["Q4 results."],
    )


def test_cache_miss_calls_llm_and_writes_cache():
    stock = _stock_analysis()
    stock_provider = MagicMock(return_value=stock)
    llm = MagicMock()
    llm.generate_insight.return_value = _real_insight()
    cache = MagicMock()
    cache.get.return_value = None

    service = InsightService(
        anthropic_client=llm,
        cache_service=cache,
        stock_provider=stock_provider,
        config=_config(),
    )

    result = service.get_stock_with_insight("VOLV-B")

    assert result.ai_insights.strengths == ["High ROIC."]
    llm.generate_insight.assert_called_once()
    cache.set.assert_called_once()
    key_arg = cache.set.call_args.args[0]
    assert key_arg.startswith("ai:insight:VOLV-B:")
    ttl_kwarg = cache.set.call_args.kwargs.get("ttl_seconds")
    assert ttl_kwarg == 86_400
```

- [ ] **Step 2: Run test, verify fail**

Run:
```bash
cd backend && .venv/bin/pytest tests/unit/test_llm_insight_service.py -v
```
Expected: new test fails (`llm.generate_insight.assert_called_once` → not called).

- [ ] **Step 3: Implement cache-miss path**

Replace the body of `get_stock_with_insight` in `backend/app/llm/insight_service.py`:

```python
    def get_stock_with_insight(self, ticker: str) -> StockAnalysis:
        stock = self._stock_provider(ticker)  # may raise NotFoundException

        if not self._config.LLM_ENABLED:
            stock.ai_insights = AIInsight(strengths=[], weaknesses=[], catalyst_watch=[])
            return stock

        score_hash = self._score_hash(stock.scores, stock.fundamentals)
        cache_key = f"ai:insight:{ticker}:{score_hash}"

        payload = {
            "ticker": stock.ticker,
            "name": stock.name,
            "sector": stock.sector,
            "signal": stock.signal,
            "scores": stock.scores.model_dump(),
            "fundamentals": stock.fundamentals.model_dump(),
        }
        insight = self._llm.generate_insight(payload)

        self._cache.set(
            cache_key,
            insight.model_dump(),
            ttl_seconds=self._config.LLM_INSIGHT_TTL_SECONDS,
        )

        stock.ai_insights = insight
        return stock
```

- [ ] **Step 4: Run tests, verify pass**

Run:
```bash
cd backend && .venv/bin/pytest tests/unit/test_llm_insight_service.py -v
```
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/app/llm/insight_service.py backend/tests/unit/test_llm_insight_service.py
git commit -m "feat(ai): wire LLM call and cache write in InsightService"
```

---

## Task 10: InsightService — cache hit short-circuits LLM

**Files:**
- Modify: `backend/app/llm/insight_service.py`
- Modify: `backend/tests/unit/test_llm_insight_service.py`

- [ ] **Step 1: Write the failing test**

Append to `backend/tests/unit/test_llm_insight_service.py`:

```python
def test_cache_hit_skips_llm():
    stock = _stock_analysis()
    cached_value = {
        "strengths": ["Cached strength."],
        "weaknesses": ["Cached weakness."],
        "catalyst_watch": ["Cached catalyst."],
    }
    cache = MagicMock()
    cache.get.return_value = cached_value
    llm = MagicMock()

    service = InsightService(
        anthropic_client=llm,
        cache_service=cache,
        stock_provider=MagicMock(return_value=stock),
        config=_config(),
    )

    result = service.get_stock_with_insight("VOLV-B")

    assert result.ai_insights.strengths == ["Cached strength."]
    llm.generate_insight.assert_not_called()
    cache.set.assert_not_called()
```

- [ ] **Step 2: Run test, verify fail**

Run:
```bash
cd backend && .venv/bin/pytest tests/unit/test_llm_insight_service.py::test_cache_hit_skips_llm -v
```
Expected: fails — `llm.generate_insight.assert_not_called` is violated.

- [ ] **Step 3: Insert cache-hit short-circuit**

In `backend/app/llm/insight_service.py`, inside `get_stock_with_insight`, insert a cache lookup block immediately after computing `cache_key`:

```python
        cached = self._cache.get(cache_key)
        if cached is not None:
            stock.ai_insights = AIInsight(**cached)
            return stock
```

The full method should now read:

```python
    def get_stock_with_insight(self, ticker: str) -> StockAnalysis:
        stock = self._stock_provider(ticker)

        if not self._config.LLM_ENABLED:
            stock.ai_insights = AIInsight(strengths=[], weaknesses=[], catalyst_watch=[])
            return stock

        score_hash = self._score_hash(stock.scores, stock.fundamentals)
        cache_key = f"ai:insight:{ticker}:{score_hash}"

        cached = self._cache.get(cache_key)
        if cached is not None:
            stock.ai_insights = AIInsight(**cached)
            return stock

        payload = {
            "ticker": stock.ticker,
            "name": stock.name,
            "sector": stock.sector,
            "signal": stock.signal,
            "scores": stock.scores.model_dump(),
            "fundamentals": stock.fundamentals.model_dump(),
        }
        insight = self._llm.generate_insight(payload)

        self._cache.set(
            cache_key,
            insight.model_dump(),
            ttl_seconds=self._config.LLM_INSIGHT_TTL_SECONDS,
        )

        stock.ai_insights = insight
        return stock
```

- [ ] **Step 4: Run tests, verify pass**

Run:
```bash
cd backend && .venv/bin/pytest tests/unit/test_llm_insight_service.py -v
```
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/app/llm/insight_service.py backend/tests/unit/test_llm_insight_service.py
git commit -m "feat(ai): short-circuit LLM call on cache hit"
```

---

## Task 11: InsightService — unknown ticker propagates `NotFoundException`

**Files:**
- Modify: `backend/tests/unit/test_llm_insight_service.py`

(No production code change — verifies the contract that `stock_provider` raises and the service does not swallow.)

- [ ] **Step 1: Write the failing test**

Append to `backend/tests/unit/test_llm_insight_service.py`:

```python
from app.shared.exceptions import NotFoundException


def test_unknown_ticker_raises_not_found():
    def raising_provider(ticker: str):
        raise NotFoundException("Stock", ticker)

    llm = MagicMock()
    cache = MagicMock()

    service = InsightService(
        anthropic_client=llm,
        cache_service=cache,
        stock_provider=raising_provider,
        config=_config(),
    )

    with pytest.raises(NotFoundException):
        service.get_stock_with_insight("GHOST")

    llm.generate_insight.assert_not_called()
    cache.get.assert_not_called()
    cache.set.assert_not_called()
```

- [ ] **Step 2: Run test, verify pass**

Run:
```bash
cd backend && .venv/bin/pytest tests/unit/test_llm_insight_service.py::test_unknown_ticker_raises_not_found -v
```
Expected: PASS (no `try/except` in the service, so the exception propagates naturally — this test pins the contract).

- [ ] **Step 3: Commit**

```bash
git add backend/tests/unit/test_llm_insight_service.py
git commit -m "test(ai): pin NotFoundException propagation contract in InsightService"
```

---

## Task 12: DI factories for the router

**Files:**
- Create: `backend/app/features/ai/dependencies.py`
- Test: existing pytest fixtures (no separate test file; verified through Task 13's integration test)

- [ ] **Step 1: Create the dependencies module**

Create `backend/app/features/ai/dependencies.py`:

```python
"""DI factories for AI feature router."""
from functools import lru_cache

from fastapi import Depends
from sqlalchemy.orm import Session

from app.config import Settings
from app.features.ai.schemas import (
    AIInsight,
    Fundamentals,
    ScoreBreakdown,
    StockAnalysis,
    Technicals,
)
from app.infrastructure.cache import get_cache_service
from app.infrastructure.database import get_db
from app.infrastructure.repositories import get_stock_repository
from app.llm.anthropic_client import AnthropicClient
from app.llm.insight_service import InsightService
from app.shared.exceptions import NotFoundException


@lru_cache
def _get_settings() -> Settings:
    return Settings()


def get_settings() -> Settings:
    return _get_settings()


def get_anthropic_client(settings: Settings = Depends(get_settings)) -> AnthropicClient:
    return AnthropicClient(
        api_key=settings.ANTHROPIC_API_KEY,
        model=settings.LLM_MODEL,
        max_tokens=settings.LLM_MAX_TOKENS,
        temperature=settings.LLM_TEMPERATURE,
        timeout_seconds=settings.LLM_TIMEOUT_SECONDS,
        max_retries=settings.LLM_MAX_RETRIES,
    )


def _build_stock_analysis(stock, fundamentals) -> StockAnalysis:
    """Map ORM Stock + StockFundamental → StockAnalysis schema.
    `ai_insights` is initialised empty; InsightService fills it.
    """
    score = stock.score  # relationship; may be None for unseeded stocks
    score_breakdown = ScoreBreakdown(
        total=getattr(score, "total_score", 0) or 0,
        value=getattr(score, "value_score", 0) or 0,
        quality=getattr(score, "quality_score", 0) or 0,
        momentum=getattr(score, "momentum_score", 0) or 0,
        health=getattr(score, "health_score", 0) or 0,
    )

    fund = Fundamentals(
        pe_ratio=getattr(fundamentals, "pe_ratio", None),
        ev_ebitda=getattr(fundamentals, "ev_ebitda", None),
        peg=getattr(fundamentals, "peg", None),
        pb_ratio=getattr(fundamentals, "pb_ratio", None),
        ps_ratio=getattr(fundamentals, "ps_ratio", None),
        roic=getattr(fundamentals, "roic", None),
        roe=getattr(fundamentals, "roe", None),
        gross_margin=getattr(fundamentals, "gross_margin", None),
        operating_margin=getattr(fundamentals, "operating_margin", None),
        net_margin=getattr(fundamentals, "net_margin", None),
        debt_equity=getattr(fundamentals, "debt_equity", None),
        current_ratio=getattr(fundamentals, "current_ratio", None),
        fcf_yield=getattr(fundamentals, "fcf_yield", None),
        interest_coverage=getattr(fundamentals, "interest_coverage", None),
    )

    return StockAnalysis(
        ticker=stock.ticker,
        name=stock.name,
        price=float(stock.current_price or 0),
        sector=stock.sector,
        industry=getattr(stock, "industry", None),
        instrument_type=getattr(stock, "instrument_type", "STOCK"),
        scores=score_breakdown,
        signal=getattr(score, "signal", "HOLD") if score else "HOLD",
        fundamentals=fund,
        vs_sector=None,
        technicals=None,
        ai_insights=AIInsight(strengths=[], weaknesses=[], catalyst_watch=[]),
    )


def get_insight_service(
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    anthropic_client: AnthropicClient = Depends(get_anthropic_client),
) -> InsightService:
    stock_repo = get_stock_repository(db)
    cache_service = get_cache_service()

    def stock_provider(ticker: str) -> StockAnalysis:
        stock = stock_repo.get_by_ticker(ticker)
        if stock is None:
            raise NotFoundException("Stock", ticker)
        full = stock_repo.get_with_full_data(stock.id)
        fundamentals = full.fundamentals[0] if getattr(full, "fundamentals", None) else None
        return _build_stock_analysis(full, fundamentals)

    return InsightService(
        anthropic_client=anthropic_client,
        cache_service=cache_service,
        stock_provider=stock_provider,
        config=settings,
    )
```

- [ ] **Step 2: Verify it imports cleanly**

Run:
```bash
cd backend && .venv/bin/python -c "from app.features.ai.dependencies import get_insight_service; print('ok')"
```
Expected: prints `ok`.

- [ ] **Step 3: Commit**

```bash
git add backend/app/features/ai/dependencies.py
git commit -m "feat(ai): add DI factories for InsightService and AnthropicClient"
```

> Note for the implementer: the `_build_stock_analysis` helper assumes ORM-side attribute names (`current_price`, `score.signal`, etc.). If your ORM models differ, adjust the attribute lookups but keep the function shape — every absent field should default to `None`/`0`/`"HOLD"` rather than raising. Run Task 13's integration test against a seeded test DB to verify; the test will tell you immediately if a field doesn't exist.

---

## Task 13: Router — replace `deep_analysis` stub with InsightService call

**Files:**
- Modify: `backend/app/features/ai/router.py`
- Modify: `backend/tests/integration/test_ai_endpoints.py`
- Test: `backend/tests/integration/test_ai_endpoints.py::TestDeepAnalysisEndpoint`

- [ ] **Step 1: Write the failing test**

Add a new test method inside the existing `TestDeepAnalysisEndpoint` class in `backend/tests/integration/test_ai_endpoints.py`:

```python
    def test_deep_analysis_returns_populated_insight_for_known_ticker(self, client, test_db, monkeypatch):
        """With a seeded ticker and a fake LLM, the endpoint returns AIInsight content."""
        from app.features.ai.dependencies import get_insight_service
        from app.features.ai.schemas import (
            AIInsight, Fundamentals, ScoreBreakdown, StockAnalysis,
        )
        from app.llm.insight_service import InsightService
        from main import app

        fake_insight = AIInsight(
            strengths=["High ROIC."],
            weaknesses=["Cyclical."],
            catalyst_watch=["Q4 orders."],
        )
        fake_stock = StockAnalysis(
            ticker="VOLV-B", name="Volvo Group", price=245.5, sector="Industrials",
            scores=ScoreBreakdown(total=78, value=18, quality=22, momentum=20, health=18),
            signal="BUY",
            fundamentals=Fundamentals(pe_ratio=9.8, roic=21.3, roe=18.5, debt_equity=0.42, fcf_yield=7.1),
            ai_insights=AIInsight(strengths=[], weaknesses=[], catalyst_watch=[]),
        )

        class FakeService:
            def get_stock_with_insight(self, ticker):
                fake_stock.ai_insights = fake_insight
                return fake_stock

        app.dependency_overrides[get_insight_service] = lambda: FakeService()
        try:
            response = client.get("/api/ai/stock/VOLV-B/deep-analysis")
        finally:
            app.dependency_overrides.pop(get_insight_service, None)

        assert response.status_code == 200
        body = response.json()
        assert body["stock"]["ticker"] == "VOLV-B"
        assert body["stock"]["ai_insights"]["strengths"] == ["High ROIC."]
        assert body["historical_trends"] == {}
        assert body["peer_comparison"] is None
```

- [ ] **Step 2: Run test, verify fail**

Run:
```bash
cd backend && .venv/bin/pytest tests/integration/test_ai_endpoints.py::TestDeepAnalysisEndpoint::test_deep_analysis_returns_populated_insight_for_known_ticker -v
```
Expected: fails — the current stub returns 404 unconditionally.

- [ ] **Step 3: Rewrite the `deep_analysis` route**

In `backend/app/features/ai/router.py`, replace the existing `deep_analysis` function and its imports:

At the top of the file, add:

```python
from fastapi import Depends, Response

from app.features.ai.dependencies import get_insight_service, get_settings
from app.llm.insight_service import InsightService
from app.config import Settings
from app.shared.exceptions import NotFoundException
```

Replace the existing `deep_analysis` function body:

```python
@router.get("/stock/{ticker}/deep-analysis", response_model=DeepAnalysisResponse)
async def deep_analysis(
    ticker: str,
    response: Response,
    service: InsightService = Depends(get_insight_service),
    settings: Settings = Depends(get_settings),
) -> DeepAnalysisResponse:
    """Get complete analysis of a single stock, including LLM-generated insights."""
    try:
        stock = service.get_stock_with_insight(ticker)
    except NotFoundException:
        raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")

    if not settings.LLM_ENABLED:
        response.headers["X-AI-Status"] = "disabled"

    return DeepAnalysisResponse(
        stock=stock,
        historical_trends={},
        peer_comparison=None,
    )
```

- [ ] **Step 4: Run tests, verify pass**

Run:
```bash
cd backend && .venv/bin/pytest tests/integration/test_ai_endpoints.py -v
```
Expected: all `TestDeepAnalysisEndpoint` tests pass; the existing `test_deep_analysis_endpoint_not_found` and `test_deep_analysis_ticker_format` still pass (empty test DB → `NotFoundException` → 404).

- [ ] **Step 5: Commit**

```bash
git add backend/app/features/ai/router.py backend/tests/integration/test_ai_endpoints.py
git commit -m "feat(ai): wire InsightService into deep-analysis endpoint"
```

---

## Task 14: Router — map LLM errors to 503 / 502

**Files:**
- Modify: `backend/app/features/ai/router.py`
- Modify: `backend/tests/integration/test_ai_endpoints.py`

- [ ] **Step 1: Write the failing tests**

Append to `TestDeepAnalysisEndpoint` in `backend/tests/integration/test_ai_endpoints.py`:

```python
    def test_deep_analysis_503_on_llm_unavailable(self, client):
        from app.features.ai.dependencies import get_insight_service
        from app.llm.errors import InsightGenerationError
        from main import app

        class FailingService:
            def get_stock_with_insight(self, ticker):
                raise InsightGenerationError("upstream down")

        app.dependency_overrides[get_insight_service] = lambda: FailingService()
        try:
            response = client.get("/api/ai/stock/VOLV-B/deep-analysis")
        finally:
            app.dependency_overrides.pop(get_insight_service, None)

        assert response.status_code == 503
        body = response.json()
        assert body["detail"]["code"] == "llm_unavailable"


    def test_deep_analysis_502_on_llm_schema_error(self, client):
        from app.features.ai.dependencies import get_insight_service
        from app.llm.errors import InsightSchemaError
        from main import app

        class FailingService:
            def get_stock_with_insight(self, ticker):
                raise InsightSchemaError("bad shape", raw_output='{"strengths": "oops"}')

        app.dependency_overrides[get_insight_service] = lambda: FailingService()
        try:
            response = client.get("/api/ai/stock/VOLV-B/deep-analysis")
        finally:
            app.dependency_overrides.pop(get_insight_service, None)

        assert response.status_code == 502
        body = response.json()
        assert body["detail"]["code"] == "llm_schema_error"
```

- [ ] **Step 2: Run tests, verify fail**

Run:
```bash
cd backend && .venv/bin/pytest tests/integration/test_ai_endpoints.py::TestDeepAnalysisEndpoint -v
```
Expected: both new tests fail — unhandled exception → 500.

- [ ] **Step 3: Add error mappings to the route**

In `backend/app/features/ai/router.py`, expand the `try/except` inside `deep_analysis`:

```python
    try:
        stock = service.get_stock_with_insight(ticker)
    except NotFoundException:
        raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")
    except InsightGenerationError:
        raise HTTPException(
            status_code=503,
            detail={"detail": "AI analysis temporarily unavailable", "code": "llm_unavailable"},
        )
    except InsightSchemaError as e:
        import logging
        logging.getLogger(__name__).error(
            "LLM schema error ticker=%s raw=%r", ticker, (e.raw_output or "")[:1024]
        )
        raise HTTPException(
            status_code=502,
            detail={"detail": "AI analysis failed validation", "code": "llm_schema_error"},
        )
```

Add the imports at the top of the file:

```python
from app.llm.errors import InsightGenerationError, InsightSchemaError
```

- [ ] **Step 4: Run tests, verify pass**

Run:
```bash
cd backend && .venv/bin/pytest tests/integration/test_ai_endpoints.py::TestDeepAnalysisEndpoint -v
```
Expected: all `TestDeepAnalysisEndpoint` tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/app/features/ai/router.py backend/tests/integration/test_ai_endpoints.py
git commit -m "feat(ai): map InsightGenerationError to 503 and InsightSchemaError to 502"
```

---

## Task 15: Router — slowapi rate limit (5/min/IP)

**Files:**
- Create: `backend/app/limiter.py` (avoids circular import — `main.py` imports the AI router, and the router imports the limiter)
- Modify: `backend/main.py`
- Modify: `backend/app/features/ai/router.py`
- Modify: `backend/tests/integration/test_ai_endpoints.py`

- [ ] **Step 1: Create the shared limiter module**

Create `backend/app/limiter.py`:

```python
"""Module-level slowapi limiter, shared between main.py and feature routers."""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
```

- [ ] **Step 2: Write the failing test**

Append to `TestDeepAnalysisEndpoint` in `backend/tests/integration/test_ai_endpoints.py`:

```python
    def test_deep_analysis_rate_limited_after_5_per_minute(self, client, test_db):
        from app.features.ai.dependencies import get_insight_service
        from app.features.ai.schemas import (
            AIInsight, Fundamentals, ScoreBreakdown, StockAnalysis,
        )
        from main import app

        fake = StockAnalysis(
            ticker="VOLV-B", name="Volvo", price=1.0, sector="X",
            scores=ScoreBreakdown(total=0, value=0, quality=0, momentum=0, health=0),
            signal="HOLD",
            fundamentals=Fundamentals(),
            ai_insights=AIInsight(strengths=[], weaknesses=[], catalyst_watch=[]),
        )

        class FakeService:
            def get_stock_with_insight(self, ticker):
                return fake

        app.dependency_overrides[get_insight_service] = lambda: FakeService()
        try:
            statuses = [
                client.get("/api/ai/stock/VOLV-B/deep-analysis").status_code
                for _ in range(6)
            ]
        finally:
            app.dependency_overrides.pop(get_insight_service, None)

        assert statuses[:5] == [200] * 5
        assert statuses[5] == 429
```

- [ ] **Step 3: Wire slowapi into the app**

In `backend/main.py`, add to the existing imports at the top:

```python
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi.responses import JSONResponse

from app.limiter import limiter
```

After `app = FastAPI(...)`, add:

```python
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": {"detail": "Too many requests. Please wait a minute.", "code": "rate_limited"}},
        headers={"Retry-After": "60"},
    )
```

In `backend/app/features/ai/router.py`, at the top:

```python
from fastapi import Request
from app.limiter import limiter
```

And decorate the route (the decorator must precede `@router.get`):

```python
@router.get("/stock/{ticker}/deep-analysis", response_model=DeepAnalysisResponse)
@limiter.limit("5/minute")
async def deep_analysis(
    request: Request,
    ticker: str,
    response: Response,
    service: InsightService = Depends(get_insight_service),
    settings: Settings = Depends(get_settings),
) -> DeepAnalysisResponse:
    ...
```

Note: `request: Request` is required by slowapi; add it to the signature.

- [ ] **Step 4: Run the rate-limit test plus regressions**

Run:
```bash
cd backend && .venv/bin/pytest tests/integration/test_ai_endpoints.py::TestDeepAnalysisEndpoint -v
```
Expected: all pass, including the new rate-limit test.

- [ ] **Step 5: Commit**

```bash
git add backend/app/limiter.py backend/main.py backend/app/features/ai/router.py backend/tests/integration/test_ai_endpoints.py
git commit -m "feat(ai): rate-limit deep-analysis to 5 req/min/IP"
```

---

## Task 16: Router — `X-AI-Status: disabled` header when LLM disabled

**Files:**
- Modify: `backend/tests/integration/test_ai_endpoints.py`
- (No production code change — header logic was already added in Task 13.)

- [ ] **Step 1: Write the failing test**

Append to `TestDeepAnalysisEndpoint`:

```python
    def test_deep_analysis_disabled_mode_sets_header_and_sentinel(self, client, monkeypatch, test_db):
        from app.features.ai.dependencies import get_insight_service, get_settings
        from app.features.ai.schemas import (
            AIInsight, Fundamentals, ScoreBreakdown, StockAnalysis,
        )
        from main import app

        sentinel = StockAnalysis(
            ticker="VOLV-B", name="Volvo", price=1.0, sector="X",
            scores=ScoreBreakdown(total=0, value=0, quality=0, momentum=0, health=0),
            signal="HOLD",
            fundamentals=Fundamentals(),
            ai_insights=AIInsight(strengths=[], weaknesses=[], catalyst_watch=[]),
        )

        class FakeService:
            def get_stock_with_insight(self, ticker):
                return sentinel

        class FakeSettings:
            LLM_ENABLED = False

        app.dependency_overrides[get_insight_service] = lambda: FakeService()
        app.dependency_overrides[get_settings] = lambda: FakeSettings()
        try:
            response = client.get("/api/ai/stock/VOLV-B/deep-analysis")
        finally:
            app.dependency_overrides.pop(get_insight_service, None)
            app.dependency_overrides.pop(get_settings, None)

        assert response.status_code == 200
        assert response.headers.get("X-AI-Status") == "disabled"
        assert response.json()["stock"]["ai_insights"]["strengths"] == []
```

- [ ] **Step 2: Run test, verify pass**

Run:
```bash
cd backend && .venv/bin/pytest tests/integration/test_ai_endpoints.py::TestDeepAnalysisEndpoint::test_deep_analysis_disabled_mode_sets_header_and_sentinel -v
```
Expected: pass (the header logic from Task 13 already handles this).

- [ ] **Step 3: Commit**

```bash
git add backend/tests/integration/test_ai_endpoints.py
git commit -m "test(ai): pin X-AI-Status header behaviour in disabled mode"
```

---

## Task 17: Cache invalidation hook in `recalculate_all_scores`

**Files:**
- Modify: `backend/app/tasks/score_tasks.py`

- [ ] **Step 1: Inspect the current task**

Read `backend/app/tasks/score_tasks.py:52` (the `recalculate_all_scores` Celery task) to see its current structure.

- [ ] **Step 2: Add the invalidation call**

In `backend/app/tasks/score_tasks.py`, locate `recalculate_all_scores`. After the existing successful-pass code (before the function returns), add:

```python
    from app.infrastructure.cache import get_cache_service
    try:
        cache_service = get_cache_service()
        if cache_service.is_available():
            cleared = cache_service.invalidate("ai:insight:*")
            logger.info(f"Invalidated {cleared} AI insight cache entries after score recompute")
    except Exception as e:
        # Cache invalidation failure must NOT fail the recompute task.
        logger.warning(f"AI insight cache invalidation skipped: {e}")
```

If `logger` is not already imported in this module, add at the top:

```python
import logging
logger = logging.getLogger(__name__)
```

- [ ] **Step 3: Verify the module still imports cleanly**

Run:
```bash
cd backend && .venv/bin/python -c "from app.tasks.score_tasks import recalculate_all_scores; print('ok')"
```
Expected: prints `ok`.

- [ ] **Step 4: Commit**

```bash
git add backend/app/tasks/score_tasks.py
git commit -m "feat(ai): invalidate ai:insight:* cache after recalculate_all_scores"
```

> Note: behaviour is covered indirectly by the existing `CacheService.invalidate` tests and by the cache hit/miss tests in `test_llm_insight_service.py`. A dedicated integration test for the Celery path would require a Celery worker and is out of scope.

---

## Task 18: Live smoke test (skipped by default)

**Files:**
- Create: `backend/tests/smoke/__init__.py`
- Create: `backend/tests/smoke/test_live_anthropic.py`

- [ ] **Step 1: Create the smoke package**

Create `backend/tests/smoke/__init__.py` (empty file).

- [ ] **Step 2: Create the smoke test**

Create `backend/tests/smoke/test_live_anthropic.py`:

```python
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
```

- [ ] **Step 3: Verify it skips cleanly without the env flag**

Run:
```bash
cd backend && .venv/bin/pytest tests/smoke/test_live_anthropic.py -v
```
Expected: `1 skipped`.

- [ ] **Step 4: Commit**

```bash
git add backend/tests/smoke/__init__.py backend/tests/smoke/test_live_anthropic.py
git commit -m "test(ai): add gated live Anthropic smoke test"
```

---

## Task 19: Update `.env.example`

**Files:**
- Modify: `backend/.env.example`

- [ ] **Step 1: Locate the file**

Run:
```bash
ls -la backend/.env.example 2>/dev/null || ls -la backend/.env.sample 2>/dev/null
```
If neither exists, create `backend/.env.example` from scratch in step 2.

- [ ] **Step 2: Append LLM block**

Append to `backend/.env.example` (or create it with the same baseline content already documented in `backend/app/config.py`):

```bash

# LLM (AI insights) ----------------------------------------------------
# Get an API key at console.anthropic.com. Required when LLM_ENABLED=true.
ANTHROPIC_API_KEY=

# Set to false to disable LLM calls (returns sentinel insight + X-AI-Status: disabled).
LLM_ENABLED=true

# Anthropic model to use for insights.
LLM_MODEL=claude-sonnet-4-6

# Per-request timeout (seconds) forwarded to the Anthropic SDK.
LLM_TIMEOUT_SECONDS=30

# SDK-level retry budget for transient errors. Total retries = this value.
LLM_MAX_RETRIES=3
```

- [ ] **Step 3: Commit**

```bash
git add backend/.env.example
git commit -m "docs(ai): document LLM env keys in .env.example"
```

---

## Task 20: Frontend — AI types

**Files:**
- Create: `frontend/src/types/ai.ts`

- [ ] **Step 1: Create the types file**

Create `frontend/src/types/ai.ts`:

```ts
export type AIInsight = {
  strengths: string[];
  weaknesses: string[];
  catalyst_watch: string[];
};

export type DeepAnalysisStock = {
  ticker: string;
  name: string;
  price: number;
  sector?: string | null;
  signal: string;
  ai_insights: AIInsight;
  // Other fields exist in the backend schema (scores, fundamentals, technicals,
  // vs_sector) but are not consumed by this feature.
};

export type DeepAnalysisResponse = {
  stock: DeepAnalysisStock;
  historical_trends: Record<string, number[]>;
  peer_comparison: unknown[] | null;
};

export type AIErrorCode =
  | "llm_unavailable"
  | "llm_schema_error"
  | "rate_limited";

export type AIErrorBody = {
  detail: {
    detail: string;
    code: AIErrorCode;
  };
};
```

- [ ] **Step 2: Verify TS compiles**

Run:
```bash
cd frontend && npx tsc --noEmit
```
Expected: exit 0 (no new TS errors introduced).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/ai.ts
git commit -m "feat(ai): add frontend AI types"
```

---

## Task 21: Frontend — `aiApi` service

**Files:**
- Modify: `frontend/src/services/api.ts`

- [ ] **Step 1: Append `aiApi` to `services/api.ts`**

At the bottom of `frontend/src/services/api.ts`, after the existing `stockApi` export:

```ts
import type { DeepAnalysisResponse } from '../types/ai';

export const aiApi = {
  getDeepAnalysis: (ticker: string) =>
    apiClient.get<DeepAnalysisResponse>(`/api/ai/stock/${ticker}/deep-analysis`),
};
```

If imports are typically grouped at the top of the file, move the `import type` line up there to match conventions.

- [ ] **Step 2: Verify TS compiles**

Run:
```bash
cd frontend && npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/api.ts
git commit -m "feat(ai): add aiApi.getDeepAnalysis helper"
```

---

## Task 22: Frontend — `AIAnalysisPanel` component

**Files:**
- Create: `frontend/src/components/AIAnalysisPanel.tsx`

- [ ] **Step 1: Create the component**

Create `frontend/src/components/AIAnalysisPanel.tsx`:

```tsx
import { useState } from 'react';
import { AxiosError } from 'axios';
import { aiApi } from '../services/api';
import type { AIInsight, AIErrorCode } from '../types/ai';

type PanelState =
  | { kind: 'collapsed' }
  | { kind: 'loading' }
  | { kind: 'loaded'; insight: AIInsight }
  | { kind: 'error'; code: AIErrorCode | 'unknown'; retryAfterSec: number | null }
  | { kind: 'disabled' };

const DISCLAIMER =
  'AI-generated analysis based on current fundamentals. Not investment advice. Always do your own research.';

const ERROR_SUBTEXT: Record<AIErrorCode | 'unknown', string> = {
  llm_unavailable: 'The AI service is temporarily unreachable.',
  llm_schema_error: "The AI response didn't pass validation.",
  rate_limited: 'Too many requests — try again in a minute.',
  unknown: 'An unexpected error occurred.',
};

type Props = { ticker: string };

export function AIAnalysisPanel({ ticker }: Props) {
  const [state, setState] = useState<PanelState>({ kind: 'collapsed' });

  async function expand() {
    if (state.kind === 'loaded' || state.kind === 'disabled') return;
    setState({ kind: 'loading' });
    try {
      const res = await aiApi.getDeepAnalysis(ticker);
      if (res.headers['x-ai-status'] === 'disabled') {
        setState({ kind: 'disabled' });
        return;
      }
      setState({ kind: 'loaded', insight: res.data.stock.ai_insights });
    } catch (err) {
      const axErr = err as AxiosError<{ detail?: { code?: AIErrorCode } }>;
      const code = (axErr.response?.data?.detail?.code as AIErrorCode) ?? 'unknown';
      const retryAfter = axErr.response?.headers?.['retry-after'];
      setState({
        kind: 'error',
        code,
        retryAfterSec: retryAfter ? Number(retryAfter) : null,
      });
    }
  }

  function collapse() {
    if (state.kind === 'loaded') setState({ kind: 'collapsed' });
  }

  return (
    <section
      className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 mt-4"
      data-testid="ai-analysis-panel"
    >
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">🧠 AI Analysis</h3>
        {state.kind === 'collapsed' && (
          <button
            type="button"
            onClick={expand}
            className="text-xs text-purple-300 hover:text-purple-200"
          >
            Show analysis
          </button>
        )}
        {state.kind === 'loaded' && (
          <button
            type="button"
            onClick={collapse}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Hide
          </button>
        )}
      </header>

      {state.kind === 'loading' && (
        <div className="mt-3 text-sm text-slate-300">
          <p>Generating analysis…</p>
          <p className="text-xs text-slate-500 mt-1">
            First fetch can take a few seconds. Cached results are instant.
          </p>
        </div>
      )}

      {state.kind === 'loaded' && (
        <div className="mt-3 grid gap-3 text-sm">
          <InsightList title="Strengths" accent="green" items={state.insight.strengths} />
          <InsightList title="Weaknesses" accent="amber" items={state.insight.weaknesses} />
          <InsightList title="Watch for" accent="blue" items={state.insight.catalyst_watch} />
          <p className="text-xs text-slate-500 italic mt-2">{DISCLAIMER}</p>
        </div>
      )}

      {state.kind === 'error' && (
        <div className="mt-3 text-sm">
          <p className="text-red-300">AI analysis temporarily unavailable</p>
          <p className="text-xs text-slate-500 mt-1">{ERROR_SUBTEXT[state.code]}</p>
          <button
            type="button"
            onClick={expand}
            disabled={state.code === 'rate_limited'}
            className="mt-2 text-xs text-purple-300 hover:text-purple-200 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            Retry
          </button>
        </div>
      )}

      {state.kind === 'disabled' && (
        <div className="mt-3 text-sm text-slate-400">
          <p>AI analysis is disabled in this environment.</p>
        </div>
      )}
    </section>
  );
}

const ACCENT_CLASS: Record<'green' | 'amber' | 'blue', string> = {
  green: 'text-emerald-300',
  amber: 'text-amber-300',
  blue: 'text-sky-300',
};

function InsightList({
  title,
  accent,
  items,
}: {
  title: string;
  accent: 'green' | 'amber' | 'blue';
  items: string[];
}) {
  return (
    <div>
      <h4 className={`text-xs font-semibold uppercase tracking-wide ${ACCENT_CLASS[accent]}`}>
        {title}
      </h4>
      <ul className="mt-1 list-disc list-inside text-slate-200 space-y-0.5">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

Run:
```bash
cd frontend && npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/AIAnalysisPanel.tsx
git commit -m "feat(ai): add AIAnalysisPanel component"
```

---

## Task 23: Mount `AIAnalysisPanel` on `StockDetail`

**Files:**
- Modify: `frontend/src/pages/StockDetail.tsx`

- [ ] **Step 1: Inspect the page to find the mount point**

Read `frontend/src/pages/StockDetail.tsx` and locate the `<ScoreBreakdown ... />` JSX element — the panel mounts immediately after it.

- [ ] **Step 2: Add the import + mount**

At the top of `frontend/src/pages/StockDetail.tsx`, add:

```tsx
import { AIAnalysisPanel } from '../components/AIAnalysisPanel';
```

In the JSX, immediately after the `<ScoreBreakdown ... />` element, add:

```tsx
<AIAnalysisPanel ticker={ticker} />
```

If `ticker` is not available as a variable in this scope, use the same identifier already passed to `<ScoreBreakdown>` (likely a URL param via `useParams`).

- [ ] **Step 3: Verify TS compiles**

Run:
```bash
cd frontend && npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/StockDetail.tsx
git commit -m "feat(ai): mount AIAnalysisPanel on StockDetail page"
```

---

## Task 24: Manual end-to-end smoke verification

**No code changes.** Verify the integrated feature against the running stack.

- [ ] **Step 1: Run the backend + frontend**

User runs backend (via IDE per CLAUDE.md — `dotnet run`-style commands are project-specific; this project uses `uvicorn main:app --reload`) and frontend (`npm run dev` in `frontend/`).

- [ ] **Step 2: Set the API key (or disabled mode)**

In `backend/.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
LLM_ENABLED=true
```

For the disabled-mode check, alternatively set `LLM_ENABLED=false` with no key.

- [ ] **Step 3: Run the smoke checklist**

For each step, observe the expected outcome:

1. Visit a stock detail page that has a known ticker → panel renders collapsed with "Show analysis" button.
2. Click "Show analysis" → spinner appears → after a few seconds, three lists render (Strengths/Weaknesses/Watch for) plus the disclaimer.
3. Click "Hide" → panel collapses; re-expand → no network request fires (verify in browser devtools network tab).
4. Open a different ticker → panel re-fetches for the new ticker.
5. Wait, then click on the same first ticker again → backend logs show `cache_hit=true` (verify in `logs/`); response time is near-zero.
6. Stop the backend, click expand → panel shows error state with the message and a Retry button enabled.
7. Restart backend with `LLM_ENABLED=false` → expand → panel shows the "AI analysis is disabled in this environment" info state, no error styling.

- [ ] **Step 4: Confirm or report**

If every step matches the expected outcome, mark this task complete and proceed to the final PR. If any step diverges, file a bug referencing the spec acceptance criterion that failed.

---

## Acceptance Mapping

| Spec acceptance criterion | Task(s) |
|---|---|
| 1. `deep-analysis` returns populated `ai_insights` for a known ticker | 9, 13 |
| 2. Second request within 24h does not invoke the LLM | 10 |
| 3. Score recompute invalidates the ticker's cache | 17 |
| 4. `StockDetail` renders the collapsed panel; expand shows insights + disclaimer | 22, 23, 24 |
| 5. Unknown→404, LLM fail→503, schema fail→502, rate-limited→429 | 11, 13, 14, 15 |
| 6. `LLM_ENABLED=False` returns 200 + sentinel + `X-AI-Status: disabled` | 8, 13, 16 |
| 7. All new unit and integration tests pass without a live key | All test tasks |
| 8. `.env.example` documents new keys; no real key committed | 19 |

---

## Final command to verify everything

After Task 23 completes, run the full backend suite once more:

```bash
cd backend && .venv/bin/pytest -v
```

Expected: every test passes, including the new units, the extended integration tests, and the gated smoke test (skipped).
