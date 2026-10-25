// ── Create dialog ────────────────────────────────────────────────────────────
// Quick create, as Circle's new-issue modal: borderless title, description, property chips that open pickers,
// then 继续新建 and the primary button. ⌘/Ctrl+Enter creates. Closing with unsaved text asks in place
// (继续编辑 / 放弃 / 创建) instead of stacking a second modal. The title error is shown under the title.
// fields: [{ key, label, options, icon?, value? }]; onSubmit({ title, description, ...inputs, ...props }) → true when saved.
// The first input names the object: nameLabel says what it is (客户全称, not 标题). inputs adds plain text lines under it
// (统一社会信用代码); description: false drops the free-text box. check(values) returns an error to show under the name,
// e.g. a duplicate found before the record is created.
// returnFocus: where focus goes on close when the element that opened the dialog was re-rendered meanwhile.
export function openCreateDialog({ root, title: heading, scope, fields = [], onSubmit, returnFocus, nameLabel = '标题', inputs = [], description = '补充说明…', check }) {
  const props = Object.fromEntries(fields.map(f => [f.key, f.value ?? '']));
  let confirm = null, foot = null, name = null;
  const keep = () => { foot.hidden = false; confirm.hidden = true; name.focus(); };
  const { dialog, close: finish } = openDialog({ root, className: 'wb-create', labelledBy: 'wb-create-title', returnFocus,
    onEscape: () => (confirm.hidden ? askClose() : keep()), html: `<form method="dialog" novalidate>
    <div class="wb-create-head">${scope ? `<span class="wb-create-scope">${escapeHtml(scope)}</span>${icon('chevron-right')}` : ''}<span id="wb-create-title">${escapeHtml(heading)}</span></div>
    <input class="wb-create-name" name="title" aria-label="${escapeHtml(nameLabel)}" placeholder="${escapeHtml(nameLabel)}" maxlength="200" autocomplete="off" aria-describedby="wb-create-error">
    <p class="wb-value-error" id="wb-create-error" role="alert"></p>
    ${inputs.map(f => `<input class="wb-create-desc" name="${escapeHtml(f.key)}" aria-label="${escapeHtml(f.label)}" placeholder="${escapeHtml(f.placeholder || f.label)}" maxlength="${f.maxlength || 200}" autocomplete="off">`).join('')}
    ${description === false ? '' : `<textarea class="wb-create-desc" name="description" aria-label="说明" placeholder="${escapeHtml(description)}" rows="3" maxlength="2000"></textarea>`}
    <div class="wb-create-props">${fields.map(f => `<button type="button" class="wb-btn sm" data-create-prop="${escapeHtml(f.key)}" aria-haspopup="dialog" aria-expanded="false"></button>`).join('')}</div>
    <div class="wb-create-foot">
      <label class="wb-switch"><input type="checkbox" name="more"><span aria-hidden="true"></span>继续新建</label>
      <div class="wb-create-actions"><button type="button" class="wb-btn sm" data-create="cancel">取消</button><button type="submit" class="wb-btn sm primary">创建</button></div>
    </div>
    <div class="wb-create-foot wb-create-confirm" hidden><span>有未保存的内容。</span><div class="wb-create-actions"><button type="button" class="wb-btn sm" data-create="keep">继续编辑</button><button type="button" class="wb-btn sm ghost danger" data-create="discard">放弃</button><button type="button" class="wb-btn sm primary" data-create="save">创建</button></div></div>
  </form>` });
  const form = dialog.querySelector('form'), desc = form.elements.description || { value: '' }, err = dialog.querySelector('#wb-create-error');
  name = form.elements.title;
  [foot, confirm] = dialog.querySelectorAll('.wb-create-foot');
  const paintProps = () => dialog.querySelectorAll('[data-create-prop]').forEach(b => {
    const f = fields.find(x => x.key === b.dataset.createProp), v = props[f.key];
    b.innerHTML = `${f.icon ? icon(f.icon) : ''}<span>${escapeHtml(v || f.label)}</span>`;
    b.classList.toggle('is-empty', !v);
    b.setAttribute('aria-label', `${f.label}：${v || '未设置'}`);
  });
  const dirty = () => Boolean(name.value.trim() || desc.value.trim() || inputs.some(f => form.elements[f.key].value.trim()));
  function askClose() {
    if (!dirty()) { finish(); return; }
    foot.hidden = true; confirm.hidden = false;
    confirm.querySelector('[data-create="keep"]').focus();
  }
  async function submit() {
    const t = name.value.trim();
    const fail = text => { err.textContent = text; name.setAttribute('aria-invalid', 'true'); name.focus(); foot.hidden = false; confirm.hidden = true; };
    if (!t) { fail(`${nameLabel}未填写`); return; }
    const values = { title: t, description: desc.value.trim(), ...Object.fromEntries(inputs.map(f => [f.key, form.elements[f.key].value.trim()])), ...props };
    const problem = check?.(values);
    if (problem) { fail(problem); return; }
    const ok = await onSubmit(values);
    if (!ok) return;
    if (form.more.checked) { name.value = ''; desc.value = ''; inputs.forEach(f => { form.elements[f.key].value = ''; }); err.textContent = ''; name.removeAttribute('aria-invalid'); name.focus(); return; }
    finish();
  }
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
    else if (b.dataset.create === 'keep') keep();
    else if (b.dataset.create === 'discard') finish();
    else if (b.dataset.create === 'save') submit();
  });
  paintProps();
  name.focus();
  return { close: finish };
}

