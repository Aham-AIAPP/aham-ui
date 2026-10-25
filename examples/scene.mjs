// Shared object detail (rules/4-页面.md 4.15): one scene both sides work on. People carry their organisation;
// internal notes and comments marked 仅我方 never reach the customer; an AI judgement is shown to the customer only
// after someone on our side confirms it (rules/8-AI协作.md 8.7). The 演示视角 switch shows both views of one page.
// A real product filters on the server; this sample only skips rendering.
import { initShell, initPalette, initComposer, openConfirm, toast, icon, escapeHtml as esc, personHTML, avatarCat, fileCat } from '../aham.js';
import { initAccount } from './account.mjs';
import { STAGES } from './scene-model.mjs';

const root = document.querySelector('.aham-workbench');
const $ = s => root.querySelector(s);
const now = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

const scene = { code: 'SC-0012', name: '质检日报自动汇总', customer: '远川精密', stage: '判断', ai: 'pending', aiBy: '', aiReason: '', created: '10-18' };
const OURS = { name: '林悦', org: '启衡' }, THEIRS = { name: '王卓', org: '远川' };
let view = new URLSearchParams(location.search).get('view') === 'customer' ? 'customer' : 'ours';
let composeScope = 'both';
const who = p => `${p.name} · ${p.org}`;
const me = () => (view === 'ours' ? OURS : THEIRS);
const name = p => (p.name === me().name ? '你' : who(p));

const QA = [
  { q: '现在每天怎么出质检日报？', a: '质量部文员每天早上从 QMS 导出前一天的检验记录，再手工补上纸质抽检结果，做成 Excel 发出去，大约用 40 分钟。', by: THEIRS, files: [['质检日报-1024.xlsx', '86 KB']] },
  { q: '数据从哪里来？', a: '来料和成品检验记在 QMS 里。巡检抽检有一半还写在纸质记录表上。', by: THEIRS, files: [['巡检记录表-1024.jpg', '1.2 MB']] },
  { q: '日报发给谁，什么时候要？', a: '每天 9:00 前发给质量经理和两位车间主任。', by: THEIRS, files: [] },
  { q: '有没有能用来核对的历史日报？', a: '', by: THEIRS, files: [] },
];
const activity = [
  { kind: 'event', icon: 'edit', who: THEIRS, text: '创建了场景', when: '10-18', scope: 'both' },
  { kind: 'comment', who: THEIRS, text: '附件里是上周四的日报，格式以这份为准。', when: '10-24', scope: 'both' },
  { kind: 'comment', who: OURS, text: '纸质抽检记录要先拍照录入，报价时单列这部分工作量。', when: '10-25', scope: 'ours' },
];
const visible = list => list.filter(a => view === 'ours' || a.scope === 'both');

function nextHtml() {
  let line, due = '10-26';
  if (scene.stage === '判断' && scene.ai === 'pending') line = { who: OURS, what: '确认 AI 的可行性判断' };
  else if (scene.stage === '判断') { line = { who: OURS, what: '重新判断可行性' }; due = '10-28'; }
  else line = { who: THEIRS, what: '确认立项' };
  // The customer sees our step as ours, without the AI wording: the judgement is not theirs to see yet.
  const what = view === 'customer' && line.who === OURS ? '确认可行性' : line.what;
  return `<div class="wb-next" role="status"><span class="wb-status" data-tone="wait"><b></b></span><span class="wb-grow"><strong>等${esc(name(line.who))}</strong>${esc(what)}</span><span class="wb-next-date">计划 ${due}</span></div>`;
}
function stagesHtml() {
  const at = STAGES.indexOf(scene.stage);
  const sub = i => (i === 0 ? '王卓 · 10-18' : i === 1 && at > 1 ? `${scene.aiBy} · 10-25` : i === at ? `等${name(at === 1 ? OURS : THEIRS)}确认` : '');
  return `<ol class="wb-stages" aria-label="阶段">${STAGES.map((s, i) => {
    const state = i < at ? 'done' : i === at ? 'current' : 'todo';
    return `<li data-state="${state}" aria-label="${s}：${{ done: '已完成', current: '进行中', todo: '没开始' }[state]}"><span class="wb-stage-name">${state === 'done' ? icon('check') : ''}${s}</span><span class="wb-stage-sub">${esc(sub(i))}</span></li>`;
  }).join('')}</ol>`;
}
function aiHtml() {
  if (view === 'customer' && scene.ai !== 'confirmed') return '';
  const status = { pending: ['wait', '待确认'], confirmed: ['success', '已确认'], rejected: ['danger', '已驳回'] }[scene.ai];
  const foot = scene.ai === 'pending'
    ? '<div class="wb-ai-actions"><button type="button" class="wb-btn sm primary" data-action="ai-confirm">确认判断</button><button type="button" class="wb-btn sm" data-action="ai-reject">驳回</button></div>'
    : `<p class="wb-ai-sources">${scene.ai === 'confirmed' ? `${esc(scene.aiBy)}确认 · 10-25` : `${esc(scene.aiBy)}驳回 · 10-25：${esc(scene.aiReason)}`}</p>`;
  return `<section class="wb-detail-section" aria-labelledby="ai-title"><div class="wb-ai">
    <div class="wb-ai-head"><span class="wb-ai-mark">${icon('ai')}<span>AI</span></span><h2 class="wb-ai-title" id="ai-title">可行性判断</h2><span class="wb-status" data-tone="${status[0]}"><b></b><span>${status[1]}</span></span></div>
    <div class="wb-ai-body"><p>可以做。建议先接 QMS 数据，日报每天 1 份，现在人工用 40 分钟。</p><p>风险：一半巡检记录在纸上，要先拍照录入。</p></div>
    <p class="wb-ai-sources">依据：问题 1–3 的回答和附件「质检日报-1024.xlsx」</p>${foot}</div></section>`;
}
function qaHtml() {
  const attach = ([n, size]) => `<a class="wb-attach" href="#" data-action="no-sample"><svg class="wb-cat-icon" data-cat="${fileCat(n)}" aria-hidden="true"><use href="../assets/icons/aham-icons.svg#i-file"/></svg><span>${esc(n)}</span><span>${size}</span></a>`;
  return `<section class="wb-detail-section" aria-labelledby="qa-title"><div class="wb-section-heading"><h2 id="qa-title">问题和回答<span>${QA.filter(x => x.a).length} / ${QA.length}</span></h2></div>
    <ol class="wb-qa">${QA.map((x, i) => `<li><div class="wb-qa-q">${i + 1}. ${esc(x.q)}</div>${x.a ? `<p class="wb-qa-a">${esc(x.a)}</p>` : `<p class="wb-qa-a is-empty">等${esc(name(x.by))}回答</p>`}${x.files.length ? `<div class="wb-qa-files">${x.files.map(attach).join('')}</div>` : ''}</li>`).join('')}</ol></section>`;
}
function noteHtml() {
  if (view === 'customer') return '';
  return `<section class="wb-detail-section" aria-labelledby="note-title"><div class="wb-section-heading"><h2 id="note-title">内部备注</h2><span class="wb-scope">${icon('lock')}<span>仅我方</span></span></div>
    <p class="wb-detail-body">远川去年试过一家报表供应商，没有用起来。报价时先讲清数据录入的工作量。</p></section>`;
}
function activityHtml() {
  const list = visible(activity);
  return list.map(a => a.kind === 'event'
    ? `<div class="wb-activity-event"><span class="wb-activity-icon">${icon(a.icon)}</span><span><strong>${esc(who(a.who))}</strong> ${esc(a.text)}</span><span class="wb-activity-time">· ${esc(a.when)}</span></div>`
    : `<article class="wb-comment"><div class="wb-comment-head"><span class="wb-avatar-xs" data-cat="${avatarCat(a.who.name)}" aria-hidden="true">${esc(a.who.name[0])}</span><strong>${esc(who(a.who))}</strong><span>${esc(a.when)}</span>${a.scope === 'ours' ? `<span class="wb-scope">${icon('lock')}<span>仅我方</span></span>` : ''}</div><p>${esc(a.text)}</p></article>`).join('');
}
function scopeButton() {
  if (view === 'customer') return '';
  const ours = composeScope === 'ours';
  return `<button type="button" class="wb-btn sm ghost" data-action="scope" aria-pressed="${ours}">${ours ? icon('lock') : icon('users')}<span>${ours ? '仅我方' : '双方可见'}</span></button>`;
}

function render() {
  const keep = $('#composer textarea')?.value ?? '';
  const open = $('#activity-fold')?.open ?? false;
  const list = visible(activity);
  $('#scene-main').innerHTML = `
    <h1 class="wb-detail-title">${esc(scene.name)}</h1>
    <div class="wb-detail-meta"><span>${esc(scene.code)}</span><span>${esc(scene.customer)}</span><span>业务负责人 ${personHTML('王卓')}<span class="wb-meta"> · 远川</span></span></div>
    ${nextHtml()}
    ${stagesHtml()}
    <div class="wb-problem"><section aria-labelledby="now-title"><h3 id="now-title">现在</h3><p>质量部每天手工汇总前一天的检验记录，做成 Excel 日报，约 40 分钟。</p><p>纸质抽检结果常常晚到，日报 9:00 前发不出去。</p></section>
      <section aria-labelledby="want-title"><h3 id="want-title">希望</h3><p>每天 8:30 自动生成日报，发给质量经理和车间主任。</p><p>纸质记录拍照后能自动识别进日报。</p></section></div>
    ${aiHtml()}
    ${qaHtml()}
    ${noteHtml()}
    <section class="wb-detail-section" aria-labelledby="activity-title">
      <h2 id="activity-title" class="wb-sr-only">动态</h2>
      <details class="wb-fold" id="activity-fold"${open ? ' open' : ''}><summary>${icon('chevron-right')}<strong>动态</strong><span class="wb-fold-sum">${list.length} 条 · 最近 ${esc(list.at(-1).when)}</span></summary>
        <div class="wb-fold-body"><div class="wb-activity" role="log" aria-live="polite">${activityHtml()}</div></div>
      </details>
      <form class="wb-composer" id="composer" aria-label="写评论">
        <textarea rows="2" aria-label="评论内容" placeholder="${view === 'ours' ? '写评论，默认双方可见…' : '写评论…'}" maxlength="2000"></textarea>
        <div class="wb-composer-foot">${scopeButton()}<span class="wb-grow"></span><button type="submit" class="wb-btn sm primary">发送</button></div>
      </form>
    </section>`;
  $('#composer textarea').value = keep;
  initComposer($('#composer'), { onSubmit: text => {
    const scope = view === 'customer' ? 'both' : composeScope;
    activity.push({ kind: 'comment', who: me(), text, when: '刚刚', scope });
    render();
    $('#activity-fold').open = true;
    toast(scope === 'ours' ? '已发送，只有我方能看到' : '已发送，双方都能看到');
    return true;
  } });
  $('#scene-props').innerHTML = `
    <section class="wb-props-section" aria-labelledby="props-a"><h2 class="wb-props-title" id="props-a">属性</h2>
      <div class="wb-prop"><span>客户</span><span class="wb-prop-value">远川精密</span></div>
      <div class="wb-prop"><span>业务负责人</span><span class="wb-prop-value">${personHTML('王卓')}<span class="wb-meta">远川</span></span></div>
      <div class="wb-prop"><span>我方顾问</span><span class="wb-prop-value">${personHTML('林悦')}<span class="wb-meta">启衡</span></span></div>
      <div class="wb-prop"><span>发生频次</span><span class="wb-prop-value">每天</span></div>
    </section>
    <section class="wb-props-section" aria-labelledby="props-b"><h2 class="wb-props-title" id="props-b">信息</h2>
      <div class="wb-prop"><span>编号</span><span class="wb-prop-value">${scene.code}</span></div>
      <div class="wb-prop"><span>创建日期</span><span class="wb-prop-value">${scene.created}</span></div>
    </section>`;
  root.querySelectorAll('#scene-view [data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
}

function decide(result, reason = '') {
  scene.ai = result;
  scene.aiBy = OURS.name;
  scene.aiReason = reason;
  if (result === 'confirmed') scene.stage = '立项';
  activity.push({ kind: 'event', icon: result === 'confirmed' ? 'check' : 'close', who: OURS, text: result === 'confirmed' ? '确认了 AI 的可行性判断，场景进入「立项」' : `驳回了 AI 的可行性判断：${reason}`, when: now(), scope: result === 'confirmed' ? 'both' : 'ours' });
  render();
  toast(result === 'confirmed' ? '已确认判断，客户现在能看到' : '已驳回，客户看不到这条判断');
}
function setView(v) {
  view = v;
  const url = new URL(location.href);
  if (v === 'ours') url.searchParams.delete('view'); else url.searchParams.set('view', v);
  history.replaceState(null, '', url);
  render();
}

root.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.view) setView(b.dataset.view);
  else if (b.dataset.action === 'scope') { composeScope = composeScope === 'ours' ? 'both' : 'ours'; const keep = $('#composer textarea').value; render(); $('#composer textarea').value = keep; $('[data-action="scope"]').focus(); }
  else if (b.dataset.action === 'ai-confirm') decide('confirmed');
  else if (b.dataset.action === 'ai-reject') openConfirm({ root, returnFocus: b, title: '驳回这条可行性判断？', text: '驳回后客户看不到这条判断。原因只有我方能看到。', confirm: '驳回', reason: { label: '驳回原因' }, onConfirm: reason => decide('rejected', reason) });
});

$('#crumb-code').textContent = scene.code;
document.title = `${scene.name} · Aham UI`;
initShell(root);
render();
const account = initAccount(root, { onShortcuts: () => palette.showShortcuts() });
const palette = initPalette({
  root, shell: true, accountItems: () => account.commands(),
  groups: () => [
    ...(view === 'ours' && scene.ai === 'pending' ? [{ heading: '当前场景', items: [
      { id: 'ai-confirm', label: '确认 AI 判断', icon: 'check', run: () => decide('confirmed') },
      { id: 'ai-reject', label: '驳回 AI 判断…', icon: 'close', run: () => $('[data-action="ai-reject"]').click() },
    ] }] : []),
    { heading: '示例', items: [
      { id: 'view-ours', label: '演示视角：我方', icon: 'users', current: view === 'ours', run: () => setView('ours') },
      { id: 'view-customer', label: '演示视角：客户方', icon: 'user', current: view === 'customer', run: () => setView('customer') },
    ] },
  ],
});
