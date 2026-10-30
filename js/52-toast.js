// Notifications pause independently for hover/focus. Async undo settles before dismissal.
const toastHosts = new WeakMap();
export function toast(message, { action, duration = 4000 } = {}) {
  const root = document.querySelector('.aham-workbench dialog[open]') || document.querySelector('.aham-workbench');
  if (!root) return () => {};
  let host = toastHosts.get(root);
  if (!host?.isConnected) {
    host = document.createElement('section'); host.className = 'wb-toasts';
    host.setAttribute('aria-label', '通知'); root.append(host); toastHosts.set(root, host);
  }
  const el = document.createElement('div');
  el.className = 'wb-toast'; el.setAttribute('role', 'status');
  el.innerHTML = `<span>${escapeHtml(message)}</span>${action ? `<button type="button" class="wb-btn sm ghost">${escapeHtml(action.label)}</button>` : ''}`;
  host.append(el);
  let timer = 0, left = duration, started = 0, hovered = false, focused = false, pending = false, closed = false, failed = false;
  function pause() { if (timer) { clearTimeout(timer); timer = 0; left = Math.max(0, left - (Date.now() - started)); } }
  function dismiss() { if (closed) return; closed = true; pause(); leave(el, () => el.remove()); }
  function resume() { if (closed || pending || failed || hovered || focused || duration <= 0 || timer) return; started = Date.now(); timer = setTimeout(dismiss, left); }
  el._dismissToast = dismiss;
  const visible = [...host.children].filter(child => !child.hasAttribute('data-leaving'));
  while (visible.length > 3) {
    const i = visible.findIndex(child => child.getAttribute('aria-busy') !== 'true');
    if (i < 0) break;
    visible.splice(i, 1)[0]._dismissToast();
  }
  el.addEventListener('mouseenter', () => { hovered = true; pause(); });
  el.addEventListener('mouseleave', () => { hovered = false; resume(); });
  el.addEventListener('focusin', () => { focused = true; pause(); });
  el.addEventListener('focusout', e => { focused = el.contains(e.relatedTarget); if (!focused) resume(); });
  el.querySelector('button')?.addEventListener('click', async e => {
    if (pending || closed) return;
    pause(); pending = true;
    const restore = pendingUI(el, e.currentTarget, '处理中…');
    try {
      if (await action.run() === false) throw new Error('操作未完成，可以重试。');
      dismiss();
    } catch (error) {
      if (!closed) { failed = true; el.querySelector('span').textContent = `${message} · ${actionError(error, '操作失败，可以重试。')}`; el.setAttribute('role', 'alert'); }
    } finally { restore(); pending = false; resume(); }
  });
  resume(); return dismiss;
}
