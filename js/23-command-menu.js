// ── Command menu ─────────────────────────────────────────────────────────────
// The cmdk pattern used across Circle: a search input over a listbox. Focus stays in the input; ↑↓ move the
// highlight (looping), Enter chooses, typing filters by label and keywords, Backspace on an empty query calls onBack.
// Item: { id, label, icon?, prefix?, count?, checked?, current?, arrow?, keys?, danger?, keywords?, group?, heading? }
// `checked` makes it a multi-select row; `heading` titles a group (palette); `keys` shows shortcut hints.
// role: 'listbox' (pickers, filters) or 'menu' (context menu actions).
// `items` may be a function of the query, which is how quick-search results are added under the field list.
const commandHosts = new WeakMap();
export function createCommand(host, { items, onSelect, onBack, placeholder = '搜索…', empty = '没有匹配项', search = true, label = '', role = 'listbox' }) {
  commandHosts.get(host)?.destroy();
  if (search && role === 'menu') role = 'listbox';
  const life = scope();
  const id = `wb-cmd-${++uid}`;
  host.classList.add('wb-command');
  host.innerHTML = `${search ? `<div class="wb-command-input">${icon('search')}<input type="text" role="combobox" aria-expanded="true" aria-autocomplete="list" aria-controls="${id}" placeholder="${escapeHtml(placeholder)}" aria-label="${escapeHtml(label || placeholder)}" autocomplete="off"></div>` : ''}<ul class="wb-command-list" role="${role}" id="${id}" aria-label="${escapeHtml(label || placeholder)}" tabindex="${search ? -1 : 0}"></ul><p class="wb-command-empty" hidden>${escapeHtml(empty)}</p>`;
  const input = host.querySelector('input'), list = host.querySelector('ul'), emptyEl = host.querySelector('.wb-command-empty');
  const keyTarget = input || list;
  let shown = [], active = 0;

  const matches = (it, q) => !q || `${it.prefix ?? ''} ${it.label} ${(it.keywords || []).join(' ')}`.toLowerCase().includes(q);
  function render() {
    const q = (input?.value ?? '').trim().toLowerCase();
    const all = typeof items === 'function' ? items(q) : items;
    shown = all.filter(it => it.always || matches(it, q));
    active = Math.min(active, Math.max(0, shown.length - 1));
    if (role === 'listbox') list.setAttribute('aria-multiselectable', String(shown.some(it => it.checked !== undefined)));
    const itemRole = role === 'menu' ? 'menuitem' : 'option';
    let html = '', group;
    const gap = shown.some(it => it.icon) ? '<span class="wb-command-gap" aria-hidden="true"></span>' : '';   // keep labels aligned when only some rows have icons
    // A command that opens a submenu or asks for more (label ends in …) shows an arrow (rules/7-键盘与命令.md 7.2).
    // When any row has one, the others keep an empty slot of the same width, so the key column lines up.
    const arrowed = it => it.arrow || /…$/.test(it.label);
    const slot = shown.some(arrowed) ? '<span class="wb-command-gap" aria-hidden="true"></span>' : '';
    shown.forEach((it, i) => {
      if (it.heading && it.group !== group) html += `<li class="wb-command-heading" role="presentation">${escapeHtml(it.heading)}</li>`;
      else if (i > 0 && it.group !== group) html += '<li class="wb-command-sep" role="separator"></li>';
      group = it.group;
      const check = it.checked === undefined ? '' : `<span class="wb-command-check" aria-hidden="true">${icon('check')}</span>`;
      const prefix = it.prefix ? `<span class="wb-command-prefix">${escapeHtml(it.prefix)}</span>${icon('chevron-right')}` : '';
      const count = it.count === undefined ? '' : `<sup class="wb-command-count">${it.count > 99 ? '99+' : it.count}</sup>`;
      const keys = it.keys ? `<span class="wb-kbd-group" aria-hidden="true">${formatKeys(it.keys).map(k => `<kbd class="wb-kbd">${escapeHtml(k)}</kbd>`).join('')}</span>` : '';
      html += `<li role="${itemRole}" id="${id}-${i}" data-index="${i}"${it.checked === undefined || role === 'menu' ? '' : ` aria-checked="${it.checked}"`}${it.current ? ' aria-current="true"' : ''}${it.danger ? ' class="is-danger"' : ''}${it.keys ? ` aria-keyshortcuts="${escapeHtml(ariaKeys(it.keys))}"` : ''}>${check}${it.icon ? icon(it.icon) : gap}<span class="wb-command-label">${prefix}<span>${escapeHtml(it.label)}</span>${count}</span>${keys}${arrowed(it) ? icon('arrow-right') : slot}</li>`;
    });
    list.innerHTML = html;
    emptyEl.hidden = shown.length > 0;
    highlight(active, false);
  }
  function highlight(i, scroll = true) {
    active = i;
    list.querySelectorAll('[data-index]').forEach(li => li.toggleAttribute('data-active', Number(li.dataset.index) === i));
    const el = list.querySelector(`[data-index="${i}"]`);
    keyTarget.setAttribute('aria-activedescendant', el ? el.id : '');
    if (scroll) el?.scrollIntoView({ block: 'nearest' });
  }
  function choose(i) { if (host.closest('[aria-busy=true], [inert]')) return; const it = shown[i]; if (it) onSelect?.(it, api); }
  life.on(keyTarget, 'keydown', e => {
    if (e.isComposing) return;
    const n = shown.length;
    if (e.key === 'ArrowDown' && n) { e.preventDefault(); highlight((active + 1) % n); }
    else if (e.key === 'ArrowUp' && n) { e.preventDefault(); highlight((active - 1 + n) % n); }
    else if (e.key === 'Home' && n && !input?.value) { e.preventDefault(); highlight(0); }
    else if (e.key === 'End' && n && !input?.value) { e.preventDefault(); highlight(n - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
    else if ((e.key === 'Backspace' || (e.key === 'ArrowLeft' && !input)) && !input?.value && onBack) { e.preventDefault(); onBack(); }
  });
  life.on(input, 'input', () => { active = 0; render(); });
  life.on(list, 'mousemove', e => { const li = e.target.closest('[data-index]'); if (li && Number(li.dataset.index) !== active) highlight(Number(li.dataset.index), false); });
  life.on(list, 'mousedown', e => e.preventDefault());       // keep focus in the input
  life.on(list, 'click', e => { const li = e.target.closest('[data-index]'); if (li) choose(Number(li.dataset.index)); });
  const api = { render, input, focus: () => keyTarget.focus(), setItems(next) { items = next; render(); }, destroy: life.end };
  commandHosts.set(host, api);
  life.keep(() => { if (commandHosts.get(host) === api) commandHosts.delete(host); });
  render();
  const start = shown.findIndex(it => it.current);                 // pickers open with the current value highlighted
  if (start > 0) highlight(start);
  return api;
}

