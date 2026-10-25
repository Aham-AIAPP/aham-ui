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

