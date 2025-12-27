# BMAD Workflow

**Business-Model-Agile-Development** - A file-driven agentic workflow for structured software development.

## Directory Structure

| Directory | Purpose | Owner |
|-----------|---------|-------|
| `00-brief/` | Problem framing and scope definition | Analyst |
| `01-prd/` | Product requirements document | PM |
| `02-architecture/` | Technical design and decisions | Architect |
| `03-stories/` | User stories for implementation | Scrum Master |
| `04-qa/` | QA reviews and test plans | QA |
| `05-runlogs/` | Session logs for all roles | All |
| `templates/` | Document templates | System |

## Workflow Phases

```
[Analyst] → brief.md
     ↓
[PM] → PRD.md
     ↓
[Architect] → ARCHITECTURE.md
     ↓
[Scrum Master] → story-###.md files
     ↓
[Dev] → Code implementation (one story at a time)
     ↓
[QA] → review-story-###.md
```

## Role Commands

- `/analyst` - Frame the problem and define scope
- `/pm` - Create product requirements from brief
- `/architect` - Design technical architecture from PRD
- `/scrum` - Break architecture into implementable stories
- `/dev <story-id>` - Implement a specific story
- `/qa <story-id>` - Review a completed story
- `/bmad-status` - Check workflow status

## Role Contracts

Each role has strict file contracts:

| Role | Reads | Writes | Forbidden |
|------|-------|--------|-----------|
| Analyst | Operator input | `00-brief/brief.md` | Solution design |
| PM | `brief.md` | `01-prd/PRD.md` | Implementation details |
| Architect | `PRD.md`, repo | `02-architecture/ARCHITECTURE.md` | Code changes |
| Scrum | PRD, Architecture | `03-stories/story-###.md` | Direct implementation |
| Dev | One story, architecture | Code, tests, story status | Multi-story work |
| QA | Story, PRD, architecture, diff | `04-qa/review-story-###.md` | Code changes |

## Quality Gates

Before transitioning phases:
- Required artifacts must exist and be complete
- All checklists must be satisfied
- No forbidden actions occurred
- Runlog entry created for the session
