---
name: ship
description: "Unified shipping pipeline -- ship projects to GitHub with scaffolded docs, optional social posting, and notification. The single entry point for publishing open-source work."
---

# /ship

Ship projects to GitHub with branded scaffolding, optional social posting, and notifications.

## Arguments

```
/ship                          Interactive (asks what to ship)
/ship --github                 GitHub only
/ship --no-social              Skip social posts
/ship <path>                   Infer from path
```

## Destinations

| Destination | What It Does |
|---|---|
| **GitHub** | Create repo, scaffold branded docs, push |

---

## Phase 0: Parse Arguments

If CLI flags are provided, skip the interactive checklist and proceed directly.

If `<path>` is provided without flags, infer destination from context.

If no arguments, proceed to Phase 1.

## Phase 1: Gather Context

### 1a: Ask Destination

Present a checklist:

**Where are we shipping?**
- [ ] GitHub (new public repo)

### 1b: Gather Details

**If GitHub selected**, gather (or infer from conversation):
- **Project name** -- repo name, kebab-case
- **Description** -- one-line for GitHub
- **Files to include** -- paths to source files or directory
- **Target audience** -- who is this for?
- **Topics** -- GitHub repo topics

---

## Phase 2: Execute

### 2a: GitHub Destination

1. **Scaffold branded files** using templates:
   - `README.md` (philosophical hook, Quick Start, closing)
   - `LICENSE` (MIT or your preferred license)
   - `CONTRIBUTING.md`
   - `CLAUDE.md` (repo instructions for Claude Code)
   - `.gitignore` appropriate for the stack

2. **Create repo + push**:
```bash
gh repo create <org>/<project-name> --public --description "<description>"
cd /path/to/project
git init
git add -A
git commit -m "feat(init): initial release

Co-Authored-By: Claude <noreply@anthropic.com>"
git remote add origin https://github.com/<org>/<project-name>.git
git branch -M main
git push -u origin main
gh repo edit <org>/<project-name> --add-topic <topics>
```

3. **Collect URL**: `https://github.com/<org>/<project-name>`

---

## Phase 3: Social Posts (Optional)

Skip this phase if `--no-social` flag was provided.

### X Post (if configured)

Generate a tweet (max 280 characters):

```
[One-line hook about what was shipped]

[Primary URL]

#ClaudeCode #OpenSource
```

Keep it punchy. Speak to developers.

If 280 chars is too tight for the hook + URL + hashtags, drop the hashtags first, then shorten the hook. Never truncate the URL.

### LinkedIn Post (if configured)

Generate a LinkedIn post (max 3000 characters):

```
[Hook: Problem statement or insight that resonates]

[What was shipped: 2-3 concise bullets]

[Origin/story: "Built this after..." -- brief and genuine]

[Links to all shipped destinations]

#ClaudeCode #DeveloperTools #OpenSource #AI
```

**Voice rules**: No corporate speak. No "leverage" or "synergy" or "utilize." Pragmatic yet genuine.

---

## Phase 4: Notification

Send a consolidated notification to your configured channel:

```
Ship complete: <project-name>

Destinations:
- GitHub: <url>

Social:
- X: <posted/skipped>
- LinkedIn: <posted/skipped>
```

---

## Phase 5: Cross-Ship Offer

After completing all selected destinations, offer related actions:

> "Also want to write a blog post or journal entry about this?"

Only offer if it makes sense for the project.

---

## Branding Standards

### README Structure
1. Blockquote hook
2. Problem statement
3. Solution
4. What's Inside
5. Quick Start (copy-paste ready)
6. Core Concepts
7. Contributing
8. License

### Commit Format
- `feat(init): initial release` for first commits
- Always include `Co-Authored-By: Claude <noreply@anthropic.com>`

### License
- MIT (or your preferred license)

---

## Error Handling

- **Git push fails**: Check remote auth, try `gh auth status`, report clearly
- **Social API rate limit**: Report limit, skip gracefully
- **Template not found**: Report which template is missing, skip scaffolding for that file

Never silently fail. Report what succeeded, what failed, and what to do next.

---

## Quick Reference

```
/ship                    # Interactive
/ship --github           # Just GitHub
/ship --no-social        # Skip all social posts
/ship <path>             # Infer from path
```

---

*Part of [Claude Code Skills](https://github.com/HermeticOrmus/claude-code-skills) -- reusable skills extracted from real AI-assisted development sessions.*
