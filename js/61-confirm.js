// ── Confirm dialog ───────────────────────────────────────────────────────────
// One modal question before an action that cannot be taken back (delete, void, withdraw). The title names the action
// and the object; the text says what happens. With `reason`, a required text box comes first and its value is passed on.
// The confirm button carries the action's own verb, never 确定. Esc and 取消 close without acting.
//   openConfirm({ root, title, text, confirm: '删除', danger: true, reason: { label: '作废原因' }, onConfirm(reason) })
// choices adds buttons between 取消 and the confirm button, e.g. the leave dialog of a draft:
//   openConfirm({ title: '离开前保存报价单？', confirm: '保存', choices: [{ label: '放弃草稿', value: 'discard', danger: true },
//     { label: '保留草稿', value: 'keep' }], onConfirm: save, onChoice: value => … })
export function openConfirm({ root, title, text = '', confirm = '确认', danger = false, reason = null, choices = [], onConfirm, onChoice, returnFocus, cancel = '取消' }) {
  let pending = false;
  const modal = openDialog({ root, onEscape: () => { if (!pending) modal.close(); }, labelledBy: 'wb-confirm-title', returnFocus, html: `<form method="dialog" novalidate><h2 id="wb-confirm-title">${escapeHtml(title)}</h2>${text ? `<p>${escapeHtml(text)}</p>` : ''}${reason ? `<label class="wb-dialog-field"><span>${escapeHtml(reason.label)}<span class="wb-form-required" aria-hidden="true">*</span></span><textarea class="wb-field" name="reason" rows="3" maxlength="500" required aria-describedby="wb-confirm-error"></textarea><span class="wb-value-error" id="wb-confirm-error" role="alert"></span></label>` : ''}<p class="wb-value-error" data-action-error role="alert"></p><div class="wb-dialog-foot"><button type="button" class="wb-btn" data-confirm="cancel">${escapeHtml(cancel)}</button>${choices.map((c, i) => `<button type="button" class="wb-btn${c.danger ? ' ghost danger' : ''}" data-choice="${i}">${escapeHtml(c.label)}</button>`).join('')}<button type="submit" class="wb-btn ${danger ? 'danger' : 'primary'}">${escapeHtml(confirm)}</button></div></form>` });
  const { dialog, close: finish } = modal;
  const field = dialog.querySelector('textarea'), err = dialog.querySelector('#wb-confirm-error');
  const error = dialog.querySelector('[data-action-error]');
  async function act(button, run) {
    if (pending || modal.closed) return;
    pending = true; error.textContent = '';
    const restore = pendingUI(dialog, button, '处理中…');
    try {
      if (await run() === false) throw new Error('操作未完成，可以重试。');
      if (!modal.closed) finish();
    } catch (e) { if (!modal.closed) error.textContent = actionError(e); }
    finally { restore(); pending = false; }
  }
  dialog.querySelectorAll('[data-choice]').forEach(b => b.addEventListener('click', () => act(b, () => onChoice?.(choices[Number(b.dataset.choice)].value))));
  dialog.querySelector('[data-confirm=cancel]').addEventListener('click', () => { if (!pending) finish(); });
  field?.addEventListener('input', () => { err.textContent = ''; field.removeAttribute('aria-invalid'); });
  dialog.querySelector('form').addEventListener('submit', e => {
    e.preventDefault();
    if (pending) return;
    const value = field ? field.value.trim() : '';
    if (field && !value) { err.textContent = `${reason.label}未填写`; field.setAttribute('aria-invalid', 'true'); field.focus(); return; }
    act(dialog.querySelector('[type=submit]'), () => onConfirm?.(value));
  });
  (field || dialog.querySelector('[data-confirm=cancel]')).focus();
  return { close: finish };
}
