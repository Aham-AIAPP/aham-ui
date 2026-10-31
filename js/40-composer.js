// ── Composer ─────────────────────────────────────────────────────────────────
// Comment box: ⌘/Ctrl+Enter or the send button submits; Enter alone adds a line; nothing is sent while an IME is
// composing or the text is blank. onSubmit(text) returns true (or a promise of true) when the comment was saved.
// While it waits the send button shows 发送中… and a second submit is ignored. On false or a throw the draft stays,
// the error shows under the box and the user can retry; text typed during the request is never cleared.
export function initComposer(form, { onSubmit }) {
  const life = scope();
  const area = form.querySelector('textarea'), send = form.querySelector('[type=submit]');
  const error = document.createElement('p');
  error.className = 'wb-value-error'; error.setAttribute('role', 'alert'); form.append(error);
  let pending = false, revision = 0, composing = false;
  const sync = () => { send.disabled = pending || !area.value.trim(); };
  async function submit() {
    const text = area.value.trim(), submitted = revision;
    if (!life.active || pending || composing || !text) return;
    pending = true; error.textContent = '';
    form.setAttribute('aria-busy', 'true');
    const restore = pendingUI(send, send, '发送中…');
    try {
      if (!await onSubmit(text)) throw new Error('发送失败，内容已保留，可以重试。');
      if (life.active && revision === submitted) area.value = '';
    } catch (err) { if (life.active) error.textContent = actionError(err); }
    finally { restore(); pending = false; form.removeAttribute('aria-busy'); if (life.active) { sync(); if (document.activeElement === document.body || document.activeElement === send) area.focus(); } }
  }
  life.on(area, 'compositionstart', () => { composing = true; });
  life.on(area, 'compositionend', () => { composing = false; });
  life.on(area, 'input', () => { revision++; error.textContent = ''; sync(); });
  life.on(area, 'keydown', e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.isComposing) { e.preventDefault(); submit(); }
  });
  life.on(form, 'submit', e => { e.preventDefault(); submit(); });
  life.keep(() => { error.remove(); });
  sync();
  return { submit, destroy: life.end };
}
