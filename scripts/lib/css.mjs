// A small CSS reader for the build, lint and snapshot scripts. It understands what src/ uses: comments, strings,
// rules, and at-rules with or without a block. It does not validate CSS.
//
// parse(text) → nodes
//   { type: 'rule', selector, body }            body is the raw declaration text
//   { type: 'at', name, prelude, children }     block at-rule (@media, @supports, @starting-style, @container, @layer)
//   { type: 'at', name, prelude, body }         at-rule whose block holds declarations (@font-face, @page, @keyframes)
//   { type: 'at', name, prelude }               statement at-rule (@import)
//   { type: 'comment', text }
const NESTING = new Set(['media', 'supports', 'starting-style', 'container', 'layer', 'document']);

export function parse(text) {
  let i = 0;
  const n = text.length;
  function skipSpace() { while (i < n && /\s/.test(text[i])) i++; }
  // Read up to (not including) one of the stop characters at depth 0, honouring strings and comments.
  function readUntil(stops) {
    let out = '', depth = 0;
    while (i < n) {
      const c = text[i];
      if (c === '/' && text[i + 1] === '*') { const end = text.indexOf('*/', i + 2); i = end < 0 ? n : end + 2; continue; }
      if (c === '"' || c === "'") { const q = c; out += c; i++; while (i < n && text[i] !== q) { if (text[i] === '\\') out += text[i++]; out += text[i++]; } out += text[i++] ?? ''; continue; }
      if (depth === 0 && stops.includes(c)) break;
      if (c === '(' || c === '[') depth++;
      if (c === ')' || c === ']') depth--;
      out += c; i++;
    }
    return out;
  }
  // Read a {…} block body, returning its raw inner text.
  function readBlock() {
    i++; // {
    let depth = 1, start = i;
    while (i < n && depth) {
      const c = text[i];
      if (c === '/' && text[i + 1] === '*') { const end = text.indexOf('*/', i + 2); i = end < 0 ? n : end + 2; continue; }
      if (c === '"' || c === "'") { const q = c; i++; while (i < n && text[i] !== q) { if (text[i] === '\\') i++; i++; } i++; continue; }
      if (c === '{') depth++;
      else if (c === '}') depth--;
      i++;
    }
    return text.slice(start, i - 1);
  }
  function nodes(stopAtClose) {
    const list = [];
    for (;;) {
      skipSpace();
      if (i >= n) break;
      if (text[i] === '}') { if (stopAtClose) { i++; break; } i++; continue; }
      if (text[i] === '/' && text[i + 1] === '*') {
        const end = text.indexOf('*/', i + 2);
        list.push({ type: 'comment', text: text.slice(i, end < 0 ? n : end + 2) });
        i = end < 0 ? n : end + 2;
        continue;
      }
      if (text[i] === '@') {
        const head = readUntil(['{', ';', '}']).trim();
        const name = head.slice(1).split(/[\s({]/)[0];
        const prelude = head.slice(name.length + 1).trim();
        if (text[i] === ';' || text[i] === '}' || i >= n) { if (text[i] === ';') i++; list.push({ type: 'at', name, prelude }); continue; }
        if (NESTING.has(name)) { i++; list.push({ type: 'at', name, prelude, children: nodes(true) }); }
        else list.push({ type: 'at', name, prelude, body: readBlock().trim() });
        continue;
      }
      const selector = readUntil(['{', '}']).trim();
      if (text[i] !== '{') { i++; continue; }
      list.push({ type: 'rule', selector, body: readBlock().trim() });
    }
    return list;
  }
  return nodes(false);
}

// One rule per line, at-rule blocks open and close on their own lines. Comments are kept.
export function serialize(list, indent = '') {
  return list.map(node => {
    if (node.type === 'comment') return indent + node.text;
    if (node.type === 'rule') return `${indent}${node.selector}{${node.body}}`;
    const head = `${indent}@${node.name}${node.prelude ? ' ' + node.prelude : ''}`;
    if (node.children) return `${head}{\n${serialize(node.children, indent)}\n${indent}}`;
    if (node.body !== undefined) return `${head}{${node.body}}`;
    return `${head};`;
  }).join('\n');
}

// Split a selector list at top-level commas.
export function selectors(selector) {
  const out = [];
  let depth = 0, cur = '';
  for (const c of selector) {
    if (c === '(' || c === '[') depth++;
    if (c === ')' || c === ']') depth--;
    if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

// Declarations as [property, value] pairs, in order.
export function declarations(body) {
  const out = [];
  let depth = 0, cur = '', quote = '';
  for (const c of body + ';') {
    if (quote) { cur += c; if (c === quote) quote = ''; continue; }
    if (c === '"' || c === "'") { quote = c; cur += c; continue; }
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ';' && depth === 0) {
      const k = cur.indexOf(':');
      if (k > 0) out.push([cur.slice(0, k).trim(), cur.slice(k + 1).trim()]);
      cur = '';
    } else cur += c;
  }
  return out;
}

// Walk every rule with the chain of at-rule preludes around it.
export function* rules(list, context = []) {
  for (const node of list) {
    if (node.type === 'rule') yield { ...node, context };
    else if (node.children) yield* rules(node.children, [...context, `@${node.name} ${node.prelude}`.trim()]);
  }
}
