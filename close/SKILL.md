---
name: close
description: End-of-session ritual. Captures session state, updates auto-memory, writes a session summary, then exits the session cleanly.
---

# /close -- Session Closing Ritual

> Preserve the work. Carry the thread forward.

When invoked, perform ALL of the following steps in order:

---

## Step 1: Session Audit

Review the full conversation and identify:

- **What was worked on** (projects, files, features)
- **Decisions made** (architectural choices, trade-offs, user preferences)
- **Current state** (what's working, what's broken, what's in-progress)
- **Open threads** (unfinished work, pending items, next steps)
- **New learnings** (patterns discovered, gotchas hit, fixes found)

---

## Step 2: Update Auto-Memory

Update `~/.claude/projects/{project-key}/memory/MEMORY.md` with any new stable knowledge from this session.

**Save if:**
- A new gotcha/lesson was discovered (confirmed, not speculative)
- Project structure or key file paths changed
- User stated a new preference
- A recurring problem was solved
- Infrastructure/service configuration changed

**Don't save:**
- Temporary state (current task in-progress)
- Speculative conclusions from a single observation
- Anything already in CLAUDE.md or existing memory

Use Edit tool to append or update relevant sections. Create topic files if a section grows too large.

---

## Step 3: Write Session Summary

Write a summary file to: `~/.claude/projects/{project-key}/sessions/{date}-{slug}.md`

Format:
```markdown
# Session: {date} -- {2-4 word description}

## Work Done
- {bullet list of completed items}

## Current State
- {what's working, what's running, what's deployed}

## Open Threads
- {unfinished work with enough context to resume}

## Key Files Modified
- `{path}` -- {what changed}

## Decisions & Context
- {important choices made, with rationale}

## Next Steps
- {prioritized list of what to do next}
```

---

## Step 4: Notification (Optional)

If you have a notification channel configured (WhatsApp, Slack, etc.), send a consolidated session summary:

```
Session closed

{2-3 sentence summary of work done}

State: {brief current state}
Next: {top 1-2 priorities}
Repo: {https-url} ({branch} @ {short-hash})
```

Omit the `Repo:` line if not in a git repo or no remote is configured.

---

## Step 5: Offer Distillation

If the session contained a repeatable workflow or novel pattern, ask:

> "This session had [pattern]. Want me to distill it into a reusable skill before closing?"

Only offer if there's something genuinely worth distilling. Don't force it.

---

## Step 6: Rename Session Transcript

Rename the current session's `.jsonl` transcript from its UUID to a human-readable name.

**Location:** `~/.claude/projects/{project-key}/`

**Format:** `{date}-{slug}.jsonl`
- `{date}` = `YYYY-MM-DD`
- `{slug}` = 2-4 word kebab-case description matching the session summary slug

**Procedure:**
1. Find the current session transcript: `ls -t ~/.claude/projects/{project-key}/*.jsonl | head -1`
2. Rename: `mv {uuid}.jsonl {date}-{slug}.jsonl`

**Note:** This breaks `--resume` for the old UUID, which is fine since the session is closing. The renamed file remains searchable via Grep for future context lookups.

---

## Step 7: Exit Session

After all steps complete, tell the user:

```
Session closed. All state preserved. You can exit with /exit or Ctrl+C.
```

Then stop responding. Do not continue the conversation. The session is done.

---

## Behavior Notes

- Be concise. The summary is for future-Claude, not a novel.
- Focus on **resumability** -- what does the next session need to know?
- Don't create the sessions directory if it would be the only file. Use memory instead.
- If there's nothing meaningful to save (quick Q&A session), just send the notification and skip the rest.

---

*Part of [Claude Code Skills](https://github.com/HermeticOrmus/claude-code-skills) -- reusable skills extracted from real AI-assisted development sessions.*
