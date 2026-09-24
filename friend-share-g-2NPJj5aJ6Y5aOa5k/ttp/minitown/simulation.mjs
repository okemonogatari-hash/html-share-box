export const SIZE=10, CELL=4;
export const key=(x,z)=>`${x},${z}`;
export const TYPES={home:{name:'住宅',color:0xa4b86a},shop:{name:'お店',color:0xdfb169},work:{name:'仕事場',color:0x87afb7},park:{name:'公園',color:0x7fac82}};
export function newTown(){return {version:1,time:7*60,blocks:[],nextId:1};}
export function dragPlots(start,end){
 const out=[start];let [x,z]=start;const dx=end[0]-x,dz=end[1]-z;
 while(out.length<3&&(x!==end[0]||z!==end[1])){
  if(Math.abs(end[0]-x)>=Math.abs(end[1]-z)&&x!==end[0])x+=Math.sign(dx);else z+=Math.sign(dz);
  out.push([x,z]);
 }return out;
}
export function validatePlots(town,plots){
 if(!plots.length||plots.length>3)return false;
 const seen=new Set();const occupied=new Set(town.blocks.flatMap(b=>b.plots.map(p=>key(...p))));
 for(const [x,z] of plots){if(!Number.isInteger(x)||!Number.isInteger(z)||x<0||z<0||x>=SIZE||z>=SIZE||seen.has(key(x,z))||occupied.has(key(x,z)))return false;seen.add(key(x,z));}
 const reached=new Set([key(...plots[0])]);let changed=true;while(changed){changed=false;for(const [x,z]of plots)if(!reached.has(key(x,z))&&[[x-1,z],[x+1,z],[x,z-1],[x,z+1]].some(p=>reached.has(key(...p)))){reached.add(key(x,z));changed=true;}}
 return reached.size===plots.length;
}
export function placeBlock(town,type,plots){if(!TYPES[type]||!validatePlots(town,plots))return null;const block={id:town.nextId++,type,plots:plots.map(p=>[...p]),born:town.time,seed:town.nextId*7919};town.blocks.push(block);return block;}
export function boundaryEdges(plots){
 const cells=new Set(plots.map(p=>key(...p)));const edges=[];
 for(const [x,z] of plots){
  if(!cells.has(key(x,z-1)))edges.push([[x,z],[x+1,z]]);
  if(!cells.has(key(x+1,z)))edges.push([[x+1,z],[x+1,z+1]]);
  if(!cells.has(key(x,z+1)))edges.push([[x+1,z+1],[x,z+1]]);
  if(!cells.has(key(x-1,z)))edges.push([[x,z+1],[x,z]]);
 }return edges;
}
export const edgeKey=([a,b])=>[key(...a),key(...b)].sort().join('|');
export function roadNetwork(town){
 const edges=new Map(),graph=new Map();
 function add([a,b]){const k=edgeKey([a,b]);if(edges.has(k))return;edges.set(k,[a,b]);const ka=key(...a),kb=key(...b);if(!graph.has(ka))graph.set(ka,[]);if(!graph.has(kb))graph.set(kb,[]);graph.get(ka).push(kb);graph.get(kb).push(ka);}
 for(const b of town.blocks)for(const e of boundaryEdges(b.plots))add(e);
 const occupied=new Set(town.blocks.flatMap(b=>b.plots.map(p=>key(...p))));
 function allowed(a,b){if(edges.has(edgeKey([a,b])))return true;const [x,z]=[Math.min(a[0],b[0]),Math.min(a[1],b[1])];const beside=a[0]===b[0]?[[x-1,z],[x,z]]:[[x,z-1],[x,z]];return !beside.every(p=>occupied.has(key(...p)));}
 // Join perimeter components by the shortest free grid route, never through shared lawns.
 while(graph.size){
  const connected=new Set(),stack=[graph.keys().next().value];
  while(stack.length){const k=stack.pop();if(connected.has(k))continue;connected.add(k);stack.push(...graph.get(k).filter(n=>!connected.has(n)));}
  if(connected.size===graph.size)break;
  const q=[...connected],prev=new Map(q.map(k=>[k,null]));let end=null;
  for(let i=0;i<q.length&&!end;i++){const k=q[i],[x,z]=k.split(',').map(Number);
   for(const p of [[x,z-1],[x+1,z],[x,z+1],[x-1,z]]){const nk=key(...p);if(p.some(v=>v<0||v>SIZE)||prev.has(nk)||!allowed([x,z],p))continue;prev.set(nk,k);q.push(nk);if(graph.has(nk)&&!connected.has(nk)){end=nk;break;}}
  }
  if(!end)break;
  for(let k=end;prev.get(k)!==null;k=prev.get(k))add([k.split(',').map(Number),prev.get(k).split(',').map(Number)]);
 }
 return {edges:[...edges.values()],graph};
}
export function jobCapacity(block,time){return block.type==='work'&&stage(block,time)>=3?(block.style==='reference'&&stage(block,time)>=4?10:8):0;}
export function jobAssignments(blocks,time,agents){
 const slots=blocks.flatMap(b=>b.plots.flatMap((p,plot)=>Array.from({length:jobCapacity(b,time)},()=>({job:b.id,jobPlot:plot}))));
 return agents.map((a,i)=>(slots[i]||{job:null,jobPlot:null}));
}
export function shortestPath(graph,start,end){if(!graph.has(start)||!graph.has(end))return null;const q=[start],prev=new Map([[start,null]]);for(let i=0;i<q.length;i++){const k=q[i];if(k===end){const route=[];for(let v=end;v!==null;v=prev.get(v))route.unshift(v.split(',').map(Number));return route;}for(const next of graph.get(k))if(!prev.has(next)){prev.set(next,k);q.push(next);}}return null;}
export function stage(block,time){const age=time-block.born;return age<25?0:age<65?1:age<105?2:age<(block.style==='reference'?2120:1400)?3:4;}
export function parseSave(text){const t=JSON.parse(text);if(t.version!==1||!Number.isFinite(t.time)||t.time<0||!Array.isArray(t.blocks)||t.blocks.length>100)throw Error('保存データを読み込めません');const result=newTown();result.time=t.time;for(const b of t.blocks){if(!TYPES[b.type]||!Array.isArray(b.plots)||!b.plots.every(p=>Array.isArray(p)&&p.length===2)||!Number.isFinite(b.born)||b.born>t.time||!validatePlots(result,b.plots))throw Error('保存データを読み込めません');const added=placeBlock(result,b.type,b.plots);added.born=b.born;added.seed=Number.isFinite(b.seed)?b.seed:added.seed;if(b.style==='reference')added.style='reference';}return result;}
export function seeded(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}

// Adjacent plots share continuous soil; only the perimeter keeps a road setback.
export function plotFootprint(plots,[x,z]){
 const has=(a,b)=>plots.some(p=>p[0]===a&&p[1]===b),edge=.46;
 const left=has(x-1,z)?edge:0,right=has(x+1,z)?edge:0,back=has(x,z-1)?edge:0,front=has(x,z+1)?edge:0;
 return {x:(right-left)/2,z:(front-back)/2,width:CELL-2*edge+left+right,depth:CELL-2*edge+back+front};
}

// Count residents and visitors separately; people travelling have not arrived yet.
export function inspectionStats(block,plot,agents,time){
 const ready=stage(block,time)>=3,age=Math.max(0,time-block.born);
 const residents=agents.filter(a=>a.home===block.id&&a.homePlot===plot);
 const present=agents.filter(a=>a.current===block.id&&a.currentPlot===plot&&!a.route);
 const visitors=present.filter(a=>a.home!==block.id||a.homePlot!==plot);
 return {ready,residents,present,visitors,capacity:block.type==='home'?(block.style==='reference'?(stage(block,time)>=4?6:4):3):0,
 construction:Math.min(100,Math.floor(age/105*100)),
 growth:block.style==='reference'?Math.min(100,Math.max(0,Math.floor((age-800)/1320*100))):Math.min(100,Math.max(0,Math.floor((age-105)/(1400-105)*100)))};
}

// Tier 2 -> 3 duration approximates the 22 in-game hours observed on 2026-09-23.
// This does not claim to reproduce the original game's full neighborhood-growth rules.
export function residentAdditions(block,time,agents){
 if(block.type!=='home'||stage(block,time)<3)return [];
 const capacity=inspectionStats(block,0,[],time).capacity,result=[];
 for(let plot=0;plot<block.plots.length;plot++){
  const occupied=new Set(agents.filter(a=>a.home===block.id&&a.homePlot===plot).map(a=>a.slot));
  for(let slot=0;slot<capacity;slot++)if(!occupied.has(slot))result.push({id:block.id*32+plot*8+slot,homePlot:plot,slot});
 }
 return result;
}
