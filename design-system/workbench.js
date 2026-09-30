// Aham UI workbench behaviour — vanilla ES module, zero dependencies.
// Contract:
//   root        .aham-workbench (add .wb-bare to use components without the shell, e.g. in previews)
//   nav toggle  [data-action="nav"] in header row 1, aria-controls = rail id
//   rail        .wb-rail (52px icon rail; 240px when .expanded)
//   panels      .wb-panel toggled by [data-panel-toggle="<panel id>"]
// Esc closes the topmost open layer only (popover → floating panel → nav overlay → search), then focus returns
// to whatever opened that layer.

// ── Layer stack ──────────────────────────────────────────────────────────────
const layers = [];
export function pushLayer(close) {
  const entry = { close };
  layers.push(entry);
  return () => { const i = layers.indexOf(entry); if (i >= 0) layers.splice(i, 1); };
}
// Guarded so the pure helpers below (filter operators, URL state) can be imported in Node tests.
if (typeof document !== 'undefined') document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || e.isComposing || !layers.length) return;
  e.preventDefault();
  layers[layers.length - 1].close('escape');
});

const contextBreakpoint = root => matchMedia(`(max-width: ${getComputedStyle(root).getPropertyValue('--wb-bp-context').trim() || '64rem'})`);

// ── Theme ────────────────────────────────────────────────────────────────────
// ?theme=light|dark in the page URL sets the starting theme (the panorama page passes its own theme to embedded samples).
// A [data-action="theme"] button inside root toggles light / dark and keeps its pressed state and icon in sync.
export function initTheme(root = document.querySelector('.aham-workbench')) {
  if (!root) return null;
  const button = root.querySelector('[data-action="theme"]');
  function set(theme) {
    root.dataset.theme = theme;
    if (!button) return;
    const dark = theme === 'dark';
    button.setAttribute('aria-pressed', String(dark));
    button.innerHTML = icon(dark ? 'sun' : 'moon');
  }
  const asked = new URLSearchParams(location.search).get('theme');
  if (asked === 'light' || asked === 'dark') set(asked);
  button?.addEventListener('click', () => set(root.dataset.theme === 'dark' ? 'light' : 'dark'));
  return { set, get: () => root.dataset.theme, fromUrl: asked === 'light' || asked === 'dark' ? asked : null };
}

// ── Navigation ───────────────────────────────────────────────────────────────
// Wide screens: nav pushes content and the choice is remembered.
// ≤ --wb-bp-context: nav opens as an overlay; the content behind is inert; Esc, scrim or choosing an item closes it.
const NAV_STORE = 'aham-ui:workbench:nav';

export function initShell(root = document.querySelector('.aham-workbench')) {
  if (!root) return null;
  const theme = initTheme(root);
  const toggle = root.querySelector('[data-action="nav"]');
  const rail = root.querySelector('.wb-rail');
  const main = root.querySelector('.wb-main');
  const narrow = contextBreakpoint(root);
  let scrim = null, release = null;

  const remembered = () => { try { return localStorage.getItem(NAV_STORE) === 'expanded'; } catch { return false; } };
  const remember = open => { try { localStorage.setItem(NAV_STORE, open ? 'expanded' : 'collapsed'); } catch { /* storage blocked: keep in-page state only */ } };
  const isOpen = () => root.classList.contains('expanded');

  function set(open, { persist = true, restoreFocus = false } = {}) {
    root.classList.toggle('expanded', open);
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '收起导航' : '展开导航');
    }
    const overlay = narrow.matches && open;
    if (main) main.inert = overlay;
    if (overlay && !scrim) {
      scrim = document.createElement('div');
      scrim.className = 'wb-scrim';
      scrim.addEventListener('click', () => set(false, { restoreFocus: true }));
      root.append(scrim);
      release = pushLayer(() => set(false, { restoreFocus: true }));
      rail?.querySelector('button:not([disabled]), a[href], [tabindex="0"]')?.focus();
    } else if (!overlay && scrim) {
      scrim.remove();
      scrim = null;
      release?.();
      release = null;
    }
    if (!narrow.matches && persist) remember(open);
    if (restoreFocus && !open) toggle?.focus();
  }

  toggle?.addEventListener('click', () => set(!isOpen()));
  rail?.addEventListener('click', e => {
    if (narrow.matches && isOpen() && e.target.closest('.wb-nav-item')) set(false, { restoreFocus: true });
  });
  registerShortcut({ keys: 'mod+b', label: '展开 / 收起导航', group: '通用', run: e => { if (!(e.target instanceof HTMLElement && e.target.isContentEditable)) set(!isOpen(), { restoreFocus: true }); } });
  narrow.addEventListener('change', () => set(narrow.matches ? false : remembered(), { persist: false }));

  set(narrow.matches ? false : remembered(), { persist: false });
  initTooltips(root);
  return { set, isOpen, theme };
}

// ── Side panels ──────────────────────────────────────────────────────────────
// One panel open at a time. Narrow screens: wide panels float over the content, start closed,
// take focus when opened and close with Esc. show(id, { layer: true, returnTo }) also lets Esc close an inline panel,
// e.g. a preview opened with Space from a list row; focus then goes back to `returnTo`.
export function initPanels(root = document.querySelector('.aham-workbench')) {
  if (!root) return null;
  const toggles = [...root.querySelectorAll('[data-panel-toggle]')];
  const narrow = contextBreakpoint(root);
  const panelOf = id => (id ? root.querySelector(`#${CSS.escape(id)}`) : null);
  const floating = p => narrow.matches && p?.dataset.size === 'wide';
  let current = null, release = null;

  function show(id, { focus = false, layer = false, returnTo = null } = {}) {
    release?.();
    release = null;
    current = id;
    for (const t of toggles) {
      const on = t.dataset.panelToggle === id;
      t.setAttribute('aria-pressed', String(on));
      const p = panelOf(t.dataset.panelToggle);
      if (p) p.hidden = !on;
    }
    const p = panelOf(id);
    if (p && (floating(p) || layer)) {
      const opener = returnTo || toggles.find(t => t.dataset.panelToggle === id);
      release = pushLayer(() => { show(null); opener?.focus(); });
      if (focus && floating(p)) p.focus();
    }
  }
  toggles.forEach(t => t.addEventListener('click', () => show(t.getAttribute('aria-pressed') === 'true' ? null : t.dataset.panelToggle, { focus: true })));
  narrow.addEventListener('change', () => { if (floating(panelOf(current))) show(null); });
  const initial = toggles.find(t => t.getAttribute('aria-pressed') === 'true');
  show(initial && !floating(panelOf(initial.dataset.panelToggle)) ? initial.dataset.panelToggle : null);
  return { show, current: () => current };
}

// ── Popover ──────────────────────────────────────────────────────────────────
// Same contract as components/popover.json: non-modal, one at a time (no cascading), light dismiss.
// Esc or finishing returns focus to the trigger. Arrow-key movement inside lists belongs to createCommand.
// api.trigger may be reassigned when a re-render replaces the trigger element; call api.place() afterwards.
let openPop = null;

// point: { x, y } places the popover at a pointer position (context menu); returnFocus overrides where focus goes back.
export function openPopover(trigger, panel, { align = 'start', onClose, point = null, returnFocus = null } = {}) {
  closePopover('replace');
  panel.hidden = false;
  const expands = el => el.hasAttribute('aria-haspopup');
  if (expands(trigger)) trigger.setAttribute('aria-expanded', 'true');
  const place = () => placePopover(api.trigger, panel, align, point);
  const outside = e => { if (!panel.contains(e.target) && !api.trigger.contains(e.target)) api.close('outside'); };
  const release = pushLayer(reason => api.close(reason));
  document.addEventListener('pointerdown', outside, true);
  addEventListener('resize', place);
  document.addEventListener('scroll', place, true);
  const api = {
    panel, trigger, place,
    close(reason = 'done') {
      if (openPop !== api) return;
      openPop = null;
      release();
      document.removeEventListener('pointerdown', outside, true);
      removeEventListener('resize', place);
      document.removeEventListener('scroll', place, true);
      panel.hidden = true;
      if (expands(api.trigger)) api.trigger.setAttribute('aria-expanded', 'false');
      const back = returnFocus || api.trigger;
      if ((reason === 'escape' || reason === 'done') && (typeof back.isConnected !== 'boolean' || back.isConnected)) back.focus();
      onClose?.(reason);
    },
  };
  openPop = api;
  place();
  (panel.querySelector('[autofocus]') || panel.querySelector('input:not([type=checkbox]), select, textarea') || panel.querySelector('[role=listbox][tabindex="0"], button'))?.focus({ preventScroll: true });
  return api;
}
export const closePopover = (reason = 'done') => openPop?.close(reason);
export const activePopover = () => openPop;

function placePopover(trigger, panel, align, point) {
  const r = point ? { left: point.x, right: point.x, top: point.y, bottom: point.y } : trigger.getBoundingClientRect(), gap = point ? 2 : 4, edge = 8;
  panel.style.left = '0px';
  panel.style.top = '0px';
  const w = panel.offsetWidth, h = panel.offsetHeight;
  let left = align === 'end' ? r.right - w : r.left;
  left = Math.max(edge, Math.min(left, innerWidth - w - edge));
  let top = r.bottom + gap;
  if (top + h > innerHeight - edge && r.top - gap - h > edge) top = r.top - gap - h;
  panel.style.left = `${Math.round(left)}px`;
  panel.style.top = `${Math.round(top)}px`;
}

// ── Header search ────────────────────────────────────────────────────────────
// Button [data-action="search"] reveals .wb-search. Esc clears the text first, then closes.
export function initSearch(root, { value = '', onInput } = {}) {
  const button = root.querySelector('[data-action="search"]');
  const box = root.querySelector('.wb-search');
  const input = box?.querySelector('input');
  if (!button || !box || !input) return null;
  let release = null;
  input.value = value;
  const open = ({ focus = true } = {}) => {
    box.hidden = false;
    button.hidden = true;
    release ??= pushLayer(escape);
    if (focus) input.focus();
  };
  const close = () => {
    release?.();
    release = null;
    box.hidden = true;
    button.hidden = false;
    button.focus();
  };
  function escape() {
    if (input.value) { input.value = ''; onInput?.(''); return; }
    close();
  }
  button.addEventListener('click', () => open());
  input.addEventListener('input', () => onInput?.(input.value));
  input.addEventListener('blur', () => { if (!input.value) setTimeout(() => { if (document.activeElement !== input && !input.value && release) { release(); release = null; box.hidden = true; button.hidden = false; } }, 0); });
  if (value) open({ focus: false });
  return { open, close };
}

// ── Shared helpers ───────────────────────────────────────────────────────────
const ICONS = typeof document !== 'undefined' ? new URL('./icons/aham-icons.svg', import.meta.url).href : '';
export const icon = name => `<svg aria-hidden="true"><use href="${ICONS}#i-${name}"/></svg>`;
export const escapeHtml = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
let uid = 0;

// ── Command menu ─────────────────────────────────────────────────────────────
// The cmdk pattern used across Circle: a search input over a listbox. Focus stays in the input; ↑↓ move the
// highlight (looping), Enter chooses, typing filters by label and keywords, Backspace on an empty query calls onBack.
// Item: { id, label, icon?, prefix?, count?, checked?, current?, arrow?, keys?, danger?, keywords?, group?, heading? }
// `checked` makes it a multi-select row; `heading` titles a group (palette); `keys` shows shortcut hints.
// role: 'listbox' (pickers, filters) or 'menu' (context menu actions).
// `items` may be a function of the query, which is how quick-search results are added under the field list.
export function createCommand(host, { items, onSelect, onBack, placeholder = '搜索…', empty = '没有匹配项', search = true, label = '', role = 'listbox' }) {
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
    shown.forEach((it, i) => {
      if (it.heading && it.group !== group) html += `<li class="wb-command-heading" role="presentation">${escapeHtml(it.heading)}</li>`;
      else if (i > 0 && it.group !== group) html += '<li class="wb-command-sep" role="separator"></li>';
      group = it.group;
      const check = it.checked === undefined ? '' : `<span class="wb-command-check" aria-hidden="true">${icon('check')}</span>`;
      const prefix = it.prefix ? `<span class="wb-command-prefix">${escapeHtml(it.prefix)}</span>${icon('chevron-right')}` : '';
      const count = it.count === undefined ? '' : `<sup class="wb-command-count">${it.count > 99 ? '99+' : it.count}</sup>`;
      const keys = it.keys ? `<span class="wb-kbd-group" aria-hidden="true">${formatKeys(it.keys).map(k => `<kbd class="wb-kbd">${escapeHtml(k)}</kbd>`).join('')}</span>` : '';
      html += `<li role="${itemRole}" id="${id}-${i}" data-index="${i}"${it.checked === undefined || role === 'menu' ? '' : ` aria-checked="${it.checked}"`}${it.current ? ' aria-current="true"' : ''}${it.danger ? ' class="is-danger"' : ''}${it.keys ? ` aria-keyshortcuts="${escapeHtml(ariaKeys(it.keys))}"` : ''}>${check}${it.icon ? icon(it.icon) : gap}<span class="wb-command-label">${prefix}<span>${escapeHtml(it.label)}</span>${count}</span>${keys}${it.arrow ? icon('arrow-right') : ''}</li>`;
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
  function choose(i) { const it = shown[i]; if (it) onSelect?.(it, api); }
  keyTarget.addEventListener('keydown', e => {
    if (e.isComposing) return;
    const n = shown.length;
    if (e.key === 'ArrowDown' && n) { e.preventDefault(); highlight((active + 1) % n); }
    else if (e.key === 'ArrowUp' && n) { e.preventDefault(); highlight((active - 1 + n) % n); }
    else if (e.key === 'Home' && n && !input?.value) { e.preventDefault(); highlight(0); }
    else if (e.key === 'End' && n && !input?.value) { e.preventDefault(); highlight(n - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
    else if ((e.key === 'Backspace' || (e.key === 'ArrowLeft' && !input)) && !input?.value && onBack) { e.preventDefault(); onBack(); }
  });
  input?.addEventListener('input', () => { active = 0; render(); });
  list.addEventListener('mousemove', e => { const li = e.target.closest('[data-index]'); if (li && Number(li.dataset.index) !== active) highlight(Number(li.dataset.index), false); });
  list.addEventListener('mousedown', e => e.preventDefault());       // keep focus in the input
  list.addEventListener('click', e => { const li = e.target.closest('[data-index]'); if (li) choose(Number(li.dataset.index)); });
  const api = { render, input, focus: () => keyTarget.focus(), setItems(next) { items = next; render(); } };
  render();
  const start = shown.findIndex(it => it.current);                 // pickers open with the current value highlighted
  if (start > 0) highlight(start);
  return api;
}

// ── Filter model (pure) ──────────────────────────────────────────────────────
// Operators per field type. Option operators follow the number of values (是 ↔ 是其中之一) and keep their polarity.
export const FILTER_OPERATORS = {
  text: [['contains', '包含'], ['notContains', '不包含']],
  option: [['is', '是'], ['isNot', '不是'], ['anyOf', '是其中之一'], ['noneOf', '不是其中任何一个']],
  number: [['gte', '不少于'], ['lte', '不多于'], ['between', '介于']],
  date: [['after', '晚于'], ['before', '早于'], ['between', '介于']],
};
export const operatorLabel = (type, op) => FILTER_OPERATORS[type]?.find(o => o[0] === op)?.[1] ?? op;
export function fitOperator(type, op, values) {
  if (type !== 'option') return op;
  const many = values.length > 1, negative = op === 'isNot' || op === 'noneOf';
  return negative ? (many ? 'noneOf' : 'isNot') : (many ? 'anyOf' : 'is');
}
export function filterComplete(f, type) {
  if (type === 'option') return f.values.length > 0;
  if (f.op === 'between') return f.values.length === 2 && f.values.every(v => v !== '' && v !== null && v !== undefined);
  return f.values.length > 0 && f.values[0] !== '' && f.values[0] !== null && f.values[0] !== undefined;
}
// Reference client-side matching; server-side lists implement the same operator semantics in their query layer.
export function matchesFilter(value, { op, values }) {
  const text = v => String(v ?? '').toLowerCase();
  switch (op) {
    case 'contains': return text(value).includes(text(values[0]));
    case 'notContains': return !text(value).includes(text(values[0]));
    case 'is': case 'anyOf': return values.includes(value);
    case 'isNot': case 'noneOf': return !values.includes(value);
    case 'gte': return value !== null && value >= values[0];
    case 'lte': return value !== null && value <= values[0];
    case 'after': return value > values[0];
    case 'before': return value < values[0];
    case 'between': return value !== null && value >= values[0] && value <= values[1];
    default: return true;
  }
}
// URL parameter: [[field, op, values], …]. Unknown fields, operators or values are dropped and counted, never trusted.
export const filtersToParam = filters => (filters.length ? JSON.stringify(filters.map(f => [f.field, f.op, f.values])) : '');
export function paramToFilters(raw, fields) {
  const out = { filters: [], dropped: 0 };
  if (!raw) return out;
  let list;
  try { list = JSON.parse(raw); } catch { list = null; }
  if (!Array.isArray(list)) { out.dropped = 1; return out; }
  for (const item of list.slice(0, 20)) {
    const [key, op, values] = Array.isArray(item) ? item : [];
    const f = fields.find(x => x.key === key);
    const ok = f && !out.filters.some(x => x.field === key) && Array.isArray(values) && FILTER_OPERATORS[f.type]?.some(o => o[0] === op) && values.length <= 20 && values.every(v => validFilterValue(f, v));
    if (ok) out.filters.push({ field: key, op, values }); else out.dropped++;
  }
  return out;
}
function validFilterValue(f, v) {
  if (f.type === 'option') return f.options.includes(v);
  if (f.type === 'number') return Number.isFinite(v) && v >= 0;
  if (f.type === 'date') return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
  return typeof v === 'string' && v.length <= 100;
}

// ── Filter controller ────────────────────────────────────────────────────────
// Circle / Linear filter: header button "筛选" (icon only once filters exist) → command menu of fields; typing also
// lists matching option values (quick filter). Applied filters show as four-part chips in a row under the header:
// field | operator | value | ✕, with an add button in front and 清除 at the end. Option values apply as you tick them;
// text, number and date apply as you type once valid. One filter per field.
// fields: [{ key, label, type, icon?, options?, unit?, parse?(input) → value, format?(value) → text }]
// counts(key, option, otherFilters) → number shown next to each option (optional).
export function initFilter({ root, trigger, bar, fields, value = [], counts, onChange }) {
  let filters = value.map(f => ({ ...f, values: [...f.values] }));
  const field = key => fields.find(f => f.key === key);
  const pop = document.createElement('div');
  pop.className = 'wb-popover flush';
  pop.hidden = true;
  pop.setAttribute('role', 'dialog');
  root.append(pop);
  const others = key => filters.filter(f => f.field !== key);
  const fmt = (f, v) => (f.format ? f.format(v) : String(v));

  function valueText(f, fd) {
    if (!filterComplete(f, fd.type)) return '…';
    if (fd.type === 'option') return f.values.length === 1 ? f.values[0] : `${f.values.length} 个${fd.label}`;
    if (f.op === 'between') return `${fmt(fd, f.values[0])} – ${fmt(fd, f.values[1])}${fd.unit ? ` ${fd.unit}` : ''}`;
    return `${fmt(fd, f.values[0])}${fd.unit ? ` ${fd.unit}` : ''}`;
  }
  function renderTrigger() {
    const n = filters.length;
    trigger.classList.toggle('icon-only', n > 0);
    trigger.innerHTML = `${icon('filter')}${n ? '' : '<span>筛选</span>'}`;
    trigger.setAttribute('aria-label', n ? `添加筛选，已有 ${n} 个条件` : '筛选');
    trigger.setAttribute('aria-haspopup', 'dialog');
    if (!trigger.hasAttribute('aria-expanded')) trigger.setAttribute('aria-expanded', 'false');
  }
  function renderBar() {
    bar.hidden = !filters.length;
    if (!filters.length) { bar.innerHTML = ''; return; }
    const chips = filters.map(f => {
      const fd = field(f.field), op = operatorLabel(fd.type, f.op), val = valueText(f, fd);
      const full = fd.type === 'option' ? f.values.join('、') : val;
      return `<div class="wb-chip" role="group" aria-label="${escapeHtml(`${fd.label} ${op} ${full}`)}"><span class="wb-chip-field">${fd.icon ? icon(fd.icon) : ''}${escapeHtml(fd.label)}</span><button type="button" class="wb-chip-op" data-filter-op="${f.field}" data-anchor="op:${f.field}" aria-haspopup="dialog" aria-expanded="false" aria-label="${escapeHtml(`${fd.label}的条件：${op}`)}">${escapeHtml(op)}</button><button type="button" class="wb-chip-value" data-filter-value="${f.field}" data-anchor="value:${f.field}" aria-haspopup="dialog" aria-expanded="false" title="${escapeHtml(full)}" aria-label="${escapeHtml(`${fd.label}的值：${full}`)}"><span>${escapeHtml(val)}</span></button><button type="button" class="wb-chip-remove" data-filter-remove="${f.field}" aria-label="${escapeHtml(`移除筛选：${fd.label}`)}">${icon('close')}</button></div>`;
    }).join('');
    bar.innerHTML = `<div class="wb-filter-chips"><button type="button" class="wb-btn sm outline icon-only" data-filter-add data-anchor="add" aria-haspopup="dialog" aria-expanded="false" aria-label="添加筛选">${icon('filter')}</button>${chips}</div><button type="button" class="wb-btn sm ghost" data-filter-clear>${icon('close')}<span>清除</span></button>`;
  }
  function commit() {
    renderTrigger();
    renderBar();
    const p = activePopover();
    if (p?.panel === pop && !p.trigger.isConnected) {
      const next = bar.querySelector(`[data-anchor="${p.trigger.dataset.anchor}"]`) || bar.querySelector('[data-filter-add]') || trigger;
      p.trigger = next;
      next.setAttribute('aria-expanded', 'true');
      p.place();
    }
    onChange?.(filters.map(f => ({ ...f, values: [...f.values] })));
  }
  function upsert(next) {
    const i = filters.findIndex(f => f.field === next.field);
    if (i >= 0) filters[i] = next; else filters.push(next);
  }
  function show(anchor, build, label) {
    pop.setAttribute('aria-label', label);
    const open = activePopover();
    build();
    if (open?.panel === pop) { open.trigger = anchor; anchor.setAttribute('aria-expanded', 'true'); open.place(); (pop.querySelector('input') || pop.querySelector('[role=listbox]'))?.focus(); }
    else openPopover(anchor, pop, { align: 'start' });
  }

  function openFields(anchor) {
    show(anchor, () => {
      pop.innerHTML = '<div></div>';
      createCommand(pop.firstChild, {
        label: '筛选字段', placeholder: '筛选…',
        items: q => {
          const list = fields.map(f => ({ id: f.key, kind: 'field', label: f.label, icon: f.icon, arrow: true, group: 'fields' }));
          if (!q) return list;
          const quick = fields.filter(f => f.type === 'option').flatMap(f => {
            const cur = filters.find(x => x.field === f.key);
            return f.options.filter(o => o.toLowerCase().includes(q)).map(o => ({ id: `${f.key}:${o}`, kind: 'option', key: f.key, label: o, prefix: f.label, checked: Boolean(cur?.values.includes(o)), count: counts?.(f.key, o, others(f.key)), group: 'quick', always: true }));
          });
          return [...list, ...quick];
        },
        onSelect: (it, cmd) => {
          if (it.kind === 'field') { openValue(it.id, anchor, true); return; }
          toggleOption(it.key, it.label);
          cmd.render();
        },
      });
    }, '添加筛选');
  }
  function toggleOption(key, option) {
    const cur = filters.find(f => f.field === key);
    const values = cur ? (cur.values.includes(option) ? cur.values.filter(v => v !== option) : [...cur.values, option]) : [option];
    if (values.length) upsert({ field: key, op: fitOperator('option', cur?.op ?? 'is', values), values });
    else filters = others(key);
    commit();
  }
  function openValue(key, anchor, fromFields = false) {
    const fd = field(key);
    const back = fromFields ? () => openFields(anchor) : undefined;
    show(anchor, () => {
      if (fd.type === 'option') {
        const initial = new Set(filters.find(f => f.field === key)?.values ?? []);     // selected-first order is fixed while open, as in Circle
        pop.innerHTML = '<div></div>';
        createCommand(pop.firstChild, {
          label: `${fd.label}的值`, placeholder: `${fd.label}…`, onBack: back,
          items: () => {
            const cur = filters.find(f => f.field === key)?.values ?? [];
            const row = o => ({ id: o, label: o, checked: cur.includes(o), count: counts?.(key, o, others(key)), group: initial.has(o) ? 'selected' : 'rest' });
            return [...fd.options.filter(o => initial.has(o)).map(row), ...fd.options.filter(o => !initial.has(o)).map(row)];
          },
          onSelect: (it, cmd) => { toggleOption(key, it.id); cmd.render(); },
        });
        return;
      }
      valueEditor(fd, back);
    }, `筛选：${fd.label}`);
  }
  // Text / number / date editors apply live once the input is valid; an invalid entry keeps the last valid filter.
  function valueEditor(fd, back) {
    const cur = filters.find(f => f.field === fd.key) ?? { field: fd.key, op: FILTER_OPERATORS[fd.type][0][0], values: [] };
    const type = fd.type === 'number' ? 'text' : fd.type === 'date' ? 'date' : 'text';
    const shown = i => (cur.values[i] === undefined ? '' : fd.type === 'number' ? fmt(fd, cur.values[i]).replace(/,/g, '') : cur.values[i]);
    const ops = FILTER_OPERATORS[fd.type];
    pop.innerHTML = `<div class="wb-command wb-value-editor">
      <div class="wb-command-head">${back ? `<button type="button" class="wb-icon-btn" data-back aria-label="返回字段列表">${icon('chevron-left')}</button>` : ''}<span>${escapeHtml(fd.label)}</span></div>
      ${ops.length > 1 ? `<div class="wb-seg sm" role="group" aria-label="条件">${ops.map(([k, l]) => `<button type="button" data-op="${k}" aria-pressed="${k === cur.op}">${escapeHtml(l)}</button>`).join('')}</div>` : ''}
      <div class="wb-value-inputs"><input class="wb-input" type="${type}" data-v="0" value="${escapeHtml(shown(0))}" aria-label="${escapeHtml(fd.label)}${fd.unit ? `（${fd.unit}）` : ''}"${fd.type === 'number' ? ' inputmode="decimal"' : ''} placeholder="${fd.type === 'text' ? '输入关键字' : ''}"><span class="wb-value-to"${cur.op === 'between' ? '' : ' hidden'}>至</span><input class="wb-input" type="${type}" data-v="1" value="${escapeHtml(shown(1))}" aria-label="${escapeHtml(fd.label)}上限"${fd.type === 'number' ? ' inputmode="decimal"' : ''}${cur.op === 'between' ? '' : ' hidden'}>${fd.unit ? `<span class="wb-meta">${escapeHtml(fd.unit)}</span>` : ''}</div>
      <p class="wb-value-error" role="alert"></p>
    </div>`;
    const box = pop.firstElementChild, err = box.querySelector('.wb-value-error');
    let op = cur.op;
    const read = () => {
      const inputs = [...box.querySelectorAll('input')].slice(0, op === 'between' ? 2 : 1);
      const raw = inputs.map(i => i.value.trim());
      inputs.forEach(i => i.removeAttribute('aria-invalid'));
      err.textContent = '';
      if (raw.every(v => v === '')) { filters = others(fd.key); commit(); return; }
      if (raw.some(v => v === '')) return;               // range half-filled: wait
      let values = raw;
      if (fd.type === 'number') {
        values = raw.map(v => (fd.parse ? fd.parse(v) : Number(v)));
        const bad = values.findIndex(v => !Number.isFinite(v) || v < 0);
        if (bad >= 0) { inputs[bad].setAttribute('aria-invalid', 'true'); err.textContent = '请输入不小于 0 的数字。'; return; }
      }
      if (op === 'between' && values[0] > values[1]) values = [values[1], values[0]];
      upsert({ field: fd.key, op, values });
      commit();
    };
    box.addEventListener('input', read);
    box.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); closePopover('done'); } else if (e.key === 'Backspace' && back && e.target.matches('input') && !e.target.value && e.target.dataset.v === '0') { e.preventDefault(); back(); } });
    box.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if ('back' in b.dataset) { back(); return; }
      if (b.dataset.op) {
        op = b.dataset.op;
        box.querySelectorAll('[data-op]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        box.querySelector('[data-v="1"]').hidden = op !== 'between';
        box.querySelector('.wb-value-to').hidden = op !== 'between';
        read();
      }
    });
  }
  function openOperator(key, anchor) {
    const f = filters.find(x => x.field === key), fd = field(key);
    const ops = fd.type === 'option' ? [fitOperator('option', 'is', f.values), fitOperator('option', 'isNot', f.values)] : FILTER_OPERATORS[fd.type].map(o => o[0]);
    show(anchor, () => {
      pop.innerHTML = '<div></div>';
      createCommand(pop.firstChild, {
        label: `${fd.label}的条件`, placeholder: '条件…', search: ops.length > 4,
        items: ops.map(k => ({ id: k, label: operatorLabel(fd.type, k), current: k === f.op })),
        onSelect: it => {
          const values = f.op === 'between' && it.id !== 'between' ? f.values.slice(0, 1) : f.values;
          upsert({ ...f, op: it.id, values });
          closePopover('done');
          commit();
          if (it.id === 'between' && !filterComplete(filters.find(x => x.field === key), fd.type)) {
            const v = bar.querySelector(`[data-filter-value="${key}"]`);
            if (v) openValue(key, v);
          }
        },
      });
    }, `${fd.label}的条件`);
  }

  trigger.addEventListener('click', () => openFields(trigger));
  bar.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if ('filterAdd' in d) openFields(b);
    else if (d.filterOp) openOperator(d.filterOp, b);
    else if (d.filterValue) openValue(d.filterValue, b);
    else if (d.filterRemove) {
      const i = filters.findIndex(f => f.field === d.filterRemove);
      filters = others(d.filterRemove);
      commit();
      (bar.querySelectorAll('[data-filter-remove]')[i] || bar.querySelector('[data-filter-remove]') || trigger).focus();
    } else if ('filterClear' in d) { filters = []; commit(); trigger.focus(); }
  });
  renderTrigger();
  renderBar();
  return {
    get: () => filters.map(f => ({ ...f, values: [...f.values] })),
    set(next) { filters = next.map(f => ({ ...f, values: [...f.values] })); renderTrigger(); renderBar(); },
    open: () => openFields(trigger),
  };
}

// ── Display options ──────────────────────────────────────────────────────────
// Circle's "Display" popover: grouping and ordering rows, row height, then property chips that show or hide columns,
// and 恢复默认. The trigger is a filled small button; a dot (with hidden text) marks settings that differ from default.
// value / defaults: { group: key|null, sort: { field, dir }, density: 'standard'|'compact', columns: [[key, visible], …] }
export function initDisplay({ root, trigger, groups, sorts, columns, value, defaults, onChange }) {
  let state = structuredClone(value);
  const pop = document.createElement('div');
  pop.className = 'wb-popover form';
  pop.hidden = true;
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', '显示选项');
  root.append(pop);
  const pick = s => JSON.stringify({ group: s.group, sort: s.sort, density: s.density, columns: s.columns });
  const changed = () => pick(state) !== pick(defaults);
  const label = key => columns.find(c => c.key === key)?.label ?? key;

  function renderTrigger() {
    trigger.innerHTML = `${icon('settings')}<span>显示</span>${changed() ? '<span class="wb-dot" aria-hidden="true"></span><span class="wb-sr-only">（已调整）</span>' : ''}`;
    trigger.setAttribute('aria-haspopup', 'dialog');
    if (!trigger.hasAttribute('aria-expanded')) trigger.setAttribute('aria-expanded', 'false');
  }
  function renderPop() {
    const token = document.activeElement?.dataset?.k ? `[data-k="${document.activeElement.dataset.k}"]${document.activeElement.dataset.col ? `[data-col="${document.activeElement.dataset.col}"]` : ''}` : null;
    const opt = (v, l, cur) => `<option value="${escapeHtml(v)}"${v === cur ? ' selected' : ''}>${escapeHtml(l)}</option>`;
    const asc = state.sort.dir === 'asc';
    pop.innerHTML = `<div class="wb-pop-section">
      <label class="wb-pop-field"><span>分组</span><select class="wb-select" data-k="group">${opt('', '不分组', state.group ?? '')}${groups.map(([k, l]) => opt(k, l, state.group)).join('')}</select></label>
      <div class="wb-pop-field"><span>排序</span><div class="wb-pop-row"><select class="wb-select" data-k="sort" aria-label="排序字段">${sorts.map(([k, l]) => opt(k, l, state.sort.field)).join('')}</select><button type="button" class="wb-icon-btn" data-k="dir" aria-label="${asc ? '当前升序，改为降序' : '当前降序，改为升序'}" title="${asc ? '升序' : '降序'}">${icon(asc ? 'chevron-up' : 'chevron-down')}</button></div></div>
      <div class="wb-pop-field"><span>行高</span><div class="wb-seg sm" role="group" aria-label="行高"><button type="button" data-k="density" data-v="standard" aria-pressed="${state.density === 'standard'}">标准</button><button type="button" data-k="density" data-v="compact" aria-pressed="${state.density === 'compact'}">紧凑</button></div></div>
    </div><div class="wb-pop-section"><div class="wb-pop-title">显示属性</div><div class="wb-toggle-chips">${state.columns.map(([k, on]) => `<button type="button" class="wb-toggle-chip" data-k="col" data-col="${escapeHtml(k)}" aria-pressed="${on}">${escapeHtml(label(k))}</button>`).join('')}</div></div>
    <div class="wb-pop-foot"><span>${changed() ? '已调整，只保存在本机' : '默认设置'}</span><button type="button" class="wb-btn sm ghost" data-k="reset"${changed() ? '' : ' disabled'}>恢复默认</button></div>`;
    if (token) (pop.querySelector(token) && !pop.querySelector(token).disabled ? pop.querySelector(token) : pop.querySelector('select'))?.focus({ preventScroll: true });
  }
  function update(mutate) {
    mutate(state);
    renderTrigger();
    renderPop();
    activePopover()?.place();
    onChange?.(structuredClone(state));
  }
  pop.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.k === 'group') update(s => { s.group = t.value || null; });
    else if (t.dataset.k === 'sort') update(s => { s.sort = { field: t.value, dir: s.sort.dir }; });
  });
  pop.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const k = b.dataset.k;
    if (k === 'dir') update(s => { s.sort = { ...s.sort, dir: s.sort.dir === 'asc' ? 'desc' : 'asc' }; });
    else if (k === 'density') update(s => { s.density = b.dataset.v; });
    else if (k === 'col') update(s => { const c = s.columns.find(x => x[0] === b.dataset.col); c[1] = !c[1]; });
    else if (k === 'reset') update(s => Object.assign(s, structuredClone(defaults)));
  });
  trigger.addEventListener('click', () => { renderPop(); openPopover(trigger, pop, { align: 'end' }); });
  renderTrigger();
  return {
    get: () => structuredClone(state),
    set(next) { state = structuredClone(next); renderTrigger(); if (!pop.hidden) renderPop(); },
  };
}

// ── List keyboard ────────────────────────────────────────────────────────────
// Linear-style row navigation on a native table. One row (the current row) is in the tab order (roving tabindex);
// ↑↓ / Home / End move it, Space toggles the preview, Enter opens the record, x toggles its selection.
// Keys act only when the row itself has focus, so checkboxes, links and inputs inside the row keep their own keys.
// Call refresh() after every re-render. The table is not declared an ARIA grid (cells are not individually navigable).
export function initListKeys({ table, onPreview, onOpen, onToggle, onMove, onRange }) {
  let current = null, anchor = null;
  const rows = () => [...table.querySelectorAll('tbody tr[data-id]')];
  const idOf = tr => tr?.dataset.id ?? null;
  function refresh() {
    const list = rows();
    if (!list.some(tr => idOf(tr) === current)) current = idOf(list[0]);
    list.forEach(tr => { tr.tabIndex = idOf(tr) === current ? 0 : -1; });
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
  table.addEventListener('keydown', e => {
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
  table.addEventListener('click', e => {
    const box = e.target.closest?.('input[type=checkbox]'), tr = box?.closest('tr[data-id]');
    if (!tr) return;
    if (e.shiftKey && onRange && anchor && anchor !== idOf(tr)) onRange(between(anchor, idOf(tr)), box.checked);
    anchor = idOf(tr);
  });
  table.addEventListener('focusin', e => {
    const tr = e.target.closest?.('tr[data-id]');
    if (tr && idOf(tr) !== current) { current = idOf(tr); refresh(); }
  });
  return { refresh, current: () => current, focus: id => focusRow(rows().find(tr => idOf(tr) === String(id)) ?? rows()[0]) };
}

// ── Property pickers ─────────────────────────────────────────────────────────
// Properties panel values that open a command menu (Circle's status / assignee pickers). Buttons [data-prop="key"]
// inside `root`; fields: { key: { label, options, icon? } }. The current value is marked; choosing closes and reports.
export function initPropertyPickers({ container, fields, value, onChange }) {
  let values = { ...value };
  function paint() {
    container.querySelectorAll('[data-prop]').forEach(b => {
      const key = b.dataset.prop, f = fields[key], v = values[key];
      b.classList.toggle('is-empty', !v);
      b.innerHTML = `${f.icon ? icon(f.icon) : ''}<span>${escapeHtml(v || `设置${f.label}`)}</span>`;
      b.setAttribute('aria-label', `${f.label}：${v || '未设置'}，点击修改`);
      b.setAttribute('aria-haspopup', 'dialog');
      if (!b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded', 'false');
    });
  }
  container.addEventListener('click', e => {
    const b = e.target.closest('[data-prop]');
    if (!b) return;
    const key = b.dataset.prop, f = fields[key];
    openPicker(b, { label: f.label, options: f.options, current: values[key], icon: f.icon, onSelect: (v, before) => { values = { ...values, [key]: v }; paint(); onChange?.(key, v, before); } });
  });
  paint();
  return { set(next) { values = { ...next }; paint(); }, get: () => ({ ...values }) };
}

// ── Composer ─────────────────────────────────────────────────────────────────
// Comment box: ⌘/Ctrl+Enter or the send button submits; Enter alone adds a line; nothing is sent while an IME is
// composing or the text is blank. onSubmit(text) returns true (or a promise of true) when the comment was saved.
export function initComposer(form, { onSubmit }) {
  const area = form.querySelector('textarea'), send = form.querySelector('[type=submit]');
  const sync = () => { send.disabled = !area.value.trim(); };
  async function submit() {
    const text = area.value.trim();
    if (!text) return;
    send.disabled = true;
    form.setAttribute('aria-busy', 'true');
    let ok = false;
    try { ok = await onSubmit(text); } finally { form.removeAttribute('aria-busy'); }
    if (ok) area.value = '';
    sync();
    area.focus();
  }
  area.addEventListener('input', sync);
  area.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.isComposing) { e.preventDefault(); submit(); }
  });
  form.addEventListener('submit', e => { e.preventDefault(); submit(); });
  sync();
  return { submit };
}

// ── Shortcuts ────────────────────────────────────────────────────────────────
// One registry for every keyboard shortcut, so the help list only shows what is actually wired.
// keys: 'mod+k' (⌘ on macOS, Ctrl elsewhere), 'shift+/', 'c', or a sequence 'g l' (press g, then l within 1s).
// Single-key shortcuts never fire while typing in a field or while an IME is composing; mod+ shortcuts do.
// external: true lists a key handled elsewhere (list keys, Esc) in the help without dispatching it here.
const shortcuts = [];
// Single-character shortcuts (no ⌘ / Ctrl / Alt) can be switched off (WCAG 2.1.4); the choice is kept in this browser.
const SINGLE_KEY_STORE = 'aham-ui:workbench:single-key';
let singleKeys = typeof document === 'undefined' || (() => { try { return localStorage.getItem(SINGLE_KEY_STORE) !== 'off'; } catch { return true; } })();
const characterOnly = keys => keys.split(' ').every(step => !step.includes('+') && [...step].length === 1);
export function setSingleKeyShortcuts(on) {
  singleKeys = Boolean(on);
  try { localStorage.setItem(SINGLE_KEY_STORE, singleKeys ? 'on' : 'off'); } catch { /* storage blocked: this page only */ }
}
export const singleKeyShortcuts = () => singleKeys;
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const KEY_LABEL = { mod: isMac ? '⌘' : 'Ctrl', shift: isMac ? '⇧' : 'Shift', alt: isMac ? '⌥' : 'Alt', enter: 'Enter', escape: 'Esc', space: '空格', up: '↑', down: '↓', home: 'Home', end: 'End', f10: 'F10', '/': '/', '?': '?' };
export function formatKeys(keys) {
  return keys.split(' ').map(step => step.split('+').map(k => KEY_LABEL[k] ?? k.toUpperCase()).join(isMac ? '' : '+'));
}
function ariaKeys(keys) { return keys.split(' ').map(step => step.split('+').map(k => ({ mod: isMac ? 'Meta' : 'Control', shift: 'Shift', alt: 'Alt' })[k] ?? k.toUpperCase()).join('+')).join(' '); }
export function registerShortcut(def) {
  const entry = { group: '通用', when: () => true, ...def };
  shortcuts.push(entry);
  return () => { const i = shortcuts.indexOf(entry); if (i >= 0) shortcuts.splice(i, 1); };
}
export const listShortcuts = () => shortcuts.filter(s => s.label && (singleKeys || !characterOnly(s.keys)) && (s.external || s.when())).map(({ keys, label, group }) => ({ keys, label, group }));
const editable = el => el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
let pending = null, pendingTimer = 0;
// Arrow keys report 'ArrowDown' etc.; the registry and shortcuts.json name them 'down', 'up', 'left', 'right'.
const KEY_ALIAS = { arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right', esc: 'escape' };
export function keyStep(e) {
  // Shift+/ reports '?' on most layouts but '/' with shiftKey from some input sources; treat both as '?'.
  const raw = e.key === ' ' ? 'space' : e.key === '/' && e.shiftKey ? '?' : e.key.toLowerCase();
  const k = KEY_ALIAS[raw] ?? raw;
  const mods = [(e.metaKey || e.ctrlKey) && 'mod', e.altKey && 'alt', e.shiftKey && e.key.length !== 1 && 'shift'].filter(Boolean);
  return [...mods, k === '?' ? '?' : k].join('+');
}
if (typeof document !== 'undefined') document.addEventListener('keydown', e => {
  if (e.isComposing || e.defaultPrevented || e.repeat) return;
  const step = keyStep(e), typing = editable(e.target);
  const seq = pending ? `${pending} ${step}` : step;
  const live = shortcuts.filter(s => !s.external && (singleKeys || !characterOnly(s.keys)));
  const hit = live.find(s => s.keys === seq && s.when(e)) || (pending ? live.find(s => s.keys === step && s.when(e)) : null);
  const modded = step.startsWith('mod+');
  if (hit && (!typing || modded)) { e.preventDefault(); pending = null; hit.run(e); return; }
  if (!typing && !modded && live.some(s => s.keys.startsWith(`${step} `) && s.when(e))) {
    pending = step;
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => { pending = null; }, 1000);
    return;
  }
  pending = null;
});

// ── Tooltips ─────────────────────────────────────────────────────────────────
// [data-tooltip="名称"] plus optional data-keys="mod+b" shows the name and its shortcut after a short hover, or at once
// on keyboard focus. One at a time; hidden on leave, blur, any key press (Esc included), scroll or click. Coarse pointers get none.
// The tip is aria-hidden: buttons keep their aria-label, and data-keys is mirrored into aria-keyshortcuts.
const TOOLTIP_DELAY = 500;
export function initTooltips(root = document.querySelector('.aham-workbench')) {
  if (!root || root.querySelector(':scope > .wb-tooltip')) return null;
  const tip = document.createElement('div');
  tip.className = 'wb-tooltip';
  tip.setAttribute('aria-hidden', 'true');
  tip.hidden = true;
  root.append(tip);
  root.querySelectorAll('[data-tooltip][data-keys]').forEach(el => el.setAttribute('aria-keyshortcuts', ariaKeys(el.dataset.keys)));
  const coarse = matchMedia('(pointer: coarse)');
  let timer = 0, owner = null;
  function show(el) {
    owner = el;
    const keys = el.dataset.keys && (singleKeys || !characterOnly(el.dataset.keys)) ? el.dataset.keys : '';
    tip.innerHTML = `<span>${escapeHtml(el.dataset.tooltip)}</span>${keys ? `<span class="wb-kbd-group">${formatKeys(keys).map(k => `<kbd class="wb-kbd">${escapeHtml(k)}</kbd>`).join('')}</span>` : ''}`;
    tip.hidden = false;
    const r = el.getBoundingClientRect(), t = tip.getBoundingClientRect(), gap = 4;
    const top = r.bottom + gap + t.height > innerHeight - gap ? r.top - gap - t.height : r.bottom + gap;
    const left = Math.max(gap, Math.min(r.left + r.width / 2 - t.width / 2, innerWidth - t.width - gap));
    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
  }
  function hide() { clearTimeout(timer); owner = null; tip.hidden = true; }
  root.addEventListener('pointerover', e => {
    const el = e.target.closest?.('[data-tooltip]');
    if (!el || el === owner || coarse.matches || e.pointerType === 'touch') return;
    clearTimeout(timer);
    timer = setTimeout(() => show(el), owner ? 0 : TOOLTIP_DELAY);
  });
  root.addEventListener('pointerout', e => { const el = e.target.closest?.('[data-tooltip]'); if (el && !el.contains(e.relatedTarget)) hide(); });
  root.addEventListener('focusin', e => { const el = e.target.closest?.('[data-tooltip]'); if (el?.matches(':focus-visible')) show(el); });
  root.addEventListener('focusout', hide);
  root.addEventListener('pointerdown', hide);
  document.addEventListener('keydown', () => { if (owner) hide(); });
  addEventListener('scroll', hide, true);
  return { hide };
}

// ── Toast ────────────────────────────────────────────────────────────────────
// Transient confirmation after an action, bottom-right (bottom on phones). At most 3 stay; each leaves after 4s,
// paused while hovered or focused. An optional action (e.g. 撤销) runs once and dismisses. Errors that need a fix belong
// next to the field or in an inline notice, not in a toast.
let toastHost = null;
export function toast(message, { action, duration = 4000 } = {}) {
  const root = document.querySelector('.aham-workbench');
  if (!root) return () => {};
  if (!toastHost || !toastHost.isConnected) {
    toastHost = document.createElement('section');
    toastHost.className = 'wb-toasts';
    toastHost.setAttribute('aria-label', '通知');
    root.append(toastHost);
  }
  const el = document.createElement('div');
  el.className = 'wb-toast';
  el.setAttribute('role', 'status');
  el.innerHTML = `<span>${escapeHtml(message)}</span>${action ? `<button type="button" class="wb-btn sm ghost">${escapeHtml(action.label)}</button>` : ''}`;
  toastHost.append(el);
  while (toastHost.children.length > 3) toastHost.firstElementChild.remove();
  let timer = 0, left = duration, started = Date.now();
  const dismiss = () => { clearTimeout(timer); el.remove(); };
  const start = () => { started = Date.now(); timer = setTimeout(dismiss, left); };
  const pause = () => { clearTimeout(timer); left -= Date.now() - started; };
  el.addEventListener('mouseenter', pause); el.addEventListener('mouseleave', start);
  el.addEventListener('focusin', pause); el.addEventListener('focusout', start);
  el.querySelector('button')?.addEventListener('click', () => { action.run(); dismiss(); });
  start();
  return dismiss;
}

// ── Picker ───────────────────────────────────────────────────────────────────
// Single-value property picker used by table cells, the properties panel and shortcuts: a command menu anchored to
// the element being edited, opening on the current value.
let pickerPop = null;
export function openPicker(anchor, { label, options, current, icon: optionIcon, onSelect, returnFocus }) {
  const root = anchor.closest('.aham-workbench') || document.querySelector('.aham-workbench');
  if (!pickerPop || !pickerPop.isConnected) {
    pickerPop = document.createElement('div');
    pickerPop.className = 'wb-popover flush';
    pickerPop.hidden = true;
    pickerPop.setAttribute('role', 'dialog');
    pickerPop.innerHTML = '<div></div>';
  }
  const host = anchor.closest('dialog') || root;                       // a modal dialog makes everything outside it inert
  if (pickerPop.parentElement !== host) host.append(pickerPop);
  pickerPop.setAttribute('aria-label', `修改${label}`);
  pickerPop.firstElementChild.className = '';
  createCommand(pickerPop.firstElementChild, {
    label, placeholder: `${label}…`, search: options.length > 6,
    items: options.map(o => ({ id: o, label: o, icon: optionIcon, current: o === current })),
    onSelect: it => { closePopover('done'); if (it.id !== current) onSelect(it.id, current); },
  });
  return openPopover(anchor, pickerPop, { returnFocus });
}

// ── Command palette ──────────────────────────────────────────────────────────
// ⌘K / Ctrl+K opens a modal command menu near the top of the window (Circle / Linear). Items come in headed groups;
// an item with `children` opens a sub-list in place (no cascading menus): Esc or Backspace on an empty query goes back.
// An optional context chip names the record the commands act on; Backspace on an empty query removes it.
// groups(ctx) → [{ heading, items: [{ id, label, icon?, keys?, run?(ctx), children?(ctx) → items, keywords? }] }]
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

// ── Create dialog ────────────────────────────────────────────────────────────
// Quick create, as Circle's new-issue modal: borderless title, description, property chips that open pickers,
// then 继续新建 and the primary button. ⌘/Ctrl+Enter creates. Closing with unsaved text asks in place
// (继续编辑 / 放弃 / 创建) instead of stacking a second modal. The title error is shown under the title.
// fields: [{ key, label, options, icon?, value? }]; onSubmit({ title, description, ...props }) → true when saved.
// returnFocus: where focus goes on close when the element that opened the dialog was re-rendered meanwhile.
export function openCreateDialog({ root, title: heading, scope, fields = [], onSubmit, returnFocus }) {
  const dialog = document.createElement('dialog');
  dialog.className = 'wb-create';
  dialog.setAttribute('aria-labelledby', 'wb-create-title');
  const props = Object.fromEntries(fields.map(f => [f.key, f.value ?? '']));
  dialog.innerHTML = `<form method="dialog" novalidate>
    <div class="wb-create-head">${scope ? `<span class="wb-create-scope">${escapeHtml(scope)}</span>${icon('chevron-right')}` : ''}<span id="wb-create-title">${escapeHtml(heading)}</span></div>
    <input class="wb-create-name" name="title" aria-label="标题" placeholder="标题" maxlength="200" autocomplete="off" aria-describedby="wb-create-error">
    <p class="wb-value-error" id="wb-create-error" role="alert"></p>
    <textarea class="wb-create-desc" name="description" aria-label="说明" placeholder="补充说明…" rows="3" maxlength="2000"></textarea>
    <div class="wb-create-props">${fields.map(f => `<button type="button" class="wb-btn sm" data-create-prop="${escapeHtml(f.key)}" aria-haspopup="dialog" aria-expanded="false"></button>`).join('')}</div>
    <div class="wb-create-foot">
      <label class="wb-switch"><input type="checkbox" name="more"><span aria-hidden="true"></span>继续新建</label>
      <div class="wb-create-actions"><button type="button" class="wb-btn sm" data-create="cancel">取消</button><button type="submit" class="wb-btn sm primary">创建</button></div>
    </div>
    <div class="wb-create-foot wb-create-confirm" hidden><span>有未保存的内容。</span><div class="wb-create-actions"><button type="button" class="wb-btn sm" data-create="keep">继续编辑</button><button type="button" class="wb-btn sm ghost danger" data-create="discard">放弃</button><button type="button" class="wb-btn sm primary" data-create="save">创建</button></div></div>
  </form>`;
  root.append(dialog);
  const form = dialog.querySelector('form'), name = form.title, desc = form.description, err = dialog.querySelector('#wb-create-error');
  const [foot, confirm] = dialog.querySelectorAll('.wb-create-foot');
  const returnTo = document.activeElement;
  const paintProps = () => dialog.querySelectorAll('[data-create-prop]').forEach(b => {
    const f = fields.find(x => x.key === b.dataset.createProp), v = props[f.key];
    b.innerHTML = `${f.icon ? icon(f.icon) : ''}<span>${escapeHtml(v || f.label)}</span>`;
    b.classList.toggle('is-empty', !v);
    b.setAttribute('aria-label', `${f.label}：${v || '未设置'}`);
  });
  const dirty = () => Boolean(name.value.trim() || desc.value.trim());
  let release = null;
  function finish() { release?.(); dialog.close(); dialog.remove(); (returnTo?.isConnected ? returnTo : returnFocus)?.focus?.(); }
  function askClose() {
    if (!dirty()) { finish(); return; }
    foot.hidden = true; confirm.hidden = false;
    confirm.querySelector('[data-create="keep"]').focus();
  }
  async function submit() {
    const t = name.value.trim();
    if (!t) { err.textContent = '请填写标题。'; name.setAttribute('aria-invalid', 'true'); name.focus(); foot.hidden = false; confirm.hidden = true; return; }
    const ok = await onSubmit({ title: t, description: desc.value.trim(), ...props });
    if (!ok) return;
    if (form.more.checked) { name.value = ''; desc.value = ''; err.textContent = ''; name.removeAttribute('aria-invalid'); name.focus(); return; }
    finish();
  }
  dialog.addEventListener('cancel', e => e.preventDefault());
  form.addEventListener('submit', e => { e.preventDefault(); submit(); });
  form.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.isComposing) { e.preventDefault(); submit(); } });
  name.addEventListener('input', () => { err.textContent = ''; name.removeAttribute('aria-invalid'); });
  dialog.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.createProp) {
      const f = fields.find(x => x.key === b.dataset.createProp);
      openPicker(b, { label: f.label, options: f.options, current: props[f.key], icon: f.icon, onSelect: v => { props[f.key] = v; paintProps(); } });
    } else if (b.dataset.create === 'cancel') askClose();
    else if (b.dataset.create === 'keep') { foot.hidden = false; confirm.hidden = true; name.focus(); }
    else if (b.dataset.create === 'discard') finish();
    else if (b.dataset.create === 'save') submit();
  });
  paintProps();
  dialog.showModal();
  release = pushLayer(() => (confirm.hidden ? askClose() : (foot.hidden = false, confirm.hidden = true, name.focus())));
  name.focus();
  return { close: finish };
}

// ── Files, tree table and version compare (WORKBENCH §15) ────────────────────
// Pure helpers first (tested in Node), then the DOM behaviour. Aham renders no PDF or CAD itself: the product puts a
// rendered page (img, canvas or svg) into the viewer canvas and swaps it in onPage.

// Checks one file against the accepted extensions ('.pdf', '.step') and a size limit in bytes. null = accepted.
export function checkFile(file, { accept = [], maxSize = Infinity } = {}) {
  const name = String(file?.name ?? ''), dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : '';
  if (accept.length && !accept.some(a => a.toLowerCase() === ext)) return `不支持的类型${ext ? ` ${ext}` : ''}`;
  if (!file.size) return '空文件';
  if (file.size > maxSize) return `超过 ${formatBytes(maxSize)}`;
  return null;
}
export function formatBytes(n) {
  if (!Number.isFinite(n) || n < 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${i && n < 10 ? n.toFixed(1) : Math.round(n)} ${units[i]}`;
}
// Subtotals for a flat tree [{ id, parent }]: a leaf contributes value(row), a parent the sum of its children.
// Pass integers (e.g. cents) so that the sums are exact. Returns Map id → total.
export function treeTotals(rows, value) {
  const kids = new Map(), totals = new Map(), visiting = new Set();
  for (const r of rows) if (r.parent != null) kids.set(r.parent, [...(kids.get(r.parent) || []), r]);
  const total = r => {
    if (totals.has(r.id)) return totals.get(r.id);
    if (visiting.has(r.id)) throw new Error(`Cyclic tree at ${r.id}`);
    visiting.add(r.id);
    const children = kids.get(r.id);
    const t = children ? children.reduce((sum, c) => sum + total(c), 0) : value(r);
    totals.set(r.id, t);
    return t;
  };
  rows.forEach(total);
  return totals;
}
// Compares two versions of a record list by key. fields limits the compared fields (keys or { key }).
// added and changed follow the newer order, removed the older order.
export function diffRecords(before, after, { key = 'id', fields } = {}) {
  const idOf = r => String(r[key]);
  const old = new Map(before.map(r => [idOf(r), r])), now = new Map(after.map(r => [idOf(r), r]));
  const keys = (fields ?? [...new Set([...before, ...after].flatMap(Object.keys))].filter(k => k !== key)).map(f => (typeof f === 'string' ? f : f.key));
  const same = (a, b) => Object.is(a, b) || JSON.stringify(a) === JSON.stringify(b);
  const changed = [];
  let unchanged = 0;
  for (const r of after) {
    const o = old.get(idOf(r));
    if (!o) continue;
    const diffs = keys.filter(k => !same(o[k], r[k])).map(k => ({ field: k, from: o[k], to: r[k] }));
    if (diffs.length) changed.push({ id: idOf(r), before: o, after: r, fields: diffs });
    else unchanged++;
  }
  return { added: after.filter(r => !old.has(idOf(r))), removed: before.filter(r => !now.has(idOf(r))), changed, unchanged };
}

// Drop zone: drag files or a folder onto .wb-drop, or use its [data-drop="files" | "folder"] buttons (the keyboard path).
// Every file comes back once, checked: onFiles([{ file, name, path, size, error }]). The product uploads, shows progress
// and retries; nothing here talks to a server. A .zip is one file: unpacking happens on the server.
const hasFiles = e => [...(e.dataTransfer?.types || [])].includes('Files');
async function walkEntry(entry, prefix = '') {
  if (entry.isFile) return [{ file: await new Promise((ok, fail) => entry.file(ok, fail)), path: prefix + entry.name }];
  const reader = entry.createReader(), found = [];
  for (let batch; (batch = await new Promise((ok, fail) => reader.readEntries(ok, fail))).length;) found.push(...batch);
  return (await Promise.all(found.map(child => walkEntry(child, `${prefix}${entry.name}/`)))).flat();
}
export function initDropZone(zone, { accept = [], maxSize = Infinity, onFiles }) {
  const inputs = [...zone.querySelectorAll('input[type=file]')];
  inputs.forEach(input => { if (accept.length && !input.hasAttribute('webkitdirectory')) input.accept = accept.join(','); });
  const deliver = list => {
    const items = list.map(({ file, path }) => ({ file, name: file.name, path: path || file.webkitRelativePath || file.name, size: file.size, error: checkFile(file, { accept, maxSize }) }));
    if (items.length) onFiles?.(items);
  };
  let depth = 0;
  const over = on => { if (on) zone.dataset.drag = 'over'; else delete zone.dataset.drag; };
  zone.addEventListener('dragenter', e => { if (!hasFiles(e)) return; e.preventDefault(); depth++; over(true); });
  zone.addEventListener('dragover', e => { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  zone.addEventListener('dragleave', () => { depth = Math.max(0, depth - 1); if (!depth) over(false); });
  zone.addEventListener('drop', async e => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth = 0;
    over(false);
    // Entries must be read before the first await: the browser empties dataTransfer after the event.
    const entries = [...e.dataTransfer.items].map(i => i.webkitGetAsEntry?.()).filter(Boolean);
    deliver(entries.length ? (await Promise.all(entries.map(entry => walkEntry(entry)))).flat() : [...e.dataTransfer.files].map(file => ({ file })));
  });
  const open = (folder = false) => inputs.find(i => i.hasAttribute('webkitdirectory') === folder)?.click();
  zone.addEventListener('click', e => { const b = e.target.closest?.('[data-drop]'); if (b) open(b.dataset.drop === 'folder'); });
  inputs.forEach(input => input.addEventListener('change', () => { deliver([...input.files].map(file => ({ file }))); input.value = ''; }));
  return { open };
}

// File viewer: toolbar [data-viewer="prev|next|page|pages|zoom|zoom-out|zoom-in|fit|actual"], a focusable scroll area
// .wb-viewer-stage and the page .wb-viewer-canvas sized from its natural width × height. With the stage focused:
// + / − zoom, 0 fits the page, PageUp / PageDown turn pages, arrows scroll; ⌘ / Ctrl + wheel zooms; drag pans when zoomed.
// show({ page, x, y, width, height }) outlines a region in natural pixels, e.g. where a recognised field came from.
const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
export function initViewer(root, { pages = 1, page = 1, width, height, onPage, onZoom } = {}) {
  const stage = root.querySelector('.wb-viewer-stage'), canvas = root.querySelector('.wb-viewer-canvas');
  const part = name => root.querySelector(`[data-viewer="${name}"]`);
  const size = { width: width ?? Number(canvas.dataset.width), height: height ?? Number(canvas.dataset.height) };
  let zoom = 1, fitted = true, drag = null;
  function paint() {
    canvas.style.width = `${Math.round(size.width * zoom)}px`;
    canvas.style.height = `${Math.round(size.height * zoom)}px`;
    if (part('zoom')) part('zoom').textContent = `${Math.round(zoom * 100)}%`;
    stage.dataset.pan = String(canvas.offsetWidth > stage.clientWidth || canvas.offsetHeight > stage.clientHeight);
  }
  function sync() {
    if (part('page')) { part('page').value = page; part('page').max = pages; }
    if (part('pages')) part('pages').textContent = pages;
    if (part('prev')) part('prev').disabled = page <= 1;
    if (part('next')) part('next').disabled = page >= pages;
  }
  function setZoom(z, fit = false) {
    zoom = Math.min(ZOOM_STEPS[ZOOM_STEPS.length - 1], Math.max(0.1, z));
    fitted = fit;
    paint();
    onZoom?.(zoom);
  }
  function fit() {
    const css = getComputedStyle(stage);
    const w = stage.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
    const h = stage.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom);
    setZoom(Math.min(w / size.width, h / size.height) || 1, true);
  }
  const step = dir => {
    const next = dir > 0 ? ZOOM_STEPS.find(s => s > zoom + 1e-3) : [...ZOOM_STEPS].reverse().find(s => s < zoom - 1e-3);
    if (next) setZoom(next);
  };
  function setPage(n) {
    const p = Math.min(pages, Math.max(1, Math.round(n) || 1));
    const turned = p !== page;
    page = p;
    sync();
    if (turned) onPage?.(page);
  }
  function show({ page: at, x, y, width: w, height: h }) {
    if (at) setPage(at);
    let mark = canvas.querySelector('.wb-viewer-mark');
    if (!mark) {
      mark = document.createElement('div');
      mark.className = 'wb-viewer-mark';
      mark.setAttribute('aria-hidden', 'true');
      canvas.append(mark);
    }
    const pct = v => `${(v * 100).toFixed(3)}%`;
    Object.assign(mark.style, { left: pct(x / size.width), top: pct(y / size.height), width: pct(w / size.width), height: pct(h / size.height) });
    mark.hidden = false;
    mark.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  const hide = () => { const mark = canvas.querySelector('.wb-viewer-mark'); if (mark) mark.hidden = true; };
  // Call after the product has put a new page into the canvas (sizes in natural pixels).
  function load({ width: w = size.width, height: h = size.height, pages: total = pages, page: at = page } = {}) {
    Object.assign(size, { width: w, height: h });
    pages = total;
    page = Math.min(pages, Math.max(1, at));
    sync();
    if (fitted) fit(); else paint();
  }
  root.addEventListener('click', e => {
    const b = e.target.closest?.('button[data-viewer]');
    const act = { prev: () => setPage(page - 1), next: () => setPage(page + 1), 'zoom-in': () => step(1), 'zoom-out': () => step(-1), fit, actual: () => setZoom(1) }[b?.dataset.viewer];
    act?.();
  });
  part('page')?.addEventListener('change', e => setPage(parseInt(e.target.value, 10)));
  stage.addEventListener('keydown', e => {
    if (e.target !== stage || e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
    const act = { '+': () => step(1), '=': () => step(1), '-': () => step(-1), 0: fit, PageDown: () => setPage(page + 1), PageUp: () => setPage(page - 1) }[e.key];
    if (act) { e.preventDefault(); act(); }
  });
  stage.addEventListener('wheel', e => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); step(e.deltaY < 0 ? 1 : -1); }, { passive: false });
  stage.addEventListener('pointerdown', e => {
    if (e.button !== 0 || stage.dataset.pan !== 'true') return;
    drag = { x: e.clientX, y: e.clientY, left: stage.scrollLeft, top: stage.scrollTop };
    stage.setPointerCapture(e.pointerId);
    stage.dataset.dragging = '';
  });
  stage.addEventListener('pointermove', e => {
    if (!drag) return;
    stage.scrollLeft = drag.left - (e.clientX - drag.x);
    stage.scrollTop = drag.top - (e.clientY - drag.y);
  });
  const endDrag = () => { drag = null; delete stage.dataset.dragging; };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => (fitted ? fit() : paint())).observe(stage);
  sync();
  fit();
  return { load, setPage, setZoom, fit, show, hide, page: () => page, zoom: () => zoom };
}

// Tree table (BOM): a native table whose rows carry data-id and data-level (1 = top). Parent rows hold a
// .wb-tree-toggle button with aria-expanded. One row is in the tab order; ↑↓ / Home / End move among visible rows,
// → expands or steps to the first child, ← collapses or steps to the parent, Enter toggles. Keys act only when the row
// itself has focus. Not declared an ARIA treegrid: cells are not individually navigable. Call refresh() after re-render.
export function initTreeTable(table, { onToggle, onMove } = {}) {
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
  table.addEventListener('click', e => {
    const b = e.target.closest?.('.wb-tree-toggle');
    if (b) { const tr = b.closest('tr'); setExpanded(tr, !expanded(tr)); }
  });
  table.addEventListener('keydown', e => {
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
  table.addEventListener('focusin', e => {
    const tr = e.target.closest?.('tr[data-id]');
    if (tr && idOf(tr) !== current) { current = idOf(tr); rows().forEach(r => { r.tabIndex = r === tr ? 0 : -1; }); }
  });
  const setAll = on => { rows().forEach(tr => toggleOf(tr)?.setAttribute('aria-expanded', String(on))); refresh(); };
  refresh();
  return { refresh, expandAll: () => setAll(true), collapseAll: () => setAll(false), current: () => current, focus: id => focusRow(rows().find(tr => idOf(tr) === String(id) && !tr.hidden)) };
}

// ── AI assistance (WORKBENCH §14) ────────────────────────────────────────────
// AI drafts, summarises and suggests; people decide. Consent is off until the user turns it on (DESIGN §1.11) and the
// choice is kept in this browser. Nothing here calls a model: the product passes generate({ signal }), an async
// iterable of text chunks that stops when the signal aborts, and decides what adopting a result means.
const AI_STORE = 'aham-ui:workbench:ai';
let aiOn = typeof document !== 'undefined' && (() => { try { return localStorage.getItem(AI_STORE) === 'on'; } catch { return false; } })();
export const aiEnabled = () => aiOn;
export function setAIEnabled(on) {
  aiOn = Boolean(on);
  try { localStorage.setItem(AI_STORE, aiOn ? 'on' : 'off'); } catch { /* storage blocked: this page only */ }
}
const AI_STATE = { consent: '需要开启', generating: '生成中', done: 'AI 生成', stopped: '已停止', failed: '生成失败' };

// A generated block: marker, streamed body, sources, then one primary action. Esc or 停止 stops generation and keeps
// what arrived. sources: [{ label, href? }]; consent: what is sent and to whom, shown before the first use.
// needsConsent() decides whether to ask first (default: AI not yet enabled); state previews can pass their own.
export function createAIOutput(host, { title, sources = [], consent = '会把当前记录的名称、属性和最近动态发送给产品配置的 AI 服务。', needsConsent = () => !aiOn, generate, adoptLabel = '采纳', onAdopt, onEdit, onDiscard }) {
  const box = document.createElement('section');
  box.className = 'wb-ai';
  box.setAttribute('aria-label', `AI：${title}`);
  box.innerHTML = `<header class="wb-ai-head"><span class="wb-ai-mark">${icon('ai')}<span data-ai-state></span></span><span class="wb-ai-title">${escapeHtml(title)}</span><button type="button" class="wb-icon-btn wb-ai-stop" data-ai="stop" aria-label="停止生成" data-tooltip="停止生成" hidden>${icon('stop')}</button></header>
    <div class="wb-ai-body"></div>
    ${sources.length ? `<p class="wb-ai-sources">依据：${sources.map(s => (s.href ? `<a href="${escapeHtml(s.href)}">${escapeHtml(s.label)}</a>` : `<span>${escapeHtml(s.label)}</span>`)).join('、')}</p>` : ''}
    <div class="wb-ai-actions"></div>
    <p class="wb-sr-only" role="status"></p>`;
  host.append(box);
  const q = s => box.querySelector(s), body = q('.wb-ai-body'), actions = q('.wb-ai-actions'), status = q('[role=status]');
  let controller = null, release = null, text = '', consented = false;
  const button = (id, label, kind = 'ghost') => `<button type="button" class="wb-btn sm ${kind}" data-ai="${id}">${escapeHtml(label)}</button>`;
  function show() { body.innerHTML = text.split(/\n{2,}/).filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join(''); }
  function paint(state, message = '') {
    box.dataset.state = state;
    box.setAttribute('aria-busy', String(state === 'generating'));
    q('[data-ai-state]').textContent = AI_STATE[state];
    q('.wb-ai-stop').hidden = state !== 'generating';
    if (q('.wb-ai-sources')) q('.wb-ai-sources').hidden = state === 'consent' || state === 'failed';
    const keep = state === 'stopped' && text.trim();
    actions.innerHTML = {
      consent: button('allow', '开启并继续', 'primary') + button('discard', '取消'),
      generating: '',
      done: button('adopt', adoptLabel, 'primary') + (onEdit ? button('edit', '编辑') : '') + button('retry', '重新生成') + button('discard', '丢弃'),
      stopped: (keep ? button('adopt', adoptLabel, 'primary') : '') + button('retry', '重新生成', keep ? 'ghost' : 'primary') + button('discard', '丢弃'),
      failed: button('retry', '重试', 'primary') + button('discard', '关闭'),
    }[state];
    if (state === 'consent') body.innerHTML = `<p>${escapeHtml(consent)}开启后可以在设置里关闭。</p>`;
    if (state === 'failed') body.insertAdjacentHTML('beforeend', `<p class="wb-ai-error">${escapeHtml(message || '生成失败。')}已有输入不受影响。</p>`);
  }
  const unlayer = () => { release?.(); release = null; };
  function stop() {
    if (box.dataset.state !== 'generating') return;
    controller.abort();
    unlayer();
    paint('stopped');
    status.textContent = `已停止：${title}`;
  }
  async function run() {
    if (!consented && needsConsent()) { paint('consent'); return; }
    controller?.abort();
    controller = new AbortController();
    const { signal } = controller;
    text = '';
    body.innerHTML = '';
    paint('generating');
    unlayer();
    release = pushLayer(stop);
    try {
      for await (const chunk of generate({ signal })) { if (signal.aborted) return; text += chunk; show(); }
      if (signal.aborted) return;
      unlayer();
      paint('done');
      status.textContent = `AI 已生成：${title}`;
    } catch (err) {
      if (signal.aborted) return;
      unlayer();
      show();
      paint('failed', err?.message);
    }
  }
  function remove() { if (box.dataset.state === 'generating') controller.abort(); unlayer(); box.remove(); }
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-ai]');
    if (!b) return;
    const act = b.dataset.ai;
    if (act === 'stop') stop();
    else if (act === 'allow') { consented = true; setAIEnabled(true); run(); }
    else if (act === 'retry') run();
    else if (act === 'adopt') { onAdopt?.(text); remove(); }
    else if (act === 'edit') { onEdit?.(text); remove(); }
    else if (act === 'discard') { onDiscard?.(); remove(); }
  });
  run();
  return { run, stop, remove, text: () => text, element: box };
}

// One inline suggestion per page, under the field it concerns: value + reason, 采纳 / 忽略. Adopting goes through the
// caller's normal change path (immediate, undoable); a dismissed value is not offered again on this page.
const dismissedSuggestions = new Set();
export function showSuggestion(anchor, { key, label, value, reason, onAccept, onDismiss }) {
  const id = `${key}:${value}`;
  if (dismissedSuggestions.has(id)) return null;
  (anchor.closest('.aham-workbench') ?? document).querySelectorAll('.wb-ai-suggest').forEach(el => el.remove());
  const el = document.createElement('div');
  el.className = 'wb-ai-suggest';
  el.setAttribute('role', 'note');
  el.setAttribute('aria-label', `AI 建议把${label}改为${value}`);
  el.innerHTML = `${icon('ai')}<span>建议：<strong>${escapeHtml(value)}</strong></span>${reason ? `<span class="wb-ai-reason">${escapeHtml(reason)}</span>` : ''}<span class="wb-ai-suggest-actions"><button type="button" class="wb-btn sm ghost" data-ai="accept">采纳</button><button type="button" class="wb-btn sm ghost" data-ai="dismiss">忽略</button></span>`;
  anchor.after(el);
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-ai]');
    if (!b) return;
    el.remove();
    if (b.dataset.ai === 'accept') onAccept?.(value);
    else { dismissedSuggestions.add(id); onDismiss?.(); }
    (anchor.querySelector('button') ?? anchor).focus?.();
  });
  return { remove: () => el.remove() };
}

// AI-proposed changes are written only after this confirmation (WORKBENCH §14.5). changes: [{ target, from?, to }].
export function openAIConfirm({ root, title = '确认 AI 提出的修改', reason, changes, onConfirm, returnFocus }) {
  const dialog = document.createElement('dialog');
  dialog.className = 'wb-dialog wb-ai-confirm';
  dialog.setAttribute('aria-labelledby', 'wb-ai-confirm-title');
  dialog.innerHTML = `<form method="dialog">
    <span class="wb-ai-mark">${icon('ai')}<span>AI 建议</span></span>
    <h2 id="wb-ai-confirm-title">${escapeHtml(title)}</h2>
    ${reason ? `<p>${escapeHtml(reason)}</p>` : ''}
    <ul class="wb-ai-changes">${changes.map(c => `<li><span>${escapeHtml(c.target)}</span><span>${c.from != null ? `${escapeHtml(c.from)} → ` : ''}<strong>${escapeHtml(c.to)}</strong></span></li>`).join('')}</ul>
    <p class="wb-ai-note">共 ${changes.length} 项。确认后才会写入，写入后可以撤销。</p>
    <div class="wb-dialog-foot"><button class="wb-btn" value="cancel">取消</button><button class="wb-btn primary" value="confirm" autofocus>确认修改</button></div>
  </form>`;
  root.append(dialog);
  const returnTo = document.activeElement;
  let release = null;
  dialog.addEventListener('close', () => {
    release?.();
    const ok = dialog.returnValue === 'confirm';
    dialog.remove();
    (returnTo?.isConnected ? returnTo : returnFocus)?.focus?.();
    if (ok) onConfirm?.(changes);
  }, { once: true });
  dialog.addEventListener('cancel', e => e.preventDefault());
  dialog.returnValue = '';
  dialog.showModal();
  release = pushLayer(() => dialog.close('cancel'));
  return { close: () => dialog.close('cancel') };
}
