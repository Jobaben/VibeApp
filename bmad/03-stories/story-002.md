# Story: [STORY-002] Fix Backend Pagination API Contract

## Status
- [ ] Draft
- [ ] Ready
- [ ] In Progress
- [ ] In Review
- [x] Done

## User Story
**As a** user browsing the stock list
**I want** the pagination to work correctly
**So that** I can navigate between pages and click stock cards without errors

## Description

The frontend and backend have incompatible pagination contracts, causing JavaScript errors that may result in blank pages when interacting with stock cards.

**Root Cause (from Architecture ADR-001):**
- Frontend sends: `page`, `page_size` parameters
- Frontend expects response with: `page`, `page_size`, `total_pages`
- Backend accepts: `skip`, `limit` parameters
- Backend returns: `skip`, `limit`, `has_more`

This mismatch causes `response.total_pages` to be `undefined`, breaking pagination logic.

**Solution:**
Update the backend to accept page-based parameters and return page-based response fields.

## Acceptance Criteria

- [x] Backend `/api/stocks/` endpoint accepts `page` parameter (default: 1)
- [x] Backend `/api/stocks/` endpoint accepts `page_size` parameter (default: 12)
- [x] Backend response includes `page` field matching request
- [x] Backend response includes `page_size` field matching request
- [x] Backend response includes `total_pages` calculated as ceiling(total / page_size)
- [x] Frontend receives valid `total_pages` value (not undefined)
- [x] Pagination controls render correctly on stock list page
- [x] Clicking stock cards navigates to detail page (no blank page)
- [x] No JavaScript console errors related to pagination

## Technical Notes

### Affected Components

| Component | File | Change |
|-----------|------|--------|
| StockListPaginatedResponse | `backend/app/features/stocks/schemas/__init__.py` | Update schema fields |
| list_stocks endpoint | `backend/app/features/stocks/router.py` | Update parameters and response |

### Implementation Steps

1. **Update Schema** (`backend/app/features/stocks/schemas/__init__.py`)

   Change `StockListPaginatedResponse` from:
   ```python
   class StockListPaginatedResponse(BaseModel):
       items: List[StockListResponse]
       total: int
       skip: int
       limit: int
       has_more: bool
   ```

   To:
   ```python
   class StockListPaginatedResponse(BaseModel):
       items: List[StockListResponse]
       total: int
       page: int
       page_size: int
       total_pages: int
   ```

2. **Update Endpoint** (`backend/app/features/stocks/router.py`)

   Change the `list_stocks` function signature from:
   ```python
   async def list_stocks(
       skip: int = Query(default=0, ge=0),
       limit: int = Query(default=100, le=1000),
       ...
   )
   ```

   To:
   ```python
   async def list_stocks(
       page: int = Query(default=1, ge=1),
       page_size: int = Query(default=12, le=100),
       ...
   )
   ```

   Add conversion logic:
   ```python
   skip = (page - 1) * page_size
   # ... fetch stocks with skip/limit ...
   total_pages = (total + page_size - 1) // page_size  # ceiling division

   return StockListPaginatedResponse(
       items=stocks,
       total=total,
       page=page,
       page_size=page_size,
       total_pages=total_pages
   )
   ```

### API Changes

| Before | After |
|--------|-------|
| `GET /api/stocks/?skip=0&limit=100` | `GET /api/stocks/?page=1&page_size=12` |
| Response: `{skip, limit, has_more}` | Response: `{page, page_size, total_pages}` |

### Data Changes

None - this only affects API request/response format.

## Dependencies

None - this is a standalone backend fix.

## Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Default pagination | No params sent | Request `/api/stocks/` | Returns page=1, page_size=12, total_pages calculated |
| Custom page | page=2 sent | Request `/api/stocks/?page=2` | Returns page=2, correct items for page 2 |
| Custom page_size | page_size=24 | Request `/api/stocks/?page_size=24` | Returns 24 items, total_pages recalculated |
| Total pages calc | 50 stocks exist | Request with page_size=12 | total_pages=5 (ceiling of 50/12) |
| Frontend integration | Stock list loads | View stock list page | Pagination shows correct page count |
| Stock card click | Stock list rendered | Click any stock card | Navigates to detail page (not blank) |

## Estimation
- **Complexity**: S (Small - 2 files, ~20 lines changed)
- **Risk**: Low (straightforward parameter rename, no breaking external consumers)

## References
- PRD: [PRD.md](../01-prd/PRD.md) - NFR-03 (No JavaScript errors)
- Architecture: [ARCHITECTURE.md](../02-architecture/ARCHITECTURE.md) - ADR-001

---
## Dev Notes

**Implementation Date:** 2025-12-28

**Changes Made:**

1. **Schema Update** (`backend/app/features/stocks/schemas/__init__.py:146-154`)
   - Changed `StockListPaginatedResponse` fields from `skip`, `limit`, `has_more` to `page`, `page_size`, `total_pages`

2. **Endpoint Update** (`backend/app/features/stocks/router.py:31-77`)
   - Changed parameters from `skip`/`limit` to `page`/`page_size`
   - Added conversion logic: `skip = (page - 1) * page_size`
   - Added `total_pages` calculation using ceiling division
   - Default values: `page=1`, `page_size=12` (max: 100)

3. **Tests Updated:**
   - `tests/integration/test_stock_endpoints.py` - Updated 7 tests to use new pagination format
   - `tests/unit/test_stock_schemas.py` - Updated 2 tests for schema validation

**Tests Passing:** All 11 pagination-related tests pass

**Frontend Compatibility:**
- Frontend types (`frontend/src/types/stock.ts`) already expected `page`, `page_size`, `total_pages`
- Frontend component (`frontend/src/components/StockList.tsx`) already sends correct parameters
- No frontend changes required - this fix aligns backend with existing frontend expectations

**API Contract Change:**
| Before | After |
|--------|-------|
| `GET /api/stocks/?skip=0&limit=100` | `GET /api/stocks/?page=1&page_size=12` |
| Response: `{skip, limit, has_more}` | Response: `{page, page_size, total_pages}` |

## QA Notes

**Review Date:** 2025-12-28
**Verdict:** PASS

**Verification Summary:**
- All 9 acceptance criteria verified and met
- 11 tests passing (2 unit, 9 integration)
- Code follows architecture document (ADR-001) exactly
- Frontend/backend API contract now aligned
- No security vulnerabilities
- No regressions detected

**Full Review:** [review-story-002.md](../04-qa/review-story-002.md)
