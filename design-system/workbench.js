// Aham UI workbench shell — vanilla ES module, zero dependencies.
// Contract:
//   root        .aham-workbench
//   nav toggle  [data-action="nav"] in header row 1, aria-controls = rail id
//   rail        .wb-rail (52px icon rail; 240px when .expanded)
// Behaviour:
//   click toggle or ⌘B / Ctrl+B        toggle the nav
//   wide screens (> --wb-bp-context)   nav pushes content; choice is remembered
//   narrow screens                     nav opens as an overlay; Esc, scrim or choosing an item closes it;
//                                      content behind it is inert; focus returns to the toggle
const STORE = 'aham-ui:workbench:nav';

export function initShell(root = document.querySelector('.aham-workbench')) {
  if (!root) return null;
  const toggle = root.querySelector('[data-action="nav"]');
  const rail = root.querySelector('.wb-rail');
  const main = root.querySelector('.wb-main');
  const bp = getComputedStyle(root).getPropertyValue('--wb-bp-context').trim() || '64rem';
  const narrow = matchMedia(`(max-width: ${bp})`);
  let scrim = null;

  const remembered = () => { try { return localStorage.getItem(STORE) === 'expanded'; } catch { return false; } };
  const remember = open => { try { localStorage.setItem(STORE, open ? 'expanded' : 'collapsed'); } catch { /* storage blocked: keep in-page state only */ } };
  const isOpen = () => root.classList.contains('expanded');

  function set(open, { persist = true, restoreFocus = false } = {}) {
    root.classList.toggle('expanded', open);
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '收起导航' : '展开导航');
    }
    const overlay = narrow.matches && open;
    if (main) main.inert = overlay;
    if (overlay && !scrim) {
      scrim = document.createElement('div');
      scrim.className = 'wb-scrim';
      scrim.addEventListener('click', () => set(false, { restoreFocus: true }));
      root.append(scrim);
      rail?.querySelector('button:not([disabled]), a[href], [tabindex="0"]')?.focus();
    } else if (!overlay && scrim) {
      scrim.remove();
      scrim = null;
    }
    if (!narrow.matches && persist) remember(open);
    if (restoreFocus && !open) toggle?.focus();
  }

  toggle?.addEventListener('click', () => set(!isOpen()));
  rail?.addEventListener('click', e => {
    if (narrow.matches && isOpen() && e.target.closest('.wb-nav-item')) set(false, { restoreFocus: true });
  });
  document.addEventListener('keydown', e => {
    if (e.isComposing) return;
    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'b') {
      if (e.target instanceof HTMLElement && e.target.isContentEditable) return;
      e.preventDefault();
      set(!isOpen(), { restoreFocus: true });
    } else if (e.key === 'Escape' && narrow.matches && isOpen()) {
      set(false, { restoreFocus: true });
    }
  });
  narrow.addEventListener('change', () => set(narrow.matches ? false : remembered(), { persist: false }));

  set(narrow.matches ? false : remembered(), { persist: false });
  return { set, isOpen };
}

// Side panels: buttons [data-panel-toggle="<panel id>"] in header row 2; one panel open at a time.
// Panel width comes from CSS: .wb-panel (narrow) or .wb-panel[data-size="wide"].
// Narrow screens: wide panels float over the content, start closed, take focus when opened, and close on Esc.
export function initPanels(root = document.querySelector('.aham-workbench')) {
  if (!root) return null;
  const toggles = [...root.querySelectorAll('[data-panel-toggle]')];
  const bp = getComputedStyle(root).getPropertyValue('--wb-bp-context').trim() || '64rem';
  const narrow = matchMedia(`(max-width: ${bp})`);
  const panelOf = t => root.querySelector(`#${CSS.escape(t.dataset.panelToggle)}`);
  const floating = p => narrow.matches && p?.dataset.size === 'wide';
  let current = null;
  function show(id, { focus = false } = {}) {
    current = id;
    for (const t of toggles) {
      const on = t.dataset.panelToggle === id;
      t.setAttribute('aria-pressed', String(on));
      const panel = panelOf(t);
      if (!panel) continue;
      panel.hidden = !on;
      if (on && focus && floating(panel)) panel.focus();
    }
  }
  toggles.forEach(t => t.addEventListener('click', () => show(t.getAttribute('aria-pressed') === 'true' ? null : t.dataset.panelToggle, { focus: true })));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.isComposing || !current) return;
    const t = toggles.find(x => x.dataset.panelToggle === current);
    if (!floating(panelOf(t))) return;
    show(null);
    t.focus();
  });
  narrow.addEventListener('change', () => { if (current && floating(panelOf(toggles.find(x => x.dataset.panelToggle === current)))) show(null); });
  const initial = toggles.find(t => t.getAttribute('aria-pressed') === 'true');
  show(initial && !floating(panelOf(initial)) ? initial.dataset.panelToggle : null);
  return { show };
}
