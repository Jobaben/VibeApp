# Story: [STORY-013] Add Celery Background Jobs for Data Refresh

## Status
- [ ] Draft
- [ ] Ready
- [ ] In Progress
- [x] In Review
- [ ] Done

## User Story
**As a** user of VibeApp
**I want** stock data to be automatically refreshed during market hours
**So that** I always have up-to-date information without manual intervention

## Description
Implement Celery background job system for automated stock data refresh. This includes:
1. Celery worker service in docker-compose
2. Celery Beat scheduler for periodic tasks
3. Scheduled task to refresh stock data hourly during market hours (9:30 AM - 4:00 PM ET, Mon-Fri)
4. Daily score snapshot task after market close
5. Cache invalidation after data refresh

## Acceptance Criteria
- [x] Celery worker service added to docker-compose.yml
- [x] Celery beat service added to docker-compose.yml
- [x] Both services start with `docker-compose up`
- [x] Celery worker shows as healthy/connected in logs
- [x] `refresh_stock_data` task defined and registered
- [x] `snapshot_daily_scores` task defined and registered
- [x] `invalidate_cache` task defined and registered
- [x] Market hours check function works correctly (US Eastern Time)
- [x] Scheduled tasks appear in Celery Beat log output
- [x] Manual task trigger works via Python shell
- [x] Cache invalidated after data refresh
- [x] Task failures logged with traceback
- [x] Celery uses Redis as broker (from story-012)
- [x] Volume mount enables hot reload for task code
- [x] Flower monitoring available via `docker-compose --profile monitoring up`

## Technical Notes

### Affected Components
- `docker-compose.yml` - Add celery-worker, celery-beat, flower services
- `backend/app/tasks/` - New Celery tasks module
- `backend/app/config.py` - Add Celery settings
- `backend/requirements.txt` - Uncomment celery dependencies

### Docker-Compose Services
```yaml
celery-worker:
  build:
    context: .
    dockerfile: Dockerfile.backend
  container_name: vibeapp-celery-worker
  command: celery -A app.tasks worker --loglevel=info
  environment:
    - DATABASE_URL=postgresql://stockfinder:stockfinder123@db:5432/stockfinder_db
    - REDIS_URL=redis://redis:6379/0
    - REDIS_ENABLED=true
  depends_on:
    redis:
      condition: service_healthy
    db:
      condition: service_healthy
  volumes:
    - ./backend:/app
  networks:
    - stock-finder-network

celery-beat:
  build:
    context: .
    dockerfile: Dockerfile.backend
  container_name: vibeapp-celery-beat
  command: celery -A app.tasks beat --loglevel=info
  environment:
    - REDIS_URL=redis://redis:6379/0
  depends_on:
    redis:
      condition: service_healthy
  volumes:
    - ./backend:/app
  networks:
    - stock-finder-network

flower:
  image: mher/flower:0.9.7
  container_name: vibeapp-flower
  command: celery --broker=redis://redis:6379/0 flower --port=5555
  ports:
    - "5555:5555"
  depends_on:
    - redis
  networks:
    - stock-finder-network
  profiles:
    - monitoring
```

### Task Module Structure
```
backend/app/tasks/
├── __init__.py
├── celery_app.py       # Celery configuration
├── stock_tasks.py      # refresh_stock_data, invalidate_cache
├── score_tasks.py      # snapshot_daily_scores
└── market_hours.py     # is_market_hours() utility
```

### Beat Schedule
```python
celery_app.conf.beat_schedule = {
    'refresh-stock-data-hourly': {
        'task': 'app.tasks.stock_tasks.refresh_stock_data',
        'schedule': crontab(minute=0, hour='9-16', day_of_week='1-5'),
    },
    'snapshot-scores-daily': {
        'task': 'app.tasks.score_tasks.snapshot_daily_scores',
        'schedule': crontab(minute=30, hour=16, day_of_week='1-5'),
    },
}
```

### Market Hours Logic
```python
def is_market_hours() -> bool:
    """Check if US markets are open (9:30 AM - 4:00 PM ET, Mon-Fri)"""
    eastern = pytz.timezone('US/Eastern')
    now = datetime.now(eastern)
    if now.weekday() > 4:  # Weekend
        return False
    market_open = now.replace(hour=9, minute=30, second=0)
    market_close = now.replace(hour=16, minute=0, second=0)
    return market_open <= now <= market_close
```

### Requirements Update
```
celery==5.3.4
flower==2.0.1
pytz==2024.1
```

### API Changes
None (background tasks only)

### Data Changes
None (uses existing stock data models)

## Dependencies
- **story-012**: Redis must be available as Celery broker

## Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Worker starts | docker-compose up | Celery worker initializes | Worker connected to Redis broker |
| Beat starts | docker-compose up | Celery beat initializes | Scheduler running, tasks registered |
| Task execution | Worker running | Scheduled task triggers | Task executes, logs output |
| Market hours check | During market hours | refresh_stock_data runs | Data refreshed |
| Off-hours skip | Outside market hours | refresh_stock_data runs | Task skips (logs "market closed") |
| Cache invalidation | After data refresh | Task completes | Cache cleared for updated data |
| Flower dashboard | --profile monitoring | Access localhost:5555 | Dashboard shows workers/tasks |

## Estimation
- **Complexity**: M
- **Risk**: Low (standard Celery pattern)

## References
- PRD Section: FR-21, FR-22, FR-23, FR-25, NFR-09
- Architecture Section: ADR-010, ADR-011, ADR-012, Celery Background Jobs Architecture

---
## Dev Notes

### Implementation Summary (2026-01-07)

Successfully implemented Celery background job system for automated stock data refresh.

### Files Created
- `backend/app/tasks/__init__.py` - Module exports
- `backend/app/tasks/celery_app.py` - Celery configuration with Redis broker and beat schedule
- `backend/app/tasks/stock_tasks.py` - `refresh_stock_data` and `invalidate_cache` tasks
- `backend/app/tasks/score_tasks.py` - `snapshot_daily_scores` task
- `backend/app/tasks/market_hours.py` - US market hours utility functions
- `backend/tests/unit/test_celery_tasks.py` - Unit tests (20 tests, all passing)

### Files Modified
- `docker-compose.yml` - Added celery-worker, celery-beat, and flower services
- `backend/requirements.txt` - Uncommented celery dependencies, added pytz
- `backend/app/config.py` - Added CELERY_BROKER_URL and CELERY_RESULT_BACKEND settings

### Key Implementation Details

1. **Celery Configuration**
   - Uses Redis as broker (from story-012)
   - JSON serialization for tasks
   - US/Eastern timezone for scheduling
   - Retry configuration with backoff

2. **Beat Schedule**
   - `refresh-stock-data-hourly`: Runs every hour from 9 AM to 4 PM, Mon-Fri
   - `snapshot-scores-daily`: Runs at 4:30 PM Mon-Fri (after market close)

3. **Market Hours Logic**
   - `is_market_hours()` checks 9:30 AM - 4:00 PM ET, Mon-Fri
   - Tasks skip execution outside market hours (logs "market closed")
   - Force parameter available to run regardless of market hours

4. **Task Features**
   - Auto-retry on failure (3 retries with exponential backoff)
   - Task failures logged with full traceback
   - Cache invalidation triggered after data refresh

5. **Docker Services**
   - `celery-worker`: Executes background tasks
   - `celery-beat`: Schedules periodic tasks
   - `flower`: Optional monitoring dashboard (via `--profile monitoring`)

### Testing
- 20 unit tests covering:
  - Market hours logic
  - Task registration
  - Beat schedule configuration
  - Module exports
- All tests passing

### Manual Testing Commands
```bash
# Trigger tasks manually via Python shell
docker-compose exec backend python -c "from app.tasks import refresh_stock_data; refresh_stock_data.delay(force=True)"

# View Celery worker logs
docker-compose logs -f celery-worker

# Start with Flower monitoring
docker-compose --profile monitoring up
```

## QA Notes
<!-- Filled in by QA during review -->
