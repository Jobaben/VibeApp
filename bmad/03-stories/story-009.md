# Story: [STORY-009] Add Docker Documentation to README

## Status
- [ ] Ready
- [ ] In Progress
- [ ] In Review
- [x] Done

## User Story
**As a** new developer
**I want** clear documentation on how to use Docker
**So that** I can get the app running without guessing

## Description
Add a comprehensive Docker section to the README.md that explains how to start the app, common commands, troubleshooting tips, and requirements. This is the final story that makes the Docker setup discoverable.

## Acceptance Criteria
- [x] README has "Getting Started with Docker" section
- [x] Prerequisites listed (Docker, Docker Compose versions)
- [x] Quick start command documented (`docker-compose up`)
- [x] Common commands documented (up, down, rebuild, logs)
- [x] Port usage documented (3000, 8000, 5432)
- [x] Troubleshooting section with common issues
- [x] Hot reload behavior explained
- [x] How to add new dependencies documented

## Technical Notes

### Affected Components
- `README.md`

### Documentation Structure

```markdown
## Getting Started with Docker

### Prerequisites
- Docker 20.10+
- Docker Compose 2.x

### Quick Start
\`\`\`bash
docker-compose up
\`\`\`
Then open http://localhost:3000

### Ports
| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 8000 | http://localhost:8000 |
| Database | 5432 | localhost:5432 |

### Common Commands
- Start: `docker-compose up`
- Stop: `docker-compose down`
- Rebuild: `docker-compose up --build`
- View logs: `docker-compose logs -f [service]`
- Shell access: `docker exec -it <container> sh`

### Hot Reload
Code changes in `frontend/` and `backend/` automatically reload.

### Adding Dependencies
After adding to package.json or requirements.txt:
\`\`\`bash
docker-compose up --build
\`\`\`

### Troubleshooting
- Port conflict: Change ports in docker-compose.yml
- Build fails: `docker-compose build --no-cache`
- Database issues: `docker-compose down -v` (resets data)
```

## Dependencies
- story-008 (Docker must be verified working first)

## Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Quick start works | New developer follows docs | Runs documented commands | App starts successfully |
| Commands accurate | Developer runs documented command | Executes command | Expected behavior occurs |
| Troubleshooting helps | Developer has port conflict | Follows troubleshooting | Issue resolved |

## Estimation
- **Complexity**: S
- **Risk**: Low

## References
- PRD: NFR-05, AC-06
- Architecture: N/A (documentation only)

---
## Dev Notes

**Completed**: 2025-12-29

### Changes Made

Added "🐳 Getting Started with Docker" section to README.md with:

1. **Prerequisites**: Docker 20.10+, Docker Compose 2.x
2. **Quick Start**: Clone and `docker-compose up`
3. **Service Ports Table**: Frontend (3000), Backend (8000), PostgreSQL (5432)
4. **Common Commands**: up, down, rebuild, logs, shell access
5. **Hot Reload**: Explained backend (uvicorn) and frontend (Vite HMR)
6. **Adding Dependencies**: Rebuild after package.json/requirements.txt changes
7. **Troubleshooting Table**: Port conflicts, build fails, database issues, container issues
8. **Environment Variables**: DATABASE_URL, CORS_ORIGINS, VITE_API_URL

### Location

Inserted after the manual "Getting Started" section (line 207) to provide Docker as an alternative setup option.

## QA Notes

**Reviewed**: 2025-12-29
**Verdict**: ✅ PASS

All acceptance criteria verified:
- Docker section with prerequisites ✅
- Quick start documented ✅
- Common commands (10+) documented ✅
- Port usage table ✅
- Troubleshooting section (5 issues) ✅
- Hot reload explained ✅
- Adding dependencies documented ✅

Documentation is accurate, well-structured, and complete.

See full review: `bmad/04-qa/review-story-009.md`
