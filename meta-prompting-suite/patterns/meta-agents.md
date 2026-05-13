---
name: meta-agents
description: Agent portfolio surface — survey, audit, gap-find, dedupe, retire across the agents directory. Complements per-agent generators (which create one) and the built-in /agents (which CRUDs one)
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Skill, Task
argument-hint: [list|audit|gaps|dedupe|retire <slug>|portfolio] [--<domain>]
---

# /meta-agents — Agent Portfolio

The agent set as a whole, not one agent at a time. `meta-agents` is to per-agent generators what a fleet view is to a single server view. Useful when you've accumulated 20+ agents and need to see overlap, gaps, and decay.

## Task
$ARGUMENTS

---

## Subcommands

Parse $ARGUMENTS first token. Default = `portfolio`.

### `portfolio` (default)

A single-view dashboard:

```
Agent Portfolio · ~/.claude/agents/
─────────────────────────────────────────
Count:        <n>
Model mix:    opus=<n>  sonnet=<n>  haiku=<n>
Color mix:    <hist of colors>
Last 7 days:  modified=<n>  invoked=<n-if-trackable>
─────────────────────────────────────────
By trigger weight:
  <slug>  ▆▆▆▆▆▆▆ used (high)
  <slug>  ▆▆▆▆ used (medium)
  <slug>  ▁ stale (no invocations / no trigger matches)
─────────────────────────────────────────
Recommendations:
  - <slug> ↔ <slug> overlap > 70% on triggers — consider merging
  - <slug> has no matching triggers in last 30 days — consider retiring
  - Missing: <pattern observed in session but no agent claims it>
```

### `list [--<domain>]`

Tabular list. Columns: slug · description (first 60 chars) · model · color · tools-count · path. Filter by tint if a `--<domain>` flag is provided.

### `audit`

Per-agent health check. For each agent:

- Frontmatter valid? (required: name, description, model, tools)
- At least one `<example>` block in description?
- `tools:` list non-empty?
- File last modified recently? (warn if > 90 days)
- Description starts with "Use when…" (proactive auto-trigger) OR is invoke-only?
- Body references skills / commands that exist?

Output: pass/fail per agent + summary score (% passing).

### `gaps`

Survey patterns from the current session (last ~50 messages) + most recent persistent-memory entries (if available). For each repeated pattern that doesn't have a matching agent:

- Pattern name (proposed)
- Suggested agent description
- Triggers (1-2 example phrases from session)
- Tools likely needed
- Estimated model tier (haiku for repetitive lookups, sonnet for analysis, opus for design)

Offer to `/meta-distill agent <pattern-name>` for each gap.

### `dedupe`

Pairwise overlap analysis:

- For each (agent_i, agent_j) pair, compute trigger-phrase Jaccard similarity from descriptions
- Flag pairs with ≥ 0.5 overlap
- For each flagged pair, suggest: keep one / merge / namespace-split

Output: ranked list of overlapping pairs + recommended actions. No auto-merge — user decides.

### `retire <slug>`

Confirm-and-archive flow:

1. Show the agent's frontmatter + first 30 lines
2. Ask: "Retire <slug>? (move to `~/.claude/agents/_archive/`)"
3. On confirm: move file, log timestamp + reason to `~/.claude/agents/_archive/retired.log`
4. Tail: `meta-agents · retired=<slug> · archive=<path>`

Never delete — always archive. Some agents are seasonal.

## Discovery

Glob `~/.claude/agents/*.md` AND `~/.claude/agents/*/agent.md`. Parse YAML frontmatter from each. Build the portfolio in memory.

## Output discipline

- No tables wider than 100 chars (terminal-friendly)
- Use the unicode bar (`▆▁`) for sparkline-style usage if usage stats are available
- If usage stats are NOT available, say so once at the top and stop pretending
- Recommendations are suggestions; never auto-apply

## Tail summary

> `meta-agents · view=<subcommand> · total=<n> · flagged=<n> · ready`

---

## Notes

- `meta-agents` is read-only by default. Only `retire` mutates state — and it archives, never deletes.
- For creating a new agent, use a per-agent generator (`alchemical-agent` or your own).
- For interactive edit of one agent, use the built-in `/agents`.
- For the meta-design of an entire agent role from scratch, use a meta-meta agent.
- `gaps` is the most useful subcommand for a mature portfolio — it catches patterns that should have been distilled but weren't.
- Run `meta-agents audit` quarterly to catch frontmatter rot and broken references.
