# AI Usage Guide - Avanza Stock Finder

This guide explains how to use the AI-accessible APIs and Python client library for programmatic stock analysis.

---

## 🎯 Overview

The Avanza Stock Finder backend provides AI-optimized endpoints designed for:
- **Batch analysis** of stocks based on criteria
- **Deep dive** analysis of individual stocks
- **Side-by-side comparison** of multiple stocks
- **Pre-built investment strategies** (Value Gems, Quality Compounders, etc.)
- **Custom screening** with dynamic expressions

All responses are structured for easy consumption by AI/LLMs with:
- Complete metrics in single payload
- Pre-calculated scores and signals
- Contextual data (sector averages, market context)
- AI-generated insights and recommendations

---

## 🚀 Quick Start

### 1. Start the Application

```bash
# From project root

# Start backend (Terminal 1)
./run_backend.sh

# Start frontend (Terminal 2)
./run_frontend.sh

# Or see QUICK_START.md for detailed setup instructions
```

### 2. Verify API is Running

```bash
# Test basic health
curl http://localhost:8000/health

# Test AI endpoints
curl http://localhost:8000/api/ai/health
```

### 3. Use the Python Client

```python
from app.ai_client import get_client

# Initialize client
client = get_client()

# Check health
health = client.health_check()
print(health)
```

---

## 📚 Python Client Library

### Installation

The client is already included in the backend. To use it:

```python
# From within the backend container or with backend in PYTHONPATH
from app.ai_client import AvanzaAIClient, get_client
```

### Basic Usage

#### Initialize Client

```python
from app.ai_client import get_client

# Default: http://localhost:8000
client = get_client()

# Custom URL
client = get_client(base_url="http://custom-host:8000")
```

#### Health Check

```python
health = client.health_check()
print(health)
# Output: {"status": "healthy", "service": "Backend API"}
```

---

## 🔍 Finding Stocks

### 1. Analyze Stocks by Criteria

Find stocks matching specific fundamental criteria:

```python
# Find undervalued quality stocks
criteria = {
    "min_roic": 15,      # Return on Invested Capital > 15%
    "max_pe": 20,        # P/E ratio < 20
    "max_debt_equity": 0.5  # Debt/Equity < 0.5
}

stocks = client.analyze_stocks(criteria, limit=50)
print(stocks.head())

# Output: DataFrame with columns:
# ticker, name, price, sector, signal, total_score,
# value_score, quality_score, momentum_score, health_score,
# pe_ratio, roic, roe, debt_equity, etc.
```

**Available Criteria:**
```python
{
    "min_pe": float,           # Minimum P/E ratio
    "max_pe": float,           # Maximum P/E ratio
    "min_roic": float,         # Min Return on Invested Capital (%)
    "min_roe": float,          # Min Return on Equity (%)
    "max_debt_equity": float,  # Max Debt/Equity ratio
    "min_fcf_yield": float,    # Min Free Cash Flow yield (%)
    "sectors": List[str],      # e.g., ["Industrials", "Technology"]
    "min_market_cap": float,   # Minimum market cap
    "max_market_cap": float,   # Maximum market cap
    "min_price": float,        # Minimum price
    "max_price": float,        # Maximum price
    "instrument_types": List[str]  # ["STOCK", "FUND", "ETF"]
}
```

### 2. Get Pre-Built Strategy Results

Use validated investment strategies with one command:

```python
# Value Gems: Low P/E + High ROIC + Low Debt
value_gems = client.get_top_stocks("value_gems", limit=20)
print(value_gems.head())

# Quality Compounders: High ROIC + High Margins
compounders = client.get_top_stocks("quality_compounders", limit=20)

# Dividend Kings: High yield + Stable history
dividends = client.get_top_stocks("dividend_kings", limit=20)

# Deep Value: P/B < 1.0 + Positive FCF
deep_value = client.get_top_stocks("deep_value", limit=20)

# Explosive Growth: Revenue growth >30% + Low PEG
growth = client.get_top_stocks("explosive_growth", limit=20)
```

**Available Strategies:**
- `value_gems` - Undervalued quality companies
- `quality_compounders` - Long-term wealth builders
- `dividend_kings` - Income + stability
- `deep_value` - Distressed turnarounds
- `explosive_growth` - Growth at reasonable price

### 3. Custom Screener with Expressions

Run complex queries with boolean expressions:

```python
# Advanced screening
results = client.run_custom_screener(
    "ROIC > 20 AND PE < 15 AND Sector = 'Technology'"
)
print(results)

# Complex example
results = client.run_custom_screener(
    "(ROIC > 15 AND PE < 20) OR (Dividend_Yield > 5 AND Debt_Equity < 0.3)"
)
```

---

## 📊 Analyzing Individual Stocks

### Deep Dive Analysis

Get comprehensive analysis of a single stock:

```python
# Complete analysis
volvo = client.deep_dive("VOLV-B")

# Access different parts
print(f"Overall Score: {volvo['stock']['scores']['total']}/100")
print(f"Signal: {volvo['stock']['signal']}")
print(f"P/E Ratio: {volvo['stock']['fundamentals']['pe_ratio']}")
print(f"ROIC: {volvo['stock']['fundamentals']['roic']}%")

# AI Insights
insights = volvo['stock']['ai_insights']
print("\nStrengths:")
for strength in insights['strengths']:
    print(f"  ✓ {strength}")

print("\nWeaknesses:")
for weakness in insights['weaknesses']:
    print(f"  ✗ {weakness}")

print("\nCatalysts to Watch:")
for catalyst in insights['catalyst_watch']:
    print(f"  ⚡ {catalyst}")

# Historical trends
print("\nROIC History:")
print(volvo['historical_trends']['roic_history'])

# Peer comparison
if volvo.get('peer_comparison'):
    print("\nPeer Comparison:")
    for peer in volvo['peer_comparison']:
        print(f"  {peer['ticker']}: Score {peer['scores']['total']}")
```

**Deep Dive Response Structure:**
```python
{
    "stock": {
        "ticker": str,
        "name": str,
        "price": float,
        "sector": str,
        "scores": {
            "total": int (0-100),
            "value": int (0-25),
            "quality": int (0-25),
            "momentum": int (0-25),
            "health": int (0-25)
        },
        "signal": str,  # "STRONG_BUY", "BUY", "HOLD", "SELL", "STRONG_SELL"
        "fundamentals": { ... },  # All metrics
        "vs_sector": { ... },     # Sector percentiles
        "technicals": { ... },    # Technical indicators
        "ai_insights": {
            "strengths": List[str],
            "weaknesses": List[str],
            "catalyst_watch": List[str]
        }
    },
    "historical_trends": {
        "roic_history": List[float],
        "margin_history": List[float],
        "debt_equity_history": List[float]
    },
    "peer_comparison": List[stock]
}
```

---

## 🤝 Comparing Stocks

### Side-by-Side Comparison

Compare multiple stocks directly:

```python
# Compare competitors
comparison = client.compare(["VOLV-B", "SCVB", "GETI-B"])

# View as DataFrame
print(comparison)

# Select specific columns
print(comparison[["ticker", "name", "total_score", "roic", "roe", "pe_ratio"]])

# Find best in each metric
print(f"Highest ROIC: {comparison.loc[comparison['roic'].idxmax()]['ticker']}")
print(f"Lowest P/E: {comparison.loc[comparison['pe_ratio'].idxmin()]['ticker']}")
print(f"Best Score: {comparison.loc[comparison['total_score'].idxmax()]['ticker']}")
```

### Sector Leaders

Find top stocks in a specific sector:

```python
# Get top 10 technology stocks
tech_leaders = client.get_sector_leaders("Technology", top_n=10)
print(tech_leaders)

# Get top 5 banks
banks = client.get_sector_leaders("Financials", top_n=5)
```

---

## 🎯 Common Use Cases

### Use Case 1: Find Undervalued Dividend Stocks Under 100 SEK

```python
criteria = {
    "max_price": 100,
    "min_dividend_yield": 4.0,
    "max_pe": 15,
    "max_debt_equity": 0.7
}

stocks = client.analyze_stocks(criteria, limit=20)
stocks_sorted = stocks.sort_values("total_score", ascending=False)

print("Top 5 Undervalued Dividend Stocks Under 100 SEK:")
print(stocks_sorted.head(5)[["ticker", "name", "price", "dividend_yield", "total_score"]])
```

### Use Case 2: Compare All Swedish Banks

```python
# Get all banks
banks_criteria = {"sectors": ["Financials"], "instrument_types": ["STOCK"]}
all_banks = client.analyze_stocks(banks_criteria, limit=100)

# Filter to only banks (if sector is too broad)
banks = all_banks[all_banks['name'].str.contains("Bank|SEB|Swedbank|Nordea", case=False)]

# Sort by score
banks_ranked = banks.sort_values("total_score", ascending=False)

print("Swedish Bank Rankings:")
print(banks_ranked[["ticker", "name", "total_score", "roe", "pe_ratio"]])
```

### Use Case 3: Portfolio Health Check

```python
# My portfolio
my_holdings = ["ERIC-B", "HM-B", "SEB-A", "VOLV-B"]

# Get comparison
portfolio = client.compare(my_holdings)

# Calculate portfolio stats
avg_score = portfolio['total_score'].mean()
min_score = portfolio['total_score'].min()
max_score = portfolio['total_score'].max()

print(f"Portfolio Average Score: {avg_score:.1f}/100")
print(f"\nHoldings Analysis:")
print(portfolio[["ticker", "name", "total_score", "signal", "roic", "debt_equity"]])

# Identify weak holdings
weak = portfolio[portfolio['total_score'] < 60]
if not weak.empty:
    print(f"\n⚠️ Weak Holdings (Score < 60):")
    print(weak[["ticker", "name", "total_score", "signal"]])

# Identify strong holdings
strong = portfolio[portfolio['total_score'] >= 85]
if not strong.empty:
    print(f"\n✅ Strong Holdings (Score >= 85):")
    print(strong[["ticker", "name", "total_score", "signal"]])
```

### Use Case 4: Find Best Opportunities Right Now

```python
# Get all pre-built strategies
strategies = ["value_gems", "quality_compounders", "explosive_growth"]

all_opportunities = []
for strategy in strategies:
    stocks = client.get_top_stocks(strategy, limit=10)
    if not stocks.empty:
        stocks['strategy'] = strategy
        all_opportunities.append(stocks)

# Combine and deduplicate
opportunities = pd.concat(all_opportunities).drop_duplicates(subset=['ticker'])

# Sort by total score
top_opportunities = opportunities.sort_values("total_score", ascending=False).head(20)

print("Top 20 Opportunities Across All Strategies:")
print(top_opportunities[["ticker", "name", "strategy", "total_score", "signal"]])
```

---

## 🌐 Direct API Usage (HTTP)

If you prefer to call the REST API directly:

### Analyze Stocks

```bash
curl -X POST "http://localhost:8000/api/ai/analyze-stocks?limit=50" \
  -H "Content-Type: application/json" \
  -d '{
    "criteria": {
      "min_roic": 15,
      "max_pe": 20,
      "max_debt_equity": 0.5
    }
  }'
```

### Deep Analysis

```bash
curl "http://localhost:8000/api/ai/stock/VOLV-B/deep-analysis"
```

### Compare Stocks

```bash
curl -X POST "http://localhost:8000/api/ai/compare-stocks" \
  -H "Content-Type: application/json" \
  -d '{
    "tickers": ["VOLV-B", "SCVB", "GETI-B"]
  }'
```

### Get Strategy Results

```bash
curl "http://localhost:8000/api/ai/strategies/value_gems?limit=20"
```

### Custom Screener

```bash
curl -X POST "http://localhost:8000/api/ai/run-custom-screener" \
  -d "expression=ROIC > 15 AND PE < 20"
```

---

## 🧪 Testing & Development

### Run Tests

```bash
# From backend directory with venv activated
cd backend
source venv/bin/activate
pytest

# With coverage
pytest --cov=app --cov-report=html
```

### Interactive Testing (Python REPL)

```bash
# From backend directory
cd backend
source venv/bin/activate
python

# In Python REPL
>>> from app.ai_client import get_client
>>> client = get_client()
>>> health = client.health_check()
>>> print(health)
```

### Jupyter Notebooks

Create a notebook for ad-hoc analysis:

```python
# notebooks/stock_analysis.ipynb

from app.ai_client import get_client
import pandas as pd
import matplotlib.pyplot as plt

client = get_client()

# Get value gems
gems = client.get_top_stocks("value_gems", limit=50)

# Plot score distribution
gems['total_score'].hist(bins=20)
plt.title("Score Distribution - Value Gems")
plt.xlabel("Total Score")
plt.ylabel("Count")
plt.show()

# Analyze by sector
sector_avg = gems.groupby('sector')['total_score'].mean().sort_values(ascending=False)
print(sector_avg)
```

---

## 📋 API Endpoint Reference

### AI Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/health` | GET | AI endpoints health check |
| `/api/ai/analyze-stocks` | POST | Batch stock analysis by criteria |
| `/api/ai/stock/{ticker}/deep-analysis` | GET | Deep dive on single stock |
| `/api/ai/compare-stocks` | POST | Compare multiple stocks |
| `/api/ai/strategies/{name}` | GET | Pre-built strategy results |
| `/api/ai/run-custom-screener` | POST | Custom screening with expressions |

### General Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Root endpoint with app info |
| `/health` | GET | Application health check |
| `/docs` | GET | Interactive API documentation (Swagger UI) |
| `/redoc` | GET | Alternative API documentation (ReDoc) |

---

## 🔧 Troubleshooting

### Issue: Client can't connect to API

```python
# Check if API is running
import requests
response = requests.get("http://localhost:8000/health")
print(response.json())

# If connection refused, make sure backend is running
# Check terminal where backend is running for errors
# Or restart: ./run_backend.sh
```

### Issue: Empty results from queries

```python
# This is expected during Phase 0 - endpoints are placeholders
# Actual data will be available after Phase 1 (Avanza integration)

# Check API status
client = get_client()
health = client.health_check()
print(health.get("message"))  # Will indicate if still in development
```

### Issue: Import errors

```bash
# Make sure you're in backend directory with venv activated
cd backend
source venv/bin/activate
python -c "from app.ai_client import get_client; print('OK')"

# Or set PYTHONPATH if running from elsewhere
export PYTHONPATH=/path/to/VibeApp/backend:$PYTHONPATH
```

---

## 📝 Next Steps

1. **Phase 1**: Avanza integration will populate real stock data
2. **Phase 2**: Screener implementation will enable actual filtering
3. **Phase 3**: Scoring engine will calculate real scores
4. **Phase 4**: Deep analysis will provide historical trends
5. **Phase 5**: Watchlists will enable tracking

For now, you can:
- Test the API structure
- Verify Docker setup works
- Experiment with the Python client
- Prepare analysis scripts

---

## 🆘 Support

- **Project Plan**: See `PROJECT_PLAN.md` for full architecture
- **API Docs**: Visit http://localhost:8000/docs when running
- **GitHub Issues**: Report bugs or request features
- **Code**: All code is in `/home/user/VibeApp/`

---

**Last Updated:** 2025-10-23
**Status:** Phase 0 - AI Infrastructure Complete
