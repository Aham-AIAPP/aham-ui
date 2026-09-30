// Record detail sample: composes the design-system detail patterns with fictional demo data.
import {initShell, initPropertyPickers, initComposer, initPalette, registerShortcut, listShortcuts, toast, icon, escapeHtml as esc, createAIOutput, showSuggestion, openAIConfirm, aiEnabled} from '../workbench.js';
import {makeCustomers, OWNERS, STAGES, INDUSTRIES, ME, money} from './customer-list-model.mjs';
import {simulateStream, summaryText, draftText, nextStepPlan, nextStage} from './ai-sample.mjs';

const root = document.querySelector('.aham-workbench');
const $ = s => root.querySelector(s);
const data = makeCustomers();
const byId = new Map(data.map(r => [r.id, r]));

// List context from the list page (order + query to go back); falls back to the full list.
let nav = { ids: data.map(r => r.id), back: '' };
try {
  const saved = JSON.parse(sessionStorage.getItem('aham-ui:record-nav'));
  if (Array.isArray(saved?.ids) && saved.ids.every(id => byId.has(id))) nav = { ids: saved.ids, back: typeof saved.back === 'string' && saved.back.startsWith('?') ? saved.back : '' };
} catch { /* storage unavailable: use the full list */ }
const id = Number(new URLSearchParams(location.search).get('id'));
const record = { ...(byId.get(id) ?? data[0]) };
if (!nav.ids.includes(record.id)) nav.ids = [record.id, ...nav.ids];
const pos = nav.ids.indexOf(record.id);

const activity = [
  { kind: 'event', icon: 'edit', who: ME, text: '创建了记录', when: record.created },
  { kind: 'comment', who: record.owner, text: '已约好下周二现场调研，先确认设备接口清单。', when: record.lastContact },
  { kind: 'event', icon: 'refresh', who: record.owner, text: `把阶段改为「${record.stage}」`, when: record.lastContact },
];

function renderMain() {
  $('#record-main').innerHTML = `
    <h1 class="wb-detail-title">${esc(record.name)}</h1>
    <div class="wb-detail-meta"><span class="wb-status"><b></b>${esc(record.stage)}</span><span class="wb-mono">${esc(record.code)}</span><span>负责人 ${esc(record.owner)}</span></div>
    <div id="ai-slot"><button type="button" class="wb-btn sm ghost" data-action="ai-summary">${icon('ai')}<span>生成摘要</span></button></div>
    <div class="wb-detail-body"><p>这是一段虚构的记录说明，用来演示详情页的正文区。正文放在居中的阅读宽度里，长段落按 1.75 行高排版。</p><p>属性放在右侧属性栏，正文只写需要阅读的内容：背景、范围、约定事项。</p></div>
    <section class="wb-detail-section" aria-labelledby="related-title">
      <div class="wb-section-heading"><h2 id="related-title">关联记录<span>2</span></h2></div>
      <ul class="wb-related">
        <li><span class="wb-mono">OPP-0187</span><span class="wb-grow">MES 一期建设项目</span><span class="wb-status"><b></b>方案评估</span></li>
        <li><span class="wb-mono">QT-0018</span><span class="wb-grow"><a href="crm-quotation.html">销售报价单 V1.2</a></span><span class="wb-status"><b></b>草稿</span></li>
      </ul>
    </section>
    <hr class="wb-divider">
    <section class="wb-detail-section" aria-labelledby="activity-title">
      <div class="wb-section-heading"><h2 id="activity-title">动态</h2></div>
      <div class="wb-activity" id="activity" role="log" aria-live="polite"></div>
      <div id="ai-draft-slot"></div>
      <form class="wb-composer" id="composer" aria-label="写评论">
        <textarea rows="2" aria-label="评论内容" placeholder="写评论…" maxlength="2000"></textarea>
        <div class="wb-composer-foot"><span>⌘ / Ctrl + Enter 发送 · 示例不保存</span><button type="button" class="wb-btn sm ghost" data-action="ai-draft">${icon('ai')}<span>AI 起草</span></button><button type="submit" class="wb-btn sm primary">发送</button></div>
      </form>
    </section>`;
  renderActivity();
}
function renderActivity() {
  $('#activity').innerHTML = activity.map(a => a.kind === 'event'
    ? `<div class="wb-activity-event"><span class="wb-activity-icon">${icon(a.icon)}</span><span><strong>${esc(a.who)}</strong> ${esc(a.text)}</span><span class="wb-activity-time">· ${esc(a.when)}</span></div>`
    : `<article class="wb-comment"><div class="wb-comment-head"><span class="wb-avatar-xs" aria-hidden="true">${esc(a.who.slice(0, 1))}</span><strong>${esc(a.who)}</strong><span>${esc(a.when)}</span>${a.ai ? `<span class="wb-ai-mark">${icon('ai')}<span>${esc(a.ai)}</span></span>` : ''}</div>${a.text.split(/\n{2,}/).map(p => `<p>${esc(p)}</p>`).join('')}</article>`).join('');
}
function renderMeta() {
  $('.wb-detail-meta').innerHTML = `<span class="wb-status"><b></b>${esc(record.stage)}</span><span class="wb-mono">${esc(record.code)}</span><span>负责人 ${esc(record.owner)}</span>`;
}
function renderProps() {
  $('#record-props').innerHTML = `
    <section class="wb-props-section" aria-labelledby="props-a"><h2 class="wb-props-title" id="props-a">属性</h2>
      <div class="wb-prop"><span>阶段</span><button type="button" class="wb-prop-value" data-prop="stage"></button></div>
      <div class="wb-prop"><span>负责人</span><button type="button" class="wb-prop-value" data-prop="owner"></button></div>
      <div class="wb-prop"><span>行业</span><button type="button" class="wb-prop-value" data-prop="industry"></button></div>
    </section>
    <section class="wb-props-section" aria-labelledby="props-b"><h2 class="wb-props-title" id="props-b">信息</h2>
      <div class="wb-prop"><span>编码</span><span class="wb-prop-value wb-mono">${esc(record.code)}</span></div>
      <div class="wb-prop"><span>年度金额</span><span class="wb-prop-value wb-mono">${money(record.amountCents)}</span></div>
      <div class="wb-prop"><span>最近跟进</span><span class="wb-prop-value wb-mono">${record.lastContact}</span></div>
      <div class="wb-prop"><span>创建日期</span><span class="wb-prop-value wb-mono">${record.created}</span></div>
    </section>`;
}

renderMain();
renderProps();
$('#crumb-code').textContent = record.code;
$('#back-link').href = `customer-list.html${nav.back}`;
$('#record-position').textContent = `${pos + 1} / ${nav.ids.length}`;
const go = step => { const next = nav.ids[pos + step]; if (next) location.href = `record-detail.html?id=${next}`; };
$('#record-prev').disabled = pos <= 0;
$('#record-next').disabled = pos >= nav.ids.length - 1;
$('#record-prev').addEventListener('click', () => go(-1));
$('#record-next').addEventListener('click', () => go(1));
document.title = `${record.name} · Aham UI`;

const labels = { stage: '阶段', owner: '负责人', industry: '行业' };
function applyChange(key, value, before, { undoable = true } = {}) {
  record[key] = value;
  activity.push({ kind: 'event', icon: key === 'owner' ? 'user' : 'refresh', who: ME, text: `把${labels[key]}从「${before}」改为「${value}」`, when: '刚刚' });
  pickers.set({ stage: record.stage, owner: record.owner, industry: record.industry });
  renderMeta();
  renderActivity();
  if (undoable) toast(`已把${labels[key]}改为「${value}」`, { action: { label: '撤销', run: () => applyChange(key, before, value, { undoable: false }) } });
}
const pickers = initPropertyPickers({
  root, container: $('#record-props'),
  fields: { stage: { label: '阶段', options: STAGES }, owner: { label: '负责人', options: OWNERS, icon: 'user' }, industry: { label: '行业', options: INDUSTRIES } },
  value: { stage: record.stage, owner: record.owner, industry: record.industry },
  onChange: (key, value, before) => applyChange(key, value, before),
});
const options = { stage: STAGES, owner: OWNERS, industry: INDUSTRIES };
const shortcutItems = () => listShortcuts().map((k, i) => ({ id: `k${i}`, label: k.label, keys: k.keys, group: k.group, heading: k.group }));
const palette = initPalette({
  root,
  context: () => ({ id: record.id, code: record.code, label: record.name }),
  groups: ctx => [
    ...(ctx ? [{ heading: '当前记录', items: [
      ...['stage', 'owner', 'industry'].map(key => ({ id: key, label: key === 'owner' ? '分配给…' : `修改${labels[key]}…`, icon: key === 'owner' ? 'user' : 'success', keys: { stage: 's', owner: 'a' }[key], children: () => options[key].map(o => ({ id: o, label: o, current: o === record[key], run: () => { if (o !== record[key]) applyChange(key, o, record[key]); } })) })),
      { id: 'comment', label: '写评论', icon: 'edit', run: () => $('#composer textarea').focus() },
    ] }, { heading: 'AI', items: [
      { id: 'ai-summary', label: '生成摘要', icon: 'ai', run: aiSummary },
      { id: 'ai-draft', label: '起草跟进记录', icon: 'ai', run: aiDraft },
      { id: 'ai-next', label: '建议下一步…', icon: 'ai', run: aiNextStep },
    ] }] : []),
    { heading: '跳转', items: [
      { id: 'prev', label: '上一条', icon: 'chevron-up', keys: 'k', run: () => go(-1) },
      { id: 'next', label: '下一条', icon: 'chevron-down', keys: 'j', run: () => go(1) },
      { id: 'back', label: '返回列表', icon: 'arrow-left', run: () => { location.href = $('#back-link').href; } },
    ] },
    { heading: '帮助', items: [{ id: 'keys', label: '键盘快捷键…', icon: 'help', keys: '?', children: shortcutItems }] },
  ],
});
registerShortcut({ keys: 's', label: '修改阶段', group: '详情', run: () => $('[data-prop="stage"]').click() });
registerShortcut({ keys: 'a', label: '修改负责人', group: '详情', run: () => $('[data-prop="owner"]').click() });
registerShortcut({ keys: 'k', label: '上一条', group: '详情', when: () => pos > 0, run: () => go(-1) });
registerShortcut({ keys: 'j', label: '下一条', group: '详情', when: () => pos < nav.ids.length - 1, run: () => go(1) });
registerShortcut({ keys: '?', label: '查看键盘快捷键', group: '通用', run: () => palette.openAt('键盘快捷键', shortcutItems()) });
registerShortcut({ keys: 'mod+enter', label: '发送评论（在评论框内）', group: '详情', external: true });
registerShortcut({ keys: 'escape', label: '关闭最上层的浮层', group: '通用', external: true });
initComposer($('#composer'), {
  onSubmit: text => {
    const form = $('#composer');
    activity.push({ kind: 'comment', who: ME, text, when: '刚刚', ai: form.dataset.ai ? `${form.dataset.ai}，${ME} 确认后发送` : null });
    delete form.dataset.ai;
    renderActivity();
    return true;
  },
});
$('#composer textarea').addEventListener('input', e => { if (!e.target.value.trim()) delete $('#composer').dataset.ai; });

// ── AI assistance (WORKBENCH §14). Texts come from ai-sample.mjs; nothing leaves the page. ────────────────────────
const aiBlocks = {};
function aiBlock(slot, options) {
  aiBlocks[slot]?.remove();
  aiBlocks[slot] = createAIOutput($(`#${slot}`), options);
}
const sources = () => [{ label: `${record.code} 的属性` }, { label: `${record.lastContact} 的跟进评论` }];
function toComposer(text, label) {
  const area = $('#composer textarea');
  area.value = text;
  $('#composer').dataset.ai = label;
  area.focus();
}
function aiSummary() {
  aiBlock('ai-slot', {
    title: '记录摘要', sources: sources(), adoptLabel: '存为评论',
    generate: ({ signal }) => simulateStream(summaryText(record), { signal }),
    onAdopt: text => {
      activity.push({ kind: 'comment', who: ME, text, when: '刚刚', ai: `AI 摘要，${ME} 采纳` });
      renderActivity();
      toast('已存为评论', { action: { label: '撤销', run: () => { activity.pop(); renderActivity(); } } });
    },
    onEdit: text => toComposer(text, 'AI 摘要'),
  });
}
function aiDraft() {
  aiBlock('ai-draft-slot', {
    title: '起草跟进记录', sources: sources(), adoptLabel: '放入评论框',
    generate: ({ signal }) => simulateStream(draftText(record), { signal }),
    onAdopt: text => { toComposer(text, 'AI 起草'); toast('已放入评论框，修改后再发送'); },
  });
}
function aiNextStep() {
  const plan = nextStepPlan(record, STAGES);
  aiBlock('ai-slot', {
    title: '建议下一步', sources: sources(), adoptLabel: '查看修改',
    generate: ({ signal }) => simulateStream(plan.text, { signal }),
    onAdopt: () => openAIConfirm({ root, reason: plan.reason, changes: plan.changes, returnFocus: $('[data-action="ai-summary"]'), onConfirm: () => applyPlan(plan) }),
  });
}
function applyPlan(plan) {
  const before = record.stage, stage = plan.changes.find(c => c.key === 'stage'), task = plan.changes.find(c => c.key === 'task');
  applyChange('stage', stage.to, before, { undoable: false });
  activity.push({ kind: 'event', icon: 'check', who: ME, text: `按 AI 建议新建任务「${task.to}」`, when: '刚刚' });
  renderActivity();
  toast(`已按 AI 建议修改 ${plan.changes.length} 项`, { action: { label: '撤销', run: () => { activity.pop(); applyChange('stage', before, stage.to, { undoable: false }); } } });
}
function suggestStage() {
  const to = nextStage(STAGES, record.stage);
  if (!aiEnabled() || to === record.stage) return;
  showSuggestion($('[data-prop="stage"]').closest('.wb-prop'), { key: 'stage', label: '阶段', value: to, reason: '依据：最近一次跟进已约定现场调研', onAccept: v => applyChange('stage', v, record.stage) });
}
root.addEventListener('click', e => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'ai-summary') aiSummary();
  else if (action === 'ai-draft') aiDraft();
});
suggestStage();
initShell(root);
