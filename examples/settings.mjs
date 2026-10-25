// Workspace settings sample (rules/4-页面.md 4.9, rules/11-交互.md 11.6): changes affect everyone, so they wait for 保存.
// The save bar appears only while something differs from the saved values. Personal preferences live in the account menu.
import {initShell, initPalette, registerShortcut, toast, openConfirm} from '../aham.js';
import {initAccount} from './account.mjs';

const root = document.querySelector('.aham-workbench');
const $ = s => root.querySelector(s);
const form = $('#ws-form'), bar = $('#ws-save'), dirtyText = $('#ws-dirty');
const read = () => Object.fromEntries([...form.elements].filter(el => el.name).map(el => [el.name, el.type === 'checkbox' ? el.checked : el.value]));
const write = v => [...form.elements].filter(el => el.name).forEach(el => { if (el.type === 'checkbox') el.checked = v[el.name]; else el.value = v[el.name]; });
let saved = read();

function changed() { const now = read(); return Object.keys(saved).filter(k => now[k] !== saved[k]); }
function paintBar() {
  const n = changed().length;
  bar.hidden = n === 0;
  dirtyText.textContent = n ? `有 ${n} 项修改未保存` : '';
}
function validate() {
  const name = form.name.value.trim();
  if (name.length < 2) { form.name.setCustomValidity('工作区名称至少 2 个字'); form.name.reportValidity(); form.name.focus(); return false; }
  form.name.setCustomValidity('');
  return true;
}
function save() {
  if (!validate()) return;
  const n = changed().length;
  saved = read();
  paintBar();
  toast(`已保存 ${n} 项工作区设置`);
}
function discard() { write(saved); paintBar(); toast('已放弃修改'); }

form.addEventListener('input', paintBar);
form.addEventListener('change', paintBar);
form.addEventListener('submit', e => { e.preventDefault(); save(); });
root.addEventListener('click', e => {
  const b = e.target.closest('button, a');
  if (!b) return;
  const action = b.dataset.action;
  if (action === 'placeholder') { e.preventDefault(); toast('示例只做了「常规」这一页'); }
  else if (action === 'save') save();
  else if (action === 'discard') discard();
  else if (action === 'delete') openConfirm({ root, title: '删除销售工作空间？', text: '所有客户、报价和合同都会删除，不能恢复。', confirm: '删除', danger: true, returnFocus: b, onConfirm: () => toast('示例：不会删除工作区') });
});
// Leaving with unsaved changes asks first (the browser's own prompt; rules/5-单据.md 5.7 covers in-app navigation).
addEventListener('beforeunload', e => { if (changed().length) e.preventDefault(); });
registerShortcut({ keys: 'mod+s', label: '保存设置', group: '设置', run: () => (changed().length ? save() : toast('没有要保存的修改')) });
initShell(root);

const account = initAccount(root, { onShortcuts: () => palette.showShortcuts() });
// Command palette (rules/7-键盘与命令.md 7.2): the page buttons are commands too.
const palette = initPalette({
  root,
  shell: true,
  accountItems: () => account.commands(),
  groups: () => [
    { heading: '工作区设置', items: [
      { id: 'save', label: '保存设置', icon: 'check', keys: 'mod+s', run: () => $('[data-action="save"]').click() },
      { id: 'discard', label: '放弃修改', icon: 'refresh', run: discard },
      { id: 'delete', label: '删除工作区…', icon: 'trash', danger: true, run: () => $('[data-action="delete"]').click() },
    ] },
  ],
});
