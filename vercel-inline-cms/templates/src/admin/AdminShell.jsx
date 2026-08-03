'use client';
// Admin shell. Wraps children in EditModeProvider (so every <EditableText/> goes
// interactive) and renders the sticky admin toolbar above them.
//
// Framework-agnostic: takes children rather than <Outlet/>.
//   - Next.js (App Router): inside app/admin/layout.tsx, render <AdminGate><AdminShell>{children}</AdminShell></AdminGate>.
//   - Vite + React Router: wrap as <AdminGate><AdminShell><Outlet/></AdminShell></AdminGate>.
import { useEffect } from 'react';
import { EditModeProvider, useEditMode } from '../cms/ContentContext';
import AdminToolbar from './AdminToolbar';

export default function AdminShell({ children }) {
  return (
    <EditModeProvider>
      <AdminBody>
        <AdminToolbar />
        <div className="cms-admin-body-padding">{children}</div>
      </AdminBody>
    </EditModeProvider>
  );
}

function AdminBody({ children }) {
  const edit = useEditMode();

  // Toggle the global edit-mode class so .cms-editable styles apply.
  useEffect(() => {
    document.body.classList.add('cms-editing');
    return () => document.body.classList.remove('cms-editing');
  }, []);

  // Warn before navigating away with unsaved changes.
  useEffect(() => {
    if (!edit.dirty) return;
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [edit.dirty]);

  // Cmd/Ctrl+S → save.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (edit.dirty) edit.save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [edit]);

  return <>{children}</>;
}
