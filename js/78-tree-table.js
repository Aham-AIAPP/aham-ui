// ── Tree table (rules/5-单据.md 5.13) ──────────────────────────────────────────
// Tree table (BOM): a native table whose rows carry data-id and data-level (1 = top). Parent rows hold a
// .wb-tree-toggle button with aria-expanded. One row is in the tab order; ↑↓ / Home / End move among visible rows,
// → expands or steps to the first child, ← collapses or steps to the parent, Enter toggles. Keys act only when the row
// itself has focus. Not declared an ARIA treegrid: cells are not individually navigable. Call refresh() after re-render.
export function initTreeTable(table, { onToggle, onMove } = {}) {
  const life = scope();
  let current = null;
  const rows = () => [...table.querySelectorAll('tbody tr[data-id]')];
  const level = tr => Number(tr.dataset.level) || 1;
  const toggleOf = tr => tr.querySelector('.wb-tree-toggle');
  const expanded = tr => toggleOf(tr)?.getAttribute('aria-expanded') === 'true';
  const idOf = tr => tr?.dataset.id ?? null;
  function refresh() {
    const list = rows();
    let hideBelow = Infinity;
    for (const tr of list) {
      const l = level(tr);
      if (l <= hideBelow) hideBelow = Infinity;
      tr.hidden = l > hideBelow;
      if (!tr.hidden && toggleOf(tr) && !expanded(tr)) hideBelow = l;
    }
    let at = list.findIndex(tr => idOf(tr) === current);
    if (at < 0) at = 0;
    // A row inside a collapsed branch hands the tab stop to its nearest visible ancestor.
    while (at > 0 && list[at]?.hidden) at--;
    const hadFocus = list.some(tr => tr.hidden && tr.contains(document.activeElement));
    current = idOf(list[at]);
    list.forEach(tr => { tr.tabIndex = idOf(tr) === current ? 0 : -1; });
    if (hadFocus) list[at]?.focus();
  }
  function focusRow(tr) {
    if (!tr) return;
    current = idOf(tr);
    rows().forEach(r => { r.tabIndex = r === tr ? 0 : -1; });
    tr.focus();
    tr.scrollIntoView({ block: 'nearest' });
    onMove?.(current);
  }
  function setExpanded(tr, on) {
    const b = toggleOf(tr);
    if (!b || expanded(tr) === on) return;
    b.setAttribute('aria-expanded', String(on));
    refresh();
    onToggle?.(idOf(tr), on);
  }
  life.on(table, 'click', e => {
    const b = e.target.closest?.('.wb-tree-toggle');
    if (b) { const tr = b.closest('tr'); setExpanded(tr, !expanded(tr)); }
  });
  life.on(table, 'keydown', e => {
    const tr = e.target.closest?.('tr[data-id]');
    if (!tr || e.target !== tr || e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
    const shown = rows().filter(r => !r.hidden), i = shown.indexOf(tr);
    const act = {
      ArrowDown: () => focusRow(shown[Math.min(i + 1, shown.length - 1)]),
      ArrowUp: () => focusRow(shown[Math.max(i - 1, 0)]),
      Home: () => focusRow(shown[0]),
      End: () => focusRow(shown[shown.length - 1]),
      ArrowRight: () => (toggleOf(tr) && !expanded(tr) ? setExpanded(tr, true) : level(shown[i + 1] ?? tr) > level(tr) && focusRow(shown[i + 1])),
      ArrowLeft: () => (toggleOf(tr) && expanded(tr) ? setExpanded(tr, false) : focusRow(shown.slice(0, i).reverse().find(r => level(r) < level(tr)))),
      Enter: () => toggleOf(tr) && setExpanded(tr, !expanded(tr)),
    }[e.key];
    if (act) { e.preventDefault(); act(); }
  });
  life.on(table, 'focusin', e => {
    const tr = e.target.closest?.('tr[data-id]');
    if (tr && idOf(tr) !== current) { current = idOf(tr); rows().forEach(r => { r.tabIndex = r === tr ? 0 : -1; }); }
  });
  const setAll = on => { rows().forEach(tr => toggleOf(tr)?.setAttribute('aria-expanded', String(on))); refresh(); };
  refresh();
  return { refresh, expandAll: () => setAll(true), collapseAll: () => setAll(false), current: () => current, focus: id => focusRow(rows().find(tr => idOf(tr) === String(id) && !tr.hidden)), destroy: life.end };
}

