// ── Popover ──────────────────────────────────────────────────────────────────
// Same contract as components/command-menu.json: non-modal, one at a time (no cascading), light dismiss.
// Esc or finishing returns focus to the trigger. Arrow-key movement inside lists belongs to createCommand.
// api.trigger may be reassigned when a re-render replaces the trigger element; call api.place() afterwards.
let openPop = null;

// point: { x, y } places the popover at a pointer position (context menu); returnFocus overrides where focus goes back.
export function openPopover(trigger, panel, { align = 'auto', onClose, point = null, returnFocus = null } = {}) {
  closePopover('replace');
  panel._stopLeave?.();
  panel.inert = false;
  panel.dataset.input = lastInput();
  panel.hidden = false;
  // The trigger keeps its pressed look while the popover is open (rules/11-交互.md 11.2).
  const expands = el => el.hasAttribute?.('aria-haspopup') || el.matches?.('button, [role=button], summary');
  if (expands(trigger)) trigger.setAttribute('aria-expanded', 'true');
  const place = () => placePopover(api.trigger, panel, align, point);
  const focusOutside = e => { if (!panel.contains(e.target) && !api.trigger.contains(e.target)) api.close('tab'); };
  const outside = e => { if (!panel.contains(e.target) && !api.trigger.contains(e.target)) api.close('outside'); };
  const release = pushLayer(reason => api.close(reason));
  document.addEventListener('pointerdown', outside, true);
  document.addEventListener('focusin', focusOutside);
  addEventListener('resize', place);
  document.addEventListener('scroll', place, true);
  const api = {
    panel, trigger, place,
    close(reason = 'done') {
      if (openPop !== api) return;
      openPop = null;
      release();
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('focusin', focusOutside);
      removeEventListener('resize', place);
      document.removeEventListener('scroll', place, true);
      if (reason === 'replace') panel.hidden = true;
      else panel._stopLeave = leave(panel, () => { panel.hidden = true; panel._stopLeave = null; });
      if (expands(api.trigger)) api.trigger.setAttribute('aria-expanded', 'false');
      const back = returnFocus || api.trigger;
      if ((reason === 'escape' || reason === 'done') && (typeof back.isConnected !== 'boolean' || back.isConnected)) back.focus();
      onClose?.(reason);
    },
  };
  openPop = api;
  place();
  (panel.querySelector('[autofocus]') || panel.querySelector('input:not([type=checkbox]), select, textarea') || panel.querySelector('[role=listbox][tabindex="0"], [role=menu][tabindex="0"], button'))?.focus({ preventScroll: true });
  return api;
}
export const closePopover = (reason = 'done') => openPop?.close(reason);
export const activePopover = () => openPop;

function placePopover(trigger, panel, align, point) {
  const r = point ? { left: point.x, right: point.x, top: point.y, bottom: point.y } : trigger.getBoundingClientRect(), gap = point ? 2 : 4, edge = 8;
  panel.style.left = '0px';
  panel.style.top = '0px';
  const w = panel.offsetWidth, h = panel.offsetHeight;
  // 'auto' lines the panel up with the trigger edge nearer the window edge, so a menu never reaches across the page.
  const end = !point && (align === 'end' || (align === 'auto' && r.left + r.right > innerWidth));
  let left = end ? r.right - w : r.left;
  left = Math.max(edge, Math.min(left, innerWidth - w - edge));
  let top = r.bottom + gap;
  if (top + h > innerHeight - edge && r.top - gap - h > edge) top = r.top - gap - h;
  panel.style.left = `${Math.round(left)}px`;
  top = Math.max(edge, Math.min(top, innerHeight - h - edge));
  panel.style.top = `${Math.round(top)}px`;
  // Grow out of the trigger's side (rules/11-交互.md 11.4).
  panel.style.transformOrigin = `${end ? 'right' : 'left'} ${top < r.top ? 'bottom' : 'top'}`;
}

