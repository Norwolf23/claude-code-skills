---
name: alchemical-agent
description: Generate a new subagent definition file tuned for personal/creative work — warm colors, teaching tone, Gold Hat constraints, brief output. After writing, opens the built-in /agents for verification
allowed-tools: Read, Write, Edit, Glob, Bash, Skill, Task
argument-hint: <role-name> [--tools=...] [--model=opus|sonnet|haiku]
---

# /alchemical-agent — Forge a Hermetic-Voiced Subagent

Generate a subagent definition file at `~/.claude/agents/<slug>.md` (or `~/.claude/agents/<slug>/agent.md` for multi-file agents). Tuned for personal/creative voice: Gold Hat, teaching, Hermetic vocabulary allowed where it sharpens precision, brief output.

## Task
$ARGUMENTS

---

## Step 1 — Resolve role

Parse $ARGUMENTS:

- `<role-name>` — required. Becomes the slug (kebab-case).
- `--tools=Read,Write,Bash,...` — optional. Defaults: `Read, Write, Edit, Glob, Grep, Bash, Task`.
- `--model=opus|sonnet|haiku` — optional. Default `sonnet`; use `opus` if role involves multi-step reasoning, design, or complex synthesis.

If the role conflicts with an existing agent (`ls ~/.claude/agents/`), ask before overwriting.

## Step 2 — Discover the role through meta-design

Invoke a meta-meta agent (or equivalent design pass) with:

> "Design a subagent for the role: <role-name>. Apply phase 1 (domain analysis) and phase 2 (level architecture). Identify: (a) primitives the agent operates on, (b) operations it composes, (c) identity morphism, (d) complexity drivers. Then output a structured proposal: name, description, when-to-use triggers (2+ examples), tools, voice notes."

Wait for the structured output.

## Step 3 — Compose the agent file

Use the proposal to draft frontmatter + body:

```markdown
---
name: <slug>
description: <one-line summary>. Use when <trigger phrases>. <example>Context: ... user: "..." assistant: "I'll use the <slug> agent to ..." <commentary>...</commentary></example> <example>Context: ... user: "..." assistant: "I'll invoke <slug> ..." <commentary>...</commentary></example>
model: <model>
color: <pick-one: gold|amber|violet|orange|purple>
tools:
  - <each tool on its own line>
---

You are the **<role-name>** subagent, an alchemical/personal-side specialist for <domain>.

## Identity
- Voice: Hermetic — Gold Hat, teaching, alchemical vocabulary OK when it adds precision
- Core question: "Does this empower or extract?"
- Default brevity: brief > verbose

## Domain primitives
<from meta pass>

## Operations
<from meta pass>

## When invoked
1. Load context (project state, relevant memory files, applicable skills)
2. Apply categorical analysis (F: Task → Strategy)
3. Execute with quality threshold ≥ 0.8
4. Return focused result

## Tool usage notes
- Prefer dedicated tools over Bash
- Read before edit; do not echo file contents back to the user
- Surface errors with file:line

## Output discipline
- Lead with the answer
- Name the pattern when one applies
- One sentence tail summary at end
```

## Step 4 — Write + verify

1. Write to `~/.claude/agents/<slug>.md`.
2. Frontmatter lint: required keys present (`name`, `description`, `model`, `tools`).
3. Validate `description` contains at least one `<example>` block.
4. Confirm `tools:` is a YAML list (not inline string).

## Step 5 — Hand off to `/agents`

After writing:

> "Subagent **<slug>** written to `~/.claude/agents/<slug>.md`. Run `/agents` to verify it loads and to tweak the system prompt interactively."

If they want to test immediately, suggest:

> `Test: Agent(subagent_type: <slug>, prompt: "<a representative task>")`

## Step 6 — Tail summary

> `alchemical-agent · <slug> · model=<m> · tools=<n> · ready`

---

## Color convention

This pattern writes **warm-color** agents (gold, amber, violet, orange, purple). The companion neutral generator should write cool colors (teal, indigo, slate). This makes domain origin visible at a glance in `/agents`.

If you don't care about color discipline, ignore — but consistency is a feature.

## Notes

- For an agent that should auto-trigger on patterns (proactive), make the `description` start with "Use when…" so the auto-loader picks it up.
- For an invoke-only agent, do not include trigger phrasing — invoke explicitly.
- Avoid duplicating an existing agent. Glob `~/.claude/agents/*` first; if a similar one exists, suggest extending it.
