// ── Create dialog ────────────────────────────────────────────────────────────
// Quick create, as Circle's new-issue modal: borderless title, description, property chips that open pickers,
// then 继续新建 and the primary button. ⌘/Ctrl+Enter creates. Closing with unsaved text asks in place
// (继续编辑 / 放弃 / 创建) instead of stacking a second modal. The title error is shown under the title.
// fields: [{ key, label, options, icon?, value? }]; onSubmit({ title, description, ...props }) → true when saved.
// returnFocus: where focus goes on close when the element that opened the dialog was re-rendered meanwhile.
export function openCreateDialog({ root, title: heading, scope, fields = [], onSubmit, returnFocus }) {
  const dialog = document.createElement('dialog');
  dialog.className = 'wb-create';
  dialog.setAttribute('aria-labelledby', 'wb-create-title');
  const props = Object.fromEntries(fields.map(f => [f.key, f.value ?? '']));
  dialog.innerHTML = `<form method="dialog" novalidate>
    <div class="wb-create-head">${scope ? `<span class="wb-create-scope">${escapeHtml(scope)}</span>${icon('chevron-right')}` : ''}<span id="wb-create-title">${escapeHtml(heading)}</span></div>
    <input class="wb-create-name" name="title" aria-label="标题" placeholder="标题" maxlength="200" autocomplete="off" aria-describedby="wb-create-error">
    <p class="wb-value-error" id="wb-create-error" role="alert"></p>
    <textarea class="wb-create-desc" name="description" aria-label="说明" placeholder="补充说明…" rows="3" maxlength="2000"></textarea>
    <div class="wb-create-props">${fields.map(f => `<button type="button" class="wb-btn sm" data-create-prop="${escapeHtml(f.key)}" aria-haspopup="dialog" aria-expanded="false"></button>`).join('')}</div>
    <div class="wb-create-foot">
      <label class="wb-switch"><input type="checkbox" name="more"><span aria-hidden="true"></span>继续新建</label>
      <div class="wb-create-actions"><button type="button" class="wb-btn sm" data-create="cancel">取消</button><button type="submit" class="wb-btn sm primary">创建</button></div>
    </div>
    <div class="wb-create-foot wb-create-confirm" hidden><span>有未保存的内容。</span><div class="wb-create-actions"><button type="button" class="wb-btn sm" data-create="keep">继续编辑</button><button type="button" class="wb-btn sm ghost danger" data-create="discard">放弃</button><button type="button" class="wb-btn sm primary" data-create="save">创建</button></div></div>
  </form>`;
  root.append(dialog);
  const form = dialog.querySelector('form'), name = form.title, desc = form.description, err = dialog.querySelector('#wb-create-error');
  const [foot, confirm] = dialog.querySelectorAll('.wb-create-foot');
  const returnTo = document.activeElement;
  const paintProps = () => dialog.querySelectorAll('[data-create-prop]').forEach(b => {
    const f = fields.find(x => x.key === b.dataset.createProp), v = props[f.key];
    b.innerHTML = `${f.icon ? icon(f.icon) : ''}<span>${escapeHtml(v || f.label)}</span>`;
    b.classList.toggle('is-empty', !v);
    b.setAttribute('aria-label', `${f.label}：${v || '未设置'}`);
  });
  const dirty = () => Boolean(name.value.trim() || desc.value.trim());
  let release = null;
  function finish() { release?.(); leave(dialog, () => { dialog.close(); dialog.remove(); (returnTo?.isConnected ? returnTo : returnFocus)?.focus?.(); }); }
  function askClose() {
    if (!dirty()) { finish(); return; }
    foot.hidden = true; confirm.hidden = false;
    confirm.querySelector('[data-create="keep"]').focus();
  }
  async function submit() {
    const t = name.value.trim();
    if (!t) { err.textContent = '标题未填写'; name.setAttribute('aria-invalid', 'true'); name.focus(); foot.hidden = false; confirm.hidden = true; return; }
    const ok = await onSubmit({ title: t, description: desc.value.trim(), ...props });
    if (!ok) return;
    if (form.more.checked) { name.value = ''; desc.value = ''; err.textContent = ''; name.removeAttribute('aria-invalid'); name.focus(); return; }
    finish();
  }
  dialog.addEventListener('cancel', e => e.preventDefault());
  form.addEventListener('submit', e => { e.preventDefault(); submit(); });
  form.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.isComposing) { e.preventDefault(); submit(); } });
  name.addEventListener('input', () => { err.textContent = ''; name.removeAttribute('aria-invalid'); });
  dialog.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.createProp) {
      const f = fields.find(x => x.key === b.dataset.createProp);
      openPicker(b, { label: f.label, options: f.options, current: props[f.key], icon: f.icon, onSelect: v => { props[f.key] = v; paintProps(); } });
    } else if (b.dataset.create === 'cancel') askClose();
    else if (b.dataset.create === 'keep') { foot.hidden = false; confirm.hidden = true; name.focus(); }
    else if (b.dataset.create === 'discard') finish();
    else if (b.dataset.create === 'save') submit();
  });
  paintProps();
  dialog.showModal();
  release = pushLayer(() => (confirm.hidden ? askClose() : (foot.hidden = false, confirm.hidden = true, name.focus())));
  name.focus();
  return { close: finish };
}

