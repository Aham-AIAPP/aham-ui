// ── Form dialog ──────────────────────────────────────────────────────────────
// A small form in a modal: adding a line item, mass edit. Labels sit above the controls as on the document page.
// fields: [{ key, label, type: 'text' | 'number' | 'select', options?, value?, required?, hint?, inputmode? }]
// onSubmit(values) → true closes the dialog; a string is shown as the error of the whole form; an object
// { key: message } marks single fields. Esc and 取消 close without acting.
export function openFormDialog({ root, title, text = '', fields = [], submit = '保存', onSubmit, returnFocus }) {
  const control = f => {
    const id = `wb-form-${f.key}`, base = `class="wb-field${f.type === 'number' ? ' is-number' : ''}" id="${id}" name="${escapeHtml(f.key)}"${f.required ? ' required' : ''} aria-describedby="${id}-error"`;
    if (f.type === 'select') return `<select ${base}>${f.options.map(o => { const v = typeof o === 'object' ? o : { value: o, label: o }; return `<option value="${escapeHtml(v.value)}"${String(v.value) === String(f.value ?? '') ? ' selected' : ''}>${escapeHtml(v.label)}</option>`; }).join('')}</select>`;
    return `<input ${base} value="${escapeHtml(f.value ?? '')}"${f.inputmode ? ` inputmode="${f.inputmode}"` : ''} maxlength="200" autocomplete="off">`;
  };
  let pending = false;
  const modal = openDialog({ root, onEscape: () => { if (!pending) askClose(); }, className: 'wb-dialog is-form', labelledBy: 'wb-form-title', returnFocus, html: `<form method="dialog" novalidate><h2 id="wb-form-title">${escapeHtml(title)}</h2>${text ? `<p>${escapeHtml(text)}</p>` : ''}<div class="wb-dialog-grid">${fields.map(f => `<div class="wb-form-row"><label class="wb-form-label" for="wb-form-${escapeHtml(f.key)}">${escapeHtml(f.label)}${f.required ? '<span class="wb-form-required" aria-hidden="true">*</span>' : ''}</label>${control(f)}${f.hint ? `<div class="wb-form-hint">${escapeHtml(f.hint)}</div>` : ''}<div class="wb-form-hint is-error" id="wb-form-${escapeHtml(f.key)}-error" role="alert"></div></div>`).join('')}</div><p class="wb-value-error" role="alert"></p><div class="wb-dialog-foot"><button type="button" class="wb-btn" data-form="cancel">取消</button><button type="submit" class="wb-btn primary">${escapeHtml(submit)}</button></div></form>` });
  const { dialog, close: finish } = modal;
  const form = dialog.querySelector('form'), formError = form.querySelector(':scope > .wb-value-error');
  const el = key => form.querySelector(`[name="${CSS.escape(key)}"]`);
  function mark(key, message) {
    const c = el(key), box = dialog.querySelector(`#wb-form-${CSS.escape(key)}-error`);
    if (!c || !box) return;
    box.textContent = message || '';
    if (message) c.setAttribute('aria-invalid', 'true'); else c.removeAttribute('aria-invalid');
  }
  const initial = JSON.stringify(fields.map(f => el(f.key).value));
  const foot = form.querySelector('.wb-dialog-foot');
  const guard = document.createElement('div');
  guard.className = 'wb-dialog-foot'; guard.hidden = true;
  guard.innerHTML = '<span>有未保存的内容。</span><button type="button" class="wb-btn" data-keep>继续编辑</button><button type="button" class="wb-btn danger" data-discard>放弃</button>';
  form.append(guard);
  function askClose() {
    if (pending) return;
    if (initial === JSON.stringify(fields.map(f => el(f.key).value))) { finish(); return; }
    foot.hidden = true; guard.hidden = false; guard.querySelector('[data-keep]').focus();
  }
  guard.querySelector('[data-keep]').addEventListener('click', () => { guard.hidden = true; foot.hidden = false; form.querySelector('input, select')?.focus(); });
  guard.querySelector('[data-discard]').addEventListener('click', finish);
  dialog.querySelector('[data-form=cancel]').addEventListener('click', askClose);
  form.addEventListener('input', e => { if (e.target.name) mark(e.target.name, ''); formError.textContent = ''; });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (pending || modal.closed) return;
    const values = Object.fromEntries(fields.map(f => [f.key, el(f.key).value.trim()]));
    const missing = fields.filter(f => f.required && !values[f.key]);
    fields.forEach(f => mark(f.key, missing.includes(f) ? `${f.label}未填写` : ''));
    if (missing.length) { el(missing[0].key).focus(); return; }
    pending = true; formError.textContent = '';
    const restore = pendingUI(form, form.querySelector('[type=submit]'));
    try {
      const result = await onSubmit?.(values);
      if (modal.closed) return;
      if (result === true || result === undefined) { finish(); return; }
      if (typeof result === 'string') { formError.textContent = result; return; }
      if (!result || typeof result !== 'object') { formError.textContent = '保存失败，内容已保留，可以重试。'; return; }
      const keys = Object.keys(result);
      keys.forEach(k => mark(k, result[k]));
    } catch (error) { if (!modal.closed) formError.textContent = actionError(error); }
    finally { restore(); pending = false; if (!modal.closed) form.querySelector('[aria-invalid=true]')?.focus(); }
  });
  (form.querySelector('input, select') || form.querySelector('[data-form=cancel]')).focus();
  return { close: finish, dialog };
}

