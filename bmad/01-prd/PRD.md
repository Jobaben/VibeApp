# Product Requirements Document

## Overview

### Problem Summary
Users clicking on stock cards are navigated to a blank white page instead of seeing the expected stock detail view with charts, scores, and fundamental data. This blocks a core user journey in the application.

**Source**: [Brief](../00-brief/brief.md)

### Product Vision
Restore and ensure reliable stock detail page functionality so users can seamlessly view comprehensive stock information (overview, charts, fundamentals, and scoring) when clicking any stock card in the application.

## User Personas

### Persona 1: Retail Investor
- **Description**: Individual investor researching stocks for personal portfolio
- **Goals**:
  - View detailed stock information quickly
  - Analyze price history and trends
  - Understand stock scores and fundamentals
- **Pain Points**:
  - Cannot access stock details - sees blank white page
  - Core research workflow is completely blocked

### Persona 2: Casual Browser
- **Description**: User exploring stocks casually without investment intent
- **Goals**:
  - Browse and learn about different stocks
  - Compare stock performance
- **Pain Points**:
  - App appears broken when clicking stock cards
  - Poor user experience diminishes trust in platform

## Requirements

### Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-01 | Stock card click navigates to stock detail page | Critical | Currently broken - shows blank white page |
| FR-02 | Stock detail page displays stock overview information | Critical | Name, ticker, current price, daily change |
| FR-03 | Stock detail page displays score breakdown | High | Vibe score components and analysis |
| FR-04 | Stock detail page displays historical price chart | High | Interactive chart with price history |
| FR-05 | Stock detail page shows loading state during data fetch | High | Spinner with dark background (not white) |
| FR-06 | Stock detail page shows error state on API failure | High | Friendly error message with "Back to Home" button |
| FR-07 | All tabs (Overview, Charts, Fundamentals, Score) are functional | High | Tab navigation works correctly |

### Non-Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| NFR-01 | Page load time < 2 seconds on standard connection | High | Including API response time |
| NFR-02 | Graceful degradation on partial API failure | Medium | Show available data if some endpoints fail |
| NFR-03 | No JavaScript errors in browser console | Critical | React must not crash before render |
| NFR-04 | Consistent dark theme styling | Medium | Loading/error states match app theme |
| NFR-05 | Works across Chrome, Firefox, Safari browsers | Medium | Cross-browser compatibility |

## User Stories Overview

| ID | User Story | Priority |
|----|------------|----------|
| US-01 | As a retail investor, I want to click a stock card and see detailed information so I can make informed decisions | Critical |
| US-02 | As a user, I want to see a loading indicator while data fetches so I know the app is working | High |
| US-03 | As a user, I want to see a friendly error message if something goes wrong so I can take action | High |
| US-04 | As a user, I want to navigate between Overview, Charts, Fundamentals, and Score tabs so I can explore different aspects | High |

## Acceptance Criteria

### AC-01: Stock Card Navigation (FR-01)
- **Given** a user is on the stock list page
- **When** they click any stock card
- **Then** they are navigated to `/stock/{ticker}` showing the stock detail page (not a blank white page)

### AC-02: Stock Detail Content (FR-02, FR-03, FR-04)
- **Given** a user navigates to a stock detail page
- **When** the page loads successfully
- **Then** they see:
  - Stock name and ticker symbol
  - Current price and daily change
  - Score breakdown with vibe score
  - Historical price chart

### AC-03: Loading State (FR-05)
- **Given** a user navigates to a stock detail page
- **When** data is being fetched from API
- **Then** they see a loading spinner on a dark background (matching app theme)

### AC-04: Error State (FR-06)
- **Given** a user navigates to a stock detail page
- **When** the API returns an error
- **Then** they see a friendly error message with a "Back to Home" button

### AC-05: Tab Navigation (FR-07)
- **Given** a user is on the stock detail page
- **When** they click on any tab (Overview, Charts, Fundamentals, Score)
- **Then** the corresponding content is displayed

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| Backend API server running | Infrastructure | Required | Must serve `/stocks/{ticker}` endpoints |
| Database with stock data | Data | Required | Stocks must have scores and price history |
| Frontend dev server | Infrastructure | Required | Vite dev server or production build |
| API endpoints functional | Backend | Required | 3 endpoints: details, score-breakdown, prices/historical |

## Assumptions

1. The stock data exists in the database for stocks shown in the list
2. Backend API endpoints are correctly implemented (code review suggests they are)
3. The issue is a runtime/environment problem, not a fundamental code issue
4. CORS is properly configured for frontend-backend communication

## Open Questions

| # | Question | Impact | Status |
|---|----------|--------|--------|
| 1 | Is the backend server running when the blank page appears? | Critical | Needs verification |
| 2 | Are there JavaScript errors in browser console? | Critical | Needs verification |
| 3 | Does the network tab show failed API requests? | Critical | Needs verification |
| 4 | Is this reproducible with all stocks or specific ones? | Medium | Needs verification |

---
## Checklist
- [x] All functional requirements documented
- [x] Non-functional requirements defined
- [x] User personas identified
- [x] Acceptance criteria specified
- [x] Dependencies listed
- [x] Links back to brief.md
