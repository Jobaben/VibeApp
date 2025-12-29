# Product Requirements Document

## Overview

### Problem Summary

Developers must manually set up Python virtual environments, install dependencies, and run multiple services in separate terminals to work with VibeApp. This creates friction for new contributors and leads to "works on my machine" issues.

**Source**: [bmad/00-brief/brief.md](../00-brief/brief.md)

### Product Vision

A containerized development environment that enables any developer to run the complete VibeApp stack with a single command, eliminating manual setup and dependency management.

## User Personas

### Persona 1: New Developer (Nina)

| Attribute | Description |
|-----------|-------------|
| Role | Junior developer joining the team |
| Technical Level | Familiar with git, basic command line |
| Goal | Get the app running locally to start contributing |
| Pain Point | Doesn't know Python venv or the specific Node version required |
| Success | Clone repo, run one command, see app working |

### Persona 2: Code Reviewer (Carlos)

| Attribute | Description |
|-----------|-------------|
| Role | Senior developer reviewing PRs |
| Technical Level | Expert, but time-constrained |
| Goal | Quickly test PR changes locally |
| Pain Point | Switching between local dev setup and PR testing is tedious |
| Success | Pull PR branch, run one command, test changes |

### Persona 3: Occasional Contributor (Priya)

| Attribute | Description |
|-----------|-------------|
| Role | Open source contributor |
| Technical Level | Experienced, but unfamiliar with this codebase |
| Goal | Fix a bug or add a small feature |
| Pain Point | Local Python/Node versions conflict with other projects |
| Success | Isolated environment that doesn't affect other work |

## Requirements

### Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-01 | System shall start all services with a single command | Must | `docker-compose up` starts backend, frontend, and database |
| FR-02 | System shall build backend service container | Must | Backend container builds without errors |
| FR-03 | System shall build frontend service container | Must | Frontend container builds without errors |
| FR-04 | System shall provision database service | Must | Database container starts and accepts connections |
| FR-05 | System shall connect backend to database | Must | Backend can query database successfully |
| FR-06 | System shall expose frontend on standard port | Must | Frontend accessible at http://localhost:3000 |
| FR-07 | System shall expose backend API on standard port | Must | Backend API accessible at http://localhost:8000 |
| FR-08 | System shall enable frontend-to-backend communication | Must | Frontend can make API calls to backend |
| FR-09 | System shall support hot reload for backend code | Should | Code changes in backend/ reflect without container restart |
| FR-10 | System shall support hot reload for frontend code | Should | Code changes in frontend/ reflect without container restart |
| FR-11 | System shall persist database data between restarts | Should | Data survives `docker-compose down` and `up` |
| FR-12 | System shall provide health checks for services | Should | Health endpoints confirm service availability |
| FR-13 | System shall handle service startup order | Must | Backend waits for database to be ready before starting |

### Non-Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| NFR-01 | First-time build shall complete in reasonable time | Should | Initial build completes in under 5 minutes on standard hardware |
| NFR-02 | Subsequent starts shall be fast | Should | `docker-compose up` with existing images starts in under 30 seconds |
| NFR-03 | System shall work on major operating systems | Must | Works on macOS, Linux, Windows (with Docker Desktop) |
| NFR-04 | System shall use minimal disk space | Could | Total image size under 2GB |
| NFR-05 | Documentation shall be clear and complete | Must | README includes Docker usage instructions |
| NFR-06 | Error messages shall be actionable | Should | Build/runtime errors indicate how to resolve |

## User Stories Overview

> Detailed stories to be created by Scrum Master. High-level stories below.

| Story | Description |
|-------|-------------|
| US-01 | As Nina, I want to run the app with one command so I can start contributing quickly |
| US-02 | As Carlos, I want to test PR changes in isolation so I don't affect my local setup |
| US-03 | As Priya, I want hot reload to work so I can iterate quickly on changes |
| US-04 | As any developer, I want database data to persist so I don't lose test data |
| US-05 | As any developer, I want clear documentation so I know how to use Docker setup |

## Acceptance Criteria

### AC-01: Single Command Startup
- Given a fresh clone of the repository
- When I run `docker-compose up`
- Then all services start successfully
- And frontend is accessible at localhost:3000
- And backend API is accessible at localhost:8000

### AC-02: Backend Container
- Given the Docker setup
- When backend container builds
- Then all Python dependencies are installed
- And uvicorn server starts without errors
- And API responds to health check requests

### AC-03: Frontend Container
- Given the Docker setup
- When frontend container builds
- Then all Node dependencies are installed
- And dev server starts without errors
- And app loads in browser at localhost:3000

### AC-04: Database Integration
- Given all containers are running
- When backend attempts database operations
- Then queries execute successfully
- And data persists between container restarts

### AC-05: Hot Reload
- Given all containers are running
- When I modify a backend Python file
- Then changes reflect without manual restart
- When I modify a frontend React file
- Then changes reflect in the browser

### AC-06: Documentation
- Given the README
- When a new developer reads Docker section
- Then they understand how to start the app
- And they know common troubleshooting steps

## Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Docker Engine | External | Must be installed on developer machine |
| Docker Compose | External | Must be installed (included with Docker Desktop) |
| Port 3000 | Environment | Must be available for frontend |
| Port 8000 | Environment | Must be available for backend API |
| Port 5432 | Environment | Must be available for database |

## Assumptions

1. Developers have Docker and Docker Compose installed
2. Developers have sufficient disk space for images (~2GB)
3. Default ports (3000, 8000, 5432) are available
4. Internet connection available for initial image pulls
5. Existing backend/ and frontend/ directory structure remains unchanged

## Out of Scope

Per brief, the following are explicitly out of scope:
- Production-grade Docker configuration
- Kubernetes/orchestration support
- CI/CD Docker integration
- Cloud deployment configurations
- Multi-stage production builds
- Security hardening

## Open Questions

| # | Question | Impact | Status |
|---|----------|--------|--------|
| 1 | Should Redis be included in the Docker setup? | Medium - docker-compose.yml mentions Redis | To be determined by Architect |
| 2 | How should database migrations be handled? | Medium - affects initial setup | To be determined by Architect |

---

## Addendum: User Experience Fixes (2025-12-29)

**Source**: [bmad/00-brief/brief-learning-mode-and-empty-stocks.md](../00-brief/brief-learning-mode-and-empty-stocks.md)

### Problem Summary

Two usability issues prevent new users from having a good first experience:
1. Learning Mode activates unexpectedly on app start
2. No stocks are displayed when using Docker setup

### Additional Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-14 | Learning Mode shall default to OFF | Must | New users see Learning Mode toggle in OFF state on first visit |
| FR-15 | Learning Mode state shall only persist when user explicitly enables it | Must | localStorage only affects Learning Mode if user actively toggled it ON |
| FR-16 | Database shall be seeded with sample data on Docker startup | Must | Running `docker-compose up` results in stocks being available |
| FR-17 | Seed script execution shall be idempotent | Should | Running seed multiple times does not create duplicates |

### Additional Acceptance Criteria

#### AC-07: Learning Mode Default State
- Given a new user visiting the app for the first time
- When the app loads
- Then Learning Mode toggle shows as OFF
- And no learning prompts or overlays appear

#### AC-08: Learning Mode Persistence
- Given a user who has never enabled Learning Mode
- When the user has localStorage from a previous session
- Then Learning Mode remains OFF (does not auto-enable)

- Given a user who explicitly enabled Learning Mode
- When the user returns in a new session
- Then their choice to have Learning Mode ON is preserved

#### AC-09: Database Auto-Seeding
- Given a fresh Docker environment with empty database
- When `docker-compose up` completes
- Then the stocks API returns sample data
- And the frontend displays stocks in the list

### User Stories (Additional)

| Story | Description |
|-------|-------------|
| US-06 | As a new user, I want Learning Mode to be OFF by default so I can explore the app without tutorials |
| US-07 | As any developer, I want the database seeded automatically so I can test the app immediately after Docker setup |

---
## Checklist
- [x] All functional requirements documented
- [x] Non-functional requirements defined
- [x] User personas identified
- [x] Acceptance criteria specified
- [x] Dependencies listed
- [x] Links back to brief.md
- [x] Addendum for UX fixes added (2025-12-29)
