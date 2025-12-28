# Project Brief

## Problem Statement

The GitHub CI pipeline fails during the `npm ci` step because **`package.json` and `package-lock.json` are out of sync**.

**Error from CI:**
```
npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync.
npm error Invalid: lock file's react-is@19.2.0 does not satisfy react-is@19.2.3
```

**Who has this problem**: All developers and CI/CD pipeline - any PR or push to main/develop branches fails.

## Current State

### Primary Issue: Lock File Out of Sync

**Location**: `frontend/package.json` and `frontend/package-lock.json`

- `package.json` requires: `"react-is": "^19.2.3"`
- `package-lock.json` has: `react-is@19.2.0`

The `npm ci` command requires exact sync between these files and fails when they differ.

**Root Cause**: The `package.json` was updated (likely by a dependency bump) but `npm install` was not run to regenerate the lock file before committing.

### Secondary Issue: ESLint Configuration Missing

ESLint 9.x is installed but no `eslint.config.js` exists. CI has a workaround with `continue-on-error: true`, so this doesn't block builds.

### CI Job Status

| CI Job | Status | Notes |
|--------|--------|-------|
| Frontend npm ci | **FAIL** | Lock file out of sync |
| Frontend ESLint | SKIP | No config, has workaround |
| Frontend Build | BLOCKED | Can't run without npm ci |
| Backend Tests | PASS | 241 tests pass |
| Backend Linting | PASS | flake8 passes |

## Desired Outcome

1. `npm ci` succeeds in CI
2. All CI jobs pass without workarounds

**Measurement**: CI pipeline completes successfully on push/PR.

## Scope

### In Scope
- Regenerate `package-lock.json` by running `npm install`
- Commit the updated lock file
- Verify CI passes

### Out of Scope
- Fixing ESLint configuration (separate issue)
- Backend formatting/type issues (have workarounds)

## Stakeholders

| Stakeholder | Interest |
|-------------|----------|
| Developers | PRs are blocked by failing CI |
| Reviewers | Cannot merge PRs |
| Product | Deployment pipeline broken |

## Constraints

- **Technical**: Must use `npm install` to regenerate lock file
- **Process**: Lock file must be committed to git

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| New dependency versions break build | Low | High | Test build after regenerating |
| Other lock file conflicts | Low | Medium | Check git status before commit |

## Success Criteria

- [ ] `npm ci` succeeds locally
- [ ] `npm run build` succeeds locally
- [ ] Updated `package-lock.json` committed
- [ ] CI pipeline passes

---
## Checklist
- [x] Problem clearly articulated
- [x] Stakeholders identified
- [x] Scope boundaries defined
- [x] Success criteria measurable
- [x] Risks documented
