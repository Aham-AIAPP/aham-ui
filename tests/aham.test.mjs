import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FILTER_OPERATORS,operatorLabel,fitOperator,filterComplete,matchesFilter,filtersToParam,paramToFilters,checkFile,formatBytes,treeTotals,diffRecords,keyStep,avatarCat,personHTML,stageIconHTML,fileCat} from '../aham.js';

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
  const contract = JSON.parse(readFileSync(new URL('../components/filter-bar.json', import.meta.url), 'utf8'));
  for (const [type, ops] of Object.entries(FILTER_OPERATORS)) assert.deepEqual(contract.operators[type], ops.map(o => o[1]), type);
});

test('key labels are readable on every platform', async () => {
  const {formatKeys} = await import('../aham.js');
  assert.deepEqual(formatKeys('escape'), ['Esc']);
  assert.deepEqual(formatKeys('space'), ['空格']);
  assert.deepEqual(formatKeys('g l'), ['G', 'L']);
  assert.ok(['⌘K', 'Ctrl+K'].includes(formatKeys('mod+k')[0]));
});

test('file checks: extension case-insensitive, empty files and size limit give a reason', () => {
  const rules = { accept: ['.pdf', '.step', '.dwg'], maxSize: 10 * 1024 * 1024 };
  assert.equal(checkFile({ name: '图纸.DWG', size: 100 }, rules), null);
  assert.equal(checkFile({ name: '说明.docx', size: 100 }, rules), '不支持的类型 .docx');
  assert.equal(checkFile({ name: 'noext', size: 100 }, rules), '不支持的类型');
  assert.equal(checkFile({ name: 'a.pdf', size: 0 }, rules), '空文件');
  assert.equal(checkFile({ name: 'a.pdf', size: 11 * 1024 * 1024 }, rules), '超过 10 MB');
  assert.equal(checkFile({ name: 'any.bin', size: 1 }), null);
  assert.deepEqual([500, 1536, 18 * 1024 * 1024, -1].map(formatBytes), ['500 B', '1.5 KB', '18 MB', '–']);
});

test('tree totals: parents sum their children in integer cents, cycles are rejected', () => {
  const rows = [{ id: 'a' }, { id: 'a1', parent: 'a', cents: 1840 }, { id: 'a2', parent: 'a' }, { id: 'a21', parent: 'a2', cents: 140 }, { id: 'a22', parent: 'a2', cents: 112 }, { id: 'b', cents: 5 }];
  const t = treeTotals(rows, r => r.cents);
  assert.equal(t.get('a2'), 252);
  assert.equal(t.get('a'), 2092);
  assert.equal(t.get('b'), 5);
  assert.throws(() => treeTotals([{ id: 'x', parent: 'y' }, { id: 'y', parent: 'x' }], () => 1), /Cyclic/);
});

test('version diff: added, removed and changed fields by key, in version order', () => {
  const before = [{ id: 'p1', qty: 1000, price: 1840 }, { id: 'p2', qty: 2000, price: 625 }, { id: 'p3', qty: 6000, price: 110 }];
  const after = [{ id: 'p1', qty: 1200, price: 1840 }, { id: 'p3', qty: 6000, price: 110 }, { id: 'p4', qty: 4000, price: 28 }];
  const d = diffRecords(before, after, { fields: ['qty', 'price'] });
  assert.deepEqual(d.added.map(r => r.id), ['p4']);
  assert.deepEqual(d.removed.map(r => r.id), ['p2']);
  assert.deepEqual(d.changed.map(c => [c.id, c.fields]), [['p1', [{ field: 'qty', from: 1000, to: 1200 }]]]);
  assert.equal(d.unchanged, 1);
  assert.deepEqual(diffRecords([{ id: 1, a: [1] }], [{ id: 1, a: [1] }]).changed, [], 'structural equality');
});

test('key steps use the same names as the reserved table in shortcuts.json', async () => {
  const {readFile} = await import('node:fs/promises');
  const reserved = Object.keys(JSON.parse(await readFile(new URL('../components/shortcuts.json', import.meta.url), 'utf8')).reserved);
  const ev = (key, mods = {}) => ({ key, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...mods });
  const steps = [keyStep(ev('ArrowUp')), keyStep(ev('ArrowDown')), keyStep(ev('ArrowLeft')), keyStep(ev('ArrowRight')),
    keyStep(ev('ArrowDown', { shiftKey: true })), keyStep(ev('Escape')), keyStep(ev(' ')), keyStep(ev('k', { ctrlKey: true }))];
  assert.deepEqual(steps, ['up', 'down', 'left', 'right', 'shift+down', 'escape', 'space', 'mod+k']);
  for (const s of steps) assert.ok(reserved.includes(s), `${s} is in the reserved table`);
});

test('avatarCat gives the same person the same colour, always 1–6', () => {
  for (const name of ['林悦', '王卓', '周航', '陈思', 'Ada Lovelace', '']) {
    const c = avatarCat(name);
    assert.ok(Number.isInteger(c) && c >= 1 && c <= 6, name);
    assert.equal(avatarCat(name), c);
    assert.equal(avatarCat(` ${name} `), c, 'surrounding spaces do not change the colour');
  }
});

test('personHTML writes the first character, the name and the empty state', () => {
  const html = personHTML('林悦');
  assert.ok(html.includes(`data-cat="${avatarCat('林悦')}"`));
  assert.ok(html.includes('>林</span>') && html.includes('<span>林悦</span>'));
  assert.ok(personHTML('').includes('is-none') && personHTML('').includes('未指定'));
  assert.ok(personHTML('<b>').includes('&lt;b&gt;'), 'names are escaped');
  assert.ok(personHTML('林悦', { size: 'md' }).includes('class="wb-avatar"'));
});

test('fileCat colours files by type and leaves the rest plain', () => {
  assert.equal(fileCat('点检表.PDF'), 5);
  assert.equal(fileCat('月报.xlsx'), 1);
  assert.equal(fileCat('现场.jpg'), 3);
  assert.equal(fileCat('夹具.step'), 2);
  assert.equal(fileCat('说明.txt'), 0);
  assert.equal(fileCat('README'), 0);
});

test('compact person: the avatar alone, named for hover and screen readers (rules/3-控件.md 3.11)', () => {
  const html = personHTML('林悦', { compact: true });
  assert.ok(html.startsWith('<span class="wb-avatar-xs"'));
  assert.ok(html.includes('title="林悦"') && html.includes('aria-label="林悦"') && html.includes('role="img"'));
  assert.ok(!html.includes('wb-person'));
  assert.ok(personHTML('', { compact: true }).includes('aria-label="未指定"'));
});

test('stage icon: state, pie share and spoken label (rules/3-控件.md 3.15)', () => {
  const cur = stageIconHTML({ state: 'current', done: 2, total: 5, label: '方案评估' });
  assert.ok(cur.includes('data-state="current"'));
  assert.ok(cur.includes('aria-label="方案评估：进行中，第 3 段，共 5 段"'));
  const dash = Number(cur.match(/stroke-dasharray="([\d.]+) ([\d.]+)"/)[1]), whole = 2 * Math.PI * 2.5;
  assert.ok(Math.abs(dash - whole * 0.4) < 0.01, 'pie covers 2 of 5');
  assert.ok(stageIconHTML({ state: 'done', label: '已签约' }).includes('aria-label="已签约：已完成"'));
  assert.ok(stageIconHTML({ state: 'bogus' }).includes('data-state="todo"'));
  assert.ok(!stageIconHTML({ state: 'done' }).includes('wb-stage-pie'));
});
