// Worklist (rules/4-页面.md 4.2): approve or return quotations in the list itself.
//   通过   done at once, the row moves to 我已处理, the toast offers 撤销
//   退回   asks for a reason first (rules/6-反馈.md 6.3)
//   批量通过 rows that cannot be approved yet are named before anything runs (rules/6-反馈.md 6.4)
// A row whose countersign is still open has 通过 disabled with the reason next to it (rules/3-控件.md 3.3).
import { initShell, openConfirm, toast, personHTML, escapeHtml as esc } from '../aham.js';

const root = document.querySelector('.aham-workbench');
const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];

const ITEMS = [
  ['QT-20261012-004', '临港智能装备 二期扩容报价', '临港智能装备有限公司', 426_000_00, '林悦', '10-16 17:42', ''],
  ['QT-20261013-011', '华东精工 质量模块报价', '华东精工集团', 168_500_00, '周航', '10-16 15:08', '折扣低于 8 折，等商务负责人加签'],
  ['QT-20261014-002', '远川精密 MES 一期报价', '远川精密制造有限公司', 780_800_00, '林悦', '10-16 11:30', ''],
  ['QT-20261014-019', '北岸包装 设备连接报价', '北岸包装材料有限公司', 92_400_00, '许宁', '10-15 18:12', ''],
  ['QT-20261015-003', '金溪医疗 追溯系统报价', '金溪医疗器械有限公司', 315_000_00, '陈默', '10-15 09:51', ''],
  ['QT-20261015-027', '白石电子 年度维护报价', '白石电子元件有限公司', 48_000_00, '周航', '10-14 16:27', ''],
  ['QT-20261016-008', '云岭汽车零部件 报工终端报价', '云岭汽车零部件有限公司', 56_200_00, '许宁', '10-14 10:03', '折扣低于 8 折，等商务负责人加签'],
];
let rows = ITEMS.map(([code, name, customer, cents, by, at, wait], id) => ({ id, code, name, customer, cents, by, at, wait, result: null, reason: '' }));
let tab = 'todo';
const selected = new Set();
const money = c => (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2 });
const todo = () => rows.filter(r => !r.result), done = () => rows.filter(r => r.result);

function render() {
  const t = todo().length, d = done().length;
  $('#tabs').innerHTML = `<button type="button" data-tab="todo" aria-pressed="${tab === 'todo'}">待我审批 ${t}</button><button type="button" data-tab="done" aria-pressed="${tab === 'done'}">我已处理 ${d}</button>`;
  const list = tab === 'todo' ? todo() : done();
  $('#count').textContent = `${list.length} 张报价单`;
  const bulk = tab === 'todo' && selected.size > 0;
  $$('[data-when=idle]').forEach(e => { e.hidden = bulk; });
  $$('[data-when=bulk]').forEach(e => { e.hidden = !bulk; });
  $('#bulk-count').textContent = `已选 ${selected.size} 张`;
  const table = $('#table'), empty = $('#empty');
  table.hidden = !list.length;
  empty.hidden = Boolean(list.length);
  if (!list.length) {
    empty.innerHTML = tab === 'todo' ? '<strong>没有待审批的报价单</strong><p>新的审批到达时会出现在这里，也会发通知。</p>' : '<strong>还没有处理过的报价单</strong><p>通过或退回的报价单会出现在这里。</p>';
    table.innerHTML = '';
    return;
  }
  const check = tab === 'todo';
  // Single-line rows (rules/4-页面.md 4.3): the header row stays for screen readers only.
  const head = `<thead><tr>${check ? '<th scope="col" class="wb-check"><span class="wb-sr-only">选择</span></th>' : ''}<th scope="col">单号</th><th scope="col">报价单</th><th scope="col">客户</th><th scope="col">价税合计（元）</th><th scope="col">提交时间</th><th scope="col">提交人</th><th scope="col">${check ? '处理' : '结果'}</th></tr></thead>`;
  const body = list.map(r => `<tr data-id="${r.id}"${selected.has(r.id) ? ' data-selected' : ''}>`
    + (check ? `<td class="wb-check"><label class="wb-check-hit"><input type="checkbox" data-select="${r.id}"${selected.has(r.id) ? ' checked' : ''} aria-label="选择 ${esc(r.name)}"></label></td>` : '')
    + `<td class="wb-cell-meta wb-tnum">${esc(r.code)}</td><td class="wb-cell-name"><a class="wb-row-link" href="document.html">${esc(r.name)}</a></td><td class="wb-cell-meta">${esc(r.customer)}</td><td class="number">${money(r.cents)}</td><td class="number wb-cell-meta">${esc(r.at)}</td><td class="wb-cell-end">${personHTML(r.by, { compact: true })}</td>`
    + (check ? `<td><div class="wb-row-buttons">${r.wait ? `<span class="wb-row-note">${esc(r.wait)}</span>` : ''}<button type="button" class="wb-btn sm" data-approve="${r.id}"${r.wait ? ' disabled' : ''}>通过</button><button type="button" class="wb-btn sm" data-return="${r.id}">退回</button></div></td>`
      : `<td><span class="wb-status" data-tone="${r.result === 'approved' ? 'success' : 'warning'}"><b></b><span>${r.result === 'approved' ? '已通过' : `已退回：${esc(r.reason)}`}</span></span></td>`)
    + '</tr>').join('');
  table.innerHTML = `<colgroup>${check ? '<col style="width:var(--wb-check-col)">' : ''}<col style="width:152px"><col><col style="width:184px"><col style="width:120px"><col style="width:104px"><col style="width:44px"><col style="width:${check ? 340 : 240}px"></colgroup>${head}<tbody>${body}</tbody>`;
  const all = $('[data-select-all]');
  if (all) { const n = list.filter(r => selected.has(r.id)).length; all.checked = n > 0 && n === list.length; all.indeterminate = n > 0 && n < list.length; }
}

function decide(ids, result, reason = '') {
  const before = rows;
  rows = rows.map(r => (ids.includes(r.id) ? { ...r, result, reason } : r));
  ids.forEach(id => selected.delete(id));
  render();
  const one = ids.length === 1 ? before.find(r => r.id === ids[0]) : null;
  const what = result === 'approved' ? '通过' : '退回';
  toast(one ? `已${what} ${one.name}` : `已${what} ${ids.length} 张报价单`, { action: { label: '撤销', run: () => { rows = rows.map(r => (ids.includes(r.id) ? before.find(b => b.id === r.id) : r)); render(); } } });
}
function approveSelected(trigger) {
  const picked = todo().filter(r => selected.has(r.id)), blocked = picked.filter(r => r.wait), ok = picked.filter(r => !r.wait);
  if (!blocked.length) { decide(ok.map(r => r.id), 'approved'); return; }
  if (!ok.length) {
    openConfirm({ root, returnFocus: trigger, title: '选中的报价单都不能通过', text: `${blocked.length} 张都在等商务负责人加签，加签完成后再审批。`, confirm: '取消勾选', cancel: '关闭', onConfirm: () => { selected.clear(); render(); } });
    return;
  }
  openConfirm({
    root, returnFocus: trigger, confirm: `通过 ${ok.length} 张`,
    title: `通过其余 ${ok.length} 张报价单？`,
    text: `选中的 ${picked.length} 张里有 ${blocked.length} 张在等商务负责人加签，不能通过：${blocked.map(r => r.code).join('、')}。`,
    onConfirm: () => decide(ok.map(r => r.id), 'approved'),
  });
}

root.addEventListener('change', e => {
  const t = e.target;
  if ('select' in t.dataset) { const id = Number(t.dataset.select); t.checked ? selected.add(id) : selected.delete(id); render(); }
  else if ('selectAll' in t.dataset) { const ids = todo().map(r => r.id), all = ids.every(id => selected.has(id)); ids.forEach(id => (all ? selected.delete(id) : selected.add(id))); render(); }
});
root.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.tab) { tab = b.dataset.tab; selected.clear(); render(); }
  else if (b.dataset.approve) decide([Number(b.dataset.approve)], 'approved');
  else if (b.dataset.return) {
    const r = rows.find(x => x.id === Number(b.dataset.return));
    openConfirm({ root, returnFocus: b, title: `退回 ${r.name}？`, text: '退回后提交人修改再重新提交。原因会写进报价单的提示条和变更记录。', confirm: '退回', reason: { label: '退回原因' }, onConfirm: reason => decide([r.id], 'returned', reason) });
  } else if (b.dataset.action === 'approve-selected') approveSelected(b);
  else if (b.dataset.action === 'clear-selection') { selected.clear(); render(); }
});

initShell(root);
render();
