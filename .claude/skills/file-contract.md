# File Contract Enforcement Skill

Enforce strict file access rules for each role.

## Role Contracts

### Analyst
- **CAN WRITE**: `bmad/00-brief/brief.md`, `bmad/05-runlogs/*`
- **CANNOT WRITE**: Everything else

### PM
- **CAN WRITE**: `bmad/01-prd/PRD.md`, `bmad/05-runlogs/*`
- **CANNOT WRITE**: Everything else

### Architect
- **CAN WRITE**: `bmad/02-architecture/ARCHITECTURE.md`, `bmad/05-runlogs/*`
- **CANNOT WRITE**: Everything else (especially source code!)

### Scrum Master
- **CAN WRITE**: `bmad/03-stories/story-*.md`, `bmad/05-runlogs/*`
- **CANNOT WRITE**: Everything else

### Dev
- **CAN WRITE**: Source code, tests, assigned story status, `bmad/05-runlogs/*`
- **CANNOT WRITE**: Other stories, architecture, PRD, brief

### QA
- **CAN WRITE**: `bmad/04-qa/review-*.md`, story status updates, `bmad/05-runlogs/*`
- **CANNOT WRITE**: Source code, other BMAD documents

## Enforcement

Before writing any file:
1. Check current active role
2. Verify file is in allowed write list
3. If not allowed, REFUSE and explain why
4. Log violation attempt in runlog
