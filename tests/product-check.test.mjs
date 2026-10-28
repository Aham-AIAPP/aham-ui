// scripts/product-check.mjs (rules/9-验收.md 9.9) on a throwaway product folder.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {check, compare, lowered, BREAKPOINTS} from '../scripts/product-check.mjs';

function product(files) {
  const dir = mkdtempSync(join(tmpdir(), 'aham-product-'));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(dir, path, '..'), {recursive: true});
    writeFileSync(join(dir, path), text);
  }
  return dir;
}

const glossary = {groups: [
  {name: '动作', terms: [{word: '完成任务', meaning: '处理任务的一种', avoid: ['做完了']}]},
  {name: 'AI', terms: [{word: 'AI 助手', meaning: '接入的 AI', avoid: ['Agent']}]},
]};
const config = {templates: ['templates'], styles: ['static'], scripts: ['static'], terms: 'terms.json', technical: ['me.html']};

test('hard rules fail on the first inline style or small font', () => {
  const dir = product({
    'templates/a.html': '<div style="color:red">ok</div>{# style="x" in a comment is fine #}',
    'static/a.css': '.a{font-size:11px}\n/* .b{font-size:10px} */',
    'static/vendor/x.css': '.v{font-size:9px}',
    'terms.json': JSON.stringify(glossary),
  });
  const {errors} = check(config, dir);
  assert.equal(errors.length, 2, errors.join('\n'));
  assert.ok(errors.some(e => e.includes('style=')) && errors.some(e => e.includes('小于 12px')));
});

test('counted rules: wording, events, plus buttons, colours, breakpoints', () => {
  const dir = product({
    'templates/a.html': '<button onclick="x()">＋</button><button>＋ 添加联系人</button><p>请先保存，任务做完了</p><p>邀请客户</p>',
    'templates/me.html': '<p>在 Agent 设置里添加</p>',
    'static/a.css': '.a{color:#fff;background:rgba(0,0,0,.1)}@media(max-width:768px){.a{}}@media(max-width:1024px){.b{}}',
    'static/a.js': "toast('您已保存')",
    'terms.json': JSON.stringify(glossary),
  });
  const {errors, counts} = check(config, dir);
  assert.deepEqual(errors, []);
  assert.equal(counts.events, 1);
  assert.equal(counts.plus_buttons, 2, 'symbol-only and symbol-prefixed buttons both count');
  assert.equal(counts.polite, 2, '请先 and 您 count; 邀请 does not');
  assert.equal(counts.terms['做完了'], 1);
  assert.equal(counts.terms['Agent'], 0, 'technical pages may name Agent');
  assert.equal(counts.colors, 2);
  assert.deepEqual(counts.breakpoints, [768], `only breakpoints outside ${BREAKPOINTS}`);
});

test('the baseline only goes down', () => {
  const counts = {colors: 2, events: 1, plus_buttons: 0, polite: 3, breakpoints: [768], terms: {做完了: 1}};
  const base = lowered(null, counts);
  assert.deepEqual(compare(counts, base), {errors: [], lower: []});
  const worse = {...counts, events: 2, terms: {做完了: 1, 改派: 1}, breakpoints: [768, 900]};
  const {errors} = compare(worse, base);
  assert.equal(errors.length, 3, errors.join('\n'));
  const better = {...counts, polite: 1};
  assert.deepEqual(compare(better, base).lower, ['请 / 您 / 抱歉：3 → 1']);
  assert.equal(lowered(base, {...worse, polite: 1}).events, 1, 'writing the baseline never raises a cap');
});
