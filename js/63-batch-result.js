// ── Result of processing several items (rules/6-反馈.md 6.4) ──────────────────
// All done: a toast, no dialog. Some or all failed: a dialog whose first line is「X / Y 个已处理」and whose list
// names each item that failed and why. items: [{ name, reason }] for the failures; total: how many were sent.
export function showBatchResult({ root, action, noun, total, failed = [], returnFocus }) {
  const done = total - failed.length;
  if (!failed.length) { toast(`已${action} ${total} 个${noun}`); return null; }
  const { dialog, close: finish } = openDialog({ root, className: 'wb-dialog is-form', labelledBy: 'wb-batch-title', returnFocus, html: `<form method="dialog"><h2 id="wb-batch-title">${done ? `${escapeHtml(action)}了部分${escapeHtml(noun)}` : `没有${escapeHtml(noun)}被${escapeHtml(action)}`}</h2><p>${done} / ${total} 个已${escapeHtml(action)}。下面 ${failed.length} 个没有${escapeHtml(action)}，仍保持勾选，处理后可以再试一次。</p><ul class="wb-batch-list">${failed.map(f => `<li>${icon('error')}<span>${escapeHtml(f.name)}</span><small>${escapeHtml(f.reason)}</small></li>`).join('')}</ul><div class="wb-dialog-foot"><button type="submit" class="wb-btn primary">关闭</button></div></form>` });
  dialog.querySelector('form').addEventListener('submit', e => { e.preventDefault(); finish(); });
  dialog.querySelector('[type=submit]').focus();
  return { close: finish };
}

