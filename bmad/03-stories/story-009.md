# Story: [STORY-009] Add Docker Documentation to README

## Status
- [x] Ready
- [ ] In Progress
- [ ] In Review
- [ ] Done

## User Story
**As a** new developer
**I want** clear documentation on how to use Docker
**So that** I can get the app running without guessing

## Description
Add a comprehensive Docker section to the README.md that explains how to start the app, common commands, troubleshooting tips, and requirements. This is the final story that makes the Docker setup discoverable.

## Acceptance Criteria
- [ ] README has "Getting Started with Docker" section
- [ ] Prerequisites listed (Docker, Docker Compose versions)
- [ ] Quick start command documented (`docker-compose up`)
- [ ] Common commands documented (up, down, rebuild, logs)
- [ ] Port usage documented (3000, 8000, 5432)
- [ ] Troubleshooting section with common issues
- [ ] Hot reload behavior explained
- [ ] How to add new dependencies documented

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
<!-- Filled in by Dev during implementation -->

## QA Notes
<!-- Filled in by QA during review -->
