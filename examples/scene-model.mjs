// Scenes shared by the customer and our side (rules/4-页面.md 4.2, 4.15). Pure data, no DOM. All names are fictional:
// 启衡 is our side, the other organisations are customers. The current user is 林悦 · 启衡.
export const ME = '林悦';
export const OURS = '启衡';
export const STAGES = ['收集', '判断', '立项', '开发', '验证', '上线'];

// wait: who the scene waits for and what they do; null once it is live. ai: the AI judgement state, if any.
export const SCENES = [
  { code: 'SC-0012', name: '质检日报自动汇总', customer: '远川精密', stage: '判断', owner: '林悦', wait: { who: '林悦', org: OURS, what: '确认 AI 的可行性判断' }, due: '10-26', ai: 'pending', updated: '10-25' },
  { code: 'SC-0011', name: '设备点检提醒', customer: '远川精密', stage: '收集', owner: '林悦', wait: { who: '王卓', org: '远川', what: '回答问题 5' }, due: '10-27', updated: '10-24' },
  { code: 'SC-0010', name: '设备故障知识问答', customer: '临港智能', stage: '判断', owner: '许宁', wait: { who: '许宁', org: OURS, what: '确认 AI 的可行性判断' }, due: '10-28', ai: 'pending', updated: '10-24' },
  { code: 'SC-0009', name: '排产异常提醒', customer: '临港智能', stage: '开发', owner: '陈默', wait: { who: '陈默', org: OURS, what: '完成接口联调' }, due: '10-30', updated: '10-23' },
  { code: 'SC-0008', name: '来料检验拍照识别', customer: '华东精工', stage: '验证', owner: '周航', wait: { who: '张工', org: '华东精工', what: '确认验收数据' }, due: '10-24', overdue: 1, updated: '10-22' },
  { code: 'SC-0007', name: '报价单自动比价', customer: '北岸包装', stage: '立项', owner: '林悦', wait: { who: '林悦', org: OURS, what: '确认立项范围' }, due: '10-29', updated: '10-21' },
  { code: 'SC-0005', name: '安灯呼叫统计', customer: '金溪医疗', stage: '上线', owner: '周航', wait: null, updated: '10-12' },
];

// 上线 is the end of the bar: a live scene shows the done icon (rules/3-控件.md 3.15).
export const stageState = stage => (stage === '上线' ? { state: 'done' } : { state: 'current', done: STAGES.indexOf(stage), total: STAGES.length - 1 });
export const waitText = (w, me = ME) => (w ? `等${w.who === me ? '你' : `${w.who} · ${w.org}`}${w.what}` : '已上线');
export const VIEWS = { all: '全部场景', mine: '等我处理', ai: 'AI 待确认' };
export function applyView(rows, view, me = ME) {
  if (view === 'mine') return rows.filter(r => r.wait?.who === me);
  if (view === 'ai') return rows.filter(r => r.ai === 'pending');
  return rows;
}
