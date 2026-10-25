// ── Navigation ───────────────────────────────────────────────────────────────
// Wide screens: the 220px sidebar is open by default; ⌘/Ctrl+B collapses it to 52px icons and the choice is remembered.
// ≤ --wb-bp-context: the sidebar starts as icons and opens as an overlay; the content behind is inert; Esc, scrim or choosing an item closes it.
// Nav items with data-go="c" also answer to the key sequence G then C (rules/7-键盘与命令.md 7.1).
const NAV_STORE = 'aham-ui:workbench:nav';

export function initShell(root = document.querySelector('.aham-workbench')) {
  const life = scope();
  if (!root) return null;
  const theme = initTheme(root);
  const toggle = root.querySelector('[data-action="nav"]');
  const rail = root.querySelector('.wb-rail');
  const main = root.querySelector('.wb-main');
  const narrow = contextBreakpoint(root);
  let scrim = null, release = null, open = true;

  const remembered = () => { try { return localStorage.getItem(NAV_STORE) !== 'collapsed'; } catch { return true; } };
  const remember = on => { try { localStorage.setItem(NAV_STORE, on ? 'expanded' : 'collapsed'); } catch { /* storage blocked: keep in-page state only */ } };
  const isOpen = () => open;

  function set(next, { persist = true, restoreFocus = false } = {}) {
    open = next;
    const overlay = narrow.matches && open;
    root.classList.toggle('collapsed', !open);
    root.classList.toggle('expanded', overlay);
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '收起侧栏' : '展开侧栏');
    }
    if (main) main.inert = overlay;
    if (overlay && !scrim) {
      scrim = document.createElement('div');
      scrim.className = 'wb-scrim';
      life.on(scrim, 'click', () => set(false, { restoreFocus: true }));
      root.append(scrim);
      release = pushLayer(() => set(false, { restoreFocus: true }));
      rail?.querySelector('button:not([disabled]), a[href], [tabindex="0"]')?.focus();
    } else if (!overlay && scrim) {
      scrim.remove();
      scrim = null;
      release?.();
      release = null;
    }
    if (!narrow.matches && persist) remember(open);
    if (restoreFocus && !open) toggle?.focus();
  }

  life.on(toggle, 'click', () => set(!isOpen()));
  life.on(rail, 'click', e => {
    if (narrow.matches && isOpen() && e.target.closest('.wb-nav-item')) set(false, { restoreFocus: true });
  });
  // Collapsed items keep their names as tooltips.
  rail?.querySelectorAll('.wb-nav-item').forEach(item => {
    const name = item.querySelector('span')?.textContent.trim();
    if (name && !item.dataset.tooltip) item.dataset.tooltip = name;
    if (item.dataset.go && !item.dataset.keys) item.dataset.keys = `g ${item.dataset.go}`;
    if (item.dataset.go) life.keep(registerShortcut({ keys: `g ${item.dataset.go}`, label: `转到${name}`, group: '转到', run: () => item.click() }));
  });
  life.keep(registerShortcut({ keys: 'mod+b', label: '展开 / 收起侧栏', group: '通用', run: e => { if (!(e.target instanceof HTMLElement && e.target.isContentEditable)) set(!isOpen(), { restoreFocus: true }); } }));
  life.on(narrow, 'change', () => set(narrow.matches ? false : remembered(), { persist: false }));

  set(narrow.matches ? false : remembered(), { persist: false });
  const tooltips = initTooltips(root);
  life.keep(() => { theme?.destroy(); tooltips?.destroy(); scrim?.remove(); release?.(); });
  return { set, isOpen, theme, destroy: life.end };
}

