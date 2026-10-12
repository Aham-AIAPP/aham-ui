// Synthetic example only. The application supplies persistence and authorization.
const root=document.querySelector('.demo-page'), form=document.querySelector('#form');
const fields=[...form.querySelectorAll('input,select')], q=id=>document.getElementById(id);
let editing=false, baseline={};
const values=()=>Object.fromEntries(fields.map(f=>[f.name,f.value]));
const dirty=()=>editing && JSON.stringify(values())!==JSON.stringify(baseline);
function render(){
 form.classList.toggle("is-reading",!editing);
 fields.forEach(f=>f.hidden=!editing);
 form.querySelectorAll('[data-read]').forEach(p=>p.hidden=editing);
 q('edit').hidden=editing;q('cancel').hidden=!editing;q('save').hidden=!editing;
 q('save').disabled=!dirty();q('status').textContent=editing?(dirty()?'编辑中 · 未保存':'编辑中 · 未修改'):'阅读';
}
q('edit').onclick=()=>{baseline=values();editing=true;render();fields[0].focus();};
form.oninput=render;form.onchange=render;
function cancel(){fields.forEach(f=>f.value=baseline[f.name]);editing=false;clearErrors();render();q('edit').focus();}
function clearErrors(){fields.forEach(f=>{f.removeAttribute('aria-invalid');f.removeAttribute('aria-describedby');if(q(f.id+'-error'))q(f.id+'-error').hidden=true;});}
q('cancel').onclick=()=>dirty()?q('discard').showModal():cancel();
q('keep').onclick=()=>q('discard').close();
q('drop').onclick=()=>{q('discard').close();cancel();};
q('save').onclick=()=>{
 clearErrors();let first;
 fields.forEach(f=>{if(f.required&&!f.value.trim()){f.setAttribute('aria-invalid','true');f.setAttribute('aria-describedby',f.id+'-error');q(f.id+'-error').hidden=false;first??=f;}});
 if(first){first.focus();return;}
 form.querySelectorAll('[data-read]').forEach(p=>p.textContent=values()[p.dataset.read]);editing=false;render();q('status').textContent='已保存到演示页面';q('edit').focus();
};
form.onsubmit=e=>e.preventDefault();
root.onkeydown=e=>{if(editing&&(e.metaKey||e.ctrlKey)&&e.key==='Enter'&&!e.isComposing){e.preventDefault();q('save').click();}};
window.addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue='';}});
q('theme').onclick=()=>{const dark=root.dataset.theme!=='dark';root.dataset.theme=dark?'dark':'light';document.documentElement.dataset.theme=root.dataset.theme;q('theme').textContent=dark?'浅色外观':'深色外观';};
