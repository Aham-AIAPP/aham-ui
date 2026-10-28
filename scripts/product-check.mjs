// Checks a product repository that uses Aham UI (rules/9-验收.md 9.9).
// Run: node scripts/product-check.mjs --config product-check.json [--write-baseline]   (exit 1 on any error)
//
// The config file is JSON; paths are relative to the config file:
//   {
//     "templates": ["app/templates"],        page templates: .html .htm .jinja .j2 .njk .vue .jsx .tsx
//     "styles":    ["app/static"],           .css files; any path containing /vendor/ is skipped
//     "scripts":   ["app/static"],           optional: front-end .js/.mjs, checked for wording only
//     "terms":     "app/terms.json",         optional: the product's own glossary (rules/1-总则.md 1.4)
//     "baseline":  "tests/product-check-baseline.json",
//     "technical": ["me.html"]               optional: settings pages allowed to show technical words
//   }
// Glossary format: {"groups": [{"name": "…", "terms": [{"word": "…", "meaning": "…",
//   "avoid": ["不用的说法", {"text": "说明", "pattern": "正则"}]}]}]}. A group named "AI" is not checked on
//   technical pages.
//
// Hard rules fail on the first occurrence: style= in a template, a font size under 12px in a style sheet.
// Counted rules may only go down: colour literals, event attributes, "＋" buttons, 请/您/抱歉, avoided words,
// breakpoints outside rules/4-页面.md 4.11. --write-baseline records the counts; an existing baseline is
// only ever lowered.
import {readFileSync, readdirSync, statSync, existsSync, writeFileSync} from 'node:fs';
import {join, dirname, resolve, relative, basename} from 'node:path';
import {fileURLToPath} from 'node:url';

const TEMPLATE_EXT = ['.html', '.htm', '.jinja', '.j2', '.njk', '.vue', '.jsx', '.tsx'];
// 4.11: wide 1600, context 1024, form 720 (container), mobile 640; the +1 values are their complements.
export const BREAKPOINTS = [640, 641, 720, 721, 1024, 1025, 1600, 1601];
const POLITE = /(?<![申邀聘])请(?!求)|您|抱歉/g;
const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/g;
const SMALL_FONT = /font(?:-size)?\s*:[^;}]*?(?<![\d.])(?:[0-9]|1[01])(?:\.\d+)?px/;
const EVENT_ATTR = /\son(?:click|change|submit|input|keydown|keyup|focus|blur)=["']/g;
const PLUS_BUTTON = /<(button|a)\b[^>]*>\s*[＋+](?:\s*<\/\1>|\s*[^\s<])/g;
const STYLE_ATTR = /\sstyle=["']/g;
const BREAKPOINT = /@media[^{]*?\(\s*(?:max|min)-width\s*:\s*(\d+)px/g;

function walk(dir, exts) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return /(^|\/)(vendor|node_modules)$/.test(path) ? [] : walk(path, exts);
    return exts.some(e => name.endsWith(e)) ? [path] : [];
  });
}

const stripMarkupComments = t => t.replace(/\{#[\s\S]*?#\}/g, '').replace(/<!--[\s\S]*?-->/g, '');
const stripCssComments = t => t.replace(/\/\*[\s\S]*?\*\//g, '');
const visible = t => t.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ');
const count = (text, re) => (text.match(re) || []).length;

export function avoidRules(glossary) {
  return (glossary?.groups || []).flatMap(group => (group.terms || []).flatMap(term => (term.avoid || []).map(item => ({
    text: typeof item === 'string' ? item : item.text,
    pattern: new RegExp(typeof item === 'string' ? item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : item.pattern, 'g'),
    use: term.word, group: group.name,
  }))));
}

// Returns {errors: [...], counts: {...}} for a config object whose paths are resolved against baseDir.
export function check(config, baseDir) {
  const at = p => resolve(baseDir, p);
  const rel = p => relative(baseDir, p);
  const templates = (config.templates || []).flatMap(d => walk(at(d), TEMPLATE_EXT));
  const styles = (config.styles || []).flatMap(d => walk(at(d), ['.css']));
  const scripts = (config.scripts || []).flatMap(d => walk(at(d), ['.js', '.mjs']));
  const technical = new Set(config.technical || []);
  const glossary = config.terms && existsSync(at(config.terms)) ? JSON.parse(readFileSync(at(config.terms), 'utf8')) : null;
  const errors = [];
  const counts = {colors: 0, events: 0, plus_buttons: 0, polite: 0, breakpoints: [], terms: {}};

  const markup = templates.map(f => [f, stripMarkupComments(readFileSync(f, 'utf8'))]);
  for (const [f, text] of markup) {
    if (count(text, STYLE_ATTR)) errors.push(`${rel(f)}: 写了 style=，改用 Aham 的类名和变量（9.9）`);
    counts.events += count(text, EVENT_ATTR);
    counts.plus_buttons += count(text, PLUS_BUTTON);
  }
  const breakpoints = new Set();
  for (const f of styles) {
    const css = stripCssComments(readFileSync(f, 'utf8'));
    css.split('\n').forEach((line, i) => { if (SMALL_FONT.test(line)) errors.push(`${rel(f)}:${i + 1}: 字号小于 12px（2.5）`); });
    counts.colors += count(css, COLOR);
    for (const m of css.matchAll(BREAKPOINT)) if (!BREAKPOINTS.includes(Number(m[1]))) breakpoints.add(Number(m[1]));
  }
  counts.breakpoints = [...breakpoints].sort((a, b) => a - b);
  const wording = [...markup.map(([f, t]) => [f, visible(t)]), ...scripts.map(f => [f, readFileSync(f, 'utf8')])];
  for (const [f, text] of wording) if (!technical.has(basename(f))) counts.polite += count(text, POLITE);
  for (const rule of avoidRules(glossary)) {
    let n = 0;
    for (const [f, text] of wording) if (!(rule.group === 'AI' && technical.has(basename(f)))) n += count(text, rule.pattern);
    counts.terms[rule.text] = n;
  }
  return {errors, counts};
}

// Compares counts with a baseline. Returns {errors, lower}: errors for anything above the cap.
export function compare(counts, baseline) {
  const errors = [], lower = [];
  const cap = (label, now, max = 0) => {
    if (now > max) errors.push(`${label}：现在 ${now} 处，上限 ${max}（只减不增）`);
    else if (now < max) lower.push(`${label}：${max} → ${now}`);
  };
  cap('样式里的颜色字面量', counts.colors, baseline.colors);
  cap('元素上的事件属性', counts.events, baseline.events);
  cap('「＋」按钮', counts.plus_buttons, baseline.plus_buttons);
  cap('请 / 您 / 抱歉', counts.polite, baseline.polite);
  for (const [text, n] of Object.entries(counts.terms)) cap(`用语「${text}」`, n, baseline.terms?.[text] ?? 0);
  const extra = counts.breakpoints.filter(b => !(baseline.breakpoints || []).includes(b));
  if (extra.length) errors.push(`不在 4.11 里的断点 ${extra.join('、')}px：改用 1600 / 1024 / 720 / 640`);
  return {errors, lower};
}

export function lowered(baseline, counts) {
  if (!baseline) return counts;
  const terms = {};
  for (const [text, n] of Object.entries(counts.terms)) terms[text] = Math.min(n, baseline.terms?.[text] ?? n);
  return {
    colors: Math.min(counts.colors, baseline.colors), events: Math.min(counts.events, baseline.events),
    plus_buttons: Math.min(counts.plus_buttons, baseline.plus_buttons), polite: Math.min(counts.polite, baseline.polite),
    breakpoints: counts.breakpoints.filter(b => (baseline.breakpoints || []).includes(b)), terms,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--config');
  if (i < 0) { console.error('用法：node scripts/product-check.mjs --config <配置文件> [--write-baseline]'); process.exit(2); }
  const configPath = resolve(process.argv[i + 1]);
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const baseDir = dirname(configPath);
  const {errors, counts} = check(config, baseDir);
  const baselinePath = config.baseline ? resolve(baseDir, config.baseline) : null;
  const baseline = baselinePath && existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : null;
  if (process.argv.includes('--write-baseline')) {
    if (!baselinePath) { console.error('配置里没有 baseline'); process.exit(2); }
    writeFileSync(baselinePath, JSON.stringify(lowered(baseline, counts), null, 2) + '\n');
    console.log(`已写入 ${relative(process.cwd(), baselinePath)}`);
  }
  const result = compare(counts, baseline || lowered(null, counts));
  for (const line of result.lower) console.log(`可以调低：${line}`);
  const all = [...errors, ...result.errors];
  for (const line of all) console.error(`✗ ${line}`);
  if (all.length) process.exit(1);
  console.log('✓ 产品检查通过');
}
