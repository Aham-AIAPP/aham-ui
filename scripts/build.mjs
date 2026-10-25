// Builds aham.css from tokens.json and src/, and aham.js from js/. Run: node scripts/build.mjs   Check only: --check
import {readFileSync, writeFileSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {parse, serialize, selectors} from './lib/css.mjs';

const root = new URL('../', import.meta.url);
const read = f => readFileSync(new URL(f, root), 'utf8');
export const tokens = JSON.parse(read('tokens.json'));

// Style sources: every src/NN-name.css, in the order of its number. A later file may refine an earlier one, never the
// reverse. Each file holds one family: structure, then variants, then states, then its environment overrides.
export const SOURCES = readdirSync(new URL('src/', root)).filter(f => /^\d\d-[\w-]+\.css$/.test(f)).sort();

// Environment overrides (screen size, pointer, contrast, motion) are written next to the component they change, in an
// @media or @container block. The build gathers the blocks of all files and emits one block per condition, in this
// order, after every component rule. Within a condition, rules keep file order. A condition not listed here fails the
// build, so a new breakpoint is a decision, not an accident.
export const ENVIRONMENTS = [
  '@container (max-width: {{breakpoint.bp-form}})',
  '@media (min-resolution: 2dppx)',
  '@media (min-width: {{breakpoint.bp-wide}})',
  '@media (max-width: {{breakpoint.bp-context}})',
  '@media (max-width: {{breakpoint.bp-mobile}})',
  '@media (pointer:coarse)',
  '@media (prefers-contrast: more)',
  '@media (prefers-contrast: more) and (prefers-color-scheme: dark)',
  '@media (prefers-reduced-motion: reduce)',
];
// Groups whose leaves become --wb-* variables on .aham-workbench. color.dark and color.contrast-more are applied separately.
export const VAR_GROUPS = ['font', 'text', 'space', 'radius', 'shadow', 'size', 'layout', 'breakpoint', 'z', 'motion'];

export function resolve(path, seen = []) {
  if (seen.includes(path)) throw new Error(`Cyclic token: ${path}`);
  const value = path.split('.').reduce((o, k) => o?.[k], tokens)?.$value;
  if (value === undefined) throw new Error(`Missing token: ${path}`);
  return String(value).replace(/\{([^}]+)\}/g, (_, p) => resolve(p, [...seen, path]));
}

// Leaves of one group: [name, tokenPath]. The leaf key is the variable name.
export function leaves(path) {
  const node = path.split('.').reduce((o, k) => o[k], tokens);
  return Object.entries(node).filter(([k, v]) => !k.startsWith('$') && v && typeof v === 'object' && '$value' in v).map(([k]) => [k, `${path}.${k}`]);
}

export function variables() {
  const all = [...VAR_GROUPS.flatMap(leaves), ...leaves('color.light')];
  const seen = new Set();
  for (const [name] of all) { if (seen.has(name)) throw new Error(`Duplicate variable name: ${name}`); seen.add(name); }
  const light = new Set(leaves('color.light').map(([n]) => n)), dark = new Set(leaves('color.dark').map(([n]) => n));
  for (const n of light) if (!dark.has(n)) throw new Error(`color.dark is missing ${n}`);
  for (const n of dark) if (!light.has(n)) throw new Error(`color.dark has ${n}, color.light does not`);
  return all;
}

const decl = list => list.map(([n, p]) => `  --wb-${n}: ${resolve(p)};`).join('\n');
const fill = s => s.replace(/\{\{([^}]+)\}\}/g, (_, p) => resolve(p));
// Placeholders hold dots and braces; keep them out of the parser's way.
const hide = s => s.replace(/\{\{([^}]+)\}\}/g, (_, p) => `\u0001${p}\u0002`);
const unhide = s => s.replace(/\u0001([^\u0002]+)\u0002/g, (_, p) => `{{${p}}}`);

// Hover styles apply only to a mouse or trackpad (rules/11-交互.md 11.3): a tap on a touch screen would otherwise leave the
// hover colour behind. A rule whose every selector has :hover is wrapped in place, so the cascade order does not change.
// A rule that shares its declarations with a focus state, or only uses :hover inside :not(), stays as it is.
const HOVER_MEDIA = '@media (hover: hover) and (pointer: fine)';
const hovers = sel => /:hover/.test(sel.replace(/:not\([^)]*\)/g, ''));
export function hoverOnly(nodes) {
  if (typeof nodes === 'string') return serialize(hoverOnly(parse(nodes)));
  return nodes.map(n => {
    if (n.type === 'rule' && !/focus/.test(n.selector) && selectors(n.selector).every(hovers)) return { type: 'at', name: 'media', prelude: HOVER_MEDIA.slice(7), children: [n] };
    if (n.children && !n.prelude.includes('hover')) return { ...n, children: hoverOnly(n.children) };
    return n;
  });
}

// Split one source file into component rules and environment blocks.
export function source(name) {
  const nodes = parse(hide(read(`src/${name}`)));
  const own = [], env = [];
  for (const n of nodes) {
    const head = n.type === 'at' && n.children && (n.name === 'media' || n.name === 'container') ? unhide(`@${n.name} ${n.prelude}`) : null;
    if (head && head !== '@media print') {
      if (!ENVIRONMENTS.includes(head)) throw new Error(`src/${name}: unknown environment "${head}". Add it to ENVIRONMENTS in scripts/build.mjs.`);
      env.push({ head, children: n.children });
    } else own.push(n);
  }
  return { own, env };
}

export function build() {
  const vars = variables();
  const fonts = read('assets/fonts/inter.css').replace(/url\('([^']+)'\)/g, "url('assets/fonts/$1')").replace(/\/\*[\s\S]*?\*\/\n?/, '');
  const dark = decl(leaves('color.dark'));
  const parts = [
    `/* Aham UI ${tokens.$meta.version}. Generated by scripts/build.mjs from tokens.json and src/. Do not edit this file. */`,
    `/* Inter Variable 4.1, SIL Open Font License 1.1, see assets/fonts/LICENSE.txt. */`,
    fonts.trim(),
    `.aham-workbench {\n  color-scheme: light;\n${decl(vars)}\n}`,
    `.aham-workbench[data-theme="dark"] {\n  color-scheme: dark;\n${dark}\n}`,
    `@media (prefers-color-scheme: dark) {\n.aham-workbench:not([data-theme="light"]) {\n  color-scheme: dark;\n${dark}\n}\n}`,
    // Paper is always light, whatever theme the screen uses.
    `@media print {\n.aham-workbench:is([data-theme], :not([data-theme])) {\n  color-scheme: light;\n${decl(leaves('color.light'))}\n}\n}`,
  ];
  const sources = SOURCES.map(name => ({ name, ...source(name) }));
  for (const { name, own } of sources) parts.push(`/* ---- src/${name} ---- */\n${fill(unhide(serialize(hoverOnly(own))))}`);
  parts.push('/* ---- Environment overrides, gathered from src/ by condition ---- */');
  for (const head of ENVIRONMENTS) {
    const children = sources.flatMap(s => s.env.filter(e => e.head === head).flatMap(e => e.children));
    if (children.length) parts.push(fill(unhide(serialize([{ type: 'at', ...splitHead(head), children }]))));
  }
  return parts.join('\n') + '\n';
}

// Behaviour sources: every js/NN-name.js, in the order of its number, joined into one ES module. The parts share one
// scope (the layer stack and shortcut registry must exist once), so they are fragments, not separate modules: a part
// may use any name declared in an earlier or later part, but a statement that runs at load may only use names above it.
export const SCRIPTS = readdirSync(new URL('js/', root)).filter(f => /^\d\d-[\w-]+\.js$/.test(f)).sort();
export function buildJS() {
  const seen = new Map();
  for (const name of SCRIPTS) {
    for (const m of read(`js/${name}`).matchAll(/^(?:export )?(?:async )?(?:function\*?|const|let|class)\s+([\w$]+)/gm)) {
      if (seen.has(m[1])) throw new Error(`js/${name}: ${m[1]} is already declared in js/${seen.get(m[1])}`);
      seen.set(m[1], name);
    }
  }
  return `// Aham UI ${tokens.$meta.version}. Generated by scripts/build.mjs from js/. Do not edit this file.\n` + SCRIPTS.map(name => read(`js/${name}`)).join('');
}

const splitHead = head => { const m = head.match(/^@(\w+)\s+(.*)$/); return { name: m[1], prelude: m[2] }; };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outputs = [['aham.css', build()], ['aham.js', buildJS()]];
  if (process.argv.includes('--check')) {
    const stale = outputs.filter(([f, text]) => read(f) !== text).map(([f]) => f);
    if (stale.length) { console.error(`${stale.join(' and ')} out of date. Run: node scripts/build.mjs`); process.exit(1); }
    console.log('aham.css and aham.js are up to date');
  } else for (const [f, text] of outputs) { writeFileSync(new URL(f, root), text); console.log(`Wrote ${f} (${text.length} bytes)`); }
}
