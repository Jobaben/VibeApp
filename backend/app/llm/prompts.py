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
