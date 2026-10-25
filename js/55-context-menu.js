// ── Context menu ─────────────────────────────────────────────────────────────
// Right-click on a row, or Shift+F10 / the Menu key on a focused row. Grouped actions; the destructive one last.
// Items with `children` replace the menu in place (Aham: no cascading popovers); ← or Backspace returns.
// items(row) → [{ id, label, icon?, keys?, danger?, group?, run?(row), children?(row) → items }]
export function initContextMenu({ root, target, rowSelector = 'tbody tr[data-id]', items }) {
  const pop = document.createElement('div');
  pop.className = 'wb-popover flush menu';
  pop.hidden = true;
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', '操作菜单');
  pop.innerHTML = '<div></div>';
  root.append(pop);
  function open(row, point) {
    const stack = [];
    const show = () => {
      const top = stack[stack.length - 1];
      const list = top ? [{ id: '__back', label: `返回 · ${top.label}`, icon: 'chevron-left', group: -1 }, ...top.items.map(it => ({ ...it, group: 0 }))] : items(row);
      createCommand(pop.firstElementChild, {
        role: 'menu', search: false, label: top ? top.label : '操作',
        items: list.map(it => ({ ...it, arrow: Boolean(it.children) })),
        onSelect: it => {
          if (it.id === '__back') { stack.pop(); show(); return; }
          if (it.children) { stack.push({ label: it.label, items: it.children(row) }); show(); return; }
          closePopover('done');
          it.run?.(row);
        },
        onBack: () => { if (stack.length) { stack.pop(); show(); } },
      });
      pop.querySelector('[role=menu]').focus();
      activePopover()?.place();
    };
    show();
    const r = row.getBoundingClientRect();
    openPopover(row, pop, { point: point ?? { x: r.left + 48, y: r.top + r.height / 2 }, returnFocus: row });
    pop.querySelector('[role=menu]').focus();
  }
  target.addEventListener('contextmenu', e => {
    const row = e.target.closest(rowSelector);
    if (!row) return;
    e.preventDefault();
    open(row, { x: e.clientX, y: e.clientY });
  });
  target.addEventListener('keydown', e => {
    const row = e.target.closest?.(rowSelector);
    if (row && e.target === row && (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10'))) { e.preventDefault(); open(row); }
  });
  return { open };
}

