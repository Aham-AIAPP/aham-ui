// List page sample: wires the design-system components (workbench.js) to fictional demo data.
// Everything reusable lives in workbench.js / workbench.css; this file only renders rows and keeps demo state.
import {initShell, initPanels, initSearch, initFilter, initDisplay, initListKeys, initPalette, initContextMenu, openCreateDialog, openPicker, registerShortcut, listShortcuts, toast, createCommand, openPopover, closePopover, pushLayer, icon, escapeHtml as esc} from '../workbench.js';
import {makeCustomers, FIELDS, field, OWNERS, STAGES, INDUSTRIES, TODAY, VIEWS, PAGE_SIZES, applyFilters, applyView, applySearch, arrange, groupRows, paginate, encodeState, decodeState, normalizeDisplay, money} from './customer-list-model.mjs';

const root = document.querySelector('.aham-workbench');
const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
const DISPLAY_KEY = 'aham-ui:customer-list:display:v1';
const WIDTHS = { code: 120, industry: 96, owner: 80, stage: 96, lastContact: 88, created: 88, amountCents: 128 };
const FIRST_DIR = { name: 'asc', code: 'asc', industry: 'asc', owner: 'asc', stage: 'asc', lastContact: 'desc', created: 'desc', amountCents: 'desc' };
const ICONS = { name: 'file', code: 'bookmark', industry: 'folder', owner: 'user', stage: 'success', lastContact: 'clock', created: 'calendar' };

let data = makeCustomers();
const fromUrl = decodeState(location.search);
const state = { view: fromUrl.view, q: fromUrl.q, filters: fromUrl.filters, page: fromUrl.page };
let display = loadDisplay();
const selected = new Set(), collapsed = new Set();
let previewId = null, cur = null;

function loadDisplay() { try { return normalizeDisplay(JSON.parse(localStorage.getItem(DISPLAY_KEY))); } catch { return normalizeDisplay(null); } }
function saveDisplay() { try { localStorage.setItem(DISPLAY_KEY, JSON.stringify(display)); } catch { feedback('浏览器拒绝保存显示选项，本次调整只在当前页面有效。'); } }
function feedback(text) { $('#list-feedback').textContent = text; }
function narrowResult() { state.page = 1; selected.clear(); }

// ── Rendering ────────────────────────────────────────────────────────────────
function compute() {
  const base = applySearch(applyView(data, state.view), state.q);
  const rows = arrange(applyFilters(base, state.filters), display);
  const pg = paginate(rows, state.page, display.pageSize);
  state.page = pg.page;
  cur = { base, rows, pg };
}
// Re-rendering replaces controls; put focus back on the equivalent control so keyboard users keep their place.
const FOCUS_KEYS = ['id', 'select', 'selectPage', 'group', 'sort', 'page', 'view', 'pageSize'];
function focusToken(el) {
  if (el?.dataset?.cell) return `[data-cell="${el.dataset.cell}"][data-row="${el.dataset.row}"]`;
  const k = el?.dataset && root.contains(el) ? FOCUS_KEYS.find(key => key in el.dataset) : null;
  return k ? `[data-${k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}="${CSS.escape(el.dataset[k])}"]` : null;
}
function render(fallback) {
  const active = document.activeElement, token = focusToken(active);
  compute();
  $$('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === state.view)));
  $('#list-count').textContent = cur.rows.length === data.length ? `共 ${data.length} 条` : `${cur.rows.length} / ${data.length} 条`;
  $('#customer-list').dataset.listDensity = display.density;
  renderTable(); renderPager(); renderBulk(); renderPreview();
  listKeys?.refresh();
  markPreviewing();
  const qs = encodeState(state);
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  if (token && !active.isConnected) {
    const el = root.querySelector(token);
    (el && !el.disabled && el.offsetParent ? el : fallback && root.querySelector(fallback))?.focus({ preventScroll: true });
  }
}
function cell(f, r) {
  switch (f.key) {
    case 'stage': return `<td><button type="button" class="wb-cell-picker" data-cell="stage" data-row="${r.id}" aria-haspopup="dialog" aria-expanded="false" aria-label="阶段：${esc(r.stage)}，点击修改"><span class="wb-status"><b></b>${esc(r.stage)}</span></button></td>`;
    case 'owner': return `<td><button type="button" class="wb-cell-picker" data-cell="owner" data-row="${r.id}" aria-haspopup="dialog" aria-expanded="false" aria-label="负责人：${esc(r.owner)}，点击修改">${esc(r.owner)}</button></td>`;
    case 'amountCents': return `<td class="number">${money(r.amountCents)}</td>`;
    case 'code': return `<td class="wb-mono">${esc(r.code)}</td>`;
    case 'lastContact': case 'created': return `<td class="wb-mono" title="${r[f.key]}">${r[f.key].slice(5)}</td>`;
    default: return `<td>${esc(r[f.key])}</td>`;
  }
}
function header(f) {
  const on = display.sort.field === f.key;
  const sort = on ? ` aria-sort="${display.sort.dir === 'asc' ? 'ascending' : 'descending'}"` : '';
  return `<th scope="col"${f.type === 'number' ? ' class="number"' : ''}${sort}><button type="button" class="wb-sort" data-sort="${f.key}" title="按${esc(f.label)}排序">${esc(f.label)}${on ? icon(display.sort.dir === 'asc' ? 'chevron-up' : 'chevron-down') : ''}</button></th>`;
}
function renderTable() {
  const table = $('#customer-table'), empty = $('#list-empty'), { rows, pg } = cur;
  table.hidden = !rows.length;
  empty.hidden = Boolean(rows.length);
  if (!rows.length) { table.innerHTML = ''; empty.innerHTML = emptyHtml(); return; }
  const cols = display.columns.filter(c => c[1]).map(c => field(c[0]));
  const span = cols.length + 2;
  const rowHtml = r => `<tr data-id="${r.id}"${selected.has(r.id) ? ' data-selected' : ''}><td class="wb-check"><label class="wb-check-hit"><input type="checkbox" data-select="${r.id}"${selected.has(r.id) ? ' checked' : ''} aria-label="选择 ${esc(r.name)}"></label></td><td><button type="button" class="wb-row-link" data-open="${r.id}" title="打开 ${esc(r.name)}">${esc(r.name)}</button></td>${cols.map(f => cell(f, r)).join('')}</tr>`;
  let body = '';
  for (const g of groupRows(pg.rows, display.group)) {
    const shut = g.key !== null && collapsed.has(g.key);
    body += '<tbody>';
    if (g.key !== null) {
      const all = rows.filter(r => r[display.group] === g.key).length;
      body += `<tr class="wb-group-head"><th colspan="${span}" scope="rowgroup"><button type="button" class="wb-group-toggle" data-group="${esc(g.key)}" aria-expanded="${!shut}">${icon('chevron-down')}${esc(g.label)}<span class="wb-group-count">${g.rows.length === all ? all : `本页 ${g.rows.length} / 共 ${all}`}</span></button></th></tr>`;
    }
    if (!shut) body += g.rows.map(rowHtml).join('');
    body += '</tbody>';
  }
  table.innerHTML = `<colgroup><col style="width:var(--wb-check-col)"><col>${cols.map(f => `<col style="width:${WIDTHS[f.key]}px">`).join('')}</colgroup><thead><tr><th scope="col" class="wb-check"><label class="wb-check-hit"><input type="checkbox" data-select-page="" aria-label="选择本页 ${pg.rows.length} 条"></label></th>${header(field('name'))}${cols.map(header).join('')}</tr></thead>${body}`;
  const all = $('[data-select-page]'), ids = pg.rows.map(r => r.id), n = ids.filter(id => selected.has(id)).length;
  all.checked = n > 0 && n === ids.length;
  all.indeterminate = n > 0 && n < ids.length;
}
function emptyHtml() {
  if (!data.length) return '<strong>示例数据已全部删除</strong><p>刷新页面可以恢复。</p>';
  const why = [state.q && `搜索「${esc(state.q)}」`, state.filters.length && `${state.filters.length} 个筛选条件`, state.view !== 'all' && `「${VIEWS[state.view]}」视图`].filter(Boolean).join('、');
  const actions = [
    state.filters.length && '<button type="button" class="wb-btn sm" data-action="clear-filters">清除筛选</button>',
    state.q && '<button type="button" class="wb-btn sm" data-action="clear-search">清除搜索</button>',
    state.view !== 'all' && '<button type="button" class="wb-btn sm" data-action="view-all">查看全部</button>',
  ].filter(Boolean).join('');
  return `<strong>没有符合条件的记录</strong><p>当前条件：${why}。放宽条件后再看。</p><div>${actions}</div>`;
}
function renderPager() {
  const { rows, pg } = cur;
  $('#pager').innerHTML = `<span>${rows.length ? `第 ${pg.from}–${pg.to} 条，共 ${rows.length} 条` : '没有记录'}</span><div><label>每页 <select class="wb-select" data-page-size="" aria-label="每页条数">${PAGE_SIZES.map(n => `<option value="${n}"${n === display.pageSize ? ' selected' : ''}>${n}</option>`).join('')}</select></label><button type="button" class="wb-icon-btn" data-page="prev" aria-label="上一页"${pg.page <= 1 ? ' disabled' : ''}>${icon('chevron-left')}</button><span>第 ${pg.page} / ${pg.pages} 页</span><button type="button" class="wb-icon-btn" data-page="next" aria-label="下一页"${pg.page >= pg.pages ? ' disabled' : ''}>${icon('chevron-right')}</button></div>`;
}
function renderBulk() {
  const bulk = selected.size > 0;
  $$('[data-when="idle"]').forEach(e => { e.hidden = bulk; });
  $$('[data-when="bulk"]').forEach(e => { e.hidden = !bulk; });
  if (!bulk) return;
  $('#bulk-count').textContent = `已选 ${selected.size} 条`;
  const more = $('[data-action="select-matching"]');
  more.hidden = !(cur.pg.rows.every(r => selected.has(r.id)) && selected.size < cur.rows.length);
  more.textContent = `选择全部 ${cur.rows.length} 条`;
}
function renderPreview() {
  const panel = $('#customer-peek');
  const r = data.find(x => x.id === previewId) ?? cur.rows[0];
  if (!r) { panel.innerHTML = '<div class="wb-empty"><strong>没有可预览的记录</strong></div>'; return; }
  previewId = r.id;
  panel.innerHTML = `<section class="wb-peek"><h2>${esc(r.name)}</h2><span class="wb-status"><b></b>${esc(r.stage)}</span><dl><dt>编码</dt><dd class="wb-mono">${esc(r.code)}</dd><dt>行业</dt><dd>${esc(r.industry)}</dd><dt>负责人</dt><dd>${esc(r.owner)}</dd><dt>最近跟进</dt><dd class="wb-mono">${r.lastContact}</dd><dt>创建日期</dt><dd class="wb-mono">${r.created}</dd><dt>年度金额</dt><dd class="wb-mono">${money(r.amountCents)}</dd></dl></section>`;
}

// ── Design-system components ─────────────────────────────────────────────────
const filterFields = FIELDS.map(f => ({
  ...f, icon: ICONS[f.key],
  ...(f.type === 'number' ? { unit: '元', parse: v => Math.round(Number(v.replace(/,/g, '')) * 100), format: c => (c / 100).toLocaleString('zh-CN') } : {}),
}));
const filter = initFilter({
  root, trigger: $('#filter-trigger'), bar: $('#filter-bar'), fields: filterFields, value: state.filters,
  counts: (key, option, others) => applyFilters(cur.base, others).filter(r => r[key] === option).length,
  onChange: next => { state.filters = next; narrowResult(); render(); },
});
const displayCtl = initDisplay({
  root, trigger: $('#display-trigger'),
  groups: [['stage', '阶段'], ['owner', '负责人'], ['industry', '行业']],
  sorts: FIELDS.map(f => [f.key, f.label]),
  columns: FIELDS.filter(f => f.key !== 'name').map(f => ({ key: f.key, label: f.label })),
  value: display, defaults: normalizeDisplay(null),
  onChange: next => {
    if (next.group !== display.group) collapsed.clear();
    display = normalizeDisplay({ ...display, ...next });
    saveDisplay();
    render();
  },
});

// Bulk: assign uses the same command menu as filters (Circle's property pickers).
const assignPop = $('#assign-pop'), dialog = $('#delete-dialog');
function openAssign() {
  createCommand(assignPop.firstElementChild, {
    label: '分配给', placeholder: '分配给…',
    items: OWNERS.map(o => ({ id: o, label: o, icon: 'user' })),
    onSelect: it => {
      const n = selected.size;
      data = data.map(r => (selected.has(r.id) ? { ...r, owner: it.id } : r));
      closePopover('done');
      feedback(`已把 ${n} 条记录分配给${it.id}。示例只改当前页面的数据。`);
      render();
    },
  });
  openPopover($('#assign-trigger'), assignPop, { align: 'end' });
}
function confirmDelete(ids = [...selected]) {
  const n = ids.length, gone = new Set(ids);
  dialog.querySelector('#delete-title').textContent = `删除 ${n} 条记录？`;
  const release = pushLayer(() => dialog.close('cancel'));
  dialog.addEventListener('close', () => {
    release();
    if (dialog.returnValue !== 'confirm') return;
    data = data.filter(r => !gone.has(r.id));
    ids.forEach(id => selected.delete(id));
    toast(`已删除 ${n} 条记录`);
    feedback('示例只改当前页面的数据，刷新后恢复。');
    render();
    $('#filter-trigger').focus();
  }, { once: true });
  dialog.returnValue = '';
  dialog.showModal();
}

// ── Keyboard: ↑↓ current row, Space preview, Enter open, x select ────────────
const PEEK = 'customer-peek';
function markPreviewing() {
  const open = panels?.current() === PEEK;
  $$('#customer-table tr[data-id]').forEach(tr => tr.toggleAttribute('data-previewing', open && Number(tr.dataset.id) === previewId));
}
function preview(id) {
  if (panels.current() === PEEK && previewId === id) { panels.show(null); markPreviewing(); return; }
  previewId = id;
  renderPreview();
  panels.show(PEEK, { layer: true, returnTo: { focus: () => listKeys.focus(listKeys.current()) } });
  markPreviewing();
}
// Opening a record keeps the list order so the detail page can offer 上一条 / 下一条 and a way back.
function openRecord(id) {
  try { sessionStorage.setItem('aham-ui:record-nav', JSON.stringify({ ids: cur.rows.map(r => r.id), back: location.search })); } catch { /* detail page falls back to the full list */ }
  location.href = `record-detail.html?id=${id}`;
}
const listKeys = initListKeys({
  table: $('#customer-table'),
  onPreview: id => preview(Number(id)),
  onOpen: id => openRecord(Number(id)),
  onToggle: id => { const n = Number(id); selected.has(n) ? selected.delete(n) : selected.add(n); render(); },
  onMove: id => { if (panels.current() === PEEK) { previewId = Number(id); renderPreview(); markPreviewing(); } },
});

// ── Events ───────────────────────────────────────────────────────────────────
root.addEventListener('change', e => {
  const t = e.target;
  if ('select' in t.dataset) { const id = Number(t.dataset.select); t.checked ? selected.add(id) : selected.delete(id); render(); }
  else if ('selectPage' in t.dataset) {
    const ids = cur.pg.rows.map(r => r.id), all = ids.every(id => selected.has(id));
    ids.forEach(id => (all ? selected.delete(id) : selected.add(id)));
    render();
  } else if ('pageSize' in t.dataset) { display = normalizeDisplay({ ...display, pageSize: Number(t.value) }); saveDisplay(); state.page = 1; render(); }
});
root.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || b.closest('.wb-popover, .wb-filter-bar')) return;
  const d = b.dataset;
  if (d.view) { state.view = d.view; narrowResult(); render(); return; }
  if (d.sort) {
    const same = display.sort.field === d.sort;
    display = normalizeDisplay({ ...display, sort: { field: d.sort, dir: same ? (display.sort.dir === 'asc' ? 'desc' : 'asc') : FIRST_DIR[d.sort] } });
    displayCtl.set(display);
    saveDisplay();
    render();
    return;
  }
  if (d.group) { collapsed.has(d.group) ? collapsed.delete(d.group) : collapsed.add(d.group); render(); return; }
  if (d.page) { state.page += d.page === 'next' ? 1 : -1; render(d.page === 'next' ? '[data-page="prev"]' : '[data-page="next"]'); $('.wb-list-scroll').scrollTop = 0; return; }
  if (d.open) { openRecord(Number(d.open)); return; }
  if (b.id === 'assign-trigger') { openAssign(); return; }
  if (d.cell) { editCell(Number(d.row), d.cell, b); return; }
  if (b.id === 'create-trigger') { openCreate(); return; }
  switch (d.action) {
    case 'clear-filters': state.filters = []; filter.set([]); narrowResult(); render(); $('#filter-trigger').focus(); break;
    case 'clear-search': state.q = ''; search?.close(); narrowResult(); render(); break;
    case 'view-all': state.view = 'all'; narrowResult(); render(); break;
    case 'select-matching': cur.rows.forEach(r => selected.add(r.id)); render(); break;
    case 'clear-selection': selected.clear(); render(); $('#filter-trigger').focus(); break;
    case 'export': feedback(`已模拟导出 ${selected.size} 条记录，未生成文件。`); break;
    case 'delete': confirmDelete(); break;
    case 'placeholder': feedback('示例只演示列表页，其他入口只展示导航结构。'); break;
    case 'theme': {
      const dark = root.dataset.theme !== 'dark';
      root.dataset.theme = dark ? 'dark' : 'light';
      b.setAttribute('aria-pressed', String(dark));
      b.innerHTML = icon(dark ? 'sun' : 'moon');
      break;
    }
  }
});

// ── One action, four entrances: cell picker, context menu, ⌘K palette, shortcut ──
const EDITABLE = { stage: { label: '阶段', options: STAGES }, owner: { label: '负责人', options: OWNERS, icon: 'user' } };
const recordOf = id => data.find(r => r.id === id);
function setField(id, key, value, before) {
  data = data.map(r => (r.id === id ? { ...r, [key]: value } : r));
  render();
  toast(`已把${EDITABLE[key].label}改为「${value}」`, { action: { label: '撤销', run: () => { data = data.map(r => (r.id === id ? { ...r, [key]: before } : r)); render(); } } });
}
function cellButton(id, key) { return root.querySelector(`[data-cell="${key}"][data-row="${id}"]`); }
function editCell(id, key, anchor) {
  const r = recordOf(id), f = EDITABLE[key];
  if (!r) return;
  const target = anchor || cellButton(id, key) || root.querySelector(`#customer-table tr[data-id="${id}"]`);
  const row = root.querySelector(`#customer-table tr[data-id="${id}"]`);
  openPicker(target, { label: f.label, options: f.options, current: r[key], icon: f.icon, returnFocus: anchor ? null : row, onSelect: (v, before) => setField(id, key, v, before) });
}
const currentRow = () => { const tr = document.activeElement?.closest?.('#customer-table tr[data-id]'); return tr ? Number(tr.dataset.id) : null; };
function copy(text) { navigator.clipboard?.writeText(text).then(() => toast(`已复制 ${text}`), () => toast('浏览器不允许写入剪贴板')); }
function openCreate() {
  const currentRowBefore = currentRow();
  openCreateDialog({
    root, title: '新建记录', scope: '客户', returnFocus: { focus: () => (currentRowBefore ? listKeys.focus(currentRowBefore) : $('#create-trigger').focus()) },
    fields: [{ key: 'stage', label: '阶段', options: STAGES, value: '初次接触' }, { key: 'owner', label: '负责人', options: OWNERS, icon: 'user' }, { key: 'industry', label: '行业', options: INDUSTRIES }],
    onSubmit: v => {
      const id = Math.max(0, ...data.map(r => r.id)) + 1;
      data = [{ id, code: `CUS-2026-${String(id).padStart(4, '0')}`, name: v.title, industry: v.industry || INDUSTRIES[0], owner: v.owner || OWNERS[0], stage: v.stage || STAGES[0], amountCents: null, lastContact: TODAY, created: TODAY }, ...data];
      render();
      toast(`已创建「${v.title}」`, { action: { label: '打开', run: () => openRecord(id) } });
      return true;
    },
  });
}
initContextMenu({
  root, target: $('#customer-table'),
  items: row => {
    const id = Number(row.dataset.id), r = recordOf(id);
    const pick = key => EDITABLE[key].options.map(o => ({ id: o, label: o, icon: EDITABLE[key].icon, current: o === r[key], run: () => { if (o !== r[key]) setField(id, key, o, r[key]); } }));
    return [
      { id: 'stage', label: '阶段', icon: 'success', keys: 's', group: 0, children: () => pick('stage') },
      { id: 'owner', label: '负责人', icon: 'user', keys: 'a', group: 0, children: () => pick('owner') },
      { id: 'open', label: '打开', icon: 'external', keys: 'enter', group: 1, run: () => openRecord(id) },
      { id: 'peek', label: '预览', icon: 'eye', keys: 'space', group: 1, run: () => preview(id) },
      { id: 'select', label: selected.has(id) ? '取消勾选' : '勾选', icon: 'check', keys: 'x', group: 1, run: () => { selected.has(id) ? selected.delete(id) : selected.add(id); render(); } },
      { id: 'copy', label: '复制编码', icon: 'copy', group: 2, run: () => copy(r.code) },
      { id: 'delete', label: '删除', icon: 'trash', danger: true, group: 3, run: () => confirmDelete([id]) },
    ];
  },
});
const GROUP_ORDER = ['通用', '列表'];
const shortcutItems = () => listShortcuts().sort((x, y) => GROUP_ORDER.indexOf(x.group) - GROUP_ORDER.indexOf(y.group)).map((s, i) => ({ id: `k${i}`, label: s.label, keys: s.keys, group: s.group, heading: s.group, keywords: [s.group] }));
const palette = initPalette({
  root,
  context: () => { const id = currentRow() ?? (panels.current() === PEEK ? previewId : null); const r = id && recordOf(id); return r ? { id, code: r.code, label: r.name } : null; },
  groups: ctx => [
    ...(ctx ? [{ heading: '当前记录', items: [
      { id: 'stage', label: '修改阶段…', icon: 'success', keys: 's', children: c => STAGES.map(o => ({ id: o, label: o, current: o === recordOf(c.id).stage, run: () => { const r = recordOf(c.id); if (o !== r.stage) setField(c.id, 'stage', o, r.stage); } })) },
      { id: 'owner', label: '分配给…', icon: 'user', keys: 'a', children: c => OWNERS.map(o => ({ id: o, label: o, icon: 'user', current: o === recordOf(c.id).owner, run: () => { const r = recordOf(c.id); if (o !== r.owner) setField(c.id, 'owner', o, r.owner); } })) },
      { id: 'open', label: '打开详情', icon: 'external', run: c => openRecord(c.id) },
      { id: 'copy', label: '复制编码', icon: 'copy', run: c => copy(recordOf(c.id).code) },
    ] }] : []),
    { heading: '操作', items: [
      { id: 'create', label: '新建记录', icon: 'plus', keys: 'c', run: openCreate },
      { id: 'filter', label: '筛选…', icon: 'filter', run: () => filter.open() },
      { id: 'view', label: '切换视图…', icon: 'eye', children: () => Object.entries(VIEWS).map(([k, l]) => ({ id: k, label: l, current: k === state.view, run: () => { state.view = k; narrowResult(); render(); } })) },
      { id: 'clear', label: '清除筛选', icon: 'close', run: () => { state.filters = []; filter.set([]); narrowResult(); render(); } },
    ] },
    { heading: '跳转', items: [
      { id: 'go-quote', label: '销售报价单', icon: 'file', run: () => { location.href = 'crm-quotation.html'; } },
      { id: 'go-shell', label: '工作台外框', icon: 'home', run: () => { location.href = 'workbench-shell.html'; } },
    ] },
    { heading: '帮助', items: [{ id: 'keys', label: '键盘快捷键…', icon: 'help', keys: '?', children: shortcutItems }] },
  ],
});
const onRow = () => currentRow() !== null;
registerShortcut({ keys: 'c', label: '新建记录', group: '列表', run: openCreate });
registerShortcut({ keys: '/', label: '搜索', group: '列表', run: () => root.querySelector('[data-action="search"]')?.click() });
registerShortcut({ keys: 's', label: '修改当前行的阶段', group: '列表', when: onRow, run: () => editCell(currentRow(), 'stage') });
registerShortcut({ keys: 'a', label: '修改当前行的负责人', group: '列表', when: onRow, run: () => editCell(currentRow(), 'owner') });
registerShortcut({ keys: '?', label: '查看键盘快捷键', group: '通用', run: () => palette.openAt('键盘快捷键', shortcutItems()) });
// Keys handled directly by the list and the layer stack, listed here so the help shows them.
[['up', '上一行'], ['down', '下一行'], ['space', '预览当前行'], ['enter', '打开当前行'], ['x', '勾选当前行'], ['shift+f10', '当前行的操作菜单'], ['escape', '关闭最上层的浮层']].forEach(([keys, label]) => registerShortcut({ keys, label, group: keys === 'escape' ? '通用' : '列表', external: true }));

initShell(root);
const panels = initPanels(root);
const search = initSearch(root, { value: state.q, onInput: v => { state.q = v; narrowResult(); render(); } });
if (fromUrl.dropped) feedback(`网址里有 ${fromUrl.dropped} 个筛选条件无法识别，已忽略。`);
render();
