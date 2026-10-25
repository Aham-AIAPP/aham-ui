import {initShell, initPanels, initPalette} from '../aham.js';
import {initAccount} from './account.mjs';
const root = document.querySelector('.aham-workbench');
const feedback = root.querySelector('#shell-feedback');
initShell(root);
initPanels(root);
root.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.hasAttribute('data-view')) {
    root.querySelectorAll('[data-view]').forEach(v => v.setAttribute('aria-pressed', String(v === b)));
    feedback.textContent = `已切换到「${b.textContent}」视图。示例数据不随视图变化。`;
    return;
  }
  switch (b.dataset.action) {
    case 'placeholder': feedback.textContent = '此示例只演示外框与页眉，该入口在后续阶段实现。'; break;
  }
});
const account = initAccount(root, { onShortcuts: () => palette.showShortcuts() });
// Command palette (rules/7-键盘与命令.md 7.2): the header buttons are commands too.
const palette = initPalette({
  root,
  shell: true,
  accountItems: () => account.commands(),
  groups: () => [
    { heading: '视图', items: [...root.querySelectorAll('[data-view]')].map((v, i) => ({ id: `view-${i}`, label: v.textContent, run: () => v.click() })) },
  ],
});
