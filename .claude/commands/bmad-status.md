# /bmad-status - BMAD Workflow Status

Display the current status of all BMAD artifacts and stories.

## Purpose
Provide a quick overview of workflow progress and identify next steps.

## Execution

1. **Check Brief Status**
   - Does `bmad/00-brief/brief.md` exist?
   - Is checklist complete?

2. **Check PRD Status**
   - Does `bmad/01-prd/PRD.md` exist?
   - Is checklist complete?

3. **Check Architecture Status**
   - Does `bmad/02-architecture/ARCHITECTURE.md` exist?
   - Is checklist complete?

4. **Check Story Status**
   - List all stories in `bmad/03-stories/`
   - Show status of each (Draft/Ready/In Progress/In Review/Done)
   - Calculate completion percentage

5. **Check QA Status**
   - List all reviews in `bmad/04-qa/`
   - Show verdicts (PASS/FAIL/NEEDS REVISION)

6. **Recent Activity**
   - List recent runlogs from `bmad/05-runlogs/`

## Output Format

```
BMAD Workflow Status
====================

Artifacts:
  [✓] Brief      - bmad/00-brief/brief.md
  [✓] PRD        - bmad/01-prd/PRD.md
  [ ] Architecture - Not created

Stories (2/5 complete):
  [Done]        story-001: User authentication
  [Done]        story-002: Login page
  [In Review]   story-003: Password reset
  [Ready]       story-004: Session management
  [Draft]       story-005: OAuth integration

QA Reviews:
  [PASS]        review-story-001.md
  [PASS]        review-story-002.md

Recent Activity:
  2025-01-15 14:30 - dev - story-003 implementation
  2025-01-15 10:00 - scrum - story creation

Next Recommended Action:
  /qa story-003 - Review password reset implementation
```

## Recommendations

Based on status, suggest next action:
- No brief? → `/analyst`
- No PRD? → `/pm`
- No architecture? → `/architect`
- No stories? → `/scrum`
- Stories ready? → `/dev story-###`
- Stories in review? → `/qa story-###`
