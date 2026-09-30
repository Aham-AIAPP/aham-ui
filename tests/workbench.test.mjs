import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FILTER_OPERATORS,operatorLabel,fitOperator,filterComplete,matchesFilter,filtersToParam,paramToFilters} from '../design-system/workbench.js';

const fields = [
  { key: 'name', label: '名称', type: 'text' },
  { key: 'stage', label: '阶段', type: 'option', options: ['甲', '乙', '丙'] },
  { key: 'amount', label: '金额', type: 'number' },
  { key: 'day', label: '日期', type: 'date' },
];

test('every field type has operators with Chinese labels', () => {
  for (const [type, ops] of Object.entries(FILTER_OPERATORS)) {
    assert.ok(ops.length >= 2, type);
    for (const [k] of ops) assert.notEqual(operatorLabel(type, k), k, `${type}.${k} has a label`);
  }
});

test('option operator follows value count and keeps polarity', () => {
  assert.equal(fitOperator('option', 'is', ['a', 'b']), 'anyOf');
  assert.equal(fitOperator('option', 'anyOf', ['a']), 'is');
  assert.equal(fitOperator('option', 'isNot', ['a', 'b']), 'noneOf');
  assert.equal(fitOperator('option', 'noneOf', ['a']), 'isNot');
  assert.equal(fitOperator('number', 'gte', [1, 2]), 'gte');
});

test('completeness and matching semantics', () => {
  assert.equal(filterComplete({ op: 'between', values: [1] }, 'number'), false);
  assert.equal(filterComplete({ op: 'is', values: [] }, 'option'), false);
  assert.equal(filterComplete({ op: 'contains', values: [''] }, 'text'), false);
  assert.ok(matchesFilter('远川精密', { op: 'contains', values: ['精密'] }));
  assert.ok(!matchesFilter('远川精密', { op: 'notContains', values: ['精密'] }));
  assert.ok(matchesFilter('乙', { op: 'anyOf', values: ['甲', '乙'] }));
  assert.ok(matchesFilter('丙', { op: 'noneOf', values: ['甲', '乙'] }));
  assert.ok(!matchesFilter(null, { op: 'gte', values: [0] }), 'empty numbers never match a numeric filter');
  assert.ok(matchesFilter(5, { op: 'between', values: [1, 5] }));
  assert.ok(matchesFilter('2026-09-30', { op: 'after', values: ['2026-09-29'] }));
});

test('URL parameter round-trips and drops unknown, duplicate or malformed filters', () => {
  const filters = [{ field: 'stage', op: 'anyOf', values: ['甲', '乙'] }, { field: 'amount', op: 'between', values: [100, 900] }];
  assert.deepEqual(paramToFilters(filtersToParam(filters), fields), { filters, dropped: 0 });
  assert.equal(filtersToParam([]), '');
  assert.deepEqual(paramToFilters('{bad', fields), { filters: [], dropped: 1 });
  const messy = JSON.stringify([['stage', 'is', ['丁']], ['secret', 'is', ['x']], ['amount', 'gte', [-1]], ['day', 'after', ['30/09/2026']], ['stage', 'is', ['甲']], ['stage', 'is', ['乙']]]);
  const out = paramToFilters(messy, fields);
  assert.equal(out.dropped, 5);
  assert.deepEqual(out.filters, [{ field: 'stage', op: 'is', values: ['甲'] }]);
});

test('filter-bar contract lists exactly the implemented operators', async () => {
  const {readFileSync} = await import('node:fs');
  const contract = JSON.parse(readFileSync(new URL('../design-system/components/filter-bar.json', import.meta.url), 'utf8'));
  for (const [type, ops] of Object.entries(FILTER_OPERATORS)) assert.deepEqual(contract.operators[type], ops.map(o => o[1]), type);
});
