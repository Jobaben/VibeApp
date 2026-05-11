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
