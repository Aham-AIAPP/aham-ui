// Generates the neutral and accent colours of a theme from three inputs (rules/2-视觉.md 2.12):
//   base      the canvas colour (sidebar and frame); its hue and chroma tint every neutral
//   accent    the primary colour (primary button, focus ring)
//   contrast  30–100; 60 reproduces the hand-tuned tokens, higher darkens text and lines
// Work happens in CIE LCH (D65), so the same lightness step looks the same whatever the hue.
// The hand-tuned values in tokens.json are the reference: each key keeps its lightness offset from the base
// (or from the accent), and contrast scales the offsets of text and lines.
//   node scripts/theme.mjs --check                     checks the defaults and sample themes against the contrast pairs
//   node scripts/theme.mjs light '#F4F6F8' '#1F7A4D' 70   prints a generated light theme as JSON
import {fileURLToPath} from 'node:url';
import {tokens, resolve, leaves} from './build.mjs';
import {PAIRS, contrast} from './lint.mjs';

// ── Colour maths: sRGB hex ↔ CIE Lab ↔ LCH ───────────────────────────────────
const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const WHITE = [0.95047, 1, 1.08883];
const f = t => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
const fi = t => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));

export function hexToLch(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => lin(parseInt(h.slice(i, i + 2), 16) / 255));
  const xyz = [0.4124564 * r + 0.3575761 * g + 0.1804375 * b, 0.2126729 * r + 0.7151522 * g + 0.072175 * b, 0.0193339 * r + 0.119192 * g + 0.9503041 * b];
  const [fx, fy, fz] = xyz.map((v, i) => f(v / WHITE[i]));
  const L = 116 * fy - 16, a = 500 * (fx - fy), bb = 200 * (fy - fz);
  return [L, Math.hypot(a, bb), (Math.atan2(bb, a) * 180 / Math.PI + 360) % 360];
}
export function lchToHex([L, C, H]) {
  const a = C * Math.cos(H * Math.PI / 180), b = C * Math.sin(H * Math.PI / 180);
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const [x, y, z] = [fi(fx), L > 8 ? fy ** 3 : L / (24389 / 27), fi(fz)].map((v, i) => v * WHITE[i]);
  const rgb = [3.2404542 * x - 1.5371385 * y - 0.4985314 * z, -0.969266 * x + 1.8760108 * y + 0.041556 * z, 0.0556434 * x - 0.2040259 * y + 1.0572252 * z];
  return '#' + rgb.map(c => Math.round(Math.min(1, Math.max(0, gam(c))) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}
const lab = ([L, C, H]) => [L, C * Math.cos(H * Math.PI / 180), C * Math.sin(H * Math.PI / 180)];
export const deltaE = (x, y) => Math.hypot(...lab(hexToLch(x)).map((v, i) => v - lab(hexToLch(y))[i]));   // CIE76

// ── Generator ────────────────────────────────────────────────────────────────
export const NEUTRALS = ['bg', 'canvas', 'fill', 'hover', 'selected', 'nav-selected', 'line', 'line-strong', 'pop-bg', 'ink', 'ink-2', 'muted', 'faint'];
export const ACCENTS = ['blue', 'blue-bg', 'action', 'action-hover'];
const SCALED = new Set(['line', 'line-strong', 'ink', 'ink-2', 'muted', 'faint']);   // text and lines follow the contrast input
export const DEFAULTS = { light: { base: '#F4F4F1', accent: '#336EE8', contrast: 60 }, dark: { base: '#0B0B0B', accent: '#336EE8', contrast: 60 } };
const hand = mode => Object.fromEntries(leaves(`color.${mode}`).map(([n, p]) => [n, resolve(p)]));

export function generateTheme({ mode = 'light', base, accent, contrast: k } = {}) {
  const ref = hand(mode), d = DEFAULTS[mode];
  base ??= d.base; accent ??= d.accent; k = Math.min(100, Math.max(30, k ?? d.contrast));
  const [bL, bC, bH] = hexToLch(base), [rL, rC] = hexToLch(d.base);
  const out = {};
  for (const key of NEUTRALS) {
    const [L, C, H] = hexToLch(ref[key]);
    const dL = (L - rL) * (SCALED.has(key) ? k / d.contrast : 1);
    // A grey reference base carries no tint of its own: keep each key's hand-tuned tint unless the new base brings one.
    const [chroma, hue] = rC > 0.5 ? [C * (bC / rC), bH] : bC > 0.5 ? [C + bC, bH] : [C, H];
    out[key] = lchToHex([Math.min(100, Math.max(0, bL + dL)), Math.max(0, chroma), hue]);
  }
  const [aL, aC, aH] = hexToLch(accent), [qL, qC, qH] = hexToLch(DEFAULTS[mode].accent);
  // In the dark theme the hand-tuned primary is lighter than the input; keep that offset too.
  for (const key of ACCENTS) {
    const [L, C, H] = hexToLch(ref[key]);
    out[key] = lchToHex([Math.min(100, Math.max(0, aL + (L - qL))), Math.max(0, C * (aC / qC)), (aH + H - qH + 360) % 360]);
  }
  return out;
}

// Contrast pairs that a generated theme must still meet, with the hand-tuned colours filling in the keys it does not make.
export function checkTheme(mode, generated) {
  const value = { ...hand(mode), ...generated };
  return PAIRS.filter(([fg, bg]) => fg in value && bg in value)
    .map(([fg, bg, min, what]) => ({ fg, bg, min, what, ratio: contrast(value[fg], value[bg]) }))
    .filter(r => r.ratio < r.min);
}

export const SAMPLES = [
  { mode: 'light', base: '#F2F4F7', accent: '#1F7A4D', contrast: 60 },
  { mode: 'light', base: '#F6F3EE', accent: '#B42318', contrast: 70 },
  { mode: 'dark', base: '#0A0D12', accent: '#6E56CF', contrast: 60 },
];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [mode, base, accent, k] = process.argv.slice(2);
  if (mode && mode !== '--check') { console.log(JSON.stringify(generateTheme({ mode, base, accent, contrast: k && Number(k) }), null, 2)); process.exit(0); }
  let failed = 0;
  for (const m of ['light', 'dark']) {
    const g = generateTheme({ mode: m }), ref = hand(m);
    const far = Object.keys(g).filter(key => deltaE(g[key], ref[key]) > 3);
    for (const key of far) console.log(`${m} ${key}：生成 ${g[key]}，手调 ${ref[key]}，ΔE ${deltaE(g[key], ref[key]).toFixed(1)}`);
    for (const r of checkTheme(m, g)) { failed++; console.error(`${m} 默认主题：${r.what} ${r.ratio.toFixed(2)} < ${r.min}`); }
  }
  for (const s of SAMPLES) {
    for (const r of checkTheme(s.mode, generateTheme(s))) { failed++; console.error(`${s.mode} ${s.base} ${s.accent} ${s.contrast}：${r.what} ${r.ratio.toFixed(2)} < ${r.min}`); }
  }
  console.log(failed ? `${failed} 个对比度问题` : `主题生成检查通过（${SAMPLES.length} 个样例主题）`);
  process.exit(failed ? 1 : 0);
}
