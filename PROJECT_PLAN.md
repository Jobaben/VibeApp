# Avanza Stock Finder - Complete Project Plan

**Project Start Date:** 2025-10-23
**Status:** ✅ Phase 3 COMPLETE - Scoring Engine + Clear Signals
**Last Updated:** 2025-10-25
**Current Branch:** `claude/review-project-plan-011CUTuwwgxz44pypSWg5PTs`

---

## 📍 CURRENT STATUS & NEXT STEPS

### ✅ Completed (Phase 3 - COMPLETE)

#### Backend (100%)
- ✅ Multi-factor scoring algorithm (0-100 points)
  - Value Score (0-25): P/E, EV/EBITDA, PEG, P/B vs sector
  - Quality Score (0-25): ROIC percentile, ROE, margins, FCF
  - Momentum Score (0-25): Defaults to neutral (Phase 4 implementation)
  - Health Score (0-25): Debt/Equity, current ratio, interest coverage, FCF yield
- ✅ Sector benchmark calculation and caching
- ✅ Signal classification (STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL)
- ✅ Detailed scoring explanations (strengths, weaknesses, reasoning)
- ✅ Edge case handling (missing data, negative values, outliers, sector adjustments)
- ✅ 5 new API endpoints:
  - POST /api/stocks/scores/calculate
  - GET /api/stocks/{ticker}/score-breakdown
  - GET /api/stocks/leaderboard/top
  - GET /api/stocks/leaderboard/by-signal/{signal}
  - GET /api/stocks/leaderboard/sectors
- ✅ Updated seed script with automatic scoring
- ✅ Comprehensive testing and validation (15 stocks scored)

#### Documentation (100%)
- ✅ SCORING_METHODOLOGY.md - Complete scoring methodology with financial rationale
- ✅ PHASE_3_TEST_REPORT.md - Comprehensive test results and validation
- ✅ DISCLAIMERS.md - Financial disclaimers and responsible use guidelines
- ✅ Code documentation with detailed docstrings
- ✅ API endpoint documentation

#### Testing (100%)
- ✅ All scoring components validated against real stocks
- ✅ Quality stocks score high (MSFT: 60.5, META: 69.5)
- ✅ Growth stocks penalized on value (NVDA: 3.0/25 value score)
- ✅ Value stocks score high on value (CSCO: 19.0/25, JPM: 21.0/25)
- ✅ Troubled stocks correctly identified (DIS: 35.5, INTC quality: 4.0/25)
- ✅ Edge cases handled properly (missing data, negatives, outliers)
- ✅ Sector benchmarks calculated for 6 sectors
- ✅ Performance: <1s for 15 stocks, <100ms API responses

### ✅ Completed (Phase 2 - COMPLETE)

#### Backend (100%)
- ✅ Enhanced mock data with comprehensive fundamentals (15 stocks)
  - Valuation metrics: P/E, PEG, P/B, EV/EBITDA, P/S
  - Profitability metrics: ROIC, ROE, gross/operating/net margins
  - Financial health: Debt/Equity, current ratio, FCF yield, interest coverage
  - Growth metrics: Revenue & earnings growth
  - Dividend metrics: Yield, payout ratio
- ✅ Screener service with multi-criteria filtering
- ✅ 5 pre-built investment strategies:
  - 💎 Value Gems (Low P/E + High ROIC + Low Debt)
  - 🚀 Quality Compounders (High ROIC + High Margins + Growing)
  - 👑 Dividend Kings (High Yield + Sustainable Payout)
  - 🔍 Deep Value (Low P/B + Positive FCF + Not Overleveraged)
  - ⚡ Explosive Growth (High Revenue Growth + Low PEG)
- ✅ Automatic strength/weakness analysis for stocks
- ✅ 6 new API endpoints (1 custom + 5 strategies)
- ✅ Updated seed script to populate fundamentals + scores
- ✅ Comprehensive API documentation

#### Frontend (100%)
- ✅ StrategySelector component with beautiful card grid
- ✅ ScreenerResults component with sortable table
- ✅ Expandable rows showing strengths, weaknesses, key metrics
- ✅ Color-coded buy/sell signals
- ✅ Navigation tab for Strategy Screener
- ✅ TypeScript types for all screener functionality
- ✅ API service methods for all strategies
- ✅ Modern dark theme with glassmorphism
- ✅ Responsive design with smooth transitions

#### Testing (100%)
- ✅ Backend API fully tested - all strategies working
- ✅ Database seeded with realistic fundamentals
- ✅ All 5 strategies validated with correct filtering
- ✅ Strength/weakness analysis verified
- ✅ Performance validated (<15ms average response)
- ✅ Test report created (PHASE_2_TEST_REPORT.md)

### ✅ Completed (Phase 1 - COMPLETE)

#### Backend (100%)
- ✅ Database schema with Alembic migrations
- ✅ Stock CRUD API endpoints (GET, LIST, SEARCH, IMPORT, DELETE)
- ✅ Yahoo Finance integration with smart mode detection
- ✅ Enhanced mock data (15 realistic stocks)
- ✅ Repository pattern for data access
- ✅ Pydantic schemas with UUID support
- ✅ Configuration system (mock for AI, real for humans)
- ✅ Seed data script for testing

#### Frontend (100%)
- ✅ StockList component with pagination
- ✅ StockCard component for individual stock display
- ✅ StockSearch component with debounced search (300ms)
- ✅ SectorFilter component for filtering by sector
- ✅ TypeScript type definitions for Stock models
- ✅ API integration with all stock endpoints
- ✅ Loading states and error handling
- ✅ Responsive design with Tailwind CSS
- ✅ End-to-end testing completed

### 📋 Phase 1 Deliverables ✅
- ✅ Frontend components (React + TypeScript)
- ✅ Full API integration
- ✅ Search and filtering functionality
- ✅ Pagination support
- ⏳ Unit tests for stock CRUD operations (deferred to later)
- ⏳ Integration tests for API endpoints (deferred to later)
- ✅ Documentation updates (PHASE_1_COMPLETION_SUMMARY.md)

### 📋 Phase 2 Deliverables ✅
- ✅ Enhanced mock data with comprehensive fundamentals (15 stocks)
- ✅ Screener service with 5 pre-built strategies
- ✅ Automatic strength/weakness analysis
- ✅ 6 new API endpoints (custom screener + 5 strategies)
- ✅ StrategySelector component with beautiful card UI
- ✅ ScreenerResults component with sortable table & expandable rows
- ✅ Navigation integration in main app
- ✅ TypeScript types for screener functionality
- ✅ Backend testing complete - all strategies validated
- ✅ Test report (PHASE_2_TEST_REPORT.md)

### 📂 Key Files from Phase 3
**Backend:**
- **Scoring Service**: `/backend/app/features/stocks/services/scoring_service.py`
- **Sector Service**: `/backend/app/features/stocks/services/sector_service.py`
- **API Router**: `/backend/app/features/stocks/router.py` (5 new scoring endpoints)
- **Database Models**: `/backend/app/features/stocks/models/__init__.py` (StockScore, SectorAverage)
- **Seed Script**: `/backend/seed_data.py` (updated with automatic scoring)
- **Validation Script**: `/backend/validate_scores.py`

**Documentation:**
- **Scoring Methodology**: `/backend/SCORING_METHODOLOGY.md`
- **Test Report**: `/PHASE_3_TEST_REPORT.md`
- **Disclaimers**: `/DISCLAIMERS.md`

### 📂 Key Files from Phase 2
**Backend:**
- **Screener Service**: `/backend/app/features/stocks/services/screener_service.py`
- **Enhanced Mock Data**: `/backend/app/features/integrations/mock_stock_data.py`
- **API Router**: `/backend/app/features/stocks/router.py` (6 screener endpoints)
- **Schemas**: `/backend/app/features/stocks/schemas/__init__.py`
- **Seed Script**: `/backend/seed_data.py`

**Frontend:**
- **Strategy Selector**: `/frontend/src/components/StrategySelector.tsx`
- **Results Table**: `/frontend/src/components/ScreenerResults.tsx`
- **Screener Page**: `/frontend/src/pages/Screener.tsx`
- **App Navigation**: `/frontend/src/App.tsx`
- **Types**: `/frontend/src/types/stock.ts`
- **API Service**: `/frontend/src/services/api.ts`

**Documentation:**
- **Test Report**: `/PHASE_2_TEST_REPORT.md`

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
- **PostgreSQL 16** - Primary database (SQLite for development)
- **SQLAlchemy** - ORM with UUID primary keys
- **Alembic** - Database migrations
- **Celery + Redis** - Background jobs for data refresh (Phase 6)
- **pandas** + **pandas-ta** - Technical indicators (Phase 3)
- **Yahoo Finance API** - Stock data (with smart mode detection)
  - Mock data mode (default for AI/automated use)
  - Live data mode (optional for human users)
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

### Phase 1: Data Foundation (Week 1-2) - ✅ Backend Complete, 🚧 Frontend In Progress

**Goal:** Get stock data flowing and build basic browsing capabilities

#### ✅ Completed Backend Tasks
1. ✅ **Data Integration**
   - Integrated Yahoo Finance API with smart mode detection
   - Created enhanced mock data provider (15 realistic stocks)
   - Implemented configuration system:
     - `USE_REAL_STOCK_API=false` (default for AI/automated)
     - `USE_REAL_STOCK_API=true` (optional for human users)
   - Automatic fallback to mock data on API blocks

2. ✅ **Code Cleanup**
   - Removed old "Vibes" code references
   - Cleaned up VibeRepository imports
   - Updated docstrings and package names

3. ✅ **Database Schema**
   - Created all tables with SQLAlchemy models:
     - `stocks` - Master data (ticker, name, sector, industry, market cap)
     - `stock_prices` - Historical OHLCV data
     - `stock_fundamentals` - Financial metrics
     - `stock_scores` - Pre-calculated scores
     - `sector_averages` - Sector benchmarks
     - `watchlists` & `watchlist_items` - User watchlists
   - Set up Alembic migrations framework
   - Added proper indexes for performance
   - Used UUID primary keys

4. ✅ **Stock Data Services**
   - `features/integrations/yahoo_finance_client.py` - Yahoo Finance integration
   - `features/integrations/mock_stock_data.py` - Enhanced mock data
   - Error handling with automatic fallback
   - Rate limiting for API requests

5. ✅ **Stock CRUD Operations**
   - Repository pattern: `StockRepository` with comprehensive methods
   - API Router with endpoints:
     - `GET /api/stocks/` - List with pagination & filtering
     - `GET /api/stocks/search?q=query` - Search by ticker/name
     - `GET /api/stocks/{ticker}` - Get stock details
     - `GET /api/stocks/top` - Top-scored stocks
     - `GET /api/stocks/sectors` - List all sectors
     - `POST /api/stocks/import` - Import from Yahoo Finance
     - `DELETE /api/stocks/{ticker}` - Soft delete
   - Pydantic schemas for validation
   - Full UUID support in responses

6. ✅ **Testing & Documentation**
   - Seed data script (`seed_data.py`)
   - Stock data configuration guide (`STOCK_DATA_CONFIG.md`)
   - Updated `.env.example` with clear instructions
   - Tested all endpoints successfully

#### 🚧 Pending Frontend Tasks
**👉 START HERE IN NEXT SESSION:**

1. **Create React Components**
   - `StockList.tsx` - Grid/list view with pagination
   - `StockCard.tsx` - Individual stock display
   - `StockSearch.tsx` - Search input with autocomplete
   - `StockDetail.tsx` - Detailed stock page
   - `SectorFilter.tsx` - Filter by sector dropdown

2. **Connect to Backend API**
   - Update `/frontend/src/services/api.ts` with stock endpoints
   - Use React Query for data fetching and caching
   - Implement pagination logic
   - Add search debouncing

3. **Build Basic UI**
   - Stock listing page (main view)
   - Search functionality
   - Sector filtering
   - Loading states & error handling
   - Responsive design with Tailwind CSS

4. **Testing**
   - Test stock browsing end-to-end
   - Verify pagination works
   - Test search functionality
   - Check responsive design

**Deliverable:** Can browse and search stocks with basic info through React UI

#### 📊 Current Data Available
- **15 Mock Stocks** with complete information:
  - Technology: Apple, Microsoft, Google, Amazon, Tesla, Meta, NVIDIA, Intel, Cisco
  - Communication: Disney, Netflix
  - Financial: JPMorgan, Visa
  - Consumer: Walmart
  - Healthcare: Pfizer
- Each includes: sector, industry, market cap, exchange, currency

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

**Status:** ✅ Phase 3 COMPLETE - Scoring Engine + Clear Signals
**Next Step:** Begin Phase 4 - Deep Analysis Pages (Historical Price Data, Momentum Scoring, Charts)
**Started:** 2025-10-23
**Completed Phase 1:** 2025-10-24
**Completed Phase 2:** 2025-10-25
**Completed Phase 3:** 2025-10-25
**Current Branch:** `claude/review-project-plan-011CUTuwwgxz44pypSWg5PTs`

### Implementation Progress
- ✅ **Phase 0**: AI Infrastructure - Complete
- ✅ **Phase 1**: Data Foundation - **100% COMPLETE**
  - ✅ Backend (100%): Database, API, Yahoo Finance integration
  - ✅ Frontend (100%): React components, search, filtering, pagination
- ✅ **Phase 2**: Smart Screener - **100% COMPLETE**
  - ✅ Backend (100%): Screener service, 5 strategies, strength/weakness analysis
  - ✅ Frontend (100%): StrategySelector, ScreenerResults, navigation
  - ✅ Testing (100%): All strategies validated, test report created
- ✅ **Phase 3**: Scoring Engine - **100% COMPLETE**
  - ✅ Backend (100%): 4-factor scoring algorithm, sector benchmarks, signal classification
  - ✅ API (100%): 5 new endpoints for scores and leaderboards
  - ✅ Testing (100%): Validated against 15 stocks, all edge cases handled
  - ✅ Documentation (100%): Methodology, test report, disclaimers
  - ⏳ Frontend (0%): Leaderboard components, scoring visualizations (deferred to Phase 4)
- ⏳ **Phase 4**: Deep Analysis - Ready to Start
- ⏳ **Phase 5**: Watchlists - Not Started
- ⏳ **Phase 6**: Polish & Deploy - Not Started

### 🎯 Next Session Goals (Phase 4)
1. Fetch and store historical price data
2. Implement technical indicators (RSI, moving averages, volume trends)
3. Complete Momentum Score calculation (replacing neutral default)
4. Create individual stock detail pages
5. Build interactive charts (price, volume, RSI, fundamentals over time)
6. Add AI insights section to stock pages
7. Implement peer comparison visualization
8. Build frontend for leaderboards and scoring breakdowns

---

## 📝 Implementation Notes

### Architecture Decisions
- ✅ FastAPI/React architecture working well
- ✅ Feature-based vertical slice architecture implemented
- ✅ UUID primary keys for better distribution
- ✅ Repository pattern for clean data access
- ✅ Smart mode detection (mock for AI, real for humans)

### Data Strategy
- **Yahoo Finance**: Primary data source (with limitations)
  - Works for human users running locally
  - Blocks automated/AI requests (403 errors)
- **Mock Data**: Reliable fallback with 15 realistic stocks
  - Default for AI and automated testing
  - Configurable via `USE_REAL_STOCK_API` env var
- **Future**: Consider paid API (Alpha Vantage, FMP, IEX Cloud)

### Key Technical Wins
- Alembic migrations working smoothly
- Pydantic v2 validation with ConfigDict
- SQLAlchemy with UUID primary keys
- Automatic API fallback system
- Comprehensive error handling

---

## 🔗 Key References

### Documentation
- **Project Plan:** `/PROJECT_PLAN.md` - This file
- **Scoring Methodology:** `/backend/SCORING_METHODOLOGY.md` - Detailed scoring algorithm and financial rationale
- **Disclaimers:** `/DISCLAIMERS.md` - Financial disclaimers and responsible use guidelines
- **Stock Data Config:** `/backend/STOCK_DATA_CONFIG.md` - How to configure data sources
- **Phase 3 Test Report:** `/PHASE_3_TEST_REPORT.md` - Scoring validation results
- **Phase 2 Test Report:** `/PHASE_2_TEST_REPORT.md` - Screener validation results
- **Current Codebase:** `/home/user/VibeApp/`

### Core Services (Phase 3)
- **Scoring Service:** `/backend/app/features/stocks/services/scoring_service.py`
- **Sector Service:** `/backend/app/features/stocks/services/sector_service.py`
- **Screener Service:** `/backend/app/features/stocks/services/screener_service.py`

### APIs & Libraries
- **Stock API Router:** `/backend/app/features/stocks/router.py` (11 endpoints total)
- **Stock Repository:** `/backend/app/infrastructure/repositories/stock_repository.py`
- **Yahoo Finance Client:** `/backend/app/features/integrations/yahoo_finance_client.py`
- **Mock Data:** `/backend/app/features/integrations/mock_stock_data.py`
- **Database Models:** `/backend/app/features/stocks/models/__init__.py`

### External Resources
- **pandas-ta Documentation:** https://github.com/twopirllc/pandas-ta (for Phase 4 momentum)
- **Alpha Vantage:** https://www.alphavantage.co/ (production option)
- **Financial Modeling Prep:** https://financialmodelingprep.com/ (production option)

### Git
- **Current Branch:** `claude/review-project-plan-011CUTuwwgxz44pypSWg5PTs`
- **Main Branch:** `main` (for PRs)

---

**Last Updated:** 2025-10-25
**Document Owner:** Claude (AI) + Stakeholder
