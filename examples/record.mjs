// Record detail sample: composes the Aham UI detail patterns with fictional demo data.
import {initShell, stageIconHTML, initPropertyPickers, initComposer, initPalette, registerShortcut, toast, icon, escapeHtml as esc, personHTML, formatKeys, createAIOutput, showSuggestion, openAIConfirm, aiEnabled, avatarCat, initDropZone, fileCat, formatBytes} from '../aham.js';
import {makeCustomers, OWNERS, STATUSES, INDUSTRIES, ME, money} from './list-model.mjs';
import {simulateStream, summaryText, draftText, nextStepPlan, nextStatus} from './ai-sample.mjs';
import {initAccount} from './account.mjs';

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
const stageIcon = status => status === '已流失' ? stageIconHTML({ state: 'off', label: status }) : status === '已成交' ? stageIconHTML({ state: 'done', label: status })
  : status === '潜在' ? stageIconHTML({ state: 'todo', label: status }) : stageIconHTML({ state: 'current', done: 1, total: 2, label: status });
const metaHtml = () => `<span class="wb-status">${stageIcon(record.status)}<span>${esc(record.status)}</span></span><span>${esc(record.code)}</span><span>负责人 ${personHTML(record.owner)}</span>`;
// A customer has a status; the sales stage lives on the opportunity (rules/4-页面.md 4.2). While the customer is open,
// the next step names one thing for the owner, taken from the opportunity when there is one (rules/3-控件.md 3.13).
const NEXT_ACTION = { 潜在: '约首次拜访', 跟进中: '推进商机 OPP-0187：提交方案初稿' };
let remindedAt = '';
function nextHtml() {
  const action = NEXT_ACTION[record.status];
  if (!action) return '';
  const who = record.owner === ME ? '你' : record.owner;
  const d = new Date(Date.now() + 3 * 864e5), due = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  // Waiting on a colleague: 提醒 once a day, then the time it was sent (rules/6-反馈.md 6.11).
  const remind = record.owner === ME ? '' : remindedAt ? `<span class="wb-meta">已提醒 · ${remindedAt}</span>` : '<button type="button" class="wb-btn sm" data-action="remind">提醒</button>';
  return `<div class="wb-next" role="status"><span class="wb-status" data-tone="wait"><b></b></span><span class="wb-grow"><strong>等${esc(who)}</strong>${action}</span><span class="wb-next-date">计划 ${due}</span>${remind}</div>`;
}

const activity = [
  { kind: 'event', icon: 'edit', who: ME, text: '创建了记录', when: record.created },
  { kind: 'comment', who: record.owner, text: '已约好下周二现场调研，先确认设备接口清单。', when: record.lastContact },
  { kind: 'event', icon: 'refresh', who: record.owner, text: `把客户状态改为「${record.status}」`, when: record.lastContact },
];

function renderMain() {
  $('#record-main').innerHTML = `
    <header class="wb-detail-head"><h1 class="wb-detail-title">${esc(record.name)}</h1>
    <div class="wb-detail-meta">${metaHtml()}</div></header>
    <div id="next-slot">${nextHtml()}</div>
    <div id="ai-slot"><button type="button" class="wb-btn sm ghost" data-action="ai-summary">${icon('ai')}<span>生成摘要</span></button></div>
    <div class="wb-detail-body"><p>主营精密结构件和汽车零部件加工，两个厂区共 46 台数控设备。现有用友 U8 管财务和库存，车间报工还在用纸质派工单。</p><p>今年关注两件事：设备开动率看不清，客户审核要追溯到批次。双方约定先做一期生产执行，设备接口清单由客户设备科在调研前提供。</p></div>
    <section class="wb-detail-section" aria-labelledby="related-title">
      <div class="wb-section-heading"><h2 id="related-title">关联记录<span>2</span></h2></div>
      <ul class="wb-related">
        <li><span>OPP-0187</span><span class="wb-grow">MES 一期建设项目</span><span class="wb-status"><b></b>方案评估</span></li>
        <li><span>QT-0018</span><span class="wb-grow"><a href="document.html">销售报价单 V1.2</a></span><span class="wb-status"><b></b>草稿</span></li>
      </ul>
    </section>
    <section class="wb-detail-section" aria-labelledby="activity-title">
      <h2 id="activity-title" class="wb-sr-only">动态</h2>
      <details class="wb-fold" id="activity-fold"><summary>${icon('chevron-right')}<strong>动态</strong><span class="wb-fold-sum" id="activity-sum"></span></summary>
        <div class="wb-fold-body"><div class="wb-activity" id="activity" role="log" aria-live="polite"></div></div>
      </details>
      <div id="ai-draft-slot"></div>
      <form class="wb-composer" id="composer" aria-label="写评论">
        <textarea rows="2" aria-label="评论内容" placeholder="写评论…" maxlength="2000"></textarea>
        <ul class="wb-composer-files" id="composer-files" hidden></ul>
        <div class="wb-composer-foot"><button type="button" class="wb-btn sm ghost" data-drop="file">文件</button><button type="button" class="wb-btn sm ghost" data-action="record-audio">录音</button><span class="wb-composer-hint">${formatKeys('mod+enter').join(' ')} 发送</span><button type="button" class="wb-btn sm ghost" data-action="ai-draft">${icon('ai')}<span>AI 起草</span></button><button type="submit" class="wb-btn sm primary">发送</button></div>
        <input type="file" multiple hidden>
      </form>
    </section>`;
  renderActivity();
}
function renderActivity() {
  const creator = activity.find(a => a.text === '创建了记录')?.who ?? activity[0].who;
  $('#activity-sum').textContent = `${activity.length} 条 · ${creator}创建 · 最近 ${activity.at(-1).when}`;
  $('#activity').innerHTML = activity.map(a => a.kind === 'event'
    ? `<div class="wb-activity-event"><span class="wb-activity-icon">${icon(a.icon)}</span><span><strong>${esc(a.who)}</strong> ${esc(a.text)}</span><span class="wb-activity-time">· ${esc(a.when)}</span></div>`
    : `<article class="wb-comment"><div class="wb-comment-head"><span class="wb-avatar-xs" data-cat="${avatarCat(a.who)}" aria-hidden="true">${esc([...a.who][0])}</span><strong>${esc(a.who)}</strong><span>${esc(a.when)}</span>${a.ai ? `<span class="wb-ai-mark">${icon('ai')}<span>${esc(a.ai)}</span></span>` : ''}</div>${a.text.split(/\n{2,}/).map(p => `<p>${esc(p)}</p>`).join('')}</article>`).join('');
}
function renderMeta() {
  $('.wb-detail-meta').innerHTML = metaHtml();
  $('#next-slot').innerHTML = nextHtml();
}
function renderProps() {
  $('#record-props').innerHTML = `
    <section class="wb-props-section" aria-labelledby="props-a"><h2 class="wb-props-title" id="props-a">属性</h2>
      <div class="wb-prop"><span>客户状态</span><button type="button" class="wb-prop-value" data-prop="status"></button></div>
      <div class="wb-prop"><span>负责人</span><button type="button" class="wb-prop-value" data-prop="owner"></button></div>
      <div class="wb-prop"><span>行业</span><button type="button" class="wb-prop-value" data-prop="industry"></button></div>
    </section>
    <section class="wb-props-section" aria-labelledby="props-b"><h2 class="wb-props-title" id="props-b">信息</h2>
      <div class="wb-prop"><span>编码</span><span class="wb-prop-value">${esc(record.code)}</span></div>
      <div class="wb-prop"><span>年度金额</span><span class="wb-prop-value wb-tnum">${money(record.amountCents)}</span></div>
      <div class="wb-prop"><span>最近跟进</span><span class="wb-prop-value">${record.lastContact}</span></div>
      <div class="wb-prop"><span>创建日期</span><span class="wb-prop-value">${record.created}</span></div>
    </section>`;
}

renderMain();
renderProps();
$('#crumb-code').textContent = record.code;
$('#back-link').href = `list.html${nav.back}`;
$('#record-position').textContent = `${pos + 1} / ${nav.ids.length}`;
const go = step => { const next = nav.ids[pos + step]; if (next) location.href = `record.html?id=${next}`; };
$('#record-prev').disabled = pos <= 0;
$('#record-next').disabled = pos >= nav.ids.length - 1;
$('#record-prev').addEventListener('click', () => go(-1));
$('#record-next').addEventListener('click', () => go(1));
document.title = `${record.name} · Aham UI`;

const labels = { status: '客户状态', owner: '负责人', industry: '行业' };
function applyChange(key, value, before, { undoable = true } = {}) {
  record[key] = value;
  activity.push({ kind: 'event', icon: key === 'owner' ? 'user' : 'refresh', who: ME, text: `把${labels[key]}从「${before}」改为「${value}」`, when: '刚刚' });
  pickers.set({ status: record.status, owner: record.owner, industry: record.industry });
  renderMeta();
  renderActivity();
  if (undoable) toast(`已把${labels[key]}改为「${value}」`, { action: { label: '撤销', run: () => applyChange(key, before, value, { undoable: false }) } });
}
const pickers = initPropertyPickers({
  root, container: $('#record-props'),
  fields: { status: { label: '客户状态', options: STATUSES }, owner: { label: '负责人', options: OWNERS, icon: 'user', person: true }, industry: { label: '行业', options: INDUSTRIES } },
  value: { status: record.status, owner: record.owner, industry: record.industry },
  onChange: (key, value, before) => applyChange(key, value, before),
});
const options = { status: STATUSES, owner: OWNERS, industry: INDUSTRIES };
const account = initAccount(root, { onShortcuts: () => palette.showShortcuts() });
const palette = initPalette({
  root,
  shell: true,
  accountItems: () => account.commands(),
  context: () => ({ id: record.id, code: record.code, label: record.name }),
  groups: ctx => [
    ...(ctx ? [{ heading: '当前记录', items: [
      ...['status', 'owner', 'industry'].map(key => ({ id: key, label: key === 'owner' ? '分配给…' : `修改${labels[key]}…`, icon: key === 'owner' ? 'user' : 'success', keys: { status: 's', owner: 'a' }[key], children: () => options[key].map(o => ({ id: o, label: o, current: o === record[key], run: () => { if (o !== record[key]) applyChange(key, o, record[key]); } })) })),
      { id: 'comment', label: '写评论', icon: 'edit', run: () => $('#composer textarea').focus() },
    ] }, { heading: 'AI', items: [
      { id: 'ai-summary', label: '生成摘要', icon: 'ai', run: aiSummary },
      { id: 'ai-draft', label: '起草跟进记录', icon: 'ai', run: aiDraft },
      { id: 'ai-next', label: '建议下一步…', icon: 'ai', run: aiNextStep },
    ] }] : []),
    { heading: '示例', items: [
      { id: 'state-loading', label: '显示首次加载', icon: 'refresh', run: () => showState('loading') },
      { id: 'state-error', label: '显示加载失败', icon: 'warning', run: () => showState('error') },
      { id: 'state-denied', label: '显示无权限', icon: 'lock', run: () => showState('denied') },
    ] },
    { heading: '跳转', items: [
      { id: 'prev', label: '上一条', icon: 'chevron-up', keys: 'k', run: () => go(-1) },
      { id: 'next', label: '下一条', icon: 'chevron-down', keys: 'j', run: () => go(1) },
      { id: 'back', label: '返回列表', icon: 'arrow-left', run: () => { location.href = $('#back-link').href; } },
    ] },
  ],
});
registerShortcut({ keys: 's', label: '修改客户状态', group: '详情', run: () => $('[data-prop="status"]').click() });
registerShortcut({ keys: 'a', label: '修改负责人', group: '详情', run: () => $('[data-prop="owner"]').click() });
registerShortcut({ keys: 'k', label: '上一条', group: '详情', when: () => pos > 0, run: () => go(-1) });
registerShortcut({ keys: 'j', label: '下一条', group: '详情', when: () => pos < nav.ids.length - 1, run: () => go(1) });
registerShortcut({ keys: 'mod+enter', label: '发送评论（在评论框内）', group: '详情', external: true });
registerShortcut({ keys: 'escape', label: '关闭最上层的浮层', group: '通用', external: true });
initComposer($('#composer'), {
  onSubmit: text => {
    const form = $('#composer');
    const attached = files.length ? `\n\n附件：${files.map(f => f.name).join('、')}` : '';
    activity.push({ kind: 'comment', who: ME, text: text + attached, when: '刚刚', ai: form.dataset.ai ? `${form.dataset.ai}，${ME} 确认后发送` : null });
    delete form.dataset.ai;
    files.length = 0;
    renderFiles();
    renderActivity();
    $('#activity-fold').open = true;
    return true;
  },
});
$('#composer textarea').addEventListener('input', e => { if (!e.target.value.trim()) delete $('#composer').dataset.ai; });

// Files and recordings live in the composer box (rules/3-控件.md 3.14). Recording has no reference implementation.
const files = [];
function renderFiles() {
  const list = $('#composer-files');
  list.hidden = !files.length;
  list.innerHTML = files.map((f, i) => `<li class="wb-composer-file"><svg class="wb-cat-icon" data-cat="${fileCat(f.name)}" aria-hidden="true"><use href="../assets/icons/aham-icons.svg#i-file"/></svg><span>${esc(f.name)}</span><span class="wb-file-meta">${formatBytes(f.size)}</span><button type="button" class="wb-icon-btn" data-remove="${i}" aria-label="移除 ${esc(f.name)}" data-tooltip="移除">${icon('close')}</button></li>`).join('');
}
initDropZone($('#composer'), { maxSize: 20 * 1024 * 1024, onFiles: items => { files.push(...items.filter(i => !i.error)); renderFiles(); } });
$('#composer-files').addEventListener('click', e => {
  const b = e.target.closest('[data-remove]');
  if (!b) return;
  const [gone] = files.splice(Number(b.dataset.remove), 1);
  renderFiles();
  toast(`已移除 ${gone.name}`);
  $('#composer textarea').focus();
});
$('#composer [data-action="record-audio"]').addEventListener('click', () => toast('录音在示例页没有实现：产品保存原始音频，不转文字'));

// ── AI assistance (rules/8-AI协作.md). Texts come from ai-sample.mjs; nothing leaves the page. ────────────────────────
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
  const plan = nextStepPlan(record);
  aiBlock('ai-slot', {
    title: '建议下一步', sources: sources(), adoptLabel: '查看修改',
    generate: ({ signal }) => simulateStream(plan.text, { signal }),
    onAdopt: () => openAIConfirm({ root, reason: plan.reason, changes: plan.changes, returnFocus: $('[data-action="ai-summary"]'), canUndo: true, onConfirm: () => applyPlan(plan) }),
  });
}
function applyPlan(plan) {
  const before = record.status, status = plan.changes.find(c => c.key === 'status'), task = plan.changes.find(c => c.key === 'task');
  if (status) applyChange('status', status.to, before, { undoable: false });
  activity.push({ kind: 'event', icon: 'check', who: ME, text: `按 AI 建议新建任务「${task.to}」`, when: '刚刚' });
  renderActivity();
  toast(`已按 AI 建议修改 ${plan.changes.length} 项`, { action: { label: '撤销', run: () => { activity.pop(); if (status) applyChange('status', before, status.to, { undoable: false }); else renderActivity(); } } });
}
function suggestStatus() {
  const to = nextStatus(record.status);
  if (!aiEnabled() || to === record.status) return;
  showSuggestion($('[data-prop="status"]').closest('.wb-prop'), { key: 'status', label: '客户状态', value: to, reason: '依据：最近一次跟进已约定现场调研', onAccept: v => applyChange('status', v, record.status) });
}
root.addEventListener('click', e => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'remind') {
    remindedAt = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    activity.push({ kind: 'event', icon: 'bell', who: ME, text: `提醒${record.owner}${NEXT_ACTION[record.status]}`, when: '刚刚' });
    renderMeta(); renderActivity();
    toast(`已提醒${record.owner}，站内通知和企业微信各发一条`);
  } else if (action === 'ai-summary') aiSummary();
  else if (action === 'ai-draft') aiDraft();
});
suggestStatus();
initShell(root);

// Page states for the samples (rules/6-反馈.md 6.8, 6.10): ?state=loading, error or denied. The real page is built
// underneath and shown again after 重试 or when loading ends; 无权限 shows no name, no field and no properties panel.
const STATES = {
  loading: () => `<div class="wb-detail-main" aria-busy="true"><span class="wb-skeleton" style="width:40%;height:var(--wb-s5)"></span>${[90, 84, 60, 0, 70, 52].map(w => w ? `<span class="wb-skeleton" style="width:${w}%;margin-block-start:var(--wb-s3)"></span>` : '<span style="display:block;height:var(--wb-s5)"></span>').join('')}</div>`,
  error: () => '<div class="wb-detail-main"><div class="wb-empty"><strong>客户没有加载出来</strong><p>网络连接中断（示例模拟）。侧栏和其他页面照常可用。</p><div><button type="button" class="wb-btn sm" data-state-action="retry">重试</button></div></div></div>',
  denied: () => `<div class="wb-detail-main"><div class="wb-empty"><strong>没有权限查看这个客户</strong><p>只有华东销售组能看这个客户，找许宁开通。</p><div><a class="wb-btn sm" href="${esc($('#back-link').getAttribute('href'))}">返回列表</a></div></div></div>`,
};
function showState(name) {
  $('#record-state')?.remove();
  const main = $('#record-main'), props = $('#record-props'), crumb = $('#crumb-code');
  main.hidden = Boolean(name);
  props.hidden = name === 'error' || name === 'denied';
  crumb.textContent = name === 'denied' ? '无权限' : record.code;
  if (!name) return;
  main.insertAdjacentHTML('beforebegin', `<div id="record-state">${STATES[name]()}</div>`);
  if (name === 'loading') setTimeout(() => { if ($('#record-state [aria-busy]')) showState(null); }, 2000);
}
root.addEventListener('click', e => { if (e.target.closest('[data-state-action="retry"]')) showState('loading'); });
const startState = new URLSearchParams(location.search).get('state');
if (startState in STATES) showState(startState);

// 标题和摘要行停在页面上方（rules/4-页面.md 4.8）：内容滚过 24px 后收成一行。
const detailScroll = document.querySelector('.wb-detail-scroll');
detailScroll?.addEventListener('scroll', () => document.querySelector('.wb-detail-head')?.classList.toggle('is-stuck', detailScroll.scrollTop > 24), { passive: true });
