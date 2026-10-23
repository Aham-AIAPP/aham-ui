// Repository structure and rule consistency: generated CSS is current, lint is clean, every local link resolves,
// contracts resolve, and the rule texts keep their own writing rules.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, readdirSync} from 'node:fs';
import {build, tokens} from '../scripts/build.mjs';
import {lint} from '../scripts/lint.mjs';

const root = new URL('../', import.meta.url);
const read = f => readFileSync(new URL(f, root), 'utf8');
const files = dir => readdirSync(new URL(dir, root)).map(f => `${dir}${f}`);

test('aham.css is generated from tokens.json and src/', () => {
  assert.equal(read('aham.css'), build(), 'run node scripts/build.mjs');
});

test('lint finds no problems', () => {
  assert.deepEqual(lint(), []);
});

test('density: 36px rows by default, 32px compact, 44px only for touch', () => {
  const v = k => tokens.size[k].$value;
  assert.equal(v('row'), '36px');
  assert.equal(v('row-compact'), '32px');
  assert.equal(v('control'), '32px');
  assert.equal(v('touch'), '44px');
  const css = read('aham.css');
  assert.ok(/@media \(pointer:coarse\)[\s\S]*--wb-row:var\(--wb-touch\)/.test(css), 'touch rows switch to 44px');
});

test('print always uses the light colours', () => {
  const css = read('aham.css');
  const block = css.slice(css.indexOf('@media print {\n.aham-workbench:is('));
  assert.ok(block.includes(`--wb-bg: ${tokens.color.light.bg.$value};`));
  assert.ok(block.includes(`--wb-ink: ${tokens.color.light.ink.$value};`));
});

test('every local href and src in examples and index.html resolves', () => {
  const pages = ['index.html', ...files('examples/').filter(f => f.endsWith('.html'))];
  for (const page of pages) {
    const html = read(page), base = new URL(page, root);
    for (const [, url] of html.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)) {
      if (/^(https?:|mailto:|data:)/.test(url) || url.includes('${')) continue;
      assert.ok(existsSync(new URL(url.split('?')[0], base)), `${page} → ${url}`);
    }
  }
});

test('aham.js and examples load nothing from other servers', () => {
  for (const f of ['aham.js', ...files('examples/')]) {
    assert.ok(!/(?:import|from|src=|href=)\s*["'`]?https?:/.test(read(f)), f);
  }
});

test('every contract in components/index.json resolves to its own file', () => {
  const index = JSON.parse(read('components/index.json'));
  for (const {slug} of index.components) {
    const c = JSON.parse(read(`components/${slug}.json`));
    assert.equal(c.slug, slug);
    for (const key of ['preview', 'reference', 'behavior']) if (c[key]) assert.ok(existsSync(new URL(c[key], root)), `${slug}.${key} → ${c[key]}`);
  }
});

test('document page wires the status gate into initObjectPage', () => {
  const js = read('examples/document.mjs');
  assert.ok(js.includes('canEdit'), 'edit is refused when the status does not allow changes');
  assert.ok(js.includes("openConfirm({ root, title: '删除报价单"), 'delete asks first');
  assert.ok(js.includes("footer: $('#doc-foot')"), 'save and cancel live in the footer toolbar');
  assert.ok(js.includes('draft: { interval: 20000'), 'drafts are saved every 20 seconds');
  assert.ok(read('aham.js').includes('if (mode() === \'edit\' || !canEdit()) return;'));
});

// The writing rules the rule texts follow (rules/1-总则.md 1.6 and the project's style list).
const RULES = files('rules/').filter(f => f.endsWith('.md')).sort((a, b) => parseInt(a.slice(6)) - parseInt(b.slice(6)));
const BANNED = ['承接', '赋能', '沉淀', '落地', '抓手', '闭环', '粒度', '归集', '收敛', '下沉', '对位', '波次', '地基', '命脉', '灰度', '旁路', '水位', '卡位', '颗粒度', '值得注意的是', '需要指出的是', '总而言之', '简而言之'];

test('rules/ has the ten files in order', () => {
  assert.deepEqual(RULES.map(f => f.replace('rules/', '')), ['1-总则.md', '2-视觉.md', '3-控件.md', '4-页面.md', '5-单据.md', '6-反馈.md', '7-键盘与命令.md', '8-AI协作.md', '9-验收.md', '10-数据格式.md']);
});

test('rule headings are noun phrases: no question marks, no 你', () => {
  for (const f of [...RULES, 'README.md', 'AGENTS.md']) {
    for (const line of read(f).split('\n').filter(l => /^#{1,4} /.test(l))) {
      assert.ok(!/[？?]|你/.test(line), `${f}: ${line}`);
    }
  }
});

test('rule texts avoid the banned words', () => {
  for (const f of [...RULES, 'README.md', 'AGENTS.md']) {
    const text = read(f);
    for (const w of BANNED) assert.ok(!text.includes(w), `${f} contains ${w}`);
  }
});

test('rules name only class names and functions that exist', () => {
  const css = read('aham.css'), js = read('aham.js'), examples = files('examples/').map(read).join('\n');
  for (const f of RULES) {
    const text = read(f);
    for (const [, cls] of text.matchAll(/`\.(wb-[a-z0-9-]+)/g)) assert.ok(css.includes(`.${cls}`), `${f}: .${cls}`);
    for (const [, fn] of text.matchAll(/`([a-zA-Z]+)\(\)`/g)) assert.ok(js.includes(`function ${fn}(`) || js.includes(`const ${fn} =`) || examples.includes(`function ${fn}(`), `${f}: ${fn}()`);
  }
});

test('a button carries text or an icon, never both (rules/3-控件.md 3.2)', () => {
  const pages = ['index.html', ...files('examples/').filter(f => f.endsWith('.html'))];
  for (const page of pages) {
    for (const [tag] of read(page).matchAll(/<(?:button|a)\b[^>]*class="wb-btn(?![^"]*icon-only)[^"]*"[^>]*>\s*<svg[\s\S]*?<\/(?:button|a)>/g)) {
      assert.ok(/<\/svg>\s*<\/(?:button|a)>$/.test(tag), `${page}: ${tag.slice(0, 120)}`);
    }
  }
});

test('navigation names have two characters (rules/4-页面.md 4.1)', () => {
  for (const page of files('examples/').filter(f => f.endsWith('.html'))) {
    for (const [, name] of read(page).matchAll(/class="wb-nav-item"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/g)) {
      assert.equal([...name].length, 2, `${page}: ${name}`);
    }
  }
});

test('text never uses the faint grey; it is kept for icons and disabled text (rules/2-视觉.md 2.1)', () => {
  const allowed = [/\.wb-field:disabled\{/];
  for (const f of files('src/').filter(f => f.endsWith('.css'))) {
    for (const line of read(f).split('\n').filter(l => /[^-]color:var\(--wb-faint\)/.test(l))) {
      assert.ok(allowed.some(r => r.test(line)), `${f}: ${line.slice(0, 120)}`);
    }
  }
});

test('the old empty-value word is gone (rules/10-数据格式.md 10.5)', () => {
  for (const f of [...RULES, 'aham.js', 'AGENTS.md', ...files('examples/')]) assert.ok(!read(f).includes('没填'), f);
});
