// Contrast pairs and the WCAG 2 contrast ratio. The lint checks the pairs in both themes, the theme generator checks
// generated themes against them, and the build writes the table in rules/2-视觉.md 2.3 from them.

// [foreground, background, minimum, what it is]. 4.5 for text, 3 for icons, focus rings and large text.
export const PAIRS = [
  ['ink', 'bg', 4.5, '正文'], ['ink', 'canvas', 4.5, '外框和侧栏上的正文、侧栏的导航项'], ['ink', 'fill', 4.5, '小元素底色上的正文'], ['ink', 'selected', 4.5, '选中行的正文'],
  ['ink-2', 'bg', 4.5, '控件里的次要文字（视图页签、标签文字）'], ['muted', 'bg', 4.5, '次要文字'], ['muted', 'canvas', 4.5, '侧栏上的次要文字'], ['muted', 'fill', 4.5, '小元素底色上的次要文字'], ['ink-2', 'canvas', 4.5, '侧栏上的计数'], ['ink', 'nav-selected', 4.5, '侧栏的当前项'], ['ink-2', 'nav-selected', 4.5, '侧栏当前项上的计数'], ['ink', 'nav-hover', 4.5, '侧栏悬停项'],
  ['faint', 'bg', 3, '图标、禁用文字'], ['faint', 'fill', 3, '小元素底色上的图标'],
  ['line-strong', 'bg', 3, '输入框的描边'], ['line-strong', 'pop-bg', 3, '弹层里的输入框描边'],
  ['on', 'action', 4.5, '主按钮文字'], ['on', 'action-hover', 4.5, '主按钮悬停时的文字'], ['on', 'action-press', 4.5, '主按钮按下时的文字'],
  ['ink', 'button', 4.5, '次要按钮文字'], ['ink', 'button-hover', 4.5, '次要按钮悬停文字'], ['ink', 'button-press', 4.5, '次要按钮按下文字'], ['danger', 'danger-press', 4.5, '危险按钮按下文字'],
  ['blue', 'bg', 3, '焦点框、链接图标'],
  ['success', 'bg', 4.5, '成功文字'], ['warning', 'bg', 4.5, '警示文字'], ['danger', 'bg', 4.5, '错误文字'], ['info', 'bg', 4.5, '信息文字'],
  ['danger', 'danger-bg', 4.5, '错误提示框里的文字'], ['ink', 'warning-bg', 4.5, '警示提示框里的文字'], ['ink', 'warning-mark', 4.5, '待核对的值'],
  ['ink', 'success-bg', 4.5, '成功提示条里的文字'], ['ink', 'info-bg', 4.5, '信息提示条里的文字'], ['ink', 'danger-bg', 4.5, '错误提示条里的文字'],
  ...[1, 2, 3, 4, 5, 6].map(n => [`cat-${n}`, 'bg', 3, `分类色 ${n}（图标、标签色点）`]),
];

function rgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
}
const lum = hex => {
  const [r, g, b] = rgb(hex).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

// The table in rules/2-视觉.md 2.3. resolve(path) returns a token's value with aliases followed.
export function contrastTable(resolve) {
  const rows = PAIRS.map(([fg, bg, min, what]) => {
    const v = t => resolve(`color.${t}.${fg}`), w = t => resolve(`color.${t}.${bg}`);
    return `| ${what} | \`${fg}\` / \`${bg}\` | ${contrast(v('light'), w('light')).toFixed(2)} | ${contrast(v('dark'), w('dark')).toFixed(2)} | ${min} |`;
  });
  return ['| 用途 | 前景 / 背景 | 亮色 | 暗色 | 要求 |', '|---|---|---|---|---|', ...rows].join('\n');
}
