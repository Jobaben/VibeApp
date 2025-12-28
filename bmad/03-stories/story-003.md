# Story: [STORY-003] Add Frontend Defensive Error Handling

## Status
- [ ] Draft
- [x] Ready
- [ ] In Progress
- [ ] In Review
- [ ] Done

## User Story
**As a** user viewing stock details
**I want** to see partial content when some data fails to load
**So that** I can still access available information rather than seeing a blank page

## Description

The StockDetail component fetches data from 3 API endpoints in parallel. If any endpoint fails or returns malformed data, the entire page may show an error or blank state. This story adds defensive error handling to gracefully degrade and show available content.

**Current Behavior:**
- `Promise.all()` fails if ANY request fails
- Missing `scoreBreakdown` causes the page to show error state
- No fallback rendering for partial data

**Desired Behavior:**
- Each API call handled independently with `Promise.allSettled()`
- Show available data even if some endpoints fail
- Display helpful messages for missing sections

## Acceptance Criteria

- [ ] StockDetail uses `Promise.allSettled()` instead of `Promise.all()`
- [ ] Stock basic info displays even if score/price endpoints fail
- [ ] Score breakdown section shows "Unable to load" message if score API fails
- [ ] Price chart section shows "Unable to load" message if price API fails
- [ ] Error messages match dark theme styling
- [ ] User can still navigate back to home from partial content view
- [ ] Tab navigation works even with partial data
- [ ] Console logs which specific endpoints failed (for debugging)

## Technical Notes

### Affected Components

| Component | File | Change |
|-----------|------|--------|
| StockDetail | `frontend/src/pages/StockDetail.tsx` | Update data fetching and rendering logic |

### Implementation Steps

1. **Update Data Fetching** (`frontend/src/pages/StockDetail.tsx`)

   Change from:
   ```typescript
   const [stockData, scoreData, pricesData] = await Promise.all([
     stockApi.getStockByTicker(ticker),
     stockApi.getScoreBreakdown(ticker, true),
     stockApi.getHistoricalPrices(ticker, '1y', true),
   ]);
   ```

   To:
   ```typescript
   const results = await Promise.allSettled([
     stockApi.getStockByTicker(ticker),
     stockApi.getScoreBreakdown(ticker, true),
     stockApi.getHistoricalPrices(ticker, '1y', true),
   ]);

   // Extract results, handling failures
   const stockResult = results[0];
   const scoreResult = results[1];
   const pricesResult = results[2];

   if (stockResult.status === 'fulfilled') {
     setStock(stockResult.value);
   } else {
     console.error('Failed to fetch stock:', stockResult.reason);
     setError('Failed to load stock data');
     return; // Stock is required - can't show partial
   }

   if (scoreResult.status === 'fulfilled') {
     setScoreBreakdown(scoreResult.value);
   } else {
     console.warn('Failed to fetch score breakdown:', scoreResult.reason);
     // Continue - score is optional
   }

   if (pricesResult.status === 'fulfilled') {
     setPriceData(pricesResult.value);
   } else {
     console.warn('Failed to fetch price data:', pricesResult.reason);
     // Continue - prices are optional
   }
   ```

2. **Update Conditional Rendering**

   Change the main content check from:
   ```typescript
   if (error || !stock || !scoreBreakdown) {
     return <ErrorState />;
   }
   ```

   To:
   ```typescript
   if (error || !stock) {
     return <ErrorState />;
   }
   // Continue rendering - scoreBreakdown and priceData are optional
   ```

3. **Add Fallback UI for Missing Sections**

   For score breakdown section:
   ```typescript
   {scoreBreakdown ? (
     <ScoreBreakdown breakdown={scoreBreakdown} />
   ) : (
     <div className="bg-gray-800/50 rounded-lg p-6 border border-white/10 text-center">
       <p className="text-gray-400">Score data unavailable</p>
     </div>
   )}
   ```

   For price chart section:
   ```typescript
   {priceData && priceData.data.length > 0 ? (
     <PriceChart data={priceData.data} />
   ) : (
     <div className="bg-gray-800/50 rounded-lg p-6 border border-white/10 text-center">
       <p className="text-gray-400">Price chart unavailable</p>
     </div>
   )}
   ```

### API Changes

None - this is a frontend-only change.

### Data Changes

None - this is a rendering/error handling change.

## Dependencies

- **Depends on**: Story-002 (Backend pagination fix should be done first to ensure stock list works)

## Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| All APIs succeed | Backend running | Navigate to stock detail | Full content renders |
| Score API fails | Score endpoint returns 500 | Navigate to stock detail | Stock info + chart show, score shows fallback |
| Price API fails | Price endpoint returns 500 | Navigate to stock detail | Stock info + score show, chart shows fallback |
| Both optional fail | Score + Price fail | Navigate to stock detail | Stock info shows, both sections show fallback |
| Stock API fails | Stock endpoint returns 404 | Navigate to stock detail | Error state with Back to Home button |
| Tab navigation | Some data missing | Click through tabs | Tabs work, missing data shows fallback |

## Estimation
- **Complexity**: M (Medium - single file, but careful conditional logic)
- **Risk**: Low (graceful degradation, no breaking changes)

## References
- PRD: [PRD.md](../01-prd/PRD.md) - NFR-02 (Graceful degradation), FR-06 (Error state)
- Architecture: [ARCHITECTURE.md](../02-architecture/ARCHITECTURE.md) - ADR-002

---
## Dev Notes
<!-- Filled in by Dev during implementation -->

## QA Notes
<!-- Filled in by QA during review -->
