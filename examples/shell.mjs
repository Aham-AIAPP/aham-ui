import {initShell, initPanels, initPalette, navCommands} from '../aham.js';
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
// Command palette (rules/7-键盘与命令.md 7.2): the header buttons are commands too.
initPalette({
  root,
  groups: () => [
    { heading: '视图', items: [...root.querySelectorAll('[data-view]')].map((v, i) => ({ id: `view-${i}`, label: v.textContent, run: () => v.click() })) },
    { heading: '界面', items: [
      { id: 'nav', label: '展开或收起侧栏', icon: 'menu', keys: 'mod+b', run: () => root.querySelector('[data-action="nav"]').click() },
      { id: 'peek', label: '打开或关闭预览面板', icon: 'eye', run: () => root.querySelector('[data-panel-toggle]').click() },
      { id: 'theme', label: '切换深色和浅色', icon: 'moon', run: () => root.querySelector('[data-action="theme"]').click() },
    ] },
    { heading: '跳转', items: navCommands(root) },
  ],
});
