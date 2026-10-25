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
// shell: true adds the commands every workbench page has after the page's own groups: 界面 (sidebar, panels, theme),
// 账户 (accountItems), 跳转 (sidebar items, G + letter) and 帮助 (keyboard shortcuts, also on ?).
export function initPalette({ root, groups, context, shell = false, accountItems }) {
  const life = scope();
  const dialog = document.createElement('dialog');
  dialog.className = 'wb-palette';
  dialog.setAttribute('aria-label', '命令面板');
  dialog.innerHTML = '<div class="wb-palette-context" hidden></div><div class="wb-palette-body"></div>';
  root.append(dialog);
  const chip = dialog.querySelector('.wb-palette-context'), body = dialog.querySelector('.wb-palette-body');
  let stack = [], ctx = null, release = null, returnTo = null, base = 0;
  // Page groups come first; a shell group with the same heading as a page group adds its items to that group.
  const all = c => {
    const list = groups(c).map(g => ({ ...g, items: [...g.items] }));
    if (shell) for (const g of shellGroups(root, { accountItems, showShortcuts })) {
      const same = list.find(x => x.heading === g.heading);
      if (same) same.items.push(...g.items); else list.push(g);
    }
    return list;
  };

  const flatten = list => list.flatMap((g, gi) => g.items.map(it => ({ ...it, group: gi, heading: g.heading, arrow: Boolean(it.children) })));
  function page() {
    const top = stack[stack.length - 1];
    body.innerHTML = '<div></div>';
    const cmd = createCommand(body.firstElementChild, {
      label: top ? top.label : '命令', placeholder: top ? `${top.label}…` : '输入命令或搜索…', empty: '没有匹配的命令',
      items: top ? top.items.map(it => ({ group: 0, heading: top.label, ...it })) : flatten(all(ctx)),
      onSelect: it => {
        if (it.children) { stack.push({ label: it.label.replace(/…$/, ''), items: it.children(ctx) }); page(); return; }
        close();
        it.run?.(ctx);
      },
      onBack: () => {
        if (stack.length > base) { stack.pop(); page(); }
        else if (ctx) { ctx = null; paintChip(); page(); }
      },
    });
    cmd.focus();
  }
  function paintChip() {
    chip.hidden = !ctx;
    chip.innerHTML = ctx ? `<span class="wb-palette-chip"><span class="wb-meta">${escapeHtml(ctx.code ?? '')}</span><span>${escapeHtml(ctx.label)}</span><button type="button" tabindex="-1" aria-label="移除上下文">${icon('close')}</button></span>` : '';
  }
  life.on(chip, 'click', e => { if (e.target.closest('button')) { ctx = null; paintChip(); page(); } });
  function open(start) {
    if (dialog.open) return;
    returnTo = document.activeElement;
    ctx = context?.() ?? null;
    stack = [];
    paintChip();
    dialog.showModal();
    // A page opened directly (e.g. 键盘快捷键 on ?) is the bottom of the stack: one Esc closes the palette.
    release = pushLayer(() => { if (stack.length > base) { stack.pop(); page(); } else close(); });
    if (start) stack.push(start);
    base = stack.length;
    page();
  }
  function close() {
    if (!dialog.open) return;
    release?.();
    release = null;
    dialog.close();
    if (returnTo?.isConnected) returnTo.focus();
  }
  life.on(dialog, 'cancel', e => e.preventDefault());           // Esc goes through the layer stack
  life.on(dialog, 'click', e => { if (e.target === dialog) close(); });
  life.keep(registerShortcut({ keys: 'mod+k', label: '打开命令面板', group: '通用', run: () => (dialog.open ? close() : open()) }));
  function showShortcuts() { open({ label: '键盘快捷键', items: shortcutItems() }); }
  if (shell) life.keep(registerShortcut({ keys: '?', label: '查看键盘快捷键', group: '通用', run: showShortcuts }));
  life.keep(() => { release?.(); dialog.remove(); });
  return { open, close, openAt: (label, items) => open({ label, items }), showShortcuts, destroy: life.end };
}

// Registered shortcuts as palette items, grouped under their group names in the order the groups first appear.
export function shortcutItems() {
  const list = listShortcuts(), order = [...new Set(list.map(s => s.group))];
  return list.map((s, i) => ({ ...s, i })).sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group) || a.i - b.i)
    .map((s, i) => ({ id: `k${i}`, label: s.label, keys: s.keys, group: order.indexOf(s.group), heading: s.group, keywords: [s.group] }));
}

// The commands every workbench page has, built from what the page contains.
export function shellGroups(root, { accountItems, showShortcuts } = {}) {
  const click = sel => () => root.querySelector(sel)?.click();
  const ui = [];
  if (root.querySelector('[data-action="nav"]')) ui.push({ id: 'nav', label: '展开或收起侧栏', icon: 'menu', keys: 'mod+b', run: click('[data-action="nav"]') });
  root.querySelectorAll('[data-panel-toggle]').forEach(t => {
    const name = `${(t.getAttribute('aria-label') || t.textContent.trim() || '侧').replace(/面板$/, '')}面板`;
    ui.push({ id: `panel-${t.dataset.panelToggle}`, label: `${t.getAttribute('aria-pressed') === 'true' ? '关闭' : '打开'}${name}`, icon: 'eye', run: () => t.click() });
  });
  const themeButton = root.querySelector('[data-action="theme"]');
  if (themeButton) {
    // initTheme keeps the button label on the theme a click switches to; the command uses the same words.
    const dark = themeButton.getAttribute('aria-label') === '切换到浅色';
    ui.push({ id: 'theme', label: dark ? '切换到浅色' : '切换到深色', icon: dark ? 'sun' : 'moon', run: click('[data-action="theme"]') });
  }
  return [
    ...(ui.length ? [{ heading: '界面', items: ui }] : []),
    ...(accountItems ? [{ heading: '账户', items: accountItems() }] : []),
    { heading: '跳转', items: navCommands(root) },
    { heading: '帮助', items: [{ id: 'keys', label: '键盘快捷键…', icon: 'help', keys: '?', run: showShortcuts }] },
  ].filter(g => g.items.length);
}

