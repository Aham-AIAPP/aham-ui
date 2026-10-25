// ── Theme ────────────────────────────────────────────────────────────────────
// ?theme=light|dark in the page URL sets the starting theme (the panorama page passes its own theme to embedded samples).
// A [data-action="theme"] button inside root toggles light / dark and keeps its pressed state and icon in sync.
export function initTheme(root = document.querySelector('.aham-workbench')) {
  const life = scope();
  if (!root) return null;
  const button = root.querySelector('[data-action="theme"]');
  function set(theme) {
    root.dataset.theme = theme;
    if (!button) return;
    const dark = theme === 'dark';
    button.setAttribute('aria-pressed', String(dark));
    button.innerHTML = icon(dark ? 'sun' : 'moon');
  }
  const asked = new URLSearchParams(location.search).get('theme');
  if (asked === 'light' || asked === 'dark') set(asked);
  life.on(button, 'click', () => set(root.dataset.theme === 'dark' ? 'light' : 'dark'));
  return { set, get: () => root.dataset.theme, destroy: life.end, fromUrl: asked === 'light' || asked === 'dark' ? asked : null };
}

