# Brief: Learning Mode Default State & Empty Stock List

**Date**: 2025-12-29
**Role**: Analyst
**Status**: Complete

## Problem Statement

Two usability issues prevent new users from having a good first experience with the application:

1. **Learning Mode activates unexpectedly on app start**
2. **No stocks are displayed - list is empty**

---

## Problem 1: Learning Mode Default State

### Observed Behavior
When loading the application, Learning Mode is ON (active) even though the user has not explicitly enabled it.

### Expected Behavior
Learning Mode should be OFF by default when a user first visits the app.

### Root Cause Analysis

**File**: `frontend/src/contexts/LearningModeContext.tsx`

The initial state is correctly set to `false`:
```typescript
const [isEnabled, setIsEnabled] = useState(false);  // Line 37
```

However, a `useEffect` hook (lines 57-75) restores state from localStorage:
```typescript
useEffect(() => {
  const storedProgress = localStorage.getItem(STORAGE_KEY);
  if (storedProgress) {
    const parsed = JSON.parse(storedProgress);
    setProgress(parsed);
    setIsEnabled(parsed.currentModuleId !== null);  // Line 63
  }
}, []);
```

**Problem**: If `localStorage` contains any previous learning progress (even from a previous session), the Learning Mode automatically enables itself based on whether `currentModuleId` is not null.

### Impact
- Confusing first-time user experience
- Users see teaching prompts without requesting them
- No clear way to understand why Learning Mode is on

---

## Problem 2: Empty Stock List

### Observed Behavior
The stock list shows "No stocks found" with zero results.

### Expected Behavior
Users should see stocks to explore when using the app.

### Root Cause Analysis

**API Response**:
```json
{"items":[], "total":0, "page":1, "page_size":12, "total_pages":0}
```

The database contains no stock data.

**Investigation**:
1. Backend API is functioning correctly (responds to requests)
2. Database connection is healthy
3. Tables exist but contain no rows
4. A seed script exists: `backend/seed_data.py`
5. The seed script is NOT automatically executed during Docker startup

**File**: `Dockerfile.backend`
- Only runs `uvicorn` - no database migrations or seeding

**File**: `docker-compose.yml`
- Backend depends on `db` being healthy
- No initialization step for seeding data

### Impact
- App is completely unusable without stock data
- New developers/users have no way to test the application
- Documentation does not mention the need to run seed script

---

## Summary of Root Causes

| Issue | Type | Root Cause |
|-------|------|------------|
| Learning Mode ON | Frontend Logic | localStorage restoration overrides default state |
| Empty Stock List | Missing Data | Database seed script not run automatically |

---

## Recommendations

These findings should be reviewed by the PM to create appropriate stories:

1. **Learning Mode**: Decide whether to:
   - Always default to OFF regardless of localStorage
   - Only restore if user explicitly enabled it previously
   - Add a "reset" option for users

2. **Empty Stocks**: Decide whether to:
   - Auto-seed database on first Docker startup
   - Document manual seeding step in README
   - Both (auto-seed + document for clarity)

---

## Next Step

`/pm` to create stories for these issues.
