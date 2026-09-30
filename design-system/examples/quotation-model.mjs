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
export function restoreDraft(raw){
 const s=JSON.parse(raw);
 if(s?.schema!==1||!['compact','standard'].includes(s.density)||!['draft','review'].includes(s.status)||!Array.isArray(s.rows)||s.rows.length!==12||!Array.isArray(s.fields)||s.fields.length!==12||s.fields.some(v=>typeof v!=='string'||v.length>200||!v.trim())||typeof s.note!=='string'||s.note.length>2000)throw new Error('Unsupported draft');
 const rows=defaults();
 s.rows.forEach((r,i)=>{if(r?.id!==i)throw new Error('Invalid row identity');rows[i].qty=r.qty;rows[i].discountTenths=r.discountTenths;if(!validRow(rows[i]))throw new Error('Invalid draft row');});
 const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
 if(!validDate(s.fields[3])||!validDate(s.fields[4])||s.fields[4]<s.fields[3])throw new Error('Invalid date range');
 return {...s,rows};
}
export const money=cents=>(cents/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
