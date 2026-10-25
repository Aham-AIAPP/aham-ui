// Members and roles (rules/4-页面.md 4.14): a role is three layers, read left to right: which data, which fields,
// which actions. Changing a member's role waits for 保存 like the rest of the workspace settings (4.9).
import { initShell, initPalette, registerShortcut, toast, personHTML, escapeHtml as esc } from '../aham.js';
import { initAccount } from './account.mjs';

const root = document.querySelector('.aham-workbench');
const $ = s => root.querySelector(s);
const ROLES = [
  { name: '管理员', scope: '全部数据', edit: '全部字段', act: '审批、删除、改设置' },
  { name: '销售', scope: '本组客户和报价', edit: '客户资料、报价明细', act: '提交审批、发给客户' },
  { name: '实施顾问', scope: '负责的场景', edit: '场景内容、内部备注', act: '确认 AI 判断' },
  { name: '客户成员', scope: '本企业的共用对象', edit: '回答问题、上传附件', act: '确认立项和验收' },
];
const MEMBERS = [
  { name: '许宁', org: '启衡', role: '管理员', mail: 'xu.ning@example.com' },
  { name: '林悦', org: '启衡', role: '实施顾问', mail: 'lin.yue@example.com' },
  { name: '周航', org: '启衡', role: '销售', mail: 'zhou.hang@example.com' },
  { name: '陈默', org: '启衡', role: '实施顾问', mail: 'chen.mo@example.com' },
  { name: '王卓', org: '远川', role: '客户成员', mail: 'wang.zhuo@example.com' },
];
const scopeOf = role => ROLES.find(r => r.name === role).scope;
let saved = MEMBERS.map(m => m.role);
const current = () => [...root.querySelectorAll('[data-member]')].map(s => s.value);
const changed = () => current().filter((r, i) => r !== saved[i]).length;

function render() {
  $('#members').innerHTML = '<colgroup><col style="width:160px"><col style="width:184px"><col style="width:124px"><col></colgroup><thead><tr><th scope="col">成员</th><th scope="col">邮箱</th><th scope="col">角色</th><th scope="col">数据范围</th></tr></thead><tbody>'
    + MEMBERS.map((m, i) => `<tr><td class="wb-cell-name">${personHTML(m.name)}<span class="wb-meta"> · ${esc(m.org)}</span></td><td class="wb-cell-meta">${esc(m.mail)}</td>`
      + `<td><select class="wb-field sm" style="inline-size:100%" data-member="${i}" aria-label="${esc(m.name)}的角色">${ROLES.filter(r => (m.org === '启衡') === (r.name !== '客户成员')).map(r => `<option${r.name === saved[i] ? ' selected' : ''}>${r.name}</option>`).join('')}</select></td><td class="wb-cell-meta" data-scope="${i}">${scopeOf(saved[i])}</td></tr>`).join('') + '</tbody>';
  $('#roles').innerHTML = '<colgroup><col style="width:96px"><col style="width:152px"><col style="width:168px"><col></colgroup><thead><tr><th scope="col">角色</th><th scope="col">数据范围</th><th scope="col">能改</th><th scope="col">能做</th></tr></thead><tbody>'
    + ROLES.map(r => `<tr><td>${r.name}</td><td>${r.scope}</td><td>${r.edit}</td><td>${r.act}</td></tr>`).join('') + '</tbody>';
}
function paintBar() { const n = changed(); $('#ws-save').hidden = !n; $('#ws-dirty').textContent = n ? `有 ${n} 项修改未保存` : ''; }
function save() { const n = changed(); if (!n) { toast('没有要保存的修改'); return; } saved = current(); paintBar(); toast(`已保存 ${n} 位成员的角色`); }
function discard() { render(); paintBar(); toast('已放弃修改'); }

root.addEventListener('change', e => { const s = e.target.closest('[data-member]'); if (!s) return; root.querySelector(`[data-scope="${s.dataset.member}"]`).textContent = scopeOf(s.value); paintBar(); });
root.addEventListener('click', e => {
  const b = e.target.closest('button, a');
  if (!b) return;
  if (b.dataset.action === 'placeholder') { e.preventDefault(); toast('示例只做了「常规」和「成员与角色」'); }
  else if (b.dataset.action === 'save') save();
  else if (b.dataset.action === 'discard') discard();
});
$('#ws-form').addEventListener('submit', e => { e.preventDefault(); save(); });
addEventListener('beforeunload', e => { if (changed()) e.preventDefault(); });
registerShortcut({ keys: 'mod+s', label: '保存设置', group: '设置', run: save });

initShell(root);
render();
const account = initAccount(root, { onShortcuts: () => palette.showShortcuts() });
const palette = initPalette({
  root, shell: true, accountItems: () => account.commands(),
  groups: () => [{ heading: '成员与角色', items: [
    { id: 'save', label: '保存设置', icon: 'check', keys: 'mod+s', run: save },
    { id: 'discard', label: '放弃修改', icon: 'refresh', run: discard },
  ] }],
});
