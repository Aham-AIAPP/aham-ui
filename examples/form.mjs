// Outside form sample (rules/4-页面.md 4.12): three steps, a progress line without step names, files that follow the
// question they belong to. Fictional data; nothing leaves the page.
import {initTheme, initDropZone, fileCat, formatBytes, icon, escapeHtml as esc, toast} from '../aham.js';

const root = document.querySelector('.aham-workbench');
const $ = s => root.querySelector(s);
initTheme(root);

const steps = [...root.querySelectorAll('[data-step]')];
const files = [];
let at = 0;

const label = c => c.closest('.wb-form-row').querySelector('.wb-form-label').firstChild.textContent.trim();
function hint(c, text) {
  let h = c.parentElement.querySelector('.wb-form-hint');
  if (!h) { h = document.createElement('span'); h.className = 'wb-form-hint is-error'; h.setAttribute('role', 'alert'); c.after(h); }
  h.textContent = text;
  if (text) c.setAttribute('aria-invalid', 'true'); else c.removeAttribute('aria-invalid');
}
function check(step) {
  const bad = [];
  for (const c of step.querySelectorAll('[required]')) {
    const v = c.value.trim();
    const msg = !v ? `${label(c)}未填写` : c.name === 'phone' && !/^1\d{10}$/.test(v) ? '填 11 位手机号' : '';
    hint(c, msg);
    if (msg) bad.push(c);
  }
  bad[0]?.focus();
  return !bad.length;
}

function render() {
  steps.forEach((s, i) => { s.hidden = i !== at; });
  [...$('#progress').children].forEach((li, i) => { if (i < at) li.dataset.state = 'done'; else if (i === at) li.dataset.state = 'current'; else delete li.dataset.state; });
  $('#progress-text').textContent = `第 ${at + 1} 步，共 ${steps.length} 步`;
  $('#prev').hidden = at === 0;
  $('#next').textContent = at === steps.length - 1 ? '提交' : '下一步';
  if (at === steps.length - 1) {
    const f = $('#form').elements;
    const rows = [['企业名称', f.company.value], ['联系人', f.contact.value], ['手机号', f.phone.value], ['现在', f.now.value], ['希望', f.want.value], ['样本资料', files.length ? `${files.length} 个文件` : '未添加']];
    $('#summary').innerHTML = rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v.trim() || '未填写')}</dd>`).join('');
  }
}

function renderFiles() {
  $('#files').hidden = !files.length;
  $('#files').innerHTML = files.map((f, i) => `<li class="wb-composer-file"><svg class="wb-cat-icon" data-cat="${fileCat(f.name)}" aria-hidden="true"><use href="../assets/icons/aham-icons.svg#i-file"/></svg><span>${esc(f.name)}</span><span class="wb-file-meta">${formatBytes(f.size)}</span><button type="button" class="wb-icon-btn" data-remove="${i}" aria-label="移除 ${esc(f.name)}" data-tooltip="移除">${icon('close')}</button></li>`).join('');
}
initDropZone($('#files-box'), {
  maxSize: 20 * 1024 * 1024,
  onFiles: items => {
    const bad = items.filter(i => i.error);
    files.push(...items.filter(i => !i.error));
    renderFiles();
    if (bad.length) toast(`${bad.length} 个文件没有加入：${bad[0].name} ${bad[0].error}`);
  },
});
$('#files').addEventListener('click', e => {
  const b = e.target.closest('[data-remove]');
  if (!b) return;
  const [gone] = files.splice(Number(b.dataset.remove), 1);
  renderFiles();
  toast(`已移除 ${gone.name}`);
  $('#files-box [data-drop]').focus();
});

$('#next').addEventListener('click', () => {
  if (at < steps.length - 1) {
    if (!check(steps[at])) return;
    at++;
    render();
    steps[at].querySelector('input, textarea, h2')?.focus();
    return;
  }
  $('#form-page').innerHTML = `<p class="wb-form-page-brand">远川精密 · 设备需求填报</p><h1 class="wb-form-page-title">已提交</h1><p>我们会在 2 个工作日内联系 ${esc($('#form').elements.contact.value.trim())}。示例页不保存数据。</p>`;
});
$('#prev').addEventListener('click', () => { at = Math.max(0, at - 1); render(); });

renderFiles();
render();
