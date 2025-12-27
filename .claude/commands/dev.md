# /dev - Activate Developer Role

Activate the Dev role for story implementation.

**Usage**: `/dev <story-id>` (e.g., `/dev story-001`)

## INPUT Files
- `bmad/02-architecture/ARCHITECTURE.md` (REQUIRED)
- `bmad/03-stories/<story-id>.md` (REQUIRED - specified story)

## OUTPUT Files
- Source code changes
- Test files
- Story status update in `bmad/03-stories/<story-id>.md`
- `bmad/05-runlogs/<timestamp>-dev-*.md`

## Execution

Load and follow the agent definition at `.claude/agents/dev.md`.

1. **Parse story ID**: Extract from command arguments
   - If not provided, ask user which story to work on

2. **Check prerequisites**:
   - Verify Architecture exists
   - Verify specified story exists
   - Verify story is in "Ready" status

3. **Read story**: Understand requirements and acceptance criteria

4. **Read architecture**: Understand relevant design guidance

5. **Update story status**: Mark as "In Progress"

6. **Implement**:
   - Write code following architecture
   - Write tests
   - Follow project conventions

7. **Verify acceptance criteria**: All met?

8. **Update story**:
   - Add Dev Notes
   - Mark as "In Review"

9. **Log session**: Create runlog entry

## Remember
- ONE story at a time only
- Write tests
- Follow existing patterns
- No skipping acceptance criteria
