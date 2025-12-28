# Architecture Document

## Overview

This architecture document addresses the **stock card blank page issue** described in [PRD](../01-prd/PRD.md). Users clicking on stock cards are navigated to a blank white page instead of seeing the expected stock detail view.

### System Context

VibeApp is a full-stack AI-powered stock analysis platform consisting of:
- **Frontend**: React 18 + TypeScript SPA with Vite
- **Backend**: FastAPI + SQLAlchemy REST API
- **Database**: SQLite (dev) / PostgreSQL (prod)

The stock detail page is a critical user journey that fetches data from 3 API endpoints in parallel.

### Design Principles

1. **API Contract Consistency**: Frontend and backend must agree on request/response schemas
2. **Graceful Degradation**: Partial failures should not cause blank pages
3. **Dark Theme Consistency**: Loading/error states match the app's dark theme
4. **Defensive Programming**: Handle missing/malformed data without crashing

## Architecture

### Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              USER BROWSER                                   │
└────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (React SPA)                             │
│                                                                             │
│  ┌─────────────┐     ┌──────────────┐     ┌───────────────────────────────┐│
│  │  StockList  │────▶│  Navigation  │────▶│        StockDetail            ││
│  │  Component  │     │   (Router)   │     │                               ││
│  └─────────────┘     └──────────────┘     │  ┌─────────────────────────┐  ││
│        │                                   │  │ useEffect: 3 API calls  │  ││
│        │                                   │  └─────────────────────────┘  ││
│        ▼                                   │             │                  ││
│  ┌─────────────┐                          │             ▼                  ││
│  │  StockCard  │                          │  ┌─────────────────────────┐  ││
│  │  onClick()  │                          │  │   Loading/Error/Detail  │  ││
│  └─────────────┘                          │  │       State Render      │  ││
│                                           │  └─────────────────────────┘  ││
│                                           └───────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────┘
                                     │
                           ┌─────────┴─────────┐
                           ▼                   ▼
              ┌────────────────────┐  ┌────────────────────┐
              │   API Client       │  │   API Client       │
              │   (stockApi)       │  │   (stockApi)       │
              └────────────────────┘  └────────────────────┘
                           │                   │
                           └─────────┬─────────┘
                                     ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (FastAPI)                                  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      /api/stocks Router                               │  │
│  │                                                                       │  │
│  │  GET /                     - List stocks (paginated)                  │  │
│  │  GET /{ticker}             - Stock details with fundamentals         │  │
│  │  GET /{ticker}/score-breakdown  - Detailed score analysis            │  │
│  │  GET /{ticker}/prices/historical - Price history + indicators        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                       │
│                                     ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Services & Repositories                            │  │
│  │                                                                       │  │
│  │  StockRepository  │  ScoringService  │  PriceDataService             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                       │
│                                     ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         SQLAlchemy ORM                                │  │
│  │                                                                       │  │
│  │  Stock  │  StockFundamental  │  StockScore  │  StockPrice            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                        ┌────────────────────────┐
                        │   SQLite/PostgreSQL    │
                        │      Database          │
                        └────────────────────────┘
```

### Component Descriptions

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| StockList | Display paginated stock cards with filtering | React + Axios |
| StockCard | Render individual stock preview, handle click | React + Tailwind CSS |
| StockDetail | Display full stock details with tabs | React + Recharts |
| API Client | HTTP communication with backend | Axios |
| Router | SPA routing and navigation | React Router v6 |
| FastAPI App | REST API endpoints and CORS | FastAPI + Uvicorn |
| StockRepository | Data access layer for stocks | SQLAlchemy |
| ScoringService | Calculate and explain stock scores | Python |
| PriceDataService | Fetch and calculate technical indicators | Python + pandas |

## Data Design

### Data Models

#### Stock (Primary Entity)
```
Stock
├── id: UUID (PK)
├── ticker: string (unique, indexed)
├── name: string
├── isin: string (optional)
├── instrument_type: enum (STOCK, ETF, FUND)
├── sector: string (optional)
├── industry: string (optional)
├── market_cap: decimal (optional)
├── currency: string (default: SEK)
├── exchange: string (optional)
├── created_at: datetime
├── last_updated: datetime
└── Relationships:
    ├── fundamentals: StockFundamental (1:1)
    ├── scores: StockScore (1:1)
    └── prices: StockPrice[] (1:N)
```

#### StockFundamental (1:1 with Stock)
```
StockFundamental
├── id: UUID (PK)
├── stock_id: UUID (FK)
├── Valuation: pe_ratio, pb_ratio, peg_ratio, ev_ebitda, ps_ratio
├── Profitability: roic, roe, gross_margin, operating_margin, net_margin
├── Health: debt_equity, current_ratio, fcf_yield, interest_coverage
├── Growth: revenue_growth, earnings_growth
└── Dividends: dividend_yield, payout_ratio
```

#### StockScore (1:1 with Stock)
```
StockScore
├── id: UUID (PK)
├── stock_id: UUID (FK)
├── total_score: decimal (0-100)
├── value_score: decimal (0-25)
├── quality_score: decimal (0-25)
├── momentum_score: decimal (0-25)
├── health_score: decimal (0-25)
├── signal: enum (STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL)
└── calculated_at: datetime
```

### Data Flow

```
USER CLICKS STOCK CARD
        │
        ▼
    Navigate to /stock/{ticker}
        │
        ▼
    StockDetail.useEffect() triggers
        │
        ├──────────────────────────────────────┐
        │                                      │
        ▼                                      ▼
   ┌────────────────┐                  ┌────────────────┐
   │ Promise.all([  │                  │ Set loading=   │
   │   getStock()   │                  │    true        │
   │   getScore()   │                  └────────────────┘
   │   getPrices()  │
   │ ])             │
   └────────────────┘
        │
        ├─── SUCCESS ──────────────────────────┐
        │                                      │
        │                                      ▼
        │                              ┌────────────────┐
        │                              │ setStock(data) │
        │                              │ setScore(data) │
        │                              │ setPrice(data) │
        │                              │ loading=false  │
        │                              └────────────────┘
        │                                      │
        │                                      ▼
        │                              ┌────────────────┐
        │                              │ Render Detail  │
        │                              │     Page       │
        │                              └────────────────┘
        │
        └─── FAILURE ──────────────────────────┐
                                               │
                                               ▼
                                       ┌────────────────┐
                                       │ setError(msg)  │
                                       │ loading=false  │
                                       └────────────────┘
                                               │
                                               ▼
                                       ┌────────────────┐
                                       │ Render Error   │
                                       │     State      │
                                       └────────────────┘
```

## API Design

### Stock Detail Page Endpoints

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/stocks/{ticker}` | GET | Get stock with fundamentals | `StockDetailResponse` |
| `/api/stocks/{ticker}/score-breakdown` | GET | Get detailed score analysis | `ScoreBreakdownResponse` |
| `/api/stocks/{ticker}/prices/historical` | GET | Get price history + indicators | `HistoricalPricesResponse` |

### Root Cause: API Contract Mismatch

**CRITICAL ISSUE IDENTIFIED**: The frontend and backend have incompatible pagination contracts.

#### Frontend Expectation (StockList.tsx:31-40)
```typescript
// Frontend sends:
const params = {
  page: currentPage,      // 1, 2, 3...
  page_size: pageSize,    // 12
  sector: selectedSector,
};

// Frontend expects response:
interface StockListResponse {
  items: Stock[];
  total: number;
  page: number;           // MISSING from backend
  page_size: number;      // MISSING from backend
  total_pages: number;    // MISSING from backend
}
```

#### Backend Implementation (router.py:30-71)
```python
# Backend accepts:
@router.get("/", response_model=StockListPaginatedResponse)
async def list_stocks(
    skip: int = Query(default=0),   # Different from 'page'
    limit: int = Query(default=100), # Different from 'page_size'
    ...
)

# Backend returns:
class StockListPaginatedResponse(BaseModel):
    items: List[StockListResponse]
    total: int
    skip: int              # Not 'page'
    limit: int             # Not 'page_size'
    has_more: bool         # Not 'total_pages'
```

#### Impact
1. `response.total_pages` is `undefined` in frontend
2. `setTotalPages(undefined)` causes pagination logic to fail
3. May cause runtime JavaScript errors that prevent rendering
4. Even if no crash, users see incorrect pagination behavior

### Proposed API Alignment Solution

**Approach: Backend Alignment (Recommended)**

Update backend to accept and return page-based pagination while maintaining backward compatibility:

```python
# Updated backend endpoint
@router.get("/", response_model=StockListPaginatedResponse)
async def list_stocks(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, le=100),
    sector: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    skip = (page - 1) * page_size
    total = repo.count(sector=sector)
    total_pages = (total + page_size - 1) // page_size  # ceiling division

    return StockListPaginatedResponse(
        items=stocks,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )
```

```python
# Updated schema
class StockListPaginatedResponse(BaseModel):
    items: List[StockListResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
```

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend Framework | React 18.3 + TypeScript | Modern, type-safe, component-based |
| Build Tool | Vite 6.0 | Fast HMR, ESM-native |
| Routing | React Router 6.28 | Standard SPA routing |
| HTTP Client | Axios 1.7 | Interceptors, error handling |
| State/Cache | TanStack Query 5.62 | Server state management |
| Styling | Tailwind CSS 3.4 | Utility-first, dark theme |
| Charts | Recharts | React-native charting |
| Backend Framework | FastAPI | Async, auto-docs, validation |
| ORM | SQLAlchemy 2.x | Mature, flexible ORM |
| Validation | Pydantic 2.x | Type-safe request/response |
| Database | SQLite/PostgreSQL | Simple dev, robust prod |

## Security Considerations

1. **Input Validation**: Ticker parameter validated server-side to prevent injection
2. **CORS**: Backend configured to allow only frontend origin
3. **Rate Limiting**: Consider adding for production to prevent API abuse
4. **Error Messages**: Don't expose internal stack traces to clients

## Performance Considerations

1. **Parallel API Calls**: StockDetail fetches 3 endpoints concurrently via `Promise.all()`
2. **Pagination**: Backend pagination prevents loading all stocks at once
3. **Lazy Loading**: Tab content rendered only when active
4. **Caching**: Consider adding React Query caching for repeated stock views

## Deployment Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        Development                              │
│                                                                 │
│   ┌─────────────────┐           ┌─────────────────────────┐    │
│   │  Vite Dev       │    API    │  Uvicorn Dev Server     │    │
│   │  localhost:5173 │ ◀──────▶  │  localhost:8000         │    │
│   └─────────────────┘           └─────────────────────────┘    │
│                                           │                     │
│                                           ▼                     │
│                                  ┌─────────────────┐           │
│                                  │ SQLite (file)   │           │
│                                  │ stockfinder.db  │           │
│                                  └─────────────────┘           │
└────────────────────────────────────────────────────────────────┘
```

## Architectural Decisions

### ADR-001: Backend Pagination Alignment
- **Status**: Proposed
- **Context**: Frontend uses page-based pagination (page, page_size, total_pages) but backend uses offset-based pagination (skip, limit, has_more). This mismatch causes undefined values in the frontend.
- **Decision**: Modify backend to accept and return page-based parameters while internally converting to offset-based queries.
- **Consequences**:
  - Frontend code requires no changes
  - Backend calculation overhead is minimal
  - API is more intuitive for consumers
  - Breaking change for any existing API consumers (none currently)

### ADR-002: Defensive Frontend Error Handling
- **Status**: Proposed
- **Context**: StockDetail component can show blank page if any of the 3 API calls fail or return malformed data.
- **Decision**: Add null checks and default values for all optional data. Show partial content when only some data is available.
- **Consequences**:
  - Users see meaningful content even with partial failures
  - More complex conditional rendering logic
  - Better user experience during API issues

### ADR-003: Consistent Loading State Theme
- **Status**: Proposed
- **Context**: Loading states should match the app's dark theme to prevent jarring visual transitions.
- **Decision**: All loading spinners use dark background (already implemented in StockDetail).
- **Consequences**:
  - Consistent visual experience
  - No "white flash" during page transitions
  - Already implemented - just needs verification

## Integration Points

| External System | Integration Method | Purpose |
|-----------------|-------------------|---------|
| Yahoo Finance API | HTTP (via PriceDataService) | Fetch historical prices |
| Browser localStorage | Direct access | Persist watchlists, learning progress |

## Migration Strategy

This is a **bug fix**, not a new system replacement. No data migration required.

### Implementation Order:
1. Fix backend pagination schema (ADR-001)
2. Add frontend defensive checks (ADR-002)
3. Verify loading state theming (ADR-003)
4. Test full user journey end-to-end

## Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `backend/app/features/stocks/schemas/__init__.py` | Modify | Update `StockListPaginatedResponse` to use page/page_size/total_pages |
| `backend/app/features/stocks/router.py` | Modify | Update list_stocks endpoint to accept page/page_size and calculate pagination |
| `frontend/src/types/stock.ts` | Verify | Ensure TypeScript types match new API response |
| `frontend/src/components/StockList.tsx` | Verify | Ensure component handles response correctly |

---
## Checklist
- [x] All PRD requirements addressable
- [x] Components clearly defined
- [x] Data models documented
- [x] API contracts specified
- [x] Technology choices justified
- [x] Security addressed
- [x] Performance considerations noted
- [x] Links back to PRD.md

## Traceability Matrix

| PRD Requirement | Architecture Component | ADR |
|-----------------|----------------------|-----|
| FR-01: Stock card navigation | Navigation flow, StockDetail | - |
| FR-02: Display stock overview | StockDetail + /stocks/{ticker} API | - |
| FR-03: Display score breakdown | ScoreBreakdown + /score-breakdown API | - |
| FR-04: Display price chart | PriceChart + /prices/historical API | - |
| FR-05: Loading state (dark) | StockDetail loading render | ADR-003 |
| FR-06: Error state | StockDetail error render | ADR-002 |
| FR-07: Tab navigation | StockDetail tab component | - |
| NFR-01: Load time < 2s | Promise.all parallel fetch | - |
| NFR-02: Graceful degradation | Defensive error handling | ADR-002 |
| NFR-03: No JS errors | Pagination fix | ADR-001 |
| NFR-04: Dark theme consistency | Loading/error states | ADR-003 |
