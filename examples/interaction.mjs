// Interaction sample (rules/11-交互.md): every state and every motion of the workbench on one page.
import {initShell, initPanels, initPalette, navCommands, registerShortcut, listShortcuts, openPopover, closePopover, createCommand, openConfirm, openCreateDialog, toast} from '../aham.js';
import {initAccount} from './account.mjs';

const root = document.querySelector('.aham-workbench');
const $ = s => root.querySelector(s);
initShell(root);
const panels = initPanels(root);

// Rows: click selects, as in the list sample.
root.querySelectorAll('.wb-list-rows tbody tr').forEach(tr => {
  const box = tr.querySelector('input');
  const sync = () => tr.toggleAttribute('data-selected', box.checked);
  box.addEventListener('change', sync);
  tr.addEventListener('click', e => { if (e.target.closest('label')) return; box.checked = !box.checked; sync(); });
});

function openMenu(trigger) {
  const pop = $('#ix-menu');
  createCommand(pop.firstElementChild, {
    role: 'menu', search: false, label: '更多操作',
    items: [{ id: 'copy', label: '复制', icon: 'copy', group: 0 }, { id: 'link', label: '复制链接', icon: 'link', group: 0 }, { id: 'delete', label: '删除', icon: 'trash', danger: true, group: 1 }],
    onSelect: it => { closePopover('done'); toast(it.id === 'delete' ? '示例：没有删除' : `已${it.label}`); },
  });
  openPopover(trigger, pop);
  pop.querySelector('[role=menu]').focus();
}

const shortcutItems = () => listShortcuts().map((k, i) => ({ id: `k${i}`, label: k.label, keys: k.keys }));
const account = initAccount(root, { onShortcuts: () => palette.openAt('键盘快捷键', shortcutItems()) });
root.addEventListener('click', e => {
  const b = e.target.closest('[data-demo]');
  if (!b) return;
  switch (b.dataset.demo) {
    case 'toast': toast(b.dataset.text); break;
    case 'confirm': openConfirm({ root, title: '删除客户远川精密？', text: '删除后不能恢复。', confirm: '删除', danger: true, returnFocus: b, onConfirm: () => toast('示例：没有删除') }); break;
    case 'menu': if ($('#ix-menu').hidden) openMenu(b); else closePopover(); break;
    case 'account': account.openMenu(); break;
    case 'create': openCreateDialog({ root, title: '新建客户', scope: '客户', returnFocus: b, onSubmit: ({ title }) => { toast(`已创建「${title}」（示例）`); return true; } }); break;
    case 'prefs': account.openPreferences(); break;
    case 'peek': panels.show(panels.current() === 'ix-peek' ? null : 'ix-peek', { focus: true }); break;
    case 'palette': palette.open(); break;
  }
});
root.addEventListener('click', e => { if (e.target.closest('[data-action="placeholder"]')) { e.preventDefault(); toast('示例只做了交互这一页'); } });

// Durations read back from the page, so the table always matches tokens.json.
const css = getComputedStyle(root);
const v = name => css.getPropertyValue(`--wb-${name}`).trim();
$('#ix-durations').innerHTML = [
  ['按下、浮层消失', 'instant'], ['悬停移出、折叠箭头、悬停提示', 'fast'], ['浮层出现、弹窗消失', 'pop'], ['弹窗、侧面板、轻提示出现', 'base'],
].map(([what, k]) => `<div class="wb-setting"><div><div class="wb-setting-title">${what}</div><div class="wb-setting-desc">--wb-${k}</div></div><div class="wb-setting-control wb-tnum">${Math.round(parseFloat(v(k)) * 1000)}ms</div></div>`).join('')
  + `<div class="wb-setting"><div><div class="wb-setting-title">减少动态效果</div><div class="wb-setting-desc">系统设置</div></div><div class="wb-setting-control">${matchMedia('(prefers-reduced-motion: reduce)').matches ? '已开启' : '未开启'}</div></div>`;

const palette = initPalette({
  root,
  groups: () => [
    { heading: '交互样板', items: [...root.querySelectorAll('[data-demo]')].map((b, i) => ({ id: `demo-${i}`, label: b.textContent.trim() || b.getAttribute('aria-label'), run: () => b.click() })) },
    { heading: '界面', items: [
      { id: 'nav', label: '展开或收起侧栏', icon: 'menu', keys: 'mod+b', run: () => $('[data-action="nav"]').click() },
      { id: 'theme', label: '切换深色和浅色', icon: 'moon', run: () => $('[data-action="theme"]').click() },
    ] },
    { heading: '账户', items: account.commands() },
    { heading: '跳转', items: navCommands(root) },
    { heading: '帮助', items: [{ id: 'keys', label: '键盘快捷键…', icon: 'help', keys: '?', children: shortcutItems }] },
  ],
});
registerShortcut({ keys: '?', label: '查看键盘快捷键', group: '通用', run: () => palette.openAt('键盘快捷键', shortcutItems()) });
