// ── Command palette ──────────────────────────────────────────────────────────
// ⌘K / Ctrl+K opens a modal command menu near the top of the window (Circle / Linear). Items come in headed groups;
// an item with `children` opens a sub-list in place (no cascading menus): Esc or Backspace on an empty query goes back.
// An optional context chip names the record the commands act on; Backspace on an empty query removes it.
// groups(ctx) → [{ heading, items: [{ id, label, icon?, keys?, run?(ctx), children?(ctx) → items, keywords? }] }]
// Jump commands for the palette, read from the sidebar items that carry data-go (rules/7-键盘与命令.md 7.2).
// The sidebar, the G shortcuts and the palette then share one definition. The current page is left out.
export function navCommands(root) {
  return [...root.querySelectorAll('.wb-rail [data-go]')].filter(a => a.getAttribute('aria-current') !== 'page')
    .map(a => ({ id: `go-${a.dataset.go}`, label: [...a.children].find(c => c.tagName === 'SPAN' && !c.classList.contains('wb-nav-count'))?.textContent.trim() ?? a.textContent.trim(), keys: `g ${a.dataset.go}`, run: () => a.click() }));
}
export function initPalette({ root, groups, context }) {
  const dialog = document.createElement('dialog');
  dialog.className = 'wb-palette';
  dialog.setAttribute('aria-label', '命令面板');
  dialog.innerHTML = '<div class="wb-palette-context" hidden></div><div class="wb-palette-body"></div>';
  root.append(dialog);
  const chip = dialog.querySelector('.wb-palette-context'), body = dialog.querySelector('.wb-palette-body');
  let stack = [], ctx = null, release = null, returnTo = null;

  const flatten = list => list.flatMap((g, gi) => g.items.map(it => ({ ...it, group: gi, heading: g.heading, arrow: Boolean(it.children) })));
  function page() {
    const top = stack[stack.length - 1];
    body.innerHTML = '<div></div>';
    const cmd = createCommand(body.firstElementChild, {
      label: top ? top.label : '命令', placeholder: top ? `${top.label}…` : '输入命令或搜索…', empty: '没有匹配的命令',
      items: top ? top.items.map(it => ({ group: 0, heading: top.label, ...it })) : flatten(groups(ctx)),
      onSelect: it => {
        if (it.children) { stack.push({ label: it.label.replace(/…$/, ''), items: it.children(ctx) }); page(); return; }
        close();
        it.run?.(ctx);
      },
      onBack: () => {
        if (stack.length) { stack.pop(); page(); }
        else if (ctx) { ctx = null; paintChip(); page(); }
      },
    });
    cmd.focus();
  }
  function paintChip() {
    chip.hidden = !ctx;
    chip.innerHTML = ctx ? `<span class="wb-palette-chip"><span class="wb-meta">${escapeHtml(ctx.code ?? '')}</span><span>${escapeHtml(ctx.label)}</span><button type="button" tabindex="-1" aria-label="移除上下文">${icon('close')}</button></span>` : '';
  }
  chip.addEventListener('click', e => { if (e.target.closest('button')) { ctx = null; paintChip(); page(); } });
  function open(start) {
    if (dialog.open) return;
    returnTo = document.activeElement;
    ctx = context?.() ?? null;
    stack = [];
    paintChip();
    dialog.showModal();
    release = pushLayer(() => { if (stack.length) { stack.pop(); page(); } else close(); });
    if (start) stack.push(start);
    page();
  }
  function close() {
    if (!dialog.open) return;
    release?.();
    release = null;
    dialog.close();
    if (returnTo?.isConnected) returnTo.focus();
  }
  dialog.addEventListener('cancel', e => e.preventDefault());           // Esc goes through the layer stack
  dialog.addEventListener('click', e => { if (e.target === dialog) close(); });
  registerShortcut({ keys: 'mod+k', label: '打开命令面板', group: '通用', run: () => (dialog.open ? close() : open()) });
  return { open, close, openAt: (label, items) => open({ label, items }) };
}

