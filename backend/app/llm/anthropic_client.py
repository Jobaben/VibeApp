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
