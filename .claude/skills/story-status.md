# Story Status Skill

Manage story status transitions.

## Valid Statuses

```
Draft → Ready → In Progress → In Review → Done
                    ↑              |
                    └──────────────┘
                   (if QA fails)
```

## Status Definitions

- **Draft**: Story is being written, not ready for work
- **Ready**: Story is complete and ready for development
- **In Progress**: Developer is actively working on it
- **In Review**: Development complete, awaiting QA
- **Done**: QA passed, story complete

## Transition Rules

| From | To | Who Can Transition |
|------|----|--------------------|
| Draft | Ready | Scrum Master |
| Ready | In Progress | Dev |
| In Progress | In Review | Dev |
| In Review | Done | QA (on PASS) |
| In Review | In Progress | Dev (on FAIL) |

## Updating Status

In the story file, update the Status section checkboxes:

```markdown
## Status
- [ ] Draft
- [ ] Ready
- [x] In Progress  ← Check the current status
- [ ] In Review
- [ ] Done
```

## Enforcement

- Only one status should be checked at a time
- Status can only move forward (except In Review → In Progress for fixes)
- Document status changes in the story's Dev/QA Notes section
