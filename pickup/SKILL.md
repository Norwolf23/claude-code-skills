---
name: pickup
description: Read a HANDOFF.md and restore session context. The entry ritual -- the opposite of /handoff. Use at the start of a new session after a handoff, machine switch, or context clear.
---

# /pickup -- Session Pickup

> Consume a HANDOFF.md and orient the session so work continues exactly where it left off.

When invoked, perform the following steps in order. Do not ask for confirmation -- just execute.

---

## Step 1: Locate HANDOFF.md

**If the argument is a file path** (starts with `/`, `./`, or `~/`):
- Use that exact path.

**If the argument is a project name** (e.g., `my-project`, `cool-app`):
- Search `~/projects/` recursively (2 levels deep) for a directory matching the name (case-insensitive).
  ```bash
  find ~/projects -maxdepth 3 -type d -iname "*<argument>*" 2>/dev/null
  ```
- For each match, check if `HANDOFF.md` exists in that directory.
- Also check `~/HANDOFF.md` -- read its first 5 lines and check if the Project path contains the argument.
- If exactly one HANDOFF.md found -- use it.
- If multiple found -- list them with dates, ask user which one.
- If none found in project dirs but `~/HANDOFF.md` matches -- use that.

**If no argument**:
1. Check current working directory for `HANDOFF.md`
2. Check `~/HANDOFF.md`
3. Search `~/projects/` subdirectories (2 levels deep) for recent `HANDOFF.md` files
4. If multiple found -- list them with dates, ask user which one

If no HANDOFF.md is found anywhere:
- Report clearly: "No HANDOFF.md found. Either provide a path or project name: `/pickup my-project`"
- Stop.

---

## Step 2: Read and Parse

Read the HANDOFF.md fully. Extract:

- **Project path** from the Project section
- **Branch** and **last commit**
- **What we were doing** (the narrative summary)
- **State**: Done, In Progress, Blocked
- **Next steps** (the ordered list)
- **Key files** (the table)
- **Resume Prompt** (at the bottom)

---

## Step 3: Load Key Context

For each file in the **Key Files** table, read it if it exists and is under 200 lines.
Skip files over 200 lines (too large) -- note them for the user instead.

If the project path has a git repo:
```
git -C [project path] status --short
git -C [project path] log --oneline -5
```

---

## Step 4: Present Orientation

Output a concise orientation block -- not a copy of HANDOFF.md, a **distillation**:

```markdown
## Resumed: [Project Name]

**Path**: [absolute path]
**Branch**: [branch] | **Last commit**: [hash -- message]
**Git status**: [clean / N files changed]

### What Was Happening
[1-2 sentence synthesis of the task and approach]

### State at Handoff
- Done: [key completed items, comma-separated]
- In progress: [exactly where it was left]
- Blocked: [if any]

### Next Action
[The single most immediate thing to do -- specific file, command, or decision]

### Ready
Context loaded. Key files read. Git oriented.
To continue: [paste the resume prompt action or just say what to do]
```

---

## Step 4.5: Enter Plan Mode

After presenting the orientation, automatically enter Plan Mode using the `EnterPlanMode` tool.

This puts the session into planning state so the user can review the handoff context and decide on approach before any code changes happen. The user sees the orientation summary, then lands in Plan Mode ready to discuss next actions.

---

## Step 5: Archive HANDOFF.md

After successful load, rename `HANDOFF.md` to `HANDOFF.archived.md` in the same directory.

This signals: "this handoff was consumed." It preserves history without cluttering future `/pickup` searches.

Tell the user: `HANDOFF.md archived as HANDOFF.archived.md`

---

## Notes

- **The goal is speed** -- from zero context to executing in under 30 seconds.
- **Do not re-read the full history** -- trust what HANDOFF.md captured.
- **Do not ask clarifying questions** unless HANDOFF.md is ambiguous about what to do next.
- **If multiple HANDOFF.md exist** -- ask which one before loading anything.
- **If HANDOFF.md is malformed** -- note what's missing and load what you can.

---

*Part of [Claude Code Skills](https://github.com/HermeticOrmus/claude-code-skills) -- reusable skills extracted from real AI-assisted development sessions.*
