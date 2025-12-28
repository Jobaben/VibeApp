# Project Brief

## Problem Statement

Stakeholders report that **clicking on stock cards navigates to a blank white page** instead of showing stock details.

**Who has this problem**: All users trying to view detailed stock information.

## Current State

### Investigation Findings

Code analysis shows the implementation is correct:

1. **Stock Card Click Handler** (`StockList.tsx:80-82`):
   ```typescript
   const handleStockClick = (stock: Stock) => {
     navigate(`/stock/${encodeURIComponent(stock.ticker)}`);
   };
   ```

2. **Route Definition** (`App.tsx:23`):
   ```typescript
   <Route path="/stock/:ticker" element={<StockDetail />} />
   ```

3. **StockDetail Component** (`pages/StockDetail.tsx`):
   - Fetches data from 3 API endpoints:
     - `/stocks/{ticker}` - stock details
     - `/stocks/{ticker}/score-breakdown` - score analysis
     - `/stocks/{ticker}/prices/historical` - price chart data
   - Has proper loading and error states with dark backgrounds

4. **Backend Endpoints**: All required endpoints exist in `backend/app/features/stocks/router.py`

### Likely Root Causes

| Cause | Likelihood | Evidence Needed |
|-------|------------|-----------------|
| Backend server not running | High | Check if API is accessible |
| API returning 500 error | Medium | Check browser console/network tab |
| JavaScript error crashing React | Medium | Check browser console for errors |
| CORS blocking API calls | Low | Check browser console for CORS errors |
| Missing data in database | Low | Stock might not have scores/prices |

### Why "Blank White" Page?

The StockDetail component has styled loading (`bg-gradient-to-br from-gray-950`) and error states. A blank **white** page suggests:

1. **React crash** - A JavaScript error before render completes
2. **CSS not loading** - Tailwind styles not applied
3. **Component not mounting** - Route not matching or context issue

## Desired Outcome

1. Clicking a stock card shows the stock detail page with charts and scores
2. Loading state shows spinner with dark background
3. Error state shows friendly message with "Back to Home" button

**Measurement**: User can click any stock card and see detailed information.

## Scope

### In Scope
- Diagnose the actual cause of blank page (requires running the app)
- Fix the root cause
- Verify stock detail page renders correctly

### Out of Scope
- Redesigning the stock detail page
- Adding new features to stock detail

## Stakeholders

| Stakeholder | Interest |
|-------------|----------|
| End Users | Core functionality broken |
| Product | Major user journey blocked |

## Constraints

- Need to reproduce the issue to diagnose (requires running frontend + backend)
- Cannot determine exact cause without browser console access

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Multiple causes | Medium | Medium | Test systematically |
| Data issue vs code issue | Medium | Medium | Check multiple stocks |

## Success Criteria

- [ ] Root cause identified
- [ ] Stock detail page loads when clicking stock card
- [ ] Loading spinner visible during data fetch
- [ ] Error message visible if data fetch fails
- [ ] All tabs (Overview, Charts, Fundamentals, Score) work

## Next Steps

To diagnose this issue, we need to:
1. Start the backend server (`cd backend && uvicorn main:app --reload`)
2. Start the frontend (`cd frontend && npm run dev`)
3. Click a stock card and check:
   - Browser console for JavaScript errors
   - Network tab for API failures
   - Terminal for backend errors

---
## Checklist
- [x] Problem clearly articulated
- [x] Stakeholders identified
- [x] Scope boundaries defined
- [x] Success criteria measurable
- [x] Risks documented
