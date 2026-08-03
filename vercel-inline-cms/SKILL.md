---
name: vercel-inline-cms
description: Install a lightweight inline-editing CMS into any Vercel-deployed project — content store + EditableText component + cookie-auth admin shell + Vercel KV/Upstash/Blob storage. Auto-detects the framework and installs natively for Next.js (App Router & Pages Router) and Vite + React. For SvelteKit, Astro, Nuxt, or plain static, prints a manual-port guide. Use when the user asks to add a CMS, inline editing, editable text, an admin panel, or "make this site editable."
---

# /vercel-inline-cms — Vercel Inline CMS

> Drop a working inline-editing CMS into any project deployed on Vercel.

## Origin

Extracted from the Nickson Studios website CMS (May 2026) — a hand-rolled inline-editing system (Context provider + `EditableText` + cookie auth + swappable storage) that emerged from wanting client-editable copy on a Vite + React site without bolting on a heavyweight headless CMS. After running on Nickson Studios for several weeks, the four-layer architecture (content store, inline editor, admin shell, swappable backend) had proven itself simple enough to generalize. This skill packages that same architecture and adapts it to **any** project deployed on Vercel: Next.js App Router, Next.js Pages Router, Vite + React (auto-installed); SvelteKit/Astro/Nuxt/static (documented manual port).

The storage layer was rewritten during extraction to auto-select from Vercel-provisioned env vars (Vercel KV, Upstash Redis, Vercel Blob) rather than hardcoding `@vercel/kv` — so projects on the current Vercel Marketplace stack work without code changes.

**This skill is designed for projects deployed on Vercel.** It uses Vercel serverless functions for the API, Vercel-provisioned storage (KV, Upstash Redis, or Blob) for persistence, and Vercel environment variables for secrets. It will install successfully on a project that isn't yet deployed to Vercel, but its assumptions (the `/api/*.js` convention, the storage env var names, `vercel.json` rewrites) are Vercel-specific. For other hosts (Render, Fly, self-hosted Node), this is the wrong skill.

## What this skill installs

A four-part CMS:

1. **Content store** — `ContentContext` React provider holding a JSON content object, hydrated from `GET /api/content` with `defaultContent.js` as fallback.
2. **Inline editor** — `<EditableText path="..." />` renders plain text for visitors and a `contentEditable` field for logged-in admins.
3. **Admin shell** — `AdminGate` (auth check + login form) → `AdminShell` (mounts `EditModeProvider`, Cmd+S, beforeunload guard) → `AdminToolbar` (sticky Save/Discard/Sign out bar). All three are required — without `AdminShell`, `<EditableText>` stays read-only.
4. **Storage backend** — Auto-selects from Vercel-provisioned env vars: Vercel KV (`KV_REST_API_URL`/`KV_REST_API_TOKEN`), Upstash Redis (`UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`), or Vercel Blob (`BLOB_READ_WRITE_TOKEN`). In local dev with none set, falls back to an in-memory map.

The components ship with `'use client'` directives so the **same code** works as React Client Components in Next.js App Router and as ordinary components in Vite + React (which ignores the directive).

## Step 0 — Detect the framework

Read `package.json` and `vercel.json` (if present) to classify the project:

| Signal | Result | Path |
|---|---|---|
| `next` dep + `app/` directory exists | **Next.js App Router** | Tier 1 — install |
| `next` dep + `pages/` directory exists (no `app/`) | **Next.js Pages Router** | Tier 1 — install |
| `vite` dep + `react` dep | **Vite + React** | Tier 1 — install |
| `@sveltejs/kit` dep | **SvelteKit** | Tier 2 — manual port |
| `astro` dep | **Astro** | Tier 2 — manual port |
| `nuxt` dep | **Nuxt** | Tier 2 — manual port |
| `index.html` at project root, no framework dep | **Plain static** | Tier 2 — manual port |
| Anything else | Unknown — ask the user |

**For Tier 2 frameworks**, do not install. Tell the user the architecture transfers but the file layout differs, then offer to read out the relevant section of `<skill-dir>/templates/docs/manual-port.md` (or write it to `docs/cms-port.md` in their project).

**For Tier 1 frameworks**, continue with Step 1.

## Step 1 — Verify the stack

After detection, run these checks for the matching Tier 1 path. If any fail, **stop and report** — do not force the install.

### Hard requirements (abort if missing)

- **All Tier 1**: `package.json` exists.
- **Next.js App Router**: `app/layout.tsx` or `app/layout.jsx` exists (entry point we'll patch).
- **Next.js Pages Router**: `pages/_app.tsx` or `pages/_app.jsx` exists.
- **Vite + React**: `src/main.jsx` or `src/main.tsx` exists.
- **All**: no existing `src/cms/`, `src/admin/`, `app/admin/`, or `pages/admin/` directory (avoid clobbering). No existing `api/login.js`, `api/logout.js`, `api/session.js`, or `api/content.js`.

If any directory or file conflicts exist, list them and ask whether to overwrite, rename, or abort. Default to abort.

### Soft requirements (detect and ask)

- **Vite + React only**: needs a router. If `react-router-dom` is in `package.json`, use it. If not, ask: "The CMS admin needs nested routes. Install `react-router-dom`? (yes/no/abort)". Next.js uses its own router — no extra dep needed.

The components are framework-agnostic on styling: they use semantic class names styled by `templates/src/cms/cms-admin.css` (plain CSS with CSS variables for theming). No Tailwind dependency.

## Step 2 — Ask about storage

Before copying any files, ask: *"What storage backend will this use on Vercel? (1) Vercel KV / Upstash Redis — recommended for small content. (2) Vercel Blob — fine for any size; one JSON file. (3) Skip — I'll provision later (CMS will run in in-memory dev mode until then)."*

Note: the user does **not** have to pick now — the storage layer auto-detects whichever env vars are set at runtime. The question is just to know what to put in `.env.example` and what `vercel storage create` command to suggest in the handoff.

## Step 3 — Copy shared files

These files are identical across all Tier 1 frameworks. Copy from `<skill-dir>/templates/`:

```
templates/src/cms/ContentContext.jsx     → src/cms/ContentContext.jsx
templates/src/cms/EditableText.jsx       → src/cms/EditableText.jsx
templates/src/cms/cms-admin.css          → src/cms/cms-admin.css
templates/src/admin/AdminGate.jsx        → src/admin/AdminGate.jsx
templates/src/admin/AdminShell.jsx       → src/admin/AdminShell.jsx
templates/src/admin/AdminToolbar.jsx     → src/admin/AdminToolbar.jsx
templates/src/admin/ArrayControls.jsx    → src/admin/ArrayControls.jsx
templates/src/content/defaultContent.js  → src/content/defaultContent.js
templates/api/_lib/auth.js               → api/_lib/auth.js
templates/api/_lib/store.js              → api/_lib/store.js
templates/api/content.js                 → api/content.js
templates/api/login.js                   → api/login.js
templates/api/logout.js                  → api/logout.js
templates/api/session.js                 → api/session.js
```

Notes:
- The `api/*.js` files use Vercel's Node serverless function convention. They live at the project root regardless of framework — Vercel routes them as separate functions even inside a Next.js project. No need to convert to `app/api/.../route.ts` for App Router.
- The React components have `'use client'` at the top so they work as Client Components in Next.js App Router. Vite ignores the directive.

For Next.js projects without a `src/` directory: put `cms/`, `admin/`, `content/` next to `app/` (or `pages/`). The components reference each other by relative paths only.

## Step 4 — Patch the entry point (mount `<ContentProvider>`)

Wrap the app root in `<ContentProvider>` and import the CSS.

### Next.js App Router — `app/layout.tsx`

```tsx
import { ContentProvider } from '../cms/ContentContext';
import '../cms/cms-admin.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ContentProvider>{children}</ContentProvider>
      </body>
    </html>
  );
}
```

### Next.js Pages Router — `pages/_app.tsx`

```tsx
import { ContentProvider } from '../cms/ContentContext';
import '../cms/cms-admin.css';

export default function App({ Component, pageProps }) {
  return (
    <ContentProvider>
      <Component {...pageProps} />
    </ContentProvider>
  );
}
```

### Vite + React — `src/main.jsx`

```jsx
import { ContentProvider } from './cms/ContentContext';
import './cms/cms-admin.css';

// inside the render:
<ContentProvider>
  <App />
</ContentProvider>
```

Wrap **outside** any router; **inside** any provider whose state should survive a route change.

## Step 5 — Add admin routes

The admin lives at `/admin` with public pages mirrored under `/admin/edit/<slug>`. The wrapper chain is the same in every framework: **`AdminGate` → `AdminShell` → your page**.

### Next.js App Router — add `app/admin/layout.tsx` + edit page

```tsx
// app/admin/layout.tsx
import AdminGate from '../../admin/AdminGate';
import AdminShell from '../../admin/AdminShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <AdminShell>{children}</AdminShell>
    </AdminGate>
  );
}
```

```tsx
// app/admin/page.tsx
import { redirect } from 'next/navigation';
export default function AdminIndex() {
  redirect('/admin/edit');
}
```

```tsx
// app/admin/edit/[[...slug]]/page.tsx — render the public page in edit mode
import Home from '../../../page'; // adjust path to your actual home page component
export default function AdminEdit() {
  return <Home />;
}
```

For each additional public page you want to edit, add a sibling route under `app/admin/edit/<slug>/page.tsx` that imports and renders the same component.

### Next.js Pages Router — `pages/admin/[[...slug]].tsx`

```tsx
import AdminGate from '../../admin/AdminGate';
import AdminShell from '../../admin/AdminShell';
import Home from '../index'; // adjust to your actual home page component

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminShell>
        <Home />
      </AdminShell>
    </AdminGate>
  );
}
```

### Vite + React — codemod `src/App.jsx`

Read `src/App.jsx`. Identify the `<Routes>` block. Inject an admin subtree as a sibling of the public routes:

```jsx
import AdminGate from './admin/AdminGate';
import AdminShell from './admin/AdminShell';
import { Outlet, Navigate } from 'react-router-dom';

// Tiny wrappers so the framework-agnostic gate/shell can host react-router's <Outlet/>:
function AdminGateRoute() { return <AdminGate><Outlet /></AdminGate>; }
function AdminShellRoute() { return <AdminShell><Outlet /></AdminShell>; }

// Inside <Routes>:
<Route path="/admin" element={<AdminGateRoute />}>
  <Route element={<AdminShellRoute />}>
    <Route index element={<Navigate to="/admin/edit" replace />} />
    <Route path="edit" element={<Home />} />
    {/* one <Route path="edit/<slug>" element={<Page />}/> per public page */}
  </Route>
</Route>
```

After editing, re-read the file and verify the JSX parses. If it doesn't, revert and print the snippet for the user to paste in.

**If you add more `edit/<slug>` routes**, also extend the `PAGES` array at the top of `src/admin/AdminToolbar.jsx` with one entry per route so the toolbar nav shows them.

**Fall back to paste-in instructions if**: `App.jsx` doesn't exist, uses `createBrowserRouter` with a deeply customized object config, or imports routes from another file you can't trace.

## Step 6 — Write the SPA rewrite (Vite + React only)

For Vite SPAs, copy `templates/vercel-spa.json` to the project root as `vercel.json` (only if no `vercel.json` exists). It contains the catch-all rewrite needed so refreshing `/admin/edit` doesn't 404:

```json
{ "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }] }
```

**Skip this step for Next.js** — Next handles routing on its own and this rewrite would break it.

## Step 7 — Update `.env.example`

Append (create the file if missing):

```bash
# Vercel Inline CMS
ADMIN_PASSWORD=change-me-before-deploying
SESSION_SECRET=generate-with-openssl-rand-hex-32

# Storage — only ONE of the following groups is needed.
# These are auto-set by `vercel storage create kv` or `vercel storage create blob`:
KV_REST_API_URL=
KV_REST_API_TOKEN=
# or:
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
# or:
BLOB_READ_WRITE_TOKEN=
```

If `.env` or `.env.local` exists, append the same block there with placeholder values and warn the user to fill them in.

## Step 8 — Update `.gitignore`

Ensure these lines exist:

```
.env
.env.local
.env*.local
.vercel
```

`.vercel/` holds Vercel CLI link metadata + downloaded env vars from `vercel env pull` — never commit it.

## Step 9 — Install missing deps

Detect the package manager from lockfiles (`pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lockb` → bun, else npm) and install:

- **Vite + React**: `react-router-dom` if the user said yes in Step 1.
- **Vercel Blob (if user picked it in Step 2)**: `@vercel/blob`.
- **Vercel KV / Upstash Redis**: nothing — the store uses `fetch` directly against the REST API, no SDK needed.

Skip if nothing to add.

## Step 10 — Wire one editable field as a demo

Pick one obvious piece of text and replace it with `<EditableText path="hero.headline" />`. Search in this order — pick the first that exists:

1. Next.js App Router: `app/page.tsx`
2. Next.js Pages Router: `pages/index.tsx`
3. Vite + React: `src/pages/Home.jsx` → `src/App.jsx`

Find the first `<h1>` or hero heading. Replace its text content with `<EditableText path="hero.headline" />`. Add the import:

```jsx
import { EditableText } from '../cms/EditableText'; // adjust depth as needed
```

Update `src/content/defaultContent.js` so `hero.headline` matches the page's original text — visitors see the same string they saw before; admins can now click it to edit.

If no obvious heading is found, skip the demo and tell the user how to wire one manually.

## Step 11 — Print the handoff checklist

Output exactly this (substitute the framework + storage lines):

```
✓ Vercel Inline CMS installed.

Framework detected: <Next.js App Router | Next.js Pages Router | Vite + React>
Storage choice:    <Vercel KV/Upstash | Vercel Blob | Skipped (in-memory dev only)>

Next steps (you must do these — I can't):
  1. Set ADMIN_PASSWORD in .env.local to a real password.
  2. Generate SESSION_SECRET:  openssl rand -hex 32
  3. Provision storage on Vercel:
       KV/Upstash:  vercel storage create kv
       Blob:        vercel storage create blob
     This auto-adds the env vars to your Vercel project.
  4. Pull the new env vars locally:  vercel env pull .env.local
  5. Run your dev server, visit /admin, log in with ADMIN_PASSWORD.
  6. Click any <EditableText> field on the site to edit it inline.
     Cmd+S saves; the toolbar shows dirty state.

I wired up one editable field as a demo: hero.headline.
Add more by wrapping text in <EditableText path="some.dot.path" /> and adding
the default value to src/content/defaultContent.js.

Deploy with:  vercel --prod
```

## Things to refuse or warn about

- **Hardcoding the password into the code**: refuse. Explain it must be an env var.
- **Skipping auth ("just let anyone edit")**: warn strongly, then refuse. Public inline editing = vandalism risk.
- **Installing on a Tier 2 framework anyway**: don't. Print the relevant section of `docs/manual-port.md` and stop.
- **Existing `src/cms` or `src/admin` directory**: ask before overwriting.
- **Project that isn't going to Vercel**: this skill's storage layer expects Vercel-provisioned env vars. If the user explicitly says they're hosting elsewhere (Render, Fly, self-hosted Node), tell them this isn't the right skill — the architecture transfers but the storage layer would need replacing with a database client.

## Mental model for debugging

If something breaks after install, the four layers fail in characteristic ways. State which layer you think is failing before changing code.

- **Content not loading** → `/api/content` GET returns `{}` or errors. Check the network tab; check `ContentProvider` wraps the app; check the storage backend (env vars set in Vercel, `vercel env pull` run locally).
- **Edits don't save** → POST to `/api/content` returns 401 or 500. 401 = session cookie missing/expired (re-login). 500 = store write failed; check the function logs in Vercel for the storage error.
- **Can't log in** → POST `/api/login` returns 401 even with the right password. Check `ADMIN_PASSWORD` is set in the running process's env (`vercel env ls` for prod; `.env.local` for dev). Check `SESSION_SECRET` is set.
- **`<EditableText>` shows nothing** → the `path` doesn't exist in `defaultContent.js`. Add it. The component returns empty string for missing paths so a typo silently shows blank.
- **`<EditableText>` shows text but won't go editable on `/admin/edit/...`** → `AdminShell` isn't wrapping the page tree. Re-check Step 5: the page must be a descendant of both `AdminGate` and `AdminShell`.
- **"No CMS storage backend configured" error in prod** → user deployed but didn't run `vercel storage create`. Point them at Step 11 instruction 3.

## CSS / theming

All admin styling lives in `templates/src/cms/cms-admin.css` and uses CSS variables (`--cms-accent`, `--cms-bg`, etc.). To rebrand, override any of those variables in a stylesheet imported **after** `cms-admin.css`. Plain CSS, no preprocessor, no runtime CSS-in-JS — works in any project regardless of styling stack.
