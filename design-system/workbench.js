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

// ── Navigation ───────────────────────────────────────────────────────────────
// Wide screens: nav pushes content and the choice is remembered.
// ≤ --wb-bp-context: nav opens as an overlay; the content behind is inert; Esc, scrim or choosing an item closes it.
const NAV_STORE = 'aham-ui:workbench:nav';

export function initShell(root = document.querySelector('.aham-workbench')) {
  if (!root) return null;
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
  document.addEventListener('keydown', e => {
    if (e.isComposing || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== 'b') return;
    if (e.target instanceof HTMLElement && e.target.isContentEditable) return;
    e.preventDefault();
    set(!isOpen(), { restoreFocus: true });
  });
  narrow.addEventListener('change', () => set(narrow.matches ? false : remembered(), { persist: false }));

  set(narrow.matches ? false : remembered(), { persist: false });
  return { set, isOpen };
}

// ── Side panels ──────────────────────────────────────────────────────────────
// One panel open at a time. Narrow screens: wide panels float over the content, start closed,
// take focus when opened and close with Esc.
export function initPanels(root = document.querySelector('.aham-workbench')) {
  if (!root) return null;
  const toggles = [...root.querySelectorAll('[data-panel-toggle]')];
  const narrow = contextBreakpoint(root);
  const panelOf = id => (id ? root.querySelector(`#${CSS.escape(id)}`) : null);
  const floating = p => narrow.matches && p?.dataset.size === 'wide';
  let current = null, release = null;

  function show(id, { focus = false } = {}) {
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
    if (floating(p)) {
      const opener = toggles.find(t => t.dataset.panelToggle === id);
      release = pushLayer(() => { show(null); opener?.focus(); });
      if (focus) p.focus();
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

export function openPopover(trigger, panel, { align = 'start', onClose } = {}) {
  closePopover('replace');
  panel.hidden = false;
  trigger.setAttribute('aria-expanded', 'true');
  const place = () => placePopover(api.trigger, panel, align);
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
      api.trigger.setAttribute('aria-expanded', 'false');
      if ((reason === 'escape' || reason === 'done') && api.trigger.isConnected) api.trigger.focus();
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

function placePopover(trigger, panel, align) {
  const r = trigger.getBoundingClientRect(), gap = 4, edge = 8;
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
// Item: { id, label, icon?, prefix?, count?, checked?, arrow?, keywords?, group? } — `checked` makes it a multi-select row.
// `items` may be a function of the query, which is how quick-search results are added under the field list.
export function createCommand(host, { items, onSelect, onBack, placeholder = '搜索…', empty = '没有匹配项', search = true, label = '' }) {
  const id = `wb-cmd-${++uid}`;
  host.classList.add('wb-command');
  host.innerHTML = `${search ? `<div class="wb-command-input">${icon('search')}<input type="text" role="combobox" aria-expanded="true" aria-autocomplete="list" aria-controls="${id}" placeholder="${escapeHtml(placeholder)}" aria-label="${escapeHtml(label || placeholder)}" autocomplete="off"></div>` : ''}<ul class="wb-command-list" role="listbox" id="${id}" aria-label="${escapeHtml(label || placeholder)}" tabindex="${search ? -1 : 0}"></ul><p class="wb-command-empty" hidden>${escapeHtml(empty)}</p>`;
  const input = host.querySelector('input'), list = host.querySelector('ul'), emptyEl = host.querySelector('.wb-command-empty');
  const keyTarget = input || list;
  let shown = [], active = 0;

  const matches = (it, q) => !q || `${it.prefix ?? ''} ${it.label} ${(it.keywords || []).join(' ')}`.toLowerCase().includes(q);
  function render() {
    const q = (input?.value ?? '').trim().toLowerCase();
    const all = typeof items === 'function' ? items(q) : items;
    shown = all.filter(it => it.always || matches(it, q));
    active = Math.min(active, Math.max(0, shown.length - 1));
    list.setAttribute('aria-multiselectable', String(shown.some(it => it.checked !== undefined)));
    let html = '', group;
    const gap = shown.some(it => it.icon) ? '<span class="wb-command-gap" aria-hidden="true"></span>' : '';   // keep labels aligned when only some rows have icons
    shown.forEach((it, i) => {
      if (i > 0 && it.group !== group) html += '<li class="wb-command-sep" role="separator"></li>';
      group = it.group;
      const check = it.checked === undefined ? '' : `<span class="wb-command-check" aria-hidden="true">${icon('check')}</span>`;
      const prefix = it.prefix ? `<span class="wb-command-prefix">${escapeHtml(it.prefix)}</span>${icon('chevron-right')}` : '';
      const count = it.count === undefined ? '' : `<sup class="wb-command-count">${it.count > 99 ? '99+' : it.count}</sup>`;
      html += `<li role="option" id="${id}-${i}" data-index="${i}"${it.checked === undefined ? '' : ` aria-checked="${it.checked}"`}${it.current ? ' aria-current="true"' : ''}>${check}${it.icon ? icon(it.icon) : gap}<span class="wb-command-label">${prefix}<span>${escapeHtml(it.label)}</span>${count}</span>${it.arrow ? icon('arrow-right') : ''}</li>`;
    });
    list.innerHTML = html;
    emptyEl.hidden = shown.length > 0;
    highlight(active, false);
  }
  function highlight(i, scroll = true) {
    active = i;
    list.querySelectorAll('[role=option]').forEach(li => li.toggleAttribute('data-active', Number(li.dataset.index) === i));
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
    else if (e.key === 'Backspace' && input && !input.value && onBack) { e.preventDefault(); onBack(); }
  });
  input?.addEventListener('input', () => { active = 0; render(); });
  list.addEventListener('mousemove', e => { const li = e.target.closest('[role=option]'); if (li && Number(li.dataset.index) !== active) highlight(Number(li.dataset.index), false); });
  list.addEventListener('mousedown', e => e.preventDefault());       // keep focus in the input
  list.addEventListener('click', e => { const li = e.target.closest('[role=option]'); if (li) choose(Number(li.dataset.index)); });
  const api = { render, input, focus: () => keyTarget.focus(), setItems(next) { items = next; render(); } };
  render();
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
