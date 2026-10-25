// ── Tree totals and record diff (rules/5-单据.md 5.13, pure) ───────────────────
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

