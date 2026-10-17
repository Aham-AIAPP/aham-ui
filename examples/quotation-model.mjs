// Demonstration data only. Integer cents; discount is stored in tenths of a percent.
const data=[
 ['MES 平台基础许可','SW-001 · 1 套生产环境',1,'套',180000,'software'],
 ['生产计划与报工','SW-012 · 标准功能模块',1,'套',98000,'software'],
 ['质量检验管理','SW-021 · 来料 / 过程 / 成品',1,'套',68000,'software'],
 ['批次追溯管理','SW-028 · 全流程批次追踪',1,'套',72000,'software'],
 ['设备连接许可','SW-035 · OPC UA / MQTT',20,'台',3500,'software'],
 ['工位终端许可','SW-042 · Web 终端',12,'个',1800,'software'],
 ['ERP 接口开发','IF-001 · 订单与完工数据',2,'项',16000,'software'],
 ['项目实施服务','SV-001 · 调研 / 配置 / 测试',60,'人天',2200,'service'],
 ['基础数据迁移','SV-008 · 清洗与初始化',12,'人天',2200,'service'],
 ['用户培训','SV-012 · 管理员与关键用户',6,'人天',1800,'service'],
 ['上线驻场支持','SV-016 · 试运行支持',10,'人天',2200,'service'],
 ['年度维护服务','SV-021 · 首年运维支持',1,'年',48000,'service']];
export const defaults=()=>data.map(([name,code,qty,unit,price,type],id)=>({id,name,code,qty,unit,priceCents:price*100,type,discountTenths:1000}));
export function validRow(x){return Number.isInteger(x.qty)&&x.qty>=0&&x.qty<=999&&Number.isInteger(x.discountTenths)&&x.discountTenths>=0&&x.discountTenths<=1000&&Number.isSafeInteger(x.priceCents)&&x.priceCents>=0&&x.priceCents<=1e9;}
export function lineCents(x){if(!validRow(x))throw new RangeError('Invalid quotation row');return Math.round(x.qty*x.priceCents*x.discountTenths/1000);}
export function totals(rows){
 let total=0,original=0,software=0,service=0;
 for(const row of rows){const a=lineCents(row);total+=a;original+=row.qty*row.priceCents;if(row.type==='software')software+=a;else service+=a;}
 const first=Math.round(total*40/100);
 return {total,original,software,service,discount:original-total,payments:[first,first,total-2*first]};
}
export const money=cents=>(cents/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
// Amount in Chinese capital numerals, as printed on quotations and invoices: 942800.00 → 玖拾肆万贰仟捌佰元整.
export function chineseAmount(cents){
 if(!Number.isSafeInteger(cents)||cents<0)throw new RangeError('Invalid amount');
 const D='零壹贰叁肆伍陆柒捌玖',U=['','拾','佰','仟'],S=['','万','亿','万亿'];
 let yuan=Math.floor(cents/100);const jiao=Math.floor(cents/10)%10,fen=cents%10;
 let out='';
 if(yuan>0){
  const groups=[];while(yuan>0){groups.push(yuan%10000);yuan=Math.floor(yuan/10000);}
  let gap=false;
  for(let i=groups.length-1;i>=0;i--){
   const g=groups[i];
   if(g===0){gap=out!=='';continue;}
   if(out!==''&&(gap||g<1000))out+='零';
   gap=false;
   let part='',zero=false;
   for(let k=3;k>=0;k--){const d=Math.floor(g/10**k)%10;if(d===0){zero=part!=='';continue;}if(zero){part+='零';zero=false;}part+=D[d]+U[k];}
   out+=part+S[i];
  }
  out+='元';
 }
 if(!jiao&&!fen)return (out||'零元')+'整';
 if(jiao)out+=D[jiao]+'角';else if(out)out+='零';
 return fen?out+D[fen]+'分':out+'整';
}
