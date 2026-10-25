// ── Property pickers ─────────────────────────────────────────────────────────
// Properties panel values that open a command menu (Circle's status / assignee pickers). Buttons [data-prop="key"]
// inside `root`; fields: { key: { label, options, icon? } }. The current value is marked; choosing closes and reports.
export function initPropertyPickers({ container, fields, value, onChange }) {
  let values = { ...value };
  function paint() {
    container.querySelectorAll('[data-prop]').forEach(b => {
      const key = b.dataset.prop, f = fields[key], v = values[key];
      b.classList.toggle('is-empty', !v);
      // person: true shows people as an avatar plus the name (rules/3-控件.md 3.11).
      const lead = f.person && v ? `<span class="wb-avatar-xs" data-cat="${avatarCat(v)}" aria-hidden="true">${escapeHtml([...v][0])}</span>` : f.icon ? icon(f.icon) : '';
      b.innerHTML = `${lead}<span>${escapeHtml(v || `设置${f.label}`)}</span>`;
      b.setAttribute('aria-label', `${f.label}：${v || '未设置'}，点击修改`);
      b.setAttribute('aria-haspopup', 'dialog');
      if (!b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded', 'false');
    });
  }
  container.addEventListener('click', e => {
    const b = e.target.closest('[data-prop]');
    if (!b) return;
    const key = b.dataset.prop, f = fields[key];
    openPicker(b, { label: f.label, options: f.options, current: values[key], icon: f.icon, onSelect: (v, before) => { values = { ...values, [key]: v }; paint(); onChange?.(key, v, before); } });
  });
  paint();
  return { set(next) { values = { ...next }; paint(); }, get: () => ({ ...values }) };
}

