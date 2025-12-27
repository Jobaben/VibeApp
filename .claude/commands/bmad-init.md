# /bmad-init - Initialize BMAD Workflow

Initialize or repair the BMAD workflow structure in this repository.

## Purpose
Creates the complete BMAD directory structure and validates existing setup.

## INPUT Files
None required - this is the bootstrap command.

## OUTPUT Files
Creates if missing:
- `bmad/00-brief/` directory
- `bmad/01-prd/` directory
- `bmad/02-architecture/` directory
- `bmad/03-stories/` directory
- `bmad/04-qa/` directory
- `bmad/05-runlogs/` directory
- `bmad/templates/` with all template files
- `bmad/README.md`

## Execution Steps

1. **Check existing structure**
   - Scan for existing `bmad/` directory
   - Scan for existing `.claude/` directory
   - Note what exists vs what's missing

2. **Create missing directories**
   ```
   bmad/
   bmad/00-brief/
   bmad/01-prd/
   bmad/02-architecture/
   bmad/03-stories/
   bmad/04-qa/
   bmad/05-runlogs/
   bmad/templates/
   ```

3. **Create missing template files**
   - `bmad/templates/brief.template.md`
   - `bmad/templates/prd.template.md`
   - `bmad/templates/architecture.template.md`
   - `bmad/templates/story.template.md`
   - `bmad/templates/qa-review.template.md`
   - `bmad/templates/test-plan.template.md`
   - `bmad/templates/risk-register.template.md`
   - `bmad/templates/runlog.template.md`

4. **Create bmad/README.md** if missing
   - Document the BMAD workflow
   - Explain directory structure
   - Link to role contracts

5. **Create bmad/05-runlogs/README.md** if missing

6. **Validate .claude/ structure**
   - Confirm commands exist
   - Confirm agents exist
   - Confirm skills exist

7. **Report status**
   - List created items
   - List existing items preserved
   - Confirm ready state

## Success Criteria
- All directories exist
- All templates exist
- README.md exists
- No existing files overwritten

## Next Steps
After init, recommend: `/analyst` to begin problem framing
