// Settings sample: single-value settings apply immediately and confirm with a toast; reset asks first.
import {initShell, toast, pushLayer, setSingleKeyShortcuts, singleKeyShortcuts, setAIEnabled, aiEnabled} from '../workbench.js';

const root = document.querySelector('.aham-workbench');
const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
const KEY = 'aham-ui:settings-demo:v1';
const DEFAULTS = { home: '客户列表', week: '星期一', singleKey: true, open: '进入详情页', theme: 'light', density: 'standard', ai: false, assign: true, digest: false };
let prefs = { ...DEFAULTS };
try { prefs = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) }; } catch { /* keep defaults */ }
// Single-key shortcuts and AI consent are kept by workbench.js; show its current choice.
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
// Apply, persist, confirm. If saving fails, the previous value comes back and the toast says why (WORKBENCH §13).
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
