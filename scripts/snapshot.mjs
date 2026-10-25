// Prints a normalised view of aham.css and the aham.js export names, one item per line, for comparing two builds.
// Run: node scripts/snapshot.mjs [--rules | --selectors | --exports] > before.txt   (default: all three)
import {readFileSync} from 'node:fs';
import {parse, rules, declarations} from './lib/css.mjs';

const root = new URL('../', import.meta.url);
const css = readFileSync(new URL('aham.css', root), 'utf8');
const want = process.argv.slice(2);
const all = !want.length;
const out = [];
const norm = s => s.replace(/\s+/g, ' ').replace(/\s*([>,+~(){}])\s*/g, '$1').trim();
if (all || want.includes('--rules')) {
  for (const r of rules(parse(css))) {
    out.push(`${r.context.map(norm).join(' / ')} | ${norm(r.selector)} | ${declarations(r.body).map(([k, v]) => `${k}:${norm(v)}`).join(';')}`);
  }
}
if (all || want.includes('--selectors')) {
  const set = new Set();
  for (const r of rules(parse(css))) set.add(`${r.context.map(norm).join(' / ')} | ${norm(r.selector)}`);
  out.push(...[...set].sort().map(s => `selector ${s}`));
}
if (all || want.includes('--exports')) {
  const mod = await import(new URL('aham.js', root));
  out.push(...Object.keys(mod).sort().map(k => `export ${k}`));
}
console.log(out.join('\n'));
