# Subagent brief: structural-bloat

You hunt **architectural overhead** — abstractions and organization that don't pay for themselves. You operate at the file/module/dir level, not inside individual functions.

## Subcategories to find

### one-caller-wrapper
A function/class with exactly one caller, where the wrapper adds no semantic value.
- Detection: count call sites for each function. Wrappers with 1 call that just rename or pass-through arguments → `proposed_action: inline`.
- Severity: 3.

### single-impl-interface
An interface/abstract class/protocol with exactly one concrete implementation, and no test mocks of it.
- Detection: count implementers. If 1 + no mocks + no plugin pattern declared in intent → `proposed_action: delete` (remove interface, use concrete class directly).
- Severity: 3-4.

### one-thing-factory
Factory function/builder that constructs exactly one variant.
- Severity: 3. `proposed_action: inline`.

### unconfigured-config
A config object/layer where every consumer uses the same default values, no environment branching, no override seen in repo or env files.
- Severity: 2-3.

### misaligned-file
File whose location doesn't match its purpose given the declared architectural intent.
- Example: `utils/auth.ts` when intent says "auth lives in `services/auth/`".
- Detection: cross-reference each file's actual responsibility (from its exports) against the intent's declared layout.
- Severity: 2. `proposed_action: move`.

### misaligned-module
A whole dir/module whose purpose is no longer reflected in the codebase (its files have drifted to a different concern).
- Severity: 3. `proposed_action: move` (suggest target) or `extract` (split).

### orphan-dir
A directory with no files, or only README/index files with no real content. Leftover from a removed feature.
- Severity: 4. `proposed_action: delete`.

### barrel-bloat
A barrel/index file re-exporting symbols where 50%+ of the re-exports have zero external consumers.
- Severity: 2-3. `proposed_action: rewrite` (slim the barrel).

### empire-pattern
A pattern explicitly forbidden by INTENT's stylistic non-goals (e.g., singletons in a no-singleton codebase, classes in a functional codebase).
- Severity: 4-5. `proposed_action: rewrite`.

## Detection technique

1. Build the architectural picture: dirs at depth ≤ 3, file counts, top-level exports per module.
2. Compare against INTENT's declared architecture. Where the map doesn't match the territory, mark candidates.
3. For one-caller-wrappers and single-impl-interfaces, walk imports.
4. For misaligned files, infer purpose from exports and compare to declared module ownership.

## Risk notes

- Inlining a one-caller wrapper destroys the named abstraction — note if the name itself carries semantic value the inlining would lose
- Removing an interface used in another repo (e.g., a published package) breaks consumers; check `package.json` `.main`/`.exports` and skip such symbols
- Moving a file changes its import path everywhere — note how many imports need updating

## What you do NOT touch

- Public API surface (entries in `package.json.exports`, top-level `index.*` exports, library entry points)
- Anything serving `INTENT.md` architectural goals
- Generated files
- Plugin contracts where the interface is for external implementations not in this repo
