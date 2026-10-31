// ── Picker ───────────────────────────────────────────────────────────────────
// Single-value property picker used by table cells, the properties panel and shortcuts: a command menu anchored to
// the element being edited, opening on the current value, with search from 5 options. onSelect(value, current) may
// return a promise: the picker stays open until it settles; on false or a throw it stays open, shows the error and
// the original value is kept so the user can pick again.
let pickerPop = null, pickerCommand = null;
export function openPicker(anchor, { label, options, current, icon: optionIcon, onSelect, returnFocus, search = options.length >= 5 }) {
  closePopover('replace');
  pickerCommand?.destroy();
  const root = anchor.closest('.aham-workbench') || document.querySelector('.aham-workbench');
  if (!pickerPop || !pickerPop.isConnected) {
    pickerPop = document.createElement('div');
    pickerPop.className = 'wb-popover flush'; pickerPop.hidden = true;
    pickerPop.setAttribute('role', 'dialog');
  }
  const panel = pickerPop, host = anchor.closest('dialog') || root;
  if (panel.parentElement !== host) host.append(panel);
  panel.setAttribute('aria-label', `修改${label}`);
  panel.innerHTML = '<div></div><p class="wb-value-error" role="alert"></p>';
  const error = panel.querySelector('[role=alert]');
  let pending = false, alive = true;
  const command = pickerCommand = createCommand(panel.firstElementChild, {
    label, placeholder: `${label}…`, search,
    items: options.map(o => ({ id: o, label: o, icon: optionIcon, current: o === current })),
    onSelect: async it => {
      if (!alive || pending) return;
      if (it.id === current) { api.close('done'); return; }
      const disabled = anchor.disabled; anchor.disabled = true;
      pending = true; error.textContent = ''; panel.setAttribute('aria-busy', 'true');
      try {
        if (await onSelect(it.id, current) === false) throw new Error('保存失败，原值未改变，可以重试。');
        anchor.disabled = disabled;
        if (alive) api.close('done');
      } catch (err) { if (alive) error.textContent = actionError(err); }
      finally { anchor.disabled = disabled; if (alive) panel.removeAttribute('aria-busy'); pending = false; }
    },
  });
  const api = openPopover(anchor, panel, { returnFocus, onClose() { alive = false; command.destroy(); panel.removeAttribute('aria-busy'); } });
  return api;
}
