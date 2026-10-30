import * as ui from '../aham.js';
const root = document.querySelector('.aham-workbench'), fixture = document.querySelector('#fixture');
const results = [], tests = [], cleanups = [];
const test = (name, fn) => tests.push([name, fn]);
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const equal = (a,b,message) => assert(a === b, `${message}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);
const wait = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return {promise,resolve,reject}; };
const submit = form => form.dispatchEvent(new Event('submit', {bubbles:true,cancelable:true}));
const input = (el, value) => { el.value=value; el.dispatchEvent(new Event('input',{bubbles:true})); };
const q = s => root.querySelector(s);
const own = handle => { cleanups.push(() => (handle.destroy || handle.close || handle.remove)?.()); return handle; };
const button = () => { fixture.innerHTML='<button class="wb-btn" aria-haspopup="dialog">修改阶段</button>'; return fixture.firstElementChild; };
for (const result of [false, 'reject']) test(`新建：${result} 保留输入、阻止重复、重试成功`, async () => {
  let count=0; const d=deferred();
  own(ui.openCreateDialog({root,title:'新建测试记录',onSubmit:()=>++count===1?d.promise:true}));
  const form=q('.wb-create form'), name=form.elements.title;
  input(name,'现场访谈'); submit(form); submit(form); await wait();
  equal(count,1,'重复提交被拦截'); assert(name.disabled,'保存期间字段锁定');
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert(q('.wb-create'),'保存期间 Esc 不关闭');
  result==='reject'?d.reject(new Error('模拟离线')):d.resolve(false); await wait();
  equal(name.value,'现场访谈','输入保留'); assert(q('#wb-create-error').textContent,'失败可见'); assert(!name.disabled,'恢复可编辑');
  submit(form); await wait(250); equal(count,2,'可重试'); assert(!q('.wb-create'),'成功关闭');
});
test('新建：只改属性也触发未保存保护', async () => {
  own(ui.openCreateDialog({root,title:'新建',fields:[{key:'stage',label:'阶段',options:['甲','乙'],value:'甲'}],onSubmit:()=>true}));
  q('[data-create-prop]').click(); q('[data-index="1"]').click(); await wait();
  q('[data-create=cancel]').click(); assert(!q('.wb-create-confirm').hidden,'属性变更触发确认');
});
test('新建：继续新建清空已保存正文并恢复主操作', async () => {
  own(ui.openCreateDialog({root,title:'新建',onSubmit:()=>true})); const f=q('.wb-create form');
  input(f.elements.title,'第一条'); f.elements.more.checked=true; submit(f); await wait();
  equal(f.elements.title.value,'','清空已保存正文'); assert(!q('[type=submit]').disabled,'可以继续创建');
});
test('评论：连点、输入期间、迟到结果与 IME', async () => {
  fixture.innerHTML='<form><textarea aria-label="评论"></textarea><button class="wb-btn primary" type="submit">发送</button></form>';
  let count=0; const d=deferred(), form=q('#fixture form'), area=form.querySelector('textarea');
  const h=own(ui.initComposer(form,{onSubmit:()=>{count++;return d.promise;}}));
  input(area,'第一条'); area.dispatchEvent(new CompositionEvent('compositionstart')); await h.submit(); equal(count,0,'IME 不发送');
  area.dispatchEvent(new CompositionEvent('compositionend')); h.submit(); h.submit(); input(area,'下一条');
  assert(form.querySelector('button').disabled,'编辑不能重新启用待处理发送'); equal(count,1,'只发送一次');
  d.resolve(true); await wait(); equal(area.value,'下一条','不清空新输入'); assert(!form.querySelector('button').disabled,'下一条可发送');
});
test('评论：异常保留草稿并可重试，销毁后不清空', async () => {
  fixture.innerHTML='<form><textarea aria-label="评论"></textarea><button type="submit">发送</button></form>';
  const f=q('#fixture form'), a=f.querySelector('textarea'), d=deferred(); let count=0;
  const h=own(ui.initComposer(f,{onSubmit:()=>++count===1?Promise.reject(new Error('断网')):d.promise}));
  input(a,'草稿'); await h.submit(); equal(a.value,'草稿','失败保留'); assert(q('[role=alert]').textContent,'错误可见');
  h.submit(); h.destroy(); d.resolve(true); await wait(); equal(a.value,'草稿','卸载后不改输入');
});
for (const kind of ['confirm','form','ai']) test(`${kind}：异步失败不关闭，重复提交一次，重试成功`, async () => {
  let count=0;const d=deferred(), save=()=>++count===1?d.promise:true;
  const h=own(kind==='confirm'?ui.openConfirm({root,title:'删除测试记录',onConfirm:save}):kind==='form'?ui.openFormDialog({root,title:'保存测试',fields:[{key:'name',label:'名称',value:'甲',required:true}],onSubmit:save}):ui.openAIConfirm({root,changes:[{target:'名称',from:'甲',to:'乙'}],onConfirm:save}));
  const f=q('dialog form'); submit(f);submit(f); await wait();equal(count,1,'阻止重复');
  d.reject(new Error('模拟失败'));await wait();assert(q('dialog[open]'),'失败留在原处');assert([...root.querySelectorAll('dialog [role=alert]')].some(el=>el.textContent),'显示错误');
  submit(f);await wait(250);assert(!q('dialog[open]'),'成功关闭');
});
test('AI 确认：没有真实撤销能力就不承诺撤销', () => {
  own(ui.openAIConfirm({root,changes:[{target:'名称',to:'乙'}],onConfirm:()=>true})); assert(!q('.wb-ai-note').textContent.includes('可以撤销'),'默认无撤销承诺');
});
test('表单：false 结果安全处理且关闭有草稿保护', async () => {
  own(ui.openFormDialog({root,title:'表单',fields:[{key:'name',label:'名称',value:'甲'}],onSubmit:()=>false}));
  const f=q('dialog form'); input(f.elements.name,'乙');submit(f);await wait();assert([...root.querySelectorAll('dialog [role=alert]')].some(el=>el.textContent),'false 显示错误');
  q('[data-form=cancel]').click();assert(!q('[data-keep]').parentElement.hidden,'显示草稿保护');q('[data-keep]').click();equal(f.elements.name.value,'乙','继续编辑保留输入');
});
test('属性：保存完成才提交新值，失败可重试', async () => {
  fixture.innerHTML='<div><button class="wb-prop-value" data-prop="stage"></button></div>';
  let count=0;const d=deferred(), h=own(ui.initPropertyPickers({container:fixture,fields:{stage:{label:'阶段',options:['甲','乙','丙','丁','戊']}},value:{stage:'甲'},onChange:()=>++count===1?d.promise:true}));
  q('[data-prop]').click();assert(q('.wb-popover input'),'五项启用搜索');q('[data-index="1"]').click();q('[data-index="1"]').click();
  equal(h.get().stage,'甲','保存前保留原值');equal(count,1,'不能重复选择');d.resolve(false);await wait();equal(h.get().stage,'甲','失败不提交');assert(q('.wb-popover [role=alert]').textContent,'错误可见');
  q('[data-index="1"]').click();await wait();equal(h.get().stage,'乙','成功提交');
});
test('属性：set 的新状态不被旧请求覆盖', async () => {
  fixture.innerHTML='<button data-prop="stage"></button>';const d=deferred();
  const h=own(ui.initPropertyPickers({container:fixture,fields:{stage:{label:'阶段',options:['甲','乙','丙']}},value:{stage:'甲'},onChange:()=>d.promise}));
  q('[data-prop]').click();q('[data-index="1"]').click();h.set({stage:'丙'});d.resolve(true);await wait();equal(h.get().stage,'丙','迟到结果不覆盖新状态');
});
test('选择器：重复打开不会累计监听器，搜索可显式关闭', async () => {
  const b=button();let count=0;
  for(let i=0;i<4;i++){ ui.openPicker(b,{label:'阶段',options:['甲','乙','丙','丁','戊'],search:false,onSelect:()=>count++});ui.closePopover('replace'); }
  ui.openPicker(b,{label:'阶段',options:['甲','乙'],onSelect:()=>count++});q('[data-index="1"]').click();await wait();equal(count,1,'一次选择一次回调');
});
test('浮层：退出 inert，立即重开不会被旧定时器关闭', async () => {
  const b=button(), panel=document.createElement('div');panel.className='wb-popover';panel.innerHTML='<button>操作</button>';fixture.append(panel);
  document.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));const h=ui.openPopover(b,panel);await wait(180);h.close('outside');assert(panel.inert,'退出立即失去交互');
  ui.openPopover(b,panel);await wait(180);assert(!panel.hidden&&!panel.inert,'重开可交互');ui.closePopover('replace');
});
test('浮层：键盘零动画、菜单初始焦点、Tab 离开关闭', () => {
  const b=button(), panel=document.createElement('div');panel.className='wb-popover';fixture.append(panel);
  own(ui.createCommand(panel,{search:false,role:'menu',items:[{id:'a',label:'操作'}],onSelect:()=>{}}));
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));ui.openPopover(b,panel);
  equal(document.activeElement.getAttribute('role'),'menu','菜单获得焦点');equal(getComputedStyle(panel).transitionDuration,'0s','键盘无动画');
  q('#theme').focus();assert(!ui.activePopover(),'焦点移出关闭');
});
test('浮层：底边长菜单仍在可视范围', () => {
  const b=button();b.style.position='fixed';b.style.bottom='4px';
  ui.openPicker(b,{label:'长菜单',options:Array.from({length:30},(_,i)=>`选项 ${i}`),onSelect:()=>{}});
  const r=q('.wb-popover').getBoundingClientRect();assert(r.top>=0&&r.bottom<=innerHeight+1,'菜单不能越过视口');
});
test('AI 采纳：失败保留生成内容和依据，可重试', async () => {
  let count=0;const d=deferred();
  const h=own(ui.createAIOutput(fixture,{title:'摘要',sources:[{label:'访谈'}],needsConsent:()=>false,generate:async function*(){yield '保留这段摘要';},onAdopt:()=>++count===1?d.promise:true}));
  await wait();q('[data-ai=adopt]').click();q('[data-ai=adopt]').click();equal(count,1,'不能重复采纳');d.reject(new Error('写入失败'));await wait();
  assert(h.element.isConnected&&h.text()==='保留这段摘要','结果保留');assert(q('.wb-ai-sources').textContent.includes('访谈'),'依据保留');assert(q('.wb-ai [role=alert]').textContent,'错误可见');
  q('[data-ai=adopt]').click();await wait();assert(!h.element.isConnected,'成功后移除');
});
test('AI：销毁中断生成并移除 DOM', async () => {
  let signal;const d=deferred();const h=own(ui.createAIOutput(fixture,{title:'摘要',needsConsent:()=>false,generate:async function*(o){signal=o.signal;await d.promise;yield '迟到内容';}}));
  h.destroy();assert(signal.aborted&&!h.element.isConnected,'销毁中止');d.resolve();await wait();assert(!q('.wb-ai'),'无迟到内容');
});
test('AI 建议：失败仍可采纳，成功后移除', async () => {
  const b=button();let count=0;
  own(ui.showSuggestion(b,{key:'test',label:'阶段',value:'乙',reason:'测试',onAccept:()=>++count===1?false:true}));
  q('[data-ai=accept]').click();await wait();assert(q('.wb-ai-suggest'),'失败保留');q('[data-ai=accept]').click();await wait();assert(!q('.wb-ai-suggest'),'成功移除');
});
test('Toast 撤销：防重复、失败持续可重试、成功关闭', async () => {
  const d=deferred();let count=0;const dismiss=ui.toast('已更新',{duration:80,action:{label:'撤销',run:()=>++count===1?d.promise:true}});cleanups.push(dismiss);
  q('.wb-toast button').click();q('.wb-toast button').click();await wait(100);assert(q('.wb-toast'),'请求期间不消失');equal(count,1,'撤销只调用一次');
  d.reject(new Error('撤销失败'));await wait(120);assert(q('.wb-toast [type=button]'),'失败可重试');q('.wb-toast button').click();await wait(250);assert(!q('.wb-toast'),'成功移除');
});
test('Toast：hover 与 focus 独立暂停', async () => {
  const dismiss=ui.toast('暂停测试',{duration:100,action:{label:'查看',run:()=>false}});cleanups.push(dismiss);
  const el=q('.wb-toast');el.dispatchEvent(new Event('mouseenter'));el.querySelector('button').focus();el.dispatchEvent(new Event('mouseleave'));await wait(140);assert(el.isConnected,'仍聚焦时不能恢复计时');
  q('#theme').focus();await wait(300);assert(!el.isConnected,'离焦后恢复');
});
test('完成通知：弹窗关闭后仍可看到并使用撤销', async () => {
  own(ui.openConfirm({root,title:'完成测试',onConfirm:()=>{const dismiss=ui.toast('已完成',{duration:0,action:{label:'撤销',run:()=>true}});cleanups.push(dismiss);}}));
  submit(q('dialog form'));await wait(250);assert(!q('dialog'),'弹窗已关闭');assert(q('.wb-toast'),'完成通知仍存在');
  q('.wb-toast button').click();await wait(250);assert(!q('.wb-toast'),'关闭后撤销仍可用');
});
test('短文案：等待中宽度保持稳定且可访问名称说明进度', async () => {
  const d=deferred();own(ui.openCreateDialog({root,title:'新建',onSubmit:()=>d.promise}));const f=q('.wb-create form'),b=f.querySelector('[type=submit]');input(f.elements.title,'甲');
  const width=b.getBoundingClientRect().width;submit(f);await wait();equal(b.getBoundingClientRect().width,width,'创建按钮不变宽');assert(b.getAttribute('aria-label').includes('创建中'),'读屏进度明确');d.resolve(false);await wait();equal(b.textContent,'创建','恢复文案');
});
test('Toast: repeated identical notifications share one live message', () => {
  const a=ui.toast('Repeated',{duration:0}),b=ui.toast('Repeated',{duration:0});cleanups.push(a,b);equal(root.querySelectorAll('.wb-toast').length,1,'deduplicated');
});
test('Picker: successful async save returns focus to its enabled trigger', async () => {
  const b=button();ui.openPicker(b,{label:'Stage',options:['A','B'],current:'A',onSelect:()=>Promise.resolve(true)});q('[data-index="1"]').click();await wait(200);equal(document.activeElement,b,'focus returns after unlocking');
});
// Equal-specificity pseudo-state replicas test the complete style matrix. CI additionally uses real pointer input.
const sheet = document.createElement('style');
async function stateStyles(){
  const css=await (await fetch('../aham.css')).text();
  sheet.textContent=css.replaceAll(':hover','[data-qa-hover]').replaceAll(':active','[data-qa-active]').replaceAll(':focus-visible','[data-qa-focus]');document.head.append(sheet);
}
function rgb(s){return s.match(/[\d.]+/g).slice(0,3).map(Number);}
function ratio(a,b){const lum=s=>rgb(s).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
for(const theme of ['light','dark']) for(const kind of ['default','primary','ghost','danger']) test(`${theme} ${kind}：默认/hover/pressed/focus/open/disabled/busy 配色与尺寸`,async()=>{
  if(!sheet.isConnected)await stateStyles();root.dataset.theme=theme;
  fixture.innerHTML=`<button class="wb-btn ${kind==='default'?'':kind}">保存更改</button>`;const b=fixture.firstChild;
  const width=b.getBoundingClientRect().width,height=b.getBoundingClientRect().height;
  for(const state of ['default','hover','active','focus','open','disabled','busy','disabled-open','busy-open']){
    for(const name of ['data-qa-hover','data-qa-active','data-qa-focus','aria-expanded','aria-busy'])b.removeAttribute(name);b.disabled=false;
    if(['hover','active','focus'].includes(state))b.setAttribute(`data-qa-${state}`,'');
    if(state==='open'){b.setAttribute('aria-expanded','true');b.setAttribute('data-qa-hover','');}
    if(state.startsWith('disabled')||state.startsWith('busy')){b.disabled=true;b.setAttribute('data-qa-hover','');b.setAttribute('data-qa-active','');if(state.includes('open'))b.setAttribute('aria-expanded','true');if(state.startsWith('busy'))b.setAttribute('aria-busy','true');}
    await wait(140);const s=getComputedStyle(b);let bg=s.backgroundColor;if(bg==='rgba(0, 0, 0, 0)')bg=getComputedStyle(root).backgroundColor;
    if(!state.startsWith('disabled'))assert(ratio(s.color,bg)>=4.5,`${state} 对比度不足 ${ratio(s.color,bg)}`);
    assert(s.transform==='none',`${state} 不缩放`);equal(b.getBoundingClientRect().width,width,`${state} 宽度稳定`);equal(b.getBoundingClientRect().height,height,`${state} 高度稳定`);
  }
});
async function run(){
  q('#run').disabled=true;results.length=0;q('#results').innerHTML='';q('#summary').dataset.status='running';sheet.remove();
  for(const [name,fn] of tests){
    try{await fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}
    ui.closePopover('replace');cleanups.splice(0).reverse().forEach(fn=>fn());await wait(220);fixture.innerHTML='';
    const r=results.at(-1),li=document.createElement('li');li.textContent=`${r.pass?'通过':'失败'} · ${name}${r.error?'：'+r.error:''}`;li.dataset.result=r.pass?'pass':'fail';q('#results').append(li);q('#summary').textContent=`运行 ${results.length}/${tests.length}`;
  }
  sheet.remove();root.dataset.theme='light';q('#run').disabled=false;
  const failed=results.filter(r=>!r.pass).length;q('#summary').textContent=`${results.length-failed}/${results.length} 通过，${failed} 失败`;q('#summary').dataset.status='done';q('#json').textContent=JSON.stringify({total:results.length,failed,results},null,2);
}
q('#run').addEventListener('click',run);q('#theme').addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';});
