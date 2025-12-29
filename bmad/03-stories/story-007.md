# Story: [STORY-007] Enable Hot Reload with Volume Mounts

## Status
- [x] Ready
- [ ] In Progress
- [ ] In Review
- [ ] Done

## User Story
**As a** developer
**I want** code changes to reflect immediately without rebuilding containers
**So that** I can iterate quickly during development

## Description
Configure volume mounts in docker-compose.yml to enable hot reload for both frontend (Vite HMR) and backend (uvicorn --reload). This requires proper bind mounts and an anonymous volume for node_modules isolation.

## Acceptance Criteria
- [ ] Backend code changes trigger uvicorn auto-reload
- [ ] Frontend code changes trigger Vite HMR in browser
- [ ] node_modules are isolated in container (not overwritten by host)
- [ ] Editing `backend/app/*.py` reflects in running container
- [ ] Editing `frontend/src/*.tsx` reflects in browser without refresh
- [ ] Container restart not required for code changes

## Technical Notes

### Affected Components
- `docker-compose.yml` (volumes section)

### Volume Configuration

```yaml
backend:
  volumes:
    - ./backend:/app  # Bind mount for hot reload

frontend:
  volumes:
    - ./frontend:/app           # Bind mount for hot reload
    - /app/node_modules         # Anonymous volume to preserve container's node_modules
```

### Why Anonymous Volume for node_modules
Without this, the bind mount `./frontend:/app` would overwrite the container's `/app/node_modules` (installed during build) with the host's `./frontend/node_modules` (which may be empty or have incompatible binaries).

### Backend Hot Reload
Already configured in Dockerfile.backend:
```dockerfile
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### Frontend Hot Reload
Vite dev server with `--host` flag enables HMR over network.

## Dependencies
- story-006 (docker-compose services must be configured)

## Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Backend reload | Containers running | Edit backend/main.py, add comment | uvicorn logs show reload |
| Frontend HMR | Containers running, browser open | Edit frontend/src/App.tsx | Browser updates without refresh |
| node_modules isolated | Containers running | `docker exec frontend ls /app/node_modules` | Shows installed packages |
| Host node_modules empty | Fresh clone, no local install | `docker-compose up` | Frontend still works |

## Estimation
- **Complexity**: S
- **Risk**: Medium (filesystem behavior varies by OS)

## References
- PRD: FR-09, FR-10
- Architecture: ADR-002, ADR-003

---
## Dev Notes
<!-- Filled in by Dev during implementation -->

## QA Notes
<!-- Filled in by QA during review -->
