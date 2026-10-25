// ── Form dialog ──────────────────────────────────────────────────────────────
// A small form in a modal: adding a line item, mass edit. Labels sit above the controls as on the document page.
// fields: [{ key, label, type: 'text' | 'number' | 'select', options?, value?, required?, hint?, inputmode? }]
// onSubmit(values) → true closes the dialog; a string is shown as the error of the whole form; an object
// { key: message } marks single fields. Esc and 取消 close without acting.
export function openFormDialog({ root, title, text = '', fields = [], submit = '保存', onSubmit, returnFocus }) {
  const dialog = document.createElement('dialog');
  dialog.className = 'wb-dialog is-form';
  dialog.setAttribute('aria-labelledby', 'wb-form-title');
  const control = f => {
    const id = `wb-form-${f.key}`, base = `class="wb-field${f.type === 'number' ? ' is-number' : ''}" id="${id}" name="${escapeHtml(f.key)}"${f.required ? ' required' : ''} aria-describedby="${id}-error"`;
    if (f.type === 'select') return `<select ${base}>${f.options.map(o => { const v = typeof o === 'object' ? o : { value: o, label: o }; return `<option value="${escapeHtml(v.value)}"${String(v.value) === String(f.value ?? '') ? ' selected' : ''}>${escapeHtml(v.label)}</option>`; }).join('')}</select>`;
    return `<input ${base} value="${escapeHtml(f.value ?? '')}"${f.inputmode ? ` inputmode="${f.inputmode}"` : ''} maxlength="200" autocomplete="off">`;
  };
  dialog.innerHTML = `<form method="dialog" novalidate><h2 id="wb-form-title">${escapeHtml(title)}</h2>${text ? `<p>${escapeHtml(text)}</p>` : ''}<div class="wb-dialog-grid">${fields.map(f => `<div class="wb-form-row"><label class="wb-form-label" for="wb-form-${escapeHtml(f.key)}">${escapeHtml(f.label)}${f.required ? '<span class="wb-form-required" aria-hidden="true">*</span>' : ''}</label>${control(f)}${f.hint ? `<div class="wb-form-hint">${escapeHtml(f.hint)}</div>` : ''}<div class="wb-form-hint is-error" id="wb-form-${escapeHtml(f.key)}-error" role="alert"></div></div>`).join('')}</div><p class="wb-value-error" role="alert"></p><div class="wb-dialog-foot"><button type="button" class="wb-btn" data-form="cancel">取消</button><button type="submit" class="wb-btn primary">${escapeHtml(submit)}</button></div></form>`;
  root.append(dialog);
  const form = dialog.querySelector('form'), formError = form.querySelector(':scope > .wb-value-error');
  const returnTo = returnFocus || document.activeElement;
  const el = key => form.querySelector(`[name="${CSS.escape(key)}"]`);
  let release = null;
  function finish() { release?.(); leave(dialog, () => { dialog.close(); dialog.remove(); if (returnTo?.isConnected) returnTo.focus(); }); }
  function mark(key, message) {
    const c = el(key), box = dialog.querySelector(`#wb-form-${CSS.escape(key)}-error`);
    if (!c || !box) return;
    box.textContent = message || '';
    if (message) c.setAttribute('aria-invalid', 'true'); else c.removeAttribute('aria-invalid');
  }
  dialog.addEventListener('cancel', e => { e.preventDefault(); finish(); });
  dialog.querySelector('[data-form=cancel]').addEventListener('click', finish);
  form.addEventListener('input', e => { if (e.target.name) mark(e.target.name, ''); formError.textContent = ''; });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const values = Object.fromEntries(fields.map(f => [f.key, el(f.key).value.trim()]));
    const missing = fields.filter(f => f.required && !values[f.key]);
    fields.forEach(f => mark(f.key, missing.includes(f) ? `${f.label}未填写` : ''));
    if (missing.length) { el(missing[0].key).focus(); return; }
    const result = await onSubmit?.(values);
    if (result === true || result === undefined) { finish(); return; }
    if (typeof result === 'string') { formError.textContent = result; return; }
    const keys = Object.keys(result);
    keys.forEach(k => mark(k, result[k]));
    el(keys[0])?.focus();
  });
  dialog.showModal();
  release = pushLayer(finish);
  (form.querySelector('input, select') || form.querySelector('[data-form=cancel]')).focus();
  return { close: finish, dialog };
}

