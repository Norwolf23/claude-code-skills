---
name: meta-distill
description: Bridge from session learnings to a concrete artifact (memory file, skill, subagent, or slash command). Applies φ-classification to pick the right destination based on complexity/reusability
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Skill, Agent, Task
argument-hint: [memory|skill|agent|command] [subject]
---

# /meta-distill — Meta-Distillation Bridge

Bridge the categorical-meta output into one of four concrete artifacts. The engine generates patterns; this command lands them as durable tools.

## Task
$ARGUMENTS

---

## Step 1 — Choose destination

If $ARGUMENTS begins with `memory|skill|agent|command`, that's the target. Otherwise:

1. Look at the recent session (last ~30 turns) and the optional `[subject]` phrase.
2. Apply the **φ-classification**:

| Score | Destination | Why |
|-------|-------------|-----|
| < φ⁻¹ (≈ 0.382) | **memory** | Single non-obvious fact; no reusable workflow |
| 0.382 – 0.618 | **command** | One-shot operational sequence, reusable |
| 0.618 – 0.9 | **skill** | Multi-step, multi-decision, becomes a verb |
| ≥ 0.9 | **agent** | Recurring, multi-tool, autonomous within scope |

3. If you can't tell, **ask the user once** which destination they want.

## Step 2 — Run the meta-design pass

For non-trivial destinations (skill / agent), invoke a meta-design agent with:

> "Discover the categorical primitives of <subject>. Apply phase 1 (domain analysis) and phase 2 (level architecture) of the meta-meta-prompting process. Output: the design for a <destination>-class artifact, ready to write to disk."

For memory and command destinations, skip the meta pass and write directly from the user's intent.

## Step 3 — Write the artifact

### memory
- File: `~/.claude/projects/<project-key>/memory/<short-kebab-slug>.md`
- Frontmatter: `name`, `description`, `metadata.type`
- Body: lead with the rule/fact, then **Why:** and **How to apply:** lines
- Add a one-line pointer in `MEMORY.md`

### command
- File: `~/.claude/commands/<short-slug>.md`
- Frontmatter: `description`, `allowed-tools`, `argument-hint`
- Body: Task / Step 1 / Step 2 / Step 3 pattern; use `$ARGUMENTS`
- After writing, smoke-test by `grep -c '\$ARGUMENTS'` (must be ≥ 1) and frontmatter validation

### skill
- Directory: `~/.claude/skills/<slug>/` with `SKILL.md`
- SKILL.md frontmatter: `name`, `description` (with strong trigger language)
- Reference any supporting files inside the directory
- Ensure description starts with "Use when…" if you want auto-trigger

### agent
- File: `~/.claude/agents/<slug>/agent.md` (or flat `<slug>.md`)
- Frontmatter: `name`, `description` (with 2+ `<example>` blocks), `model`, `color`, `tools`
- Body: identity + process + tool-usage notes
- After writing, instruct the user to run `/agents` to verify it loads

## Step 4 — Secret scan

Before writing, scan the proposed body for:

- API tokens, OAuth secrets, base64 blobs of suspicious length
- Phone numbers, chat IDs ending in `@g.us` or `@c.us`
- Credentials path references (`~/.credentials/`, `.env` content)
- Hardcoded production hostnames, internal IPs

If found, abort and ask the user how to handle.

## Step 5 — Confirm before publish

Always **show the proposed path + frontmatter + first 30 lines** to the user before writing. After write, ask:

> "Want me to publish this anywhere external? (default: keep local)"

Default is local-only; never auto-publish.

## Step 6 — Tail summary

One line:

> `meta-distill ← <destination> · <path> · <line-count> lines · ready`

---

## Notes

- `meta-distill` is the only pattern that may write to `~/.claude/skills/` or `~/.claude/agents/`. Other patterns route through it for that.
- The φ-classification keeps destinations consistent across distillations. Tune the thresholds if your tools cluster differently.
- For domain-specific artifacts, route through the appropriate domain prompt's voice rules first.
