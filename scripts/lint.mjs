// Checks the style sources against tokens.json and the rules. Run: node scripts/lint.mjs   (exit 1 on any error)
//   1. Every var(--wb-*) used in src/, aham.js and examples/ is defined by tokens.json or listed in RUNTIME_VARS.
//   2. src/ has no colour literals (hex, rgb, hsl): colours come from tokens only.
//   3. src/ sets no font size in px: sizes come from the text tokens, the smallest of which is 12px.
//   4. src/ uses no border radius in px except 50% / 0 / 1–2px hairlines: radii come from the radius tokens.
//   5. Colour pairs used for text, icons and controls reach their contrast minimum in both themes (PAIRS).
//   6. src/ never colours text with the primary blue: links use the body colour (rules/2-视觉.md 2.2, 9.0).
//   7. src/ sets no icon size in px: icons take --wb-icon (14px) or a spacing token (rules/2-视觉.md 2.9).
//   8. src/ transitions name their properties, never move layout (width, height, position, margin), and take token durations.
// Tests import lint() and contrast().
import {readFileSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {tokens, variables, resolve, leaves} from './build.mjs';

const root = new URL('../', import.meta.url);
const read = f => readFileSync(new URL(f, root), 'utf8');
const list = (dir, ext) => readdirSync(new URL(dir, root)).filter(f => ext.some(e => f.endsWith(e))).map(f => `${dir}${f}`);

// Variables set at run time rather than by tokens: --wb-level by the tree table, --wb-cat by [data-cat], --wb-expand-cols by the page.
export const RUNTIME_VARS = ['level', 'cat', 'expand-cols'];

// [foreground, background, minimum, what it is]. 4.5 for text, 3 for icons, focus rings and large text.
export const PAIRS = [
  ['ink', 'bg', 4.5, '正文'], ['ink', 'canvas', 4.5, '外框和侧栏上的正文'], ['ink', 'fill', 4.5, '小元素底色上的正文'], ['ink', 'selected', 4.5, '选中行的正文'],
  ['ink-2', 'bg', 4.5, '字段标签'], ['muted', 'bg', 4.5, '次要文字'], ['muted', 'canvas', 4.5, '侧栏上的次要文字'], ['muted', 'fill', 4.5, '小元素底色上的次要文字'], ['ink-2', 'canvas', 4.5, '侧栏的导航项'], ['ink', 'nav-selected', 4.5, '侧栏的当前项'], ['ink-2', 'nav-selected', 4.5, '侧栏当前项上的计数'], ['ink-2', 'nav-hover', 4.5, '侧栏悬停项'],
  ['faint', 'bg', 3, '图标、禁用文字'], ['faint', 'fill', 3, '小元素底色上的图标'],
  ['line-strong', 'bg', 3, '输入框和按钮的描边'], ['line-strong', 'canvas', 3, '外框上的控件描边'], ['line-strong', 'pop-bg', 3, '弹层里的控件描边'],
  ['on', 'action', 4.5, '主按钮文字'], ['on', 'action-hover', 4.5, '主按钮悬停时的文字'], ['on', 'action-press', 4.5, '主按钮按下时的文字'],
  ['blue', 'bg', 3, '焦点框、链接图标'],
  ['success', 'bg', 4.5, '成功文字'], ['warning', 'bg', 4.5, '警示文字'], ['danger', 'bg', 4.5, '错误文字'], ['info', 'bg', 4.5, '信息文字'],
  ['danger', 'danger-bg', 4.5, '错误提示框里的文字'], ['ink', 'warning-bg', 4.5, '警示提示框里的文字'], ['ink', 'warning-mark', 4.5, '待核对的值'],
  ['ink', 'success-bg', 4.5, '成功提示条里的文字'], ['ink', 'info-bg', 4.5, '信息提示条里的文字'], ['ink', 'danger-bg', 4.5, '错误提示条里的文字'],
  ...[1, 2, 3, 4, 5, 6].map(n => [`cat-${n}`, 'bg', 3, `分类色 ${n}（图标、标签色点）`]),
];

function rgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
}
const lum = hex => {
  const [r, g, b] = rgb(hex).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

export function lint() {
  const errors = [], defined = new Set([...variables().map(([n]) => n), ...RUNTIME_VARS]);
  const sources = [...list('src/', ['.css', '.css.in'])];
  const scripts = ['aham.js', ...list('examples/', ['.html', '.mjs', '.js'])];

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
      if (/[{;]color:var\(--wb-blue\)/.test(line) && !line.includes('.wb-stage-icon')) errors.push(`${at}: 文字用了主色。正文链接用正文色加下划线，主色只给主按钮、焦点和当前项标记`);
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
  for (const theme of ['light', 'dark']) {
    const value = Object.fromEntries(leaves(`color.${theme}`).map(([n, p]) => [n, resolve(p)]));
    for (const [fg, bg, min, what] of PAIRS) {
      const ratio = contrast(value[fg], value[bg]);
      if (ratio < min) errors.push(`对比度 ${theme}：${what} ${fg} ${value[fg]} / ${bg} ${value[bg]} = ${ratio.toFixed(2)}，要求 ${min}`);
    }
  }
  return errors;
}

// Contrast table for rules/2-视觉.md: node scripts/lint.mjs --table
export function table() {
  const rows = PAIRS.map(([fg, bg, min, what]) => {
    const v = t => resolve(`color.${t}.${fg}`), w = t => resolve(`color.${t}.${bg}`);
    return `| ${what} | \`${fg}\` / \`${bg}\` | ${contrast(v('light'), w('light')).toFixed(2)} | ${contrast(v('dark'), w('dark')).toFixed(2)} | ${min} |`;
  });
  return ['| 用途 | 前景 / 背景 | 亮色 | 暗色 | 要求 |', '|---|---|---|---|---|', ...rows].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--table')) { console.log(table()); process.exit(0); }
  const errors = lint();
  for (const e of errors) console.error(e);
  console.log(errors.length ? `${errors.length} 个问题` : `lint 通过（tokens ${tokens.$meta.version}）`);
  process.exit(errors.length ? 1 : 0);
}
