# RESIDUE — <project>

**Run**: `<YYYY-MM-DD-HHMM>`
**Target**: `<absolute path>`
**Branch**: `<calcinate/ts | current branch>`

## Outcome

| Tier | Burned | Failed | Skipped | Pinned | Discussed |
|---|---|---|---|---|---|
| 1 | <n> | <n> | <n> | <n> | — |
| 2 | <n> | <n> | <n> | <n> | — |
| 3 | <n> | <n> | <n> | <n> | — |
| 4 | — | — | — | — | <n> |

## What burned

- **LOC removed**: `<N>` (via `git diff --shortstat`)
- **Files deleted**: `<N>`
- **Deps pruned**: `<list>`

## Commits

```
<git log --oneline calcinate/<ts>>
```

## Failed items (auto-reverted)

<for each FAILED:>
### `<id>` — `<path>`

- **Action attempted**: `<proposed_action>`
- **Verify error**:
  ```
  <captured stderr/stdout>
  ```
- **Reverted at**: `<commit-hash that was rolled back>`

## Discussion items (Tier 4 — not burned)

<list of Tier 4 IDs with their open question>

## Deferred (lower confidence, for next run)

<findings below threshold that may surface on a future calcinate run>

## Follow-up

<if Tier 4 had ≥ 3 items:>
> Recommend `/calcinate --intent` to refresh INTENT.md — multiple findings suggest the declared essence has drifted from the codebase reality.

<if any consecutive-fail halt:>
> Run halted after 3 consecutive verify failures. Likely cause: <intent / verify command / findings>. Suggested: <next move>.

<if all green:>
> Clean run. Project leaner. Next: re-run when fat accumulates, or run `/calcinate --aggressive` to push further.
