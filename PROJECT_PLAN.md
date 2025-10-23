# Avanza Stock Finder - Complete Project Plan

**Project Start Date:** 2025-10-23
**Status:** Planning Complete - Ready for Implementation

---

## 🎯 Project Vision

### The Pivot
**From:** Social media app for sharing "vibes"
**To:** Intelligent stock discovery platform for Avanza Bank users

### Goal
Build an AI-augmented stock analysis platform that helps Swedish retail investors find promising stocks through data-driven analysis, screening tools, and AI-assisted insights.

### Target Users
Swedish retail investors using Avanza who want data-driven stock recommendations beyond basic search.

### Unique Value Proposition
**Human + AI Collaboration**
- Traditional web UI for visual exploration
- AI-assisted analysis for custom queries and deep insights
- Real-time scoring and signals based on quantitative fundamentals
- Pre-built investment strategies that work

---

## 📊 Core Investment Philosophy

**Problem:** Most retail investors lose money by:
- Buying overvalued hype stocks
- Ignoring fundamentals
- No clear buy/sell signals
- Poor timing (catching falling knives)

**Solution:** Find undervalued, high-quality stocks with momentum confirmation BEFORE the market catches on.

**Key Metrics Focus:**
- **Valuation:** P/E, EV/EBITDA, PEG, P/B, P/S
- **Profitability:** ROIC, ROE, Gross/Operating/Net Margins
- **Financial Health:** Debt/Equity, Current Ratio, FCF Yield, Interest Coverage
- **Momentum:** RSI, Moving Averages (50-day, 200-day), Price trends
- **Sector Context:** Cyclicality, macro correlation, sector comparisons

---

## 🏗️ Technical Architecture

### Tech Stack

#### Backend
- **FastAPI** - Modern async web framework
- **PostgreSQL 16** - Primary database
- **SQLAlchemy** - ORM
- **Celery + Redis** - Background jobs for data refresh
- **pandas** + **pandas-ta** - Technical indicators
- **avanza** Python package - Avanza API integration (unofficial)
- **scipy** - Statistical analysis
- **scikit-learn** - Future ML enhancements

#### Frontend
- **React 18 + TypeScript** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Charts and visualization
- **React Query** - Data fetching & caching
- **Zustand** - State management for watchlists
- **Axios** - HTTP client

#### DevOps
- **Docker + Docker Compose** - Containerization
- **Redis** - Caching layer
- **Python Black, Flake8, mypy** - Code quality

---

## 🗄️ Database Schema

### Tables

#### `stocks`
Master data for all tradeable instruments
```sql
- id (PK)
- ticker (unique)
- name
- isin
- instrument_type (STOCK, FUND, ETF, etc.)
- sector
- industry
- market_cap
- currency
- exchange
- last_updated
```

#### `stock_prices`
Historical price data
```sql
- id (PK)
- stock_id (FK)
- date
- open, high, low, close
- volume
- adjusted_close
```

#### `stock_fundamentals`
Fundamental metrics (refreshed regularly)
```sql
- id (PK)
- stock_id (FK)
- pe_ratio
- ev_ebitda
- peg_ratio
- pb_ratio
- ps_ratio
- roic
- roe
- gross_margin
- operating_margin
- net_margin
- debt_equity
- current_ratio
- fcf_yield
- interest_coverage
- updated_at
```

#### `stock_scores`
Pre-calculated scores for fast retrieval
```sql
- id (PK)
- stock_id (FK)
- total_score (0-100)
- value_score (0-25)
- quality_score (0-25)
- momentum_score (0-25)
- health_score (0-25)
- signal (STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL)
- calculated_at
```

#### `watchlists`
User watchlists (localStorage for MVP, DB for auth version)
```sql
- id (PK)
- user_id (FK, nullable for now)
- name
- created_at
```

#### `watchlist_items`
```sql
- id (PK)
- watchlist_id (FK)
- stock_id (FK)
- added_at
```

#### `sector_averages`
Cached sector benchmarks for comparison
```sql
- id (PK)
- sector
- avg_pe
- avg_roic
- avg_roe
- avg_debt_equity
- updated_at
```

---

## 🎯 Scoring Engine Design

### Multi-Factor Scoring System (0-100 total)

#### 1. Value Score (0-25 points)
- P/E ratio vs sector average (8 pts)
- EV/EBITDA vs sector (6 pts)
- PEG ratio (<1.0 = excellent, >2.0 = expensive) (6 pts)
- P/B ratio vs historical average (5 pts)

#### 2. Quality Score (0-25 points)
- ROIC percentile vs all stocks (10 pts)
- ROE vs sector average (7 pts)
- Net margin stability & trend (5 pts)
- Free cash flow consistency (3 pts)

#### 3. Momentum Score (0-25 points)
- Price vs 50-day MA (7 pts)
- Price vs 200-day MA (7 pts)
- RSI (40-60 optimal, penalize extremes) (6 pts)
- Volume trend (increasing = positive) (5 pts)

#### 4. Financial Health Score (0-25 points)
- Debt/Equity ratio (<0.5 = excellent) (10 pts)
- Current ratio (>2.0 = healthy) (6 pts)
- Interest coverage (>5x = safe) (5 pts)
- FCF yield (>5% = excellent) (4 pts)

### Signal Classification
- **90-100:** 🟢 **Strong Buy** (All systems go)
- **75-89:** 🟢 **Buy** (Good opportunity)
- **50-74:** 🟡 **Hold** (Neutral)
- **25-49:** 🔴 **Sell** (Warning signs)
- **0-24:** 🔴 **Strong Sell** (Avoid)

---

## 🚀 Implementation Phases

### Phase 0: AI Infrastructure ⚡ (Week 1 - CRITICAL)

**Goal:** Enable AI to use the app for analysis

#### Backend Components
1. **AI-Specific API Endpoints**
   - `POST /api/ai/analyze-stocks` - Batch analysis with criteria
   - `GET /api/ai/stock/{ticker}/deep-analysis` - Complete stock analysis
   - `POST /api/ai/compare-stocks` - Side-by-side comparison
   - `GET /api/ai/strategies/{name}` - Pre-built strategy results
   - `POST /api/ai/run-custom-screener` - Dynamic query execution

2. **Python AI Client Library**
   ```python
   # backend/app/ai_client/client.py
   class AvanzaAIClient:
       def analyze_stocks(criteria: dict) -> pd.DataFrame
       def get_top_stocks(strategy: str) -> pd.DataFrame
       def deep_dive(ticker: str) -> dict
       def compare(tickers: List[str]) -> pd.DataFrame
   ```

3. **Response Format Optimization**
   - Structured JSON with clear schemas
   - Include `ai_insights` field with strengths/weaknesses
   - Pre-calculate sector comparisons
   - Include market context metadata

4. **Docker Configuration**
   ```yaml
   services:
     backend:
       ports: ["8000:8000"]
       environment:
         - ENABLE_AI_ENDPOINTS=true
     frontend:
       ports: ["3000:3000"]
     db:
       ports: ["5432:5432"]  # Direct access for AI
     redis:
       ports: ["6379:6379"]
   ```

5. **Documentation**
   - Create `AI_USAGE.md` with examples
   - API schema documentation
   - Jupyter notebooks for ad-hoc analysis

**Deliverable:** AI can run `docker-compose up`, query APIs, perform analysis

---

### Phase 1: Data Foundation (Week 1-2)

**Goal:** Get real Avanza data flowing into the system

#### Tasks
1. Research and integrate Avanza API
   - Use `avanza` Python package (unofficial)
   - Fetch stocks, funds, ETFs, certificates
   - Handle authentication & rate limiting

2. Remove old "Vibes" feature code
   - Delete `/backend/app/features/vibes/`
   - Delete `/frontend/src/components/VibeCard.tsx`, etc.
   - Clean up unused dependencies

3. Create database schema
   - Implement all tables (stocks, prices, fundamentals, scores)
   - Set up Alembic migrations
   - Add indexes for performance

4. Build Avanza integration service
   - `features/integrations/avanza/client.py`
   - Data fetching & transformation
   - Error handling & retries

5. Implement stock CRUD operations
   - `features/stocks/` - models, commands, queries, router
   - Basic endpoints: GET, LIST, SEARCH
   - Repository pattern for data access

6. Build basic frontend
   - Stock search page
   - Stock list view
   - Simple stock card component

**Deliverable:** Can browse and search all Avanza instruments with basic info

---

### Phase 2: Smart Screener + Pre-Built Strategies 💎 (Week 2-3)

**Goal:** Users find opportunities in 30 seconds (not 3 hours)

#### A) Advanced Screener
- Custom filters for all metrics
- Multi-criteria support
- Sorting and ranking
- Export to CSV

#### B) Pre-Built Strategy Screens
1. **"Value Gems"** 💎
   - Low P/E (<15) + High ROIC (>15%) + Low Debt (<0.5 D/E)
   - Target: Undervalued quality companies

2. **"Quality Compounders"** 🚀
   - High ROIC (>20%) + High margins (>15%) + Growing revenue
   - Target: Long-term wealth builders

3. **"Dividend Kings"** 👑
   - Dividend yield >4% + Payout ratio <70% + 5yr dividend history
   - Target: Income + stability

4. **"Deep Value"** 🔍
   - P/B <1.0 + Positive FCF + Not overleveraged
   - Target: Distressed turnarounds

5. **"Explosive Growth"** ⚡
   - Revenue growth >30% + Improving margins + Low PEG (<1.5)
   - Target: Growth at reasonable price

#### Frontend Components
- Strategy selection page with big buttons
- Results table (sortable, filterable)
- Color-coded signals
- Quick-add to watchlist

**Deliverable:** One-click access to validated investment strategies

---

### Phase 3: Scoring Engine + Clear Signals 🎯 (Week 3-4)

**Goal:** Users know WHAT to buy and WHY

#### Components
1. **Scoring Algorithm Implementation**
   - Implement 4-factor scoring (Value, Quality, Momentum, Health)
   - Calculate percentiles vs sector
   - Historical trend analysis
   - Cache scores for performance

2. **Signal Generation**
   - Map scores to Buy/Hold/Sell signals
   - Confidence levels
   - Risk indicators

3. **Leaderboard Pages**
   - Top 20 scoring stocks (homepage)
   - "Rising Stars" (biggest score improvements)
   - "Falling Angels" (deteriorating scores)
   - Sector leaderboards

4. **Transparent Scoring Display**
   - Visual breakdown (radar chart, bar chart)
   - "Why this score?" explanations
   - Strengths and weaknesses
   - Improvement suggestions

**Deliverable:** Clear algorithmic buy/sell signals with full transparency

---

### Phase 4: Deep Analysis Pages 📊 (Week 4-5)

**Goal:** Users can research and validate before buying

#### Individual Stock Pages
1. **Overview Section**
   - Current price, change, volume
   - Overall score + breakdown
   - Buy/Hold/Sell signal
   - Key metrics table

2. **Charts** (Recharts)
   - Price chart with MA overlays (50-day, 200-day)
   - Volume chart
   - RSI indicator
   - Fundamental trend charts (ROIC, margins, debt/equity over time)

3. **Fundamental Analysis**
   - Detailed metrics table
   - Sector comparison (percentile rankings)
   - Historical trends (improving/deteriorating)
   - Peer comparison

4. **AI Insights Section**
   - Strengths (what scores well)
   - Weaknesses (what drags down score)
   - Catalysts to watch
   - Risk factors
   - "What needs to happen for higher score"

**Deliverable:** Comprehensive stock analysis pages

---

### Phase 5: Watchlists + Engagement 📌 (Week 5)

**Goal:** Users come back regularly

#### Features
1. **Watchlist Management**
   - Create/delete watchlists
   - Add/remove stocks
   - localStorage (no auth for MVP)
   - Track score changes
   - Visual alerts for significant changes

2. **"What Changed This Week"**
   - Biggest score movers
   - New entries to top 20
   - Sector rotation analysis
   - Earnings calendar integration

3. **Portfolio Tracker** (optional)
   - Enter holdings manually
   - Portfolio total score
   - Diversification analysis
   - Rebalancing suggestions
   - Performance tracking

**Deliverable:** User retention features

---

### Phase 6: Polish + Deploy 🚀 (Week 5-6)

#### Tasks
1. **Background Jobs**
   - Celery workers for data refresh
   - Schedule: Every hour during market hours
   - Error handling & monitoring
   - Job queue dashboard

2. **Performance Optimization**
   - Redis caching layer
   - Database query optimization
   - API response compression
   - Frontend code splitting

3. **Production Setup**
   - Environment configuration
   - Logging & monitoring
   - Error tracking (Sentry)
   - Health checks
   - Database backups

4. **Polish**
   - Responsive design (mobile-friendly)
   - Loading states & skeletons
   - Error messages
   - SEO optimization
   - Accessibility

5. **Documentation**
   - User guide
   - API documentation
   - Deployment guide
   - Contributing guide

**Deliverable:** Production-ready application

---

## 🤝 AI-Assisted Analysis Patterns

### Pattern 1: Direct Questions
```
User: "What are the best dividend stocks under 100 SEK right now?"

AI Process:
1. Parse criteria: dividend_yield > 4%, price < 100 SEK
2. Call: client.analyze_stocks(criteria)
3. Get structured data
4. Analyze and rank results
5. Present top 5 with reasoning

AI Response:
"I found 12 high-dividend stocks under 100 SEK. Here are the top 5:

1. **SCA B** (67 SEK) - Score: 82/100
   - Dividend Yield: 5.2%
   - ROIC: 14.5%, ROE: 18.2%
   - Why it's good: Undervalued (P/E 9.1), consistent history, strong FCF
   - Risk: Commodity exposure
..."
```

### Pattern 2: Comparative Analysis
```
User: "Should I buy Volvo or Scania?"

AI Process:
1. Call: client.compare(["VOLV-B", "SCVB"])
2. Get side-by-side metrics
3. Calculate winners in each category
4. Form recommendation

AI Response:
"Here's a detailed comparison: [TABLE]
**Verdict:** Volvo is the better value play - cheaper valuation, higher ROIC.
**Recommendation:** Growth → Volvo. Income → Scania."
```

### Pattern 3: Portfolio Review
```
User: "I own ERIC-B, HM-B, and SEB-A. How's my portfolio?"

AI Process:
1. Call deep_dive on each ticker
2. Aggregate portfolio metrics
3. Identify risks and opportunities
4. Generate diversification analysis

AI Response:
"Portfolio Score: 68/100 (Moderate)
⚠️ HM-B dragging down (45/100) - struggling margins
✅ SEB-A is excellent (87/100) - top quartile bank
💡 Suggestions: Exit HM-B, diversify into industrials"
```

---

## 📊 Success Metrics

### User Experience
- ✅ User can find a stock to buy in <2 minutes
- ✅ Scoring system outperforms market (backtest)
- ✅ Top 20 scored stocks beat index (3m, 6m, 1y)
- ✅ Users return weekly (watchlist engagement)

### AI Integration
- ✅ AI can run app locally (`docker-compose up`)
- ✅ AI can query stocks programmatically
- ✅ AI provides data-driven insights (<2s response)
- ✅ Users prefer AI-assisted analysis

### Technical
- ✅ API response time <500ms (p95)
- ✅ Data refresh completes in <5 minutes
- ✅ Frontend loads in <2s
- ✅ 99.9% uptime

---

## 🎯 Killer Differentiator

### "Ask Claude About Stocks"

**Feature:** AI chat interface in the app

```tsx
<ChatWithClaude>
  <ChatInput
    placeholder="Ask me: 'What are undervalued tech stocks?' or 'Should I buy Volvo?'"
  />
</ChatWithClaude>
```

**Why it's unique:** No other Avanza tool has AI-assisted analysis. Users get:
- Custom queries beyond pre-built screens
- Natural language interaction
- Explanations and reasoning
- Comparative analysis on demand
- Portfolio reviews

---

## 📋 Key Requirements Summary

### From Stakeholder
1. ✅ **No authentication** - Anyone can use it
2. ✅ **All Avanza instruments** - Stocks, funds, ETFs, etc.
3. ✅ **Economics-focused metrics:**
   - Valuation: P/E, EV/EBITDA, PEG
   - Profitability: ROIC, ROE, Margins
   - Financial Health: Debt/Equity, FCF Yield
   - Momentum: RSI, Moving Averages
   - Sector Context: Comparisons, cyclicality
4. ✅ **Delayed data** - No need for real-time quotes
5. ✅ **AI-accessible** - Backend must support AI usage
6. ✅ **Focus on making users rich faster** - Prioritize features with highest ROI

---

## ⏱️ Timeline

**Total Estimated Timeline:** 5-6 weeks

- **Phase 0 (AI Infrastructure):** 3-4 days
- **Phase 1 (Data Foundation):** 1 week
- **Phase 2 (Screener + Strategies):** 1 week
- **Phase 3 (Scoring Engine):** 1 week
- **Phase 4 (Analysis Pages):** 1 week
- **Phase 5 (Watchlists):** 3-4 days
- **Phase 6 (Polish + Deploy):** 1 week

---

## 🚦 Current Status

**Status:** Planning Complete
**Next Step:** Begin Phase 0 (AI Infrastructure)
**Started:** 2025-10-23

---

## 📝 Notes

- Keep existing FastAPI/React architecture (it's solid)
- Use feature-based vertical slice architecture (proven pattern)
- Prioritize AI accessibility from day one
- Focus on economic fundamentals (not hype/sentiment)
- Build for "make users rich faster" not just features

---

## 🔗 Key References

- **Avanza Python Package:** https://github.com/Qluxzz/avanza (unofficial)
- **pandas-ta Documentation:** https://github.com/twopirllc/pandas-ta
- **Current Codebase:** `/home/user/VibeApp/`
- **Branch:** `claude/initial-app-exploration-011CUQZroe3Vr5TkSWkW4Z98`

---

**Last Updated:** 2025-10-23
**Document Owner:** Claude (AI) + Stakeholder
