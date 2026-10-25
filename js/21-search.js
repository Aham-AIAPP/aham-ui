// ── Header search ────────────────────────────────────────────────────────────
// Button [data-action="search"] reveals .wb-search. Esc clears the text first, then closes.
export function initSearch(root, { value = '', onInput } = {}) {
  const button = root.querySelector('[data-action="search"]');
  const box = root.querySelector('.wb-search');
  const input = box?.querySelector('input');
  if (!button || !box || !input) return null;
  let release = null;
  input.value = value;
  const open = ({ focus = true } = {}) => {
    box.hidden = false;
    button.hidden = true;
    release ??= pushLayer(escape);
    if (focus) input.focus();
  };
  const close = () => {
    release?.();
    release = null;
    box.hidden = true;
    button.hidden = false;
    button.focus();
  };
  function escape() {
    if (input.value) { input.value = ''; onInput?.(''); return; }
    close();
  }
  button.addEventListener('click', () => open());
  input.addEventListener('input', () => onInput?.(input.value));
  input.addEventListener('blur', () => { if (!input.value) setTimeout(() => { if (document.activeElement !== input && !input.value && release) { release(); release = null; box.hidden = true; button.hidden = false; } }, 0); });
  if (value) open({ focus: false });
  return { open, close };
}

