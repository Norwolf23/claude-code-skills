---
name: handoff
description: Write a complete session state capture to HANDOFF.md in the current project, then instruct user to /compact or /clear. Use before switching machines, hitting context limits, or handing off to a future session.
---

# /handoff -- Session Handoff

> Capture everything a fresh Claude session needs to continue this work without losing the thread.

When invoked, perform the following steps in order. Do not ask for confirmation -- just execute.

---

## Step 1: Gather Context

Collect the following (use Bash/Git/TaskList tools as needed):

1. **Project name and path** -- current working directory
2. **Git state** -- `git status --short` + `git log --oneline -5` (skip if not a git repo)
3. **Active tasks** -- check TaskList tool for in_progress or pending items
4. **Session audit** -- review the full conversation and identify:
   - What was being built / worked on
   - What is complete vs. in-progress vs. blocked
   - Key decisions made, errors hit, approaches tried
   - Next concrete action needed

---

## Step 2: Write HANDOFF.md

Write `HANDOFF.md` to the **project root directory**. Overwrite if it already exists.

**Determine the project root:**
- If the CWD is inside a project directory -- use the project root (the directory containing `.git`, `package.json`, `CLAUDE.md`, or similar project markers).
- If the CWD is a generic location (`~/`, `/tmp`, etc.) -- identify the project from session context (files read, git repos referenced) and write to that project's root.
- Fallback: write to CWD and note the path clearly in the output.

Use this exact structure (adapt content, keep structure):

```markdown
# Handoff -- [Project Name] -- [Date]

> Read this at the start of the next session. Paste the Resume Prompt below as your first message.

## Project
- **Path**: [absolute path]
- **Branch**: [git branch or "no git"]
- **Last commit**: [hash -- message] or "uncommitted changes"

## What We Were Doing

[2-4 sentences describing the task, goal, and current approach. Be specific enough that a fresh Claude
session can understand without reading the full history.]

## State

### Done
- [Completed item -- be specific]
- [Completed item]

### In Progress
- [Current active work -- where exactly it was left]

### Blocked / Pending
- [If any blockers or things waiting on external action]

## Next Steps

1. [Most immediate next action -- specific file, function, command]
2. [Second step]
3. [Third step if applicable]

## Key Files

| File | Role |
|------|------|
| [path/to/file] | [what it does or what changed] |
| [path/to/file] | [what it does or what changed] |

## Context to Know

[Bullet list of non-obvious facts, gotchas, decisions, or environment notes a fresh session would
need. Skip anything obvious from the code itself.]

- [Context item]
- [Context item]

## Resume Prompt

Paste this as your first message in the new session:

---
Continuing work on [project name].

Read HANDOFF.md at [path] for full context.

Current task: [one-line description]
Next action: [specific first thing to do]
---
```

---

## Step 3: Confirm and Hand Off

After writing HANDOFF.md:

1. Confirm the file path and briefly summarize what was captured (3-5 bullets)
2. Print the full absolute path to HANDOFF.md as a standalone line so the user can copy it before clearing context
3. Tell the user:

> **HANDOFF.md written.** Full path: `[absolute path to HANDOFF.md]`
> Now run `/compact` to compress context (keeps conversation, cheaper), or `/clear` to start completely fresh. In the new session, run: `claude` from any directory and say: *"Read HANDOFF.md at [absolute path]"*

---

## Notes

- **Keep it under 80 lines** -- dense and actionable, not comprehensive. Future Claude can read code.
- **The Resume Prompt is the most important part** -- it must be copy-pasteable and complete enough to orient a fresh session in under 10 seconds.
- **Do not include this session's full conversation** -- distill it, don't transcribe it.
- **If multiple projects** were touched, write separate sections per project.
- **Prefer absolute paths** -- the next session may open from a different directory.

---

*Part of [Claude Code Skills](https://github.com/HermeticOrmus/claude-code-skills) -- reusable skills extracted from real AI-assisted development sessions.*
