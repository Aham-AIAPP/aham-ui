import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const base=new URL('../design-system/',import.meta.url),read=f=>readFileSync(new URL(f,base),'utf8');
test('consumption source and all indexed contracts resolve',()=>{const c=JSON.parse(read('library-consumption.json'));assert.equal(c.readingOrder[0].file,'tokens.json');assert.equal(c.componentResolution.previewFirst,false);for(const {slug} of JSON.parse(read('components/index.json')).components){assert.equal(JSON.parse(read(`components/${slug}.json`)).slug,slug);}for(const {file} of c.readingOrder)assert.ok(existsSync(new URL(file,base)),file);});
test('compact density contract and button scoping do not regress',()=>{assert.equal(JSON.parse(read('tokens.json')).density.compact.rowHeight.$value,'32px');assert.ok(read('components/table.json').includes('compact 32px'));const css=read('components.css');assert.equal((css.match(/^\.btn \{/gm)||[]).length,1);assert.ok(!/^\s*(body|\*|\.specimen)\s*\{/m.test(css),'preview scaffold leaked into runtime');});
test('workbench has no external runtime or host dependency',()=>{const html=read('examples/crm-quotation.html'),script=read('examples/crm-quotation.mjs');assert.ok(!/https?:|window\.openai|Tweak/.test(html+script));assert.ok(html.includes('aria-label="报价明细表格，可横向滚动"'));});
