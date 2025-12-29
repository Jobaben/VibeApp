# Story: [STORY-012] Add Redis Caching Layer

## Status
- [ ] Draft
- [x] Ready
- [ ] In Progress
- [ ] In Review
- [ ] Done

## User Story
**As a** user of VibeApp
**I want** fast API responses
**So that** I can quickly browse stock data without waiting for slow database queries

## Description
Implement Redis caching for high-traffic API endpoints to reduce response times from >200ms to <50ms. This includes adding Redis as a Docker service, creating a cache service in the backend, and integrating caching with key stock endpoints.

Redis will also serve as the message broker for Celery (story-013), making it a foundational story for Phase 6.

## Acceptance Criteria
- [ ] Redis service added to docker-compose.yml with health check
- [ ] Redis responds to `redis-cli ping` command
- [ ] Backend can connect to Redis (verify in logs)
- [ ] CacheService class created with get/set/invalidate methods
- [ ] Stock list endpoint (GET /api/stocks/) uses caching
- [ ] Stock detail endpoint (GET /api/stocks/{ticker}) uses caching
- [ ] Leaderboard endpoint uses caching
- [ ] Cached responses return in <50ms (measure with curl)
- [ ] Cache keys follow pattern: `stocks:{type}:{identifier}`
- [ ] Cache TTL configurable via environment variable
- [ ] Cache invalidation endpoint works (POST /api/cache/invalidate)
- [ ] App works normally when REDIS_ENABLED=false (graceful fallback)
- [ ] All services start with `docker-compose up`
- [ ] Hot reload still works for backend code

## Technical Notes

### Affected Components
- `docker-compose.yml` - Add redis service
- `backend/app/config.py` - Add cache settings
- `backend/app/infrastructure/cache/` - New cache module
- `backend/app/features/stocks/router.py` - Add caching to endpoints

### Docker-Compose Addition
```yaml
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
```

### Cache Service Pattern
```python
# backend/app/infrastructure/cache/redis_cache.py
class CacheService:
    def get(self, key: str) -> Optional[dict]
    def set(self, key: str, value: dict, ttl_seconds: int = 300)
    def invalidate(self, pattern: str)
```

### Endpoints to Cache
| Endpoint | Cache Key | TTL |
|----------|-----------|-----|
| GET /api/stocks/ | `stocks:list:{hash(params)}` | 5 min |
| GET /api/stocks/{ticker} | `stocks:detail:{ticker}` | 5 min |
| GET /api/stocks/top | `stocks:top:{limit}` | 10 min |
| GET /api/stocks/leaderboard/top | `leaderboard:{limit}:{sector}` | 10 min |

### Configuration
```python
REDIS_URL: str = "redis://redis:6379/0"
REDIS_ENABLED: bool = True  # Set via docker-compose env
CACHE_TTL_DEFAULT: int = 300  # 5 minutes
```

### API Changes
- Add: `POST /api/cache/invalidate` - Admin endpoint to clear cache

### Data Changes
- Add `redis_data` volume to docker-compose

## Dependencies
- None (foundational story for Phase 6)

## Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Cache miss | Empty cache | First request to /api/stocks/ | Response from DB, cached for next request |
| Cache hit | Cached stock list | Second request to /api/stocks/ | Response from cache in <50ms |
| Cache invalidation | Cached data exists | POST /api/cache/invalidate | Cache cleared, next request from DB |
| Redis disabled | REDIS_ENABLED=false | Any API request | Normal DB response, no errors |
| Redis down | Redis service stopped | Any API request | Graceful fallback to DB |

## Estimation
- **Complexity**: M
- **Risk**: Low (well-documented pattern)

## References
- PRD Section: FR-18, FR-19, FR-20, NFR-07, NFR-08
- Architecture Section: ADR-008, ADR-009, Redis Caching Architecture

---
## Dev Notes
<!-- Filled in by Dev during implementation -->

## QA Notes
<!-- Filled in by QA during review -->
