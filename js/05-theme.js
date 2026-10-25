// ── Theme ────────────────────────────────────────────────────────────────────
// ?theme=light|dark in the page URL sets the starting theme (the panorama page passes its own theme to embedded samples).
// A [data-action="theme"] button inside root toggles light / dark. It is an action button, not a toggle: its icon and
// label name the theme a click switches to (moon and 切换到深色 on a light page), so it carries no aria-pressed.
export function initTheme(root = document.querySelector('.aham-workbench')) {
  const life = scope();
  if (!root) return null;
  const button = root.querySelector('[data-action="theme"]');
  const media = matchMedia('(prefers-color-scheme: dark)');
  // Without data-theme the page follows the system; the button names the opposite of what is showing.
  const current = () => root.dataset.theme === 'dark' || (!root.dataset.theme && media.matches) ? 'dark' : 'light';
  function paint() {
    if (!button) return;
    const dark = current() === 'dark';
    const label = dark ? '切换到浅色' : '切换到深色';
    button.removeAttribute('aria-pressed');
    button.setAttribute('aria-label', label);
    if (button.hasAttribute('data-tooltip')) button.dataset.tooltip = label;
    button.innerHTML = icon(dark ? 'sun' : 'moon');
  }
  function set(theme) { root.dataset.theme = theme; paint(); }
  const asked = new URLSearchParams(location.search).get('theme');
  if (asked === 'light' || asked === 'dark') set(asked); else paint();
  // A preferences dialog or the host app may set data-theme directly; the button follows it and the system setting.
  if (button) {
    const watch = new MutationObserver(paint);
    watch.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    life.keep(() => watch.disconnect());
    life.on(media, 'change', paint);
  }
  life.on(button, 'click', () => set(current() === 'dark' ? 'light' : 'dark'));
  return { set, get: current, destroy: life.end, fromUrl: asked === 'light' || asked === 'dark' ? asked : null };
}

