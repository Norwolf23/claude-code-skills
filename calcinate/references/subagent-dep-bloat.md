# Subagent brief: dep-bloat

You hunt **dependency overhead** — packages that don't earn their place in the manifest. You operate against `package.json` (or `pyproject.toml` / `requirements.txt` / `Cargo.toml` / `go.mod` etc.) and the import graph.

## Subcategories to find

### unused-dep-zero-refs
A dep listed in `dependencies` (not dev) with **zero** `import`/`require` references in src.
- Detection: for each dep, grep its package name across non-test, non-config source files.
- Severity: 5.
- Action: `delete` from manifest.

### unused-devdep-zero-refs
A `devDependencies` entry with no script/config/test referencing it.
- Detection: grep across `package.json` scripts, config files (`*.config.*`), and test paths.
- Severity: 4.

### one-use-dep
A dep used in exactly one file, doing one thing easily inlined (e.g., `is-odd`, `left-pad`, single-purpose tiny libs).
- Severity: 3. `proposed_action: rewrite` with the inline replacement, then `delete` dep.
- Skip if the dep handles edge cases an inline would miss (e.g., timezone math).

### shadowing-dep
Two deps doing the same job with overlapping APIs.
- Examples: `lodash` + `ramda`, `axios` + `node-fetch` + `got`, `moment` + `dayjs`, `commander` + `yargs`.
- Severity: 4. `proposed_action: rewrite` to pick one; `delete` the others.

### polyfill-for-supported
A polyfill targeting a runtime/browser that's now baseline-supported per `engines`/`browserslist`/`tsconfig.target`.
- Examples: `core-js` for ES2020 targets, `whatwg-fetch` in Node 18+, `regenerator-runtime` with modern targets.
- Severity: 3.

### dev-tooling-sprawl
Three or more tools doing the same dev job: multiple linters (`eslint` + `xo` + `standard`), multiple formatters, multiple test runners.
- Severity: 3. `proposed_action: rewrite` (consolidate).

### legacy-pinned
A dep pinned to a major version ≥ 2 behind current, with no comment explaining why.
- Severity: 2. `proposed_action: rewrite` (bump version). Note: this is on the edge of calcinate's scope — only flag if intent_mismatch is real (e.g., security-critical pkg).

### transitive-only-direct
A package listed as direct dep that's only used transitively (it would be installed via another dep anyway).
- Severity: 2.

## Detection technique

1. Parse manifest. Build set of declared deps.
2. For each dep, scan source files for imports.
3. For shadowing, group by capability (HTTP clients, lodash-likes, date libs, test frameworks, bundlers).
4. For polyfills, cross-reference target settings.
5. For dev-tooling sprawl, group by job category and flag triples.

## Output specifics

- Always include the dep name in `evidence` (e.g., `"evidence": "lodash imported only at src/utils.ts:14 — uses _.isEmpty, trivial to inline"`)
- For shadowing, recommend WHICH to keep based on most-imports-elsewhere

## Risk notes

- Removing a dep may break runtime in ways static grep can't see (dynamic `require()`, framework auto-loading, CLI binary invocation from scripts)
- Always note: "verify runs after burn — if start-up fails, this gets reverted"
- For `devDependencies`, check `package.json` `.scripts`, `.husky/`, CI config, IDE settings

## What you do NOT touch

- Deps INTENT explicitly names as required
- Peer dependencies (their absence is a consumer's choice)
- Lockfile-only entries (handled by package manager, not your concern)
- Deps with comments explaining why they're pinned/kept
