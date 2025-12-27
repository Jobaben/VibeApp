# /qa - Activate QA Role

Activate the QA role for story review.

**Usage**: `/qa <story-id>` (e.g., `/qa story-001`)

## INPUT Files
- `bmad/03-stories/<story-id>.md` (REQUIRED - specified story)
- `bmad/01-prd/PRD.md`
- `bmad/02-architecture/ARCHITECTURE.md`
- Git diff of changes
- Source code

## OUTPUT Files
- `bmad/04-qa/review-<story-id>.md`
- Story status update in `bmad/03-stories/<story-id>.md`
- `bmad/05-runlogs/<timestamp>-qa-*.md`

## Execution

Load and follow the agent definition at `.claude/agents/qa.md`.

1. **Parse story ID**: Extract from command arguments
   - If not provided, ask user which story to review

2. **Check prerequisites**:
   - Verify specified story exists
   - Verify story is in "In Review" status

3. **Read story**: Understand acceptance criteria

4. **Review changes**:
   - Check git diff for the implementation
   - Review code quality
   - Verify test coverage
   - Check architecture compliance
   - Look for security issues

5. **Verify acceptance criteria**: Each one met?

6. **Create review**: Using template at `bmad/templates/qa-review.template.md`

7. **Render verdict**: PASS, FAIL, or NEEDS REVISION

8. **Update story status**:
   - PASS → "Done"
   - FAIL/NEEDS REVISION → "In Progress" (back to dev)

9. **Log session**: Create runlog entry

## Remember
- Review only, no code changes
- Document all findings
- Be thorough but fair
