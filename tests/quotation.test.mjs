import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaults,totals,lineCents,chineseAmount,money} from '../examples/quotation-model.mjs';

test('fixture totals and payment reconciliation',()=>{const t=totals(defaults());assert.equal(t.total,78080000);assert.equal(t.software,54160000);assert.equal(t.service,23920000);assert.equal(t.payments.reduce((a,b)=>a+b),t.total);});
test('round each discounted line to cents; last payment absorbs remainder',()=>{const row={...defaults()[0],qty:1,priceCents:101,discountTenths:500};assert.equal(lineCents(row),51);const t=totals([row]);assert.deepEqual(t.payments,[20,20,11]);});
test('zero and maximum quantity / fractional discount boundaries',()=>{const row=defaults()[0];assert.equal(lineCents({...row,qty:0}),0);assert.equal(lineCents({...row,discountTenths:0}),0);assert.equal(lineCents({...row,qty:999,discountTenths:1}),17982000);for(const qty of [-1,1000,1.5,NaN])assert.throws(()=>lineCents({...row,qty}));for(const discountTenths of [-1,1001,1.5,Infinity])assert.throws(()=>lineCents({...row,discountTenths}));});
test('money keeps two decimals and thousands separators',()=>{assert.equal(money(78080000),'780,800.00');assert.equal(money(5),'0.05');});

test('chineseAmount: capital numerals as printed on quotations',()=>{
  const cases=[
    [78080000,'柒拾捌万零捌佰元整'],
    [94280000,'玖拾肆万贰仟捌佰元整'],
    [1000100,'壹万零壹元整'],
    [100001000000,'壹拾亿零壹万元整'],
    [100100000100,'壹拾亿零壹佰万零壹元整'],
    [101000,'壹仟零壹拾元整'],
    [105,'壹元零伍分'],
    [1001,'壹拾元零壹分'],
    [150,'壹元伍角整'],
    [155,'壹元伍角伍分'],
    [5,'伍分'],
    [50,'伍角整'],
    [0,'零元整'],
  ];
  for(const [cents,want] of cases) assert.equal(chineseAmount(cents),want,String(cents));
  for(const bad of [-1,1.5,NaN,Infinity]) assert.throws(()=>chineseAmount(bad));
});
