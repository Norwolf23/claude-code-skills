'use client';
// Admin auth gate. Checks the session via /api/session — if authed, renders `children`.
// Otherwise shows a login form that POSTs to /api/login.
//
// Framework-agnostic: takes children rather than using router-specific <Outlet/>.
//   - Next.js (App Router): use directly in app/admin/layout.tsx — Next passes children.
//   - Vite + React Router: wrap with a tiny <AdminGate><Outlet/></AdminGate> route element.
//
// Styling: semantic class names defined in src/cms/cms-admin.css. Import that file once
// in your app entry. No Tailwind dependency.
import { useEffect, useState } from 'react';

export default function AdminGate({ children }) {
  const [state, setState] = useState({ phase: 'checking', error: null });
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/session', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setState({ phase: d?.authed ? 'authed' : 'login', error: null }))
      .catch(() => setState({ phase: 'login', error: null }));
  }, []);

  if (state.phase === 'checking') {
    return <div className="cms-login-checking">Checking session…</div>;
  }

  if (state.phase === 'authed') return <>{children}</>;

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setState((s) => ({ ...s, error: null }));
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setState({ phase: 'login', error: data.error || 'Login failed' });
        setSubmitting(false);
        return;
      }
      setState({ phase: 'authed', error: null });
    } catch (err) {
      setState({ phase: 'login', error: err.message || 'Login failed' });
      setSubmitting(false);
    }
  };

  return (
    <div className="cms-login-screen">
      <form onSubmit={onSubmit} className="cms-login-form">
        <div className="cms-brand">
          <span className="cms-pulse" />
          <span className="cms-eyebrow">CMS · Admin</span>
        </div>

        <h1 className="cms-login-title">Sign in</h1>
        <p className="cms-login-subtitle">Enter the admin password to edit site content.</p>

        <label className="cms-field-label">
          <span className="cms-field-label-text">Password</span>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="cms-field-input"
            required
          />
        </label>

        {state.error && <div className="cms-error">{state.error}</div>}

        <button type="submit" disabled={submitting} className="cms-btn-primary">
          {submitting ? 'Signing in…' : 'Sign in →'}
        </button>
      </form>
    </div>
  );
}
