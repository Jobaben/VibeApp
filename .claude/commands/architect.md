# /architect - Activate Architect Role

Activate the Architect role for technical design.

## INPUT Files
- `bmad/01-prd/PRD.md` (REQUIRED)
- Repository source code (read-only reference)

## OUTPUT Files
- `bmad/02-architecture/ARCHITECTURE.md`
- `bmad/05-runlogs/<timestamp>-architect-*.md`

## Execution

Load and follow the agent definition at `.claude/agents/architect.md`.

1. **Check prerequisites**: Verify `bmad/01-prd/PRD.md` exists
   - If missing, direct user to `/pm` first

2. **Read the PRD**: Understand all requirements

3. **Survey codebase**: Understand existing architecture (if any)

4. **Create architecture**: Using the template at `bmad/templates/architecture.template.md`
   - Define components and responsibilities
   - Design data models
   - Specify API contracts
   - Choose and justify technologies
   - Address security and performance
   - Document architectural decisions (ADRs)

5. **Validate**: Ensure all checklist items are complete

6. **Log session**: Create runlog entry

## Remember
- Design only, no code implementation
- All requirements must be addressable
- Justify technology choices
