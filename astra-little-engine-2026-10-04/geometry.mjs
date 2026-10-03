import {TAU,shifts} from './model.mjs';
export const CENTER=1.72;
export const MATERIALS={teal:{color:[.045,.28,.29],metal:.58,rough:.33},brass:{color:[.66,.46,.19],metal:.84,rough:.28},steel:{color:[.50,.58,.59],metal:.93,rough:.24},dark:{color:[.12,.18,.19],metal:.66,rough:.34},base:{color:[.105,.135,.14],metal:.28,rough:.54},rubber:{color:[.048,.067,.066],metal:0,rough:.8},air:{color:[.37,.84,.8],metal:0,rough:.5,emission:.45}};
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);};
export class Mesh{
 constructor(){this.data=[];}
 tri(a,b,c,ns){const n=norm(cross(sub(b,a),sub(c,a)));for(const [i,p] of [a,b,c].entries())this.data.push(...p,...(ns?.[i]||n));}
 quad(a,b,c,d,ns){this.tri(a,b,c,ns&&[ns[0],ns[1],ns[2]]);this.tri(a,c,d,ns&&[ns[0],ns[2],ns[3]]);}
 box(x,y,z,w,h,d){const p=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(v=>[x+v[0]*w/2,y+v[1]*h/2,z+v[2]*d/2]);for(const f of[[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]])this.quad(...f.map(i=>p[i]));return this;}
 lathe(profile,start=0,end=TAU,segments=64,cy=0,cz=0){
  const p=(x,r,t)=>[x,cy+Math.sin(t)*r,cz+Math.cos(t)*r];
  for(let j=0;j<profile.length-1;j++){const [x1,r1]=profile[j],[x2,r2]=profile[j+1];const dx=x2-x1,dr=r2-r1;
   for(let i=0;i<segments;i++){const a=start+(end-start)*i/segments,b=start+(end-start)*(i+1)/segments;const n=t=>norm([-dr,Math.sin(t)*dx,Math.cos(t)*dx]);this.quad(p(x1,r1,a),p(x2,r2,a),p(x2,r2,b),p(x1,r1,b),[n(a),n(a),n(b),n(b)]);}}
  return this;
 }
 ring(x,width,inner,outer,start=0,end=TAU,segments=64){
  const profile=[[x-width/2,inner],[x-width/2,outer-.015],[x-width/2+.015,outer],[x+width/2-.015,outer],[x+width/2,outer-.015],[x+width/2,inner],[x-width/2,inner]];
  this.lathe(profile,start,end,segments);
  if(end-start<TAU-.0001){for(const t of[start,end]){const p=(xx,r)=>[xx,Math.sin(t)*r,Math.cos(t)*r];this.quad(p(x-width/2,inner),p(x+width/2,inner),p(x+width/2,outer),p(x-width/2,outer));}}
  return this;
 }
}
function blade(mesh,x,theta,root,tip,hand=1){
 const point=(u,v,s)=>{const r=root+(tip-root)*u,a=theta+hand*(v*(.69-.27*u)+.21*u*u);return[x+hand*(.36*Math.sin(v*2.7)+.21*(u-.4)*v)+s*.026,r*Math.sin(a),r*Math.cos(a)];};
 const smoothNormal=(u,v,s)=>{const dr=tip-root,r=root+dr*u,a=theta+hand*(v*(.69-.27*u)+.21*u*u),au=hand*(-.27*v+.42*u),av=hand*(.69-.27*u),sn=Math.sin(a),cs=Math.cos(a);const du=[hand*.21*v,dr*sn+r*cs*au,dr*cs-r*sn*au],dv=[hand*(.972*Math.cos(v*2.7)+.21*(u-.4)),r*cs*av,-r*sn*av];return norm(cross(du,dv)).map(n=>n*s);};
 const RU=10,CV=8;
 for(const s of[-1,1])for(let i=0;i<RU;i++)for(let j=0;j<CV;j++){const u=i/RU,v=j/CV-.5,u2=(i+1)/RU,v2=(j+1)/CV-.5,params=[[u,v],[u2,v],[u2,v2],[u,v2]];const ps=params.map(([a,b])=>point(a,b,s)),ns=params.map(([a,b])=>smoothNormal(a,b,s));if(s<0){ps.reverse();ns.reverse();}mesh.quad(...ps,ns);}
 for(const u of[0,1])for(let j=0;j<CV;j++)mesh.quad(point(u,j/CV-.5,-1),point(u,(j+1)/CV-.5,-1),point(u,(j+1)/CV-.5,1),point(u,j/CV-.5,1));
 for(const v of[-.5,.5])for(let i=0;i<RU;i++)mesh.quad(point(i/RU,v,-1),point((i+1)/RU,v,-1),point((i+1)/RU,v,1),point(i/RU,v,1));
}
function rotor(x,count,root,tip,hand=1){const m=new Mesh();for(let i=0;i<count;i++)blade(m,x,TAU*i/count,root,tip,hand);return m;}
function boltRing(mesh,x,radius,count=12){for(let i=0;i<count;i++){const t=TAU*i/count;mesh.lathe([[x-.03,0],[x-.03,.058],[x+.032,.058],[x+.042,.044],[x+.042,0]],0,TAU,6,Math.sin(t)*radius,Math.cos(t)*radius);}return mesh;}
function piece(mesh,material,group=-1,rotates=false,name=''){return{mesh,material,group,rotates,name};}
export function buildFixed(){
 const parts=[];
 const base=new Mesh().box(0,-.035,0,7.7,.23,3.05).box(0,.10,0,7.38,.09,2.78);
 parts.push(piece(base,'base',-1,false,'台座'));
 const trim=new Mesh().box(0,.038,1.53,7.65,.035,.025).box(0,.038,-1.53,7.65,.035,.025).box(-3.82,.038,0,.025,.035,3.05).box(3.82,.038,0,.025,.035,3.05);
 parts.push(piece(trim,'brass'));
 const feet=new Mesh();for(const x of[-3.2,3.2])for(const z of[-1.14,1.14])feet.box(x,-.19,z,.42,.13,.42);parts.push(piece(feet,'rubber'));
 // The two cradles hold the center shaft; outer assemblies separate above the bench.
 const cradle=new Mesh();for(const x of[-1.05,1.05]){cradle.box(x,.37,0,.28,.47,1.23);cradle.box(x,.21,0,.63,.10,1.55);}
 parts.push(piece(cradle,'dark'));
 const cradlePins=new Mesh();for(const x of[-1.05,1.05])for(const z of[-.61,.61])cradlePins.box(x,.281,z,.11,.06,.11);parts.push(piece(cradlePins,'brass'));
 const shaft=new Mesh().lathe([[-1.91,0],[-1.91,.12],[-1.56,.12],[-1.53,.19],[1.53,.19],[1.56,.12],[1.91,.12],[1.91,0]]);
 parts.push(piece(shaft,'steel',1,true,'中央の軸'));
 // Three readable assemblies: broad inlet, paired central stages, compact outlet.
 for(const [g,x,count,root,tip,hand] of [[0,-2.16,13,.35,1.12,1],[1,-.60,11,.31,.97,1],[1,.42,11,.31,.91,-1],[2,1.95,13,.27,.79,-1]]){
  parts.push(piece(rotor(x,count,root,tip,hand),'steel',g,true,g===0?'入口の羽根':g===2?'出口の羽根':'中央の羽根'));
  const hub=new Mesh().lathe([[x-.25,0],[x-.25,root*.74],[x-.20,root],[x+.18,root],[x+.24,root*.80],[x+.24,0]]);parts.push(piece(hub,'dark',g,true));
  const cap=new Mesh().ring(x-.205,.06,root*.69,root*.97);boltRing(cap,x-.257,root*.77,6);parts.push(piece(cap,'brass',g,true));
 }
 const nose=new Mesh().lathe([[-2.79,0],[-2.75,.07],[-2.62,.20],[-2.43,.28],[-2.37,.29],[-2.30,.28]],0,TAU,64);parts.push(piece(nose,'brass',0,true,'先端'));
 const tail=new Mesh().lathe([[2.10,.22],[2.34,.22],[2.55,.16],[2.64,.05],[2.65,0]]);parts.push(piece(tail,'brass',2,true));
 const bearings=new Mesh();for(const x of[-1.30,1.30])bearings.ring(x,.18,.195,.33);parts.push(piece(bearings,'brass',1));
 const ribs=new Mesh();for(const x of[-1.30,1.30]){for(const t of[2.7,3.65,4.55,5.3]){const r=.66,w=.055;const a=[x-.055,Math.sin(t)*.30,Math.cos(t)*.30],b=[x+.055,Math.sin(t)*.30,Math.cos(t)*.30],c=[x+.055,Math.sin(t)*r,Math.cos(t)*r],d=[x-.055,Math.sin(t)*r,Math.cos(t)*r];const off=[0,Math.cos(t)*w,-Math.sin(t)*w];ribs.quad(...[a,b,c,d].map(p=>p.map((v,i)=>v+off[i])));ribs.quad(...[d,c,b,a].map(p=>p.map((v,i)=>v-off[i])));}}
 parts.push(piece(ribs,'dark',1));
 return parts;
}
export function shellAngles(cutaway){const gap=cutaway/100*Math.PI*1.03,center=.53;return[center+gap/2,center+TAU-gap/2];}
export function buildShell(cutaway){
 const parts=[],[start,end]=shellAngles(cutaway);const spans=[[-2.59,-1.69,1.23,0],[-1.48,1.05,1.085,1],[1.28,2.53,.90,2]];
 for(const [a,b,r,g]of spans){
  const shell=new Mesh().ring((a+b)/2,b-a,r-.065,r,start,end,64);parts.push(piece(shell,'teal',g,false,'外殻'));
  const rims=new Mesh();for(const x of[a+.035,b-.035])rims.ring(x,.075,r-.083,r+.035,start,end,64);parts.push(piece(rims,'brass',g));
  const straps=new Mesh();for(const x of[a+.13,b-.13])straps.ring(x,.025,r+.002,r+.011,start,end,64);parts.push(piece(straps,'dark',g));
  const bolts=new Mesh();for(let i=0;i<14;i++){const t=TAU*i/14,wrapped=t<start?t+TAU:t;if(wrapped>end)continue;for(const x of[a-.005,b+.015])bolts.lathe([[x-.025,0],[x-.025,.048],[x+.032,.048],[x+.043,.030],[x+.043,0]],0,TAU,6,Math.sin(t)*r,Math.cos(t)*r);}parts.push(piece(bolts,'steel',g));
 }
 return parts;
}
export function transformPoint(p,part,state){if(part.group<0)return p;const a=part.rotates?state.angle:0,c=Math.cos(a),s=Math.sin(a);return[p[0]+shifts(state.explode)[part.group],p[1]*c-p[2]*s+CENTER,p[1]*s+p[2]*c];}
export function boundsPoints(state){
 // Rotation invariant cylinders include every real vertex, rims, nose and support.
 const points=[];for(const x of[-3.86,3.86])for(const y of[-.26,.16])for(const z of[-1.56,1.56])points.push([x,y,z]);
 const shiftsNow=shifts(state.explode);for(const [a,b,r,g]of[[-2.82,-1.65,1.285,0],[-1.95,1.95,1.13,1],[1.23,2.70,.95,2]])for(const x of[a,b])for(let i=0;i<48;i++)points.push([x+shiftsNow[g],CENTER+Math.sin(i*TAU/48)*r,Math.cos(i*TAU/48)*r]);return points;
}
export function buildAir(state){
 const mesh=new Mesh(),extent=3.0+2.25*state.explode/100;
 // Broken, fine ribbons make motion visible while depth testing hides them inside closed casing.
 for(let lane=0;lane<5;lane++){const theta=-.32+lane*.30,r=.57+lane*.065;for(let j=0;j<8;j++){
  const unit=((j/8+state.angle/TAU*.32)%1),x=-extent+unit*extent*2,len=.24;
  const f=t=>[t,CENTER+Math.sin(theta+Math.sin(t*1.7)*.035)*r,Math.cos(theta+Math.sin(t*1.7)*.035)*r];const a=f(x),b=f(Math.min(extent,x+len));const off=.011;mesh.quad([a[0],a[1]-off,a[2]],[b[0],b[1]-off,b[2]],[b[0],b[1]+off,b[2]],[a[0],a[1]+off,a[2]]);
 }}return piece(mesh,'air');
}
