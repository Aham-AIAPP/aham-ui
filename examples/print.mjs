// Print preview of the quotation. Reads the copy document.mjs keeps in sessionStorage; without it, prints the sample.
import { initTheme, initTooltips, escapeHtml as esc } from '../aham.js';
import { defaults, lineCents, totals, money, chineseAmount, validRow } from './quotation-model.mjs';

const root = document.querySelector('.aham-workbench');
const sample = {
  status: 'draft',
  fields: { customer: '远川精密制造有限公司', opportunity: 'MES 一期建设项目', contact: '', owner: '林悦 · 华东销售组', quoteDate: '2026-09-30', validTo: '2026-10-30', currency: '人民币 CNY', tax: '含税', delivery: '本地部署', site: '苏州 · 一期生产基地', period: '合同生效后 90 天', payment: '40% 预付 / 40% 上线 / 20% 终验' },
  rows: defaults(),
};
function load() {
  try {
    const saved = JSON.parse(sessionStorage.getItem('aham-quote'));
    if (!saved?.fields || !Array.isArray(saved.rows)) return sample;
    const rows = defaults().map(r => ({ ...r, ...saved.rows.find(x => x.id === r.id) }));
    return rows.every(validRow) ? { ...saved, rows } : sample;
  } catch { return sample; }
}

const q = load(), f = q.fields, t = totals(q.rows);
const MARK = { draft: '草稿 · 未生效', review: '审批中 · 未生效', returned: '已退回 · 未生效', voided: '已作废' };
const mark = MARK[q.status];
document.querySelector('#print-note').textContent = mark ? `这张单据${mark.split(' · ')[0]}，打印件会带「${mark}」标记` : '';

document.querySelector('#sheet').innerHTML = `
  <header class="wb-sheet-head">
    <div><h1>销售报价单</h1><p>Aham 演示科技有限公司</p></div>
    <div>${mark ? `<span class="wb-sheet-mark">${esc(mark)}</span>` : ''}</div>
  </header>
  <dl>
    <dt>报价单号</dt><dd>QT-20260930-018</dd><dt>报价日期</dt><dd>${esc(f.quoteDate)}</dd>
    <dt>客户</dt><dd>${esc(f.customer)}</dd><dt>有效期至</dt><dd>${esc(f.validTo)}</dd>
    <dt>联系人</dt><dd>${esc(f.contact || '–')}</dd><dt>币种</dt><dd>${esc(f.currency)}，${esc(f.tax)}</dd>
    <dt>负责人</dt><dd>${esc(f.owner)}</dd><dt>关联项目</dt><dd>${esc(f.opportunity)}</dd>
  </dl>
  <h2>报价明细</h2>
  <table class="wb-table">
    <colgroup><col style="width:28px"><col><col style="width:64px"><col style="width:44px"><col style="width:36px"><col style="width:84px"><col style="width:52px"><col style="width:96px"></colgroup>
    <thead><tr><th>#</th><th>产品 / 服务</th><th>编码</th><th class="number">数量</th><th>单位</th><th class="number">单价</th><th class="number">折扣 %</th><th class="number">金额</th></tr></thead>
    <tbody>${q.rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.name)}</td><td class="wb-meta">${esc(r.code.split(' · ')[0])}</td><td class="number">${r.qty}</td><td>${esc(r.unit)}</td><td class="number">${money(r.priceCents)}</td><td class="number">${(r.discountTenths / 10).toFixed(1)}</td><td class="number">${money(lineCents(r))}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="7">合计</td><td class="number">${money(t.total)}</td></tr></tfoot>
  </table>
  <div class="wb-sheet-total"><span>折前 ${money(t.original)}，优惠 ${money(t.discount)}</span><strong>价税合计 ¥${money(t.total)}</strong><span>大写：${chineseAmount(t.total)}</span></div>
  <h2>商务条款</h2>
  <dl>
    <dt>交付方式</dt><dd>${esc(f.delivery)}</dd><dt>实施地点</dt><dd>${esc(f.site)}</dd>
    <dt>项目周期</dt><dd>${esc(f.period)}</dd><dt>付款方式</dt><dd>${esc(f.payment)}</dd>
  </dl>
  <div class="wb-sheet-sign"><div>客户确认（签字盖章）</div><div>报价方（盖章）</div></div>`;

initTheme(root);
initTooltips(root);
document.querySelector('#print-go').addEventListener('click', () => print());
