export const RADIUS=48;
export const ROOF=7.35;
export const STAIR={x:4.05,front:5.5,back:-1.8,width:1.75,landing:2.8,upperBack:-6.4};
export const NEIGHBORS=[
 {id:'mio',name:'リスのクルミ',species:'squirrel',emoji:'🐿️',place:'花屋の前',x:-6.5,z:5.3,h:0,color:'#b88886',line:'どんぐり探しの途中だったの。ひと息つこうっと。'},
 {id:'noah',name:'うさぎのミミ',species:'rabbit',emoji:'🐇',place:'緑のお店の前',x:7.2,z:6,h:0,color:'#b9a063',line:'お花の水やり、終わったところ。いい香り！'},
 {id:'lily',name:'きつねのコハク',species:'fox',emoji:'🦊',place:'本屋の小道',x:-14,z:10,h:0,color:'#939bbd',line:'この本、あと一ページ。一緒に読んでいく？'},
 {id:'ren',name:'くまのポン',species:'bear',emoji:'🐻',place:'パン屋の庭',x:14,z:12,h:0,color:'#90a27e',line:'焼きたてのパンもあるよ。半分こしよう。'},
 {id:'pip',name:'カワウソのスイ',species:'otter',emoji:'🦦',place:'池のほとり',x:0,z:17,h:0,color:'#cc9768',line:'水切り三回できた！ おけもんもやってみる？'},
 {id:'eve',name:'しかのハル',species:'deer',emoji:'🦌',place:'緑のお店の屋上',x:7.2,z:1.5,h:ROOF,color:'#ad8fa3',line:'屋上の風とコーヒー。今日はいい日になりそう。'},
 {id:'sol',name:'ハリネズミのマロン',species:'hedgehog',emoji:'🦔',place:'橋の向こうの屋上',x:-6.5,z:.5,h:ROOF,color:'#8aaea3',line:'階段、がんばって来てくれたんだね。ありがとう。'},
 {id:'kai',name:'インコのピノ',species:'parakeet',emoji:'🦜',place:'裏通りのベンチ',x:-13,z:-9,h:0,color:'#a4aa6a',line:'頭の相棒にも、おはよう！ 森の朝はにぎやかだね。'}
];
export const BUILDINGS=[{x:-6.5,z:.5,type:'florist'},{x:7.2,z:1.5,type:'leaf'},{x:-17,z:7,type:'bookshop'},{x:18,z:9,type:'bakery'},{x:-14,z:-13,type:'studio'},{x:7,z:21,type:'leaf'},{x:0,z:-9.7,type:'bookshop'}];
export const NODES=[{x:0,z:.6,h:0},{x:0,z:6,h:0},{x:-7,z:6,h:0},{x:7,z:6,h:0},{x:-14,z:10,h:0},{x:14,z:12,h:0},{x:0,z:17,h:0},{x:STAIR.x,z:STAIR.front,h:0},{x:STAIR.x,z:STAIR.upperBack,h:ROOF},{x:7.2,z:1.5,h:ROOF},{x:-6.5,z:.5,h:ROOF},{x:-11,z:6,h:0},{x:-11,z:-6,h:0},{x:-13,z:-9,h:0},{x:7.2,z:STAIR.upperBack,h:ROOF},{x:-6.5,z:STAIR.upperBack,h:ROOF},{x:-6.5,z:-.4,h:ROOF},{x:7.2,z:-.4,h:ROOF}];
const LINKS=[[0,1],[1,2],[1,3],[2,4],[3,5],[1,6],[3,7],[7,8],[8,14],[14,9],[8,15],[15,10],[2,11],[11,12],[12,13],[4,6],[5,6],[10,16],[16,17],[17,9]];
export function fresh(){return {version:1,cups:0,delivered:[],x:0,z:.6,h:.18,round:1};}
export function restore(raw){try{const s=JSON.parse(raw);if(s?.version!==1)return fresh();const delivered=[...new Set((Array.isArray(s.delivered)?s.delivered:[]).filter(id=>NEIGHBORS.some(n=>n.id===id)))];return {...fresh(),cups:Number.isInteger(s.cups)?Math.max(0,Math.min(4,s.cups)):0,delivered,x:Number.isFinite(s.x)?Math.max(-Math.PI*RADIUS,Math.min(Math.PI*RADIUS,s.x)):0,z:Number.isFinite(s.z)?Math.max(-34,Math.min(34,s.z)):3,h:Number.isFinite(s.h)?Math.max(0,Math.min(ROOF,s.h)):0,round:Number.isInteger(s.round)&&s.round>0?s.round:1};}catch{return fresh();}}
export function distance(a,b){return Math.hypot(a.x-b.x,a.z-b.z,(a.h||0)-(b.h||0));}
export function brewOne(s){if(s.cups>=4||distance(s,{x:0,z:3,h:0})>3)return false;s.cups++;return true;}
export function deliver(s,id){const n=NEIGHBORS.find(n=>n.id===id);if(!n||s.cups<1||s.delivered.includes(id)||distance(s,n)>2.3)return false;s.cups--;s.delivered.push(id);return true;}
export function floorAt(x,z,previous=0){
 const upper=(x>=-8.7&&x<=9.5&&(Math.abs(z-STAIR.upperBack)<.88||Math.abs(z+.4)<.88))||(Math.abs(x-7.2)<.87&&z>=STAIR.upperBack&&z<=1.6)||(Math.abs(x+6.5)<.87&&z>=STAIR.upperBack&&z<=.6)||(Math.abs(x+6.5)<2.2&&Math.abs(z-.5)<1.85)||(Math.abs(x-7.2)<2.2&&Math.abs(z-1.5)<1.85);
 if(previous>ROOF-.65&&upper)return ROOF;
 if(Math.abs(x-STAIR.x)<STAIR.width/2+.1&&z>=STAIR.back&&z<=STAIR.front)return STAIR.landing*(STAIR.front-z)/(STAIR.front-STAIR.back);
 if(Math.abs(x-STAIR.x)<STAIR.width/2+.1&&z>=STAIR.upperBack&&z<STAIR.back)return STAIR.landing+(ROOF-STAIR.landing)*(STAIR.back-z)/(STAIR.back-STAIR.upperBack);
 if(Math.abs(x)<2.95&&z>=-1.7&&z<=3.3)return .18;
 return 0;
}
export function blocked(x,z,h){
 if(Math.abs(x+2.9)<.28&&z>-1.85&&z<2.9&&h<3.5)return true;
 if(Math.abs(x)<3.2&&z< -1.45&&z> -2.05&&h<3.5)return true;
 return BUILDINGS.some(b=>Math.abs(x-b.x)<2.48&&Math.abs(z-b.z)<2.02&&h<ROOF-.45);
}
export function advance(s,dx,dz){let x=s.x+dx,z=Math.max(-34,Math.min(34,s.z+dz));x=((x+Math.PI*RADIUS)%(2*Math.PI*RADIUS)+2*Math.PI*RADIUS)%(2*Math.PI*RADIUS)-Math.PI*RADIUS;let h=floorAt(x,z,s.h);if(!blocked(x,z,h)){s.x=x;s.z=z;s.h=h;return true;}return false;}
export function route(start,destination){const nodes=NODES.map(n=>({...n}));const nearest=p=>nodes.reduce((best,n,i)=>distance(p,n)<distance(p,nodes[best])?i:best,0);const a=nearest(start),b=nearest(destination);const costs=nodes.map(()=>Infinity),prev=[],open=new Set(nodes.map((_,i)=>i));costs[a]=0;while(open.size){let u=[...open].reduce((a,b)=>costs[a]<costs[b]?a:b);open.delete(u);if(u===b)break;for(const [v,w]of LINKS){let n=v===u?w:w===u?v:null;if(n===null||!open.has(n))continue;const d=costs[u]+distance(nodes[u],nodes[n]);if(d<costs[n]){costs[n]=d;prev[n]=u;}}}let chain=[b];while(chain[0]!==a&&prev[chain[0]]!==undefined)chain.unshift(prev[chain[0]]);return [...chain.map(i=>nodes[i]),{x:destination.x,z:destination.z,h:destination.h||0}];}
