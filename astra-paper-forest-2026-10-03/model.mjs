export const TAU = Math.PI * 2;
export const DEFAULT_STATE = Object.freeze({opening:100, yaw:-0.37, pitch:0.72, zoom:1, evening:false, guides:false});
export const VIEWS = Object.freeze({front:{yaw:0,pitch:0.60,zoom:1},overhead:{yaw:-0.12,pitch:1.24,zoom:1},detail:{yaw:-0.58,pitch:0.50,zoom:1.17}});
export const clamp = (v,a,b) => Math.min(b,Math.max(a,Number.isFinite(v)?v:a));
export const mix = (a,b,t) => a+(b-a)*t;
export function normalizeState(value={}) {
  return {opening:clamp(value.opening??100,0,100),yaw:Number.isFinite(value.yaw)?value.yaw:DEFAULT_STATE.yaw,
    pitch:clamp(value.pitch??DEFAULT_STATE.pitch,.28,1.36),zoom:clamp(value.zoom??1,.72,1.5),evening:!!value.evening,guides:!!value.guides};
}
export function foldAmount(opening) {return Math.pow(Math.sin(clamp(opening,0,100)/100*Math.PI/2),1.5);}
export function pagePoint(point,side,opening) {
  const [x,y,z]=point;
  const angle=side>0?Math.PI*(1-clamp(opening,0,100)/100):0;
  const paperGap=side>0?.015+.065*Math.pow(1-clamp(opening,0,100)/100,4):0;
  return [x*Math.cos(angle)-y*Math.sin(angle),.19+x*Math.sin(angle)+y*Math.cos(angle)+paperGap,z];
}
export function paperPoint(point,anchor,state) {
  const [x,y,z]=point, lift=foldAmount(state.opening),flat=Math.sqrt(Math.max(0,1-lift*lift));
  const direction=anchor[2]<-.5?1:-1;
  return pagePoint([anchor[0]+x,.026+y*lift,anchor[2]+z+direction*y*flat],anchor[0]>=0?1:-1,state.opening);
}
export function camera(state,width,height,worldPoints=null) {
  const w=Number.isFinite(width)?Math.max(1,width):1,h=Number.isFinite(height)?Math.max(1,height):1,s=normalizeState(state);
  const cy=Math.cos(s.yaw),sy=Math.sin(s.yaw),cp=Math.cos(s.pitch),sp=Math.sin(s.pitch);
  const raw=p=>{const u=p[0]*cy+p[2]*sy,d=-p[0]*sy+p[2]*cy;return{x:u,y:-p[1]*cp+d*sp,depth:d*cp+p[1]*sp};};
  // Rendering passes the actual vertices. The conservative envelope keeps the
  // standalone camera safe too, including a 90-degree orbit seen from above.
  let bounds=worldPoints;
  if(!bounds?.length){bounds=[];const top=.04+3.55*foldAmount(s.opening);for(const side of[-1,1])for(const x of[0,side*5.9])for(const y of[-.24,top])for(const z of[-4.08,4.08])bounds.push(pagePoint([x,y,z],side,s.opening));bounds.push([0,.008,4.74]);}
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(const p of bounds){const q=raw(p);minX=Math.min(minX,q.x);maxX=Math.max(maxX,q.x);minY=Math.min(minY,q.y);maxY=Math.max(maxY,q.y);}
  const scale=Math.min(w/15.1,h/10.4,w*.90/Math.max(.01,maxX-minX),h*.77/Math.max(.01,maxY-minY))*s.zoom;
  const centerX=-2.65*Math.pow(1-s.opening/100,3);
  const fitOffset=(desired,lo,hi)=>lo<=hi?clamp(desired,lo,hi):(lo+hi)*.5;
  const offsetX=fitOffset(w*.5-centerX*cy*scale,w*.05-minX*scale,w*.95-maxX*scale);
  const offsetY=fitOffset(h*.60+centerX*sy*sp*scale,h*.12-minY*scale,h*.89-maxY*scale);
  return p=>{const q=raw(p);return{x:offsetX+q.x*scale,y:offsetY+q.y*scale,depth:q.depth,scale};};
}
export function seeded(seed=1){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
export function splitAtSpine(points,positive) {
  const out=[];for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length],ina=positive?a[0]>=0:a[0]<=0,inb=positive?b[0]>=0:b[0]<=0;
    if(ina)out.push(a);if(ina!==inb){const t=-a[0]/(b[0]-a[0]);out.push([0,mix(a[1],b[1],t),mix(a[2],b[2],t)]);}
  }return out;
}
export function polygonNormal(points){
  if(points.length<3)return [0,1,0];let nx=0,ny=0,nz=0;
  for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];nx+=(a[1]-b[1])*(a[2]+b[2]);ny+=(a[2]-b[2])*(a[0]+b[0]);nz+=(a[0]-b[0])*(a[1]+b[1]);}
  const n=Math.hypot(nx,ny,nz)||1;return [nx/n,ny/n,nz/n];
}
