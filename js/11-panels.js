// ── Side panels ──────────────────────────────────────────────────────────────
// One panel open at a time. Narrow screens: wide panels float over the content, start closed,
// take focus when opened and close with Esc. show(id, { layer: true, returnTo }) also lets Esc close an inline panel,
// e.g. a preview opened with Space from a list row; focus then goes back to `returnTo`.
export function initPanels(root = document.querySelector('.aham-workbench')) {
  const life = scope();
  if (!root) return null;
  const toggles = [...root.querySelectorAll('[data-panel-toggle]')];
  const narrow = contextBreakpoint(root);
  const panelOf = id => (id ? root.querySelector(`#${CSS.escape(id)}`) : null);
  const floating = p => narrow.matches && p?.dataset.size === 'wide';
  let current = null, release = null;

  function show(id, { focus = false, layer = false, returnTo = null } = {}) {
    release?.();
    release = null;
    current = id;
    for (const t of toggles) {
      const on = t.dataset.panelToggle === id;
      t.setAttribute('aria-pressed', String(on));
      const p = panelOf(t.dataset.panelToggle);
      if (p) p.hidden = !on;
    }
    const p = panelOf(id);
    if (p && (floating(p) || layer)) {
      const opener = returnTo || toggles.find(t => t.dataset.panelToggle === id);
      release = pushLayer(() => { show(null); opener?.focus(); });
      if (focus && floating(p)) p.focus();
    }
  }
  toggles.forEach(t => life.on(t, 'click', () => show(t.getAttribute('aria-pressed') === 'true' ? null : t.dataset.panelToggle, { focus: true })));
  life.on(narrow, 'change', () => { if (floating(panelOf(current))) show(null); });
  const initial = toggles.find(t => t.getAttribute('aria-pressed') === 'true');
  show(initial && !floating(panelOf(initial.dataset.panelToggle)) ? initial.dataset.panelToggle : null);
  life.keep(() => release?.());
  return { show, current: () => current, destroy: life.end };
}

