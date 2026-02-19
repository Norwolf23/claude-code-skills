# Contributing to Claude Code Skills

Thank you for your interest in contributing. This collection grows through real work, not theoretical exercises.

## What Makes a Good Skill

A skill must:

1. **Emerge from real work** -- It was extracted from an actual development session, not invented for the repo
2. **Be self-contained** -- A reader should be able to apply it without external context
3. **Include an Origin section** -- Document the session that produced it
4. **Follow Gold Hat** -- Empower users, never extract from them

## Structure

Each skill is a directory containing at minimum a `SKILL.md`:

```
your-skill-name/
  SKILL.md             # Required: the skill
  references/          # Optional: supporting files, templates, examples
```

## SKILL.md Format

```markdown
---
name: your-skill-name
description: "One-line description. Trigger phrases: 'when to use this'."
---

# Skill Name

[What it does in 1-2 sentences]

## When to Use
[Situations this applies]

## Instructions
[Step-by-step process]

## Quality Criteria
[How to know the output is good]

## Anti-Patterns
[Common mistakes to avoid]

## Origin
[What session produced this, when, what was the context]
```

## Submitting

1. Fork the repo
2. Create a branch: `skill/your-skill-name`
3. Add your skill directory
4. Update the Catalog table in README.md
5. Submit a PR

## Code of Conduct

We follow the Gold Hat Philosophy: every contribution should empower users, never extract from them. Be genuine, be clear, be conscious.
