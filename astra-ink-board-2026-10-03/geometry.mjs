// Original geometric ink study. One unit is one square.
const TAU=Math.PI*2;
export const norm=v=>{const d=Math.hypot(...v)||1;return v.map(n=>n/d);};
export const normal=(a,b,c)=>{const u=b.map((n,i)=>n-a[i]),v=c.map((n,i)=>n-a[i]);return norm([u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]);};
const vertex=(p,n,uv=[p[0],p[1]])=>({p,n,uv});
function triangulate2(points){const ids=points.map((_,i)=>i),result=[];let area=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];area+=a[0]*b[1]-a[1]*b[0];}const sign=Math.sign(area);const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);let count=0;
 while(ids.length>3&&count++<points.length*points.length){let found=false;for(let i=0;i<ids.length;i++){const a=ids[(i-1+ids.length)%ids.length],b=ids[i],c=ids[(i+1)%ids.length];if(cross(points[a],points[b],points[c])*sign<1e-8)continue;let hit=false;for(const j of ids){if(j===a||j===b||j===c)continue;const p=points[j];if(cross(points[a],points[b],p)*sign>=0&&cross(points[b],points[c],p)*sign>=0&&cross(points[c],points[a],p)*sign>=0){hit=true;break;}}if(hit)continue;result.push([a,b,c]);ids.splice(i,1);found=true;break;}if(!found)break;}
 if(ids.length===3)result.push([...ids]);return result;
}
class Scene{
 constructor(){this.triangles=[];this.lines=[];this.labels=[];this.meshes=[];}
 tri(a,b,c,style={}){this.triangles.push({v:[a,b,c],...style});}
 poly(points,style={}){const n=normal(points[0],points[1],points[2]),vertices=points.map(p=>vertex(p,n));for(let i=1;i<vertices.length-1;i++)this.tri(vertices[0],vertices[i],vertices[i+1],style);}
 line(points,width=.012,strength=.8,style={}){this.lines.push({points,width,strength,...style});}
}
function lathe(scene,profile,position,style,segments=36){
 const [X,Y,Z]=position,ring=(r,y,t)=>[X+r*Math.cos(t),Y+y,Z+r*Math.sin(t)];
 for(let j=0;j<profile.length-1;j++){const [r0,y0]=profile[j],[r1,y1]=profile[j+1],slope=(r1-r0)/(y1-y0||.0001);
  for(let i=0;i<segments;i++){const a=i/segments*TAU,b=(i+1)/segments*TAU,n0=norm([Math.cos(a),-slope,Math.sin(a)]),n1=norm([Math.cos(b),-slope,Math.sin(b)]);const p=[vertex(ring(r0,y0,a),n0,[a*.26,y0]),vertex(ring(r1,y1,a),n0,[a*.26,y1]),vertex(ring(r1,y1,b),n1,[b*.26,y1]),vertex(ring(r0,y0,b),n1,[b*.26,y0])];scene.tri(p[0],p[1],p[2],style);scene.tri(p[0],p[2],p[3],style);}
 }
 for(let j=0;j<profile.length;j++){const [r,y]=profile[j];if(r<.018)continue;const prev=profile[j-1],next=profile[j+1];const contour=!prev||!next||j%3===0||Math.sign(r-prev[0])!==Math.sign(next[0]-r);if(!contour)continue;const pts=Array.from({length:73},(_,i)=>ring(r+.0018,y+.002,i/72*TAU));scene.line(pts,j===0?.016:.009,j===0?.8:.55,{...style,bias:.0015});}
 // Fine meridians describe roundness without filling it with glossy color.
 for(let i=0;i<14;i++){const a=i/14*TAU+.03;scene.line(profile.map(([r,y],j)=>ring(r+.002,y+.001,a+Math.sin(j*1.6+i)*.007)),.006,.23,style);}
 scene.meshes.push({profile,position,style});
}
function sphere(scene,center,radius,style){const profile=[];for(let j=0;j<=14;j++){const a=-Math.PI/2+j/14*Math.PI;profile.push([Math.max(.0001,Math.cos(a)*radius),Math.sin(a)*radius]);}lathe(scene,profile,center,style,32);}
function box(scene,center,size,style,rotation=0){const c=Math.cos(rotation),s=Math.sin(rotation);const P=(x,y,z)=>[center[0]+x*c-z*s,center[1]+y,center[2]+x*s+z*c],w=size[0]/2,h=size[1]/2,d=size[2]/2,ps=[P(-w,-h,-d),P(w,-h,-d),P(w,h,-d),P(-w,h,-d),P(-w,-h,d),P(w,-h,d),P(w,h,d),P(-w,h,d)];for(const f of[[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[0,3,7,4],[1,5,6,2]])scene.poly(f.map(i=>ps[i]),style);for(const [a,b]of[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]])scene.line([ps[a],ps[b]],.013,.78,style);}
function extrusion(scene,points,zdepth,position,style,flip=1){const P=(p,z)=>[position[0]+p[0]*flip,position[1]+p[1],position[2]+z],front=points.map(p=>P(p,zdepth)),back=points.map(p=>P(p,-zdepth));
 for(const t of triangulate2(points)){for(const ps of[front,back]){const n=ps===front?[0,0,1]:[0,0,-1];scene.tri(...t.map(i=>vertex(ps[i],n,[points[i][0],points[i][1]])),style);}}
 for(let i=0;i<points.length;i++){const j=(i+1)%points.length;scene.poly([front[i],back[i],back[j],front[j]],style);}
 for(const ps of[front,back])scene.line([...ps,ps[0]],.018,.9,style);
 return P;
}
const BASE=[[.001,0],[.34,0],[.38,.04],[.39,.08],[.37,.12],[.31,.16],[.29,.19],[.29,.24],[.25,.27]];
function piece(scene,p){const x=p.file-3.5,z=3.5-p.rank,y=.066,pos=[x,y,z],style={id:p.id,side:p.side==='dark'?1:0,kind:1};
 // Pen-stroke contact shadows, drawn on the paper rather than blurred gray blobs.
 for(let j=0;j<14;j++){const zz=(j-6.5)*.05,half=Math.sqrt(Math.max(0,.47*.47-zz*zz));scene.line([[x-half+.10,.051,z+zz+.07],[x+half+.22,.051,z+zz+.13]],.008,.18,{kind:0});}
 let profile;
 if(p.type==='pawn'){profile=BASE.map(([r,yy])=>[r*.82,yy*.83]).concat([[.20,.27],[.15,.36],[.11,.52],[.14,.62],[.22,.67],[.22,.71],[.15,.75]]);lathe(scene,profile,pos,style);sphere(scene,[x,y+.94,z],.21,style);}
 if(p.type==='king'){
  profile=BASE.concat([[.24,.33],[.20,.46],[.15,.74],[.15,1.03],[.20,1.16],[.30,1.22],[.31,1.28],[.27,1.33],[.20,1.38],[.21,1.48],[.17,1.54],[.09,1.58]]);lathe(scene,profile,pos,style);box(scene,[x,y+1.77,z],[.085,.40,.12],style);box(scene,[x,y+1.81,z],[.31,.085,.12],style);
 }
 if(p.type==='queen'){
  profile=BASE.concat([[.23,.34],[.17,.52],[.13,.80],[.15,1.03],[.22,1.15],[.29,1.19],[.29,1.25],[.21,1.30],[.19,1.40],[.28,1.58],[.27,1.62],[.06,1.61]]);lathe(scene,profile,pos,style);for(let i=0;i<7;i++){const t=i/7*TAU;lathe(scene,[[.035,0],[.025,.15],[.008,.19]],[x+Math.cos(t)*.265,y+1.57,z+Math.sin(t)*.265],style,10);sphere(scene,[x+Math.cos(t)*.265,y+1.76,z+Math.sin(t)*.265],.05,style);}sphere(scene,[x,y+1.72,z],.095,style);
 }
 if(p.type==='rook'){
  profile=BASE.concat([[.25,.35],[.23,.80],[.26,1.00],[.32,1.05],[.33,1.10],[.31,1.17],[.23,1.19],[.001,1.19]]);lathe(scene,profile,pos,style);for(let i=0;i<6;i++){const t=i/6*TAU;box(scene,[x+Math.cos(t)*.26,y+1.26,z+Math.sin(t)*.26],[.16,.21,.15],style,t);}
 }
 if(p.type==='bishop'){
  profile=BASE.concat([[.23,.35],[.16,.57],[.12,.88],[.15,1.04],[.25,1.12],[.25,1.17],[.17,1.22],[.12,1.27],[.20,1.35],[.24,1.46],[.20,1.59],[.11,1.73],[.001,1.82]]);lathe(scene,profile,pos,style);sphere(scene,[x,y+1.82,z],.045,style);
  // Diagonal mitre slit is visible from either side.
  for(const side of[-1,1]){const pts=[[x-.095,y+1.60,z+side*.159],[x+.085,y+1.42,z+side*.216]];scene.line(pts,.031,.95,{...style,bias:.018});scene.line(pts.map(v=>[v[0]+.031,v[1],v[2]+side*.002]),.009,.65,{...style,bias:.02});}
 }
 if(p.type==='knight'){
  profile=BASE.concat([[.25,.34],[.20,.46],[.22,.52],[.29,.55],[.29,.61],[.20,.66]]);lathe(scene,profile,pos,style);
  const shape=[[-.26,.62],[-.30,.88],[-.28,1.17],[-.21,1.44],[-.15,1.60],[-.16,1.79],[-.06,1.72],[.01,1.83],[.10,1.63],[.27,1.52],[.33,1.39],[.48,1.29],[.47,1.16],[.34,1.13],[.17,1.20],[.10,1.24],[.07,1.10],[.17,.98],[.20,.82],[.23,.67]];
  const flip=p.side==='dark'?-1:1,P=extrusion(scene,shape,.105,pos,style,flip);
  for(const side of[-1,1]){
   const zz=side*.11;scene.line([P([-.11,1.52],zz),P([-.14,1.24],zz),P([-.12,1.02],zz),P([.10,.73],zz)],.017,.8,style);
   scene.line([P([.12,1.42],zz),P([.20,1.42],zz)],.035,.97,style);
   scene.line([P([.35,1.23],zz),P([.44,1.23],zz)],.017,.85,style);
   for(let i=0;i<10;i++){const yy=.84+i*.067;scene.line([P([-.29,yy],zz),P([-.16,yy-.055],zz)],.008,.75,style);}
  }
 }
}
export function buildScene(state){const scene=new Scene();
 // Board squares are filled with sparse diagonals; the blank squares stay paper-white.
 for(let file=0;file<8;file++)for(let rank=0;rank<8;rank++){const x=file-4,z=3-rank;scene.poly([[x,.03,z],[x+1,.03,z],[x+1,.03,z+1],[x,.03,z+1]],{kind:(file+rank)%2===0?2:0,side:0,square:{file,rank}});}
 const edge=[[-4.05,.018,-4.05],[4.05,.018,-4.05],[4.05,.018,4.05],[-4.05,.018,4.05],[-4.05,.018,-4.05]];scene.line(edge,.025,.8,{kind:0});scene.line(edge.map(p=>[p[0]*1.012,p[1]-.001,p[2]*1.012]),.01,.3,{kind:0});
 for(let j=0;j<=8;j++){
  const n=j-4;for(const d of[0,.012]){scene.line(Array.from({length:25},(_,i)=>[-4+i/3,.038,n+d+Math.sin(i*.77+j)*.006]),d?.006:.013,d?.3:.65,{kind:0});scene.line(Array.from({length:25},(_,i)=>[n+d+Math.sin(i*.88+j)*.006,.038,-4+i/3]),d?.006:.013,d?.3:.65,{kind:0});}
 }
 for(let i=0;i<8;i++){scene.labels.push({text:'abcdefgh'[i],p:[i-3.5,.04,4.36],size:.18},{text:String(i+1),p:[-4.36,.04,3.5-i],size:.18});}
 // Tiny marginal details are original geometric pen doodles.
 const star=(x,z)=>{scene.line([[x-.065,.023,z],[x+.065,.023,z]],.009,.48);scene.line([[x,.024,z-.065],[x,.024,z+.065]],.009,.48);scene.line([[x-.035,.024,z-.035],[x+.035,.024,z+.035]],.006,.3);};star(4.35,3.1);star(4.45,2.83);
 for(let i=0;i<5;i++){const x=-4.4+i*.065;scene.line([[x,.02,-3.5],[x+.24,.02,-3.7]],.008,.35);}
 scene.labels.push({text:'blue / no. 05',p:[.7,.025,-4.48],size:.145});
 const selected=state.pieces.find(p=>p.id===state.selected);
 if(selected){const x=selected.file-4,z=3-selected.rank;scene.line([[x+.07,.044,z+.07],[x+.93,.044,z+.07],[x+.93,.044,z+.93],[x+.07,.044,z+.93],[x+.07,.044,z+.07]],.038,.9,{accent:true,bias:.004});}
 if(state.focusSquare){const x=state.focusSquare.file-4,z=3-state.focusSquare.rank;for(const [a,b]of[[[x+.02,.045,z+.02],[x+.23,.045,z+.02]],[[x+.02,.045,z+.02],[x+.02,.045,z+.23]],[[x+.98,.045,z+.98],[x+.77,.045,z+.98]],[[x+.98,.045,z+.98],[x+.98,.045,z+.77]]])scene.line([a,b],.028,.9,{accent:true,bias:.006});}
 for(const p of state.pieces)piece(scene,p);
 return scene;
}
