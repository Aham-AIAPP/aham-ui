// Checks components/*.json. Run: node scripts/contracts.mjs   (exit 1 on any error; --coverage lists unclaimed classes)
//   1. Each contract matches components/schema.json (the subset of JSON Schema it uses: type, required, enum,
//      properties, items, additionalProperties).
//   2. slug is the file name; index.json lists every contract once, with the same name and specification.
//   3. Every wb- class in classes and markup exists in aham.css.
//   4. Every function named in api is exported by aham.js, unless the contract says "sample": true.
//   5. specification points at a rules/ file and a heading in it; preview and reference exist.
//   6. Every class in aham.css is claimed by a contract.
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root = new URL('../', import.meta.url);
const read = f => readFileSync(new URL(f, root), 'utf8');
const json = f => JSON.parse(read(f));

const typeOf = v => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);
export function validate(value, schema, at = '') {
  const errors = [];
  const types = [schema.type].flat().filter(Boolean);
  if (types.length && !types.includes(typeOf(value))) return [`${at || '/'}: 应为 ${types.join(' 或 ')}，实际是 ${typeOf(value)}`];
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${at}: 取值 ${JSON.stringify(value)} 不在 ${JSON.stringify(schema.enum)} 里`);
  if (typeOf(value) === 'object') {
    for (const k of schema.required ?? []) if (!(k in value)) errors.push(`${at}/${k}: 缺少必填字段`);
    for (const [k, v] of Object.entries(value)) {
      const sub = schema.properties?.[k];
      if (sub) errors.push(...validate(v, sub, `${at}/${k}`));
      else if (schema.additionalProperties === false) errors.push(`${at}/${k}: schema 里没有这个字段`);
    }
  }
  if (typeOf(value) === 'array' && schema.items) value.forEach((v, i) => errors.push(...validate(v, schema.items, `${at}/${i}`)));
  return errors;
}

// Heading anchors as GitHub makes them: lower case, punctuation removed, spaces to hyphens.
const anchor = text => text.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-');
// Functions an api text calls: name( outside any { } and not after a dot (callbacks and methods are left out).
function calls(text) {
  const out = [];
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (depth === 0 && /[a-z]/i.test(c) && !/[\w.]/.test(text[i - 1] ?? '')) {
      const m = /^([a-zA-Z]\w*)\(/.exec(text.slice(i));
      if (m) out.push(m[1]);
      i += (m?.[1] ?? /^\w*/.exec(text.slice(i))[0]).length - 1;
    }
  }
  return out;
}
const classesIn = text => [...String(text).matchAll(/\bwb-[a-z0-9]+(?:-[a-z0-9]+)*/g)].map(m => m[0]);

export async function contracts() {
  const errors = [];
  const schema = json('components/schema.json');
  const files = readdirSync(new URL('components/', root)).filter(f => f.endsWith('.json') && !['index.json', 'schema.json'].includes(f));
  const index = json('components/index.json').components;
  const css = read('aham.css');
  const cssClasses = new Set([...css.matchAll(/\.(wb-[a-z0-9-]+)/g)].map(m => m[1]));
  const exported = new Set(Object.keys(await import(new URL('aham.js', root))));
  const claimed = new Set();

  for (const f of files) {
    const c = json(`components/${f}`), at = `components/${f}`;
    errors.push(...validate(c, schema).map(e => `${at}${e}`));
    if (c.slug !== f.replace(/\.json$/, '')) errors.push(`${at}: slug ${c.slug} 和文件名不同`);
    const entry = index.filter(e => e.slug === c.slug);
    if (entry.length !== 1) errors.push(`${at}: index.json 里出现 ${entry.length} 次，应为 1 次`);
    else {
      if (entry[0].name !== c.name) errors.push(`${at}: 名称和 index.json 不同（${c.name} / ${entry[0].name}）`);
      if (entry[0].specification !== c.specification) errors.push(`${at}: specification 和 index.json 不同`);
    }
    // Classes: the classes list and class="…" attributes in the markup.
    const named = [...(c.classes ?? []).flatMap(classesIn), ...Object.values(c.markup ?? {}).flatMap(m => [...String(m).matchAll(/class="([^"]*)"/g)].flatMap(x => classesIn(x[1])))];
    for (const n of new Set(named)) { if (cssClasses.has(n)) claimed.add(n); else errors.push(`${at}: 类名 ${n} 在 aham.css 里不存在`); }
    // API: names written as name( in the api text or as the keys of an api object.
    const api = typeof c.api === 'object' ? Object.keys(c.api) : calls(String(c.api ?? ''));
    if (!c.sample) for (const n of new Set(api)) if (!exported.has(n)) errors.push(`${at}: api 里的 ${n} 不是 aham.js 的导出`);
    // Links.
    const [file, hash] = c.specification.split('#');
    if (!existsSync(new URL(file, root))) errors.push(`${at}: specification 指向的 ${file} 不存在`);
    else if (hash && ![...read(file).matchAll(/^#{1,4} (.+)$/gm)].some(m => anchor(m[1]) === hash)) errors.push(`${at}: ${file} 里没有标题锚点 #${hash}`);
    for (const k of ['preview', 'reference']) if (c[k] && !existsSync(new URL(c[k], root))) errors.push(`${at}: ${k} 指向的 ${c[k]} 不存在`);
  }
  for (const e of index) if (!files.includes(`${e.slug}.json`)) errors.push(`components/index.json: ${e.slug} 没有对应的契约文件`);
  const unclaimed = [...cssClasses].filter(n => !claimed.has(n)).sort();
  for (const n of unclaimed) errors.push(`aham.css: 类名 ${n} 没有写进任何契约`);
  return { errors, coverage: { total: cssClasses.size, claimed: claimed.size, unclaimed } };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { errors, coverage } = await contracts();
  for (const e of errors) console.error(e);
  console.log(`契约认领 ${coverage.claimed} / ${coverage.total} 个类名`);
  console.log(errors.length ? `${errors.length} 个问题` : '契约检查通过');
  process.exit(errors.length ? 1 : 0);
}
