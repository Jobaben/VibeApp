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

## Addendum: Phase 6 - Polish & Deploy (2025-12-30)

**Source**: [bmad/00-brief/brief-phase-6-polish-deploy.md](../00-brief/brief-phase-6-polish-deploy.md)

### Problem Summary

VibeApp is feature-complete (Phases 1-5) but lacks production-readiness infrastructure. The application needs caching for performance, background jobs for data refresh, error tracking for production monitoring, and polish for accessibility.

### Product Vision (Phase 6)

A production-ready application with automated data refresh, intelligent caching, comprehensive error tracking, and improved user experience through performance optimizations and accessibility improvements.

### User Personas (Phase 6)

#### Persona 4: End User (Emma)

| Attribute | Description |
|-----------|-------------|
| Role | Retail investor using VibeApp |
| Technical Level | Non-technical end user |
| Goal | Quick access to up-to-date stock data |
| Pain Point | Slow API responses, stale data |
| Success | Fast page loads, data updated automatically during market hours |

#### Persona 5: Operations Engineer (Omar)

| Attribute | Description |
|-----------|-------------|
| Role | Engineer responsible for production health |
| Technical Level | DevOps/SRE background |
| Goal | Monitor and maintain production stability |
| Pain Point | No visibility into errors, manual intervention required |
| Success | Errors captured automatically, clear monitoring dashboards |

#### Persona 6: Accessibility User (Alex)

| Attribute | Description |
|-----------|-------------|
| Role | User with visual impairment using screen reader |
| Technical Level | Regular web user |
| Goal | Navigate and understand stock data with assistive technology |
| Pain Point | Missing ARIA labels, poor keyboard navigation |
| Success | Full functionality accessible via keyboard and screen reader |

### Additional Functional Requirements (Phase 6)

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-18 | System shall cache API responses in Redis | Must | Repeated API calls return cached data within 10ms |
| FR-19 | Redis service shall be included in docker-compose | Must | `docker-compose up` starts Redis alongside other services |
| FR-20 | System shall provide cache invalidation mechanism | Must | Cache can be cleared manually or expires after configured TTL |
| FR-21 | System shall run background jobs for data refresh | Should | Celery workers execute scheduled tasks |
| FR-22 | Background jobs shall refresh stock data during market hours | Should | Data updated every hour between 9:30 AM - 4:00 PM ET on trading days |
| FR-23 | Celery worker service shall be included in docker-compose | Should | `docker-compose up` starts Celery worker alongside other services |
| FR-24 | System shall capture and report errors to external service | Could | Errors sent to Sentry (or similar) with context |
| FR-25 | System shall provide job queue monitoring dashboard | Could | Flower or similar dashboard shows job status |
| FR-26 | All interactive elements shall be keyboard accessible | Should | Tab navigation works for all buttons, links, forms |
| FR-27 | All images and icons shall have alt text | Should | Screen readers can describe visual elements |
| FR-28 | Color contrast shall meet WCAG AA standards | Should | Text readable for users with visual impairments |

### Additional Non-Functional Requirements (Phase 6)

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| NFR-07 | API response time shall improve with caching | Must | Cached responses return in <50ms (vs >200ms uncached) |
| NFR-08 | Cache hit rate shall exceed 80% for common endpoints | Should | Monitoring shows >80% cache hits during normal operation |
| NFR-09 | Background job failures shall be logged and retried | Should | Failed jobs logged with error, automatic retry with backoff |
| NFR-10 | All new services shall have health checks | Must | `docker-compose ps` shows healthy status for all services |
| NFR-11 | System shall not break existing docker-compose workflow | Must | `docker-compose up` remains single command to start everything |
| NFR-12 | Hot reload shall continue working with new services | Should | Code changes reflect without full restart |

### User Stories (Phase 6)

| Story | Description |
|-------|-------------|
| US-08 | As Emma, I want fast page loads so I can quickly check stock data |
| US-09 | As Emma, I want data to be fresh during market hours so I have accurate information |
| US-10 | As Omar, I want errors captured automatically so I know when something breaks |
| US-11 | As Omar, I want to see job queue status so I can monitor data refresh health |
| US-12 | As Alex, I want to navigate with keyboard so I can use the app without a mouse |
| US-13 | As Alex, I want screen reader support so I can understand the stock data |
| US-14 | As any developer, I want Redis/Celery in docker-compose so setup remains simple |

### Acceptance Criteria (Phase 6)

#### AC-10: Redis Caching
- Given the docker-compose environment
- When `docker-compose up` completes
- Then Redis service is running and healthy
- And backend can connect to Redis

- Given a cached API endpoint
- When the same request is made twice
- Then second response is served from cache
- And response time is <50ms

#### AC-11: Cache Invalidation
- Given cached stock data
- When cache TTL expires (or manual invalidation)
- Then next request fetches fresh data
- And cache is repopulated

#### AC-12: Background Job Service
- Given the docker-compose environment
- When `docker-compose up` completes
- Then Celery worker service is running
- And worker can receive and execute tasks

#### AC-13: Scheduled Data Refresh
- Given Celery is running during market hours
- When the hourly schedule triggers
- Then stock data is refreshed from source
- And cache is invalidated for updated data

#### AC-14: Error Tracking (Optional)
- Given Sentry DSN is configured
- When an unhandled error occurs
- Then error is captured and sent to Sentry
- And includes stack trace and context

#### AC-15: Keyboard Accessibility
- Given any interactive element in the UI
- When user presses Tab key
- Then focus moves to next interactive element
- And focus indicator is visible

- Given a button or link
- When user presses Enter while focused
- Then action is triggered (same as click)

#### AC-16: Screen Reader Support
- Given any data display (stock table, charts)
- When screen reader reads the page
- Then data is announced meaningfully
- And navigation structure is clear

### Dependencies (Phase 6)

| Dependency | Type | Description |
|------------|------|-------------|
| Redis | Service | In-memory cache, added to docker-compose |
| Celery | Library | Task queue for background jobs |
| Redis (as broker) | Service | Celery uses Redis as message broker |
| Sentry Account | External | Optional: requires account and DSN |
| Market Hours API | External | Optional: for determining trading hours |

### Assumptions (Phase 6)

1. Redis can serve as both cache and Celery broker (no separate RabbitMQ needed)
2. Sentry integration is optional (app works without it via env var check)
3. Market hours are US Eastern Time (9:30 AM - 4:00 PM)
4. Background jobs can skip weekends and holidays
5. Accessibility improvements focus on WCAG 2.1 AA level

### Out of Scope (Phase 6)

Per brief constraints, the following are out of scope for initial Phase 6:
- Full production Kubernetes deployment
- Multi-region caching
- Real-time WebSocket updates
- WCAG AAA compliance
- Automated accessibility testing pipeline
- Custom monitoring/alerting infrastructure (use existing tools)

### Open Questions (Phase 6)

| # | Question | Impact | Status |
|---|----------|--------|--------|
| 3 | Which market data source for background refresh? | High - affects refresh implementation | Use existing FMP API |
| 4 | Should Flower dashboard be exposed externally? | Low - dev convenience | To be determined by Architect |
| 5 | Cache TTL for different data types? | Medium - affects freshness | To be determined by Architect |

### Recommended Story Order (Phase 6)

Based on dependencies and priority:

1. **story-012**: Add Redis Caching Layer (Must - enables performance + Celery)
2. **story-013**: Add Celery Background Jobs (Should - depends on Redis)
3. **story-014**: Add Error Tracking with Sentry (Could - independent)
4. **story-015**: Frontend Performance & Code Splitting (Should - independent)
5. **story-016**: Accessibility Improvements (Should - independent)
6. **story-017**: Production Documentation (Could - after features complete)

---
## Checklist
- [x] All functional requirements documented
- [x] Non-functional requirements defined
- [x] User personas identified
- [x] Acceptance criteria specified
- [x] Dependencies listed
- [x] Links back to brief.md
- [x] Addendum for UX fixes added (2025-12-29)
- [x] Addendum for Phase 6 Polish & Deploy added (2025-12-30)
