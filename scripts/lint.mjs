// Checks the style sources against tokens.json and the rules. Run: node scripts/lint.mjs   (exit 1 on any error)
//   1. Every var(--wb-*) used in src/, aham.js and examples/ is defined by tokens.json or listed in RUNTIME_VARS.
//   2. src/ has no colour literals (hex, rgb, hsl): colours come from tokens only.
//   3. src/ sets no font size in px: sizes come from the text tokens, the smallest of which is 12px.
//   4. src/ uses no border radius in px except 50% / 0 / 1–2px hairlines: radii come from the radius tokens.
//   5. Colour pairs used for text, icons and controls reach their contrast minimum in both themes (PAIRS).
//   6. src/ never colours text with the primary blue: links use the body colour (rules/2-视觉.md 2.2, 9.0). The stage
//      icon, the current stop of a stage track and the one key number of a record page are current-item marks.
//   7. src/ sets no icon size in px: icons take --wb-icon (14px) or a spacing token (rules/2-视觉.md 2.9).
//   8. src/ transitions name their properties, never move layout (width, height, position, margin), and take token durations.
//   9. Every variable tokens.json defines is used somewhere: src/, js/, examples/, index.html or another variable.
//      A token marked $deprecated is kept for products that still use it, and src/ may not use it.
// Tests import lint() and contrast().
import {readFileSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {tokens, variables, resolve, leaves} from './build.mjs';

const root = new URL('../', import.meta.url);
const read = f => readFileSync(new URL(f, root), 'utf8');
const list = (dir, ext) => readdirSync(new URL(dir, root)).filter(f => ext.some(e => f.endsWith(e))).map(f => `${dir}${f}`);

// Variables set at run time rather than by tokens: --wb-level by the tree table, --wb-cat by [data-cat], --wb-expand-cols by the page,
// --wb-detail-head-top by a product whose page scroller already has a stuck header above the record title.
export const RUNTIME_VARS = ['level', 'cat', 'expand-cols', 'detail-head-top'];

export {PAIRS, contrast} from './lib/contrast.mjs';
import {PAIRS, contrast, contrastTable} from './lib/contrast.mjs';

export function lint() {
  const errors = [], defined = new Set([...variables().map(([n]) => n), ...RUNTIME_VARS]);
  const sources = list('src/', ['.css']);
  const scripts = [...list('js/', ['.js']), 'index.html', ...list('examples/', ['.html', '.mjs', '.js'])];

  for (const f of [...sources, ...scripts]) {
    for (const m of read(f).matchAll(/var\(--wb-([a-z0-9-]+)/g)) if (!defined.has(m[1])) errors.push(`${f}: --wb-${m[1]} 没有定义（tokens.json 里没有这个键）`);
  }
  for (const f of sources) {
    const lines = read(f).split('\n');
    lines.forEach((line, i) => {
      const at = `${f}:${i + 1}`;
      if (/#[0-9a-fA-F]{3,8}\b/.test(line.replace(/\{\{[^}]+\}\}/g, ''))) errors.push(`${at}: 写死了颜色，改用 tokens.json 的颜色变量`);
      if (/\b(rgba?|hsla?)\(/.test(line)) errors.push(`${at}: 写死了颜色，改用 tokens.json 的颜色变量`);
      if (/font(-size)?:[^;}]*\b\d+(\.\d+)?px/.test(line)) errors.push(`${at}: 字号写死成 px，改用 --wb-text-* 变量`);
      for (const r of line.matchAll(/border-radius:([^;}]+)/g)) if (/\b([3-9]|\d{2,})px/.test(r[1])) errors.push(`${at}: 圆角写死成 px，改用 --wb-radius-* 变量`);
      if (/[{;]color:var\(--wb-blue\)/.test(line) && !/\.wb-stage-icon|\.wb-stage-stop\[data-state=now\]|\.wb-key-fact\.is-primary/.test(line)) errors.push(`${at}: 文字用了主色。正文链接用正文色加下划线，主色只给主按钮、焦点和当前项标记`);
      if (/svg[^{]*\{[^}]*\b(width|height):\d+px/.test(line)) errors.push(`${at}: 图标尺寸写死成 px，改用 --wb-icon 或间距变量`);
      // Motion (rules/11-交互.md 11.4): name the animated properties, move with transform and opacity only, time with tokens.
      for (const m of line.matchAll(/transition(?:-property)?:([^;}]+)/g)) {
        const v = m[1];
        if (/\ball\b/.test(v)) errors.push(`${at}: transition 写了 all，逐个写出要过渡的属性`);
        if (/(^|,)\s*(width|height|top|left|right|bottom|margin[a-z-]*|padding[a-z-]*|inset)\b/.test(v)) errors.push(`${at}: 对宽高、位置或边距做了过渡，会引起重新排版，改用 transform`);
        if (/\b\d*\.?\d+m?s\b/.test(v.replace(/\b0s\b/g, ''))) errors.push(`${at}: 动效时长写死，改用 --wb-instant、--wb-fast、--wb-pop、--wb-base`);
      }
    });
  }
  // An unused token is a value nobody can see change; remove it or use it.
  const used = new Set([...sources, ...scripts].flatMap(f => [...read(f).matchAll(/--wb-([a-z0-9-]+)/g)].map(m => m[1])));
  for (const f of sources) for (const m of read(f).matchAll(/\{\{[a-z-]+\.([a-z0-9-]+)\}\}/g)) used.add(m[1]);
  for (const m of read('aham.css').matchAll(/:\s*[^;{}]*var\(--wb-([a-z0-9-]+)/g)) used.add(m[1]);
  const deprecated = new Set(variables().filter(([, path]) => path.split('.').reduce((o, k) => o[k], tokens).$deprecated).map(([n]) => n));
  for (const f of sources) for (const n of deprecated) if (read(f).includes(`--wb-${n})`)) errors.push(`${f}: --wb-${n} 已弃用，改用 tokens.json 里它的 $value 指向的变量`);
  for (const [name] of variables()) if (!used.has(name) && !deprecated.has(name)) errors.push(`tokens.json: --wb-${name} 没有被使用，删除它或在样式里用上`);
  for (const theme of ['light', 'dark']) {
    const value = Object.fromEntries(leaves(`color.${theme}`).map(([n, p]) => [n, resolve(p)]));
    for (const [fg, bg, min, what] of PAIRS) {
      const ratio = contrast(value[fg], value[bg]);
      if (ratio < min) errors.push(`对比度 ${theme}：${what} ${fg} ${value[fg]} / ${bg} ${value[bg]} = ${ratio.toFixed(2)}，要求 ${min}`);
    }
  }
  return errors;
}

// Contrast table for rules/2-视觉.md 2.3; the build writes it into the rule. node scripts/lint.mjs --table prints it.
export const table = () => contrastTable(resolve);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--table')) { console.log(table()); process.exit(0); }
  const errors = lint();
  for (const e of errors) console.error(e);
  console.log(errors.length ? `${errors.length} 个问题` : `lint 通过（tokens ${tokens.$meta.version}）`);
  process.exit(errors.length ? 1 : 0);
}
