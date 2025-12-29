# Architecture Document

## Overview

This architecture document addresses **Docker containerization** for VibeApp as described in [PRD](../01-prd/PRD.md). The goal is to enable a single-command development environment setup via `docker-compose up`.

### System Context

VibeApp is a full-stack AI-powered stock analysis platform consisting of:
- **Frontend**: React 18 + TypeScript SPA with Vite
- **Backend**: FastAPI + SQLAlchemy REST API
- **Database**: SQLite (current dev) / PostgreSQL (Docker)

The Docker setup will provide isolated, reproducible development environments.

### Design Principles

1. **Zero Configuration**: `docker-compose up` should work after fresh clone
2. **Development First**: Optimize for developer experience (hot reload, fast startup)
3. **Minimal Changes**: Fix existing Docker scaffolding rather than rewrite
4. **Parity**: Container environment should behave like local development

## Architecture

### Container Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HOST MACHINE                                       │
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                    Docker Compose Network                              │ │
│   │                    (stock-finder-network)                              │ │
│   │                                                                        │ │
│   │   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │ │
│   │   │   frontend      │    │   backend       │    │       db        │  │ │
│   │   │   (Node 22)     │    │   (Python 3.11) │    │  (PostgreSQL)   │  │ │
│   │   │                 │    │                 │    │                 │  │ │
│   │   │  Vite Dev       │───▶│  FastAPI        │───▶│  Data Storage   │  │ │
│   │   │  Server         │    │  + Uvicorn      │    │                 │  │ │
│   │   │                 │    │                 │    │                 │  │ │
│   │   │  Port: 3000     │    │  Port: 8000     │    │  Port: 5432     │  │ │
│   │   └────────┬────────┘    └────────┬────────┘    └────────┬────────┘  │ │
│   │            │                      │                      │           │ │
│   │            ▼                      ▼                      ▼           │ │
│   │   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │ │
│   │   │  Volume Mount   │    │  Volume Mount   │    │  Named Volume   │  │ │
│   │   │  ./frontend:/app│    │  ./backend:/app │    │  postgres_data  │  │ │
│   │   │  (hot reload)   │    │  (hot reload)   │    │  (persistence)  │  │ │
│   │   └─────────────────┘    └─────────────────┘    └─────────────────┘  │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   Exposed Ports:                                                             │
│   • http://localhost:3000 → Frontend                                         │
│   • http://localhost:8000 → Backend API                                      │
│   • localhost:5432        → PostgreSQL (optional direct access)              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Descriptions

| Component | Responsibility | Base Image | Exposed Port |
|-----------|---------------|------------|--------------|
| frontend | Serve React dev server with HMR | node:22-alpine | 3000 |
| backend | Serve FastAPI REST API | python:3.11-slim | 8000 |
| db | PostgreSQL database | postgres:16-alpine | 5432 |

### Service Dependencies

```
                ┌─────────┐
                │   db    │
                └────┬────┘
                     │
         ┌───────────┴───────────┐
         │  depends_on:          │
         │  condition:           │
         │  service_healthy      │
         ▼                       │
    ┌─────────┐                  │
    │ backend │                  │
    └────┬────┘                  │
         │                       │
         │  depends_on:          │
         │  backend              │
         ▼                       │
    ┌──────────┐                 │
    │ frontend │                 │
    └──────────┘                 │
```

## Data Design

### Volume Strategy

| Volume | Type | Purpose | Persistence |
|--------|------|---------|-------------|
| `./frontend:/app` | Bind mount | Hot reload for frontend code | Host filesystem |
| `./backend:/app` | Bind mount | Hot reload for backend code | Host filesystem |
| `/app/node_modules` | Anonymous | Isolate container node_modules | Container only |
| `postgres_data` | Named volume | PostgreSQL data persistence | Survives `docker-compose down` |

### Database Configuration

The backend will use PostgreSQL when running in Docker (via `DATABASE_URL` environment variable), falling back to SQLite for non-Docker development.

```
Docker:     DATABASE_URL=postgresql://stockfinder:stockfinder123@db:5432/stockfinder_db
Non-Docker: DATABASE_URL=sqlite:///./stockfinder.db (default in config.py)
```

## Technology Stack

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| Container Runtime | Docker | 20.10+ | Industry standard |
| Orchestration | Docker Compose | 2.x | Multi-container dev environments |
| Frontend Base | node:22-alpine | 22.x | Matches package.json engine requirement |
| Backend Base | python:3.11-slim | 3.11 | Matches requirements.txt compatibility |
| Database | postgres:16-alpine | 16 | Production-grade, matches existing schema |

## Architectural Decisions

### ADR-001: Exclude Redis from Default Setup
- **Status**: Accepted
- **Context**: The existing docker-compose.yml includes Redis, but `config.py` shows `REDIS_ENABLED: bool = False` by default. Redis adds startup complexity without benefit for basic development.
- **Decision**: Remove Redis service from docker-compose.yml for simplicity.
- **Consequences**:
  - Faster startup (fewer containers)
  - Simpler dependencies
  - Redis can be added back when caching is implemented
  - Backend already handles `REDIS_ENABLED=False`

### ADR-002: Use Bind Mounts for Hot Reload
- **Status**: Accepted
- **Context**: Developers expect code changes to reflect immediately without rebuilding containers.
- **Decision**: Mount `./frontend:/app` and `./backend:/app` as bind mounts.
- **Consequences**:
  - Changes reflect immediately via Vite HMR and uvicorn --reload
  - Slight filesystem overhead on macOS/Windows
  - Need to handle node_modules isolation

### ADR-003: Anonymous Volume for node_modules
- **Status**: Accepted
- **Context**: Bind mounting frontend/ would overwrite container's node_modules with host's (which may be empty or incompatible).
- **Decision**: Use anonymous volume `/app/node_modules` to preserve container's installed dependencies.
- **Consequences**:
  - Container node_modules isolated from host
  - `npm install` runs at build time, not runtime
  - Adding new dependencies requires container rebuild

### ADR-004: Health Checks for Startup Order
- **Status**: Accepted
- **Context**: Backend needs database ready before starting. Simple `depends_on` only waits for container start, not service readiness.
- **Decision**: Use health checks with `condition: service_healthy`.
- **Consequences**:
  - Backend waits for PostgreSQL to accept connections
  - Slightly longer initial startup
  - More reliable startup sequence

### ADR-005: Fix .dockerignore to Not Exclude Dockerfiles
- **Status**: Accepted
- **Context**: Current `.dockerignore` excludes `Dockerfile*` and `docker-compose*`, which is incorrect as these are needed in the build context.
- **Decision**: Remove these exclusions from `.dockerignore`.
- **Consequences**:
  - Docker build works correctly
  - Slightly larger build context (negligible)

### ADR-006: Use yarn in Frontend Dockerfile
- **Status**: Accepted
- **Context**: Frontend Dockerfile uses `npm install` but project uses yarn (yarn.lock exists in root).
- **Decision**: Update Dockerfile to use `yarn install` to match project conventions.
- **Consequences**:
  - Consistent with project's package manager
  - Respects yarn.lock for deterministic installs

### ADR-007: Database Auto-Migration
- **Status**: Accepted
- **Context**: Backend uses `Base.metadata.create_all(bind=engine)` in main.py which auto-creates tables.
- **Decision**: Rely on existing auto-migration for development. No additional migration scripts needed.
- **Consequences**:
  - Zero-config database setup
  - Tables created on first backend startup
  - Sufficient for development (production would need proper migrations)

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docker-compose.yml` | Modify | Remove Redis, fix environment variables |
| `Dockerfile.backend` | Modify | Add curl for healthcheck, verify paths |
| `Dockerfile.frontend` | Modify | Use yarn instead of npm, fix CMD |
| `.dockerignore` | Modify | Remove Dockerfile*/docker-compose* exclusions |
| `README.md` | Modify | Add Docker usage section |

## Detailed Changes

### docker-compose.yml Changes

```yaml
# REMOVE: Redis service (per ADR-001)
# KEEP: db, backend, frontend services
# FIX: Backend healthcheck needs curl installed
# FIX: Frontend VITE_API_URL for browser access
```

### Dockerfile.backend Changes

```dockerfile
# ADD: curl for healthcheck
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \              # <-- ADD THIS
    && rm -rf /var/lib/apt/lists/*
```

### Dockerfile.frontend Changes

```dockerfile
# CHANGE: npm → yarn
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install

# FIX: CMD syntax for Vite host binding
CMD ["yarn", "dev", "--host"]
```

### .dockerignore Changes

```
# REMOVE these lines:
Dockerfile*
docker-compose*
.dockerignore
```

## Security Considerations

1. **Database Credentials**: Using hardcoded dev credentials (acceptable for local dev only)
2. **Port Exposure**: Database port exposed for dev convenience; would be internal-only in production
3. **No Secrets in Images**: Credentials passed via environment variables, not baked into images

## Performance Considerations

1. **Alpine Images**: Using alpine variants for smaller image sizes
2. **Layer Caching**: Dependencies installed before code copy to leverage Docker cache
3. **Bind Mount Performance**: May be slower on macOS; consider docker-sync if needed
4. **Health Check Intervals**: Balanced between responsiveness and resource usage

## Startup Sequence

```
1. docker-compose up
   │
   ├─► db container starts
   │   └─► PostgreSQL initializes (creates database)
   │       └─► Healthcheck: pg_isready
   │           └─► Status: healthy
   │
   ├─► backend container starts (waits for db healthy)
   │   └─► pip install (cached from image)
   │       └─► uvicorn starts
   │           └─► create_all() creates tables
   │               └─► Healthcheck: curl /health
   │                   └─► Status: healthy
   │
   └─► frontend container starts (after backend)
       └─► yarn dev --host
           └─► Vite dev server on port 3000
               └─► Ready for browser access
```

## Verification Checklist

After implementation, verify:

- [ ] `docker-compose up` completes without errors
- [ ] http://localhost:3000 shows frontend
- [ ] http://localhost:8000/health returns `{"status": "healthy"}`
- [ ] http://localhost:8000/docs shows Swagger UI
- [ ] Frontend can fetch stock data from backend
- [ ] Editing `frontend/src/**/*.tsx` triggers hot reload
- [ ] Editing `backend/**/*.py` triggers uvicorn reload
- [ ] `docker-compose down && docker-compose up` preserves database data

---
## Checklist
- [x] All PRD requirements addressable
- [x] Components clearly defined
- [x] Data models documented (volumes)
- [x] API contracts specified (port/service mapping)
- [x] Technology choices justified
- [x] Security addressed
- [x] Performance considerations noted
- [x] Links back to PRD.md

## Traceability Matrix

| PRD Requirement | Architecture Component | ADR |
|-----------------|----------------------|-----|
| FR-01: Single command startup | docker-compose.yml | - |
| FR-02: Build backend container | Dockerfile.backend | ADR-006 |
| FR-03: Build frontend container | Dockerfile.frontend | ADR-006 |
| FR-04: Provision database | db service | ADR-001 |
| FR-05: Backend-database connection | DATABASE_URL env var | ADR-007 |
| FR-06: Frontend on port 3000 | frontend service ports | - |
| FR-07: Backend on port 8000 | backend service ports | - |
| FR-08: Frontend-backend communication | Docker network | - |
| FR-09: Backend hot reload | Volume mount + --reload | ADR-002 |
| FR-10: Frontend hot reload | Volume mount + Vite HMR | ADR-002, ADR-003 |
| FR-11: Database persistence | postgres_data volume | - |
| FR-12: Health checks | service healthchecks | ADR-004 |
| FR-13: Startup order | depends_on + condition | ADR-004 |
| NFR-01: Build time < 5min | Alpine images, layer caching | - |
| NFR-03: Cross-platform | Docker abstraction | - |
| NFR-05: Documentation | README.md update | - |

---

## Addendum: Phase 6 - Polish & Deploy (2025-12-30)

This addendum addresses **Phase 6 production-readiness** requirements from [PRD](../01-prd/PRD.md). The primary focus is Redis caching and Celery background jobs, integrated into the existing docker-compose setup.

### System Context (Phase 6)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              PHASE 6 ARCHITECTURE                                    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                         Docker Compose Network                                   ││
│  │                                                                                  ││
│  │   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐     ││
│  │   │ frontend │   │ backend  │   │    db    │   │  redis   │   │  celery  │     ││
│  │   │          │   │          │   │          │   │          │   │  worker  │     ││
│  │   │  Vite    │──▶│ FastAPI  │──▶│PostgreSQL│   │  Cache   │   │          │     ││
│  │   │  :3000   │   │  :8000   │──▶│  :5432   │   │  :6379   │   │  Tasks   │     ││
│  │   └──────────┘   └────┬─────┘   └──────────┘   └────▲─────┘   └────┬─────┘     ││
│  │                       │                              │              │           ││
│  │                       └──────────────────────────────┴──────────────┘           ││
│  │                              Redis (Cache + Broker)                              ││
│  │                                                                                  ││
│  │   Optional:                                                                      ││
│  │   ┌──────────┐   ┌──────────┐                                                   ││
│  │   │  flower  │   │  sentry  │                                                   ││
│  │   │  :5555   │   │ (cloud)  │                                                   ││
│  │   └──────────┘   └──────────┘                                                   ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  Exposed Ports:                                                                      │
│  • http://localhost:3000 → Frontend                                                 │
│  • http://localhost:8000 → Backend API                                              │
│  • http://localhost:5555 → Flower Dashboard (optional)                              │
│  • localhost:6379        → Redis (internal)                                         │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Component Descriptions (Phase 6)

| Component | Responsibility | Base Image | Port | New? |
|-----------|---------------|------------|------|------|
| redis | Cache + Celery broker | redis:7-alpine | 6379 | Yes |
| celery-worker | Background job execution | python:3.11-slim | - | Yes |
| celery-beat | Scheduled task scheduler | python:3.11-slim | - | Yes |
| flower | Task monitoring dashboard | mher/flower | 5555 | Yes (optional) |

### Redis Caching Architecture

#### Cache Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                     CACHING ARCHITECTURE                         │
│                                                                  │
│  Request Flow:                                                   │
│                                                                  │
│  Client ──▶ FastAPI Endpoint ──▶ Cache Check ──▶ Response        │
│                                      │                           │
│                              ┌───────┴───────┐                   │
│                              │               │                   │
│                           HIT ↓           MISS ↓                 │
│                              │               │                   │
│                     Return cached      Query Database            │
│                        data              + Cache result          │
│                                                                  │
│  Cache Keys:                                                     │
│  • stocks:list:{page}:{size}:{filters}                           │
│  • stocks:detail:{ticker}                                        │
│  • stocks:score:{ticker}                                         │
│  • stocks:leaderboard:{limit}:{sector}                           │
│  • screener:{strategy}:{limit}                                   │
│                                                                  │
│  TTL Configuration:                                              │
│  • Stock list: 5 minutes                                         │
│  • Stock detail: 5 minutes                                       │
│  • Scores: 15 minutes                                            │
│  • Leaderboard: 10 minutes                                       │
│  • Screener results: 10 minutes                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Cache Implementation Pattern

```python
# Pattern: FastAPI dependency with Redis caching
# File: backend/app/infrastructure/cache/redis_cache.py

from redis import Redis
from functools import wraps
import json
import hashlib

class CacheService:
    def __init__(self, redis_url: str):
        self.redis = Redis.from_url(redis_url, decode_responses=True)

    def get(self, key: str) -> Optional[dict]:
        data = self.redis.get(key)
        return json.loads(data) if data else None

    def set(self, key: str, value: dict, ttl_seconds: int = 300):
        self.redis.setex(key, ttl_seconds, json.dumps(value))

    def invalidate(self, pattern: str):
        """Invalidate all keys matching pattern (e.g., 'stocks:*')"""
        for key in self.redis.scan_iter(match=pattern):
            self.redis.delete(key)
```

#### Endpoints to Cache (High Value)

| Endpoint | Cache Key Pattern | TTL | Invalidation Trigger |
|----------|-------------------|-----|----------------------|
| GET /api/stocks/ | `stocks:list:{hash(params)}` | 5 min | Data refresh job |
| GET /api/stocks/{ticker} | `stocks:detail:{ticker}` | 5 min | Data refresh job |
| GET /api/stocks/top | `stocks:top:{limit}` | 10 min | Score calculation |
| GET /api/stocks/leaderboard/top | `leaderboard:{limit}:{sector}` | 10 min | Score calculation |
| GET /api/stocks/screener/strategies/* | `screener:{strategy}` | 10 min | Data refresh job |

### Celery Background Jobs Architecture

#### Task Queue Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    CELERY TASK ARCHITECTURE                      │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │ Celery Beat  │────▶│    Redis     │────▶│Celery Worker │     │
│  │  (Scheduler) │     │   (Broker)   │     │  (Executor)  │     │
│  └──────────────┘     └──────────────┘     └──────────────┘     │
│         │                                          │             │
│         ▼                                          ▼             │
│  ┌──────────────┐                         ┌──────────────┐      │
│  │   Schedule   │                         │    Tasks     │      │
│  │              │                         │              │      │
│  │ • refresh_   │                         │ • Fetch FMP  │      │
│  │   stock_data │                         │ • Update DB  │      │
│  │   @hourly    │                         │ • Invalidate │      │
│  │   (market    │                         │   cache      │      │
│  │   hours)     │                         │ • Calculate  │      │
│  │              │                         │   scores     │      │
│  │ • snapshot_  │                         │              │      │
│  │   scores     │                         │              │      │
│  │   @daily     │                         │              │      │
│  └──────────────┘                         └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

#### Task Definitions

```python
# File: backend/app/tasks/stock_tasks.py

from celery import Celery
from celery.schedules import crontab

celery_app = Celery('vibeapp', broker='redis://redis:6379/0')

@celery_app.task
def refresh_stock_data():
    """
    Fetch latest stock data from FMP API.
    Runs hourly during market hours (9:30 AM - 4:00 PM ET, Mon-Fri).
    """
    # 1. Check if market hours
    # 2. Fetch data from FMP API
    # 3. Update database
    # 4. Recalculate scores
    # 5. Invalidate cache
    pass

@celery_app.task
def snapshot_daily_scores():
    """
    Create daily snapshot of all stock scores for historical tracking.
    Runs once daily after market close.
    """
    pass

@celery_app.task
def invalidate_cache(pattern: str = "stocks:*"):
    """
    Invalidate cache entries matching pattern.
    Called after data refresh.
    """
    pass

# Beat schedule
celery_app.conf.beat_schedule = {
    'refresh-stock-data-hourly': {
        'task': 'app.tasks.stock_tasks.refresh_stock_data',
        'schedule': crontab(minute=0, hour='9-16', day_of_week='1-5'),  # Mon-Fri, 9AM-4PM
    },
    'snapshot-scores-daily': {
        'task': 'app.tasks.stock_tasks.snapshot_daily_scores',
        'schedule': crontab(minute=30, hour=16, day_of_week='1-5'),  # 4:30 PM Mon-Fri
    },
}
```

#### Market Hours Logic

```python
# File: backend/app/tasks/market_hours.py

from datetime import datetime
import pytz

def is_market_hours() -> bool:
    """Check if US markets are open."""
    eastern = pytz.timezone('US/Eastern')
    now = datetime.now(eastern)

    # Check if weekday (Mon=0, Fri=4)
    if now.weekday() > 4:
        return False

    # Check if between 9:30 AM and 4:00 PM ET
    market_open = now.replace(hour=9, minute=30, second=0)
    market_close = now.replace(hour=16, minute=0, second=0)

    return market_open <= now <= market_close
```

### Docker Compose Integration

#### Updated docker-compose.yml Structure

```yaml
# New services to add to docker-compose.yml

services:
  # ... existing services (db, backend, frontend) ...

  redis:
    image: redis:7-alpine
    container_name: vibeapp-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - stock-finder-network

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
      - DATABASE_URL=postgresql://stockfinder:stockfinder123@db:5432/stockfinder_db
      - REDIS_URL=redis://redis:6379/0
      - REDIS_ENABLED=true
    depends_on:
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app
    networks:
      - stock-finder-network

  # Optional: Flower dashboard for monitoring
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
      - monitoring  # Only starts with: docker-compose --profile monitoring up

volumes:
  postgres_data:
  redis_data:
```

#### Service Dependency Graph

```
                    ┌────────┐
                    │   db   │
                    └───┬────┘
                        │
            ┌───────────┼───────────┐
            │           │           │
            ▼           │           ▼
       ┌────────┐       │      ┌─────────┐
       │ redis  │       │      │ backend │
       └───┬────┘       │      └────┬────┘
           │            │           │
    ┌──────┼──────┐     │           │
    │      │      │     │           │
    ▼      ▼      ▼     │           ▼
┌──────┐┌──────┐┌──────┐│      ┌──────────┐
│celery││celery││flower││      │ frontend │
│worker││ beat ││      ││      │          │
└──────┘└──────┘└──────┘│      └──────────┘
                        │
                        └── depends_on: db
```

### Architectural Decisions (Phase 6)

#### ADR-008: Redis as Both Cache and Celery Broker

- **Status**: Accepted
- **Context**: Phase 6 requires both caching (FR-18) and background jobs (FR-21). These typically use Redis and RabbitMQ respectively.
- **Decision**: Use Redis for both caching AND as Celery message broker.
- **Consequences**:
  - Single additional service instead of two
  - Simpler docker-compose configuration
  - Redis handles both use cases well at our scale
  - Would need to separate at very high scale (not a concern for MVP)

#### ADR-009: Cache TTL Strategy

- **Status**: Accepted
- **Context**: Need to balance freshness (FR-20) with performance (NFR-07).
- **Decision**: Use tiered TTLs based on data volatility:
  - Stock lists/detail: 5 minutes (changes with market)
  - Scores/leaderboards: 10-15 minutes (calculated periodically)
  - Screener results: 10 minutes (based on cached scores)
- **Consequences**:
  - Fresh data within reasonable window
  - High cache hit rate (>80% target per NFR-08)
  - Background job invalidates cache on refresh

#### ADR-010: Market Hours Scheduling

- **Status**: Accepted
- **Context**: Background jobs should only refresh during market hours (FR-22).
- **Decision**: Use Celery Beat with crontab schedule for 9:30 AM - 4:00 PM ET, Mon-Fri.
- **Consequences**:
  - No unnecessary API calls during off-hours
  - Saves FMP API quota
  - Data remains static when markets are closed
  - Additional market hours check in task for holidays

#### ADR-011: Celery Worker Hot Reload

- **Status**: Accepted
- **Context**: Development experience requires hot reload (NFR-12).
- **Decision**: Mount backend volume to Celery worker, use `watchmedo` or restart on file change.
- **Consequences**:
  - Code changes reflect in worker
  - May need to restart worker for some changes
  - Use `docker-compose restart celery-worker` if needed

#### ADR-012: Flower as Optional Profile

- **Status**: Accepted
- **Context**: Flower dashboard is nice-to-have (FR-25) but adds complexity.
- **Decision**: Use Docker Compose profiles to make Flower optional.
- **Consequences**:
  - Default `docker-compose up` doesn't start Flower
  - Use `docker-compose --profile monitoring up` when needed
  - Reduces resource usage for basic development

#### ADR-013: Sentry Integration Pattern

- **Status**: Accepted
- **Context**: Error tracking (FR-24) should be optional with graceful degradation.
- **Decision**: Check for `SENTRY_DSN` env var; if missing, skip Sentry initialization.
- **Consequences**:
  - App works without Sentry account
  - Easy to enable by setting env var
  - No code changes needed to toggle

### File Structure (Phase 6)

```
backend/
├── app/
│   ├── infrastructure/
│   │   ├── cache/                  # NEW: Redis caching
│   │   │   ├── __init__.py
│   │   │   ├── redis_cache.py      # Cache service
│   │   │   └── cache_keys.py       # Key generation helpers
│   │   └── ...
│   │
│   ├── tasks/                      # NEW: Celery tasks
│   │   ├── __init__.py
│   │   ├── celery_app.py           # Celery configuration
│   │   ├── stock_tasks.py          # Stock refresh tasks
│   │   ├── score_tasks.py          # Score calculation tasks
│   │   └── market_hours.py         # Market hours utilities
│   │
│   └── config.py                   # Updated with Redis/Celery settings
│
├── requirements.txt                # Updated with celery, flower deps
└── ...
```

### Configuration Updates

```python
# Updated config.py additions

class Settings(BaseSettings):
    # ... existing settings ...

    # Redis (updated)
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = False  # Enable when Redis is available
    CACHE_TTL_DEFAULT: int = 300  # 5 minutes
    CACHE_TTL_SCORES: int = 900   # 15 minutes

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # Sentry (optional)
    SENTRY_DSN: str = ""  # Empty = disabled

    # Market Data
    FMP_API_KEY: str = ""  # Financial Modeling Prep API key
```

### Environment Variables (Phase 6)

| Variable | Default | Description |
|----------|---------|-------------|
| REDIS_URL | redis://localhost:6379/0 | Redis connection URL |
| REDIS_ENABLED | false | Enable Redis caching |
| CELERY_BROKER_URL | redis://localhost:6379/0 | Celery message broker |
| SENTRY_DSN | (empty) | Sentry error tracking DSN |
| FMP_API_KEY | (empty) | Financial Modeling Prep API key |

### Health Check Updates

```yaml
# Health checks for new services

redis:
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5

celery-worker:
  healthcheck:
    test: ["CMD", "celery", "-A", "app.tasks", "inspect", "ping"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 30s
```

### Verification Checklist (Phase 6)

After implementation, verify:

- [ ] `docker-compose up` starts all services (db, backend, frontend, redis, celery-worker, celery-beat)
- [ ] All services show healthy in `docker-compose ps`
- [ ] Redis responds to `redis-cli ping`
- [ ] Celery worker receives and executes test task
- [ ] API response time improves with caching enabled
- [ ] Cache invalidation works when triggered
- [ ] Scheduled tasks execute during configured hours
- [ ] Hot reload works for backend code changes
- [ ] `docker-compose --profile monitoring up` starts Flower
- [ ] App works without SENTRY_DSN configured

### Traceability Matrix (Phase 6)

| PRD Requirement | Architecture Component | ADR |
|-----------------|----------------------|-----|
| FR-18: Redis caching | redis_cache.py, Cache Service | ADR-008, ADR-009 |
| FR-19: Redis in docker-compose | redis service | ADR-008 |
| FR-20: Cache invalidation | invalidate_cache task | ADR-009 |
| FR-21: Background jobs | Celery worker | - |
| FR-22: Market hours refresh | celery-beat schedule | ADR-010 |
| FR-23: Celery in docker-compose | celery-worker, celery-beat services | - |
| FR-24: Error tracking | Sentry integration | ADR-013 |
| FR-25: Job monitoring | Flower (optional profile) | ADR-012 |
| NFR-07: <50ms cached response | Redis caching | ADR-009 |
| NFR-08: >80% cache hit rate | TTL strategy | ADR-009 |
| NFR-09: Job failure retry | Celery retry config | - |
| NFR-10: Health checks | Service healthchecks | - |
| NFR-11: No breaking changes | Additive docker-compose changes | - |
| NFR-12: Hot reload | Volume mounts | ADR-011 |
