# Manual port guide — SvelteKit / Astro / Nuxt / static

The `vercel-inline-cms` skill auto-installs into **Next.js (App Router & Pages Router)** and **Vite + React**. For other frameworks the architecture transfers cleanly but the file layout differs, so the skill won't write files for you. This doc maps the four CMS layers onto each unsupported framework so you can port it yourself in ~30 minutes.

## The four layers (recap)

The CMS has four pieces. Port each one:

1. **Content store** — A reactive store holding a JSON content object, hydrated from `GET /api/content` on first render.
2. **Inline editor** — A component (`EditableText`) that renders plain text for visitors and a `contentEditable` field for logged-in admins.
3. **Admin shell** — Three nested wrappers: auth gate (login screen if no cookie) → edit-mode provider (holds the draft + dirty flag + save handler) → toolbar (Save/Discard/Logout).
4. **Backend** — Four Vercel serverless functions: `POST /api/login`, `POST /api/logout`, `GET /api/session`, and `GET/POST /api/content`. These work **as-is** in any framework — Vercel routes root-level `/api/*.js` files as serverless functions regardless of what framework owns the rest of the project. Copy `api/` from `templates/api/` unchanged.

The backend never needs porting. Only the frontend layers do.

---

## SvelteKit

**Content store** — Use a Svelte writable store:
```ts
// src/lib/cms/content.ts
import { writable } from 'svelte/store';
export const content = writable<Record<string, any>>({});
export const editing = writable(false);
export const draft = writable<Record<string, any>>({});

if (typeof window !== 'undefined') {
  fetch('/api/content').then(r => r.json()).then(d => content.set(d));
}
```

**Inline editor** — A Svelte component bound to the store:
```svelte
<!-- src/lib/cms/EditableText.svelte -->
<script lang="ts">
  import { content, editing, draft } from './content';
  export let path: string;
  $: value = getAtPath($editing ? $draft : $content, path) ?? '';
</script>

{#if $editing}
  <span contenteditable="true"
        on:blur={e => draft.update(d => setAtPath(d, path, (e.currentTarget as HTMLElement).innerText))}>
    {value}
  </span>
{:else}
  <span>{value}</span>
{/if}
```

**Admin shell** — Put auth/edit-mode at `src/routes/admin/+layout.svelte`. Check session in a `+layout.server.ts` `load` function that reads the cookie. Toolbar is a sibling component.

**Routes** — Public pages stay where they are. Admin pages live at `src/routes/admin/edit/[[...slug]]/+page.svelte` and render the same components, but inside the admin layout (so editing is on).

**API** — `templates/api/*.js` files work as-is at the project root. SvelteKit ignores them; Vercel picks them up as serverless functions. No need to convert to `+server.ts`.

---

## Astro

Astro is mostly static + islands. The CMS is interactive, so use a React or Svelte island.

**Recommended path:** install the React integration (`npx astro add react`) and use the existing React templates from `vercel-inline-cms` directly as islands.

```astro
---
// src/pages/index.astro
import EditableText from '../components/cms/EditableText.jsx';
import { ContentProvider } from '../components/cms/ContentContext.jsx';
---

<html>
  <body>
    <ContentProvider client:load>
      <h1><EditableText client:load path="hero.headline" /></h1>
    </ContentProvider>
  </body>
</html>
```

`client:load` is required — `EditableText` and `ContentProvider` need to hydrate on the client.

**Admin shell** — Same: import `AdminGate.jsx`, `AdminShell.jsx`, `AdminToolbar.jsx` from the templates, render them with `client:load` inside `src/pages/admin/[...slug].astro`.

**API** — Use `templates/api/*.js` at project root, OR convert to Astro endpoints at `src/pages/api/*.ts`. Either works on Vercel.

---

## Nuxt

Nuxt uses Vue. The components need rewriting in Vue but the architecture is identical.

**Content store** — `useState` from Nuxt:
```ts
// composables/useContent.ts
export const useContent = () => useState('cms-content', () => ({}));
export const useEditMode = () => useState('cms-edit', () => false);
```
Hydrate in `app.vue` via `useAsyncData(() => $fetch('/api/content'))`.

**Inline editor** — A Vue SFC:
```vue
<!-- components/EditableText.vue -->
<script setup lang="ts">
const props = defineProps<{ path: string }>();
const content = useContent();
const editing = useEditMode();
const value = computed(() => getAtPath(content.value, props.path) ?? '');
</script>

<template>
  <span v-if="editing" contenteditable="true" @blur="onBlur">{{ value }}</span>
  <span v-else>{{ value }}</span>
</template>
```

**Admin shell** — `pages/admin/[...slug].vue` with a `definePageMeta({ middleware: 'admin-auth' })`. The middleware checks `/api/session`.

**API** — Two choices:
- Drop `templates/api/*.js` at project root (works on Vercel without Nitro knowing about them), OR
- Port to Nitro: `server/api/login.post.ts`, `server/api/content.get.ts`, etc. The auth logic in `api/_lib/auth.js` ports almost verbatim — just adjust the request/response handling to Nitro's `defineEventHandler` style.

---

## Plain static HTML

No framework, no bundler — just HTML files served from a Vercel static deployment.

**Content store + editor** — Write a small vanilla JS module:
```html
<!-- index.html -->
<h1 data-cms-path="hero.headline">Default headline</h1>
<p data-cms-path="hero.subhead">Default subhead.</p>
<script type="module" src="/cms.js"></script>
```

```js
// cms.js
const editing = window.location.pathname.startsWith('/admin/edit');
const content = await fetch('/api/content').then(r => r.json()).catch(() => ({}));

document.querySelectorAll('[data-cms-path]').forEach(el => {
  const path = el.dataset.cmsPath;
  const value = getAtPath(content, path);
  if (value != null) el.textContent = value;
  if (editing) {
    el.contentEditable = 'true';
    el.addEventListener('blur', () => save(path, el.textContent));
  }
});

async function save(path, value) {
  const next = setAtPath(content, path, value);
  await fetch('/api/content', { method: 'POST', credentials: 'include', body: JSON.stringify(next) });
}
```

**Admin shell** — Build a separate `admin.html` with the login form + toolbar. Check `/api/session` on load; redirect to the public page with `?edit=1` in the URL if authed.

**API** — `templates/api/*.js` files at project root work as-is. The auth/session/content endpoints don't care about the frontend stack.

---

## What to copy verbatim regardless of framework

Even on Tier 2 frameworks, you can copy these files unchanged:

- `templates/api/_lib/auth.js` — HMAC-signed session cookie helpers.
- `templates/api/_lib/store.js` — Vercel KV/Upstash + Blob auto-selecting storage.
- `templates/api/login.js`, `logout.js`, `session.js`, `content.js` — the four endpoints.

Drop them under `/api/` at your project root. Vercel will route them as serverless functions for **any** project type.

## Env vars (same for all frameworks)

```bash
ADMIN_PASSWORD=change-me
SESSION_SECRET=$(openssl rand -hex 32)
# One of these will be auto-set when you run `vercel storage create`:
KV_REST_API_URL=
KV_REST_API_TOKEN=
# Or:
BLOB_READ_WRITE_TOKEN=
```
