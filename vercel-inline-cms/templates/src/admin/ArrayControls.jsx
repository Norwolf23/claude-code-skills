'use client';
// Small "Add item" affordance used inside list editors. Render-only — the parent supplies
// the onAdd handler so it can build whatever default the list expects.
export default function ArrayControls({ onAdd, label = 'Add item', inline = false }) {
  return (
    <div className={`cms-array-controls${inline ? ' is-inline' : ''}`}>
      <button type="button" onClick={onAdd} className="cms-btn-add">
        + {label}
      </button>
    </div>
  );
}
