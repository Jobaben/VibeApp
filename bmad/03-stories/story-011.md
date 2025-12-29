# Story: [STORY-011] Auto-Seed Database on Docker Startup

## Status
- [ ] Draft
- [x] Ready
- [ ] In Progress
- [ ] In Review
- [ ] Done

## User Story
**As a** developer
**I want** the database to be seeded automatically when Docker starts
**So that** I can immediately test the app with sample data after running `docker-compose up`

## Description
Currently, running `docker-compose up` creates an empty database with no stock data. The API returns `{"items":[], "total":0}` and the frontend shows "No stocks found". A seed script exists (`backend/seed_data.py`) but requires manual execution.

This story adds automatic database seeding on Docker startup, ensuring developers have sample data immediately after `docker-compose up`.

## Acceptance Criteria
- [ ] Running `docker-compose up` on fresh environment results in seeded database
- [ ] Stocks API (`/api/stocks/`) returns sample data after startup
- [ ] Frontend displays stock list after Docker startup
- [ ] Seeding is idempotent (running multiple times doesn't create duplicates)
- [ ] Seed operation logs progress to container output
- [ ] Existing data is preserved (seed only adds missing stocks)

## Technical Notes

### Affected Components
- `Dockerfile.backend` - Add entrypoint script
- New file: `backend/entrypoint.sh` - Startup script that runs migrations and seeds
- `backend/seed_data.py` - Already idempotent (checks for existing stocks)

### Solution Approach
Create an entrypoint script that:
1. Waits for database to be ready (already handled by healthcheck)
2. Runs seed script on first startup
3. Starts uvicorn server

### Implementation Options

**Option A: Entrypoint Script (Recommended)**
```dockerfile
# Dockerfile.backend
COPY backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

```bash
# entrypoint.sh
#!/bin/bash
set -e

# Run seed script (idempotent - skips existing stocks)
python seed_data.py

# Execute the CMD
exec "$@"
```

**Option B: docker-compose command override**
```yaml
backend:
  command: >
    sh -c "python seed_data.py && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
```

### Data Changes
None - uses existing seed_data.py which populates:
- Stock table with sample stocks
- StockFundamental with financial data
- StockScore with calculated scores

## Dependencies
- story-009 (Docker documentation - completed)
- Existing `seed_data.py` script

## Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Fresh Docker setup | No postgres_data volume | `docker-compose up` | Database seeded with stocks |
| Existing data | Database already has stocks | `docker-compose up` | Existing stocks preserved, no duplicates |
| API check | Docker running | `curl /api/stocks/` | Returns non-empty items array |
| Frontend check | Docker running | Open localhost:3000 | Stock list displays |
| Logs | Docker starting | View backend logs | Seed progress visible |

## Estimation
- **Complexity**: S
- **Risk**: Low

## References
- PRD Section: FR-16, FR-17, AC-09
- Brief: `bmad/00-brief/brief-learning-mode-and-empty-stocks.md`
- Architecture: ADR-007 (Database Auto-Migration)

---
## Dev Notes
<!-- Filled in by Dev during implementation -->

## QA Notes
<!-- Filled in by QA during review -->
