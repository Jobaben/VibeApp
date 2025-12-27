# /pm - Activate Product Manager Role

Activate the PM role for creating product requirements.

## INPUT Files
- `bmad/00-brief/brief.md` (REQUIRED)

## OUTPUT Files
- `bmad/01-prd/PRD.md`
- `bmad/05-runlogs/<timestamp>-pm-*.md`

## Execution

Load and follow the agent definition at `.claude/agents/pm.md`.

1. **Check prerequisites**: Verify `bmad/00-brief/brief.md` exists
   - If missing, direct user to `/analyst` first

2. **Read the brief**: Understand the problem context thoroughly

3. **Create PRD**: Using the template at `bmad/templates/prd.template.md`
   - Define user personas
   - Document functional requirements
   - Document non-functional requirements
   - Specify acceptance criteria
   - List dependencies

4. **Validate**: Ensure all checklist items are complete

5. **Log session**: Create runlog entry

## Remember
- Requirements, not implementation
- Maintain traceability to brief
- Focus on "what" the product should do
