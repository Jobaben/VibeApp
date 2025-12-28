# Project Brief

## Problem Statement

The GitHub CI pipeline has configuration issues causing potential failures. The primary issue is a **missing ESLint configuration file** for ESLint v9.x, which requires the new flat config format (`eslint.config.js`) but no config file exists in the frontend directory.

**Who has this problem**: Developers and CI/CD pipeline - any PR or push to main/develop branches.

## Current State

After running all CI processes locally, the following issues were identified:

### Critical Issue: ESLint Configuration Missing

**Location**: `frontend/` directory

ESLint 9.x (`^9.15.0`) is installed in `package.json` but there is **no ESLint configuration file** (`eslint.config.js`, `.eslintrc.*`). The CI workflow has a workaround:

```yaml
run: npm run lint || echo "ESLint config needs migration to v9 format - skipping for now"
continue-on-error: true
```

**Error when running `npm run lint`:**
```
ESLint: 9.38.0
ESLint couldn't find an eslint.config.(js|mjs|cjs) file.
```

### Secondary Issues (Non-blocking due to continue-on-error)

1. **Black formatting** - 35 files would need reformatting
   - Has `continue-on-error: true` in CI

2. **Mypy type errors** - 12 type errors in 6 files
   - Missing type annotations
   - Has `continue-on-error: true` in CI

### What Works

| CI Job | Status | Notes |
|--------|--------|-------|
| Backend Tests (pytest) | PASS | 241 tests pass |
| Backend Linting (flake8) | PASS | No critical errors |
| Frontend Build | PASS | Builds successfully |
| TypeScript Check | PASS | No errors |
| Integration Tests | PASS | All pass |

## Desired Outcome

1. Create a proper ESLint flat config (`eslint.config.js`) for the frontend
2. Remove the workaround from CI workflow
3. Optionally: Fix Black formatting and Mypy type errors

**Measurement**: CI pipeline runs green on all jobs without `continue-on-error` workarounds.

## Scope

### In Scope
- Create `eslint.config.js` with proper React/TypeScript configuration
- Update CI workflow to remove ESLint workaround
- Test that CI passes

### Out of Scope
- Fixing all Black formatting issues (can be done separately)
- Fixing all Mypy type errors (can be done separately)
- Upgrading dependencies

## Stakeholders

| Stakeholder | Interest |
|-------------|----------|
| Developers | Need clean CI feedback on code quality |
| DevOps | Need reliable CI pipeline |
| Code Reviewers | Need linting to catch issues |

## Constraints

- **Technical**: Must use ESLint 9.x flat config format
- **Compatibility**: Config must work with existing React/TypeScript setup
- **CI**: Should not break existing passing tests

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| ESLint config breaks existing code | Low | Medium | Use relaxed rules initially |
| CI timeout with new checks | Low | Low | Monitor CI run times |
| Breaking TypeScript integration | Low | Medium | Test locally first |

## Success Criteria

- [ ] `eslint.config.js` exists in frontend directory
- [ ] `npm run lint` runs without errors about missing config
- [ ] CI workflow ESLint step passes without workaround
- [ ] No new linting errors block the build

---
## Checklist
- [x] Problem clearly articulated
- [x] Stakeholders identified
- [x] Scope boundaries defined
- [x] Success criteria measurable
- [x] Risks documented
