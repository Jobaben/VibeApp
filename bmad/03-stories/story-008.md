# Story: [STORY-008] Verify End-to-End Docker Functionality

## Status
- [x] Ready
- [ ] In Progress
- [ ] In Review
- [ ] Done

## User Story
**As a** developer
**I want** to verify the complete Docker setup works end-to-end
**So that** I'm confident it will work for other developers

## Description
Perform comprehensive testing of the Docker setup to verify all requirements are met. This includes testing the full user journey: fresh clone → docker-compose up → working app with database persistence.

## Acceptance Criteria
- [ ] `docker-compose up` completes without errors from fresh state
- [ ] Frontend loads at http://localhost:3000
- [ ] Backend API responds at http://localhost:8000/health
- [ ] Swagger UI accessible at http://localhost:8000/docs
- [ ] Frontend can fetch and display stock data from backend
- [ ] Database tables are auto-created on first startup
- [ ] Data persists after `docker-compose down && docker-compose up`
- [ ] No console errors in browser
- [ ] No error logs in container output

## Technical Notes

### Affected Components
- All Docker files (verification only, no changes expected)

### Test Procedure

1. **Clean State Test**
   ```bash
   docker-compose down -v  # Remove volumes
   docker-compose up --build
   ```

2. **Frontend Test**
   - Open http://localhost:3000
   - Verify app loads with dark theme
   - Check browser console for errors

3. **Backend Test**
   - `curl http://localhost:8000/health` → `{"status": "healthy"}`
   - Open http://localhost:8000/docs → Swagger UI

4. **Integration Test**
   - Click on stock list in frontend
   - Verify data loads from backend
   - Check network tab for successful API calls

5. **Persistence Test**
   ```bash
   docker-compose down
   docker-compose up
   # Verify data still exists
   ```

### Environment Variables to Verify
- `DATABASE_URL` correctly points to `db` service
- `VITE_API_URL` allows frontend to reach backend
- `CORS_ORIGINS` includes localhost:3000

## Dependencies
- story-005 (Docker builds)
- story-006 (Docker compose)
- story-007 (Volume mounts)

## Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Fresh start | No containers, no volumes | `docker-compose up` | All services healthy in <2min |
| Frontend loads | Containers running | Open localhost:3000 | App renders without errors |
| API health | Backend running | GET /health | Returns 200 with healthy status |
| Data fetch | Full stack running | Load stock list | Stocks display from database |
| Persistence | Data in database | down then up | Data still present |

## Estimation
- **Complexity**: M
- **Risk**: Medium (integration testing)

## References
- PRD: AC-01, AC-02, AC-03, AC-04
- Architecture: Verification Checklist

---
## Dev Notes
<!-- Filled in by Dev during implementation -->

## QA Notes
<!-- Filled in by QA during review -->
