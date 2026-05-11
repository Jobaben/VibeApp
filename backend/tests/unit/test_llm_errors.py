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
