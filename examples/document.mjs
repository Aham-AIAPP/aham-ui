// Quotation document (rules/5-单据.md). One page for read and edit mode, with the status deciding which actions show.
// Display mode keeps its actions in the head; edit mode moves 放弃草稿 and 保存 into the footer toolbar, as in SAP Fiori.
//   草稿 / 已退回  编辑、提交审批；更多：复制为新报价、删除
//   审批中        撤回；演示用的「通过」「退回」在提示条里
//   已生效        打印；更多：复制为新报价、作废
//   已作废        只能查看、打印和复制
// State lives in this page only. print.html reads the last saved copy from sessionStorage.
import { initShell, initObjectPage, initAnchorBar, openConfirm, openFormDialog, openPopover, closePopover, createCommand, toast, icon, escapeHtml as esc } from '../aham.js';
import { defaults, lineCents, totals, money } from './quotation-model.mjs';

const root = document.querySelector('.aham-workbench');
const doc = root.querySelector('#doc');
const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];

const STATUS = {
  draft: { label: '草稿', tone: 'draft' },
  review: { label: '审批中', tone: 'info' },
  returned: { label: '已退回', tone: 'warning' },
  approved: { label: '已生效', tone: 'success' },
  voided: { label: '已作废', tone: '' },
};
const EDITABLE = ['draft', 'returned'];

// Field definitions. `fixed` values are set by the system and stay as text in edit mode.
const FIELDS = {
  basic: [
    { key: 'customer', label: '客户', required: true, type: 'select', options: ['远川精密制造有限公司', '临港智能装备有限公司', '华东精工集团'] },
    { key: 'opportunity', label: '关联商机', required: true },
    { key: 'contact', label: '客户联系人', required: true },
    { key: 'owner', label: '负责人', fixed: true },
    { key: 'quoteDate', label: '报价日期', required: true, type: 'date' },
    { key: 'validTo', label: '有效期至', required: true, type: 'date' },
    { key: 'currency', label: '结算币种', type: 'select', options: ['人民币 CNY', '美元 USD'] },
    { key: 'tax', label: '价格口径', type: 'radio', options: ['含税', '不含税'] },
  ],
  terms: [
    { key: 'delivery', label: '交付方式', type: 'select', options: ['本地部署', '云端订阅'] },
    { key: 'site', label: '实施地点' },
    { key: 'period', label: '项目周期' },
    { key: 'payment', label: '付款方式', fixed: true },
    { key: 'note', label: '内部备注', type: 'textarea', full: true, hint: '只在团队内可见，不打印' },
  ],
};

const state = {
  status: 'draft',
  fields: {
    customer: '远川精密制造有限公司', opportunity: 'MES 一期建设项目', contact: '', owner: '林悦 · 华东销售组',
    quoteDate: '2026-09-30', validTo: '2026-10-30', currency: '人民币 CNY', tax: '含税',
    delivery: '本地部署', site: '苏州 · 一期生产基地', period: '合同生效后 90 天', payment: '40% 预付 / 40% 上线 / 20% 终验',
    note: '设备接口以现场确认清单为准。',
  },
  rows: defaults(),
  returnReason: '', voidReason: '',
  history: [{ who: '林悦', what: '创建报价单', when: '09-29 16:20' }],
};

// Lines that can be added in edit mode (demonstration catalogue).
const CATALOG = [
  { name: '数据看板许可', code: 'SW-050 · 车间与管理看板', unit: '套', priceCents: 36000_00, type: 'software' },
  { name: '移动端许可', code: 'SW-055 · 巡检与报工 App', unit: '个', priceCents: 900_00, type: 'software' },
  { name: '二次开发', code: 'SV-030 · 按需求评估', unit: '人天', priceCents: 2_500_00, type: 'service' },
];
// Rows on screen: the saved rows in read mode, a working copy in edit mode (lines can be added and removed).
let work = state.rows, nextId = 100;

const now = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
const canEdit = () => EDITABLE.includes(state.status);
const lowDiscount = rows => rows.some(r => r.discountTenths < 800);

// ── Form rows ────────────────────────────────────────────────────────────────
// Markup of one editable row:
//   <div class="wb-form-row">
//     <div class="wb-form-label" id="l-…">客户<span class="wb-form-required">*</span></div>
//     <div class="wb-form-value" tabindex="0" aria-labelledby="l-…">
//       <span class="wb-read"><span class="wb-value">…</span></span>
//       <span class="wb-edit"><select class="wb-field" name="…" required>…</select></span>
//     </div>
//   </div>
function control(f) {
  const v = state.fields[f.key], attrs = `name="${f.key}" aria-labelledby="l-${f.key}"${f.required ? ' required' : ''}`;
  if (f.type === 'select') return `<select class="wb-field" ${attrs}>${f.options.map(o => `<option${o === v ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  if (f.type === 'radio') return `<span class="wb-choices" role="radiogroup" aria-labelledby="l-${f.key}">${f.options.map(o => `<label class="wb-choice"><input type="radio" name="${f.key}" value="${esc(o)}"${o === v ? ' checked' : ''}>${esc(o)}</label>`).join('')}</span>`;
  if (f.type === 'textarea') return `<textarea class="wb-field" rows="1" maxlength="500" ${attrs}>${esc(v)}</textarea>`;
  if (f.type === 'date') return `<input class="wb-field wb-mono" type="date" ${attrs} value="${esc(v)}">`;
  return `<input class="wb-field" maxlength="200" ${attrs} value="${esc(v)}">`;
}
function readValue(f) {
  const v = state.fields[f.key];
  if (!v) return f.required ? '<span class="wb-value is-missing">没填</span>' : '<span class="wb-value is-empty">–</span>';
  return `<span class="wb-value${f.type === 'date' ? ' wb-mono' : ''}${canEdit() ? ' is-editable' : ''}">${esc(v)}</span>`;
}
function formRow(f) {
  const label = `<div class="wb-form-label" id="l-${f.key}">${esc(f.label)}${f.required ? '<span class="wb-form-required" aria-hidden="true">*</span>' : ''}</div>`;
  const hint = f.hint ? `<div class="wb-form-hint" data-edit-only>${esc(f.hint)}</div>` : '';
  const value = f.fixed
    ? `<div class="wb-form-value"><span class="wb-value">${esc(state.fields[f.key])}</span></div>`
    : `<div class="wb-form-value" tabindex="0" aria-labelledby="l-${f.key}"><span class="wb-read">${readValue(f)}</span><span class="wb-edit">${control(f)}</span></div>`;
  return `<div class="wb-form-row${f.full ? ' is-full' : ''}">${label}${value}${hint}</div>`;
}
function renderForms() {
  $('#f-basic').innerHTML = FIELDS.basic.map(formRow).join('');
  $('#f-terms').innerHTML = FIELDS.terms.map(formRow).join('');
}

// ── Line items: quantity and discount are editable, the amount follows them ──
function lineRow(r, i) {
  const editable = canEdit() ? ' is-editable' : '';
  return `<tr data-id="${r.id}"><td class="wb-mono wb-meta">${i + 1}</td><td>${esc(r.name)}</td><td class="wb-mono wb-meta">${esc(r.code.split(' · ')[0])}</td>`
    + `<td class="number"><span class="wb-read"><span class="wb-value${editable}">${r.qty}</span></span><span class="wb-edit"><input class="wb-field is-number" name="qty-${r.id}" aria-label="第 ${i + 1} 行 ${esc(r.name)} 数量" inputmode="numeric" value="${r.qty}"></span></td>`
    + `<td>${esc(r.unit)}</td><td class="number">${money(r.priceCents)}</td>`
    + `<td class="number"><span class="wb-read"><span class="wb-value${editable}">${(r.discountTenths / 10).toFixed(1)}</span></span><span class="wb-edit"><input class="wb-field is-number" name="disc-${r.id}" aria-label="第 ${i + 1} 行 ${esc(r.name)} 折扣" inputmode="decimal" value="${(r.discountTenths / 10).toFixed(1)}"></span></td>`
    + `<td class="number" data-amount>${money(lineCents(r))}</td>`
    + `<td class="wb-row-actions" data-edit-only><button type="button" class="wb-icon-btn" data-remove="${r.id}" aria-label="删除第 ${i + 1} 行 ${esc(r.name)}" data-tooltip="删除这一行">${icon('trash')}</button></td></tr>`;
}
function renderLines() {
  $('#lines').innerHTML = work.map(lineRow).join('');
  renderLineMeta();
  renderTotals(work);
}
const renderLineMeta = () => { $('#lines-meta').textContent = `${work.length} 项 · 金额单位：元`; };
// After a line is added or removed in edit mode: renumber, recount and total again without touching typed values.
function relines() {
  $$('#lines tr').forEach((tr, i) => { tr.firstElementChild.textContent = i + 1; });
  renderLineMeta();
  const rows = typedRows();
  renderTotals(rows.map((r, i) => r || work[i]));
}
function renderTotals(rows) {
  const t = totals(rows);
  renderFacts(t.total);
  $('#lines-total').textContent = money(t.total);
  $('#sum-total').textContent = money(t.total);
  $('#sum-software').textContent = money(t.software);
  $('#sum-service').textContent = money(t.service);
  $('#sum-original').textContent = money(t.original);
  $('#sum-discount').textContent = money(t.discount);
  t.payments.forEach((p, i) => { $(`#pay-${i + 1}`).textContent = money(p); });
}

// Rows as typed in edit mode; null when a value cannot be read yet (the amount then keeps its last value).
const parseQty = v => (/^\d+$/.test(v.trim()) && Number(v) <= 999 ? Number(v) : null);
const parseDisc = v => (/^\d+(\.\d)?$/.test(v.trim()) && Number(v) <= 100 ? Math.round(Number(v) * 10) : null);
function typedRows() {
  return work.map(r => {
    const qty = parseQty(doc.querySelector(`[name=qty-${r.id}]`).value), disc = parseDisc(doc.querySelector(`[name=disc-${r.id}]`).value);
    return qty === null || disc === null ? null : { ...r, qty, discountTenths: disc };
  });
}
doc.addEventListener('input', e => {
  if (!e.target.matches('[name^=qty-], [name^=disc-]')) return;
  const rows = typedRows();
  rows.forEach((r, i) => { if (r) doc.querySelector(`tr[data-id="${work[i].id}"] [data-amount]`).textContent = money(lineCents(r)); });
  renderTotals(rows.map((r, i) => r || work[i]));
});

// ── Key facts in the head: four read-only pairs that fold away when the page scrolls ─────────
function renderFacts(totalCents) {
  const f = state.fields;
  $('#doc-facts').innerHTML = [['客户', esc(f.customer || '–')], ['价税合计（元）', money(totalCents), 'is-amount'], ['有效期至', esc(f.validTo || '–'), 'is-amount'], ['负责人', esc(f.owner)]]
    .map(([k, v, c]) => `<div><dt>${k}</dt><dd${c ? ` class="${c}"` : ''}>${v}</dd></div>`).join('');
}

// ── Status: badge, message strip, actions, approval, history ─────
function renderStatus() {
  const s = STATUS[state.status];
  const badge = $('#doc-status');
  badge.dataset.tone = s.tone;
  badge.lastElementChild.textContent = s.label;
  const last = state.history[0];
  $('#doc-updated').textContent = `${last.who} · ${last.when}`;

  const strip = $('#doc-strip');
  const set = (tone, iconName, html) => { strip.hidden = false; strip.dataset.tone = tone; strip.innerHTML = `${icon(iconName)}<span class="wb-grow">${html}</span>`; };
  strip.hidden = true;
  if (state.status === 'review') set('info', 'info', '已提交，等待销售负责人王卓审批。审批期间不能修改，需要改动时先撤回。<span class="wb-meta">演示：</span><button type="button" class="wb-btn sm" data-demo="approve">通过</button> <button type="button" class="wb-btn sm" data-demo="return">退回</button>');
  if (state.status === 'returned') set('warning', 'warning', `王卓退回：${esc(state.returnReason)}。修改后重新提交。`);
  if (state.status === 'approved') set('success', 'success', '已生效，可以打印发给客户。生效后不能修改，条件变化时复制为新报价。');
  if (state.status === 'voided') set('', 'info', `已作废：${esc(state.voidReason)}。只能查看、打印和复制。`);

  $('#doc-edit').hidden = !canEdit();
  $('#doc-submit').hidden = !canEdit();
  $('#doc-submit').textContent = state.status === 'returned' ? '重新提交' : '提交审批';
  $('#doc-withdraw').hidden = state.status !== 'review';
  $('#doc-print').classList.toggle('primary', state.status === 'approved');

  const steps = [{ who: '林悦 · 提交', done: state.status !== 'draft' }];
  steps.push({ who: '王卓 · 销售负责人', done: state.status === 'approved', current: state.status === 'review', note: state.status === 'returned' ? '已退回' : '' });
  if (lowDiscount(state.rows)) steps.push({ who: '商务负责人', done: state.status === 'approved', note: '折扣低于 8 折时加签' });
  $('#approval').innerHTML = steps.map(st => `<li class="${st.done ? 'done' : ''}"><span class="wb-step-dot"></span><div><strong>${esc(st.who)}</strong><small>${st.done ? '已完成' : st.note || (st.current ? '处理中' : '待处理')}</small></div></li>`).join('');
  $('#history').innerHTML = `<h2>变更记录</h2>${state.history.slice(0, 5).map(h => `<p><strong>${esc(h.who)}</strong> ${esc(h.what)}</p><span>${esc(h.when)}</span>`).join('')}`;
}
function setStatus(next, what) {
  state.status = next;
  renderForms();
  state.history.unshift({ who: next === 'approved' || next === 'returned' ? '王卓' : '林悦', what, when: `今天 ${now()}` });
  renderLines();
  renderStatus();
  publish();
}
// The print preview reads this copy.
function publish() {
  try { sessionStorage.setItem('aham-quote', JSON.stringify({ status: state.status, fields: state.fields, rows: state.rows.map(r => ({ id: r.id, qty: r.qty, discountTenths: r.discountTenths })) })); } catch { /* storage blocked: the preview shows the sample data */ }
}

// ── Edit, validate, save ─────────────────────────────────────────────────────
function validate() {
  const out = [];
  for (const c of doc.querySelectorAll('.wb-edit [required]')) if (!c.value.trim()) out.push({ control: c, severity: 'error', message: '必填，没填' });
  const from = doc.querySelector('[name=quoteDate]'), to = doc.querySelector('[name=validTo]');
  if (from.value && to.value && to.value < from.value) out.push({ control: to, severity: 'error', message: '要晚于报价日期' });
  for (const r of work) {
    const q = doc.querySelector(`[name=qty-${r.id}]`), d = doc.querySelector(`[name=disc-${r.id}]`);
    if (parseQty(q.value) === null) out.push({ control: q, severity: 'error', message: '填 0～999 的整数' });
    const disc = parseDisc(d.value);
    if (disc === null) out.push({ control: d, severity: 'error', message: '填 0～100，最多一位小数' });
    else if (disc < 800) out.push({ control: d, severity: 'warning', message: '低于 8 折，提交后加一级商务负责人审批' });
  }
  return out;
}
async function save(values) {
  await new Promise(r => setTimeout(r, 300));
  for (const f of [...FIELDS.basic, ...FIELDS.terms]) if (!f.fixed && f.key in values) state.fields[f.key] = String(values[f.key]).trim();
  state.rows = typedRows();
  work = state.rows;
  state.history.unshift({ who: '林悦', what: '修改报价', when: `今天 ${now()}` });
  renderForms();
  renderLines();
  renderStatus();
  publish();
}

// Submitting checks the saved values: a required field left empty stops it, and the strip names the field.
function submit() {
  const missing = [...FIELDS.basic, ...FIELDS.terms].filter(f => f.required && !state.fields[f.key]);
  if (missing.length) {
    const strip = $('#doc-strip');
    strip.hidden = false;
    strip.dataset.tone = 'danger';
    strip.innerHTML = `${icon('error')}<span class="wb-grow">还有 ${missing.length} 项必填没填：${missing.map(f => esc(f.label)).join('、')}。补齐后再提交。</span><button type="button" class="wb-btn sm" data-fill="${missing[0].key}">去填写</button>`;
    return;
  }
  setStatus('review', state.status === 'returned' ? '重新提交审批' : '提交审批');
  toast('已提交审批');
}

// ── More menu: copy, delete (draft only), void (released only) ─────────────
function menuItems() {
  const items = [{ id: 'copy', label: '复制为新报价', icon: 'copy', group: 0 }];
  if (canEdit()) items.push({ id: 'delete', label: '删除', icon: 'trash', danger: true, group: 1 });
  if (state.status === 'approved') items.push({ id: 'void', label: '作废', icon: 'close', danger: true, group: 1 });
  return items;
}
function openMenu() {
  const pop = $('#doc-menu'), more = $('#doc-more');
  createCommand(pop.firstElementChild, {
    role: 'menu', search: false, label: '更多操作', items: menuItems(),
    onSelect: it => {
      closePopover('replace');
      if (it.id === 'copy') toast('已复制为新报价 QT-20261017-001（示例：不会打开新单据）');
      if (it.id === 'delete') openConfirm({ root, title: '删除报价单 QT-20260930-018？', text: '删除后不能恢复。已发给客户的报价请改用作废。', confirm: '删除', danger: true, returnFocus: more, onConfirm: removeDocument });
      if (it.id === 'void') openConfirm({ root, title: '作废报价单 QT-20260930-018？', text: '作废后客户手里的报价失效，单据保留可查。', confirm: '作废', danger: true, reason: { label: '作废原因' }, returnFocus: more, onConfirm: reason => { state.voidReason = reason; setStatus('voided', '作废报价单'); toast('已作废'); } });
    },
  });
  openPopover(more, pop, { align: 'end' });
  pop.querySelector('[role=menu]').focus();
}
function removeDocument() {
  doc.innerHTML = '<div class="wb-doc-body"><div class="wb-empty"><strong>报价单 QT-20260930-018 已删除</strong><p>删除的单据不进回收站。</p><a class="wb-btn" href="list.html">返回列表</a></div></div>';
  root.querySelector('.wb-context').hidden = true;
  toast('已删除');
}

// ── Wiring ───────────────────────────────────────────────────────────────────
root.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.id === 'doc-submit') submit();
  else if (b.id === 'doc-more') openMenu();
  else if (b.id === 'doc-withdraw') openConfirm({ root, title: '撤回审批？', text: '撤回后报价单回到草稿，可以继续修改，审批人那边的待办会取消。', confirm: '撤回', returnFocus: b, onConfirm: () => { setStatus('draft', '撤回审批'); toast('已撤回，报价单回到草稿'); } });
  else if (b.dataset.demo === 'approve') { setStatus('approved', '审批通过'); toast('王卓已通过'); }
  else if (b.dataset.demo === 'return') openConfirm({ root, title: '退回报价单？', confirm: '退回', reason: { label: '退回原因' }, returnFocus: b, onConfirm: reason => { state.returnReason = reason; setStatus('returned', '退回报价单'); } });
  else if (b.dataset.fill) { $('#doc-strip').hidden = true; page.enter(doc.querySelector(`[name=${b.dataset.fill}]`)); }
  else if (b.id === 'line-add') addLine(b);
  else if (b.dataset.remove) removeLine(Number(b.dataset.remove));
});

// A line has three fields to fill, so it is added in a dialog (rules/5-单据.md 5.11); quantity and discount stay
// editable in the table afterwards. Removing a line in edit mode asks nothing: 放弃草稿 brings it back.
function addLine(trigger) {
  openFormDialog({
    root, title: '添加报价明细', submit: '添加', returnFocus: trigger,
    fields: [
      { key: 'item', label: '产品 / 服务', type: 'select', required: true, options: [{ value: '', label: '选择产品或服务' }, ...CATALOG.map((c, i) => ({ value: String(i), label: `${c.code.split(' · ')[0]} · ${c.name}` }))] },
      { key: 'qty', label: '数量', type: 'number', inputmode: 'numeric', required: true, value: '1', hint: '0～999 的整数' },
      { key: 'disc', label: '折扣 %', type: 'number', inputmode: 'decimal', value: '100.0', hint: '100.0 表示不打折' },
    ],
    onSubmit: v => {
      const qty = parseQty(v.qty), disc = parseDisc(v.disc || '100');
      const bad = {};
      if (qty === null) bad.qty = '填 0～999 的整数';
      if (disc === null) bad.disc = '填 0～100，最多一位小数';
      if (Object.keys(bad).length) return bad;
      const row = { id: nextId++, ...CATALOG[Number(v.item)], qty, discountTenths: disc };
      work = [...work, row];
      $('#lines').insertAdjacentHTML('beforeend', lineRow(row, work.length - 1));
      relines();
      toast(`已添加 ${row.name}`);
      return true;
    },
  });
}
function removeLine(id) {
  const i = work.findIndex(r => r.id === id), name = work[i].name;
  const next = $(`#lines tr[data-id="${id}"]`).nextElementSibling?.querySelector('[data-remove]') || $('#line-add');
  work = work.filter(r => r.id !== id);
  $(`#lines tr[data-id="${id}"]`).remove();
  relines();
  next.focus();
  toast(`已删除 ${name}，保存后生效`);
}

// Leaving the page with unsaved changes (rules/5-单据.md 5.7): save, keep the draft or discard it.
let keepDraft = false;
root.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || a.target === '_blank' || !page.isDirty()) return;
  e.preventDefault();
  const go = () => { location.href = a.href; };
  openConfirm({
    root, title: '离开前保存报价单？', text: '报价单还在编辑中，有改动没有保存。保留草稿时，改动只有本人看得到，下次打开时继续编辑。',
    confirm: '保存', cancel: '留在本页', returnFocus: a,
    choices: [{ label: '放弃草稿', value: 'discard', danger: true }, { label: '保留草稿', value: 'keep' }],
    onConfirm: async () => { await page.save(); if (!page.isDirty()) go(); },
    onChoice: async v => {
      if (v === 'keep') { await page.saveDraft(); keepDraft = true; }
      page.discard();
      go();
    },
  });
});
// The sticky head gets its bottom line once the page scrolls under it.
// Key facts fold away at the same time, so the head is shorter while the user reads further down.
doc.addEventListener('scroll', () => doc.querySelector('.wb-doc-head')?.classList.toggle('is-stuck', doc.scrollTop > 24), { passive: true });
// Values that can be double-clicked into edit mode carry is-editable only while the status allows editing.
new MutationObserver(() => {
  if (doc.dataset.mode === 'edit') { work = [...state.rows]; return; }
  work = state.rows;
  renderLines();
}).observe(doc, { attributes: true, attributeFilter: ['data-mode'] });

renderForms();
renderLines();
renderStatus();
publish();
initShell(root);
const page = initObjectPage(doc, {
  edit: $('#doc-edit'), footer: $('#doc-foot'), messages: $('#doc-messages'),
  validate, onSave: save, canEdit, saved: '已保存',
  changed: () => work.length !== state.rows.length || work.some((r, i) => r.id !== state.rows[i].id),
  // Demonstration: the draft lives in this page only; a real product sends it to the server every 20 seconds.
  draft: { interval: 20000, onDraft: () => new Promise(r => setTimeout(r, 200)), onDiscard: ({ changed }) => { if (changed && !keepDraft) toast('已放弃草稿'); keepDraft = false; } },
});
initAnchorBar($('#doc-anchors'), { scroller: doc });
