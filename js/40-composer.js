// ── Composer ─────────────────────────────────────────────────────────────────
// Comment box: ⌘/Ctrl+Enter or the send button submits; Enter alone adds a line; nothing is sent while an IME is
// composing or the text is blank. onSubmit(text) returns true (or a promise of true) when the comment was saved.
export function initComposer(form, { onSubmit }) {
  const area = form.querySelector('textarea'), send = form.querySelector('[type=submit]');
  const sync = () => { send.disabled = !area.value.trim(); };
  async function submit() {
    const text = area.value.trim();
    if (!text) return;
    send.disabled = true;
    form.setAttribute('aria-busy', 'true');
    let ok = false;
    try { ok = await onSubmit(text); } finally { form.removeAttribute('aria-busy'); }
    if (ok) area.value = '';
    sync();
    area.focus();
  }
  area.addEventListener('input', sync);
  area.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.isComposing) { e.preventDefault(); submit(); }
  });
  form.addEventListener('submit', e => { e.preventDefault(); submit(); });
  sync();
  return { submit };
}

