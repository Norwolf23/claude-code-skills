---
name: claude-md-overhaul
description: |
  Audit and improve a Claude Code memory layer end-to-end. Measures CLAUDE.md and
  MEMORY.md against Anthropic's documented caps (200 lines per CLAUDE.md, 200 lines
  OR 25 KB for MEMORY.md auto-load), surveys project portfolio on disk vs memory
  coverage, finds sync conflicts in ~/.claude/, identifies gaps tier-by-tier, and
  executes improvements under bias-to-action with cap-fitting verification at each
  step. Use when CLAUDE.md/MEMORY.md "feel bloated", when memory feels invisible
  in fresh sessions, or as periodic hygiene (~monthly).
triggers:
  - /claude-md-overhaul
  - /claude-md-audit
  - audit my claude memory
  - improve my CLAUDE.md
  - prune MEMORY.md
  - my memory feels invisible at session start
---

# /claude-md-overhaul — Tier-by-tier audit + improvement of the Claude Code memory layer

Companion to `/maintain` (which covers MCP/sync/tool-usage health). This skill focuses on the **content + structure** of CLAUDE.md and MEMORY.md.

## When to use

- CLAUDE.md feels bloated or stale; specific entries are obviously wrong (skills that don't exist, machines that moved, JIRA-style references after migration)
- Old memories aren't surfacing at session start — MEMORY.md is probably past the 25 KB / 200-line auto-load cap and you only see the recent ~30 entries
- You added projects but never wrote memory files for them
- After a multi-machine migration, you suspect Syncthing has sync-conflict files in `~/.claude/`
- Periodic hygiene: roughly monthly, or after a heavy session of new skill/project shipping

## When NOT to use

- Anthropic config issues (use `/maintain`)
- Pure MCP health (use `/maintain` or `/raven-mcp-doctor`)
- Single-fix triage (just edit the file directly)

## Anthropic's documented caps (the targets)

| File | Hard cap | Sweet spot |
|------|----------|------------|
| Any `CLAUDE.md` (user, machine, project) | 200 lines (adherence drops past this) | 80–150 lines |
| Project `MEMORY.md` (auto-memory index) | **first 200 lines OR 25 KB loads at session start** — past that is invisible | <150 lines, <20 KB for headroom |

Source: [code.claude.com/docs/en/memory](https://code.claude.com/docs/en/memory)

## Procedure

Follow tier-by-tier. After each tier, verify caps + offer the next.

### Tier 0 — Survey current state (run first, no edits)

```bash
# Sizes vs caps
for f in ~/.claude/CLAUDE.md ~/CLAUDE.md; do
  [ -f "$f" ] && printf "%-32s  %4d lines  %5d bytes\n" "$f" "$(wc -l < $f)" "$(wc -c < $f)"
done

# MEMORY.md (the auto-load file)
mem=~/.claude/projects/$(pwd | sed 's|/|-|g')/memory/MEMORY.md
[ -f "$mem" ] && wc -lc "$mem"

# Sync conflicts in the Syncthing-managed area
ls ~/.claude/*.sync-conflict-* 2>/dev/null
ls ~/.claude/settings.sync-conflict-*.json 2>/dev/null

# Active projects on disk
find ~/projects -maxdepth 1 -type d -mtime -14 | wc -l

# Project memory file coverage
ls ~/.claude/projects/-home-*/memory/project_*.md 2>/dev/null | wc -l
```

Produce a ranked findings table:

| Finding | Status | Impact |
|---|---|---|
| Global CLAUDE.md size | N lines (cap 200) | adherence ↓ if past |
| Machine CLAUDE.md size | N lines | |
| MEMORY.md size | N lines / K bytes (caps 200/25600) | older memory invisible if past |
| Sync-conflict files | count | data loss between machines |
| Active projects without memory file | count | future-Claude can't ground in real state |
| Stale skill references in CLAUDE.md (`/resume`, etc.) | check via `grep -E '/[a-z-]+' CLAUDE.md` and verify each exists | broken trust |

### Tier 1A — Syncthing exclusions

If `~/.claude/*.sync-conflict-*` files exist, they signal `.stignore` is missing entries. Add `settings.local.json`, `settings.sync-conflict-*.json`, and any other per-machine files. Archive the conflict files to `~/.claude/backups/` (don't delete blindly — sometimes the conflict contains the canonical version from another machine).

### Tier 1B — CLAUDE.md surgical fixes

Read the file. For each section:
- Are skill references real? `ls ~/.claude/skills/<name>` for each `/skill-name` mention
- Are there duplicated tables across global and machine CLAUDE.md? Slim the global to a summary; keep machine as authoritative
- Are there sections that already exist as skills (`/unwoke`, `/distill`, etc.)? Collapse to a one-line pointer
- Add a Project Portfolio section if missing — categorize active projects into families (employer / personal / clients / tools)
- Add operational rules that have bitten you (e.g., per-organization git email, push targets, identity-routing)

Target: under 150 lines after the trim. If you must go over, stay under 200 lines.

### Tier 2A — Skill overrides

Audit installed skills. Look for:
- Wrong-platform skills (e.g., `pc-ops` on Linux/macOS only) → `"off"`
- Obviously stale (boot.dev course skills if course is done, MBA skills if MBA is done) → `"off"`
- Occasional-use (deploy-* family) → `"name-only"` (still invocable, drops description bloat)

Add `skillOverrides` to `~/.claude/settings.local.json`:

```json
{
  "skillOverrides": {
    "pc-ops": "off",
    "tweet": "name-only"
  }
}
```

Values per Anthropic docs: `on` / `name-only` / `user-invocable-only` / `off`.

### Tier 2B — CURRENT.md this-week focus

Create `~/.claude/CURRENT.md` (machine-local — add to `~/.claude/.stignore`). Format:

```markdown
# CURRENT — Week of YYYY-MM-DD

## Hot (touched this week, active push)
- {project} — {one-line state + heat}

## Warm (touched in last month, can pick up)
- ...

## Blocked / on hold
- ...

## This-week intent (what gets prioritized)
1. ...

## Refresh discipline
Update when projects move hot↔warm↔blocked; weekly if untouched.
```

Wire it as a SessionStart hook in `settings.local.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [{
          "type": "command",
          "command": "[ -f ~/.claude/CURRENT.md ] && cat ~/.claude/CURRENT.md || true",
          "timeout": 5
        }]
      },
      { "matcher": "resume", "hooks": [/* same */] }
    ]
  }
}
```

### Tier 3 — MEMORY.md prune

If MEMORY.md is past 25 KB or 200 lines, **80% of memory is invisible at session start**. This is the biggest single fix in this entire workflow.

Discipline:
- MEMORY.md is an **index**, not a content store
- One line per entry, under ~150 chars: `- [topic](file.md) — pithy hook (load-bearing fact)`
- Detail lives in topic files (`feedback_*.md`, `project_*.md`, `reference_*.md`)
- Group by month: `## 2026-05`, `## 2026-04`, etc.
- Collapse "References / Feedback / Dormant Projects" sections to load-on-demand pointers when they grow long

For mechanical bulk transformation, dispatch a subagent — read MEMORY.md, for each `## entry`:
1. Extract title + date
2. Find the linked topic file (`[name](name.md)`)
3. Verify topic file has the body; if not, append before collapsing
4. If no topic file exists for an entry with substantive body, **create** one
5. Replace the entry with a single index line

Target: under 200 lines AND under 25 KB. Check after each operation. If you're at the cap, look for the heaviest individual entries (`awk '{print length($0), NR}' MEMORY.md | sort -rn | head`) and either trim hooks or collapse list-style entries to load-on-demand sentences.

### Tier 4 — Fill memory gaps (active-project stubs)

```bash
# Find active projects (touched in last 14 days) that lack a memory file
mem=~/.claude/projects/$(pwd | sed 's|/|-|g')/memory
for d in ~/projects/*/; do
  name=$(basename "$d")
  mtime=$(find "$d" -type f -mtime -14 -not -path '*/.git/*' -not -path '*/node_modules/*' | head -1)
  [ -z "$mtime" ] && continue
  norm=$(echo "$name" | tr '-' '_')
  if ! grep -rli "\b$name\b\|\b$norm\b" "$mem"/*.md >/dev/null 2>&1; then
    echo "GAP: $name"
  fi
done
```

For each gap, create a one-paragraph stub `project_<name>.md`:

```markdown
---
name: project-<name>
description: One-line description of what this project is + where it lives + current status.
metadata:
  type: project
---

# <name>

**Location**: `~/projects/<name>/` on <machine>.

**What it is**: <short>

**Stack**: <stack>

**Status**: <one line on activity>

**Companions**: <related projects/skills>
```

Add a single line referencing all new stubs to MEMORY.md's "Active projects" paragraph (don't add 11 separate `## entries` — that blows the cap).

### Tier 5 — Per-project CLAUDE.md (high-traffic repos only)

For each repo touched ≥10 times in the last month with a multi-area structure (`apps/`, `packages/`, `src/`, or distinct frontend/backend/infra), check whether the repo has a `CLAUDE.md`:

```bash
for d in ~/projects/*/; do
  if [ -d "$d/apps" ] || [ -d "$d/packages" ]; then
    has=$([ -f "$d/CLAUDE.md" ] && echo "HAS" || echo "MISSING")
    echo "$has  $(basename $d)"
  fi
done
```

For "MISSING" results, write a 50-100-line CLAUDE.md covering: purpose, stack + scripts, key files, hard rules (load-bearing — the ones that bit you before), conventions, anti-patterns.

### Tier 6 — Path-scoped rules (`.claude/rules/`)

For repos with 5+ distinct areas, write rule files with `paths:` frontmatter so they load only when editing matching files:

```markdown
---
paths:
  - "packages/auth/**"
  - "apps/*/middleware.{ts,js,mjs}"
---

# Auth rules

- Source of truth: `@<scope>/auth` only
- ...
```

Three starter rule files cover most cases: `auth.md`, `db.md`, `frontend.md`. Add `infra.md` if Docker/k8s.

For joint repos (you don't own alone), put `.claude/rules/` in `.gitignore` — your rules are personal, not team.

User-level rules at `~/.claude/rules/` apply across every project on the machine. Good candidates: `typescript-conventions.md`, `python-conventions.md`, `shell-safety.md`, `markdown-discipline.md`.

## Quality criteria

A successful overhaul leaves you with:

- [ ] CLAUDE.md under 200 lines (sweet spot 80–150)
- [ ] MEMORY.md under 200 lines AND 25 KB
- [ ] No sync-conflict files in `~/.claude/`
- [ ] Every active project (touched in last 14 days) has a memory file
- [ ] Every high-traffic multi-area repo has its own CLAUDE.md
- [ ] At least one path-scoped rule directory exists for monorepos
- [ ] `CURRENT.md` exists and is dated this week
- [ ] At least one SessionStart hook loads context automatically

## Anti-patterns

- **Bloated MEMORY.md entries with full paragraph bodies** — bodies belong in topic files; MEMORY.md is the index. One line per entry.
- **Adding entries without checking cap first** — every addition risks pushing older entries past the 25 KB / 200-line cutoff, silently shrinking what loads at session start.
- **Per-app CLAUDE.md in monorepos with divergent teams** — fragments context. Use `.claude/rules/` with `paths:` scoping instead.
- **`@`-imports as a token-saving tactic** — imports expand inline; they organize but don't compress. Use the "Documentation (read on demand)" linked-list pattern instead for true on-demand loading.
- **Committing personal `.claude/rules/` to joint repos** — gitignore them. Your operator notes are not team conventions.
- **Auto-pushing skill repos without secret-scanning first** — grep for tokens, channel IDs, credentials before pushing public.
- **Declaring a hook "live" mid-session** — Claude Code reads hook config at session start, not per-tool-call. Verify activation via failure-case reproduction in a fresh session.

## Mid-session config gotcha

If you install a hook or change settings during this overhaul, **the running session won't see it.** The change is on disk but the loader is cold. To verify a hook actually works:

1. Close the current Claude Code session
2. Start a fresh one
3. Run the command that should trigger the hook
4. Observe state change (or its absence)

If the hook isn't firing in the fresh session, it's broken; if it fires, you're good for all future sessions.

## Companion skills + memories

- `/maintain` — MCP/sync/tool-usage health (complementary)
- `/distill` — promotes session patterns into new skills
- `/absorb` — distills session knowledge into memory files (deeper than the stubs created here)
- `/pickup` — entry ritual for new sessions; reads HANDOFF.md or infers from git
- `~/.claude/CLAUDE.md` — apply trim rules from Tier 1B here

## Origin

Distilled 2026-05-16 from a session that ran the full audit-improve loop end-to-end:

- Global CLAUDE.md: 164 → 177 lines (after Project Portfolio + Vibe Engineer additions; trimmed Multi-Machine + Athanor + Unwoke first)
- MEMORY.md: 772 → 162 lines / 134 KB → 25.6 KB (5.4× over → under both caps)
- 11 active projects lacking memory files → 11 new stubs
- 13 path-scoped rule files across 4 scopes (user + 3 monorepos)
- 1 settings.local.json sync-conflict resolved
- 1 SessionStart hook + 1 PreToolUse hook installed
- 4 git commits across 4 repos; 2 PRs pushed to a team org
- Mid-session config-hot-reload gotcha discovered + memorialized

The full session summary is at `~/.claude/projects/-home-ormus/sessions/2026-05-16-claude-md-overhaul.md`.

The discipline that emerged: **measure → propose tier'd → execute with cap-fitting verification at each step → never declare a config "live" without reproducing the failure case it's meant to fix.**
