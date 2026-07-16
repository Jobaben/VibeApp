# Stock Data API Configuration

## Overview

The Avanza Stock Finder supports two modes for fetching stock data:

1. **Yahoo Finance Mode** (Default) - Fetches live market data, with automatic fallback to mock data
2. **Mock Data Mode** - Uses realistic, curated stock data only

## How the Default Works

By default the app tries to fetch **real data from Yahoo Finance** (quotes via the
public quote API, historical prices via `yfinance`). If a request is blocked,
rate-limited, or the machine is offline, the app **automatically falls back to
mock data** for that request — the UI keeps working either way.

Real data powers:

- Stock quotes and fundamentals used for import and scoring
- Historical OHLCV prices behind the price/RSI/volume charts
- Technical indicators (SMA-50/200, RSI-14, volume trend), the momentum score,
  and the buy/sell trade signals drawn on the charts

## Configuration

### Default (Real Data with Fallback)

No configuration needed:

```bash
# Default behavior - tries Yahoo Finance, falls back to mock data on failure
./run_backend.sh
```

### Mock-Only Mode (CI, Offline, Deterministic Tests)

To skip the network entirely and always use mock data:

**Option 1: Environment Variable**
```bash
export USE_REAL_STOCK_API=false
./run_backend.sh
```

**Option 2: .env File**
```bash
# backend/.env
USE_REAL_STOCK_API=false
```

### Force Mock Data (Testing)

To always use mock data regardless of `USE_REAL_STOCK_API`:

```bash
FORCE_MOCK_DATA=true ./run_backend.sh
```

CI runs with `USE_REAL_STOCK_API=false` and `FORCE_MOCK_DATA=true` so tests are
deterministic and never hit the network.

## Why Keep Mock Data?

Yahoo Finance sometimes blocks automated requests with 403 Forbidden errors,
especially from CI pipelines and containers. Mock data provides:

- ✅ **Reliability** - Always works, no rate limiting
- ✅ **Speed** - Instant responses
- ✅ **Consistency** - Same data across environments
- ✅ **Realistic** - 15 major stocks with accurate information

## Mock Stock Data

The app includes 15 realistic stocks:

### Technology
- Apple Inc. (AAPL) - $2.8T market cap
- Microsoft Corporation (MSFT) - $2.6T
- Alphabet Inc. (GOOGL) - $1.7T
- Amazon.com Inc. (AMZN) - $1.5T
- NVIDIA Corporation (NVDA) - $1.2T
- Tesla Inc. (TSLA) - $800B
- Intel Corporation (INTC) - $180B
- Cisco Systems Inc. (CSCO) - $210B

### Communication Services
- Meta Platforms Inc. (META) - $900B
- The Walt Disney Company (DIS) - $200B
- Netflix Inc. (NFLX) - $250B

### Financial Services
- JPMorgan Chase & Co. (JPM) - $500B
- Visa Inc. (V) - $520B

### Consumer & Healthcare
- Walmart Inc. (WMT) - $420B
- Pfizer Inc. (PFE) - $160B

Each stock includes:
- Accurate sector and industry classification
- Realistic market capitalization
- Proper exchange information
- Currency (USD)

Mock **historical prices** are generated with seeded geometric Brownian motion,
so a given ticker always produces the same chart (and therefore the same
indicators and trade signals) across restarts.

## For Production

For heavier production use, consider these paid API services:

| Service | Free Tier | Pricing | Reliability |
|---------|-----------|---------|-------------|
| [Alpha Vantage](https://www.alphavantage.co/) | 5 calls/min | Free & Paid | Good |
| [Financial Modeling Prep](https://financialmodelingprep.com/) | 250 calls/day | $15/month | Excellent |
| [IEX Cloud](https://iexcloud.io/) | 50K messages/month | $9/month | Excellent |
| [Twelve Data](https://twelvedata.com/) | 800 calls/day | Free & Paid | Good |

## Troubleshooting

### Yahoo Finance Returns 403 Error

This happens for automated requests. The app automatically falls back to mock
data for that request; nothing breaks. Retrying later usually works.

### All Stocks Show Same Data

You're likely seeing mock data (either `USE_REAL_STOCK_API=false` or every
Yahoo request is being blocked). Check the backend logs — each fallback is
logged with a warning.

## Technical Details

The stock data mode is controlled by:

**File:** `backend/app/config.py`
```python
USE_REAL_STOCK_API: bool = True   # Default: real data with mock fallback
FORCE_MOCK_DATA: bool = False     # Override to always use mock
```

**Implementation:**
- `backend/app/features/integrations/yahoo_finance_client.py` (quotes/fundamentals)
- `backend/app/features/stocks/services/price_data_service.py` (historical prices)

Both check configuration and:
1. If `FORCE_MOCK_DATA=true` → Use mock data
2. If `USE_REAL_STOCK_API=false` → Use mock data
3. If `USE_REAL_STOCK_API=true` (default) → Try Yahoo Finance, fall back to mock on error
