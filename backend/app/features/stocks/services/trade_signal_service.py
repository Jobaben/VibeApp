"""
Trade signal service: derives historical buy/sell events from price data.

Signals are computed from the technical indicators produced by
PriceDataService.calculate_technical_indicators (sma_50, sma_200, rsi):

- GOLDEN_CROSS   (BUY,  STRONG):   SMA-50 crosses above SMA-200
- DEATH_CROSS    (SELL, STRONG):   SMA-50 crosses below SMA-200
- RSI_RECOVERY   (BUY,  MODERATE): RSI climbs back above 30 after being oversold
- RSI_REVERSAL   (SELL, MODERATE): RSI drops back below 70 after being overbought

These events are drawn as markers on the price chart and summarized in the
signal timeline on the stock detail page.

IMPORTANT: Educational/research purposes only. Not financial advice.
"""
import logging
from typing import Any, Dict, List, Optional

import pandas as pd

logger = logging.getLogger(__name__)

RSI_OVERSOLD = 30.0
RSI_OVERBOUGHT = 70.0

# SMA crossings during the indicator warm-up window are artifacts of
# min_periods=1 (both averages start equal to the price), not real crosses.
SMA_WARMUP_ROWS = 50

# RSI can whipsaw around its thresholds for days; re-emitting the same event
# that soon adds chart clutter without new information.
RSI_COOLDOWN_ROWS = 10


class TradeSignalService:
    """Derives buy/sell trade-signal events from an indicator DataFrame."""

    def compute_signals(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Compute historical buy/sell events from price data with indicators.

        Args:
            df: DataFrame with 'date', 'close' and indicator columns
                ('sma_50', 'sma_200', 'rsi') as produced by
                PriceDataService.calculate_technical_indicators.

        Returns:
            List of event dicts sorted by date:
            {date, type, price, indicator, strength, reason}
        """
        if df is None or df.empty:
            return []

        events: List[Dict[str, Any]] = []

        has_sma = "sma_50" in df.columns and "sma_200" in df.columns
        has_rsi = "rsi" in df.columns

        prev = None
        last_rsi_emit = {"BUY": -RSI_COOLDOWN_ROWS, "SELL": -RSI_COOLDOWN_ROWS}
        for i, row in enumerate(df.itertuples(index=False)):
            if prev is not None:
                if has_sma and i >= SMA_WARMUP_ROWS:
                    event = self._check_sma_cross(prev, row)
                    if event:
                        events.append(event)
                if has_rsi:
                    event = self._check_rsi_cross(prev, row)
                    if event and i - last_rsi_emit[event["type"]] >= RSI_COOLDOWN_ROWS:
                        events.append(event)
                        last_rsi_emit[event["type"]] = i
            prev = row

        return events

    def _check_sma_cross(self, prev, row) -> Optional[Dict[str, Any]]:
        """Detect golden/death crosses between consecutive rows."""
        if any(pd.isna(v) for v in (prev.sma_50, prev.sma_200, row.sma_50, row.sma_200)):
            return None

        prev_diff = prev.sma_50 - prev.sma_200
        curr_diff = row.sma_50 - row.sma_200

        if prev_diff <= 0 < curr_diff:
            return self._event(
                row, "BUY", "GOLDEN_CROSS", "STRONG",
                "Golden cross: the 50-day average moved above the 200-day average, "
                "a classic long-term uptrend signal.",
            )
        if prev_diff >= 0 > curr_diff:
            return self._event(
                row, "SELL", "DEATH_CROSS", "STRONG",
                "Death cross: the 50-day average dropped below the 200-day average, "
                "a classic long-term downtrend signal.",
            )
        return None

    def _check_rsi_cross(self, prev, row) -> Optional[Dict[str, Any]]:
        """Detect RSI exits from oversold/overbought zones."""
        if pd.isna(prev.rsi) or pd.isna(row.rsi):
            return None

        if prev.rsi < RSI_OVERSOLD <= row.rsi:
            return self._event(
                row, "BUY", "RSI_RECOVERY", "MODERATE",
                f"RSI recovered above {RSI_OVERSOLD:.0f} after being oversold — "
                "selling pressure may be exhausted.",
            )
        if prev.rsi > RSI_OVERBOUGHT >= row.rsi:
            return self._event(
                row, "SELL", "RSI_REVERSAL", "MODERATE",
                f"RSI fell back below {RSI_OVERBOUGHT:.0f} after being overbought — "
                "buying momentum may be fading.",
            )
        return None

    @staticmethod
    def _event(row, signal_type: str, indicator: str, strength: str, reason: str) -> Dict[str, Any]:
        date = row.date
        return {
            "date": date.isoformat() if hasattr(date, "isoformat") else str(date),
            "type": signal_type,
            "price": round(float(row.close), 2),
            "indicator": indicator,
            "strength": strength,
            "reason": reason,
        }

    def current_outlook(
        self,
        df: pd.DataFrame,
        events: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Summarize the current technical stance from the latest indicator values.

        Returns a dict with stance (BULLISH/BEARISH/NEUTRAL), a plain-language
        summary, the latest indicator values, and the most recent signal event.
        """
        if df is None or df.empty:
            return {"stance": "NEUTRAL", "summary": "No price data available.", "last_signal": None}

        latest = df.iloc[-1]
        close = float(latest.get("close", 0))
        sma_50 = float(latest.get("sma_50", close))
        sma_200 = float(latest.get("sma_200", close))
        rsi = float(latest.get("rsi", 50))

        points = 0
        notes: List[str] = []

        if close > sma_50:
            points += 1
            notes.append("price is above its 50-day average")
        else:
            points -= 1
            notes.append("price is below its 50-day average")

        if close > sma_200:
            points += 1
            notes.append("above its 200-day average")
        else:
            points -= 1
            notes.append("below its 200-day average")

        if rsi >= RSI_OVERBOUGHT:
            points -= 1
            notes.append(f"RSI {rsi:.0f} is overbought")
        elif rsi <= RSI_OVERSOLD:
            points += 1
            notes.append(f"RSI {rsi:.0f} is oversold (potential rebound)")
        else:
            notes.append(f"RSI {rsi:.0f} is in the neutral zone")

        if points >= 2:
            stance = "BULLISH"
        elif points <= -2:
            stance = "BEARISH"
        else:
            stance = "NEUTRAL"

        last_signal = events[-1] if events else None
        date = latest.get("date")

        return {
            "stance": stance,
            "summary": f"Currently {stance.lower()}: " + ", ".join(notes) + ".",
            "as_of": date.isoformat() if hasattr(date, "isoformat") else (str(date) if date is not None else None),
            "indicators": {
                "price": round(close, 2),
                "sma_50": round(sma_50, 2),
                "sma_200": round(sma_200, 2),
                "rsi": round(rsi, 1),
            },
            "last_signal": last_signal,
        }


_trade_signal_service: Optional[TradeSignalService] = None


def get_trade_signal_service() -> TradeSignalService:
    """Get or create the trade signal service singleton."""
    global _trade_signal_service
    if _trade_signal_service is None:
        _trade_signal_service = TradeSignalService()
    return _trade_signal_service
