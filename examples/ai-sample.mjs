// Local stand-in for a model so the AI patterns (rules/8-AI协作.md) can be shown without any network call.
// Products replace simulateStream with their own service; the Aham UI components only need an async iterable
// of text that stops when the signal aborts. All texts below are fictional.
export async function* simulateStream(text, { signal, delay = 40, failAfter = null } = {}) {
  const parts = text.match(/[^，。；\n]+[，。；]?|\n+/g) ?? [text];
  let sent = 0;
  for (const part of parts) {
    await new Promise(resolve => {
      const timer = setTimeout(resolve, delay);
      signal?.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
    });
    if (signal?.aborted) return;
    if (failAfter !== null && sent >= failAfter) throw new Error('AI 服务暂时不可用（示例模拟）。');
    sent++;
    yield part;
  }
}

// Waits until aborted: keeps a block in the generating state for the state preview.
export async function* holdStream(text, { signal } = {}) {
  yield text;
  await new Promise(resolve => signal?.addEventListener('abort', resolve, { once: true }));
}

// A customer moves from 潜在 to 跟进中 once a visit is agreed; 已成交 and 已流失 follow contracts, not AI advice.
export const nextStatus = current => current === '潜在' ? '跟进中' : current;

export function summaryText(record) {
  return `${record.name}客户状态是「${record.status}」，负责人${record.owner}。\n\n最近一次跟进在 ${record.lastContact}：已约好下周二现场调研，需要先确认设备接口清单。\n\n可以先发送接口清单模板，并在调研前两天确认参会人员。`;
}

export function draftText() {
  return '今天与客户确认了现场调研安排，约定下周二上门。\n\n待办：发送设备接口清单模板，确认参会人员和会议室。';
}

export function nextStepPlan(record) {
  const to = nextStatus(record.status), task = { key: 'task', target: '新建任务', to: '发送设备接口清单模板 · 截止 2026-10-06' };
  return to === record.status ? {
    text: '最近一次跟进已约定现场调研，客户在准备设备接口清单。\n\n可以新建一个任务跟进接口清单。',
    reason: '最近一次跟进已约定现场调研。',
    changes: [task],
  } : {
    text: `最近一次跟进已约定现场调研，客户在准备设备接口清单。\n\n可以把客户状态改为「${to}」，并新建一个任务跟进接口清单。`,
    reason: '最近一次跟进已约定现场调研。',
    changes: [{ key: 'status', target: '客户状态', from: record.status, to }, task],
  };
}
