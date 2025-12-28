# Architecture Document

## Overview

This document describes the technical design for fixing the Learning Mode modal close button bug.

Reference: [PRD](../01-prd/PRD.md)

### System Context

The Learning Mode feature consists of a React context provider (`LearningModeContext`) that manages state for multiple UI components. The modal (`LessonContent`) and sidebar (`LessonSidebar`) both consume this context.

### Design Principles

1. **Minimal Change**: Add a single function to existing context; update one handler
2. **Separation of Concerns**: Modal close behavior should be independent of sidebar toggle
3. **State Preservation**: Closing modal must not affect progress or sidebar state

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      LearningModeProvider                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  State:                                                   │   │
│  │    - isEnabled                                            │   │
│  │    - isSidebarOpen                                        │   │
│  │    - currentLesson ←── Setting to null closes modal      │   │
│  │    - currentModule                                        │   │
│  │    - progress (persisted to localStorage)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│              ┌───────────────┼───────────────┐                   │
│              │               │               │                    │
│              ▼               ▼               ▼                    │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐         │
│   │ LessonContent│   │ LessonSidebar│   │ LearningMode │         │
│   │   (Modal)    │   │   (Drawer)   │   │   Toggle     │         │
│   │              │   │              │   │   (Button)   │         │
│   │ X → closeLesson│   │ X → toggleSidebar│              │         │
│   └──────────────┘   └──────────────┘   └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Component Descriptions

| Component | Responsibility | File |
|-----------|---------------|------|
| LearningModeContext | State management for all learning mode features | `frontend/src/contexts/LearningModeContext.tsx` |
| LessonContent | Displays lesson modal with content, quiz, navigation | `frontend/src/components/learning/LessonContent.tsx` |
| LessonSidebar | Right-side drawer listing modules and lessons | `frontend/src/components/learning/LessonSidebar.tsx` |
| LearningModeToggle | Header button to enable/disable learning mode | `frontend/src/components/learning/LearningModeToggle.tsx` |

## Data Design

### State Model (Existing - No Changes)

```typescript
interface LearningModeState {
  isEnabled: boolean;           // Learning mode active
  isSidebarOpen: boolean;       // Sidebar drawer visible
  currentModule: Module | null; // Active module
  currentLesson: Lesson | null; // Active lesson (null = modal closed)
  progress: LearningProgress;   // Persisted progress data
}
```

### Data Flow

```
User clicks X button on modal
         │
         ▼
closeLesson() called
         │
         ▼
setCurrentLesson(null)
         │
         ├─► Modal condition (currentLesson !== null) fails
         │   └─► Modal unmounts (closes)
         │
         └─► isSidebarOpen unchanged
             └─► Sidebar remains in current state
```

## API Design

### New Context Method

| Method | Signature | Purpose |
|--------|-----------|---------|
| closeLesson | `() => void` | Closes the lesson modal by clearing currentLesson |

### Interface Change

```typescript
// Add to LearningModeContextType in frontend/src/types/learning.ts
export interface LearningModeContextType {
  // ... existing members ...

  // NEW: Close the lesson modal without affecting other state
  closeLesson: () => void;
}
```

### Implementation Specification

```typescript
// In LearningModeContext.tsx, add after line 143:
const closeLesson = useCallback(() => {
  setCurrentLesson(null);
}, []);

// Add to value object (line 345-367):
const value: LearningModeContextType = {
  // ... existing values ...
  closeLesson,  // NEW
};
```

### Component Update

```typescript
// In LessonContent.tsx, line 13:
// Change: toggleSidebar,
// To:     closeLesson,

// Line 372:
// Change: onClick={toggleSidebar}
// To:     onClick={closeLesson}
```

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| UI | React 18 | Existing framework |
| State | React Context + useCallback | Existing pattern |
| Types | TypeScript | Existing type system |
| Persistence | localStorage | Existing progress storage |

## Security Considerations

No security implications - this is a UI bug fix that does not involve:
- Authentication/authorization
- Data transmission
- User input handling
- External API calls

## Performance Considerations

| Concern | Mitigation |
|---------|------------|
| Re-renders | `useCallback` ensures stable function reference |
| Memory | No new state objects created |
| Storage | No additional localStorage operations |

The `closeLesson` function is O(1) - a single state setter call with no computation.

## Architectural Decisions

### ADR-001: Separate closeLesson vs. Modifying toggleSidebar

- **Status**: Accepted
- **Context**: The close button currently calls `toggleSidebar()`. We could either:
  (A) Add a new `closeLesson()` function
  (B) Modify `toggleSidebar()` to also close the lesson
  (C) Add a parameter to `toggleSidebar(closeLesson?: boolean)`
- **Decision**: Option A - Add new `closeLesson()` function
- **Consequences**:
  - Clear separation of concerns (sidebar toggle vs lesson close)
  - No risk of breaking existing sidebar behavior
  - Self-documenting code - function name matches intent
  - Slightly larger context API (one more method)

### ADR-002: Not Updating progress.currentLessonId on Close

- **Status**: Accepted
- **Context**: When closing, should we set `progress.currentLessonId` to null?
- **Decision**: No - only set `currentLesson` to null
- **Consequences**:
  - Progress state remains accurate (user was on this lesson)
  - Re-opening sidebar shows correct "current" lesson
  - Matches behavior of how the context already works (modal visibility is separate from progress tracking)

## Integration Points

| Integration | Type | Impact |
|-------------|------|--------|
| TypeScript types | Internal | Add `closeLesson` to `LearningModeContextType` |
| Context provider | Internal | Add `closeLesson` function and expose in value |
| LessonContent | Internal | Import `closeLesson` instead of `toggleSidebar` for X button |

## Files to Modify

| File | Change |
|------|--------|
| `frontend/src/types/learning.ts` | Add `closeLesson: () => void` to `LearningModeContextType` |
| `frontend/src/contexts/LearningModeContext.tsx` | Add `closeLesson` function and include in context value |
| `frontend/src/components/learning/LessonContent.tsx` | Change close button handler from `toggleSidebar` to `closeLesson` |

## Migration Strategy

N/A - This is a bug fix, not a migration. Changes are backwards compatible.

---
## Checklist
- [x] All PRD requirements addressable
- [x] Components clearly defined
- [x] Data models documented
- [x] API contracts specified
- [x] Technology choices justified
- [x] Security addressed
- [x] Performance considerations noted
- [x] Links back to PRD.md
