'use client';
/* eslint-disable react-refresh/only-export-components */
// CMS runtime. Two contexts:
//   - ContentContext   → the current resolved content (default merged with whatever the API returned).
//                        Used by every page to render text. Always available.
//   - EditModeContext  → only "on" inside /admin/edit/*. Carries the pending draft, dirty flag,
//                        save/discard handlers, and the in-flight save status.
//
// Path lookup uses dot/bracket notation: "home.capabilities[0].title".
// Set/delete return new content trees (immutable updates) so React re-renders predictably.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_CONTENT } from '../content/defaultContent';

const ContentContext = createContext({ content: DEFAULT_CONTENT, ready: false });
const EditModeContext = createContext(null);

// Deep merge two plain objects. Arrays in `over` replace arrays in `base` outright
// (we don't want default items leaking in after a user has removed them in the admin).
function deepMerge(base, over) {
  if (over == null) return base;
  if (Array.isArray(base) || Array.isArray(over)) return over;
  if (typeof base !== 'object' || typeof over !== 'object') return over;
  const out = { ...base };
  for (const k of Object.keys(over)) out[k] = deepMerge(base?.[k], over[k]);
  return out;
}

// Split "a.b[0].c" → ["a", "b", 0, "c"].
function parsePath(path) {
  const out = [];
  for (const part of String(path).split('.')) {
    const m = part.match(/^([^[]+)((?:\[\d+\])*)$/);
    if (!m) continue;
    if (m[1]) out.push(m[1]);
    const idx = m[2].match(/\[(\d+)\]/g);
    if (idx) for (const i of idx) out.push(Number(i.slice(1, -1)));
  }
  return out;
}

export function getAtPath(obj, path) {
  const parts = parsePath(path);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

export function setAtPath(obj, path, value) {
  const parts = parsePath(path);
  if (parts.length === 0) return value;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  let cur = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    const next = cur[k];
    cur[k] = Array.isArray(next) ? [...next] : { ...(next || {}) };
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
  return clone;
}

export function ContentProvider({ children }) {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/content')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive) return;
        if (data && typeof data === 'object') {
          setContent(deepMerge(DEFAULT_CONTENT, data));
        }
        setReady(true);
      })
      .catch(() => alive && setReady(true));
    return () => { alive = false; };
  }, []);

  const value = useMemo(() => ({ content, setContent, ready }), [content, ready]);
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  return useContext(ContentContext);
}

export function useText(path, fallback = '') {
  const { content } = useContent();
  const edit = useContext(EditModeContext);
  if (edit?.editing) {
    const v = getAtPath(edit.draft, path);
    return v == null ? fallback : v;
  }
  const v = getAtPath(content, path);
  return v == null ? fallback : v;
}

export function EditModeProvider({ children }) {
  const { content, setContent } = useContent();
  const [editing, setEditing] = useState(true);
  const [draft, setDraft] = useState(content);
  const [status, setStatus] = useState('idle'); // 'idle' | 'saving' | 'error'
  const [error, setError] = useState(null);
  const baseRef = useRef(content);

  // When the underlying content updates (e.g. on first hydration), refresh the base + draft
  // — but only if the user hasn't started editing yet, to avoid clobbering pending changes.
  useEffect(() => {
    if (!isDirty(baseRef.current, draft)) {
      baseRef.current = content;
      setDraft(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const setField = useCallback((path, value) => {
    setDraft((d) => setAtPath(d, path, value));
  }, []);

  const setSection = useCallback((path, value) => {
    setDraft((d) => setAtPath(d, path, value));
  }, []);

  const discard = useCallback(() => {
    setDraft(baseRef.current);
    setError(null);
  }, []);

  const save = useCallback(async () => {
    setStatus('saving');
    setError(null);
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }
      baseRef.current = draft;
      setContent(draft);
      setStatus('idle');
      return true;
    } catch (e) {
      setStatus('error');
      setError(e.message || 'Save failed');
      return false;
    }
  }, [draft, setContent]);

  const value = useMemo(
    () => {
      // eslint-disable-next-line react-hooks/refs
      const dirty = isDirty(baseRef.current, draft);
      return { editing, setEditing, draft, setField, setSection, save, discard, status, error, dirty };
    },
    [editing, draft, setField, setSection, save, discard, status, error]
  );

  return <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>;
}

export function useEditMode() {
  return useContext(EditModeContext);
}

function isDirty(a, b) {
  return JSON.stringify(a) !== JSON.stringify(b);
}
