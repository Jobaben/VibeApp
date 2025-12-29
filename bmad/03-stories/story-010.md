# Story: [STORY-010] Fix Learning Mode Default State

## Status
- [ ] Draft
- [ ] Ready
- [ ] In Progress
- [ ] In Review
- [x] Done

## User Story
**As a** new user
**I want** Learning Mode to be OFF by default
**So that** I can explore the app without unexpected tutorials appearing

## Description
Currently, Learning Mode can auto-enable when the app loads if there is any localStorage data from a previous session. The `LearningModeContext` restores the `isEnabled` state based on whether `currentModuleId` is not null in stored progress. This causes confusion for users who never explicitly enabled Learning Mode.

The fix should ensure Learning Mode only activates when the user explicitly toggles it ON, not based on incidental localStorage state.

## Acceptance Criteria
- [ ] Learning Mode toggle shows OFF on first visit
- [ ] Learning Mode remains OFF even if localStorage contains progress data from previous sessions
- [ ] When user explicitly enables Learning Mode, it persists across sessions
- [ ] When user explicitly disables Learning Mode, it remains OFF on next visit
- [ ] Clearing localStorage resets Learning Mode to OFF (default behavior)

## Technical Notes

### Affected Components
- `frontend/src/contexts/LearningModeContext.tsx`

### Root Cause
Line 63 sets `isEnabled` based on `parsed.currentModuleId !== null`:
```typescript
setIsEnabled(parsed.currentModuleId !== null);
```

This auto-enables Learning Mode whenever there's any stored learning progress.

### Solution Approach
Add explicit `isEnabled` flag to localStorage state. Only restore `isEnabled: true` if it was explicitly set by user action. The progress data can still be restored, but the mode should only activate based on the explicit flag.

### Data Changes
Update localStorage structure from:
```json
{
  "currentModuleId": "...",
  "completedLessons": [...]
}
```
To:
```json
{
  "isEnabled": true,  // New explicit flag
  "currentModuleId": "...",
  "completedLessons": [...]
}
```

## Dependencies
- None (independent story)

## Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| New user | No localStorage | App loads | Learning Mode toggle is OFF |
| Returning user (never enabled) | localStorage has progress but no explicit enable | App loads | Learning Mode toggle is OFF |
| Returning user (explicitly enabled) | localStorage has `isEnabled: true` | App loads | Learning Mode toggle is ON |
| User disables Learning Mode | User toggles OFF | Next session | Learning Mode remains OFF |
| Clear storage | User clears localStorage | App loads | Learning Mode toggle is OFF |

## Estimation
- **Complexity**: S
- **Risk**: Low

## References
- PRD Section: FR-14, FR-15, AC-07, AC-08
- Brief: `bmad/00-brief/brief-learning-mode-and-empty-stocks.md`

---
## Dev Notes

**Completed**: 2025-12-29

### Changes Made

Modified `frontend/src/contexts/LearningModeContext.tsx`:

1. **Added separate storage key** for explicit `isEnabled` state:
   ```typescript
   const ENABLED_KEY = 'vibeapp_learning_enabled';
   ```

2. **Updated load logic** (lines 68-73): Only restore `isEnabled: true` if explicitly stored:
   ```typescript
   const storedEnabled = localStorage.getItem(ENABLED_KEY);
   if (storedEnabled === 'true') {
     setIsEnabled(true);
   }
   ```

3. **Added save effect** (lines 97-106): Persist `isEnabled` state when user toggles:
   ```typescript
   useEffect(() => {
     if (isInitialized) {
       localStorage.setItem(ENABLED_KEY, String(isEnabled));
     }
   }, [isEnabled, isInitialized]);
   ```

4. **Updated resetProgress** (lines 337-342): Clear enabled key on reset:
   ```typescript
   localStorage.removeItem(ENABLED_KEY);
   ```

### Acceptance Criteria Verification

- [x] Learning Mode toggle shows OFF on first visit - `isEnabled` starts as `false`
- [x] Learning Mode remains OFF with old localStorage - only `'true'` enables it
- [x] Explicitly enabling persists - saves to `ENABLED_KEY`
- [x] Disabling persists - saves `'false'` to `ENABLED_KEY`
- [x] Clearing localStorage resets to OFF - default `false` state

### Backward Compatibility

Old localStorage data (without `ENABLED_KEY`) will result in Learning Mode being OFF, which is the desired default behavior. Progress data is preserved; only the auto-enable behavior is removed.

## QA Notes

**Reviewed**: 2025-12-29
**Verdict**: PASS

All acceptance criteria verified:
- Learning Mode toggle OFF on first visit
- Old localStorage data does not auto-enable
- Explicit enable/disable persists correctly
- Reset clears enabled state

Implementation is clean, follows existing patterns, and maintains backward compatibility.

See full review: `bmad/04-qa/review-story-010.md`
