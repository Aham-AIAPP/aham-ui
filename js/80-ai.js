// ── AI assistance (rules/8-AI协作.md) ────────────────────────────────────────────
// AI drafts, summarises and suggests; people decide. Consent is off until the user turns it on (rules/8-AI协作.md 8.6) and the
// choice is kept in this browser. Nothing here calls a model: the product passes generate({ signal }), an async
// iterable of text chunks that stops when the signal aborts, and decides what adopting a result means.
const AI_STORE = 'aham-ui:workbench:ai';
let aiOn = typeof document !== 'undefined' && (() => { try { return localStorage.getItem(AI_STORE) === 'on'; } catch { return false; } })();
export const aiEnabled = () => aiOn;
export function setAIEnabled(on) {
  aiOn = Boolean(on);
  try { localStorage.setItem(AI_STORE, aiOn ? 'on' : 'off'); } catch { /* storage blocked: this page only */ }
}
const AI_STATE = { consent: '需要开启', generating: '生成中', done: 'AI 生成', stopped: '已停止', failed: '生成失败' };

// A generated block: marker, streamed body, sources, then one primary action. Esc or 停止 stops generation and keeps
// what arrived. sources: [{ label, href? }]; consent: what is sent and to whom, shown before the first use.
// needsConsent() decides whether to ask first (default: AI not yet enabled); state previews can pass their own.
export function createAIOutput(host, { title, sources = [], consent = '会把当前记录的名称、属性和最近动态发送给产品配置的 AI 服务。', needsConsent = () => !aiOn, generate, adoptLabel = '采纳', onAdopt, onEdit, onDiscard }) {
  const life = scope();
  const box = document.createElement('section');
  box.className = 'wb-ai';
  box.setAttribute('aria-label', `AI：${title}`);
  box.innerHTML = `<header class="wb-ai-head"><span class="wb-ai-mark">${icon('ai')}<span data-ai-state></span></span><span class="wb-ai-title">${escapeHtml(title)}</span><button type="button" class="wb-icon-btn wb-ai-stop" data-ai="stop" aria-label="停止生成" data-tooltip="停止生成" hidden>${icon('stop')}</button></header>
    <div class="wb-ai-body"></div>
    ${sources.length ? `<p class="wb-ai-sources">依据：${sources.map(s => (s.href ? `<a href="${escapeHtml(s.href)}">${escapeHtml(s.label)}</a>` : `<span>${escapeHtml(s.label)}</span>`)).join('、')}</p>` : ''}
    <div class="wb-ai-actions"></div>
    <p class="wb-sr-only" role="status"></p>`;
  host.append(box);
  const q = s => box.querySelector(s), body = q('.wb-ai-body'), actions = q('.wb-ai-actions'), status = q('[role=status]');
  let controller = null, release = null, text = '', consented = false;
  const button = (id, label, kind = 'ghost') => `<button type="button" class="wb-btn sm ${kind}" data-ai="${id}">${escapeHtml(label)}</button>`;
  function show() { body.innerHTML = text.split(/\n{2,}/).filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join(''); }
  function paint(state, message = '') {
    box.dataset.state = state;
    box.setAttribute('aria-busy', String(state === 'generating'));
    q('[data-ai-state]').textContent = AI_STATE[state];
    q('.wb-ai-stop').hidden = state !== 'generating';
    if (q('.wb-ai-sources')) q('.wb-ai-sources').hidden = state === 'consent' || state === 'failed';
    const keep = state === 'stopped' && text.trim();
    actions.innerHTML = {
      consent: button('allow', '开启并继续', 'primary') + button('discard', '取消'),
      generating: '',
      done: button('adopt', adoptLabel, 'primary') + (onEdit ? button('edit', '编辑') : '') + button('retry', '重新生成') + button('discard', '丢弃'),
      stopped: (keep ? button('adopt', adoptLabel, 'primary') : '') + button('retry', '重新生成', keep ? 'ghost' : 'primary') + button('discard', '丢弃'),
      failed: button('retry', '重试', 'primary') + button('discard', '关闭'),
    }[state];
    if (state === 'consent') body.innerHTML = `<p>${escapeHtml(consent)}开启后可以在设置里关闭。</p>`;
    if (state === 'failed') body.insertAdjacentHTML('beforeend', `<p class="wb-ai-error">${escapeHtml(message || '生成失败。')}已有输入不受影响。</p>`);
  }
  const unlayer = () => { release?.(); release = null; };
  function stop() {
    if (box.dataset.state !== 'generating') return;
    controller.abort();
    unlayer();
    paint('stopped');
    status.textContent = `已停止：${title}`;
  }
  async function run() {
    if (!consented && needsConsent()) { paint('consent'); return; }
    controller?.abort();
    controller = new AbortController();
    const { signal } = controller;
    text = '';
    body.innerHTML = '';
    paint('generating');
    unlayer();
    release = pushLayer(stop);
    try {
      for await (const chunk of generate({ signal })) { if (signal.aborted) return; text += chunk; show(); }
      if (signal.aborted) return;
      unlayer();
      paint('done');
      status.textContent = `AI 已生成：${title}`;
    } catch (err) {
      if (signal.aborted) return;
      unlayer();
      show();
      paint('failed', err?.message);
    }
  }
  function remove() { if (box.dataset.state === 'generating') controller.abort(); unlayer(); box.remove(); }
  life.on(box, 'click', e => {
    const b = e.target.closest('[data-ai]');
    if (!b) return;
    const act = b.dataset.ai;
    if (act === 'stop') stop();
    else if (act === 'allow') { consented = true; setAIEnabled(true); run(); }
    else if (act === 'retry') run();
    else if (act === 'adopt') { onAdopt?.(text); remove(); }
    else if (act === 'edit') { onEdit?.(text); remove(); }
    else if (act === 'discard') { onDiscard?.(); remove(); }
  });
  run();
  return { run, stop, remove, text: () => text, element: box, destroy: life.end };
}

// One inline suggestion per page, under the field it concerns: value + reason, 采纳 / 忽略. Adopting goes through the
// caller's normal change path (immediate, undoable); a dismissed value is not offered again on this page.
const dismissedSuggestions = new Set();
export function showSuggestion(anchor, { key, label, value, reason, onAccept, onDismiss }) {
  const id = `${key}:${value}`;
  if (dismissedSuggestions.has(id)) return null;
  (anchor.closest('.aham-workbench') ?? document).querySelectorAll('.wb-ai-suggest').forEach(el => el.remove());
  const el = document.createElement('div');
  el.className = 'wb-ai-suggest';
  el.setAttribute('role', 'note');
  el.setAttribute('aria-label', `AI 建议把${label}改为${value}`);
  el.innerHTML = `${icon('ai')}<span>建议：<strong>${escapeHtml(value)}</strong></span>${reason ? `<span class="wb-ai-reason">${escapeHtml(reason)}</span>` : ''}<span class="wb-ai-suggest-actions"><button type="button" class="wb-btn sm ghost" data-ai="accept">采纳</button><button type="button" class="wb-btn sm ghost" data-ai="dismiss">忽略</button></span>`;
  anchor.after(el);
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-ai]');
    if (!b) return;
    el.remove();
    if (b.dataset.ai === 'accept') onAccept?.(value);
    else { dismissedSuggestions.add(id); onDismiss?.(); }
    (anchor.querySelector('button') ?? anchor).focus?.();
  });
  return { remove: () => el.remove() };
}

// AI-proposed changes are written only after this confirmation (rules/8-AI协作.md 8.5). changes: [{ target, from?, to }].
export function openAIConfirm({ root, title = '确认 AI 提出的修改', reason, changes, onConfirm, returnFocus }) {
  const { dialog, close } = openDialog({ root, className: 'wb-dialog wb-ai-confirm', labelledBy: 'wb-ai-confirm-title', returnFocus, html: `<form method="dialog">
    <span class="wb-ai-mark">${icon('ai')}<span>AI 建议</span></span>
    <h2 id="wb-ai-confirm-title">${escapeHtml(title)}</h2>
    ${reason ? `<p>${escapeHtml(reason)}</p>` : ''}
    <ul class="wb-ai-changes">${changes.map(c => `<li><span>${escapeHtml(c.target)}</span><span>${c.from != null ? `${escapeHtml(c.from)} → ` : ''}<strong>${escapeHtml(c.to)}</strong></span></li>`).join('')}</ul>
    <p class="wb-ai-note">共 ${changes.length} 项。确认后才会写入，写入后可以撤销。</p>
    <div class="wb-dialog-foot"><button type="button" class="wb-btn" data-ai-confirm="cancel">取消</button><button type="submit" class="wb-btn primary">确认修改</button></div>
  </form>` });
  dialog.querySelector('[data-ai-confirm=cancel]').addEventListener('click', () => close());
  dialog.querySelector('form').addEventListener('submit', e => { e.preventDefault(); close(() => onConfirm?.(changes)); });
  dialog.querySelector('[type=submit]').focus();
  return { close: () => close() };
}
