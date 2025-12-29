# Story: [STORY-006] Configure Docker Compose Services

## Status
- [x] Ready
- [ ] In Progress
- [ ] In Review
- [ ] Done

## User Story
**As a** developer
**I want** docker-compose to orchestrate all services correctly
**So that** I can start the entire stack with one command

## Description
Update `docker-compose.yml` to remove unnecessary Redis service, fix service dependencies, and configure proper health checks and startup ordering. This enables the `docker-compose up` command to work reliably.

## Acceptance Criteria
- [ ] Redis service removed from docker-compose.yml
- [ ] Backend service depends on `db` with `condition: service_healthy`
- [ ] Backend no longer depends on Redis
- [ ] Database service has working health check (`pg_isready`)
- [ ] Backend service has working health check (`curl /health`)
- [ ] Frontend service depends on backend
- [ ] `docker-compose up` starts all 3 services (db, backend, frontend)
- [ ] Services start in correct order: db → backend → frontend

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
<!-- Filled in by Dev during implementation -->

## QA Notes
<!-- Filled in by QA during review -->
