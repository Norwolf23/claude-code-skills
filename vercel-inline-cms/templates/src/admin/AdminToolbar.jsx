'use client';
// Sticky top toolbar shown only inside /admin. Lets the user switch between editable pages,
// see save state, and discard/save/logout. Add more pages by extending the PAGES array below.
//
// Framework-agnostic: uses plain <a href> + window.location instead of any router's
// link/nav primitives. Clicking between admin pages causes a full reload — acceptable
// for an internal admin UI.
import { useEditMode } from '../cms/ContentContext';

// Extend this array with one entry per page you want to edit under /admin/edit/<slug>.
const PAGES = [
  { to: '/admin/edit', label: 'Home' },
];

function isActive(pathname, to) {
  if (to === '/admin/edit') return pathname === '/admin/edit' || pathname === '/admin/edit/';
  return pathname === to || pathname.startsWith(to + '/');
}

function publicHrefFor(pathname) {
  const rest = pathname.replace(/^\/admin\/edit/, '');
  return rest === '' ? '/' : rest;
}

export default function AdminToolbar() {
  const edit = useEditMode();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const onLogout = async () => {
    if (edit.dirty && !confirm('Discard unsaved changes and sign out?')) return;
    await fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    window.location.href = '/admin';
  };

  return (
    <div className="cms-toolbar">
      <div className="cms-toolbar-row">
        <div className="cms-toolbar-brand">
          <span className="cms-pulse" />
          <span className="cms-eyebrow">CMS</span>
        </div>

        <nav className="cms-toolbar-nav">
          {PAGES.map((p) => (
            <a
              key={p.to}
              href={p.to}
              className={`cms-toolbar-link${isActive(pathname, p.to) ? ' is-active' : ''}`}
            >
              {p.label}
            </a>
          ))}
        </nav>

        <div className="cms-toolbar-right">
          <div className="cms-status">
            <span className={`cms-status-dot${edit.dirty ? ' is-dirty' : ''}`} />
            <span>
              {edit.status === 'saving'
                ? 'Saving…'
                : edit.status === 'error'
                  ? 'Save failed'
                  : edit.dirty
                    ? 'Unsaved changes'
                    : 'All changes saved'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => edit.discard()}
            disabled={!edit.dirty || edit.status === 'saving'}
            className="cms-btn-ghost"
          >
            Discard
          </button>

          <button
            type="button"
            onClick={() => edit.save()}
            disabled={!edit.dirty || edit.status === 'saving'}
            className="cms-btn-save"
          >
            {edit.status === 'saving' ? 'Saving…' : 'Save'}
          </button>

          <a
            href={publicHrefFor(pathname)}
            target="_blank"
            rel="noreferrer"
            className="cms-toolbar-view-link"
            title="Open this page in a new tab"
          >
            View →
          </a>

          <button type="button" onClick={onLogout} className="cms-btn-ghost is-danger">
            Sign out
          </button>
        </div>
      </div>

      {edit.status === 'error' && edit.error && (
        <div className="cms-error-banner">{edit.error}</div>
      )}
    </div>
  );
}
