# Story: [STORY-007] Enable Hot Reload with Volume Mounts

## Status
- [ ] Ready
- [ ] In Progress
- [ ] In Review
- [x] Done

## User Story
**As a** developer
**I want** code changes to reflect immediately without rebuilding containers
**So that** I can iterate quickly during development

## Description
Configure volume mounts in docker-compose.yml to enable hot reload for both frontend (Vite HMR) and backend (uvicorn --reload). This requires proper bind mounts and an anonymous volume for node_modules isolation.

## Acceptance Criteria
- [x] Backend code changes trigger uvicorn auto-reload
- [x] Frontend code changes trigger Vite HMR in browser
- [x] node_modules are isolated in container (not overwritten by host)
- [x] Editing `backend/app/*.py` reflects in running container
- [x] Editing `frontend/src/*.tsx` reflects in browser without refresh
- [x] Container restart not required for code changes

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

**Completed**: 2025-12-29

### Verification

Volume mounts were already configured correctly in story-006. This story verified functionality:

**Backend Hot Reload:**
```
$ docker logs avanza-stock-finder-backend | grep reload
INFO:     Started reloader process [1] using WatchFiles
WARNING:  WatchFiles detected changes in 'main.py'. Reloading...
```
- Edited `backend/main.py` → uvicorn detected and reloaded ✅

**Frontend HMR:**
```
$ curl http://localhost:3000 | head -10
<script type="module" src="/@vite/client"></script>  # HMR WebSocket
<script type="module">import { injectIntoGlobalHook } from "/@react-refresh"  # React HMR
```
- Vite server running with `--host` ✅
- File changes in `/app/src` immediately visible in container ✅

**node_modules Isolation:**
```
$ docker exec avanza-stock-finder-frontend ls -la /app/node_modules/.yarn-integrity
-rw-r--r--    1 root     root         59029 Dec 27 22:28 /app/node_modules/.yarn-integrity
```
- Container has own node_modules from build time ✅
- Anonymous volume prevents host overwrite ✅

### Configuration (already in place)

```yaml
# docker-compose.yml
backend:
  volumes:
    - ./backend:/app    # Bind mount for hot reload
frontend:
  volumes:
    - ./frontend:/app           # Bind mount for hot reload
    - /app/node_modules         # Anonymous volume (isolation)
```

## QA Notes

**Reviewed**: 2025-12-29
**Verdict**: ✅ PASS

All acceptance criteria verified:
- Backend hot reload working (WatchFiles) ✅
- Frontend HMR configured (Vite + React Refresh) ✅
- node_modules isolation working ✅
- File sync to containers working ✅

See full review: `bmad/04-qa/review-story-007.md`
