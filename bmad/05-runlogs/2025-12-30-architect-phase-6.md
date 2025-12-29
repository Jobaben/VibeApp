# Runlog: Architect Session - Phase 6

**Date**: 2025-12-30
**Role**: Architect
**Phase**: 6 - Polish & Deploy

## Session Summary

Designed technical architecture for Phase 6 production-readiness features, focusing on Redis caching and Celery background jobs integrated into docker-compose.

## Inputs

- `bmad/01-prd/PRD.md` (Phase 6 addendum)
- Existing codebase exploration:
  - `docker-compose.yml`
  - `backend/app/config.py`
  - `backend/app/features/stocks/router.py`
  - `backend/requirements.txt`

## Outputs

- Updated `bmad/02-architecture/ARCHITECTURE.md` with Phase 6 addendum

## Key Architectural Decisions

| ADR | Decision | Rationale |
|-----|----------|-----------|
| ADR-008 | Redis as both cache and Celery broker | Single service, simpler config |
| ADR-009 | Tiered TTL strategy (5-15 min) | Balance freshness vs performance |
| ADR-010 | Market hours scheduling | Save API quota, data static when closed |
| ADR-011 | Celery worker hot reload via volume mount | Development experience |
| ADR-012 | Flower as optional profile | Reduce resource usage by default |
| ADR-013 | Sentry via optional env var | Graceful degradation |

## New Docker Services Designed

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| redis | redis:7-alpine | 6379 | Cache + Celery broker |
| celery-worker | python:3.11-slim | - | Background task executor |
| celery-beat | python:3.11-slim | - | Task scheduler |
| flower | mher/flower | 5555 | Monitoring (optional) |

## Cache Strategy

| Endpoint Type | TTL | Key Pattern |
|---------------|-----|-------------|
| Stock list/detail | 5 min | `stocks:list:*`, `stocks:detail:{ticker}` |
| Scores/leaderboard | 10-15 min | `stocks:score:*`, `leaderboard:*` |
| Screener results | 10 min | `screener:{strategy}` |

## Celery Tasks Designed

1. **refresh_stock_data** - Hourly during market hours (9:30 AM - 4:00 PM ET, Mon-Fri)
2. **snapshot_daily_scores** - Daily at 4:30 PM ET after market close
3. **invalidate_cache** - On-demand cache invalidation

## File Structure Changes

```
backend/app/
├── infrastructure/cache/     # NEW: Redis caching
│   ├── __init__.py
│   ├── redis_cache.py
│   └── cache_keys.py
└── tasks/                    # NEW: Celery tasks
    ├── __init__.py
    ├── celery_app.py
    ├── stock_tasks.py
    ├── score_tasks.py
    └── market_hours.py
```

## Open Questions Answered

| Question | Answer |
|----------|--------|
| Flower dashboard exposed externally? | No, use Docker profile for opt-in |
| Cache TTL for different data types? | Tiered: 5 min (volatile) to 15 min (stable) |

## Traceability

All PRD requirements (FR-18 to FR-25, NFR-07 to NFR-12) mapped to architecture components.

## Handoff

Recommended next step: `/scrum` to create implementation stories for Phase 6.
