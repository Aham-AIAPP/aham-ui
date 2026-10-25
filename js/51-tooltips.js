// ── Tooltips ─────────────────────────────────────────────────────────────────
// [data-tooltip="名称"] plus optional data-keys="mod+b" shows the name and its shortcut after a short hover, or at once
// on keyboard focus. One at a time; hidden on leave, blur, any key press (Esc included), scroll or click. Coarse pointers get none.
// The tip is aria-hidden: buttons keep their aria-label, and data-keys is mirrored into aria-keyshortcuts.
const TOOLTIP_DELAY = 500;
export function initTooltips(root = document.querySelector('.aham-workbench')) {
  if (!root || root.querySelector(':scope > .wb-tooltip')) return null;
  const tip = document.createElement('div');
  tip.className = 'wb-tooltip';
  tip.setAttribute('aria-hidden', 'true');
  tip.hidden = true;
  root.append(tip);
  root.querySelectorAll('[data-tooltip][data-keys]').forEach(el => el.setAttribute('aria-keyshortcuts', ariaKeys(el.dataset.keys)));
  const coarse = matchMedia('(pointer: coarse)');
  let timer = 0, owner = null, hiddenAt = 0;
  function show(el) {
    owner = el;
    const keys = el.dataset.keys && (singleKeys || !characterOnly(el.dataset.keys)) ? el.dataset.keys : '';
    tip.innerHTML = `<span>${escapeHtml(el.dataset.tooltip)}</span>${keys ? `<span class="wb-kbd-group">${formatKeys(keys).map(k => `<kbd class="wb-kbd">${escapeHtml(k)}</kbd>`).join('')}</span>` : ''}`;
    // A tip that follows another within 300ms appears without fading in (rules/11-交互.md 11.4).
    tip.toggleAttribute('data-warm', Date.now() - hiddenAt < 300);
    tip.hidden = false;
    const r = el.getBoundingClientRect(), t = tip.getBoundingClientRect(), gap = 4;
    const top = r.bottom + gap + t.height > innerHeight - gap ? r.top - gap - t.height : r.bottom + gap;
    const left = Math.max(gap, Math.min(r.left + r.width / 2 - t.width / 2, innerWidth - t.width - gap));
    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
  }
  function hide() { clearTimeout(timer); if (!tip.hidden) hiddenAt = Date.now(); owner = null; tip.hidden = true; }
  root.addEventListener('pointerover', e => {
    const el = e.target.closest?.('[data-tooltip]');
    if (!el || el === owner || coarse.matches || e.pointerType === 'touch') return;
    // An open sidebar already shows the names; its items only get a tip when collapsed to icons.
    if (el.matches('.wb-nav-item') && !root.classList.contains('collapsed')) return;
    clearTimeout(timer);
    timer = setTimeout(() => show(el), owner || Date.now() - hiddenAt < 300 ? 0 : TOOLTIP_DELAY);
  });
  root.addEventListener('pointerout', e => { const el = e.target.closest?.('[data-tooltip]'); if (el && !el.contains(e.relatedTarget)) hide(); });
  root.addEventListener('focusin', e => { const el = e.target.closest?.('[data-tooltip]'); if (el?.matches(':focus-visible') && !(el.matches('.wb-nav-item') && !root.classList.contains('collapsed'))) show(el); });
  root.addEventListener('focusout', hide);
  root.addEventListener('pointerdown', hide);
  document.addEventListener('keydown', () => { if (owner) hide(); });
  addEventListener('scroll', hide, true);
  return { hide };
}

