// Object page sample (WORKBENCH §4.1–4.5): read and edit mode on the same rows. Saving only updates this page.
import {initShell, initObjectPage, escapeHtml as esc} from '../workbench.js';

const root = document.querySelector('.aham-workbench');
const page = root.querySelector('#op');
const $ = s => page.querySelector(s), $$ = s => [...page.querySelectorAll(s)];
const ms = [{ node: '签约后', ratio: '30.0' }, { node: '一期验收后', ratio: '70.0' }];

// Payment milestones: each row is rendered for both modes; the 添加 button and the delete column only show in edit mode.
function msRow(m, i) {
  return `<tr><td><span class="wb-read"><span class="wb-value is-editable">${esc(m.node)}</span></span><span class="wb-edit"><input class="wb-edit-input" name="node-${i}" aria-label="付款节点 第 ${i + 1} 行 节点" value="${esc(m.node)}"></span></td>`
    + `<td class="number"><span class="wb-read"><span class="wb-value is-editable wb-mono">${esc(m.ratio)}%</span></span><span class="wb-edit"><input class="wb-edit-input is-number" name="ratio-${i}" aria-label="付款节点 第 ${i + 1} 行 比例" inputmode="decimal" value="${esc(m.ratio)}"><span>%</span></span></td>`
    + `<td><button type="button" class="wb-btn sm ghost icon-only" data-edit-only data-del="${i}" aria-label="删除第 ${i + 1} 行">×</button></td></tr>`;
}
function renderMs() {
  $('#op-ms').innerHTML = ms.map(msRow).join('');
  $('#op-ms-sum').textContent = `${ms.reduce((s, m) => s + (Number(m.ratio) || 0), 0).toFixed(1)}%`;
}
function readMs() {
  return ms.map((_, i) => ({ node: $(`[name=node-${i}]`).value.trim(), ratio: $(`[name=ratio-${i}]`).value.trim() }));
}

// Checks every control; errors block saving, warnings do not (WORKBENCH §4.4).
function validate() {
  const out = [];
  for (const c of $$('.wb-edit [required]')) if (!c.value.trim()) out.push({ control: c, severity: 'error', message: '必填，没写' });
  const date = $('[name=start]');
  if (date.value && !/^\d{4}-\d{2}-\d{2}$/.test(date.value)) out.push({ control: date, severity: 'error', message: '写成年-月-日，例如 2026-11-02' });
  for (const name of ['budget', 'days', 'rate']) {
    const c = $(`[name=${name}]`);
    if (c.value && !/^\d+(\.\d+)?$/.test(c.value.replace(/,/g, ''))) out.push({ control: c, severity: 'error', message: '须为数字' });
  }
  const rate = Number($('[name=rate]').value);
  if (rate > 100) out.push({ control: $('[name=rate]'), severity: 'error', message: '须为 0～100 的百分数' });
  const rows = readMs(), sum = rows.reduce((s, m) => s + (Number(m.ratio) || 0), 0);
  if (rows.length && Math.abs(sum - 100) > 0.05) out.push({ control: $(`[name=ratio-${rows.length - 1}]`), severity: 'error', message: `比例合计 ${sum.toFixed(1)}%，要等于 100.0%` });
  if (Number($('[name=budget]').value.replace(/,/g, '')) > 1000000) out.push({ control: $('[name=budget]'), severity: 'warning', message: '超过 100 万元要另走审批，保存不受影响' });
  return out;
}

// Saving writes the inputs back into the read-mode values; a real page would send them to its server first.
let before = null, saved = false;
async function save(v) {
  await new Promise(r => setTimeout(r, 300));
  saved = true;
  const show = (key, text) => { const el = $(`[data-show=${key}]`); el.textContent = text || '–'; el.classList.toggle('is-empty', !text); };
  show('name', v.name); show('customer', v.customer); show('start', v.start);
  const contact = $('[data-show=contact]');
  contact.textContent = v.contact || '没写'; contact.classList.toggle('is-missing', !v.contact);
  show('budget', v.budget ? `${Number(v.budget.replace(/,/g, '')).toLocaleString('en-US')} 元` : '');
  show('tax', [v.incl, v.rate && `税率 ${Number(v.rate).toFixed(1)}%`].filter(Boolean).join('，'));
  show('terms', `${v.days} 天，${v.from}起算`);
  show('paynote', v.paynote.trim()); show('note', v.note.trim());
  ms.splice(0, ms.length, ...readMs().map(m => ({ node: m.node, ratio: Number(m.ratio).toFixed(1) })));
  renderMs();
}

page.addEventListener('click', e => {
  const del = e.target.closest('[data-del]');
  if (del) { const rows = readMs(); rows.splice(Number(del.dataset.del), 1); ms.splice(0, ms.length, ...rows); renderMs(); }
});
$('#op-add').addEventListener('click', () => {
  ms.splice(0, ms.length, ...readMs(), { node: '', ratio: '' });
  renderMs();
  $(`[name=node-${ms.length - 1}]`).focus();
});
const marker = $('#op-editing');
// Cancel puts back the rows added or deleted in edit mode; the controls themselves are restored by initObjectPage.
new MutationObserver(() => {
  const editing = page.dataset.mode === 'edit';
  marker.hidden = !editing;
  if (editing) { before = ms.map(m => ({ ...m })); saved = false; return; }
  if (!saved && before) ms.splice(0, ms.length, ...before);
  renderMs();
}).observe(page, { attributes: true, attributeFilter: ['data-mode'] });

renderMs();
initShell(root);
initObjectPage(page, { edit: $('#op-edit'), footer: $('.wb-edit-footer'), messages: root.querySelector('#op-messages'), validate, onSave: save, saved: 'PJ-0007 已保存（示例：只更新本页）' });
