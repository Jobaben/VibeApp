# Avanza Stock Finder

**An AI-augmented stock analysis platform for Swedish retail investors**

A data-driven stock screening and analysis tool that helps investors find promising stocks through fundamental analysis, quantitative scoring, and pre-built investment strategies.

---

## 🎯 Project Status

**Current Phase:** ✅ **Phase 3 Complete** - Scoring Engine + Clear Signals
**Started:** October 23, 2025
**Latest Update:** October 25, 2025

### Completed Phases

- ✅ **Phase 0**: AI Infrastructure
- ✅ **Phase 1**: Data Foundation (Database, API, Stock Data Integration)
- ✅ **Phase 2**: Smart Screener + Pre-Built Investment Strategies
- ✅ **Phase 3**: Scoring Engine + Clear Signals (0-100 scoring system)

### Next Phase

- ⏳ **Phase 4**: Deep Analysis Pages (Historical price data, momentum scoring, charts)

---

## 🌟 Key Features

### Stock Screening & Strategies
- **5 Pre-Built Investment Strategies:**
  - 💎 Value Gems (Low P/E + High ROIC + Low Debt)
  - 🚀 Quality Compounders (High ROIC + High Margins + Growing)
  - 👑 Dividend Kings (High Yield + Sustainable Payout)
  - 🔍 Deep Value (Low P/B + Positive FCF)
  - ⚡ Explosive Growth (High Revenue Growth + Low PEG)
- **Custom Screener:** Filter stocks by any fundamental metric
- **15 Mock Stocks:** Comprehensive test dataset with real fundamentals

### Multi-Factor Scoring System (0-100 Points)
- **Value Score (0-25):** Valuation metrics (P/E, EV/EBITDA, PEG, P/B) vs sector
- **Quality Score (0-25):** Profitability (ROIC, ROE, margins, FCF)
- **Momentum Score (0-25):** *Phase 4* - Price trends (RSI, moving averages)
- **Financial Health Score (0-25):** Balance sheet strength (Debt/Equity, liquidity, coverage)

### Clear Buy/Sell Signals
- 🟢 **STRONG BUY** (90-100) - Exceptional opportunity
- 🟢 **BUY** (75-89) - Attractive candidate
- 🟡 **HOLD** (50-74) - Mixed signals
- 🔴 **SELL** (25-49) - Warning signs
- 🔴 **STRONG SELL** (0-24) - Major problems

### Transparent Explanations
Every stock score includes:
- **Strengths** - What the stock does well
- **Weaknesses** - What drags down the score
- **Detailed Reasoning** - Clear explanation of the score

### Leaderboards
- **Top Stocks:** Best overall scores
- **By Signal:** Filter stocks by buy/sell signal
- **By Sector:** Top performers in each sector

---

## 🏗️ Architecture

### Tech Stack

**Backend:**
- **Python 3.11** - Core language
- **FastAPI** - Modern async web framework
- **SQLAlchemy** - ORM with UUID primary keys
- **Alembic** - Database migrations
- **PostgreSQL 16** - Production database (SQLite for development)
- **Pydantic v2** - Data validation and schemas

**Frontend:**
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization (Phase 4)
- **React Query** - Data fetching & caching

**Data Sources:**
- **Yahoo Finance API** - Real stock data (for human users)
- **Mock Data** - 15 realistic stocks for development/testing

### Project Structure

```
VibeApp/
├── backend/
│   ├── app/
│   │   ├── features/
│   │   │   ├── stocks/              # Stock analysis feature
│   │   │   │   ├── models/          # Database models
│   │   │   │   ├── schemas/         # Pydantic schemas
│   │   │   │   ├── services/        # Business logic
│   │   │   │   │   ├── screener_service.py
│   │   │   │   │   ├── scoring_service.py
│   │   │   │   │   └── sector_service.py
│   │   │   │   └── router.py        # API endpoints
│   │   │   └── integrations/        # External APIs
│   │   │       ├── yahoo_finance_client.py
│   │   │       └── mock_stock_data.py
│   │   ├── infrastructure/
│   │   │   ├── database/            # Database setup
│   │   │   └── repositories/        # Data access layer
│   │   └── shared/                  # Shared utilities
│   ├── alembic/                     # Database migrations
│   ├── seed_data.py                 # Seed database with stocks
│   ├── validate_scores.py           # Score validation
│   ├── SCORING_METHODOLOGY.md       # Detailed scoring methodology
│   └── STOCK_DATA_CONFIG.md         # Data source configuration
│
├── frontend/
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── StockList.tsx
│   │   │   ├── StockCard.tsx
│   │   │   ├── StockSearch.tsx
│   │   │   ├── StrategySelector.tsx
│   │   │   └── ScreenerResults.tsx
│   │   ├── pages/                   # Page components
│   │   ├── services/                # API services
│   │   └── types/                   # TypeScript types
│   └── public/
│
├── PROJECT_PLAN.md                  # Complete project roadmap
├── PHASE_3_TEST_REPORT.md           # Scoring validation results
├── PHASE_2_TEST_REPORT.md           # Screener validation results
├── DISCLAIMERS.md                   # Financial disclaimers
└── README.md                        # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **SQLite** (for development) or **PostgreSQL 16** (for production)
- **Git**

### Quick Start

#### 1. Clone the Repository

```bash
git clone https://github.com/Jobaben/VibeApp.git
cd VibeApp
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env if needed (defaults work for development)

# Run database migrations
alembic upgrade head

# Seed database with sample stocks and calculate scores
python seed_data.py

# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be available at:** http://localhost:8000
**API Documentation:** http://localhost:8000/docs

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env to set VITE_API_URL=http://localhost:8000

# Start the development server
npm run dev
```

**Frontend will be available at:** http://localhost:3000

---

## 🐳 Getting Started with Docker

For a simpler setup experience, you can use Docker to run the entire stack with a single command.

### Prerequisites

- **Docker 20.10+**
- **Docker Compose 2.x**

### Quick Start

```bash
# Clone and enter the repository
git clone https://github.com/Jobaben/VibeApp.git
cd VibeApp

# Start everything
docker-compose up
```

Then open http://localhost:3000

### Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 8000 | http://localhost:8000 |
| Swagger Docs | 8000 | http://localhost:8000/docs |
| PostgreSQL | 5432 | localhost:5432 |

### Common Commands

```bash
# Start all services
docker-compose up

# Start in background (detached mode)
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v

# Rebuild containers (after dependency changes)
docker-compose up --build

# View logs
docker-compose logs -f              # All services
docker-compose logs -f backend      # Backend only
docker-compose logs -f frontend     # Frontend only

# Shell access
docker exec -it avanza-stock-finder-backend sh
docker exec -it avanza-stock-finder-frontend sh
docker exec -it avanza-stock-finder-db psql -U stockfinder -d stockfinder_db
```

### Hot Reload

Code changes are automatically reflected without restarting containers:

- **Backend:** Changes in `backend/` trigger uvicorn auto-reload
- **Frontend:** Changes in `frontend/src/` trigger Vite HMR (Hot Module Replacement)

### Adding Dependencies

After modifying `package.json` (frontend) or `requirements.txt` (backend):

```bash
# Rebuild containers to install new dependencies
docker-compose up --build
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | Change ports in `docker-compose.yml` or stop conflicting services |
| Build fails | Run `docker-compose build --no-cache` to rebuild from scratch |
| Database issues | Run `docker-compose down -v` to reset database (loses data) |
| Container won't start | Check logs: `docker-compose logs [service]` |
| Stale containers | Run `docker-compose down && docker-compose up --build` |

### Environment Variables

Docker Compose automatically sets these environment variables:

**Backend:**
- `DATABASE_URL` - PostgreSQL connection string
- `CORS_ORIGINS` - Allowed frontend origins
- `DEBUG` - Debug mode enabled

**Frontend:**
- `VITE_API_URL` - Backend API URL

---

## 📚 API Documentation

Once the backend is running, interactive API documentation is available at:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key API Endpoints

#### Stock Data
- `GET /api/stocks/` - List all stocks (with pagination, filtering)
- `GET /api/stocks/{ticker}` - Get stock details by ticker
- `GET /api/stocks/search?q={query}` - Search stocks by ticker/name
- `GET /api/stocks/sectors` - List all sectors
- `GET /api/stocks/top` - Get top-scored stocks
- `POST /api/stocks/import` - Import stocks from Yahoo Finance

#### Stock Screener
- `POST /api/stocks/screener/custom` - Custom screening criteria
- `GET /api/stocks/screener/strategies/value-gems` - Value Gems strategy
- `GET /api/stocks/screener/strategies/quality-compounders` - Quality Compounders
- `GET /api/stocks/screener/strategies/dividend-kings` - Dividend Kings
- `GET /api/stocks/screener/strategies/deep-value` - Deep Value
- `GET /api/stocks/screener/strategies/explosive-growth` - Explosive Growth

#### Scoring & Leaderboards (Phase 3)
- `POST /api/stocks/scores/calculate` - Recalculate all scores and sector averages
- `GET /api/stocks/{ticker}/score-breakdown` - Detailed score with explanations
- `GET /api/stocks/leaderboard/top` - Top stocks by score (with optional sector filter)
- `GET /api/stocks/leaderboard/by-signal/{signal}` - Stocks by signal (STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL)
- `GET /api/stocks/leaderboard/sectors` - Top stocks per sector

### Example API Usage

**Get top 10 stocks:**
```bash
curl http://localhost:8000/api/stocks/leaderboard/top?limit=10
```

**Get detailed score breakdown for META:**
```bash
curl http://localhost:8000/api/stocks/META/score-breakdown
```

**Run Value Gems strategy:**
```bash
curl http://localhost:8000/api/stocks/screener/strategies/value-gems
```

---

## 📖 Key Documentation

### For Developers
- **[PROJECT_PLAN.md](PROJECT_PLAN.md)** - Complete project roadmap and architecture
- **[backend/SCORING_METHODOLOGY.md](backend/SCORING_METHODOLOGY.md)** - Detailed scoring algorithm with financial rationale
- **[backend/STOCK_DATA_CONFIG.md](backend/STOCK_DATA_CONFIG.md)** - How to configure stock data sources
- **[PHASE_3_TEST_REPORT.md](PHASE_3_TEST_REPORT.md)** - Scoring system validation results
- **[PHASE_2_TEST_REPORT.md](PHASE_2_TEST_REPORT.md)** - Screener validation results

### For Users
- **[DISCLAIMERS.md](DISCLAIMERS.md)** - ⚠️ **IMPORTANT:** Financial disclaimers and responsible use guidelines

---

## ⚠️ Important Disclaimers

**This tool is for educational and research purposes only.**

- ❌ **NOT financial advice** - Do not make investment decisions based solely on this tool
- ❌ **NOT a guarantee** - Past performance does not predict future results
- ❌ **NO warranties** - Use at your own risk
- ✅ **Consult professionals** - Always consult qualified financial advisors before investing
- ✅ **Do your research** - This is a starting point, not a complete analysis

**Read the full disclaimers:** [DISCLAIMERS.md](DISCLAIMERS.md)

---

## 🧪 Testing & Validation

### Scoring System Validation

The scoring system has been rigorously tested against 15 diverse stocks:

| Stock | Score | Signal | Validation |
|-------|-------|--------|-----------|
| META | 69.5 | HOLD | ✅ Strong balance sheet, good valuation |
| CSCO | 66.5 | HOLD | ✅ Value play: Low P/E, high dividend |
| MSFT | 60.5 | HOLD | ✅ Quality compounder: High ROIC |
| NVDA | 51.5 | HOLD | ✅ Correctly penalized on value (high P/E) |
| INTC | 54.5 | HOLD | ✅ Troubled: Low quality score |
| DIS | 35.5 | SELL | ✅ Weakest: Poor profitability |

**See full validation report:** [PHASE_3_TEST_REPORT.md](PHASE_3_TEST_REPORT.md)

### Run Validation Locally

```bash
cd backend

# Seed database with sample stocks
python seed_data.py

# Validate scoring results
python validate_scores.py
```

### Expected Output

```
Stock Scoring Summary - Validation
================================================================================
Ticker   Name                            Score Signal          V    Q    M    H
--------------------------------------------------------------------------------
META     Meta Platforms Inc.              69.5 HOLD         16.0 17.0 12.5 24.0
CSCO     Cisco Systems Inc.               66.5 HOLD         19.0 12.0 12.5 23.0
...

✅ Validation Complete: Scores reflect financial reality!
```

---

## 🔧 Development

### Database Migrations

Create a new migration:
```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
```

Apply migrations:
```bash
alembic upgrade head
```

Rollback migration:
```bash
alembic downgrade -1
```

### Seed Database

```bash
cd backend
python seed_data.py
```

This will:
1. Create 15 sample stocks with comprehensive fundamentals
2. Calculate sector averages for 6 sectors
3. Score all stocks using the multi-factor algorithm
4. Display top 5 stocks with scores

### Code Quality

Format code:
```bash
cd backend
black .
```

Type checking:
```bash
cd backend
mypy app/
```

### Environment Variables

**Backend (.env):**
```env
# Database
DATABASE_URL=sqlite:///./test.db  # Development
# DATABASE_URL=postgresql://user:pass@localhost/dbname  # Production

# Stock Data
USE_REAL_STOCK_API=false  # Use mock data (recommended for development)

# API
CORS_ORIGINS=http://localhost:3000
DEBUG=true
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:8000
```

---

## 📊 Scoring Methodology

The scoring system evaluates stocks across 4 key factors:

### 1. Value Score (0-25 points)
**Philosophy:** Pay a fair price for quality

- **P/E ratio vs sector** (8 pts) - Cheaper than peers scores higher
- **EV/EBITDA vs sector** (6 pts) - Enterprise value relative to earnings
- **PEG ratio** (6 pts) - Peter Lynch's favorite metric
- **P/B ratio** (5 pts) - Price relative to book value

### 2. Quality Score (0-25 points)
**Philosophy:** Quality compounds over time

- **ROIC percentile** (10 pts) - Return on invested capital (Buffett's favorite)
- **ROE vs sector** (7 pts) - Return on equity
- **Margin quality** (5 pts) - Net profit margins
- **FCF consistency** (3 pts) - Free cash flow yield

### 3. Momentum Score (0-25 points) *[Phase 4]*
**Philosophy:** Don't fight the tape

- **50-day moving average** (7 pts) - Short-term trend
- **200-day moving average** (7 pts) - Long-term trend
- **RSI** (6 pts) - Relative Strength Index
- **Volume trends** (5 pts) - Increasing volume on up days

*Currently defaults to neutral (12.5 pts) until Phase 4*

### 4. Financial Health Score (0-25 points)
**Philosophy:** Survive to thrive

- **Debt/Equity ratio** (10 pts) - Lower debt is better
- **Current ratio** (6 pts) - Can they pay short-term bills?
- **Interest coverage** (5 pts) - Can they afford debt service?
- **FCF yield** (4 pts) - Cash generation relative to market cap

**For complete methodology:** [backend/SCORING_METHODOLOGY.md](backend/SCORING_METHODOLOGY.md)

---

## 🎯 Investment Strategies

### 💎 Value Gems
**Target:** Undervalued quality companies
**Criteria:**
- P/E < 15 (undervalued)
- ROIC > 15% (efficient capital allocation)
- Debt/Equity < 0.5 (financially healthy)

### 🚀 Quality Compounders
**Target:** Long-term wealth builders
**Criteria:**
- ROIC > 20% (exceptional capital efficiency)
- Net Margin > 15% (highly profitable)
- Revenue Growth > 0% (growing business)

### 👑 Dividend Kings
**Target:** Income + stability
**Criteria:**
- Dividend Yield > 3% (good income)
- Payout Ratio < 70% (sustainable)
- Debt/Equity < 1.0 (healthy balance sheet)

### 🔍 Deep Value
**Target:** Distressed turnarounds
**Criteria:**
- P/B < 2.0 (trading near book value)
- FCF Yield > 3% (positive cash generation)
- Debt/Equity < 1.0 (manageable leverage)

### ⚡ Explosive Growth
**Target:** Growth at reasonable price (GARP)
**Criteria:**
- Revenue Growth > 30% (explosive growth)
- PEG < 2.0 (not overvalued relative to growth)
- Net Margin > 0% (profitable or near profitability)

---

## 🛠️ Technology Highlights

### Backend Architecture
- **Feature-Based Vertical Slices** - Each feature is self-contained
- **Repository Pattern** - Clean separation of data access
- **CQRS Pattern** - Separate read and write operations
- **Pydantic v2 Validation** - Robust data validation
- **UUID Primary Keys** - Better for distributed systems
- **Comprehensive Error Handling** - All edge cases covered

### Frontend Architecture
- **Component-Based** - Reusable React components
- **Type Safety** - Full TypeScript coverage
- **Modern Styling** - Tailwind CSS with dark theme
- **Responsive Design** - Mobile-friendly
- **State Management** - React Query for server state

### Data Quality
- **Sector-Aware Scoring** - Compares stocks to sector peers
- **Edge Case Handling** - Missing data, negative values, outliers
- **Sector-Specific Adjustments** - Banks, utilities handled differently
- **Conservative Defaults** - When in doubt, score neutrally

---

## 🚀 Roadmap

### ✅ Completed (Phases 0-3)
- AI infrastructure
- Database schema & migrations
- Stock data integration (Yahoo Finance + Mock)
- Basic stock browsing and search
- 5 pre-built investment strategies
- Custom screener with multi-criteria filtering
- Multi-factor scoring engine (0-100 points)
- Sector benchmark calculation
- Buy/sell signal classification
- Detailed scoring explanations
- Leaderboard APIs

### ⏳ Phase 4: Deep Analysis Pages (Next)
- Historical price data storage
- Technical indicators (RSI, moving averages)
- Complete momentum scoring
- Individual stock detail pages
- Interactive charts (Recharts)
- AI insights section
- Peer comparison visualizations
- Frontend for leaderboards

### 📋 Phase 5: Watchlists + Engagement
- Watchlist management (localStorage)
- Score change tracking
- "What Changed This Week"
- Biggest score movers
- New entries to top 20
- Portfolio tracker (optional)

### 🚀 Phase 6: Polish + Deploy
- Celery background jobs for data refresh
- Redis caching layer
- Production deployment
- Performance optimization
- Monitoring & logging
- SEO optimization
- User documentation

---

## 🤝 Contributing

This is an educational project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write/update tests
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Contribution Guidelines
- Follow existing code style (Black for Python, ESLint for TypeScript)
- Add tests for new features
- Update documentation
- Keep commits focused and atomic

---

## 🙏 Acknowledgments

### Financial Principles
This project draws from established investment principles:
- **Value Investing:** Benjamin Graham, Warren Buffett
- **Quality Investing:** Charlie Munger (ROIC, moats, quality compounds)
- **Growth Investing:** Peter Lynch (PEG ratio, GARP)
- **Financial Analysis:** Aswath Damodaran (valuation, sector context)
- **Risk Management:** Howard Marks (debt, liquidity, downside protection)

### Academic Research
- Fama-French 3-factor model
- Quality factor research (Novy-Marx, Asness)
- Momentum factor (Jegadeesh, Titman)

---

## 📧 Contact & Support

- **GitHub Issues:** https://github.com/Jobaben/VibeApp/issues
- **Project Plan:** [PROJECT_PLAN.md](PROJECT_PLAN.md)
- **Documentation:** See `/backend/` and root directory

---

## ⚖️ Legal Notice

**NOT FINANCIAL ADVICE**

This tool is for educational and research purposes only. It does NOT constitute:
- Financial advice
- Investment recommendations
- Professional investment counsel
- Tax, legal, or accounting advice

**Always:**
- Do your own research
- Consult qualified financial professionals
- Understand the risks of investing
- Read the full [DISCLAIMERS.md](DISCLAIMERS.md)

**Remember:** You are solely responsible for your investment decisions.

---

**Built with 🧠 using Python FastAPI, React, and rigorous financial analysis**

**Last Updated:** October 25, 2025
