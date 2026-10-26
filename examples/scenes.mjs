// Scene list (rules/4-页面.md 4.2 共用对象): grouped by stage, one line per scene. Each line says whom the scene
// waits for and what they do, with the organisation after the name (rules/4-页面.md 4.15). AI 待确认 marks scenes
// whose AI judgement nobody has confirmed yet (rules/8-AI协作.md 8.7).
import { initShell, initPalette, stageIconHTML, personHTML, icon, escapeHtml as esc } from '../aham.js';
import { initAccount } from './account.mjs';
import { SCENES, STAGES, VIEWS, applyView, stageState, waitText } from './scene-model.mjs';

const root = document.querySelector('.aham-workbench');
const $ = s => root.querySelector(s);
const params = new URLSearchParams(location.search);
let view = VIEWS[params.get('view')] ? params.get('view') : 'all';
const shut = new Set();

function setView(v) {
  view = v;
  const url = new URL(location.href);
  if (v === 'all') url.searchParams.delete('view'); else url.searchParams.set('view', v);
  history.replaceState(null, '', url);
  render();
}

function render() {
  $('#views').innerHTML = Object.entries(VIEWS).map(([k, l]) => `<button type="button" data-view="${k}" aria-pressed="${view === k}">${l} ${applyView(SCENES, k).length}</button>`).join('');
  const rows = applyView(SCENES, view);
  $('#count').textContent = `${rows.length} 个场景`;
  const table = $('#table'), empty = $('#empty');
  table.hidden = !rows.length;
  empty.hidden = Boolean(rows.length);
  if (!rows.length) { empty.innerHTML = '<strong>没有要处理的场景</strong><p>轮到你处理时，场景会出现在这里。</p>'; table.innerHTML = ''; return; }
  const body = STAGES.slice().reverse().map(stage => {
    const list = rows.filter(r => r.stage === stage);
    if (!list.length) return '';
    const open = !shut.has(stage);
    return `<tbody><tr class="wb-group-head"><th colspan="6" scope="rowgroup"><button type="button" class="wb-group-toggle" data-group="${stage}" aria-expanded="${open}">${icon('chevron-down')}${stageIconHTML({ ...stageState(stage), label: stage })}${stage}<span class="wb-group-count">${list.length}</span></button></th></tr>`
      + (open ? list.map(r => `<tr><td class="wb-cell-meta">${r.code}</td><td class="wb-cell-name"><a class="wb-row-link" href="scene.html">${esc(r.name)}</a></td><td><span class="wb-tag">${esc(r.customer)}</span></td>`
        + `<td class="wb-cell-wait">${r.ai === 'pending' ? `<span class="wb-ai-mark">${icon('ai')}<span>AI 待确认</span></span>` : esc(waitText(r.wait))}</td>`
        + `<td class="number"><span class="wb-next-date${r.overdue ? ' is-overdue' : ''}">${r.overdue ? `逾期 ${r.overdue} 天` : r.due ? `计划 ${r.due}` : r.updated}</span></td><td class="wb-cell-end">${personHTML(r.owner, { compact: true })}</td></tr>`).join('') : '')
      + '</tbody>';
  }).join('');
  table.style.setProperty('--wb-table-min', `${88 + 240 + 112 + 260 + 96 + 44}px`);
  table.innerHTML = '<colgroup><col style="width:88px"><col><col style="width:112px"><col style="width:260px"><col style="width:96px"><col style="width:44px"></colgroup>'
    + '<thead class="wb-sr-only"><tr><th scope="col">编号</th><th scope="col">场景</th><th scope="col">客户</th><th scope="col">下一步</th><th scope="col">日期</th><th scope="col">负责人</th></tr></thead>' + body;
}

root.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.view) setView(b.dataset.view);
  else if (b.dataset.group) { const g = b.dataset.group; shut.has(g) ? shut.delete(g) : shut.add(g); render(); root.querySelector(`[data-group="${g}"]`).focus(); }
});

initShell(root);
render();
const account = initAccount(root, { onShortcuts: () => palette.showShortcuts() });
const palette = initPalette({
  root, shell: true, accountItems: () => account.commands(),
  groups: () => [{ heading: '视图', items: Object.entries(VIEWS).map(([k, l]) => ({ id: `view-${k}`, label: l, icon: 'star', current: view === k, run: () => setView(k) })) }],
});
