// Design lint for the runtime CSS (DESIGN §7). Errors: a CSS variable (colour, size, font stack) disagrees with tokens.json, a HEX colour is not in
// the token palette, a common text / control pair misses its contrast minimum, a table rule draws vertical lines, or a
// stylesheet loads fonts from a third-party server. Warnings: border radii outside the radius scale.
// node scripts/lint-design.mjs → prints findings and exits 1 on errors. Tests import lint().
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const base = new URL('../design-system/', import.meta.url);
const read = f => readFileSync(new URL(f, base), 'utf8');
const tokens = JSON.parse(read('tokens.json'));
const at = path => path.split('.').reduce((o, k) => o?.[k], tokens);
function resolve(path, seen = []) {
  if (seen.includes(path)) throw new Error(`Cyclic token: ${path}`);
  const value = at(path)?.$value;
  if (value === undefined) throw new Error(`Missing token: ${path}`);
  return String(value).replace(/\{([^}]+)\}/g, (_, p) => resolve(p, [...seen, path]));
}
const norm = v => String(v).toLowerCase().replace(/\s+/g, '').replace(/rgba?\(([^)]*)\)/g, (_, inner) => `rgba(${inner.split(',').map(x => String(Number(x))).join(',')})`).replace(/(^|[,(\s])0\./g, '$1.');
const RUNTIME = ['aham-ui.css', 'colors_and_type.css', 'components.css', 'workbench.css', 'workbench-tokens.css'];

// CSS variable → token path, per stylesheet block. Only primitive values are listed; aliases built from var() are skipped.
const range = (prefix, group, keys) => Object.fromEntries(keys.map(k => [`${prefix}${k}`, `${group}.${k}`]));
const COLORS_LIGHT = {
  white: 'color.surface.tier1-white', panel: 'color.surface.tier2-panel', line: 'color.surface.tier3-line',
  ink: 'color.ink.primary', 'ink-2': 'color.ink.secondary', 'ink-3': 'color.ink.tertiary', 'ink-4': 'color.ink.quaternary', 'on-accent': 'color.ink.on-accent',
  accent: 'color.accent.default', 'accent-hover': 'color.accent.hover', 'accent-press': 'color.accent.press',
  'accent-tint': 'color.accent.tint-surface', 'accent-tint-border': 'color.accent.tint-border',
  success: 'color.semantic.success', 'success-bg': 'color.semantic.success-bg', warning: 'color.semantic.warning', 'warning-bg': 'color.semantic.warning-bg',
  danger: 'color.semantic.danger', 'danger-bg': 'color.semantic.danger-bg',
  'success-border': 'color.semantic.success-border', 'warning-border': 'color.semantic.warning-border', 'danger-border': 'color.semantic.danger-border',
  'action-bg': 'color.alias.action-bg', 'action-bg-hover': 'color.alias.action-bg-hover',
  'focus-ring': 'color.alias.focus-ring', overlay: 'color.alias.overlay', 'fill-hover': 'color.fill.hover', 'fill-active': 'color.fill.active',
};
const COLORS_DARK = {
  white: 'color.dark.surface.tier1-bg', panel: 'color.dark.surface.tier2-panel', line: 'color.dark.surface.tier3-line',
  ink: 'color.dark.ink.primary', 'ink-2': 'color.dark.ink.secondary', 'ink-3': 'color.dark.ink.tertiary', 'ink-4': 'color.dark.ink.quaternary',
  accent: 'color.dark.accent.default', 'accent-hover': 'color.dark.accent.hover', 'accent-press': 'color.dark.accent.press',
  'accent-tint': 'color.dark.accent.tint-surface', 'accent-tint-border': 'color.dark.accent.tint-border',
  success: 'color.dark.semantic.success', 'success-bg': 'color.dark.semantic.success-bg', warning: 'color.dark.semantic.warning', 'warning-bg': 'color.dark.semantic.warning-bg',
  danger: 'color.dark.semantic.danger', 'danger-bg': 'color.dark.semantic.danger-bg',
  'fill-hover': 'color.dark.fill.hover', 'fill-active': 'color.dark.fill.active', overlay: 'color.dark.overlay',
};
const AHAM_ROOT = {
  ...COLORS_LIGHT,
  'text-xs': 'typography.fontSize.xs', 'text-sm': 'typography.fontSize.sm', 'text-base': 'typography.fontSize.base', 'text-md': 'typography.fontSize.md',
  'text-lg': 'typography.fontSize.lg', 'text-xl': 'typography.fontSize.xl', 'text-2xl': 'typography.fontSize.2xl', 'text-3xl': 'typography.fontSize.3xl', 'text-display': 'typography.fontSize.display',
  'w-regular': 'typography.fontWeight.regular', 'w-medium': 'typography.fontWeight.medium', 'w-semibold': 'typography.fontWeight.semibold', 'w-bold': 'typography.fontWeight.bold',
  'font-sans': 'typography.fontFamily.sans', 'font-mono': 'typography.fontFamily.mono', 'font-features': 'typography.fontFeatureSettings',
  ...range('s', 'spacing', ['1', '2', '3', '4', '5', '6', '7', '8']),
  ...range('r-', 'radius', ['xs', 'sm', 'md', 'lg', 'xl', 'pill']),
  'sh-md': 'shadow.md', 'sh-pop': 'shadow.pop', 'sh-modal': 'shadow.modal',
  ...range('z-', 'zIndex', ['base', 'sticky', 'dropdown', 'overlay', 'modal', 'toast']),
  'dur-fast': 'motion.duration.fast', 'dur-base': 'motion.duration.base', 'dur-slow': 'motion.duration.slow',
  'ease-standard': 'motion.easing.standard', 'ease-out': 'motion.easing.out',
  'focus-ring-w': 'focusRing.width', 'focus-ring-offset': 'focusRing.offset',
  ...range('icon-', 'iconSize', ['sm', 'md', 'lg']),
  'ctrl-h-sm': 'density.compact.controlHeight', 'ctrl-h-md': 'density.standard.controlHeight', 'ctrl-h-lg': 'density.comfortable.controlHeight', 'row-h': 'density.standard.rowHeight',
  'rail-w': 'layout.rail-width', 'sidebar-w': 'layout.sidebar-width', 'rightbar-w': 'layout.rightbar-width', 'topbar-h': 'layout.topbar-height', 'control-h': 'layout.control-height', 'btn-h': 'layout.btn-height',
  'page-max': 'contentWidth.page', 'content-max': 'contentWidth.content', 'read-max': 'contentWidth.read', 'form-max': 'contentWidth.form', 'auth-max': 'contentWidth.auth', 'ultra-max': 'contentWidth.ultra',
  ...range('bp-w-', 'breakpoint.web', ['sm', 'md', 'lg', 'xl', '2xl']),
  'dialog-w': 'overlayWidth.dialog', 'modal-min': 'overlayWidth.modal-min', 'modal-w': 'overlayWidth.modal', 'modal-max': 'overlayWidth.modal-max', 'drawer-w': 'overlayWidth.drawer',
  'opacity-disabled': 'opacity.disabled', 'bw-1': 'border.width.thin', 'bw-2': 'border.width.thick',
};
const LEGACY_COLORS = {
  'aham-surface-tier1': 'color.surface.tier1-white', 'aham-surface-tier2': 'color.surface.tier2-panel', 'aham-surface-tier3': 'color.surface.tier3-line',
  'aham-ink-primary': 'color.ink.primary', 'aham-ink-secondary': 'color.ink.secondary', 'aham-ink-tertiary': 'color.ink.tertiary', 'aham-ink-quaternary': 'color.ink.quaternary', 'aham-ink-on-accent': 'color.ink.on-accent',
  'aham-accent-default': 'color.accent.default', 'aham-accent-hover': 'color.accent.hover', 'aham-accent-press': 'color.accent.press',
  'aham-accent-tint-border': 'color.accent.tint-border', 'aham-accent-tint-surface': 'color.accent.tint-surface',
  'aham-success': 'color.semantic.success', 'aham-success-bg': 'color.semantic.success-bg', 'aham-warning': 'color.semantic.warning', 'aham-warning-bg': 'color.semantic.warning-bg',
  'aham-danger': 'color.semantic.danger', 'aham-danger-bg': 'color.semantic.danger-bg', 'aham-fill-hover': 'color.fill.hover', 'aham-fill-active': 'color.fill.active',
  'color-focus-ring': 'color.alias.focus-ring', 'color-overlay': 'color.alias.overlay', 'focus-ring-color': 'focusRing.color',
  'color-action-bg': 'color.alias.action-bg', 'color-action-bg-hover': 'color.alias.action-bg-hover',
};
const LEGACY_ROOT = {
  ...LEGACY_COLORS,
  ...range('space-', 'spacing', ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']),
  ...range('radius-', 'radius', ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'pill']),
  'shadow-md': 'shadow.md', 'shadow-pop': 'shadow.pop', 'shadow-modal': 'shadow.modal', 'shadow-ring-focus': 'shadow.ring-focus',
  ...range('text-', 'typography.fontSize', ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', 'display']),
  ...range('weight-', 'typography.fontWeight', ['regular', 'medium', 'semibold', 'bold']),
  ...range('leading-', 'typography.lineHeight', ['tight', 'snug', 'normal', 'relaxed', 'cjk']),
  ...range('z-', 'zIndex', ['base', 'sticky', 'dropdown', 'overlay', 'modal', 'toast']),
  'duration-fast': 'motion.duration.fast', 'duration-base': 'motion.duration.base', 'duration-slow': 'motion.duration.slow',
  'focus-ring-width': 'focusRing.width', 'focus-ring-offset': 'focusRing.offset',
  ...range('icon-', 'iconSize', ['sm', 'md', 'lg']),
  'font-sans': 'typography.fontFamily.sans', 'font-mono': 'typography.fontFamily.mono', 'font-features': 'typography.fontFeatureSettings',
};
const LEGACY_DARK = Object.fromEntries(Object.entries({
  'aham-surface-tier1': 'surface.tier1-bg', 'aham-surface-tier2': 'surface.tier2-panel', 'aham-surface-tier3': 'surface.tier3-line',
  'aham-ink-primary': 'ink.primary', 'aham-ink-secondary': 'ink.secondary', 'aham-ink-tertiary': 'ink.tertiary', 'aham-ink-quaternary': 'ink.quaternary', 'aham-ink-on-accent': 'ink.on-accent',
  'aham-accent-default': 'accent.default', 'aham-accent-hover': 'accent.hover', 'aham-accent-press': 'accent.press',
  'aham-accent-tint-border': 'accent.tint-border', 'aham-accent-tint-surface': 'accent.tint-surface',
  'aham-success': 'semantic.success', 'aham-success-bg': 'semantic.success-bg', 'aham-warning': 'semantic.warning', 'aham-warning-bg': 'semantic.warning-bg',
  'aham-danger': 'semantic.danger', 'aham-danger-bg': 'semantic.danger-bg', 'aham-fill-hover': 'fill.hover', 'aham-fill-active': 'fill.active',
  'color-overlay': 'overlay', 'focus-ring-color': 'accent.default',
}).map(([k, v]) => [k, `color.dark.${v}`]));

// Text and control pairs the runtime actually uses: [label, foreground, background, minimum].
const PAIRS = [
  ...['tier1-white', 'tier2-panel', 'tier3-line'].map(s => [`正文 / ${s}`, 'color.ink.primary', `color.surface.${s}`, 4.5]),
  ...['tier1-white', 'tier2-panel'].map(s => [`次级文字 / ${s}`, 'color.ink.secondary', `color.surface.${s}`, 4.5]),
  ['主按钮白字', 'color.ink.on-accent', 'color.alias.action-bg', 4.5], ['主按钮悬停白字', 'color.ink.on-accent', 'color.alias.action-bg-hover', 4.5],
  ['文字链接', 'color.accent.default', 'color.surface.tier1-white', 4.5],
  ...['success', 'warning', 'danger'].map(k => [`${k} 文字 / 白底`, `color.semantic.${k}`, 'color.surface.tier1-white', 4.5]),
  ...['success', 'warning', 'danger'].map(k => [`通知正文 / ${k}-bg`, 'color.ink.primary', `color.semantic.${k}-bg`, 4.5]),
  ['焦点描边 / 白底', 'focusRing.color', 'color.surface.tier1-white', 3],
  ['高对比度控件边界 / 白底', 'color.contrastMore.control-border', 'color.surface.tier1-white', 3],
  ...['tier1-bg', 'tier2-panel', 'tier3-line'].map(s => [`暗色正文 / ${s}`, 'color.dark.ink.primary', `color.dark.surface.${s}`, 4.5]),
  ...['tier1-bg', 'tier2-panel'].map(s => [`暗色次级文字 / ${s}`, 'color.dark.ink.secondary', `color.dark.surface.${s}`, 4.5]),
  ['暗色文字链接', 'color.dark.accent.default', 'color.dark.surface.tier1-bg', 4.5],
  ...['success', 'warning', 'danger'].map(k => [`暗色 ${k} 文字`, `color.dark.semantic.${k}`, 'color.dark.surface.tier1-bg', 4.5]),
  ...['success', 'warning', 'danger'].map(k => [`暗色通知正文 / ${k}-bg`, 'color.dark.ink.primary', `color.dark.semantic.${k}-bg`, 4.5]),
  ['暗色焦点描边', 'color.dark.accent.default', 'color.dark.surface.tier1-bg', 3],
  ['暗色高对比度控件边界', 'color.dark.contrastMore.control-border', 'color.dark.surface.tier1-bg', 3],
];
const lum = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

function block(css, opener) {
  const i = css.indexOf(opener);
  if (i < 0) return null;
  return css.slice(i + opener.length, css.indexOf('}', i));
}
const varsOf = text => new Map([...text.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
const expand = h => (h.length === 4 ? `#${[...h.slice(1)].map(c => c + c).join('')}` : h).toUpperCase();

export function lint() {
  const errors = [], warnings = [];
  let checked = 0;
  const compare = (file, label, text, map) => {
    if (text == null) { errors.push(`${file}: missing block ${label}`); return; }
    const vars = varsOf(text);
    for (const [name, path] of Object.entries(map)) {
      checked++;
      if (!vars.has(name)) { errors.push(`${file} ${label}: --${name} missing (tokens: ${path})`); continue; }
      const want = resolve(path);
      if (norm(vars.get(name)) !== norm(want)) errors.push(`${file} ${label}: --${name} is ${vars.get(name)}, tokens ${path} is ${want}`);
    }
  };
  const aham = read('aham-ui.css'), legacy = read('colors_and_type.css');
  compare('aham-ui.css', ':root', block(aham, ':root {'), AHAM_ROOT);
  compare('aham-ui.css', '[data-theme="dark"]', block(aham, '[data-theme="dark"]{'), COLORS_DARK);
  compare('aham-ui.css', 'prefers-color-scheme: dark', block(aham, ':root:not([data-theme="light"]){'), COLORS_DARK);
  compare('colors_and_type.css', ':root', block(legacy, ':root {'), LEGACY_ROOT);
  compare('colors_and_type.css', '.dark', block(legacy, '.dark {'), LEGACY_DARK);

  const palette = new Set();
  (function walk(o) { for (const [k, v] of Object.entries(o)) { if (k.startsWith('$') || !v || typeof v !== 'object') continue; if ('$value' in v) (String(v.$value).match(/#[0-9a-fA-F]{6}\b/g) || []).forEach(h => palette.add(h.toUpperCase())); else walk(v); } })(tokens);
  for (const file of RUNTIME) {
    const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const h of css.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || []) { checked++; if (!palette.has(expand(h))) errors.push(`${file}: colour ${h} is not in the tokens.json palette`); }
    if (/@import\s+url\(\s*['"]?https?:|url\(\s*['"]?https?:\/\//.test(css)) errors.push(`${file}: loads a resource from a third-party server (DESIGN §1.11)`);
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const [, selector, body] = m;
      if (/(^|[\s,.>])(table|td|th)\b|-table\b/.test(selector) && !/::?(before|after)/.test(selector) && /border-(left|right|inline-start|inline-end)\s*:\s*(?!0|none)/.test(body)) errors.push(`${file}: vertical table rule in "${selector.trim().slice(0, 80)}"`);
      for (const r of body.matchAll(/border-radius\s*:\s*([^;]+)/g)) for (const part of r[1].replace(/var\([^)]*\)/g, '').trim().split(/\s+/).filter(Boolean)) {
        // ≤2px corners on hairlines and shape markers (speaker squares / diamonds, the drag insertion line) are not radius tiers.
        if (/^\d/.test(part) && !['0', '0px', '50%'].includes(part) && !(parseFloat(part) <= 2 && part.endsWith('px')) && !Object.entries(tokens.radius).some(([k, v]) => !k.startsWith('$') && v.$value === part)) warnings.push(`${file}: radius ${part} off the scale in "${selector.trim().slice(0, 60)}"`);
      }
    }
  }
  for (const [label, fg, bg, min] of PAIRS) {
    checked++;
    const ratio = contrast(resolve(fg), resolve(bg));
    if (ratio < min) errors.push(`contrast ${label}: ${ratio.toFixed(2)}:1 < ${min}:1 (${resolve(fg)} on ${resolve(bg)})`);
  }
  return { errors, warnings, checked };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { errors, warnings, checked } = lint();
  for (const w of warnings) console.warn(`warning  ${w}`);
  for (const e of errors) console.error(`error    ${e}`);
  console.log(`Design lint: ${checked} checks, ${errors.length} errors, ${warnings.length} warnings`);
  if (errors.length) process.exit(1);
}
