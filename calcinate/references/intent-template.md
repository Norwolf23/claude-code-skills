# INTENT — <project name>

> The preservation contract. Calcinate will not burn anything that serves these. If a finding contradicts INTENT, it gets flagged; if it serves INTENT, it stays.
>
> Edit this file as the project's purpose sharpens. Re-run `/calcinate --intent` to refresh.

## Business intent

> 1-2 sentences. What does this software DO for users? What problem does it solve? Who is it for?

<replace>

## Architectural intent

> 3-5 bullets. Stack, storage, runtime, integration boundaries, architectural non-goals.

- Stack: <e.g., Vue 3 SPA, Pinia store, Vite>
- Storage: <e.g., Supabase Postgres, local IndexedDB cache>
- Runtime: <e.g., Vercel Edge, Node 22, no SSR>
- Boundary: <e.g., REST to /api/v1 only, no direct DB from client>
- Non-goals: <e.g., no offline mode, no native mobile, no real-time>

## Stylistic intent

> 3-5 bullets. Language conventions, naming, composition rules, test style, anti-patterns explicitly forbidden.

- Language: <e.g., TypeScript strict, no `any`, no `@ts-ignore`>
- Naming: <e.g., kebab-case files, PascalCase classes, useFooBar composables>
- Composition: <e.g., composition API only, no class components, no global state outside Pinia>
- Tests: <e.g., integration over unit, no mocking internal modules, vitest>
- Forbidden: <e.g., no defensive try/catch at internal boundaries, no comments unless WHY, no JSDoc>

## verify

> Single executable command that proves the project still works after a burn. Calcinate runs this after each commit; red = auto-revert.

verify: <e.g., npm test && npm run typecheck && npm run lint>
