# Project Brief

## Problem Statement

**Developers must manually set up and run multiple services** to work with VibeApp:
- Create and activate a Python virtual environment
- Install Python dependencies via pip
- Install Node.js dependencies via yarn
- Start the backend server manually
- Start the frontend dev server manually

**Who has this problem**: All developers and users who want to run the application locally.

## Current State

### How It's Currently Handled

1. **Backend Setup** (manual):
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. **Frontend Setup** (manual):
   ```bash
   cd frontend
   yarn install
   yarn dev
   ```

3. **Dependencies**: Requires Python 3.11+, Node.js 22+, and yarn installed locally

### Pain Points

| Pain Point | Impact |
|------------|--------|
| Multiple terminal windows needed | Cognitive overhead |
| Python/Node version conflicts | "Works on my machine" issues |
| Manual dependency installation | Time-consuming onboarding |
| No database/Redis in current setup | Missing infrastructure services |
| Existing Docker files are untested scaffolding | False promise of container support |

### Existing Docker Files (Non-Functional)

The repository contains Docker-related files that were scaffolded but never made functional:
- `docker-compose.yml` - Defines services but untested
- `Dockerfile.backend` - May have incorrect paths or missing deps
- `Dockerfile.frontend` - May not build correctly
- `.dockerignore` - Exists but may need updates

## Desired Outcome

A single command (`docker-compose up`) that:
1. Builds and starts all required services
2. Sets up the database with initial schema
3. Runs the backend API server
4. Runs the frontend development server
5. Handles all dependencies automatically

**Measurement**: New developer can clone repo and run `docker-compose up` with zero additional setup.

## Scope

### In Scope
- Fix/validate existing Dockerfiles
- Fix/validate docker-compose.yml
- Ensure backend container builds and runs
- Ensure frontend container builds and runs
- Database initialization and connectivity
- Service health checks and startup order
- Documentation for Docker usage

### Out of Scope
- Production-grade Docker configuration (multi-stage builds, security hardening)
- Kubernetes/orchestration support
- CI/CD Docker integration
- Cloud deployment configurations

## Stakeholders

| Stakeholder | Interest |
|-------------|----------|
| Developers | Faster onboarding, consistent environment |
| Contributors | Lower barrier to entry |
| Reviewers | Easy way to test PRs locally |

## Constraints

| Constraint | Description |
|------------|-------------|
| Existing file structure | Must work with current backend/ and frontend/ layout |
| Development focus | Optimized for dev experience, not production |
| Port availability | Default ports 8000 (API), 3000 (frontend), 5432 (DB) |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Hot reload may not work in containers | Medium | Medium | Configure volume mounts correctly |
| Database data persistence | Low | Medium | Use named volumes |
| Build time on first run | Low | Low | Document expected wait time |
| Port conflicts with local services | Medium | Low | Document how to change ports |

## Success Criteria

- [ ] `docker-compose up` builds all images without errors
- [ ] Backend container starts and responds to health checks
- [ ] Frontend container starts and is accessible at localhost:3000
- [ ] Frontend can communicate with backend API
- [ ] Database is initialized and accessible
- [ ] Hot reload works for both frontend and backend code changes
- [ ] Documentation updated with Docker usage instructions

## Next Steps

Proceed to `/pm` to define product requirements for the Docker support feature.

---
## Checklist
- [x] Problem clearly articulated
- [x] Stakeholders identified
- [x] Scope boundaries defined
- [x] Success criteria measurable
- [x] Risks documented
