// Fills the generated regions of index.html (<!-- @gen:name --> … <!-- @end:name -->) from the package files,
// so every value, count and list on the panorama page comes from tokens.json, icons.json, components/,
// library-consumption.json, DESIGN.md, WORKBENCH.md and CHANGELOG.md. Hand-written parts stay untouched.
// --check: fail when index.html is out of date instead of writing it.
import {readFileSync, writeFileSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
const json = p => JSON.parse(read(p));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const ds = 'design-system/';
const tokens = json(`${ds}tokens.json`);
const at = path => path.split('.').reduce((o, k) => o?.[k], tokens);
// Same reference resolution as scripts/build-workbench.mjs ("{group.key}" → value), kept local so importing has no side effects.
function resolve(path, seen = []) {
  if (seen.includes(path)) throw new Error(`Cyclic token: ${path}`);
  const value = at(path)?.$value;
  if (value === undefined) throw new Error(`Missing token: ${path}`);
  return String(value).replace(/\{([^}]+)\}/g, (_, p) => resolve(p, [...seen, path]));
}
const entries = o => Object.entries(o).filter(([k]) => !k.startsWith('$'));

// ── Color helpers ────────────────────────────────────────────────────────────
const lum = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const ratio = r => `${r >= 10 ? r.toFixed(1) : r.toFixed(2)} : 1`;

// Labels and group notes come from the previous panorama page; values always come from tokens.json.
const COLOR_GROUPS = [
  { title: '表面 Surface', note: '深度的唯一来源——层差，无暖调。', path: 'color.surface', dark: 'color.dark.surface', items: [['tier1-white', '内容 / 卡片', 'tier1-bg'], ['tier2-panel', '面板 / 侧栏', 'tier2-panel'], ['tier3-line', '线 / 选中', 'tier3-line']] },
  { title: '强调蓝 Accent', note: '唯一色相，点缀用：logo、主操作、选中、链接。', path: 'color.accent', dark: 'color.dark.accent', text: ['default'], items: [['default', '默认', 'default'], ['hover', '悬停', 'hover'], ['press', '按下', 'press'], ['tint-surface', '浅底'], ['tint-border', '浅描边']] },
  { title: '文字 Ink', note: '对齐 Apple label 的四级递减，取值 Aham。', path: 'color.ink', dark: 'color.dark.ink', text: ['primary', 'secondary', 'tertiary', 'quaternary'], items: [['primary', '主 / 正文', 'primary'], ['secondary', '次要', 'secondary'], ['tertiary', '三级 / 占位', 'tertiary'], ['quaternary', '四级 / 分隔', 'quaternary'], ['on-accent', '蓝底文字', 'on-accent']] },
  { title: '语义 Semantic', note: '极弱，只用于真实风险；禁红黄绿灯。', path: 'color.semantic', dark: 'color.dark.semantic', text: ['success', 'warning', 'danger'], items: [['success', '成功', 'success'], ['success-bg', '成功底'], ['warning', '警示', 'warning'], ['warning-bg', '警示底'], ['danger', '危险', 'danger'], ['danger-bg', '危险底']] },
];

function colors() {
  const bg = resolve('color.surface.tier1-white'), darkBg = resolve('color.dark.surface.tier1-bg');
  const accent = resolve('color.accent.default'), darkAccent = resolve('color.dark.accent.default');
  const card = g => {
    const rows = g.items.map(([key, label, darkKey]) => {
      const light = resolve(`${g.path}.${key}`), dark = darkKey ? resolve(`${g.dark}.${darkKey}`) : null;
      let cr = '';
      if (g.text?.includes(key)) cr = `对白底 ${ratio(contrast(light, bg))}${dark ? ` · 深色 ${ratio(contrast(dark, darkBg))}` : ''}`;
      if (key === 'on-accent') cr = `对蓝底 ${ratio(contrast(light, accent))}${dark ? ` · 深色 ${ratio(contrast(dark, darkAccent))}` : ''}`;
      return `<li class="pano-swatch"><span class="pano-chips"><span style="background:${light}" title="浅色 ${light}"></span>${dark ? `<span style="background:${dark}" title="深色 ${dark}"></span>` : ''}</span><span class="pano-swatch-text"><strong>${esc(label)}</strong><code>${g.path}.${key}</code><span class="mono">${light}${dark ? ` · 深色 ${dark}` : ' · 深色未定义'}</span>${cr ? `<span>${cr}</span>` : ''}</span></li>`;
    }).join('');
    return `<article class="pano-card"><header class="pano-card-head"><h3>${g.title}</h3><p>${esc(g.note)}</p></header><ul class="pano-swatches">${rows}</ul></article>`;
  };
  return `${COLOR_GROUPS.map(card).join('\n')}\n<p class="pano-foot">${esc(at('color.dark').$description)}。对比度按 WCAG 2 公式计算，正文要求至少 4.5 : 1。</p>`;
}

const FAMILY = { sans: 'var(--font-sans)', sansDisplay: 'var(--font-sans-display)', mono: 'var(--font-mono)' };
const STYLE_NAME = k => (k === 'bodyL' ? 'Body-L' : k[0].toUpperCase() + k.slice(1));
function type() {
  const rows = entries(tokens.textStyles).map(([key, s]) => {
    const size = s.fontSize.$value, lh = s.lineHeight?.$value, weight = s.fontWeight.$value, fam = s.fontFamily.$value;
    const px = size === 'inherit' ? '14px' : size;
    const sample = fam === 'mono' ? '0123456789 · ¥128,400.00' : 'Aham 设计系统';
    const spec = [size === 'inherit' ? '随所在样式' : size.replace('px', ''), lh, weight].filter(Boolean).join(' / ');
    return `<li class="pano-type"><div class="pano-type-meta"><strong>${STYLE_NAME(key)}</strong><span class="mono">${esc(spec)}</span><code>textStyles.${key}</code></div><div class="pano-type-sample" style="font:${weight} ${px}/${lh || 1.4} ${FAMILY[fam] || FAMILY.sans}">${sample}</div><p>${esc(s.$description || '')}</p></li>`;
  }).join('');
  return `<ul class="pano-types">${rows}</ul>`;
}

function space() {
  const spacing = entries(tokens.spacing).map(([k, v]) => `<li><code>spacing.${k}</code><span class="pano-bar" style="width:${v.$value === '0' ? '1px' : v.$value}"></span><span class="mono">${v.$value}</span></li>`).join('');
  const radius = entries(tokens.radius).map(([k, v]) => `<li><span class="pano-radius" style="border-radius:${v.$value}"></span><code>radius.${k}</code><span class="mono">${v.$value}</span>${v.$description ? `<span>${esc(v.$description)}</span>` : ''}</li>`).join('');
  const shadows = entries(tokens.shadow);
  const flat = shadows.filter(([, v]) => v.$value === 'none').map(([k]) => `<code>shadow.${k}</code>`).join(' ');
  const lifted = shadows.filter(([, v]) => v.$value !== 'none').map(([k, v]) => `<li><span class="pano-shadow" style="box-shadow:${v.$value}"></span><code>shadow.${k}</code><span class="mono">${esc(v.$value)}</span>${v.$description ? `<span>${esc(v.$description)}</span>` : ''}</li>`).join('');
  const motion = [...entries(tokens.motion.duration).map(([k, v]) => [`motion.duration.${k}`, v.$value]), ...entries(tokens.motion.easing).map(([k, v]) => [`motion.easing.${k}`, v.$value])];
  const bps = entries(tokens.breakpoint.web).map(([k, v]) => [`breakpoint.web.${k}`, v.$value, v.$description]);
  const kv = (label, rows) => `<div class="pano-scroll is-fluid" tabindex="0" role="region" aria-label="${label}，可横向滚动"><table class="doc-table pano-kv"><tbody>${rows.map(([k, v, d]) => `<tr><td><code>${k}</code></td><td class="mono">${esc(v)}</td><td class="t-2">${esc(d || '')}</td></tr>`).join('')}</tbody></table></div>`;
  return `<div class="pano-grid-2">
<article class="pano-card"><header class="pano-card-head"><h3>间距 Spacing</h3><p>4 基刻度，留白是首要分隔</p></header><ul class="pano-spacing">${spacing}</ul></article>
<article class="pano-card"><header class="pano-card-head"><h3>圆角 Radius</h3></header><ul class="pano-radii">${radius}</ul></article>
<article class="pano-card"><header class="pano-card-head"><h3>阴影 Shadow</h3><p>静置与悬停无阴影，只有浮层有一层</p></header><ul class="pano-shadows">${lifted}</ul><p class="pano-foot">值为 none：${flat}</p></article>
<article class="pano-card"><header class="pano-card-head"><h3>动效与断点</h3><p>${esc(tokens.motion.$description)}</p></header>${kv('动效', motion)}${kv('断点', bps)}</article>
</div>`;
}

function icons() {
  const list = json(`${ds}icons/icons.json`).icons;
  const groups = new Map();
  for (const i of list) groups.set(i.category, [...(groups.get(i.category) || []), i]);
  const meta = json(`${ds}icons/icons.json`).$meta;
  return [...groups].map(([cat, items]) => `<h3 class="pano-sub">${esc(cat)} <span>${items.length}</span></h3><ul class="pano-icons">${items.map(i => `<li title="${esc(i.usage)}（Lucide：${esc(i.lucide)}）"><svg class="icon" aria-hidden="true"><use href="#i-${i.name}"/></svg><span>${esc(i.name)}</span></li>`).join('')}</ul>`).join('\n') + `\n<p class="pano-foot">引用写法（路径相对 design-system/）：<code>${esc(meta.usage)}</code></p>`;
}

function sprite() {
  const svg = read(`${ds}icons/aham-icons.svg`).replace(/<\?xml[^>]*>\s*/, '').trim();
  return svg.replace(/^<svg\b[^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" class="pano-sprite" aria-hidden="true">');
}

const contracts = () => json(`${ds}components/index.json`).components.map(({ slug, name }) => ({ ...json(`${ds}components/${slug}.json`), name }));
function baseContracts() {
  const rows = contracts().filter(c => !c.implementation).map(c => `<tr><td>${esc(c.name)}</td><td><code>${c.slug}</code></td><td><a href="${ds}preview/component-${c.slug}.html">预览</a> · <a href="${ds}components/${c.slug}.json">契约</a></td></tr>`).join('');
  return `<table class="doc-table"><thead><tr><th>组件</th><th>slug</th><th>文件</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function baseExamples() {
  const listed = new Set(json(`${ds}library-consumption.json`).readingOrder.map(r => r.file));
  const pages = readdirSync(new URL(`${ds}examples/`, root)).filter(f => f.endsWith('.html') && !listed.has(`examples/${f}`)).sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)));
  const title = f => (read(`${ds}examples/${f}`).match(/<title>([^<]*)<\/title>/)?.[1] || f).replace(/^Aham UI\s*·\s*/, '');
  const layouts = readdirSync(new URL(`${ds}preview/`, root)).filter(f => f.startsWith('layout-')).sort();
  const ltitle = f => (read(`${ds}preview/${f}`).match(/<title>([^<]*)<\/title>/)?.[1] || f).replace(/\s*—\s*Aham$/, '');
  return `<ul class="pano-links">${pages.map(f => `<li><a href="${ds}examples/${f}">${esc(title(f))}</a><code>examples/${f}</code></li>`).join('')}${layouts.map(f => `<li><a href="${ds}preview/${f}">${esc(ltitle(f))}</a><code>preview/${f}</code></li>`).join('')}</ul>`;
}

function wbTokens() {
  const rows = entries(tokens.workbench).map(([k, v]) => {
    const raw = String(v.$value), ref = raw.match(/^\{([^}]+)\}$/)?.[1];
    return `<tr><td><code>workbench.${k}</code></td><td class="mono">${esc(resolve(`workbench.${k}`))}</td><td class="t-2">${ref ? `<code>${ref}</code> ` : ''}${esc(v.$description || '')}</td></tr>`;
  }).join('');
  return `<div class="pano-scroll" tabindex="0" role="region" aria-label="工作台尺寸表，可横向滚动"><table class="doc-table pano-kv"><thead><tr><th>token</th><th>值</th><th>来源与说明</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function wbContracts() {
  const rows = contracts().filter(c => c.implementation).map(c => `<tr><td><a href="${ds}components/${c.slug}.json"><code>${c.slug}</code></a></td><td>${esc(c.intent || '')}</td><td class="t-2">${esc((c.specification || '').replace('WORKBENCH.md', 'WORKBENCH').trim())}</td></tr>`).join('');
  return `<div class="pano-scroll" tabindex="0" role="region" aria-label="工作台契约表，可横向滚动"><table class="doc-table"><thead><tr><th>契约</th><th>用途</th><th>规范</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function wbPages() {
  const order = json(`${ds}library-consumption.json`).readingOrder;
  const group = (title, prefix) => `<h3 class="pano-sub">${title}</h3><ul>${order.filter(r => r.file.startsWith(prefix)).map(r => {
    const page = read(`${ds}${r.file}`);
    const t = r.file.startsWith('preview/') ? (page.match(/<h1[^>]*>([^<]*)<\/h1>/)?.[1] || r.file).replace(/\s*·\s*状态预览$/, '') : (page.match(/<title>([^<]*)<\/title>/)?.[1] || r.file).replace(/^Aham UI\s*·\s*/, '');
    return `<li><a href="${ds}${r.file}" data-sample>${esc(t)}<span>${esc(r.purpose)}</span></a></li>`;
  }).join('')}</ul>`;
  return group('页面示例', 'examples/') + group('状态预览', 'preview/workbench-');
}

function reading() {
  return `<ol class="pano-reading">${json(`${ds}library-consumption.json`).readingOrder.filter(r => r.priority <= 7 && !r.file.startsWith('preview/')).map(r => `<li><a href="${ds}${r.file}"><code>${r.file}</code></a><span>${esc(r.purpose)}</span></li>`).join('')}</ol>`;
}
function files() {
  const rows = json(`${ds}library-consumption.json`).readingOrder.map(r => `<tr><td class="num">${r.priority}</td><td><a href="${ds}${r.file}"><code>${r.file}</code></a></td><td>${esc(r.purpose)}</td></tr>`).join('');
  return `<div class="pano-scroll" tabindex="0" role="region" aria-label="读取顺序表，可横向滚动"><table class="doc-table"><thead><tr><th class="num">顺序</th><th>文件</th><th>用途</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function structure() {
  const heads = (file, re) => read(file).split('\n').map(l => l.match(re)?.[1]).filter(Boolean);
  const list = (title, file, items) => `<article class="pano-card"><header class="pano-card-head"><h3>${title}</h3><p><a href="${file}"><code>${file.replace(ds, '')}</code></a></p></header><ol class="pano-toc">${items.map(t => `<li>${esc(t)}</li>`).join('')}</ol></article>`;
  return `<div class="pano-grid-2">${list('基础规范', `${ds}DESIGN.md`, heads(`${ds}DESIGN.md`, /^## (.+)$/))}${list('网页工作台', `${ds}WORKBENCH.md`, heads(`${ds}WORKBENCH.md`, /^## (.+)$/))}</div>`;
}

function release() {
  const log = read('CHANGELOG.md');
  const m = log.match(/^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})\n+> ([^\n]+)/m);
  if (!m) throw new Error('CHANGELOG.md has no released version with a summary line');
  const summary = esc(m[3]).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
  return `<p class="pano-release"><span class="mono">v${m[1]} · ${m[2]}</span>${summary} <a href="CHANGELOG.md">全部更新记录</a></p>`;
}

function stats(html) {
  let leaves = 0;
  (function walk(o) { for (const [k, v] of Object.entries(o)) { if (k.startsWith('$') || !v || typeof v !== 'object') continue; if ('$value' in v) leaves++; else walk(v); } })(tokens);
  const all = contracts(), wb = all.filter(c => c.implementation).length;
  const gallery = html.slice(html.indexOf('<section id="components"'), html.indexOf('</section>', html.indexOf('<section id="components"')));
  const tiles = (gallery.match(/class="pano-tile[ "]/g) || []).length;
  const order = json(`${ds}library-consumption.json`).readingOrder;
  const metric = (k, v, u, d) => `<div class="metric"><span class="k">${k}</span><span class="v">${v}<span class="u">${u}</span></span><span class="d">${d}</span></div>`;
  return [
    metric('设计 token', leaves, '个', 'tokens.json 全部取值'),
    metric('文本样式', entries(tokens.textStyles).length, '种', '字号 + 字重分层'),
    metric('图标', json(`${ds}icons/icons.json`).icons.length, '个', 'Lucide（ISC）'),
    metric('基础组件契约', all.length - wb, '个', `组件样本 ${tiles} 个`),
    metric('工作台契约', wb, '个', `预览 ${order.filter(r => r.file.startsWith('preview/workbench-')).length} 页 · 示例 ${order.filter(r => r.file.startsWith('examples/')).length} 页`),
  ].join('');
}

const version = () => `v${tokens.$meta.version}`;

const REGIONS = { sprite, version, stats, reading, colors, type, space, icons, 'base-contracts': baseContracts, 'base-examples': baseExamples, 'wb-tokens': wbTokens, 'wb-contracts': wbContracts, 'wb-pages': wbPages, structure, release, files };

export function build(html) {
  for (const [name, fn] of Object.entries(REGIONS)) {
    const re = new RegExp(`(<!-- @gen:${name} -->)[\\s\\S]*?(<!-- @end:${name} -->)`, 'g');
    const hits = html.match(re)?.length || 0;
    if (!hits) throw new Error(`index.html is missing the generated region "${name}"`);
    html = html.replace(re, (_, open, close) => `${open}${fn(html)}${close}`);
  }
  return html;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = new URL('index.html', root), current = readFileSync(target, 'utf8'), next = build(current);
  if (process.argv.includes('--check')) {
    if (next !== current) { console.error('index.html is out of date. Run node scripts/build-panorama.mjs'); process.exit(1); }
  } else if (next !== current) writeFileSync(target, next);
  console.log(`Panorama OK: ${fileURLToPath(target)}`);
}
