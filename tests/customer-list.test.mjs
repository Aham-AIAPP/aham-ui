import {test} from 'node:test';
import assert from 'node:assert/strict';
import {arrange,makeCustomers,applyFilters,applyView,applySearch,sortRows,groupRows,paginate,encodeState,decodeState,normalizeDisplay,displayChanged,DEFAULT_DISPLAY,STAGES,ME,weekStart,money} from '../design-system/examples/customer-list-model.mjs';

const rows = makeCustomers();

test('fixture is deterministic, 128 rows, unique codes and names', () => {
  assert.equal(rows.length, 128);
  assert.deepEqual(makeCustomers(), rows);
  assert.equal(new Set(rows.map(r => r.code)).size, 128);
  assert.equal(new Set(rows.map(r => r.name)).size, 128);
  assert.ok(rows.every(r => STAGES.includes(r.stage)));
  assert.ok(rows.every(r => r.lastContact >= r.created), 'follow-up never precedes creation');
});

test('filters by type narrow correctly; incomplete filters do not narrow', () => {
  const signed = applyFilters(rows, [{ field: 'stage', op: 'is', values: ['已签约'] }]);
  assert.ok(signed.length > 0 && signed.every(r => r.stage === '已签约'));
  const notSigned = applyFilters(rows, [{ field: 'stage', op: 'isNot', values: ['已签约'] }]);
  assert.equal(signed.length + notSigned.length, rows.length);
  const two = applyFilters(rows, [{ field: 'owner', op: 'anyOf', values: ['林悦', '周航'] }]);
  assert.ok(two.every(r => ['林悦', '周航'].includes(r.owner)));
  const big = applyFilters(rows, [{ field: 'amountCents', op: 'gte', values: [100000000] }]);
  assert.ok(big.every(r => r.amountCents !== null && r.amountCents >= 100000000));
  const range = applyFilters(rows, [{ field: 'lastContact', op: 'between', values: ['2026-09-20', '2026-09-30'] }]);
  assert.ok(range.every(r => r.lastContact >= '2026-09-20' && r.lastContact <= '2026-09-30'));
  const text = applyFilters(rows, [{ field: 'name', op: 'contains', values: ['远川'] }]);
  assert.ok(text.length > 0 && text.every(r => r.name.includes('远川')));
  assert.equal(applyFilters(rows, [{ field: 'stage', op: 'is', values: [] }]).length, rows.length);
});

test('views and search', () => {
  assert.ok(applyView(rows, 'mine').every(r => r.owner === ME));
  assert.equal(weekStart('2026-09-30'), '2026-09-28');
  assert.ok(applyView(rows, 'week').every(r => r.created >= '2026-09-28'));
  assert.ok(applySearch(rows, 'cus-2026-0001').length === 1);
});

test('sorting is stable, empty amounts last in both directions, names by pinyin', () => {
  for (const dir of ['asc', 'desc']) {
    const s = sortRows(rows, { field: 'amountCents', dir });
    const firstNull = s.findIndex(r => r.amountCents === null);
    assert.ok(s.slice(firstNull).every(r => r.amountCents === null));
  }
  const byName = sortRows(rows, { field: 'name', dir: 'asc' }).map(r => r.name);
  assert.equal(byName[0].slice(0, 2), '安澜');
  const byStage = sortRows(rows, { field: 'stage', dir: 'asc' });
  assert.ok(byStage.every((r, i, a) => i === 0 || STAGES.indexOf(a[i - 1].stage) <= STAGES.indexOf(r.stage)));
});

test('grouping keeps option order and omits empty groups; pagination clamps', () => {
  const groups = groupRows(applyFilters(rows, [{ field: 'stage', op: 'anyOf', values: ['已签约', '初次接触'] }]), 'stage');
  assert.deepEqual(groups.map(g => g.key), ['初次接触', '已签约']);
  assert.deepEqual(groupRows(rows, null)[0].rows, rows);
  const p = paginate(rows, 99, 50);
  assert.deepEqual([p.page, p.pages, p.from, p.to, p.rows.length], [3, 3, 101, 128, 28]);
  assert.deepEqual([paginate([], 1, 20).from, paginate([], 1, 20).to], [0, 0]);
});

test('URL state round-trips and drops anything malformed or unknown', () => {
  const state = { view: 'mine', q: '远川', filters: [{ field: 'stage', op: 'anyOf', values: ['方案评估', '商务谈判'] }], page: 2 };
  const back = decodeState(encodeState(state));
  assert.deepEqual({ view: back.view, q: back.q, filters: back.filters, page: back.page }, state);
  assert.equal(decodeState('f=not-json').dropped, 1);
  const bad = decodeState('f=' + encodeURIComponent(JSON.stringify([['stage', 'is', ['不存在']], ['secret', 'is', ['x']], ['amountCents', 'gte', [-5]], ['owner', 'is', ['许宁']]])));
  assert.equal(bad.dropped, 3);
  assert.deepEqual(bad.filters, [{ field: 'owner', op: 'is', values: ['许宁'] }]);
  assert.equal(decodeState('view=admin&page=-1').view, 'all');
  assert.equal(decodeState('page=0').page, 1);
});

test('display options normalize stored data and report changes', () => {
  assert.equal(displayChanged(null), false);
  assert.equal(displayChanged({ ...DEFAULT_DISPLAY, density: 'compact' }), true);
  const odd = normalizeDisplay({ group: 'hack', density: 'tiny', columns: [['stage', false], ['stage', true], ['bogus', true]] });
  assert.equal(odd.group, 'stage');
  assert.equal(odd.density, 'standard');
  assert.deepEqual(odd.columns[0], ['stage', false]);
  assert.equal(odd.columns.length, DEFAULT_DISPLAY.columns.length);
  assert.equal(normalizeDisplay({ group: null }).group, null);
  assert.equal(normalizeDisplay({ pageSize: 7 }).pageSize, 50);
  assert.equal(normalizeDisplay({ pageSize: 100 }).pageSize, 100);
});

test('money formats cents without floating point', () => {
  assert.equal(money(78080000), '780,800.00');
  assert.equal(money(5), '0.05');
  assert.equal(money(null), '—');
});

test('grouped rows stay contiguous and keep the sort inside each group', () => {
  const out = arrange(rows, { group: 'stage', sort: { field: 'lastContact', dir: 'desc' } });
  const order = out.map(r => STAGES.indexOf(r.stage));
  assert.ok(order.every((v, i) => i === 0 || order[i - 1] <= v), 'groups contiguous in option order');
  for (const s of STAGES) {
    const g = out.filter(r => r.stage === s).map(r => r.lastContact);
    assert.ok(g.every((v, i) => i === 0 || g[i - 1] >= v), `${s} sorted by lastContact desc`);
  }
  assert.deepEqual(arrange(rows, { group: null, sort: { field: 'name', dir: 'asc' } }), sortRows(rows, { field: 'name', dir: 'asc' }));
});
