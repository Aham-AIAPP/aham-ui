// Settings sample: single-value settings apply immediately and confirm with a toast; reset asks first.
import {initShell, initPalette, navCommands, registerShortcut, listShortcuts, toast, pushLayer, setSingleKeyShortcuts, singleKeyShortcuts, setAIEnabled, aiEnabled} from '../aham.js';

const root = document.querySelector('.aham-workbench');
const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
const KEY = 'aham-ui:settings-demo:v1';
const DEFAULTS = { home: '客户列表', week: '星期一', singleKey: true, open: '进入详情页', theme: 'light', density: 'standard', ai: false, assign: true, digest: false };
let prefs = { ...DEFAULTS };
try { prefs = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) }; } catch { /* keep defaults */ }
// Single-key shortcuts and AI consent are kept by aham.js; show its current choice.
prefs.singleKey = singleKeyShortcuts();
prefs.ai = aiEnabled();
const media = matchMedia('(prefers-color-scheme: dark)');

// A ?theme= parameter (the panorama page passes its theme to embedded samples) wins until the viewer picks one here.
let forcedTheme = null;
const themeChoice = () => forcedTheme ?? prefs.theme;
function applyTheme() {
  const t = themeChoice(), dark = t === 'dark' || (t === 'system' && media.matches);
  root.dataset.theme = dark ? 'dark' : 'light';
}
function paint() {
  $$('[data-setting]').forEach(el => { if (el.type === 'checkbox') el.checked = Boolean(prefs[el.dataset.setting]); else el.value = prefs[el.dataset.setting]; });
  $$('[data-theme-choice]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeChoice === themeChoice())));
  $$('[data-density-choice]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.densityChoice === prefs.density)));
  applyTheme();
  setSingleKeyShortcuts(prefs.singleKey);
  setAIEnabled(prefs.ai);
}
// Apply, persist, confirm. If saving fails, the previous value comes back and the toast says why (rules/4-页面.md 4.8).
function commit(label, apply, done = `已保存：${label}`) {
  const before = { ...prefs };
  apply();
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); paint(); toast(done); }
  catch { prefs = before; paint(); toast(`没有保存「${label}」：浏览器不允许写入本地存储`); }
}
root.addEventListener('change', e => {
  const el = e.target.closest('[data-setting]');
  if (!el) return;
  const title = el.closest('.wb-setting').querySelector('.wb-setting-title').textContent;
  commit(title, () => { prefs[el.dataset.setting] = el.type === 'checkbox' ? el.checked : el.value; });
});
root.addEventListener('click', e => {
  const b = e.target.closest('button, a');
  if (!b) return;
  if (b.dataset.themeChoice) commit('外观', () => { forcedTheme = null; prefs.theme = b.dataset.themeChoice; });
  else if (b.dataset.densityChoice) commit('列表行高', () => { prefs.density = b.dataset.densityChoice; });
  else if (b.dataset.action === 'placeholder') { e.preventDefault(); toast('示例只做了偏好设置这一页'); }
  else if (b.dataset.action === 'reset') {
    const dialog = $('#reset-dialog');
    const release = pushLayer(() => dialog.close('cancel'));
    dialog.addEventListener('close', () => {
      release();
      if (dialog.returnValue !== 'confirm') return;
      commit('全部偏好', () => { prefs = { ...DEFAULTS }; }, '全部偏好已恢复默认');
    }, { once: true });
    dialog.returnValue = '';
    dialog.showModal();
  }
});
media.addEventListener('change', () => { if (prefs.theme === 'system') applyTheme(); });
forcedTheme = initShell(root)?.theme?.fromUrl ?? null;
paint();

// Command palette (rules/7-键盘与命令.md 7.2): the choices on this page are commands too.
const shortcutItems = () => listShortcuts().map((k, i) => ({ id: `k${i}`, label: k.label, keys: k.keys }));
const setPalette = initPalette({
  root,
  groups: () => [
    { heading: '偏好设置', items: [
      { id: 'theme', label: '外观…', icon: 'moon', children: () => [['light', '浅色'], ['dark', '深色'], ['system', '跟随系统']].map(([v, l]) => ({ id: v, label: l, current: themeChoice() === v, run: () => commit('外观', () => { forcedTheme = null; prefs.theme = v; }) })) },
      { id: 'density', label: '列表行高…', icon: 'menu', children: () => [['standard', '标准 44'], ['compact', '紧凑 36']].map(([v, l]) => ({ id: v, label: l, current: prefs.density === v, run: () => commit('列表行高', () => { prefs.density = v; }) })) },
      { id: 'single-key', label: prefs.singleKey ? '关闭单键快捷键' : '打开单键快捷键', icon: 'settings', run: () => commit('单键快捷键', () => { prefs.singleKey = !prefs.singleKey; }) },
      { id: 'reset', label: '重置全部偏好…', icon: 'trash', danger: true, run: () => $('[data-action="reset"]').click() },
    ] },
    { heading: '界面', items: [{ id: 'nav', label: '展开或收起侧栏', icon: 'menu', keys: 'mod+b', run: () => $('[data-action="nav"]').click() }] },
    { heading: '跳转', items: navCommands(root) },
    { heading: '帮助', items: [{ id: 'keys', label: '键盘快捷键…', icon: 'help', keys: '?', children: shortcutItems }] },
  ],
});
registerShortcut({ keys: '?', label: '查看键盘快捷键', group: '通用', run: () => setPalette.openAt('键盘快捷键', shortcutItems()) });
