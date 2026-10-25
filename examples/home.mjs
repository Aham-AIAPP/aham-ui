// My workbench (rules/4-页面.md 4.2 我的工作台): what waits on me, what I wait on, and what is overdue, across
// scenes, quotations and customers. Each row names who acts next and by when; the row opens the object, and the
// work is done there. No buttons on the rows.
import { initShell, initPalette, icon, escapeHtml as esc } from '../aham.js';
import { initAccount } from './account.mjs';
import { SCENES, waitText } from './scene-model.mjs';

const root = document.querySelector('.aham-workbench');
const $ = s => root.querySelector(s);

const scene = code => SCENES.find(s => s.code === code);
const sceneRow = (code, group) => { const s = scene(code); return { group, type: '场景', code, name: s.name, href: 'scene.html', wait: waitText(s.wait), due: s.due }; };
const ITEMS = [
  sceneRow('SC-0012', 'mine'),
  { group: 'mine', type: '报价', code: 'QT-20261012-004', name: '临港智能装备 二期扩容报价', href: 'worklist.html', wait: '等你审批', due: '10-26' },
  sceneRow('SC-0007', 'mine'),
  sceneRow('SC-0011', 'others'),
  { group: 'others', type: '报价', code: 'QT-20260930-018', name: '远川精密 MES 一期报价', href: 'document.html', wait: '等远川答复', due: '10-30' },
  { group: 'late', type: '客户', code: 'CU-0042', name: '北岸包装材料有限公司', href: 'record.html', wait: '等你回访', due: '10-23', overdue: 2 },
];
const GROUPS = [['mine', '等我处理'], ['others', '我在等别人'], ['late', '已逾期']];
const shut = new Set();

function render() {
  $('#nums').innerHTML = GROUPS.map(([k, l]) => `<li><a class="wb-num" href="#g-${k}" data-jump="${k}"><strong>${ITEMS.filter(i => i.group === k).length}</strong><span>${l}</span></a></li>`).join('');
  const body = GROUPS.map(([k, label]) => {
    const rows = ITEMS.filter(i => i.group === k);
    const open = !shut.has(k);
    return `<tbody id="g-${k}"><tr class="wb-group-head"><th colspan="5" scope="rowgroup"><button type="button" class="wb-group-toggle" data-group="${k}" aria-expanded="${open}">${icon('chevron-down')}${label}<span class="wb-group-count">${rows.length}</span></button></th></tr>`
      + (open ? rows.map(r => `<tr><td class="wb-cell-meta">${r.type}</td><td class="wb-cell-meta">${esc(r.code)}</td><td class="wb-cell-name"><a class="wb-row-link" href="${r.href}">${esc(r.name)}</a></td><td>${esc(r.wait)}</td>`
        + `<td class="wb-cell-end"><span class="wb-next-date${r.overdue ? ' is-overdue' : ''}">${r.overdue ? `逾期 ${r.overdue} 天` : `计划 ${r.due}`}</span></td></tr>`).join('') : '')
      + '</tbody>';
  }).join('');
  const table = $('#table');
  table.style.minWidth = `${56 + 144 + 240 + 220 + 104}px`;
  table.innerHTML = '<colgroup><col style="width:56px"><col style="width:144px"><col><col style="width:220px"><col style="width:104px"></colgroup>'
    + '<thead class="wb-sr-only"><tr><th scope="col">类型</th><th scope="col">编号</th><th scope="col">名称</th><th scope="col">下一步</th><th scope="col">日期</th></tr></thead>' + body;
}

root.addEventListener('click', e => {
  const t = e.target.closest('[data-group],[data-jump]');
  if (!t) return;
  if (t.dataset.group) { shut.has(t.dataset.group) ? shut.delete(t.dataset.group) : shut.add(t.dataset.group); render(); root.querySelector(`[data-group="${t.dataset.group}"]`).focus(); }
  else { e.preventDefault(); shut.delete(t.dataset.jump); render(); const g = root.querySelector(`[data-group="${t.dataset.jump}"]`); g.scrollIntoView({ block: 'nearest' }); g.focus(); }
});

initShell(root);
render();
const account = initAccount(root, { onShortcuts: () => palette.showShortcuts() });
const palette = initPalette({
  root, shell: true, accountItems: () => account.commands(),
  groups: () => [{ heading: '首页', items: GROUPS.map(([k, l]) => ({ id: `jump-${k}`, label: `跳到「${l}」`, icon: 'chevron-right', run: () => root.querySelector(`[data-jump="${k}"]`).click() })) }],
});
