// Customer list model for the workbench list example. Pure functions, no DOM.
// Filter operators, matching and URL encoding come from the design system (workbench.js); this file only holds demo data.
import { matchesFilter, filterComplete, filtersToParam, paramToFilters } from '../workbench.js';
// All customers, people and amounts are fictional and generated from the fixed lists below.
export const TODAY = '2026-09-30';
export const ME = '林悦';

const PLACES = ['远川', '临江', '北岸', '青禾', '东麓', '南桥', '西塘', '云岭', '白石', '松原', '长汀', '海宁', '清河', '石湾', '安澜', '金溪'];
const TRADES = [
  ['精密制造', '装备制造'], ['包装材料', '包装'], ['汽车零部件', '汽车零部件'], ['食品科技', '食品'],
  ['电子元件', '电子'], ['医疗器械', '医疗器械'], ['纺织', '纺织'], ['新材料', '新材料'],
];
export const OWNERS = ['林悦', '周航', '许宁', '陈默'];
export const STAGES = ['初次接触', '需求调研', '方案评估', '商务谈判', '已签约', '已流失'];
export const INDUSTRIES = [...new Set(TRADES.map(t => t[1]))];

function lcg(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2 ** 32; };
}
const pad = (n, w = 2) => String(n).padStart(w, '0');
const dayOf = offset => {
  const d = new Date(`${TODAY}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - offset);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

export function makeCustomers(count = 128, seed = 20260930) {
  const rnd = lcg(seed), rows = [];
  for (let i = 0; i < count; i++) {
    const place = PLACES[i % PLACES.length];
    const [trade, industry] = TRADES[Math.floor(i / PLACES.length) % TRADES.length];
    const stage = STAGES[Math.floor(rnd() * STAGES.length)];
    const early = stage === '初次接触' || stage === '已流失';
    const created = Math.floor(rnd() * 120);
    rows.push({
      id: i + 1,
      code: `CUS-2026-${pad(i + 1, 4)}`,
      name: `${place}${trade}有限公司`,
      industry,
      owner: OWNERS[Math.floor(rnd() * OWNERS.length)],
      stage,
      amountCents: early ? null : Math.round(80 + rnd() * 1520) * 1000 * 100,
      lastContact: dayOf(Math.min(created, Math.floor(rnd() * 30))),
      created: dayOf(created),
    });
  }
  return rows;
}

export const FIELDS = [
  { key: 'name', label: '客户名称', type: 'text', required: true },
  { key: 'code', label: '客户编码', type: 'text' },
  { key: 'industry', label: '行业', type: 'option', options: INDUSTRIES },
  { key: 'owner', label: '负责人', type: 'option', options: OWNERS },
  { key: 'stage', label: '阶段', type: 'option', options: STAGES },
  { key: 'lastContact', label: '最近跟进', type: 'date' },
  { key: 'created', label: '创建日期', type: 'date' },
  { key: 'amountCents', label: '年度金额', type: 'number' },
];
export const field = key => FIELDS.find(f => f.key === key);

export const applyFilters = (rows, filters) => filters.filter(f => filterComplete(f, field(f.field).type)).reduce((acc, f) => acc.filter(r => matchesFilter(r[f.field], f)), rows);

export const VIEWS = { all: '全部客户', mine: '我负责的', week: '本周新增' };
export function weekStart(today = TODAY) {
  const d = new Date(`${today}T00:00:00Z`), back = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - back);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
export function applyView(rows, view) {
  if (view === 'mine') return rows.filter(r => r.owner === ME);
  if (view === 'week') { const start = weekStart(); return rows.filter(r => r.created >= start); }
  return rows;
}
export const applySearch = (rows, q) => {
  const t = q.trim().toLowerCase();
  return t ? rows.filter(r => r.name.toLowerCase().includes(t) || r.code.toLowerCase().includes(t)) : rows;
};

const ORDER = { stage: STAGES, owner: OWNERS, industry: INDUSTRIES };
const zh = new Intl.Collator('zh-CN', { numeric: true });   // names sort by pinyin, not by code point
export function sortRows(rows, { field: key, dir }) {
  const sign = dir === 'desc' ? -1 : 1, rank = ORDER[key], text = field(key)?.type === 'text';
  return rows.map((r, i) => [r, i]).sort(([a, i], [b, j]) => {
    const x = rank ? rank.indexOf(a[key]) : a[key], y = rank ? rank.indexOf(b[key]) : b[key];
    if (x === y) return i - j;
    if (x === null) return 1;          // empty values always last, whatever the direction
    if (y === null) return -1;
    const c = text ? zh.compare(x, y) : (x < y ? -1 : 1);
    return (c || i - j) * (c ? sign : 1);
  }).map(([r]) => r);
}
// With grouping on, rows are ordered by group first and by the chosen sort inside each group, then paginated,
// so a group stays contiguous across pages instead of being scattered by the sort.
export function arrange(rows, { group, sort }) {
  const sorted = sortRows(rows, sort);
  return group ? sortRows(sorted, { field: group, dir: 'asc' }) : sorted;
}
// Groups keep the option order; groups with no rows are left out.
export function groupRows(rows, key) {
  if (!key) return [{ key: null, label: null, rows }];
  const order = ORDER[key] ?? [...new Set(rows.map(r => r[key]))];
  return order.map(k => ({ key: k, label: k, rows: rows.filter(r => r[key] === k) })).filter(g => g.rows.length);
}
export const PAGE_SIZES = [20, 50, 100];
export function paginate(rows, page, size) {
  const pages = Math.max(1, Math.ceil(rows.length / size)), p = Math.min(Math.max(1, page), pages);
  return { page: p, pages, from: rows.length ? (p - 1) * size + 1 : 0, to: Math.min(p * size, rows.length), rows: rows.slice((p - 1) * size, p * size) };
}

// URL state: view, search, filters, page. Anything malformed or unknown is dropped, never trusted.
export function encodeState({ view, q, filters, page }) {
  const u = new URLSearchParams();
  if (view && view !== 'all') u.set('view', view);
  if (q) u.set('q', q);
  if (filters.length) u.set('f', filtersToParam(filters));
  if (page > 1) u.set('page', String(page));
  return u.toString();
}
export function decodeState(search) {
  const u = new URLSearchParams(search), state = { view: 'all', q: '', filters: [], page: 1, dropped: 0 };
  if (VIEWS[u.get('view')]) state.view = u.get('view');
  state.q = (u.get('q') ?? '').slice(0, 100);
  const page = Number(u.get('page'));
  if (Number.isInteger(page) && page > 0) state.page = page;
  const parsed = paramToFilters(u.get('f'), FIELDS);
  state.filters = parsed.filters;
  state.dropped = parsed.dropped;
  return state;
}

// Display options are per viewer and stored locally; the URL does not carry them.
export const COLUMN_KEYS = ['code', 'industry', 'owner', 'stage', 'lastContact', 'created', 'amountCents'];
export const DEFAULT_DISPLAY = Object.freeze({
  group: 'stage',
  sort: { field: 'lastContact', dir: 'desc' },
  density: 'standard',
  pageSize: 50,
  columns: [['code', false], ['industry', true], ['owner', true], ['stage', true], ['lastContact', true], ['created', false], ['amountCents', true]],
});
export function normalizeDisplay(raw) {
  const d = structuredClone(DEFAULT_DISPLAY);
  if (!raw || typeof raw !== 'object') return d;
  if (raw.group === null || ['stage', 'owner', 'industry'].includes(raw.group)) d.group = raw.group;
  if (raw.sort && field(raw.sort.field) && ['asc', 'desc'].includes(raw.sort.dir)) d.sort = { field: raw.sort.field, dir: raw.sort.dir };
  if (['standard', 'compact'].includes(raw.density)) d.density = raw.density;
  if (PAGE_SIZES.includes(raw.pageSize)) d.pageSize = raw.pageSize;
  if (Array.isArray(raw.columns)) {
    const seen = new Set(), cols = [];
    for (const c of raw.columns) if (Array.isArray(c) && COLUMN_KEYS.includes(c[0]) && !seen.has(c[0])) { seen.add(c[0]); cols.push([c[0], Boolean(c[1])]); }
    for (const [k, v] of DEFAULT_DISPLAY.columns) if (!seen.has(k)) cols.push([k, v]);   // columns added later appear with their default
    d.columns = cols;
  }
  return d;
}
export const displayChanged = d => JSON.stringify(normalizeDisplay(d)) !== JSON.stringify(normalizeDisplay(null));

export function money(cents) {
  if (cents === null) return '—';
  const s = String(cents).padStart(3, '0');
  return `${s.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${s.slice(-2)}`;
}
