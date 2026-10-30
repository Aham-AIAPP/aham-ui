// Run on CI (Chromium + WebKit). The same DOM scenarios can be run manually at qa/browser.html.
import { chromium, webkit } from '@playwright/test';
import {spawn,execFileSync} from 'node:child_process';
import {mkdir,writeFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const port=8769,base=`http://127.0.0.1:${port}`,out='qa-results';
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:String(port)},stdio:'pipe'});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error(`server ${code}`)));});
await mkdir(out,{recursive:true});
const report=[];let layoutChecks=0,exampleLoads=0;
const cases=['list','worklist','document','record','print','settings','controls','form'];
try{
 for(const [engine,type]of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch();
  try{
   const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'zh-CN'});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`${base}/qa/browser.html`);await page.getByRole('button',{name:'运行回归测试',exact:true}).click();
   await page.locator('#summary[data-status=done]').waitFor({timeout:120000});
   const regression=JSON.parse(await page.locator('#json').textContent());report.push({engine,regression});
   await page.screenshot({path:`${out}/${engine}-regression.png`,fullPage:true});
   assert.equal(regression.failed,0,JSON.stringify(regression.results.filter(r=>!r.pass)));
   assert.deepEqual(errors,[],'runtime errors');
   // Actual pointer/focus pseudo-classes, beyond the equal-specificity matrix in the browser harness.
   await page.goto(`${base}/qa/lab.html`);
   await page.locator('#contracts article').last().waitFor();
   assert.equal(await page.locator('#contracts article').count(),55,'all component contracts load');
   assert.deepEqual(errors,[],'lab runtime errors');
   for(const theme of ['light','dark']){
    await page.locator('.aham-workbench').evaluate((el,t)=>el.dataset.theme=t,theme);
    const b=page.locator('#save'),rect=await b.boundingBox();
    await b.hover();await page.waitForTimeout(160);
    const style=await b.evaluate(el=>({bg:getComputedStyle(el).backgroundColor,fg:getComputedStyle(el).color,transform:getComputedStyle(el).transform,hover:el.matches(':hover')}));
    assert(style.hover);assert.equal(style.transform,'none');assert.notEqual(style.bg,style.fg);
    await page.mouse.down();const pressed=await b.boundingBox();assert.deepEqual(pressed,rect,'press cannot shift or scale button');await page.mouse.up();
    await page.waitForTimeout(800);await page.screenshot({path:`${out}/${engine}-${theme}-lab.png`,fullPage:true});
   }
   // Reduced motion: no geometric animation, opacity <=100ms, focus stays in modal.
   await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#create').click();
   const motion=await page.locator('dialog').evaluate(el=>({transform:getComputedStyle(el).transform,duration:getComputedStyle(el).transitionDuration,focus:el.contains(document.activeElement)}));
   assert.equal(motion.transform,'none');assert(motion.duration.split(',').every(v=>parseFloat(v)<=.1));assert(motion.focus);
   await page.keyboard.press('Escape');await page.locator('dialog').waitFor({state:'detached'});await page.emulateMedia({reducedMotion:'no-preference'});
   // Every shipped example loads without a JS exception at desktop width.
   for(const file of (await readdir('examples')).filter(f=>f.endsWith('.html'))){
    exampleLoads++;errors.length=0;await page.goto(`${base}/examples/${file}`);await page.waitForTimeout(80);assert.deepEqual(errors,[],`${engine} ${file}`);
   }
   // Page layout matrix, with controlled overflow inside tables allowed.
   for(const width of [390,1024,1280,1440,1920])for(const theme of ['light','dark'])for(const name of cases){
    await page.setViewportSize({width,height:1000});await page.goto(`${base}/examples/${name}.html`);
    await page.locator('.aham-workbench').evaluate((el,t)=>el.dataset.theme=t,theme);await page.evaluate(()=>document.fonts.ready);
    if(name==='print'){
      const contained=await page.locator('.wb-print-bar').evaluate(bar=>{const b=bar.getBoundingClientRect();return [...bar.children].filter(el=>getComputedStyle(el).display!=='none').every(el=>{const r=el.getBoundingClientRect();return r.top>=b.top-1&&r.bottom<=b.bottom+1&&r.right<=b.right+1;});});
      assert(contained,`${engine} print toolbar contains its text at ${width}`);
    }
    layoutChecks++;
    const overflow=await page.evaluate(()=>({actual:document.documentElement.scrollWidth,viewport:innerWidth}));
    if(overflow.actual>overflow.viewport+1){
      const offenders=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.right>innerWidth+1&&!el.closest('[hidden], .wb-table-scroll, .wb-sheet-scroll');}).slice(0,12).map(el=>({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right})));
      report.push({failure:`${engine} ${name} ${theme} ${width}: page overflow`,overflow,offenders});
    }
    await page.waitForTimeout(220);
    if(engine==='chromium')await page.screenshot({path:`${out}/${name}-${theme}-${width}.png`,fullPage:true});
   }
   if(engine==='chromium'){await page.goto(`${base}/examples/print.html`);await page.pdf({path:`${out}/print-A4.pdf`,format:'A4',printBackground:true});if(process.env.CI){const text=execFileSync('pdftotext',['-f','1','-l','1',`${out}/print-A4.pdf`,'-'],{encoding:'utf8'});assert(text.trim().length>100,'print first page cannot be blank');}}
   await context.close();
  }finally{await browser.close();}
 }
}catch(error){report.push({failure:error.stack});process.exitCode=1;console.error(error);}
finally{report.push({layoutChecks,exampleLoads});if(report.some(r=>r.failure))process.exitCode=1;await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));server.kill();}
