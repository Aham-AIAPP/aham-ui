import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const tokens=JSON.parse(readFileSync(new URL('design-system/tokens.json',root),'utf8'));
export function resolve(path,seen=[]){
  if(seen.includes(path)) throw new Error(`Cyclic token: ${path}`);
  let value=path.split('.').reduce((o,k)=>o?.[k],tokens)?.$value;
  if(value===undefined) throw new Error(`Missing token: ${path}`);
  return String(value).replace(/\{([^}]+)\}/g,(_,p)=>resolve(p,[...seen,path]));
}
const map={bg:'color.surface.tier1-white',panel:'color.surface.tier2-panel',line:'color.surface.tier3-line',selected:'color.surface.tier3-line',ink:'color.ink.primary',muted:'color.ink.secondary',blue:'color.accent.default',action:'workbench.actionBackground','action-hover':'workbench.actionHover',on:'color.ink.on-accent',danger:'color.semantic.danger',font:'typography.fontFamily.sans',mono:'typography.fontFamily.mono',row:'workbench.rowCompact','row-detail':'workbench.rowDetail',rail:'workbench.railWidth',nav:'workbench.navWidth',context:'workbench.contextWidth','table-min':'workbench.tableMinWidth',label:'workbench.labelWidth',dot:'workbench.statusDot',field:'workbench.fieldHeight',body:'workbench.bodySize',breadcrumb:'workbench.breadcrumbHeight',radius:'radius.md','radius-sm':'radius.xs',title:'typography.fontSize.xl',touch:'density.comfortable.rowHeight'};
for(const k of Object.keys(tokens.spacing).filter(k=>!k.startsWith('$')))map[`s${k}`]=`spacing.${k}`;
const dark={bg:'surface.tier1-bg',panel:'surface.tier2-panel',line:'surface.tier3-line',selected:'surface.tier3-line',ink:'ink.primary',muted:'ink.secondary',blue:'accent.hover',danger:'semantic.danger'};
const declarations=(m,prefix='')=>Object.entries(m).map(([k,v])=>`  --wb-${k}: ${resolve(prefix+v)};`).join('\n');
let css=`/* Generated from tokens.json by scripts/build-workbench.mjs. Do not edit. */\n.aham-workbench {\n${declarations(map)}\n}\n.aham-workbench[data-theme="dark"] {\n  color-scheme: dark;\n${declarations(dark,'color.dark.')}\n}\n@media (prefers-color-scheme: dark) {\n.aham-workbench:not([data-theme="light"]) {\n  color-scheme: dark;\n${declarations(dark,'color.dark.')}\n}\n}\n`;
css+=readFileSync(new URL('design-system/workbench-layout.css.in',root),'utf8').replace(/\{\{([^}]+)\}\}/g,(_,p)=>resolve(p));
const target=new URL('design-system/workbench-tokens.css',root);
if(process.argv.includes('--check')){
 if(readFileSync(target,'utf8')!==css)throw new Error('Token CSS drift. Run node scripts/build-workbench.mjs');
}else writeFileSync(target,css);
console.log(`Workbench tokens OK: ${fileURLToPath(target)}`);
