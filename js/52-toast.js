// ── Toast ────────────────────────────────────────────────────────────────────
// Transient confirmation after an action, bottom-right (bottom on phones). At most 3 stay; each leaves after 4s,
// paused while hovered or focused. A repeat of a visible toast (same text and action) is not added again.
// Inside an open modal dialog the toast is placed in that dialog, because everything outside it is inert.
// An optional action (e.g. 撤销) may return a promise: the toast waits for it and then dismisses; on false or a
// throw it stays, shows the error and keeps the action for a retry. Errors that need a fix belong next to the
// field or in an inline notice, not in a toast.
const toastHosts = new WeakMap();
export function toast(message, { action, duration = 4000 } = {}) {
  const root = document.querySelector('.aham-workbench dialog[open]') || document.querySelector('.aham-workbench');
  if (!root) return () => {};
  let host = toastHosts.get(root);
  if (!host?.isConnected) {
    host = document.createElement('section'); host.className = 'wb-toasts';
    host.setAttribute('aria-label', '通知'); root.append(host); toastHosts.set(root, host);
  }
  const duplicate = [...host.children].find(el => el._toastMessage === message && el._toastAction === action?.run && !el.hasAttribute('data-leaving'));
  if (duplicate) return duplicate._dismissToast;
  const el = document.createElement('div');
  el._toastMessage = message; el._toastAction = action?.run;
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

// Completion notifications emitted by a callback must survive closing that callback's modal.
function moveDialogToasts(dialog) {
  const source = toastHosts.get(dialog);
  if (!source) return;
  const root = dialog.parentElement?.closest('dialog[open]') || dialog.closest('.aham-workbench');
  if (!root) return;
  const target = toastHosts.get(root);
  if (target?.isConnected) { target.append(...source.children); source.remove(); }
  else { root.append(source); toastHosts.set(root, source); }
  toastHosts.delete(dialog);
}
