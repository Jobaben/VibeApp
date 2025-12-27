# Artifact Check Skill

Check that required artifacts exist before proceeding with a role.

## Usage

Before starting work in any role, verify dependencies:

```
Analyst: No dependencies
PM: bmad/00-brief/brief.md must exist
Architect: bmad/01-prd/PRD.md must exist
Scrum: bmad/01-prd/PRD.md AND bmad/02-architecture/ARCHITECTURE.md must exist
Dev: bmad/02-architecture/ARCHITECTURE.md AND specified story must exist
QA: Specified story must exist and be "In Review"
```

## Verification Steps

1. Check if required file(s) exist
2. Verify files are non-empty
3. Check that required checklists are complete (if applicable)
4. Report status to user

## On Failure

If artifacts are missing:
1. List what's missing
2. Recommend the correct role to create them
3. Do NOT proceed with current role
