// List page sample: wires the Aham UI components (aham.js) to fictional demo data.
// Everything reusable lives in aham.js / aham.css; this file only renders rows and keeps demo state.
import {initShell, initPanels, navCommands, stageIconHTML, personHTML, initSearch, initFilter, initDisplay, initListKeys, initPalette, initContextMenu, openCreateDialog, openConfirm, openFormDialog, showBatchResult, toCSV, downloadText, openPicker, registerShortcut, listShortcuts, toast, icon, escapeHtml as esc} from '../aham.js';
import {makeCustomers, FIELDS, field, OWNERS, STAGES, INDUSTRIES, TODAY, VIEWS, PAGE_SIZES, applyFilters, applyView, applySearch, arrange, groupRows, paginate, encodeState, decodeState, normalizeDisplay, money} from './list-model.mjs';

const root = document.querySelector('.aham-workbench');
const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
const DISPLAY_KEY = 'aham-ui:customer-list:display:v1';
// Single-line rows (rules/4-页面.md 4.3): code, stage icon and name on the left; tag, amount, dates and the owner's avatar on the right.
const WIDTHS = { code: 112, stage: 28, industry: 112, amountCents: 120, lastContact: 64, created: 64, owner: 40 };
const ROW_ORDER = ['code', 'stage', 'name', 'industry', 'amountCents', 'lastContact', 'created', 'owner'];
const LIVE_STAGES = STAGES.filter(s => s !== '已流失');
const stageIcon = stage => stage === '已流失' ? stageIconHTML({ state: 'off', label: stage }) : stage === '已签约' ? stageIconHTML({ state: 'done', label: stage })
  : stageIconHTML({ state: 'current', done: LIVE_STAGES.indexOf(stage), total: LIVE_STAGES.length - 1, label: stage });
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

// ── Views (rules/4-页面.md 4.5): a view keeps filters, sort, group and columns. Standard views cannot change;
// a changed view gets「*」and 另存视图. Saved views live in this page only.
const customViews = [];
const viewOf = id => customViews.find(v => v.id === id);
const setting = () => ({ filters: state.filters, sort: display.sort, group: display.group, columns: display.columns });
function savedSetting(id) {
  const v = viewOf(id);
  if (v) return v.setting;
  const d = normalizeDisplay(null);
  return { filters: [], sort: d.sort, group: d.group, columns: d.columns };
}
const viewChanged = () => JSON.stringify(setting()) !== JSON.stringify(savedSetting(state.view));
function renderViews() {
  const all = [...Object.entries(VIEWS), ...customViews.map(v => [v.id, v.label])], changed = viewChanged();
  $('#views').innerHTML = all.map(([id, label]) => `<button type="button" aria-pressed="${id === state.view}" data-view="${esc(id)}">${esc(label)}${id === state.view && changed ? '<span aria-hidden="true"> *</span><span class="wb-sr-only">（有未保存的修改）</span>' : ''}</button>`).join('');
  $('#view-save').hidden = !changed;
}
function applyViewSetting(id) {
  const v = savedSetting(id);
  state.view = id;
  state.filters = structuredClone(v.filters);
  filter.set(state.filters);
  display = normalizeDisplay({ ...display, sort: v.sort, group: v.group, columns: v.columns });
  displayCtl.set(display);
  saveDisplay();
  collapsed.clear();
  narrowResult();
  render();
}
function saveView() {
  openFormDialog({
    root, title: '另存视图', submit: '保存', returnFocus: $('#view-save'),
    text: '保存当前的筛选、排序、分组和显示的列。行高和每页条数不随视图保存。',
    fields: [
      { key: 'label', label: '视图名称', required: true, hint: '最多 20 个字' },
      { key: 'scope', label: '可见范围', type: 'select', options: ['只有自己', '工作区所有人'] },
      { key: 'isDefault', label: '设为默认视图', type: 'select', options: ['否', '是'] },
    ],
    onSubmit: v => {
      if (v.label.length > 20) return { label: '最多 20 个字' };
      if ([...Object.values(VIEWS), ...customViews.map(x => x.label)].includes(v.label)) return { label: '已有同名视图' };
      const id = `v${customViews.length + 1}`;
      customViews.push({ id, label: v.label, scope: v.scope, setting: structuredClone(setting()) });
      state.view = id;
      render();
      toast(`已保存视图「${v.label}」${v.isDefault === '是' ? '，下次进入列表时打开它' : ''}`);
      return true;
    },
  });
}

// ── Rendering ────────────────────────────────────────────────────────────────
function compute() {
  const base = applySearch(applyView(data, VIEWS[state.view] ? state.view : 'all'), state.q);
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
  renderViews();
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
    case 'name': return `<td class="wb-cell-name"><button type="button" class="wb-row-link" data-open="${r.id}" title="打开 ${esc(r.name)}">${esc(r.name)}</button></td>`;
    case 'stage': return `<td class="wb-cell-icon"><button type="button" class="wb-cell-picker is-icon" data-cell="stage" data-row="${r.id}" aria-haspopup="dialog" aria-expanded="false" aria-label="阶段：${esc(r.stage)}，点击修改">${stageIcon(r.stage)}</button></td>`;
    case 'owner': return `<td class="wb-cell-end"><button type="button" class="wb-cell-picker is-icon" data-cell="owner" data-row="${r.id}" aria-haspopup="dialog" aria-expanded="false" aria-label="负责人：${esc(r.owner)}，点击修改">${personHTML(r.owner, { compact: true })}</button></td>`;
    case 'industry': return `<td class="wb-cell-end"><span class="wb-tag" data-cat="${INDUSTRIES.indexOf(r.industry) % 6 + 1}">${esc(r.industry)}</span></td>`;
    case 'amountCents': return `<td class="number wb-cell-meta">${money(r.amountCents)}</td>`;
    case 'code': return `<td class="wb-cell-meta wb-tnum">${esc(r.code)}</td>`;
    case 'lastContact': case 'created': return `<td class="number wb-cell-meta" title="${f.label} ${r[f.key]}">${r[f.key].slice(5)}</td>`;
    default: return `<td>${esc(r[f.key])}</td>`;
  }
}
// The header row stays for screen readers only; sorting lives in 显示 (rules/4-页面.md 4.3, 4.6).
function header(f) {
  const on = display.sort.field === f.key;
  const sort = on ? ` aria-sort="${display.sort.dir === 'asc' ? 'ascending' : 'descending'}"` : '';
  return `<th scope="col"${sort}>${esc(f.label)}</th>`;
}
function renderTable() {
  const table = $('#customer-table'), empty = $('#list-empty'), { rows, pg } = cur;
  table.hidden = !rows.length;
  empty.hidden = Boolean(rows.length);
  if (!rows.length) { table.innerHTML = ''; empty.innerHTML = emptyHtml(); return; }
  const shown = new Set(['name', ...display.columns.filter(c => c[1]).map(c => c[0])]);
  const cols = ROW_ORDER.filter(k => shown.has(k)).map(field);
  const span = cols.length + 1;
  const rowHtml = r => `<tr data-id="${r.id}"${selected.has(r.id) ? ' data-selected' : ''}><td class="wb-check"><label class="wb-check-hit"><input type="checkbox" data-select="${r.id}"${selected.has(r.id) ? ' checked' : ''} aria-label="选择 ${esc(r.name)}"></label></td>${cols.map(f => cell(f, r)).join('')}</tr>`;
  let body = '';
  for (const g of groupRows(pg.rows, display.group)) {
    const shut = g.key !== null && collapsed.has(g.key);
    body += '<tbody>';
    if (g.key !== null) {
      const all = rows.filter(r => r[display.group] === g.key).length;
      const mark = display.group === 'stage' ? stageIcon(g.key) : '';
      body += `<tr class="wb-group-head"><th colspan="${span}" scope="rowgroup"><button type="button" class="wb-group-toggle" data-group="${esc(g.key)}" aria-expanded="${!shut}">${icon('chevron-down')}${mark}${esc(g.label)}<span class="wb-group-count">${g.rows.length === all ? all : `本页 ${g.rows.length} / 共 ${all}`}</span></button></th></tr>`;
    }
    if (!shut) body += g.rows.map(rowHtml).join('');
    body += '</tbody>';
  }
  table.innerHTML = `<colgroup><col style="width:var(--wb-check-col)">${cols.map(f => f.key === 'name' ? '<col>' : `<col style="width:${WIDTHS[f.key]}px">`).join('')}</colgroup><thead><tr><th scope="col" class="wb-check"><span class="wb-sr-only">选择</span></th>${cols.map(header).join('')}</tr></thead>${body}`;
  const all = $('[data-select-page]'), ids = pg.rows.map(r => r.id), n = ids.filter(id => selected.has(id)).length;
  all.checked = n > 0 && n === ids.length;
  all.indeterminate = n > 0 && n < ids.length;
  all.setAttribute('aria-label', `选择本页 ${ids.length} 条`);
}
function emptyHtml() {
  if (!data.length) return '<strong>示例数据已全部删除</strong><p>刷新页面可以恢复。</p>';
  const why = [state.q && `搜索「${esc(state.q)}」`, state.filters.length && `${state.filters.length} 个筛选条件`, state.view !== 'all' && `「${VIEWS[state.view] || viewOf(state.view)?.label}」视图`].filter(Boolean).join('、');
  const actions = [
    state.filters.length && '<button type="button" class="wb-btn sm" data-action="clear-filters">清除筛选</button>',
    state.q && '<button type="button" class="wb-btn sm" data-action="clear-search">清除搜索</button>',
    state.view !== 'all' && '<button type="button" class="wb-btn sm" data-action="view-all">查看全部</button>',
  ].filter(Boolean).join('');
  return `<strong>没有符合条件的记录</strong><p>当前条件：${why}。放宽条件后再看。</p><div>${actions}</div>`;
}
function renderPager() {
  const { rows, pg } = cur;
  $('#pager').innerHTML = `<span>${rows.length ? `第 ${pg.from}–${pg.to} 条，共 ${rows.length} 条` : '没有记录'}</span><div><label>每页 <select class="wb-field sm" data-page-size="" aria-label="每页条数">${PAGE_SIZES.map(n => `<option value="${n}"${n === display.pageSize ? ' selected' : ''}>${n}</option>`).join('')}</select></label><button type="button" class="wb-icon-btn" data-page="prev" aria-label="上一页"${pg.page <= 1 ? ' disabled' : ''}>${icon('chevron-left')}</button><span>第 ${pg.page} / ${pg.pages} 页</span><button type="button" class="wb-icon-btn" data-page="next" aria-label="下一页"${pg.page >= pg.pages ? ' disabled' : ''}>${icon('chevron-right')}</button></div>`;
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
  panel.innerHTML = `<section class="wb-peek"><h2>${esc(r.name)}</h2><span class="wb-status"><b></b>${esc(r.stage)}</span><dl><dt>编码</dt><dd class="wb-tnum">${esc(r.code)}</dd><dt>行业</dt><dd>${esc(r.industry)}</dd><dt>负责人</dt><dd>${esc(r.owner)}</dd><dt>最近跟进</dt><dd class="wb-tnum">${r.lastContact}</dd><dt>创建日期</dt><dd class="wb-tnum">${r.created}</dd><dt>年度金额</dt><dd class="wb-tnum">${money(r.amountCents)}</dd></dl></section>`;
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

// ── Bulk actions: mass edit, export, delete ───────────────────────────────────
// Mass edit (rules/4-页面.md 4.3): each field starts at 保留原值, or at the shared value when all selected rows agree.
const KEEP = '__keep__', BLANK = '__blank__';
function massEdit() {
  const rows = data.filter(r => selected.has(r.id));
  const opts = (key, options, required) => {
    const same = new Set(rows.map(r => r[key])).size === 1 ? rows[0][key] : null;
    return { value: same ?? KEEP, options: [{ value: KEEP, label: '保留原值' }, ...(required ? [] : [{ value: BLANK, label: '留空' }]), ...options.map(o => ({ value: o, label: o }))] };
  };
  const fields = [
    { key: 'stage', label: '阶段', type: 'select', ...opts('stage', STAGES, true) },
    { key: 'owner', label: '负责人', type: 'select', ...opts('owner', OWNERS, true) },
    { key: 'industry', label: '行业', type: 'select', ...opts('industry', INDUSTRIES, false) },
  ];
  openFormDialog({
    root, title: `批量编辑 ${rows.length} 个客户`, submit: '保存', returnFocus: $('[data-action="mass-edit"]'),
    text: '只改这里选了新值的字段。阶段和负责人是必填，没有「留空」。',
    fields,
    onSubmit: v => {
      const patch = Object.fromEntries(Object.entries(v).filter(([, x]) => x !== KEEP).map(([k, x]) => [k, x === BLANK ? '' : x]));
      if (!Object.keys(patch).length) return '没有选新的值。不改的话点「取消」。';
      data = data.map(r => (selected.has(r.id) ? { ...r, ...patch } : r));
      showBatchResult({ root, action: '修改', noun: '客户', total: rows.length });
      render();
      return true;
    },
  });
}
// Export (rules/4-页面.md 4.10): the columns, order and headings on screen; all filtered rows, or the selection.
function exportRows(rows) {
  const cols = [field('name'), ...display.columns.filter(c => c[1]).map(c => field(c[0]))]
    .map(f => ({ key: f.key, label: f.label, value: f.key === 'amountCents' ? r => (r.amountCents === null ? '' : (r.amountCents / 100).toFixed(2)) : null }));
  const ordered = groupRows(rows, display.group).flatMap(g => g.rows);   // same order as on screen, groups included
  downloadText(`客户-${TODAY}.csv`, toCSV(ordered, cols));
  toast(`已导出 ${rows.length} 条，文件 客户-${TODAY}.csv`);
}
// Delete: 已签约 customers fail on the server in this demonstration, so the result dialog can be seen.
function confirmDelete(ids = [...selected], returnFocus) {
  const n = ids.length, one = n === 1 ? recordOf(ids[0]) : null;
  openConfirm({
    root, returnFocus, danger: true, confirm: '删除',
    title: one ? `删除客户 ${one.name}？` : `删除选中的 ${n} 个客户？`,
    text: '删除后不能恢复。客户的联系人和跟进记录一起删除。',
    onConfirm: () => {
      const failed = ids.map(recordOf).filter(r => r.stage === '已签约').map(r => ({ id: r.id, name: r.name, reason: '有已签约的合同，先在合同里处理' }));
      const gone = new Set(ids.filter(id => !failed.some(f => f.id === id)));
      data = data.filter(r => !gone.has(r.id));
      gone.forEach(id => selected.delete(id));
      render();
      showBatchResult({ root, action: '删除', noun: '客户', total: n, failed, returnFocus: $('#filter-trigger') });
    },
  });
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
  location.href = `record.html?id=${id}`;
}
const listKeys = initListKeys({
  table: $('#customer-table'),
  onPreview: id => preview(Number(id)),
  onOpen: id => openRecord(Number(id)),
  onToggle: id => { const n = Number(id); selected.has(n) ? selected.delete(n) : selected.add(n); render(); },
  onRange: (ids, on) => { ids.forEach(id => (on ? selected.add(Number(id)) : selected.delete(Number(id)))); render(); },
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
  if (d.view) { if (d.view !== state.view || viewChanged()) applyViewSetting(d.view); return; }
  if (b.id === 'view-save') { saveView(); return; }
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
  if (d.cell) { editCell(Number(d.row), d.cell, b); return; }
  if (b.id === 'create-trigger') { openCreate(); return; }
  switch (d.action) {
    case 'clear-filters': state.filters = []; filter.set([]); narrowResult(); render(); $('#filter-trigger').focus(); break;
    case 'clear-search': state.q = ''; search?.close(); narrowResult(); render(); break;
    case 'view-all': applyViewSetting('all'); break;
    case 'select-matching': cur.rows.forEach(r => selected.add(r.id)); render(); break;
    case 'clear-selection': selected.clear(); render(); $('#filter-trigger').focus(); break;
    case 'export': exportRows(cur.rows.filter(r => selected.has(r.id))); break;
    case 'export-all': exportRows(cur.rows); break;
    case 'mass-edit': massEdit(); break;
    case 'delete': confirmDelete([...selected], b); break;
    case 'placeholder': feedback('示例只演示列表页，其他入口只展示导航结构。'); break;
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
      { id: 'delete', label: '删除', icon: 'trash', danger: true, run: c => confirmDelete([c.id]) },
    ] }] : []),
    ...(selected.size ? [{ heading: `勾选的 ${selected.size} 条`, items: [
      { id: 'mass-edit', label: '批量编辑…', icon: 'edit', run: () => $('[data-action="mass-edit"]').click() },
      { id: 'export-selected', label: '导出勾选的记录', icon: 'download', run: () => exportRows(cur.rows.filter(r => selected.has(r.id))) },
      { id: 'delete-selected', label: '删除勾选的记录', icon: 'trash', danger: true, run: () => confirmDelete([...selected]) },
    ] }] : []),
    { heading: '操作', items: [
      { id: 'create', label: '新建记录', icon: 'plus', keys: 'c', run: openCreate },
      { id: 'export-all', label: '导出当前结果', icon: 'download', run: () => exportRows(cur.rows) },
      { id: 'filter', label: '筛选…', icon: 'filter', run: () => filter.open() },
      { id: 'view', label: '切换视图…', icon: 'eye', children: () => [...Object.entries(VIEWS), ...customViews.map(v => [v.id, v.label])].map(([k, l]) => ({ id: k, label: l, current: k === state.view, run: () => applyViewSetting(k) })) },
      { id: 'clear', label: '清除筛选', icon: 'close', run: () => { state.filters = []; filter.set([]); narrowResult(); render(); } },
      { id: 'display', label: '显示选项…', icon: 'settings', run: () => $('#display-trigger').click() },
      { id: 'peek', label: panels.current() === PEEK ? '关闭预览面板' : '打开预览面板', icon: 'eye', run: () => $('[data-panel-toggle="customer-peek"]').click() },
    ] },
    { heading: '界面', items: [
      { id: 'nav', label: '展开或收起侧栏', icon: 'menu', keys: 'mod+b', run: () => $('[data-action="nav"]').click() },
      { id: 'theme', label: root.dataset.theme === 'dark' ? '切换到浅色' : '切换到深色', icon: root.dataset.theme === 'dark' ? 'sun' : 'moon', run: () => $('[data-action="theme"]').click() },
    ] },
    { heading: '跳转', items: navCommands(root) },
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
[['up', '上一行'], ['down', '下一行'], ['shift+down', '扩展勾选范围'], ['space', '预览当前行'], ['enter', '打开当前行'], ['x', '勾选当前行'], ['shift+f10', '当前行的操作菜单'], ['escape', '关闭最上层的浮层']].forEach(([keys, label]) => registerShortcut({ keys, label, group: keys === 'escape' ? '通用' : '列表', external: true }));

initShell(root);
const panels = initPanels(root);
const search = initSearch(root, { value: state.q, onInput: v => { state.q = v; narrowResult(); render(); } });
if (fromUrl.dropped) feedback(`网址里有 ${fromUrl.dropped} 个筛选条件无法识别，已忽略。`);
render();
