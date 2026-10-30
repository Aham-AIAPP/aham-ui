// Repository structure and rule consistency: generated CSS is current, lint is clean, every local link resolves,
// contracts resolve, and the rule texts keep their own writing rules.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, readdirSync} from 'node:fs';
import {build, buildJS, buildExamples, tokens, resolve} from '../scripts/build.mjs';
import {lint} from '../scripts/lint.mjs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = new URL('../', import.meta.url);
const read = f => readFileSync(new URL(f, root), 'utf8');
const files = dir => readdirSync(new URL(dir, root)).map(f => `${dir}${f}`);
// Sample pages; files starting with _ are partials the build copies into the pages.
const samples = () => files('examples/').filter(f => f.endsWith('.html') && !f.startsWith('examples/_'));

test('aham.css, aham.js and the sample sidebars are generated from tokens.json, src/, js/ and examples/_rail.html', () => {
  assert.equal(read('aham.css'), build(), 'run node scripts/build.mjs');
  assert.equal(read('aham.js'), buildJS(), 'run node scripts/build.mjs');
  for (const [f, text] of buildExamples()) assert.equal(read(f), text, `${f}: run node scripts/build.mjs`);
});

test('lint finds no problems', () => {
  assert.deepEqual(lint(), []);
});

test('density: 44px single-line list rows, 36px table rows, 32px compact, 44px for touch', () => {
  const v = k => tokens.size[k].$value;
  assert.equal(v('list-row'), '44px');
  assert.equal(v('row'), '36px');
  assert.equal(v('row-compact'), '32px');
  assert.equal(v('control'), '32px');
  assert.equal(v('touch'), '44px');
  assert.equal(v('icon'), '16px');
  assert.equal(tokens.layout.nav.$value, '220px');
  const css = read('aham.css');
  assert.ok(/@media \(pointer:coarse\)[\s\S]*--wb-row:var\(--wb-touch\)/.test(css), 'touch rows switch to 44px');
});

test('type scale: two sizes on workbench pages, 12px the smallest (rules/2-视觉.md 2.5)', () => {
  const px = k => parseInt(resolve(`text.${k}`), 10);
  assert.equal(px('body'), 14);
  assert.equal(px('leading'), 22);
  assert.equal(px('text-xs'), 12);
  assert.equal(parseInt(tokens.layout['body-width'].$value, 10) / px('body'), 48, 'a line of running text holds 48 characters at most');
  assert.equal(px('title'), 20);
  assert.ok(!('detail-title' in tokens.text), 'detail-title was removed in 9.0');
  assert.ok(Object.keys(tokens.text).filter(k => !k.startsWith('$')).every(k => px(k) >= 12));
});

test('theme generator reproduces the hand-tuned colours and its sample themes meet the contrast pairs', async () => {
  const {generateTheme, checkTheme, deltaE, SAMPLES} = await import('../scripts/theme.mjs');
  for (const mode of ['light', 'dark']) {
    const g = generateTheme({ mode });
    for (const [key, hex] of Object.entries(g)) assert.ok(deltaE(hex, resolve(`color.${mode}.${key}`)) <= 3, `${mode} ${key}`);
    assert.deepEqual(checkTheme(mode, g), []);
  }
  for (const s of SAMPLES) assert.deepEqual(checkTheme(s.mode, generateTheme(s)), [], JSON.stringify(s));
});

test('print always uses the light colours', () => {
  const css = read('aham.css');
  const block = css.slice(css.indexOf('@media print {\n.aham-workbench:is('));
  assert.ok(block.includes(`--wb-bg: ${tokens.color.light.bg.$value};`));
  assert.ok(block.includes(`--wb-ink: ${tokens.color.light.ink.$value};`));
});

test('every local href and src in examples and index.html resolves', () => {
  const pages = ['index.html', ...samples()];
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

test('every rule chapter names the design principles it carries out', () => {
  for (const f of RULES) assert.ok(/本章落实设计理念的原则 \d/.test(read(f).split('\n').slice(0, 4).join('\n')), f);
  const philosophy = read('设计理念.md');
  for (let n = 1; n <= 16; n++) assert.ok(philosophy.includes(`**原则 ${n}　`), `设计理念.md 原则 ${n}`);
  for (const f of ['README.md', 'AGENTS.md']) assert.ok(read(f).includes('设计理念.md'), `${f} links the philosophy`);
});

test('rules/ has the eleven files in order', () => {
  assert.deepEqual(RULES.map(f => f.replace('rules/', '')), ['1-总则.md', '2-视觉.md', '3-控件.md', '4-页面.md', '5-单据.md', '6-反馈.md', '7-键盘与命令.md', '8-AI协作.md', '9-验收.md', '10-数据格式.md', '11-交互.md']);
});

test('rule headings are noun phrases: no question marks, no 你', () => {
  for (const f of [...RULES, 'README.md', 'AGENTS.md', '设计理念.md']) {
    for (const line of read(f).split('\n').filter(l => /^#{1,4} /.test(l))) {
      assert.ok(!/[？?]|你/.test(line), `${f}: ${line}`);
    }
  }
});

test('rule texts avoid the banned words', () => {
  for (const f of [...RULES, 'README.md', 'AGENTS.md', '设计理念.md']) {
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

test('buttons with icons remain named (rules/3-控件.md 3.2)', () => {
  const pages = ['index.html', ...samples()];
  for (const page of pages) {
    for (const [tag] of read(page).matchAll(/<(?:button|a)\b[^>]*class="wb-btn(?![^"]*icon-only)[^"]*"[^>]*>\s*<svg[\s\S]*?<\/(?:button|a)>/g)) {
      assert.ok(/aria-label=/.test(tag) || tag.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim(), `${page}: ${tag.slice(0, 120)}`);
    }
  }
});

test('navigation names are meaningful and nonempty (rules/4-页面.md 4.1)', () => {
  for (const page of samples()) {
    for (const [, name] of read(page).matchAll(/class="wb-nav-item"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/g)) {
      assert.ok(name.trim().length > 0, `${page}: ${name}`);
    }
  }
});

test('text never uses the faint grey; it is kept for icons and disabled text (rules/2-视觉.md 2.1)', () => {
  const allowed = [/\.wb-field:disabled\{/, /\.wb-btn\.primary:disabled\{/, /\.wb-stage-icon\{/];
  for (const f of files('src/').filter(f => f.endsWith('.css'))) {
    for (const line of read(f).split('\n').filter(l => /[^-]color:var\(--wb-faint\)/.test(l))) {
      assert.ok(allowed.some(r => r.test(line)), `${f}: ${line.slice(0, 120)}`);
    }
  }
});

test('the old empty-value word is gone (rules/10-数据格式.md 10.5)', () => {
  for (const f of [...RULES, 'aham.js', 'AGENTS.md', ...files('examples/')]) assert.ok(!read(f).includes('没填'), f);
});

test('every workbench sample with a sidebar has a command palette (rules/7 7.2, principle 11)', () => {
  const pages = samples().map(f => f.slice('examples/'.length));
  const missing = [];
  for (const page of pages) {
    const html = read(`examples/${page}`);
    if (!html.includes('class="wb-rail"')) continue;
    const script = html.match(/<script type="module" src="\.\/([\w-]+\.mjs)"/)?.[1];
    if (!script || !read(`examples/${script}`).includes('initPalette(')) missing.push(page);
  }
  assert.deepEqual(missing, []);
});

test('hover styles apply only to fine pointers (rules/11-交互.md 11.2)', async () => {
  const {hoverOnly} = await import('../scripts/build.mjs');
  const {parse, rules, selectors} = await import('../scripts/lib/css.mjs');
  assert.match(hoverOnly(':where(.aham-workbench) .a:hover{color:red}'), /^@media \(hover: hover\) and \(pointer: fine\)/);
  assert.doesNotMatch(hoverOnly(':where(.aham-workbench) .a:hover,:where(.aham-workbench) .a:focus-visible{color:red}'), /^@media/);
  assert.match(hoverOnly(':where(.aham-workbench) .a:hover,\n:where(.aham-workbench) .b:hover{color:red}'), /^@media/, 'multi-line selectors are wrapped too');
  const bare = [...rules(parse(read('aham.css')))].filter(r => !r.context.some(c => c.includes('hover')) && !/focus/.test(r.selector) && selectors(r.selector).every(s => /:hover/.test(s.replace(/:not\([^)]*\)/g, ''))));
  assert.deepEqual(bare.map(r => r.selector), []);
});

test('every sample with a sidebar has the account button (rules/11-交互.md 11.6)', () => {
  const missing = samples().filter(f => read(f).includes('class="wb-rail"') && !read(f).includes('data-action="account"'));
  assert.deepEqual(missing, []);
});

test('motion uses transitions, not keyframes, except the skeleton (rules/11-交互.md 11.4)', () => {
  const names = [...read('aham.css').matchAll(/@keyframes\s+([\w-]+)/g)].map(m => m[1]);
  assert.ok(names.every(n => /skeleton|shimmer/.test(n)), names.join(', '));
});

test('every script in js/ and examples/ parses', () => {
  const bad = [...files('js/'), ...files('examples/')].filter(f => /\.m?js$/.test(f)).filter(f => {
    const r = spawnSync(process.execPath, ['--check', fileURLToPath(new URL(f, root))], { encoding: 'utf8' });
    return r.status !== 0;
  });
  assert.deepEqual(bad, []);
});

test('aham.d.ts declares exactly the exports of aham.js', async () => {
  const exported = Object.keys(await import(new URL('aham.js', root))).sort();
  const declared = [...read('aham.d.ts').matchAll(/^export (?:function|const) (\w+)/gm)].map(m => m[1]);
  assert.deepEqual([...new Set(declared)].sort(), exported);
});

test('every init* and create* handle has destroy (docs/react.md)', () => {
  const missing = files('js/').filter(f => f.endsWith('.js')).flatMap(f => {
    const src = read(f);
    return [...src.matchAll(/^export function ((?:init|create)\w+)/gm)].map(m => m[1]).filter(name => {
      const body = src.slice(src.indexOf(`export function ${name}`)).split(/\nexport /)[0];
      return !/destroy: life\.end/.test(body);
    });
  });
  assert.deepEqual(missing, []);
});

test('work log: the kind disc stays on the connecting line when the log splits into two columns (rules/3-控件.md 3.18)', () => {
  // An absolutely positioned grid child that names a grid-column is placed against that column, not the padding box:
  // 10.0.1 gave the disc grid-column:1 with every other child and it sat 36px to the right, over the record kind.
  const split = read('aham.css').match(/@container \(min-width: 960px\)\{([^@]*)\}/);
  assert.ok(split, 'the work log splits at 960px of log width');
  const rules = split[1];
  const all = rules.indexOf('.wb-worklog-item > *{grid-column:1}');
  const disc = rules.indexOf('.wb-worklog-item > .wb-worklog-icon{grid-column:auto}');
  assert.ok(all >= 0 && disc > all, 'the disc opts out of the columns after the catch-all');
  assert.ok(/\.wb-worklog-icon\{position:absolute;inset-inline-start:0;top:0;/.test(read('aham.css')));
});

test('one version everywhere: package.json, tokens.json, rules/1 and README', () => {
  const v = JSON.parse(read('package.json')).version;
  assert.equal(tokens.$meta.version, v);
  assert.match(read('rules/1-总则.md'), new RegExp(`^版本 ${v.replace(/\./g, '\\.')}。`, 'm'));
  assert.match(read('README.md'), new RegExp(`当前版本 ${v.replace(/\./g, '\\.')}。`));
});

test('the counts written in the docs match the repository', () => {
  const ruleFiles = files('rules/').filter(f => /\/\d+-.+\.md$/.test(f)).length;
  const words = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'];
  for (const f of ['rules/1-总则.md', 'README.md', 'AGENTS.md']) {
    for (const m of read(f).matchAll(/(?:本目录|规则正文，)([一二三四五六七八九十]+)个文件|([一二三四五六七八九十]+)个规则文件/g)) {
      const n = m[1] ?? m[2];
      assert.equal(words.indexOf(n), ruleFiles, `${f}: ${n}个文件`);
    }
    assert.doesNotMatch(read(f), /\d+ 份契约/, `${f}: write no contract count; components/index.json lists them`);
  }
});

test('contracts match components/schema.json and claim every class (scripts/contracts.mjs)', async () => {
  const { contracts } = await import('../scripts/contracts.mjs');
  const { errors } = await contracts();
  assert.deepEqual(errors, []);
});

test('rules state the current standard only; version history belongs in CHANGELOG.md', () => {
  // Earlier major versions are not named at all: 「8.0 没有参考实现」 says nothing about 9.0.
  const history = /\d\.(\d|x) ?(起|之前|曾|删除|改深|改成)|\d\.x\b|在 \d\.\d 删除|[1-8]\.[01] ?(没有参考实现|的参考实现|参考实现|示例用|的单据示例|的筛选)/;
  const found = files('rules/').filter(f => f.endsWith('.md')).flatMap(f => read(f).split('\n').map((l, i) => [f, i + 1, l]))
    .filter(([f, , l]) => history.test(l)).map(([f, n]) => `${f}:${n}`);
  assert.deepEqual(found, []);
});

test('the overview page lists every rule file', () => {
  const page = read('index.html');
  const missing = files('rules/').filter(f => f.endsWith('.md')).map(f => f.replace(/^rules\/|\.md$/g, '')).filter(n => !page.includes(`'${n}'`));
  assert.deepEqual(missing, []);
});
