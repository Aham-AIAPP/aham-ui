// ── List keyboard ────────────────────────────────────────────────────────────
// Linear-style row navigation on a native table. One row (the current row) is in the tab order (roving tabindex);
// ↑↓ / Home / End move it, Space toggles the preview, Enter opens the record, x toggles its selection.
// Keys act only when the row itself has focus, so checkboxes, links and inputs inside the row keep their own keys.
// Call refresh() after every re-render. The table is not declared an ARIA grid (cells are not individually navigable).
export function initListKeys({ table, onPreview, onOpen, onToggle, onMove, onRange }) {
  const life = scope();
  let current = null, anchor = null;
  const rows = () => [...table.querySelectorAll('tbody tr[data-id]')];
  const idOf = tr => tr?.dataset.id ?? null;
  function refresh() {
    const list = rows();
    if (!list.some(tr => idOf(tr) === current)) current = idOf(list[0]);
    // Controls inside the rows (checkbox, pickers, the name link) join the tab order only in the current row,
    // so Tab leaves a 50-row list in a few presses (rules/7-键盘与命令.md 7.6).
    list.forEach(tr => {
      const on = idOf(tr) === current;
      tr.tabIndex = on ? 0 : -1;
      tr.querySelectorAll('a[href], button, input, select, textarea').forEach(el => { el.tabIndex = on ? 0 : -1; });
    });
  }
  // Ids of the rows from a to b inclusive, in list order.
  function between(a, b) {
    const list = rows(), i = list.findIndex(tr => idOf(tr) === a), j = list.findIndex(tr => idOf(tr) === b);
    if (i < 0 || j < 0) return [b];
    return list.slice(Math.min(i, j), Math.max(i, j) + 1).map(idOf);
  }
  function focusRow(tr) {
    if (!tr) return;
    current = idOf(tr);
    refresh();
    tr.focus();
    tr.scrollIntoView({ block: 'nearest' });
    onMove?.(current);
  }
  life.on(table, 'keydown', e => {
    const tr = e.target.closest?.('tr[data-id]');
    if (!tr || e.target !== tr || e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
    const list = rows(), i = list.indexOf(tr);
    switch (e.key) {
      case 'ArrowDown': case 'ArrowUp': {
        e.preventDefault();
        const next = list[e.key === 'ArrowDown' ? Math.min(i + 1, list.length - 1) : Math.max(i - 1, 0)];
        if (e.shiftKey && onRange) {
          anchor ??= idOf(tr);
          focusRow(next);
          onRange(between(anchor, idOf(next)), true);
        } else {
          anchor = null;
          focusRow(next);
        }
        break;
      }
      case 'Home': e.preventDefault(); focusRow(list[0]); break;
      case 'End': e.preventDefault(); focusRow(list[list.length - 1]); break;
      case ' ': e.preventDefault(); onPreview?.(idOf(tr)); break;
      case 'Enter': e.preventDefault(); onOpen?.(idOf(tr)); break;
      case 'x': case 'X': e.preventDefault(); anchor = idOf(tr); onToggle?.(idOf(tr)); break;
    }
  });
  // Shift + click on a row checkbox applies its new state to every row since the last checked one.
  life.on(table, 'click', e => {
    const box = e.target.closest?.('input[type=checkbox]'), tr = box?.closest('tr[data-id]');
    if (!tr) return;
    if (e.shiftKey && onRange && anchor && anchor !== idOf(tr)) onRange(between(anchor, idOf(tr)), box.checked);
    anchor = idOf(tr);
  });
  life.on(table, 'focusin', e => {
    const tr = e.target.closest?.('tr[data-id]');
    if (tr && idOf(tr) !== current) { current = idOf(tr); refresh(); }
  });
  return { refresh, current: () => current, focus: id => focusRow(rows().find(tr => idOf(tr) === String(id)) ?? rows()[0]), destroy: life.end };
}

