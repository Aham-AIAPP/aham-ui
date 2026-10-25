// Aham UI workbench behaviour — vanilla ES module, zero dependencies.
// Contract:
//   root        .aham-workbench (add .wb-bare to use components without the shell, e.g. in previews)
//   nav toggle  [data-action="nav"] in header row 1, aria-controls = rail id
//   rail        .wb-rail (220px text sidebar; 52px icons when .collapsed; floats as .expanded on narrow screens)
//   panels      .wb-panel toggled by [data-panel-toggle="<panel id>"]
// Esc closes the topmost open layer only (popover → floating panel → nav overlay → search), then focus returns
// to whatever opened that layer.

// ── Layer stack ──────────────────────────────────────────────────────────────
const layers = [];
export function pushLayer(close) {
  const entry = { close };
  layers.push(entry);
  return () => { const i = layers.indexOf(entry); if (i >= 0) layers.splice(i, 1); };
}
// Plays an element's exit transition ([data-leaving] in each component style, rules/11-交互.md 11.4), then runs done.
// With reduced motion, or without a transition, done runs at once. Returns a function that cancels the exit.
export function leave(el, done) {
  el.dataset.leaving = '';
  const ms = Math.max(0, ...getComputedStyle(el).transitionDuration.split(',').map(v => parseFloat(v) * (v.trim().endsWith('ms') ? 1 : 1000) || 0));
  let timer = 0;
  const stop = () => { clearTimeout(timer); delete el.dataset.leaving; };
  if (!ms) { stop(); done(); return () => {}; }
  timer = setTimeout(() => { stop(); done(); }, ms);
  return stop;
}
// Guarded so the pure helpers below (filter operators, URL state) can be imported in Node tests.
if (typeof document !== 'undefined') document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || e.isComposing || !layers.length) return;
  e.preventDefault();
  layers[layers.length - 1].close('escape');
});

const contextBreakpoint = root => matchMedia(`(max-width: ${getComputedStyle(root).getPropertyValue('--wb-bp-context').trim() || '64rem'})`);


// The last kind of input: 'pointer' or 'key'. Focus moved by code shows a ring only after keyboard use (rules/11-交互.md 11.6),
// because Safari draws :focus-visible on programmatic focus after a click.
let inputKind = 'pointer';
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', () => { inputKind = 'pointer'; }, true);
  document.addEventListener('keydown', () => { inputKind = 'key'; }, true);
}
export const lastInput = () => inputKind;
