// ── Picker ───────────────────────────────────────────────────────────────────
// Single-value property picker used by table cells, the properties panel and shortcuts: a command menu anchored to
// the element being edited, opening on the current value.
let pickerPop = null;
export function openPicker(anchor, { label, options, current, icon: optionIcon, onSelect, returnFocus }) {
  const root = anchor.closest('.aham-workbench') || document.querySelector('.aham-workbench');
  if (!pickerPop || !pickerPop.isConnected) {
    pickerPop = document.createElement('div');
    pickerPop.className = 'wb-popover flush';
    pickerPop.hidden = true;
    pickerPop.setAttribute('role', 'dialog');
    pickerPop.innerHTML = '<div></div>';
  }
  const host = anchor.closest('dialog') || root;                       // a modal dialog makes everything outside it inert
  if (pickerPop.parentElement !== host) host.append(pickerPop);
  pickerPop.setAttribute('aria-label', `修改${label}`);
  pickerPop.firstElementChild.className = '';
  createCommand(pickerPop.firstElementChild, {
    label, placeholder: `${label}…`, search: options.length > 6,
    items: options.map(o => ({ id: o, label: o, icon: optionIcon, current: o === current })),
    onSelect: it => { closePopover('done'); if (it.id !== current) onSelect(it.id, current); },
  });
  return openPopover(anchor, pickerPop, { returnFocus });
}

