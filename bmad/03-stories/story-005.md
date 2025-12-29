# Story: [STORY-005] Fix Docker Build Configuration

## Status
- [ ] Ready
- [ ] In Progress
- [ ] In Review
- [x] Done

## User Story
**As a** developer
**I want** the Docker build to work correctly
**So that** I can build container images without errors

## Description
Fix the foundational Docker configuration issues that prevent containers from building. This includes fixing `.dockerignore` exclusions and updating Dockerfiles to use correct package managers and dependencies.

This is a prerequisite for all other Docker stories - without working builds, nothing else can be tested.

## Acceptance Criteria
- [x] `.dockerignore` no longer excludes Dockerfile* and docker-compose* files
- [x] `Dockerfile.backend` includes `curl` for health checks
- [x] `Dockerfile.frontend` uses `yarn` instead of `npm`
- [x] `Dockerfile.frontend` copies `yarn.lock` file
- [x] `docker build -f Dockerfile.backend .` completes without errors
- [x] `docker build -f Dockerfile.frontend .` completes without errors

## Technical Notes

### Affected Components
- `.dockerignore`
- `Dockerfile.backend`
- `Dockerfile.frontend`

### .dockerignore Changes
Remove these lines:
```
Dockerfile*
docker-compose*
.dockerignore
```

### Dockerfile.backend Changes
```dockerfile
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*
```

### Dockerfile.frontend Changes
```dockerfile
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install
CMD ["yarn", "dev", "--host"]
```

## Dependencies
- None (first story in Docker epic)

## Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Backend build | Dockerfile.backend exists | `docker build -f Dockerfile.backend .` | Build completes with exit 0 |
| Frontend build | Dockerfile.frontend exists | `docker build -f Dockerfile.frontend .` | Build completes with exit 0 |
| Curl installed | Backend image built | `docker run <image> curl --version` | Curl version displayed |

## Estimation
- **Complexity**: S
- **Risk**: Low

## References
- PRD: FR-02, FR-03
- Architecture: ADR-005, ADR-006

---
## Dev Notes

**Completed**: 2025-12-29

### Changes Made

1. **`.dockerignore`**: Removed `Dockerfile*`, `docker-compose*`, and `.dockerignore` exclusions that were preventing Docker builds from accessing necessary files.

2. **`Dockerfile.backend`**: Added `curl` to apt-get install for health check support.

3. **`Dockerfile.frontend`**:
   - Changed from `npm install` to `yarn install --frozen-lockfile`
   - Updated COPY to include `yarn.lock`
   - Changed CMD from npm to yarn

### Verification

- Backend build: `docker build -f Dockerfile.backend -t vibeapp-backend-test .` ✅
- Frontend build: `docker build -f Dockerfile.frontend -t vibeapp-frontend-test .` ✅
- Curl verification: `docker run --rm vibeapp-backend-test curl --version` → curl 8.14.1 ✅

## QA Notes

**Reviewed**: 2025-12-29
**Verdict**: ✅ PASS

All acceptance criteria verified:
- `.dockerignore` exclusions removed ✅
- Backend Dockerfile includes curl ✅
- Frontend Dockerfile uses yarn ✅
- Both Docker builds succeed ✅

See full review: `bmad/04-qa/review-story-005.md`
