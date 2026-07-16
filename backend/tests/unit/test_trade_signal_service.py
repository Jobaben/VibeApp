"""Unit tests for the trade signal service."""
from datetime import date, timedelta

import pandas as pd
import pytest

from app.features.stocks.services.trade_signal_service import (
    TradeSignalService,
    SMA_WARMUP_ROWS,
)


def make_df(rows):
    """Build an indicator DataFrame from (close, sma_50, sma_200, rsi) tuples."""
    start = date(2025, 1, 1)
    return pd.DataFrame([
        {
            "date": start + timedelta(days=i),
            "close": close,
            "sma_50": sma_50,
            "sma_200": sma_200,
            "rsi": rsi,
        }
        for i, (close, sma_50, sma_200, rsi) in enumerate(rows)
    ])


def flat_rows(n, close=100.0, sma_50=95.0, sma_200=100.0, rsi=50.0):
    """n rows with no crossings (sma_50 below sma_200, RSI neutral)."""
    return [(close, sma_50, sma_200, rsi)] * n


@pytest.fixture
def service():
    return TradeSignalService()


class TestSmaCrossSignals:
    def test_golden_cross_emits_buy(self, service):
        rows = flat_rows(SMA_WARMUP_ROWS + 5)
        rows.append((110.0, 101.0, 100.0, 55.0))  # sma_50 crosses above sma_200
        events = service.compute_signals(make_df(rows))

        buys = [e for e in events if e["indicator"] == "GOLDEN_CROSS"]
        assert len(buys) == 1
        assert buys[0]["type"] == "BUY"
        assert buys[0]["strength"] == "STRONG"
        assert buys[0]["price"] == 110.0

    def test_death_cross_emits_sell(self, service):
        rows = flat_rows(SMA_WARMUP_ROWS + 5, sma_50=105.0)  # above
        rows.append((90.0, 99.0, 100.0, 45.0))  # crosses below
        events = service.compute_signals(make_df(rows))

        sells = [e for e in events if e["indicator"] == "DEATH_CROSS"]
        assert len(sells) == 1
        assert sells[0]["type"] == "SELL"

    def test_cross_during_warmup_is_ignored(self, service):
        # Crossing at row 10 — inside the warm-up window.
        rows = flat_rows(10)
        rows.append((110.0, 101.0, 100.0, 55.0))
        rows.extend(flat_rows(5, sma_50=101.0))
        events = service.compute_signals(make_df(rows))

        assert not [e for e in events if e["indicator"] == "GOLDEN_CROSS"]


class TestRsiSignals:
    def test_oversold_recovery_emits_buy(self, service):
        rows = flat_rows(3, rsi=25.0)
        rows.append((100.0, 95.0, 100.0, 35.0))  # RSI crosses back above 30
        events = service.compute_signals(make_df(rows))

        buys = [e for e in events if e["indicator"] == "RSI_RECOVERY"]
        assert len(buys) == 1
        assert buys[0]["type"] == "BUY"
        assert buys[0]["strength"] == "MODERATE"

    def test_overbought_reversal_emits_sell(self, service):
        rows = flat_rows(3, rsi=75.0)
        rows.append((100.0, 95.0, 100.0, 65.0))  # RSI drops back below 70
        events = service.compute_signals(make_df(rows))

        sells = [e for e in events if e["indicator"] == "RSI_REVERSAL"]
        assert len(sells) == 1
        assert sells[0]["type"] == "SELL"

    def test_rsi_inside_neutral_zone_emits_nothing(self, service):
        events = service.compute_signals(make_df(flat_rows(20)))
        assert events == []


class TestEdgeCases:
    def test_empty_dataframe(self, service):
        assert service.compute_signals(pd.DataFrame()) == []
        assert service.compute_signals(None) == []

    def test_events_are_chronological(self, service):
        rows = flat_rows(SMA_WARMUP_ROWS + 5)
        rows.append((110.0, 101.0, 100.0, 25.0))   # golden cross
        rows.append((111.0, 102.0, 100.0, 35.0))   # RSI recovery
        events = service.compute_signals(make_df(rows))

        dates = [e["date"] for e in events]
        assert dates == sorted(dates)
        assert len(events) == 2


class TestCurrentOutlook:
    def test_bullish_outlook(self, service):
        df = make_df([(110.0, 105.0, 100.0, 55.0)] * 3)
        outlook = service.current_outlook(df)
        assert outlook["stance"] == "BULLISH"
        assert outlook["indicators"]["price"] == 110.0

    def test_bearish_outlook(self, service):
        df = make_df([(90.0, 95.0, 100.0, 75.0)] * 3)
        outlook = service.current_outlook(df)
        assert outlook["stance"] == "BEARISH"

    def test_neutral_on_empty(self, service):
        outlook = service.current_outlook(pd.DataFrame())
        assert outlook["stance"] == "NEUTRAL"

    def test_last_signal_included(self, service):
        df = make_df([(110.0, 105.0, 100.0, 55.0)] * 3)
        events = [{"date": "2025-01-01", "type": "BUY"}]
        outlook = service.current_outlook(df, events)
        assert outlook["last_signal"]["type"] == "BUY"
