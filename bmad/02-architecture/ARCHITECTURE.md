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
