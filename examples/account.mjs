// Account menu and preferences dialog, shared by every sample with a sidebar (rules/11-交互.md 11.6).
// The account button at the foot of the sidebar opens a menu; 偏好设置… opens a split dialog. Personal preferences
// apply at once and confirm with a toast; workspace configuration stays on the settings page with a save button.
import {openPopover, closePopover, createCommand, toast, pushLayer, leave, registerShortcut, setSingleKeyShortcuts, singleKeyShortcuts, setAIEnabled, aiEnabled, icon} from '../aham.js';

const KEY = 'aham-ui:settings-demo:v1';
const DEFAULTS = { home: '客户列表', week: '星期一', singleKey: true, open: '进入详情页', theme: 'light', density: 'standard', ai: false, assign: true, digest: false };
const SECTIONS = [
  { id: 'general', label: '常规', icon: 'settings' },
  { id: 'ui', label: '界面与主题', icon: 'sun' },
  { id: 'ai', label: 'AI 助手', icon: 'ai' },
  { id: 'notify', label: '通知', icon: 'bell' },
];
const row = (title, desc, control, id = '') => `<div class="wb-setting"><div><div class="wb-setting-title"${id ? ` id="${id}"` : ''}>${title}</div><div class="wb-setting-desc">${desc}</div></div><div class="wb-setting-control">${control}</div></div>`;
const toggle = (key, label) => `<label class="wb-switch"><input type="checkbox" data-setting="${key}" aria-labelledby="${label}"><span aria-hidden="true"></span></label>`;
const select = (key, label, options) => `<select class="wb-field sm" data-setting="${key}" aria-labelledby="${label}">${options.map(o => `<option>${o}</option>`).join('')}</select>`;
const seg = (attr, label, options) => `<div class="wb-seg sm" role="group" aria-label="${label}">${options.map(([v, l]) => `<button type="button" ${attr}="${v}" aria-pressed="false">${l}</button>`).join('')}</div>`;
const BODIES = {
  general: `<section class="wb-settings-section" aria-labelledby="p-general"><header><div><h2 id="p-general">常规</h2><p>打开应用时的默认行为。</p></div></header><div class="wb-settings-rows">
    ${row('默认首页', '登录后先打开的页面', select('home', 'p-home', ['客户列表', '我负责的', '最近访问']), 'p-home')}
    ${row('每周第一天', '用于日期选择和按周统计', select('week', 'p-week', ['星期一', '星期日']), 'p-week')}
    ${row('单键快捷键', '按 C、/、J、K 等单个字母直接执行操作；关闭后组合键和方向键仍可用', toggle('singleKey', 'p-single'), 'p-single')}
    ${row('重置全部偏好', '以上和其他分类的设置都恢复默认值', '<button type="button" class="wb-btn sm ghost danger" data-pref="reset">重置</button>')}
  </div></section>`,
  ui: `<section class="wb-settings-section" aria-labelledby="p-ui"><header><div><h2 id="p-ui">界面与主题</h2><p>外观、列表疏密与打开记录的方式。</p></div></header><div class="wb-settings-rows">
    ${row('外观', '跟随系统时，按系统的浅色或深色切换', seg('data-theme-choice', '外观', [['light', '浅色'], ['dark', '深色'], ['system', '跟随系统']]))}
    ${row('列表行高', '新打开的列表默认用这个行高', seg('data-density-choice', '列表行高', [['standard', '标准 44'], ['compact', '紧凑 36']]))}
    ${row('打开记录', '点击列表里的名称时', select('open', 'p-open', ['进入详情页', '在预览面板打开']), 'p-open')}
  </div></section>`,
  ai: `<section class="wb-settings-section" aria-labelledby="p-ai"><header><div><h2 id="p-ai">AI 助手</h2><p>总结、起草和建议下一步。结果都要你确认后才会保存。</p></div></header><div class="wb-settings-rows">
    ${row('使用 AI 助手', '开启后会把当前记录的名称、属性和最近动态发送给产品配置的 AI 服务；示例只在本地模拟', toggle('ai', 'p-aion'), 'p-aion')}
  </div></section>`,
  notify: `<section class="wb-settings-section" aria-labelledby="p-notify"><header><div><h2 id="p-notify">通知</h2><p>哪些变化需要提醒你。</p></div></header><div class="wb-settings-rows">
    ${row('分配给我时', '记录的负责人改成你', toggle('assign', 'p-assign'), 'p-assign')}
    ${row('每日摘要邮件', '每天 8:30 汇总前一天的变化', toggle('digest', 'p-digest'), 'p-digest')}
  </div></section>`,
};

export function initAccount(root, { onShortcuts } = {}) {
  const button = root.querySelector('[data-action="account"]');
  let prefs = { ...DEFAULTS };
  try { prefs = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) }; } catch { /* keep defaults */ }
  prefs.singleKey = singleKeyShortcuts();
  prefs.ai = aiEnabled();
  const media = matchMedia('(prefers-color-scheme: dark)');
  // A ?theme= parameter wins until the viewer picks a theme; the header theme button changes root directly.
  const urlTheme = new URLSearchParams(location.search).get('theme');
  const themeChoice = () => urlTheme && prefs.theme === DEFAULTS.theme ? urlTheme : prefs.theme;
  const applyTheme = () => { const t = themeChoice(); root.dataset.theme = t === 'dark' || (t === 'system' && media.matches) ? 'dark' : 'light'; };
  media.addEventListener('change', () => { if (prefs.theme === 'system') applyTheme(); });
  try { if (localStorage.getItem(KEY)) applyTheme(); } catch { /* storage blocked: keep the page theme */ }

  // ── Account menu ──
  const menu = document.createElement('div');
  menu.className = 'wb-popover flush menu';
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-label', '账户');
  menu.hidden = true;
  menu.innerHTML = '<div class="wb-account-head">lin.yue@example.com</div><div></div>';
  root.append(menu);
  const items = () => [
    { id: 'prefs', label: '偏好设置…', icon: 'settings', keys: 'mod+,', group: 0 },
    ...(onShortcuts ? [{ id: 'keys', label: '键盘快捷键', icon: 'help', keys: '?', group: 0 }] : []),
    { id: 'workspace', label: '工作区设置', icon: 'users', group: 0 },
    { id: 'logout', label: '退出登录', icon: 'log-out', group: 1 },
  ];
  function run(it) {
    if (it.id === 'prefs') openPreferences();
    else if (it.id === 'keys') onShortcuts?.();
    else if (it.id === 'workspace') location.href = 'settings.html';
    else if (it.id === 'logout') toast('示例：不会退出登录');
  }
  function openMenu() {
    createCommand(menu.lastElementChild, { role: 'menu', search: false, label: '账户', items: items(), onSelect: it => { closePopover('replace'); run(it); } });
    openPopover(button, menu);
    menu.querySelector('[role=menu]').focus();
  }
  button?.addEventListener('click', () => (menu.hidden ? openMenu() : closePopover()));

  // ── Preferences dialog ──
  let dialog = null, release = null, returnTo = null, section = 'general';
  function paint() {
    if (!dialog) return;
    const $$ = s => [...dialog.querySelectorAll(s)];
    $$('[data-setting]').forEach(el => { if (el.type === 'checkbox') el.checked = Boolean(prefs[el.dataset.setting]); else el.value = prefs[el.dataset.setting]; });
    $$('[data-theme-choice]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeChoice === themeChoice())));
    $$('[data-density-choice]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.densityChoice === prefs.density)));
    $$('[data-section]').forEach(a => (a.dataset.section === section ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  }
  function apply() { applyTheme(); setSingleKeyShortcuts(prefs.singleKey); setAIEnabled(prefs.ai); paint(); }
  // Apply, persist, confirm. If saving fails the previous value comes back and the toast says why (rules/4-页面.md 4.9).
  function commit(label, change, done = `已保存：${label}`) {
    const before = { ...prefs };
    change();
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); apply(); toast(done); }
    catch { prefs = before; apply(); toast(`没有保存「${label}」：浏览器不允许写入本地存储`); }
  }
  function show(id) {
    section = id;
    dialog.querySelector('.wb-split-body').innerHTML = BODIES[id];
    dialog.querySelector('.wb-split-body').scrollTop = 0;
    paint();
  }
  function close() {
    if (!dialog) return;
    const d = dialog;
    dialog = null;
    release?.();
    leave(d, () => { d.close(); d.remove(); if (returnTo?.isConnected) returnTo.focus(); });
  }
  function openPreferences(start = 'general') {
    if (dialog) return;
    returnTo = button?.isConnected && !document.activeElement?.closest('.wb-popover') ? document.activeElement : button;
    dialog = document.createElement('dialog');
    dialog.className = 'wb-dialog is-split';
    dialog.setAttribute('aria-labelledby', 'wb-pref-title');
    dialog.innerHTML = `<header class="wb-dialog-head"><h2 id="wb-pref-title">偏好设置</h2><button type="button" class="wb-icon-btn" data-pref="close" aria-label="关闭">${icon('close')}</button></header>
      <div class="wb-split"><nav class="wb-settings-nav" aria-label="偏好分类"><ul>${SECTIONS.map(s => `<li><a href="#" data-section="${s.id}">${icon(s.icon)}<span>${s.label}</span></a></li>`).join('')}</ul></nav><div class="wb-split-body" tabindex="-1"></div></div>`;
    root.append(dialog);
    dialog.addEventListener('cancel', e => e.preventDefault());          // Esc goes through the layer stack
    dialog.addEventListener('click', e => {
      if (e.target === dialog) { close(); return; }
      const t = e.target.closest('a, button');
      if (!t) return;
      if (t.dataset.section) { e.preventDefault(); show(t.dataset.section); t.focus(); }
      else if (t.dataset.pref === 'close') close();
      else if (t.dataset.themeChoice) commit('外观', () => { prefs.theme = t.dataset.themeChoice; });
      else if (t.dataset.densityChoice) commit('列表行高', () => { prefs.density = t.dataset.densityChoice; });
      else if (t.dataset.pref === 'reset') askReset(t);
      else if (t.dataset.pref === 'reset-cancel') show(section);
      else if (t.dataset.pref === 'reset-confirm') { commit('全部偏好', () => { prefs = { ...DEFAULTS }; }, '全部偏好已恢复默认'); show(section); }
    });
    dialog.addEventListener('change', e => {
      const el = e.target.closest('[data-setting]');
      if (!el) return;
      commit(el.closest('.wb-setting').querySelector('.wb-setting-title').textContent, () => { prefs[el.dataset.setting] = el.type === 'checkbox' ? el.checked : el.value; });
    });
    dialog.showModal();
    release = pushLayer(close);
    show(start);
    dialog.querySelector(`[data-section="${start}"]`).focus();
  }
  // A second modal on top of this one is not allowed (rules/6-反馈.md 6.3): the reset row asks in place.
  function askReset(b) {
    b.closest('.wb-setting-control').innerHTML = '<span class="wb-setting-confirm">恢复全部默认值？<button type="button" class="wb-btn sm" data-pref="reset-cancel">取消</button><button type="button" class="wb-btn sm danger" data-pref="reset-confirm">重置</button></span>';
    dialog.querySelector('[data-pref="reset-cancel"]').focus();
  }
  registerShortcut({ keys: 'mod+,', label: '打开偏好设置', group: '通用', run: () => openPreferences() });
  const commands = () => [
    { id: 'prefs', label: '偏好设置…', icon: 'settings', keys: 'mod+,', run: () => openPreferences() },
    { id: 'theme-pref', label: '外观…', icon: 'moon', children: () => [['light', '浅色'], ['dark', '深色'], ['system', '跟随系统']].map(([v, l]) => ({ id: v, label: l, current: themeChoice() === v, run: () => commit('外观', () => { prefs.theme = v; }) })) },
  ];
  return { openPreferences, openMenu, commands };
}
