// ── Object page (rules/5-单据.md) ─────────────────────────────────────────────
// Read and edit mode on the same rows, as in the SAP Fiori object page. Each value is rendered twice: .wb-read for read
// mode and .wb-edit holding the controls; [data-mode] on the page shows one of them. Header actions marked
// data-edit-hide only lose their visibility, so nothing above the form moves. Enter with the edit button, E, a double
// click on an editable value or Enter / F2 on a focused value; focus lands on that value, or on the first required empty
// control. Save checks every control through validate(), shows each problem under its value and in the message list,
// and leaves edit mode only after onSave() resolves. Cancel asks first when something changed.
//   root      element that carries data-mode="read" | "edit"
//   edit      the header edit button
//   footer    the footer toolbar .wb-doc-foot with [data-action=save], [data-action=cancel] and an empty .wb-msg-btn
//   messages  a .wb-popover panel; the list of problems is rendered into it
//   validate  root => [{ control, message, severity: 'error' | 'warning' }]; errors block saving, warnings do not
//   onSave    values => Promise; values maps each control's name to its value
//   canEdit   () => boolean; false while the document's status does not allow changes (submitted, released, voided)
//   changed   () => boolean; extra changes the controls cannot show, such as a line added or removed
//   draft     { interval = 20000, onDraft(values) → Promise, onDiscard({ changed }) }: autosave while editing. The footer's
//             [data-draft-state] shows「草稿已自动保存 16:21」; cancel then asks「放弃这份草稿？」
const OBJECT_STATE_TEXT = { error: '错误', warning: '提醒' };
export function initObjectPage(root, { edit, footer, messages, validate = () => [], onSave = async () => {}, saved = '已保存', canEdit = () => true, changed = () => false, draft = null } = {}) {
  const life = scope();
  const controls = () => [...root.querySelectorAll('.wb-edit :is(input, select, textarea)')];
  const save = footer.querySelector('[data-action=save]'), cancel = footer.querySelector('[data-action=cancel]');
  const msgBtn = footer.querySelector('.wb-msg-btn');
  const draftState = footer.querySelector('[data-draft-state]');
  let snapshot = new Map(), busy = false, problems = [], timer = 0, draftedAt = '', lastDraft = '';
  const mode = () => root.dataset.mode;
  const checkable = c => c.type === 'checkbox' || c.type === 'radio';
  const valueOf = c => (checkable(c) ? c.checked : c.value);
  const dirty = () => mode() === 'edit' && (changed() || controls().some(c => snapshot.get(c) !== valueOf(c)));
  const values = () => Object.fromEntries(controls().filter(c => c.name && (c.type !== 'radio' || c.checked)).map(c => [c.name, c.type === 'radio' ? c.value : valueOf(c)]));
  // Draft (rules/5-单据.md 5.7): while editing, a changed form is handed to draft.onDraft every draft.interval ms.
  function paintDraft(text) { if (draftState) draftState.textContent = text; }
  async function saveDraft() {
    if (!draft || mode() !== 'edit' || busy || !dirty()) return;
    const v = values(), key = JSON.stringify(v);
    if (key === lastDraft && !changed()) return;
    paintDraft('正在保存草稿…');
    try {
      await draft.onDraft(v);
      lastDraft = key;
      draftedAt = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      paintDraft(`草稿已自动保存 ${draftedAt}`);
    } catch { paintDraft('草稿没能自动保存，改动还在本页'); }
  }
  const grow = t => { t.style.height = 'auto'; t.style.height = `${Math.max(32, t.scrollHeight + 1)}px`; };
  const rowOf = c => c.closest('[data-state], .wb-form-value, td') || c.parentElement;
  function clearStates() {
    root.querySelectorAll('[data-state]').forEach(el => { el.removeAttribute('data-state'); el.querySelector(':scope > .wb-value-state')?.remove(); });
    controls().forEach(c => c.removeAttribute('aria-invalid'));
  }
  function showStates(list) {
    clearStates();
    for (const p of list) {
      const host = rowOf(p.control);
      if (host.dataset.state === 'error') continue;
      host.dataset.state = p.severity;
      if (p.severity === 'error') p.control.setAttribute('aria-invalid', 'true');
      let box = host.querySelector(':scope > .wb-value-state');
      if (!box) { box = document.createElement('div'); box.className = 'wb-value-state'; box.setAttribute('role', p.severity === 'error' ? 'alert' : 'status'); host.append(box); }
      box.textContent = p.message;
    }
    const errors = list.filter(p => p.severity === 'error').length;
    msgBtn.hidden = !list.length;
    msgBtn.classList.toggle('is-error', errors > 0);
    msgBtn.innerHTML = list.length ? `${icon(errors ? 'error' : 'warning')}<span>${list.length}</span>` : '';
    msgBtn.setAttribute('aria-label', `消息 ${list.length} 条`);
  }
  function nameOf(c) {
    const label = c.closest('.wb-form-row')?.querySelector('.wb-form-label');
    return label ? label.textContent.replace(/[：:*\s]+$/, '').trim() : c.getAttribute('aria-label') || c.name;
  }
  function openMessages() {
    if (!problems.length) return;
    const group = c => c.closest('.wb-doc-section, .wb-table-block')?.querySelector('h2')?.textContent.trim() || '';
    const sorted = [...problems].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1));
    let last = null;
    messages.innerHTML = `<div class="wb-messages">${sorted.map((p, i) => {
      const g = group(p.control), head = g !== last ? `<h3>${escapeHtml(g)}</h3>` : '';
      last = g;
      return `${head}<button type="button" data-i="${i}" data-severity="${p.severity}">${icon(p.severity === 'error' ? 'error' : 'warning')}<span>${escapeHtml(nameOf(p.control))}</span><small>${OBJECT_STATE_TEXT[p.severity]}：${escapeHtml(p.message)}</small></button>`;
    }).join('')}</div>`;
    messages.querySelectorAll('button[data-i]').forEach(b => life.on(b, 'click', () => {
      const c = sorted[Number(b.dataset.i)].control;
      closePopover('done');
      c.focus({ preventScroll: true });
      c.scrollIntoView({ block: 'nearest' });
    }));
    openPopover(msgBtn, messages);
  }
  function enter(target) {
    if (mode() === 'edit' || !canEdit()) return;
    snapshot = new Map(controls().map(c => [c, valueOf(c)]));
    root.dataset.mode = 'edit';
    lastDraft = JSON.stringify(values());
    if (draft) { paintDraft('草稿'); timer = setInterval(saveDraft, draft.interval ?? 20000); }
    root.querySelectorAll('.wb-edit textarea').forEach(grow);
    const first = target || controls().find(c => c.required && !c.value) || controls()[0];
    first?.focus({ preventScroll: true });
    first?.select?.();
  }
  function leave(restore) {
    if (restore) for (const [c, v] of snapshot) { if (checkable(c)) c.checked = v; else c.value = v; }
    problems = [];
    showStates([]);
    clearInterval(timer);
    root.dataset.mode = 'read';
    edit?.focus({ preventScroll: true });
  }
  async function doSave() {
    if (busy || mode() !== 'edit') return;
    problems = validate(root) || [];
    showStates(problems);
    if (problems.some(p => p.severity === 'error')) { openMessages(); return; }
    busy = true;
    save.setAttribute('aria-busy', 'true'); save.disabled = true; cancel.disabled = true;
    try {
      // A radio group gives its checked value under the group's name; a checkbox gives true or false.
      await onSave(values());
      leave(false);
      toast(saved);
    } catch (err) {
      toast(err?.message || '保存失败，改动还在，可以再试一次');
    } finally {
      busy = false;
      save.removeAttribute('aria-busy'); save.disabled = false; cancel.disabled = false;
    }
  }
  function doCancel() {
    if (!dirty()) { leave(true); draft?.onDiscard?.({ changed: false }); return; }
    const [q, drop] = draft ? ['放弃这份草稿？草稿里的改动都不会保存。', '放弃草稿'] : ['放弃这次的全部改动？', '放弃改动'];
    messages.innerHTML = `<div class="wb-messages"><p class="wb-confirm-text">${q}</p><div class="wb-confirm-actions"><button type="button" class="wb-btn sm" data-keep>继续编辑</button><button type="button" class="wb-btn sm danger" data-drop>${drop}</button></div></div>`;
    life.on(messages.querySelector('[data-keep]'), 'click', () => closePopover('done'));
    life.on(messages.querySelector('[data-drop]'), 'click', () => { closePopover('replace'); leave(true); draft?.onDiscard?.({ changed: true }); });
    openPopover(cancel, messages);
  }
  life.on(edit, 'click', () => enter());
  life.on(save, 'click', doSave);
  life.on(cancel, 'click', doCancel);
  life.on(msgBtn, 'click', openMessages);
  life.on(root, 'dblclick', e => {
    if (mode() !== 'read' || !e.target.closest('.wb-value.is-editable')) return;
    getSelection()?.removeAllRanges();
    enter(e.target.closest('.wb-form-value, td')?.querySelector('.wb-edit :is(input, select, textarea)'));
  });
  life.on(root, 'keydown', e => {
    if (mode() === 'read' && (e.key === 'Enter' || e.key === 'F2') && e.target.matches('.wb-form-value[tabindex]')) { e.preventDefault(); enter(e.target.querySelector('.wb-edit :is(input, select, textarea)')); }
  });
  life.on(root, 'input', e => { if (e.target.matches('.wb-edit textarea')) grow(e.target); });
  life.on(root, 'focusout', e => {
    // A control that was wrong is checked again when it loses focus, so a fixed value clears its state at once.
    if (mode() !== 'edit' || !problems.some(p => p.control === e.target)) return;
    problems = (validate(root) || []).filter(p => problems.some(q => q.control === p.control));
    showStates(problems);
  });
  life.on(window, 'beforeunload', e => { if (dirty()) { e.preventDefault(); e.returnValue = ''; } });
  life.keep(registerShortcut({ keys: 'e', label: '编辑', group: '单据', when: () => mode() === 'read' && Boolean(edit) && canEdit(), run: () => enter() }));
  life.keep(registerShortcut({ keys: 'mod+enter', label: '保存', group: '单据', when: () => mode() === 'edit', run: doSave }));
  life.keep(() => clearInterval(timer));
  msgBtn.hidden = true;
  root.dataset.mode ||= 'read';
  // discard: leave edit mode and throw the changes away without asking (the page asked already, e.g. in a leave dialog).
  return { enter, save: doSave, cancel: doCancel, discard: () => { const was = dirty(); leave(true); draft?.onDiscard?.({ changed: was }); }, saveDraft, values, isDirty: dirty, destroy: life.end };
}

