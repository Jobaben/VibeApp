# Story: [STORY-006] Configure Docker Compose Services

## Status
- [ ] Ready
- [ ] In Progress
- [ ] In Review
- [x] Done

## User Story
**As a** developer
**I want** docker-compose to orchestrate all services correctly
**So that** I can start the entire stack with one command

## Description
Update `docker-compose.yml` to remove unnecessary Redis service, fix service dependencies, and configure proper health checks and startup ordering. This enables the `docker-compose up` command to work reliably.

## Acceptance Criteria
- [x] Redis service removed from docker-compose.yml
- [x] Backend service depends on `db` with `condition: service_healthy`
- [x] Backend no longer depends on Redis
- [x] Database service has working health check (`pg_isready`)
- [x] Backend service has working health check (`curl /health`)
- [x] Frontend service depends on backend
- [x] `docker-compose up` starts all 3 services (db, backend, frontend)
- [x] Services start in correct order: db → backend → frontend

## Technical Notes

### Affected Components
- `docker-compose.yml`

### Services Configuration

```yaml
services:
  db:
    # Keep PostgreSQL configuration
    # Keep healthcheck with pg_isready

  backend:
    depends_on:
      db:
        condition: service_healthy
    # REMOVE redis dependency
    # Keep healthcheck with curl

  frontend:
    depends_on:
      - backend
```

### Remove Redis
- Delete entire `redis:` service block
- Delete `redis_data` volume
- Remove `REDIS_URL` from backend environment (optional, backend handles missing Redis)

## Dependencies
- story-005 (Docker builds must work first)

## Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Services start | docker-compose.yml configured | `docker-compose up -d` | All 3 containers running |
| DB healthy | db container started | Check container health | Status: healthy |
| Backend waits for DB | DB starting | Watch startup logs | Backend starts after DB healthy |
| No Redis | docker-compose.yml | `docker-compose ps` | Only db, backend, frontend listed |

## Estimation
- **Complexity**: S
- **Risk**: Low

## References
- PRD: FR-01, FR-04, FR-12, FR-13
- Architecture: ADR-001, ADR-004

---
## Dev Notes

**Completed**: 2025-12-29

### Changes Made

1. **Removed Redis service**: Deleted entire `redis:` service block
2. **Removed `redis_data` volume**: No longer needed
3. **Removed `REDIS_URL`**: Backend environment no longer includes Redis URL
4. **Simplified backend `depends_on`**: Now only depends on `db` with health check condition

### Verification

```
$ docker-compose up -d
Creating network "vibeapp_stock-finder-network" with driver "bridge"
Creating avanza-stock-finder-db ... done
Creating avanza-stock-finder-backend ... done
Creating avanza-stock-finder-frontend ... done

$ docker-compose ps
Name                          State               Ports
avanza-stock-finder-backend   Up (healthy)   0.0.0.0:8000->8000/tcp
avanza-stock-finder-db        Up (healthy)   0.0.0.0:5432->5432/tcp
avanza-stock-finder-frontend  Up             0.0.0.0:3000->3000/tcp

$ curl http://localhost:8000/health
{"status":"healthy"}
```

## QA Notes

**Reviewed**: 2025-12-29
**Verdict**: ✅ PASS

All acceptance criteria verified:
- Redis service removed ✅
- Backend depends on db with service_healthy ✅
- Health checks working (db + backend) ✅
- All 3 services start correctly ✅
- Correct startup order (db → backend → frontend) ✅

See full review: `bmad/04-qa/review-story-006.md`
