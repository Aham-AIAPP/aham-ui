// ── People and files (rules/3-控件.md 3.11, rules/2-视觉.md 2.2) ─────────────────────────────
// Category number 1–6 for a person's avatar, from the name, so the same person has the same colour on every page.
export function avatarCat(name) {
  let h = 0;
  for (const ch of String(name ?? '').trim()) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return (h % 6) + 1;
}
// The avatar and the name. An empty name gives the dashed circle and「未指定」(rules/10-数据格式.md 10.5).
// compact: the avatar alone, named by title and aria-label; used in single-line list rows (rules/3-控件.md 3.11).
export function personHTML(name, { size = 'xs', label = '未指定', compact = false } = {}) {
  const n = String(name ?? '').trim(), cls = size === 'xs' ? 'wb-avatar-xs' : 'wb-avatar';
  if (compact) {
    const said = escapeHtml(n || label);
    return n ? `<span class="${cls}" data-cat="${avatarCat(n)}" role="img" title="${said}" aria-label="${said}">${escapeHtml([...n][0])}</span>` : `<span class="${cls} is-none" role="img" title="${said}" aria-label="${said}"></span>`;
  }
  if (!n) return `<span class="wb-person is-none"><span class="${cls} is-none" aria-hidden="true"></span><span>${escapeHtml(label)}</span></span>`;
  return `<span class="wb-person"><span class="${cls}" data-cat="${avatarCat(n)}" aria-hidden="true">${escapeHtml([...n][0])}</span><span>${escapeHtml(n)}</span></span>`;
}
// Stage icon (rules/3-控件.md 3.15): a 14px circle for where an object stands in its stages, as in Linear's status icons.
// state: todo | current | done | blocked | off. For current, done / total sets the pie; the label names stage, state and step.
export const STAGE_STATE_WORDS = { todo: '没开始', current: '进行中', done: '已完成', blocked: '受阻', off: '不进行' };
export function stageIconHTML({ state = 'todo', done = 0, total = 1, label = '' } = {}) {
  const st = STAGE_STATE_WORDS[state] ? state : 'todo';
  const part = Math.max(0, Math.min(1, total > 0 ? done / total : 0));
  const words = [label, STAGE_STATE_WORDS[st]].filter(Boolean).join('：') + (st === 'current' && total > 1 ? `，第 ${done + 1} 段，共 ${total} 段` : '');
  // The pie is a stroke on a circle of radius 2.5 whose dash length is the done share of its circumference.
  const c = 2 * Math.PI * 2.5, pie = st === 'current' ? `<circle class="wb-stage-pie" cx="7" cy="7" r="2.5" stroke-dasharray="${(c * Math.max(part, 0.08)).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 7 7)"/>` : '';
  const mark = { done: '<path d="M4.6 7.2 6.3 8.8 9.4 5.4"/>', blocked: '<path d="M4.5 7h5"/>', off: '<path d="M4.4 9.6 9.6 4.4"/>' }[st] ?? '';
  return `<span class="wb-stage-icon" data-state="${st}" role="img" title="${escapeHtml(words)}" aria-label="${escapeHtml(words)}"><svg viewBox="0 0 14 14" aria-hidden="true"><circle class="wb-stage-ring" cx="7" cy="7" r="5.75"/>${pie}${mark}</svg></span>`;
}
// Category number for a file icon by type: PDF 5, Office 1, image 3, drawing 2. Other types get no colour (0).
export const FILE_CATS = { 5: ['.pdf'], 1: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv'], 3: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic'], 2: ['.dwg', '.dxf', '.step', '.stp', '.iges', '.igs'] };
export function fileCat(name) {
  const s = String(name ?? ''), dot = s.lastIndexOf('.');
  const ext = dot > 0 ? s.slice(dot).toLowerCase() : '';
  for (const [cat, exts] of Object.entries(FILE_CATS)) if (exts.includes(ext)) return Number(cat);
  return 0;
}

