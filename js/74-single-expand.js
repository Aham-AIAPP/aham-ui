// ── Single-open list (rules/4-页面.md 4.3) ──────────────────────────────────────────────
// Rows are <details> with one shared name, so the browser closes the open row when another opens. This also does it
// for browsers without the name attribute, and keeps the opened row in view.
export function initSingleExpand(list) {
  const rows = () => [...list.querySelectorAll(':scope > details')];
  const onToggle = e => {
    const row = e.target;
    if (!(row instanceof HTMLDetailsElement) || row.parentElement !== list || !row.open) return;
    for (const other of rows()) if (other !== row && other.open) other.open = false;
    row.scrollIntoView?.({ block: 'nearest' });
  };
  list.addEventListener('toggle', onToggle, true);
  return { destroy: () => list.removeEventListener('toggle', onToggle, true), open: i => { const r = rows()[i]; if (r) r.open = true; } };
}

