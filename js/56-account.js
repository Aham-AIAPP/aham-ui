// ── Account menu and split dialog (rules/11-交互.md 11.6) ───────────────────────────
// The account button at the foot of the sidebar opens a menu: the signed-in account on the first line, then the
// caller's items. A choice closes the menu at once (no exit motion) so the next layer can open in its place.
//   initAccountMenu({ root, button, account: 'lin.yue@example.com', items: () => [{ id, label, icon, keys?, group }], onSelect })
export function initAccountMenu({ root, button = root.querySelector('[data-action="account"]'), account = '', items, onSelect }) {
  const life = scope();
  if (!button) return null;
  const menu = document.createElement('div');
  menu.className = 'wb-popover flush menu';
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-label', '账户');
  menu.hidden = true;
  menu.innerHTML = `${account ? `<div class="wb-account-head">${escapeHtml(account)}</div>` : ''}<div></div>`;
  root.append(menu);
  function open() {
    createCommand(menu.lastElementChild, { role: 'menu', search: false, label: '账户', items: items(), onSelect: it => { closePopover('replace'); onSelect(it); } });
    openPopover(button, menu);
    menu.querySelector('[role=menu]').focus();
  }
  life.on(button, 'click', () => (menu.hidden ? open() : closePopover()));
  life.keep(() => menu.remove());
  return { open, menu, destroy: life.end };
}

// A modal with a section list on the left and the section's rows on the right: personal preferences. Changes apply at
// once, so there is no save button; something that needs confirming asks in its own row, never in a second modal.
//   openSplitDialog({ root, title, sections: [{ id, label, icon }], render: id => html, start, onShow(id, body), returnFocus })
// Opened by pointer, focus goes to the content without a ring; opened from the keyboard, to the current section.
export function openSplitDialog({ root, title, sections, render, start = sections[0].id, onShow, returnFocus }) {
  const head = `wb-split-title-${++uid}`;
  const modal = openDialog({ root, className: 'wb-dialog is-split', labelledBy: head, returnFocus, onBackdrop: () => modal.close(),
    html: `<header class="wb-dialog-head"><h2 id="${head}">${escapeHtml(title)}</h2><button type="button" class="wb-icon-btn" data-split="close" aria-label="关闭">${icon('close')}</button></header>
      <div class="wb-split"><nav class="wb-settings-nav" aria-label="${escapeHtml(title)}分类"><ul>${sections.map(s => `<li><a href="#" data-section="${escapeHtml(s.id)}">${s.icon ? icon(s.icon) : ''}<span>${escapeHtml(s.label)}</span></a></li>`).join('')}</ul></nav><div class="wb-split-body" tabindex="-1"></div></div>` });
  const { dialog, close } = modal;
  const body = dialog.querySelector('.wb-split-body');
  let current = start;
  function show(id) {
    current = id;
    body.innerHTML = render(id);
    body.scrollTop = 0;
    dialog.querySelectorAll('[data-section]').forEach(a => (a.dataset.section === id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    onShow?.(id, body);
  }
  dialog.addEventListener('click', e => {
    const t = e.target.closest('[data-section], [data-split="close"]');
    if (!t) return;
    e.preventDefault();
    if (t.dataset.split === 'close') close();
    else { show(t.dataset.section); t.focus(); }
  });
  show(start);
  if (lastInput() === 'key') dialog.querySelector(`[data-section="${CSS.escape(start)}"]`).focus();
  else body.focus({ focusVisible: false });
  return { dialog, body, close, show, current: () => current, get closed() { return modal.closed; } };
}
