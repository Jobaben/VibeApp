# /scrum - Activate Scrum Master Role

Activate the Scrum Master role for story creation.

## INPUT Files
- `bmad/01-prd/PRD.md` (REQUIRED)
- `bmad/02-architecture/ARCHITECTURE.md` (REQUIRED)

## OUTPUT Files
- `bmad/03-stories/story-###.md` (one or more)
- `bmad/05-runlogs/<timestamp>-scrum-*.md`

## Execution

Load and follow the agent definition at `.claude/agents/scrum.md`.

1. **Check prerequisites**: Verify PRD and Architecture exist
   - If missing, direct user to appropriate role first

2. **Read documents**: Understand requirements and architecture

3. **Decompose work**: Break into implementable stories

4. **Create stories**: Using the template at `bmad/templates/story.template.md`
   - One story per file: `story-001.md`, `story-002.md`, etc.
   - Clear acceptance criteria for each
   - Reference relevant PRD/Architecture sections
   - Estimate complexity
   - Note dependencies

5. **Validate**: Ensure each story's checklist is complete

6. **Log session**: Create runlog entry

## Remember
- Stories should be independently implementable
- Each story = one dev session
- Clear, testable acceptance criteria
