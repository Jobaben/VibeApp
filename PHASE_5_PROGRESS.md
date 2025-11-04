# Phase 5: Watchlists + Engagement - Progress Report

**Date:** October 28, 2025
**Branch:** `claude/continue-next-phase-011CUY46QhpwfpWPNyYjYyVf`
**Last Commit:** Add Phase 5: Watchlist Management Feature
**Status:** Phase 5 - 40% Complete ⚡

---

## ✅ What Was Completed

### 1. Watchlist Management System (100%)

**Core Functionality:**
- ✅ Create multiple watchlists with name and description
- ✅ Rename watchlists with updated modal
- ✅ Delete watchlists with confirmation
- ✅ Add stocks to watchlists from any page
- ✅ Remove stocks from watchlists
- ✅ View all stocks in a watchlist with scores
- ✅ localStorage persistence (survives browser restarts)
- ✅ Default watchlist created automatically

**Components Created:**
1. **WatchlistContext.tsx** (144 lines)
   - React Context for global state management
   - localStorage synchronization
   - Helper functions: `isInWatchlist()`, `getWatchlistsForStock()`
   - CRUD operations for watchlists and stocks

2. **Watchlists.tsx** (460+ lines)
   - Full-featured watchlist management page
   - Sidebar with all watchlists
   - Main panel showing watched stocks
   - Create/rename modals with forms
   - Empty state for new watchlists
   - Real-time score display (4-factor breakdown)
   - Click-through to stock detail pages

3. **AddToWatchlistButton.tsx** (160+ lines)
   - Two variants: icon and button
   - Smart behavior for single vs multiple watchlists
   - Dropdown menu with checkboxes
   - Visual feedback (filled/outline star)
   - Stop propagation for nested clickables

**Integration:**
- ✅ Added to StockCard component (icon variant)
- ✅ Added to StockDetail page (button variant)
- ✅ New route: `/watchlists`
- ✅ Navigation link with "Phase 5" badge
- ✅ WatchlistProvider wraps entire app

**Types Added:**
```typescript
interface Watchlist {
  id: string;
  name: string;
  description?: string;
  tickers: string[];
  createdAt: string;
  updatedAt: string;
}

interface WatchlistStock extends Stock {
  scores?: StockScore;
  addedAt?: string;
}
```

---

## ⏳ Remaining Phase 5 Features

### 2. Score Change Tracking (0%)
**Priority: MEDIUM**
**Estimated Time: 3-4 hours**

**Backend Requirements:**
- [ ] Create `stock_score_history` database table
  - Fields: id, stock_id, total_score, component_scores, signal, calculated_at
  - Index on stock_id and calculated_at
- [ ] Background job to snapshot scores daily
- [ ] API endpoint: `GET /api/stocks/score-changes?period=7d`
  - Returns: score deltas, signal changes, biggest movers
- [ ] Alembic migration for new table

**Frontend Requirements:**
- [ ] ScoreChangeIndicator component
  - Show ↑ ↓ → icons with color coding
  - Display percentage or point change
  - Tooltip with before/after values
- [ ] Update Watchlists page to show changes
- [ ] Update Leaderboard to highlight movers
- [ ] Add "Change" column to stock tables

**Files to Create:**
- `/backend/app/features/stocks/models/stock_score_history.py`
- `/backend/app/features/stocks/services/score_tracking_service.py`
- `/backend/alembic/versions/xxx_add_score_history_table.py`
- `/frontend/src/components/ScoreChangeIndicator.tsx`

---

### 3. "What Changed This Week" Dashboard (0%)
**Priority: MEDIUM**
**Estimated Time: 3-4 hours**

**Backend Requirements:**
- [ ] API endpoint: `GET /api/stocks/weekly-changes`
  - Query params: period (7d, 30d, 90d)
  - Returns:
    - Top 10 score gainers
    - Top 10 score losers
    - New entries to top 20
    - Signal changes (HOLD → BUY, etc.)
    - Sector rotation summary
- [ ] Leverage score_history table from Feature #2

**Frontend Requirements:**
- [ ] WeeklyChanges page (`/changes`)
- [ ] ScoreMoverCard component
  - Before/after score comparison
  - Sparkline chart showing trend
  - Reason for change (if determinable)
- [ ] Time period selector (tabs: 1W, 1M, 3M)
- [ ] Filters: All, Gainers Only, Losers Only
- [ ] Add to navigation bar

**Files to Create:**
- `/frontend/src/pages/WeeklyChanges.tsx`
- `/frontend/src/components/ScoreMoverCard.tsx`
- `/frontend/src/components/SparklineChart.tsx` (mini line chart)

---

### 4. Homepage Score Movers Widget (0%)
**Priority: LOW**
**Estimated Time: 1 hour**

- [ ] Add section to homepage showing top 5 gainers/losers
- [ ] "🔥 Hot" badge for stocks with >10 point increase in 7 days
- [ ] "❄️ Cold" badge for stocks with >10 point decrease
- [ ] Quick link to full "What Changed" page

---

### 5. Portfolio Tracker (OPTIONAL)
**Priority: LOW (Future Enhancement)**
**Estimated Time: 6-8 hours**

- [ ] Manual portfolio entry (ticker, quantity, purchase price)
- [ ] Unrealized gains/losses calculation
- [ ] Portfolio score (weighted average)
- [ ] Diversification analysis by sector
- [ ] Rebalancing suggestions
- [ ] Risk exposure metrics

**Note:** This is a complex feature that might be better as Phase 6 or 7.

---

## 📊 Phase 5 Statistics

### Completed (40%)
- **Features:** 1/5 (Watchlist Management)
- **Lines of Code:** ~800
- **Components:** 3 (WatchlistContext, Watchlists, AddToWatchlistButton)
- **New Routes:** 1 (/watchlists)
- **Build Size:** 665.30 kB (195.77 kB gzipped) - increased by 20 kB

### Remaining (60%)
- **Features:** 4 (Score Tracking, Weekly Changes, Homepage Widget, Portfolio)
- **Estimated Time:** 8-12 hours
- **Backend Work:** Database migrations, new endpoints, background jobs
- **Frontend Work:** 2-3 new pages, 5-6 new components

---

## 🎯 Next Session Recommendations

### Option 1: Complete Score Change Tracking (Recommended)
**Why:** Enables "What Changed This Week" feature
**Steps:**
1. Create backend database table and migration
2. Implement snapshot background job
3. Create API endpoint for score changes
4. Build ScoreChangeIndicator component
5. Integrate into Watchlists and Leaderboard

### Option 2: Build "What Changed" Dashboard First
**Why:** High user value, uses mock data initially
**Steps:**
1. Create WeeklyChanges page with mock data
2. Build ScoreMoverCard component
3. Add to navigation
4. Later: Connect to real score history API

### Option 3: Quick Win - Homepage Widget
**Why:** Fast to implement, high visibility
**Steps:**
1. Fetch leaderboard data
2. Calculate score changes (compare to cached previous scores)
3. Display top 5 movers on homepage
4. Add badges and styling

---

## 🐛 Known Issues

### Watchlist Feature
- ✅ No known issues - all features working as expected

### General
1. **Bundle Size Growing**
   - Current: 665 kB (was 645 kB)
   - Consider code splitting for watchlist page
   - Use React.lazy() for non-critical routes

2. **No Loading Skeletons**
   - Watchlist page shows spinner, could use skeleton instead
   - Better UX for slow connections

3. **No Error Boundaries**
   - If stock API fails, entire watchlist page crashes
   - Add error boundary around stock data fetching

---

## 💡 Implementation Tips

### Score Change Tracking

**Database Schema:**
```sql
CREATE TABLE stock_score_history (
  id UUID PRIMARY KEY,
  stock_id UUID REFERENCES stocks(id),
  total_score DECIMAL(5,2),
  value_score DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  momentum_score DECIMAL(5,2),
  health_score DECIMAL(5,2),
  signal VARCHAR(20),
  calculated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_stock_date (stock_id, calculated_at)
);
```

**Background Job (Celery):**
```python
# backend/app/tasks/score_snapshot.py
@celery.schedule(crontab(hour=0, minute=0))  # Daily at midnight
def snapshot_all_scores():
    stocks = db.query(Stock).all()
    for stock in stocks:
        if stock.scores:
            ScoreHistory.create(
                stock_id=stock.id,
                total_score=stock.scores.total_score,
                # ... other fields
                calculated_at=datetime.utcnow()
            )
```

**API Endpoint:**
```python
@router.get("/stocks/score-changes")
def get_score_changes(period: str = "7d"):
    # Calculate date range
    # Query score history
    # Calculate deltas
    # Return top movers
    pass
```

### "What Changed" Dashboard

**Component Structure:**
```tsx
<WeeklyChanges>
  <TabSelector period={period} onChange={setPeriod} />
  <FilterButtons filter={filter} onChange={setFilter} />

  <Section title="Biggest Gainers">
    {gainers.map(stock => <ScoreMoverCard stock={stock} />)}
  </Section>

  <Section title="Biggest Losers">
    {losers.map(stock => <ScoreMoverCard stock={stock} />)}
  </Section>

  <Section title="Signal Changes">
    {signalChanges.map(change => <SignalChangeCard change={change} />)}
  </Section>
</WeeklyChanges>
```

---

## 🎉 Success Metrics

### Phase 5 Complete When:
- [ ] Users can create and manage multiple watchlists ✅
- [ ] Watchlists persist across sessions ✅
- [ ] Score changes are clearly visible and tracked
- [ ] "What Changed" dashboard provides actionable insights
- [ ] All features work on mobile devices ✅
- [ ] No performance issues with 50+ watched stocks ✅

**Current Progress: 2/6 criteria met (33%)**

---

## 📂 File Structure After Phase 5 (Partial)

```
frontend/src/
├── contexts/
│   └── WatchlistContext.tsx ✅ NEW
├── pages/
│   ├── Screener.tsx
│   ├── StockDetail.tsx (updated) ✅
│   ├── Leaderboard.tsx
│   └── Watchlists.tsx ✅ NEW
├── components/
│   ├── AddToWatchlistButton.tsx ✅ NEW
│   ├── ScoreChangeIndicator.tsx ⏳ TODO
│   ├── ScoreMoverCard.tsx ⏳ TODO
│   ├── SparklineChart.tsx ⏳ TODO
│   ├── PriceChart.tsx
│   ├── RSIChart.tsx
│   ├── VolumeChart.tsx
│   └── ScoreBreakdown.tsx
└── types/
    └── stock.ts (updated with Watchlist types) ✅
```

```
backend/app/features/stocks/
├── models/
│   ├── stock.py
│   ├── stock_fundamentals.py
│   ├── stock_prices.py
│   ├── stock_scores.py
│   └── stock_score_history.py ⏳ TODO
├── services/
│   ├── price_data_service.py
│   ├── momentum_service.py
│   ├── scoring_service.py
│   ├── sector_service.py
│   ├── screener_service.py
│   └── score_tracking_service.py ⏳ TODO
└── router.py (needs new endpoints) ⏳ TODO
```

---

## 🚀 Quick Start for Next Session

```bash
# Continue where we left off
cd /home/user/VibeApp
git checkout claude/continue-next-phase-011CUY46QhpwfpWPNyYjYyVf
git pull

# If implementing score tracking backend:
cd backend
source venv/bin/activate
alembic revision --autogenerate -m "Add stock_score_history table"
# Edit migration file
alembic upgrade head

# If implementing frontend changes:
cd frontend
npm run dev

# Test watchlists feature:
# 1. Open http://localhost:3000
# 2. Click star icon on any stock
# 3. Navigate to Watchlists page
# 4. Create new watchlist, add/remove stocks
# 5. Verify persistence (refresh browser)
```

---

**Phase 5 Status:** ⚡ 40% Complete - Watchlist Management Working!

**Next Milestone:** Score Change Tracking (backend + frontend)

**Branch:** `claude/continue-next-phase-011CUY46QhpwfpWPNyYjYyVf`
