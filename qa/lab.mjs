import * as ui from '../aham.js';
const q=s=>document.querySelector(s),root=q('.aham-workbench');
const delay=(value=true)=>new Promise(resolve=>setTimeout(()=>resolve(value),650));
q('#theme').onclick=()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';};
for(const [kind,label]of [['primary','主操作'],['','次要操作'],['ghost','文字操作'],['danger','危险操作']]){
 const col=document.createElement('div');col.innerHTML=`<h2>${label}</h2><button class="wb-btn ${kind}">保存更改</button><button class="wb-btn ${kind}" disabled>暂不可用</button><button class="wb-btn ${kind}" disabled aria-busy="true">保存中…</button><button class="wb-btn ${kind}" aria-expanded="true">菜单打开中</button>`;q('#buttons').append(col);
}
let attempts=0,pending=false;
q('#notes').oninput=()=>{q('#save-state').textContent='尚未保存';q('#save-error').textContent='';};
q('#restore').onclick=()=>{attempts=0;q('#notes').value='梳理采购与仓储现状，保留访谈证据和待核对事项。';q('#notes').oninput();};
q('#save').onclick=async()=>{
 if(pending)return;pending=true;const b=q('#save');b.style.minWidth=`${b.getBoundingClientRect().width}px`;b.disabled=true;b.setAttribute('aria-busy','true');b.textContent='保存中…';q('#notes').readOnly=true;q('#restore').disabled=true;q('#save-error').textContent='';
 const ok=await delay(++attempts>1);q('#save-state').textContent=ok?'已保存':'尚未保存';if(!ok)q('#save-error').textContent='模拟连接失败，内容已保留，可以重试。';
 b.disabled=false;b.removeAttribute('aria-busy');b.textContent='保存更改';q('#notes').readOnly=false;q('#restore').disabled=false;pending=false;
};
q('#create').onclick=()=>{let count=0;ui.openCreateDialog({root,title:'新建调研记录',nameLabel:'记录名称',fields:[{key:'stage',label:'阶段',options:['待调研','访谈中','待核对','已确认','已归档'],value:'待调研'}],onSubmit:async()=>{if(++count===1){await delay();throw new Error('模拟连接失败，填写内容已保留。');}await delay();ui.toast('记录已创建');return true;}});};
q('#confirm').onclick=()=>{let count=0;ui.openConfirm({root,title:'归档测试记录',text:'记录归档后可从归档列表恢复。',confirm:'归档',onConfirm:async()=>{await delay();return ++count>1;}});};
let stage='待调研';q('#picker').onclick=()=>{let count=0;ui.openPicker(q('#picker'),{label:'阶段',current:stage,options:['待调研','访谈中','待核对','已确认','已归档'],onSelect:async v=>{await delay();if(++count===1)return false;stage=v;q('#picker').textContent=`阶段：${v}`;}});};
let ai;q('#ai').onclick=()=>{ai?.destroy();let count=0;ai=ui.createAIOutput(q('#ai-host'),{title:'访谈摘要',sources:[{label:'虚构访谈记录'}],needsConsent:()=>false,generate:async function*(){for(const s of ['采购与仓储的当前流程已梳理。','\n\n三个待核对事项仍需补充证据。']){await delay();yield s;}},onAdopt:async()=>{await delay();return ++count>1;}});};
q('#undo').onclick=()=>{let count=0;ui.toast('测试阶段已更新',{action:{label:'撤销',run:async()=>{await delay();return ++count>1;}}});};
let contracts=[];
function render(){const term=q('#search').value.trim().toLowerCase();q('#contracts').innerHTML=contracts.filter(c=>JSON.stringify(c).toLowerCase().includes(term)).map(c=>`<article><a class="wb-link" href="../${ui.escapeHtml(c.preview||c.reference)}">${ui.escapeHtml(c.name)}</a><p>${ui.escapeHtml(c.intent)}</p><small>${ui.escapeHtml((c.states||[]).join(' · '))}</small></article>`).join('');}
async function read(url){const response=await fetch(url);if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.json();}
async function loadCatalog(){
 q('#catalog-retry').hidden=true;q('#contract-count').textContent='正在加载组件契约…';
 try{
  const index=await read('../components/index.json'),entries=index.components;
  const loaded=[];
  // Bound requests so a local static server or slow connection is not overwhelmed.
  for(let i=0;i<entries.length;i+=4)loaded.push(...await Promise.all(entries.slice(i,i+4).map(entry=>read(`../components/${entry.slug}.json`))));
  contracts=loaded;q('#contract-count').textContent=`${contracts.length} 项 · 结构、状态、键盘与无障碍`;render();
 }catch{q('#contract-count').textContent='组件目录暂未加载，可重试。';q('#catalog-retry').hidden=false;}
}
q('#search').oninput=render;q('#catalog-retry').onclick=loadCatalog;loadCatalog();
