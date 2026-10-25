// ── Toast ────────────────────────────────────────────────────────────────────
// Transient confirmation after an action, bottom-right (bottom on phones). At most 3 stay; each leaves after 4s,
// paused while hovered or focused. An optional action (e.g. 撤销) runs once and dismisses. Errors that need a fix belong
// next to the field or in an inline notice, not in a toast.
let toastHost = null;
export function toast(message, { action, duration = 4000 } = {}) {
  const root = document.querySelector('.aham-workbench');
  if (!root) return () => {};
  if (!toastHost || !toastHost.isConnected) {
    toastHost = document.createElement('section');
    toastHost.className = 'wb-toasts';
    toastHost.setAttribute('aria-label', '通知');
    root.append(toastHost);
  }
  const el = document.createElement('div');
  el.className = 'wb-toast';
  el.setAttribute('role', 'status');
  el.innerHTML = `<span>${escapeHtml(message)}</span>${action ? `<button type="button" class="wb-btn sm ghost">${escapeHtml(action.label)}</button>` : ''}`;
  toastHost.append(el);
  while (toastHost.children.length > 3) toastHost.firstElementChild.remove();
  let timer = 0, left = duration, started = Date.now();
  const dismiss = () => { clearTimeout(timer); if (!el.dataset.leaving) leave(el, () => el.remove()); };
  const start = () => { started = Date.now(); timer = setTimeout(dismiss, left); };
  const pause = () => { clearTimeout(timer); left -= Date.now() - started; };
  el.addEventListener('mouseenter', pause); el.addEventListener('mouseleave', start);
  el.addEventListener('focusin', pause); el.addEventListener('focusout', start);
  el.querySelector('button')?.addEventListener('click', () => { action.run(); dismiss(); });
  start();
  return dismiss;
}

