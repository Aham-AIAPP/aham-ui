// ── Modal dialog (rules/6-反馈.md 6.3, rules/11-交互.md 11.4) ─────────────────────
// The one way to open a modal. Every dialog in Aham (confirm, form, create, batch result, AI confirm, preferences) is
// built on it, so all of them enter and leave the same way, join the Esc layer stack and give focus back.
//   const { dialog, close } = openDialog({ root, className, labelledBy, html, returnFocus, onEscape, onBackdrop })
// - html fills the <dialog>; the caller wires its own buttons and calls close(after) to finish.
// - Esc runs onEscape when given (to ask in place first), otherwise close().
// - onBackdrop: a click on the dimmed area outside the box. Leave it out for dialogs that hold unsaved input.
// - Focus goes back to returnFocus, or to the element that had focus when the dialog opened, whichever is still in the page.
export function openDialog({ root, className = 'wb-dialog', labelledBy, html, returnFocus, onEscape, onBackdrop }) {
  const dialog = document.createElement('dialog');
  dialog.className = className;
  if (labelledBy) dialog.setAttribute('aria-labelledby', labelledBy);
  dialog.innerHTML = html;
  root.append(dialog);
  const opener = document.activeElement;
  let release = null, closed = false;
  function close(after) {
    if (closed) return;
    closed = true;
    release?.();
    leave(dialog, () => {
      dialog.close();
      dialog.remove();
      [returnFocus, opener].find(el => el?.isConnected)?.focus?.();
      after?.();
    });
  }
  const escape = () => (onEscape ? onEscape() : close());
  dialog.addEventListener('cancel', e => { e.preventDefault(); escape(); });
  if (onBackdrop) dialog.addEventListener('click', e => { if (e.target === dialog) onBackdrop(); });
  dialog.showModal();
  release = pushLayer(escape);
  return { dialog, close, get closed() { return closed; } };
}
