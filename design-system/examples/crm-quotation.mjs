import {defaults,totals,lineCents,money,restoreDraft} from './quotation-model.mjs';
import {initShell} from '../workbench.js';
const root=document.querySelector('.aham-workbench'),q=s=>root.querySelector(s),all=s=>[...root.querySelectorAll(s)];
const key='aham-ui:quotation-demo:v1';
let items=defaults(),dirty=false,status='draft';
const fields=all('.wb-fields input');
const feedback=text=>{q('#dq-feedback').textContent=text;};
try{
 const raw=localStorage.getItem(key);
 if(raw){const s=restoreDraft(raw);items=s.rows;root.dataset.density=s.density;status=s.status;fields.forEach((el,i)=>el.value=s.fields[i]);q('textarea').value=s.note;q('#dq-save-state').textContent='已恢复本机演示草稿';}
}catch{feedback('本机草稿无法读取，已使用演示初始值；保存可重建草稿。');}
// Markup is built only from bundled fixture names; restored user text is assigned via .value.
q('#dq-rows').innerHTML=items.map(x=>`<tr data-row="${x.id}"><td>${String(x.id+1).padStart(2,'0')}</td><td><span class="wb-cell-title" title="${x.name}">${x.name}</span><span class="wb-cell-sub">${x.code}</span></td><td class="number"><input type="number" required min="0" max="999" step="1" value="${x.qty}" data-id="${x.id}" data-field="qty" aria-label="${x.name}数量" aria-describedby="dq-input-help"></td><td>${x.unit}</td><td class="number">${money(x.priceCents)}</td><td class="number"><input type="number" required min="0" max="100" step="0.1" value="${x.discountTenths/10}" data-id="${x.id}" data-field="discountTenths" aria-label="${x.name}折扣百分比" aria-describedby="dq-input-help"></td><td class="number" data-amount="${x.id}">${money(lineCents(x))}</td></tr>`).join('')+'<tr id="dq-empty" hidden><td colspan="7">没有匹配的报价明细，请修改搜索条件。</td></tr>';
function renderTotals(){
 const t=totals(items);
 for(const [id,value] of Object.entries({'dq-total':t.total,'dq-table-total':t.total,'dq-software':t.software,'dq-service':t.service,'dq-original':t.original,'dq-discount':t.discount,'dq-pay1':t.payments[0],'dq-pay2':t.payments[1],'dq-pay3':t.payments[2]}))q('#'+id).textContent=money(value);
 items.forEach(x=>q(`[data-amount="${x.id}"]`).textContent=money(lineCents(x)));
}
function renderStatus(){q('#dq-state').textContent=status==='review'?'模拟审批中':'草稿';q('#dq-approval-state').textContent=status==='review'?'待审批 · 模拟节点':'待提交';q('[data-action=submit]').disabled=status==='review';}
function change(){dirty=true;status='draft';q('#dq-save-state').textContent='未保存';renderStatus();}
function density(){all('button[data-density]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.density===root.dataset.density)));}
function selectTab(tab){all('[data-tab]').forEach(b=>{const active=b.dataset.tab===tab;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});['lines','terms','files'].forEach(t=>q(`#dq-${t}-panel`).hidden=t!==tab);}
function filter(){const term=q('.wb-find input').value.trim().toLowerCase();let count=0;items.forEach(x=>{const match=(x.name+x.code).toLowerCase().includes(term);q(`[data-row="${x.id}"]`).hidden=!match;if(match)count++;});q('#dq-empty').hidden=count!==0;q('#dq-count').textContent=`${count} / 12 项`;}
function validate(){
 fields.forEach(i=>i.setCustomValidity(i.value.trim()?'':'请填写此字段'));
 const end=fields[4];if(end.value&&fields[3].value&&end.value<fields[3].value)end.setCustomValidity('有效期不得早于报价日期');
 const invalid=q('input:invalid,textarea:invalid');
 if(invalid){selectTab('lines');q('.wb-find input').value='';filter();if(invalid.readOnly){fields.forEach(i=>i.readOnly=false);q('#dq-edit').textContent='完成编辑';}invalid.setAttribute('aria-invalid','true');invalid.focus();invalid.reportValidity();feedback('请修正标记字段。数量须为 0–999 的整数，折扣为 0–100%，有效期不得早于报价日期。');return false;}
 return true;
}
function save(nextStatus=status){
 if(!validate())return;
 const state={schema:1,rows:items.map(({id,qty,discountTenths})=>({id,qty,discountTenths})),fields:fields.map(i=>i.value),note:q('textarea').value,density:root.dataset.density,status:nextStatus};
 try{localStorage.setItem(key,JSON.stringify(state));dirty=false;status=nextStatus;renderStatus();q('#dq-save-state').textContent='已保存到本机';feedback(nextStatus==='review'?'已模拟提交审批并保存到本机；未发送任何真实审批。':'演示草稿已保存到当前浏览器。');}
 catch{feedback('浏览器拒绝保存，修改仍在当前页面。请保持页面打开后重试。');}
}
root.addEventListener('input',e=>{
 const input=e.target;
 if(input.matches('.wb-find input')){filter();return;}
 if(!input.matches('input,textarea'))return;
 input.setCustomValidity('');input.removeAttribute('aria-invalid');change();
 if(input.dataset.field){
  if(!input.validity.valid||input.value===''){input.setAttribute('aria-invalid','true');feedback('当前输入无效：汇总保留最近有效值，修正后才可保存或模拟审批。');return;}
  items[Number(input.dataset.id)][input.dataset.field]=input.dataset.field==='qty'?Number(input.value):Math.round(Number(input.value)*10);renderTotals();
 }
 feedback(q('input:invalid')?'仍有无效输入，汇总保留对应字段最近有效值。':'');
});
root.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.density){root.dataset.density=b.dataset.density;density();dirty=true;q('#dq-save-state').textContent='视图设置未保存';return;}
 if(b.dataset.tab){selectTab(b.dataset.tab);return;}
 switch(b.dataset.action){
  case 'placeholder':feedback('此示例聚焦销售报价单，其他业务入口仅展示导航结构。');break;
  case 'edit':{const edit=fields[0].readOnly;if(!edit&&!validate())return;fields.forEach(i=>i.readOnly=!edit);b.textContent=edit?'完成编辑':'编辑信息';if(edit)fields[0].focus();break;}
  case 'save':save();break;
  case 'submit':save('review');break;
 }
});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
initShell(root);renderTotals();renderStatus();density();
