# Story: [STORY-013] Add Celery Background Jobs for Data Refresh

## Status
- [ ] Draft
- [x] Ready
- [ ] In Progress
- [ ] In Review
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
- [ ] Celery worker service added to docker-compose.yml
- [ ] Celery beat service added to docker-compose.yml
- [ ] Both services start with `docker-compose up`
- [ ] Celery worker shows as healthy/connected in logs
- [ ] `refresh_stock_data` task defined and registered
- [ ] `snapshot_daily_scores` task defined and registered
- [ ] `invalidate_cache` task defined and registered
- [ ] Market hours check function works correctly (US Eastern Time)
- [ ] Scheduled tasks appear in Celery Beat log output
- [ ] Manual task trigger works via Python shell
- [ ] Cache invalidated after data refresh
- [ ] Task failures logged with traceback
- [ ] Celery uses Redis as broker (from story-012)
- [ ] Volume mount enables hot reload for task code
- [ ] Flower monitoring available via `docker-compose --profile monitoring up`

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
<!-- Filled in by Dev during implementation -->

## QA Notes
<!-- Filled in by QA during review -->
