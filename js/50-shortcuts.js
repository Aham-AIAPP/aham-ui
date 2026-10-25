// ── Shortcuts ────────────────────────────────────────────────────────────────
// One registry for every keyboard shortcut, so the help list only shows what is actually wired.
// keys: 'mod+k' (⌘ on macOS, Ctrl elsewhere), 'shift+/', 'c', or a sequence 'g l' (press g, then l within 1s).
// Single-key shortcuts never fire while typing in a field or while an IME is composing; mod+ shortcuts do.
// external: true lists a key handled elsewhere (list keys, Esc) in the help without dispatching it here.
const shortcuts = [];
// Single-character shortcuts (no ⌘ / Ctrl / Alt) can be switched off (WCAG 2.1.4); the choice is kept in this browser.
const SINGLE_KEY_STORE = 'aham-ui:workbench:single-key';
let singleKeys = typeof document === 'undefined' || (() => { try { return localStorage.getItem(SINGLE_KEY_STORE) !== 'off'; } catch { return true; } })();
const characterOnly = keys => keys.split(' ').every(step => !step.includes('+') && [...step].length === 1);
export function setSingleKeyShortcuts(on) {
  singleKeys = Boolean(on);
  try { localStorage.setItem(SINGLE_KEY_STORE, singleKeys ? 'on' : 'off'); } catch { /* storage blocked: this page only */ }
}
export const singleKeyShortcuts = () => singleKeys;
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const KEY_LABEL = { mod: isMac ? '⌘' : 'Ctrl', shift: isMac ? '⇧' : 'Shift', alt: isMac ? '⌥' : 'Alt', enter: 'Enter', escape: 'Esc', space: '空格', up: '↑', down: '↓', home: 'Home', end: 'End', f10: 'F10', '/': '/', '?': '?' };
export function formatKeys(keys) {
  return keys.split(' ').map(step => step.split('+').map(k => KEY_LABEL[k] ?? k.toUpperCase()).join(isMac ? '' : '+'));
}
function ariaKeys(keys) { return keys.split(' ').map(step => step.split('+').map(k => ({ mod: isMac ? 'Meta' : 'Control', shift: 'Shift', alt: 'Alt' })[k] ?? k.toUpperCase()).join('+')).join(' '); }
export function registerShortcut(def) {
  const entry = { group: '通用', when: () => true, ...def };
  shortcuts.push(entry);
  return () => { const i = shortcuts.indexOf(entry); if (i >= 0) shortcuts.splice(i, 1); };
}
export const listShortcuts = () => shortcuts.filter(s => s.label && (singleKeys || !characterOnly(s.keys)) && (s.external || s.when())).map(({ keys, label, group }) => ({ keys, label, group }));
const editable = el => el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
let pending = null, pendingTimer = 0;
// Arrow keys report 'ArrowDown' etc.; the registry and shortcuts.json name them 'down', 'up', 'left', 'right'.
const KEY_ALIAS = { arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right', esc: 'escape' };
export function keyStep(e) {
  // Shift+/ reports '?' on most layouts but '/' with shiftKey from some input sources; treat both as '?'.
  const raw = e.key === ' ' ? 'space' : e.key === '/' && e.shiftKey ? '?' : e.key.toLowerCase();
  const k = KEY_ALIAS[raw] ?? raw;
  const mods = [(e.metaKey || e.ctrlKey) && 'mod', e.altKey && 'alt', e.shiftKey && e.key.length !== 1 && 'shift'].filter(Boolean);
  return [...mods, k === '?' ? '?' : k].join('+');
}
if (typeof document !== 'undefined') document.addEventListener('keydown', e => {
  if (e.isComposing || e.defaultPrevented || e.repeat) return;
  const step = keyStep(e), typing = editable(e.target);
  const seq = pending ? `${pending} ${step}` : step;
  const live = shortcuts.filter(s => !s.external && (singleKeys || !characterOnly(s.keys)));
  const hit = live.find(s => s.keys === seq && s.when(e)) || (pending ? live.find(s => s.keys === step && s.when(e)) : null);
  const modded = step.startsWith('mod+');
  if (hit && (!typing || modded)) { e.preventDefault(); pending = null; hit.run(e); return; }
  if (!typing && !modded && live.some(s => s.keys.startsWith(`${step} `) && s.when(e))) {
    pending = step;
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => { pending = null; }, 1000);
    return;
  }
  pending = null;
});

