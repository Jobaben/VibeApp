# Project Brief

## Problem Statement

The Learning Mode modal's close button (X icon in top-right corner) does not dismiss the modal. Instead, it toggles the lesson sidebar drawer on/off, leaving the modal permanently displayed. This renders the application unusable once a user opens a lesson, as they cannot return to the main application.

**Who has this problem**: All users who engage with the Learning Mode feature.

## Current State

The `LessonContent` modal component (`frontend/src/components/learning/LessonContent.tsx:371-379`) has a close button that calls `toggleSidebar()` instead of closing the lesson modal:

```typescript
<button
  onClick={toggleSidebar}  // BUG: This toggles sidebar, not the modal
  className="p-2 text-gray-400 hover:text-white transition-colors"
  title="Close lesson"
>
```

**Pain Points**:
- Modal cannot be closed once opened
- Only workaround is page refresh, losing user context
- Breaks the entire learning flow experience
- Users cannot access any other part of the application

**Root Cause**: The `LearningModeContext` provides `toggleSidebar()` but does not expose a dedicated `closeLesson()` function. The context does have internal access to `setCurrentLesson(null)` which would close the modal (line 314), but this is only used within `resetProgress()`.

## Desired Outcome

The close button (X) on the LessonContent modal should:
1. Close the lesson modal and return user to the main application
2. Optionally keep the sidebar open so users can select another lesson
3. Preserve lesson progress (do not reset progress on close)

**Measurement**: User can open a lesson, click the X button, and be returned to the normal application view without losing any progress or needing to refresh.

## Scope

### In Scope
- Fix the close button handler in `LessonContent.tsx`
- Add a `closeLesson()` function to `LearningModeContext` if needed
- Ensure modal closes properly without side effects

### Out of Scope
- Redesigning the learning mode UI
- Adding keyboard shortcuts (Escape key) - future enhancement
- Changing sidebar behavior
- Adding confirmation dialogs

## Stakeholders

| Stakeholder | Interest |
|-------------|----------|
| End Users | Need functional close button to use the app |
| Product | Learning mode is a key feature that must work |
| Dev Team | Simple fix with clear scope |

## Constraints

- **Technical**: Fix must maintain existing learning progress persistence
- **UX**: Close behavior should be intuitive (X closes modal, not something else)
- **Code**: Should follow existing patterns in the codebase

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking sidebar toggle | Low | Medium | Test sidebar still works after fix |
| Progress loss on close | Low | High | Ensure closeLesson() doesn't call resetProgress() |
| State desync | Low | Medium | Verify currentLesson null state is handled |

## Success Criteria

- [ ] Clicking X button on LessonContent modal closes the modal
- [ ] Sidebar remains accessible after closing lesson modal
- [ ] User progress is preserved when closing modal
- [ ] User can re-open lessons after closing
- [ ] No console errors or state desync issues

---
## Checklist
- [x] Problem clearly articulated
- [x] Stakeholders identified
- [x] Scope boundaries defined
- [x] Success criteria measurable
- [x] Risks documented
