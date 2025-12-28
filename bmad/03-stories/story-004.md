# Story: [STORY-004] Verify Dark Theme Loading States

## Status
- [ ] Draft
- [x] Ready
- [ ] In Progress
- [ ] In Review
- [ ] Done

## User Story
**As a** user navigating to stock details
**I want** to see a loading spinner on a dark background
**So that** the page transition feels smooth without jarring white flashes

## Description

The stock detail page should show a loading spinner with a dark background matching the app's dark theme while data is being fetched. This prevents a jarring visual transition (white flash) when navigating from the stock list.

**Current Status (from code review):**
The StockDetail component already implements dark-themed loading states. This story is primarily a verification task to ensure the implementation is correct and consistent.

**Verification Focus:**
- Loading state uses dark gradient background
- Spinner is visible and properly styled
- No white background flashes during navigation
- Error state also uses dark theme

## Acceptance Criteria

- [ ] StockDetail loading state shows dark background (`bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950`)
- [ ] Loading spinner uses blue accent color (`border-blue-500`)
- [ ] Error state maintains dark theme styling
- [ ] No white flash visible during page transition
- [ ] Loading state text is readable (gray text on dark background)
- [ ] Consistent with app's overall dark theme

## Technical Notes

### Affected Components

| Component | File | Change |
|-----------|------|--------|
| StockDetail | `frontend/src/pages/StockDetail.tsx` | Verify existing implementation |

### Verification Points

1. **Loading State** (lines 53-61 in StockDetail.tsx)

   Verify this code exists and is correct:
   ```typescript
   if (loading) {
     return (
       <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
         <div className="text-center">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
           <p className="text-gray-400">Loading stock data...</p>
         </div>
       </div>
     );
   }
   ```

2. **Error State** (lines 64-84 in StockDetail.tsx)

   Verify dark background is used:
   ```typescript
   if (error || !stock || !scoreBreakdown) {
     return (
       <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
         ...
       </div>
     );
   }
   ```

3. **Main Content** (line 93+)

   Verify consistent background:
   ```typescript
   <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
   ```

### API Changes

None - this is a verification/styling task.

### Data Changes

None - this is a verification/styling task.

## Dependencies

- **Depends on**: Story-002 (Backend pagination fix - ensures navigation works)
- **Depends on**: Story-003 (Defensive error handling - ensures error states are reachable)

## Test Scenarios

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Loading state theme | Stock list is visible | Click stock card | Dark loading spinner appears (no white flash) |
| Loading text visible | Page is loading | Observe spinner | "Loading stock data..." text is visible in gray |
| Error state theme | API will fail | Navigate to invalid stock | Dark error state with red accent |
| Quick transition | Fast network | Click stock card | Smooth dark transition, data appears |
| Slow transition | Slow network (throttled) | Click stock card | Loading state visible for duration |
| Return navigation | On error page | Click "Back to Home" | Smooth transition back to list |

## Estimation
- **Complexity**: S (Small - verification only, minor fixes if needed)
- **Risk**: Low (styling verification, no logic changes)

## References
- PRD: [PRD.md](../01-prd/PRD.md) - FR-05 (Loading state), NFR-04 (Dark theme consistency)
- Architecture: [ARCHITECTURE.md](../02-architecture/ARCHITECTURE.md) - ADR-003

---
## Dev Notes
<!-- Filled in by Dev during implementation -->

## QA Notes
<!-- Filled in by QA during review -->
