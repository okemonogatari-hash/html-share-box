import {camera,pagePoint,paperPoint,foldAmount,seeded,splitAtSpine,normalizeState} from './model.mjs';
import {drawWorld} from './gpu.mjs';

const C={paper:'#f4efd8',edge:'#ded7b9',cover:'#537565',coverDark:'#38594c',green:'#75916b',dark:'#496e56',pale:'#a8b58b',ochre:'#d1b465',coral:'#c77b61',cream:'#f7e5be',river:'#83aeb0',riverLight:'#aed0c4',ink:'#4c654e'};
function rgb(hex){return hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16));}
function shade(hex,light=1){const [r,g,b]=rgb(hex);return `rgb(${Math.min(255,r*light)|0},${Math.min(255,g*light)|0},${Math.min(255,b*light)|0})`;}
function ellipse(x,y,z,rx,rz,n=28){return Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2;return[x+Math.cos(a)*rx,y,z+Math.sin(a)*rz];});}
function scallop(w,h,seed=1){const r=seeded(seed);return Array.from({length:30},(_,i)=>{const a=i/30*Math.PI*2,q=.94+r()*.08;return[Math.cos(a)*w*q,Math.sin(a)*h*q];});}
const TREE_DATA=[
 [-4.8,-2.35,2.45,.82,0,1],[-3.65,-2.66,3.0,.96,1,2],[-2.3,-2.62,2.67,.82,0,3],[-1.1,-2.9,2.15,.65,0,4],
 [-4.9,-.55,1.65,.75,1,5],[-4.75,1.9,1.9,.7,0,6],[-3.3,2.48,1.5,.67,1,7],[-1.6,2.5,1.25,.49,0,8],
 [1.0,-2.75,2.25,.75,0,10],[2.05,-2.68,2.8,.96,1,11],[3.68,-2.8,3.05,.86,0,12],[4.9,-2.2,2.4,.77,0,13],
 [4.92,-.2,1.6,.65,1,14],[4.65,1.75,2.1,.79,0,15],[3.65,2.66,1.45,.66,1,16],[1.2,2.87,1.42,.56,0,17],
 [-.7,-1.47,1.42,.51,1,18],[.95,.2,.96,.44,1,19]
];

class World {
  constructor(state){this.state=state;this.items=[];this.serial=0;}
  poly(points,color,options={}){if(points.length<3)return;this.items.push({kind:'poly',points,color,...options,id:this.serial++});}
  line(points,color,width=.012,options={}){this.items.push({kind:'line',points,color,width,...options,id:this.serial++});}
  label(text,center,u,v,color,size=.14,options={}){this.items.push({kind:'label',points:[center,u,v],text,color,size,...options,id:this.serial++});}
  page(points,color,options={}){for(const side of[-1,1]){const cut=splitAtSpine(points,side>0);if(cut.length>=3)this.poly(cut.map(p=>pagePoint(p,side,this.state.opening)),color,options);}}
  pageLine(points,color,width=.012,options={}){for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1];if(a[0]*b[0]<0){const t=-a[0]/(b[0]-a[0]),m=[0,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];this.line([a,m].map(p=>pagePoint(p,a[0]>=0?1:-1,this.state.opening)),color,width,options);this.line([m,b].map(p=>pagePoint(p,b[0]>=0?1:-1,this.state.opening)),color,width,options);}else this.line([a,b].map(p=>pagePoint(p,a[0]+b[0]>=0?1:-1,this.state.opening)),color,width,options);}}
}

function book(w){
 const st=w.state;
 for(const side of[-1,1]){
  const left=side<0?-5.9:-.015,right=side<0?.015:5.9;
  const P=p=>pagePoint(p,side,st.opening);
  const cover=[ [left,-.15,-4.07],[right,-.15,-4.07],[right,-.15,4.07],[left,-.15,4.07] ];
  w.poly(cover.map(P),C.cover,{grain:true});
  for(let i=0;i<4;i++){const a=cover[i],b=cover[(i+1)%4];w.poly([a,b,[b[0],-.23,b[2]],[a[0],-.23,a[2]]].map(P),C.coverDark);}
  const lx=side<0?-5.68:.025,rx=side<0?-.025:5.68;
  const top=[[lx,0,-3.85],[rx,0,-3.85],[rx,0,3.85],[lx,0,3.85]];
  for(let i=0;i<4;i++){const a=top[i],b=top[(i+1)%4];w.poly([a,b,[b[0],-.145,b[2]],[a[0],-.145,a[2]]].map(P),C.edge);
    for(let k=1;k<10;k++)w.line([[a[0],-k*.0145,a[2]],[b[0],-k*.0145,b[2]]].map(P),k%3===0?'#c3bda3':'#f4edd8',.006,{unlit:true});}
  w.poly(top.map(P),C.paper,{grain:true,unlit:true});
  // An inset rule and small corner flourishes give the page a printed finish.
  const x1=side<0?-5.40:.28,x2=side<0?-.28:5.40;
  w.line([[x1,.004,-3.58],[x2,.004,-3.58],[x2,.004,3.58],[x1,.004,3.58],[x1,.004,-3.58]].map(P),'#d1cbb2',.009,{unlit:true});
  for(const x of[x1,x2])for(const z of[-3.58,3.58]){const sx=x===x1?1:-1,sz=z<0?1:-1;w.line([[x,.007,z+sz*.24],[x,.007,z],[x+sx*.24,.007,z]].map(P),'#adad87',.014);}
  if(side<0){w.label('01',P([-5.02,.012,3.45]),P([-4.82,.012,3.45]),P([-5.02,.012,3.25]),'#9b9e7b',.13,{serif:true});}
  else{w.label('02',P([5.0,.012,3.45]),P([5.2,.012,3.45]),P([5.0,.012,3.25]),'#9b9e7b',.13,{serif:true});}
  // Cover decoration becomes visible when the book is closed.
  const coverBack=-.233;
  w.line([[lx+.35,coverBack,-3.50],[rx-.35,coverBack,-3.50],[rx-.35,coverBack,3.50],[lx+.35,coverBack,3.50],[lx+.35,coverBack,-3.50]].map(P),'#b8c7a4',.015,{unlit:true});
  if(side>0){
   const cx=2.85;
   w.label('ひらく、紙の森',P([cx,coverBack,-.15]),P([cx-1,coverBack,-.15]),P([cx,coverBack,-1.15]),'#e2dfb7',.37,{serif:true});
   w.label('A LITTLE PAPER FOREST',P([cx,coverBack,.40]),P([cx-1,coverBack,.40]),P([cx,coverBack,-.60]),'#b8c7a4',.1,{serif:true});
   const emblem=[];for(let i=0;i<32;i++){const a=i/32*Math.PI*2;emblem.push([cx+.57*Math.cos(a),coverBack,-1.72+.57*Math.sin(a)]);}w.line([...emblem,emblem[0]].map(P),'#bec9a2',.012,{unlit:true});
   w.poly([[cx,coverBack,-2.13],[cx-.31,coverBack,-1.62],[cx-.17,coverBack,-1.62],[cx-.39,coverBack,-1.26],[cx+.39,coverBack,-1.26],[cx+.17,coverBack,-1.62],[cx+.31,coverBack,-1.62]].map(P),'#c7cfac',{unlit:true});
  }
 }
 // Linen binding along the hinge; a ribbon slips out from the foot of the spine.
 for(let i=0;i<10;i++){const a=i/10*Math.PI,b=(i+1)/10*Math.PI;
   w.poly([[-.105*Math.cos(a),.14-.105*Math.sin(a),-4.05],[-.105*Math.cos(b),.14-.105*Math.sin(b),-4.05],[-.105*Math.cos(b),.14-.105*Math.sin(b),4.05],[-.105*Math.cos(a),.14-.105*Math.sin(a),4.05]],i%2?'#526e5c':'#617c65');}
 w.poly([[-.15,.008,4.04],[.14,.008,4.04],[.28,.008,4.66],[.06,.008,4.53],[-.07,.008,4.73]],'#bf775a',{grain:true});
}

function terrain(w){
 const random=seeded(27);
 for(const [x,z,rx,rz,col] of[[-3.4,-1.7,1.9,1.55,'#e1e1bd'],[3.2,-1.7,2.06,1.42,'#dee0b9'],[-3.7,1.85,1.32,1.03,'#e2dfb9'],[3.7,1.9,1.34,1.0,'#dedfb8']])w.page(ellipse(x,.006,z,rx,rz),col,{unlit:true});
 // A meandering river is cut as a single ribbon, then clipped at the spine.
 const center=z=>.25+Math.sin(z*.94)*.50;
 const river=[],left=[],right=[];
 for(let i=0;i<=45;i++){const z=-3.8+i/45*7.6,rad=.40+Math.sin(z*1.3)*.055;left.push([center(z)-rad,.014,z]);right.push([center(z)+rad,.014,z]);}
 river.push(...left,...right.reverse());w.page(river,C.river,{unlit:true});
 w.pageLine(left,'#d5e0c3',.045,{unlit:true});w.pageLine(right,'#d5e0c3',.045,{unlit:true});
 for(let i=0;i<20;i++){const z=-3.55+i*.365,x=center(z)-.18+random()*.28;w.pageLine([[x,.018,z],[x+.14+random()*.13,.018,z-.06]],i%2?'#b6d2c4':'#648f98',.011,{unlit:true});}
 // Warm footpaths join the tea shop, bridge and cottage.
 const paths=[[-4.5,3.45,-2.9,1.6,-1.10,1.2],[1.0,1.20,2.2,.5,3.35,-.8],[1.1,1.2,2.6,2.1,4.8,3.35]];
 for(const [ax,az,bx,bz,cx,cz] of paths){const e1=[],e2=[];for(let i=0;i<=25;i++){const t=i/25,s=1-t,x=s*s*ax+2*s*t*bx+t*t*cx,z=s*s*az+2*s*t*bz+t*t*cz,dx=2*s*(bx-ax)+2*t*(cx-bx),dz=2*s*(bz-az)+2*t*(cz-bz),n=Math.hypot(dx,dz)||1;e1.push([x-dz/n*.24,.011,z+dx/n*.24]);e2.push([x+dz/n*.24,.011,z-dx/n*.24]);}w.page([...e1,...e2.reverse()],'#ded1ab',{unlit:true});}
 for(let i=0;i<92;i++){const x=(random()-.5)*10.3,z=(random()-.5)*6.8;if(Math.abs(x-center(z))<.6)continue;const a=random()*6.28,s=.018+random()*.035;w.page(ellipse(x,.02,z,s,s*.46,7),i%3===0?'#bebf94':'#cdd0a7',{unlit:true});}
 // Paper gluing tabs: visible along the roots, highlighted when requested.
 for(const [x,z,h,ww,type,seed]of TREE_DATA){const side=x>0?1:-1,tab=[[x-ww*.22,.025,z-.14],[x+ww*.22,.025,z-.14],[x+ww*.30,.025,z+.18],[x-ww*.30,.025,z+.18]];w.poly(tab.map(p=>pagePoint(p,side,w.state.opening)),w.state.guides?'#e3c6aa':'#e8e4ca',{grain:true});
  if(w.state.guides)w.line([[x-ww*.3,.03,z],[x+ww*.3,.03,z]].map(p=>pagePoint(p,side,w.state.opening)),'#b57656',.016,{dash:true,unlit:true});}
 if(w.state.guides)w.line([[0,.225,-3.85],[0,.225,3.85]],'#b57656',.022,{dash:true,unlit:true});
}

function objectShadow(w,anchor,rx,rz,height){
 const lift=foldAmount(w.state.opening);if(lift<.08)return;
 const side=anchor[0]>0?1:-1;
 // Soft, layered contact shapes stay attached to the moving page.
 for(let i=3;i>=0;i--){const k=i*.08;w.poly(ellipse(anchor[0]+height*.19*lift,.021,anchor[2]-height*.20*lift,rx+k,rz+k,24).map(p=>pagePoint(p,side,w.state.opening)),'#6d7851',{alpha:.035+(3-i)*.013,unlit:true,noStroke:true});}
}

function tree(w,x,z,h,width,type,seed){
 const anchor=[x,0,z],F=p=>paperPoint(p,anchor,w.state),random=seeded(seed),palette=[C.green,C.dark,C.pale,'#87996b','#a8b184'];
 const col=palette[seed%palette.length];objectShadow(w,anchor,width*.43,width*.32,h);
 const poly=(ps,c,opt={})=>w.poly(ps.map(F),c,{grain:true,...opt});
 const line=(ps,c,sz=.013,opt={})=>w.line(ps.map(F),c,sz,opt);
 poly([[-.052,0,.002],[.052,0,.002],[.042,h*.64,.002],[-.035,h*.64,.002]],'#ad9871');
 if(type===0){
  const shape=[[-width*.13,h*.18],[-width*.52,h*.18],[-width*.31,h*.40],[-width*.43,h*.40],[-width*.22,h*.61],[-width*.31,h*.61],[0,h],[width*.31,h*.61],[width*.22,h*.61],[width*.43,h*.40],[width*.31,h*.40],[width*.52,h*.18],[width*.13,h*.18]];
  poly(shape.map(([a,b])=>[0,b,a*.73]),shadeToHex(col,.88));
  poly(shape.map(([a,b])=>[a,b,.004]),col);
  poly([[0,h,.009],[width*.31,h*.61,.009],[width*.22,h*.61,.009],[width*.43,h*.40,.009],[width*.31,h*.40,.009],[width*.52,h*.18,.009],[0,h*.18,.009]],shadeToHex(col,.91));
  line([[0,h*.18,.014],[0,h,.014]],w.state.guides?'#e9d6a6':shadeToHex(col,1.17),.012,{dash:w.state.guides});
  for(let j=0;j<3;j++){const yy=h*(.29+j*.19),ww=width*(.30-j*.065);line([[-ww,yy+.07,.014],[0,yy,.014],[ww,yy+.07,.014]],shadeToHex(col,1.11),.009);}
 }else{
  const yy=h*.67,rx=width*.57,ry=h*.34,shape=scallop(rx,ry,seed);
  poly(shape.map(([a,b])=>[a,yy+b,.004]),col);
  poly(scallop(rx*.67,ry*.90,seed+15).map(([a,b])=>[.015,yy+b,a]),shadeToHex(col,.91));
  poly(shape.filter((_,i)=>i<=15).map(([a,b])=>[a,yy+b,.014]).concat([[0,yy,.014]]),shadeToHex(col,1.035));
  line([[0,h*.23,.027],[0,h*.88,.027]],'#ddd7ae',.012);
  for(const side of[-1,1])for(let j=0;j<3;j++){const yy=h*(.48+j*.11);line([[0,yy,.028],[side*width*(.20+random()*.13),yy+h*.12,.028]],'#d4d0a6',.009);}
  if(w.state.guides)line([[0,h*.30,.033],[0,h*.96,.033]],'#c48b62',.016,{dash:true});
 }
 // A narrow raw paper edge makes these feel like cut sheets.
 if(type===0)line([[0,h,.005],[-width*.31,h*.61,.005]],'#d7d9b6',.012);
}
function shadeToHex(c,n){return '#'+rgb(c).map(v=>Math.min(255,Math.round(v*n)).toString(16).padStart(2,'0')).join('');}

function house(w,x,z,width,depth,height,roof,tea=false){
 const anchor=[x,0,z],F=p=>paperPoint(p,anchor,w.state),hw=width/2,hd=depth/2,rh=height*.52;
 const poly=(ps,c,opt={})=>w.poly(ps.map(F),c,{grain:true,...opt});
 const line=(ps,c,sz=.012,opt={})=>w.line(ps.map(F),c,sz,opt);
 objectShadow(w,anchor,hw*.99,hd*.96,height);
 poly([[-hw,0,-hd],[hw,0,-hd],[hw,0,hd],[-hw,0,hd]],'#e6d5ae');
 poly([[-hw,0,hd],[hw,0,hd],[hw,height,hd],[0,height+rh,hd],[-hw,height,hd]],C.cream);
 poly([[-hw,0,-hd],[hw,0,-hd],[hw,height,-hd],[0,height+rh,-hd],[-hw,height,-hd]],'#ebdbb6');
 poly([[-hw,0,-hd],[-hw,0,hd],[-hw,height,hd],[-hw,height,-hd]],'#e7d4af');
 poly([[hw,0,hd],[hw,0,-hd],[hw,height,-hd],[hw,height,hd]],'#ddc6a1');
 const roofDepth=hd+.16,wide=hw+.14;
 poly([[-wide,height-.025,roofDepth],[0,height+rh+.03,roofDepth],[0,height+rh+.03,-roofDepth],[-wide,height-.025,-roofDepth]],roof);
 poly([[0,height+rh+.03,roofDepth],[wide,height-.025,roofDepth],[wide,height-.025,-roofDepth],[0,height+rh+.03,-roofDepth]],shadeToHex(roof,.88));
 for(const side of[-1,1]){
  line([[side*wide,height-.035,roofDepth],[0,height+rh+.025,roofDepth]],'#f4d0aa',.032);
  for(let i=1;i<7;i++){const zz=-roofDepth+i/7*roofDepth*2;line([[side*wide,height-.015,zz],[0,height+rh+.04,zz]],shadeToHex(roof,1.16),.012);}
 }
 // Folded chimney with a cream rim, never animated smoke.
 const chim=[[-hw*.42,height+rh*.58,-hd*.5],[-hw*.42+.18,height+rh*.58,-hd*.5],[-hw*.42+.18,height+rh+.32,-hd*.5],[-hw*.42,height+rh+.32,-hd*.5]];
 poly(chim,'#dcc9a8');poly(chim.map(p=>[p[0],p[1],p[2]+.18]),'#eadab8');
 poly([[chim[0][0],height+rh+.32,-hd*.5],[chim[0][0]+.18,height+rh+.32,-hd*.5],[chim[0][0]+.18,height+rh+.32,-hd*.5+.18],[chim[0][0],height+rh+.32,-hd*.5+.18]],'#9f9d7d');
 // Front door and paper window frames.
 const front=hd+.012,doorX=tea?-.1:0,dw=width*.17,dh=height*.52;
 const door=[[-dw+doorX,.02,front],[dw+doorX,.02,front],[dw+doorX,dh*.85,front],[dw*.72+doorX,dh,front],[-dw*.72+doorX,dh,front],[-dw+doorX,dh*.85,front]];
 poly(door,'#637e67');line(door.concat([door[0]]),'#d8b784',.030);poly([[doorX-dw*.50,dh*.52,front+.012],[doorX+dw*.50,dh*.52,front+.012],[doorX+dw*.50,dh*.82,front+.012],[doorX-dw*.50,dh*.82,front+.012]],w.state.evening?'#ffd492':'#a4c0ad',{unlit:true});
 poly([[doorX+dw*.65,dh*.31,front+.02],[doorX+dw*.8,dh*.31,front+.02],[doorX+dw*.8,dh*.36,front+.02],[doorX+dw*.65,dh*.36,front+.02]],'#e4c382');
 for(const xx of[-width*.34,width*.34]){
  const a=width*.11,b=height*.14,yy=height*.49;
  poly([[xx-a,yy-b,front],[xx+a,yy-b,front],[xx+a,yy+b,front],[xx-a,yy+b,front]],w.state.evening?'#ffd48d':'#789989',{unlit:true});
  line([[xx-a,yy-b,front+.006],[xx+a,yy-b,front+.006],[xx+a,yy+b,front+.006],[xx-a,yy+b,front+.006],[xx-a,yy-b,front+.006]],'#f8e4b6',.038);
  line([[xx-a,yy,front+.014],[xx+a,yy,front+.014]],'#efdab0',.021);line([[xx,yy-b,front+.014],[xx,yy+b,front+.014]],'#efdab0',.021);
  poly([[xx-a-.05,yy-b-.065,front+.06],[xx+a+.05,yy-b-.065,front+.06],[xx+a+.05,yy-b-.02,front+.10],[xx-a-.05,yy-b-.02,front+.10]],roof);
  for(let j=0;j<4;j++)poly([[xx-a+j*a*.6,yy-b-.02,front+.11],[xx-a+.07+j*a*.6,yy-b-.02,front+.11],[xx-a+.035+j*a*.6,yy+b*.02,front+.11]],'#789367');
 }
 // Round attic window, and a fine horizontal hinge on the facade.
 const round=Array.from({length:22},(_,i)=>{const a=i/22*Math.PI*2;return[Math.cos(a)*width*.085,height+rh*.27+Math.sin(a)*width*.085,front];});poly(round,w.state.evening?'#ffda91':'#799488',{unlit:true});line(round.concat([round[0]]),'#f8e4b6',.03);
 if(tea){
  const sy=height*.86;poly([[-hw*.70,sy-.105,front+.028],[hw*.70,sy-.105,front+.028],[hw*.70,sy+.105,front+.028],[-hw*.70,sy+.105,front+.028]],'#607d64');
  w.label('森 の 喫 茶',F([0,sy,front+.036]),F([1,sy,front+.036]),F([0,sy+1,front+.036]),'#f7edcf',.115,{serif:true});
  for(let i=0;i<8;i++){const xa=-hw*.98+i*width*.98/8,xb=xa+width*.98/8;poly([[xa,height*.70,front],[xb,height*.70,front],[xb,height*.62,front+.25],[xa,height*.62,front+.25]],i%2?'#f0e6c5':'#9bad86');poly([[xa,height*.62,front+.25],[xb,height*.62,front+.25],[xb,height*.55,front+.25],[xa,height*.55,front+.25]],i%2?'#e8ddba':'#8e9f76');}
 }
 if(w.state.guides){line([[-hw,.012,hd+.02],[hw,.012,hd+.02]],'#b57153',.019,{dash:true});line([[0,height+rh+.048,-roofDepth],[0,height+rh+.048,roofDepth]],'#f1ddab',.018,{dash:true});}
 // Subtle folded-paper thickness along the foundation.
 line([[-hw,.015,hd+.025],[hw,.015,hd+.025]],'#bdb28b',.017);
}

function bridge(w){
 const lift=foldAmount(w.state.opening),steps=12;
 const P=(x,y,z)=>pagePoint([x,.03+y*lift,z+(1-lift)*y],x>=0?1:-1,w.state.opening);
 for(let i=0;i<steps;i++){const x=-.96+i/steps*2.23,x2=x+2.23/steps,y=.08+Math.sin(i/steps*Math.PI)*.26,y2=.08+Math.sin((i+1)/steps*Math.PI)*.26;
  w.poly([[x,y,1.07],[x2,y2,1.07],[x2,y2,1.60],[x,y,1.60]].map(p=>P(...p)),i%2?'#d4b783':'#ddc594',{grain:true});w.line([[x,y+.003,1.07],[x,y+.003,1.60]].map(p=>P(...p)),'#ab976b',.015);}
 for(const z of[1.045,1.625]){
  const line=[];for(let i=0;i<=steps;i++){const x=-.96+i/steps*2.23,y=.08+Math.sin(i/steps*Math.PI)*.26;line.push(P(x,y+.39,z));if(i%3===0)w.poly([[x-.025,y,z],[x+.025,y,z],[x+.025,y+.39,z],[x-.025,y+.39,z]].map(p=>P(...p)),'#bda477',{grain:true});}w.line(line,'#c8ae7b',.052);
 }
}

function smallThings(w){
 const random=seeded(68);
 // Low shrubs and three petal cutouts around the banks.
 for(let i=0;i<18;i++){
  const side=i%2?-1:1,x=side*(1.15+random()*3.9),z=-2.6+random()*5.65,a=[x,0,z],F=p=>paperPoint(p,a,w.state),r=.13+random()*.16;
  w.poly(scallop(r,r*.67,i+5).map(([x,y])=>F([x,r*.52+y,0])),i%3===0?'#bcc095':'#92a779',{grain:true});
  if(i%2===0)for(let j=0;j<3;j++){const xx=(j-1)*.10,yy=.24+random()*.10;w.line([[xx,0,0],[xx,yy,0]].map(F),'#84905e',.013);w.poly(scallop(.038,.038,j+2).map(([x,y])=>F([xx+x,yy+y,.005])),i%4===0?'#d49d77':'#e5cb80',{unlit:true});}
 }
 // A little round table and two stools outside the tea shop.
 for(const [x,z,r,hh]of[[-2.5,1.65,.27,.33],[-2.91,1.71,.13,.17],[-2.30,2.0,.13,.17]]){const a=[x,0,z],F=p=>paperPoint(p,a,w.state);w.poly([[-.035,0,0],[.035,0,0],[.035,hh,0],[-.035,hh,0]].map(F),'#9c9870');w.poly(ellipse(0,hh,0,r,r,22).map(F),'#d8bb88',{grain:true});if(r>.2){w.poly(ellipse(.03,hh+.04,0,.061,.061,16).map(F),'#f9efd0');w.line([[.07,hh+.025,0],[.11,hh+.07,0],[.065,hh+.075,0]].map(F),'#e1d3ad',.022);}}
 // Folded fox, quietly waiting by the path.
 {const a=[-1.84,0,1.13],F=p=>paperPoint(p,a,w.state),poly=(ps,c)=>w.poly(ps.map(F),c,{grain:true});
  poly([[-.1,.05,0],[.14,.05,0],[.12,.33,0],[.05,.41,0],[-.09,.35,0],[-.16,.16,0]],'#c48559');
  poly([[-.10,.31,.006],[-.14,.57,.006],[-.015,.48,.006],[.13,.55,.006],[.12,.30,.006],[.02,.24,.006]],'#ce9061');
  poly([[-.1,.31,.014],[0,.24,.014],[.1,.31,.014],[.04,.35,.014],[-.04,.35,.014]],'#f6e6be');
  poly([[-.11,.05,-.015],[-.37,.13,-.015],[-.42,.35,-.015],[-.28,.25,-.015],[-.10,.16,-.015]],'#c48559');poly([[-.42,.35,-.01],[-.28,.25,-.01],[-.33,.19,-.01],[-.39,.23,-.01]],'#f5e7c2');
  for(const xx of[-.06,.065])w.poly([[xx-.012,.383,.022],[xx+.012,.383,.022],[xx+.012,.406,.022],[xx-.012,.406,.022]].map(F),'#4b5542');}
 // Tiny lanterns: actual cut paper boxes with warm windows.
 for(const [x,z]of[[-1.24,.85],[1.51,1.53],[-4.0,.84],[3.20,1.47]]){
  const a=[x,0,z],F=p=>paperPoint(p,a,w.state),poly=(p,c,o={})=>w.poly(p.map(F),c,o),h=.91;
  poly([[-.025,0,0],[.025,0,0],[.025,h,0],[-.025,h,0]],'#8a8764');
  const c=w.state.evening?'#ffd597':'#efdfac';
  poly([[-.115,h-.17,.045],[.115,h-.17,.045],[.115,h+.02,.045],[-.115,h+.02,.045]],c,{unlit:true});
  poly([[.115,h-.17,.045],[.115,h-.17,-.065],[.115,h+.02,-.065],[.115,h+.02,.045]],'#d7c78e');
  poly([[-.16,h+.02,.08],[.16,h+.02,.08],[.1,h+.11,-.01],[-.1,h+.11,-.01]],'#688366');
  for(const xx of[-.115,.115])w.line([[xx,h-.17,.052],[xx,h+.02,.052]].map(F),'#8a8961',.019);
  w.line([[-.13,h-.17,.055],[.13,h-.17,.055]].map(F),'#8a8961',.024);
  if(w.state.evening){w.items.push({kind:'glow',points:[F([0,h-.07,.1])],radius:.5,alpha:foldAmount(w.state.opening)*.26,id:w.serial++});}
 }
 // A small sign by the bridge.
 {const a=[1.65,0,.51],F=p=>paperPoint(p,a,w.state);w.poly([[-.018,0,0],[.018,0,0],[.018,.55,0],[-.018,.55,0]].map(F),'#a29a6e');w.poly([[-.28,.38,0],[.28,.38,0],[.34,.48,0],[.28,.58,0],[-.28,.58,0]].map(F),'#e1c993',{grain:true});w.label('森の小径',F([0,.48,.01]),F([1,.48,.01]),F([0,1.48,.01]),'#788466',.083,{serif:true});}
}

export function buildWorld(state){const w=new World(normalizeState(state));book(w);terrain(w);for(const data of TREE_DATA)tree(w,...data);house(w,-3.17,-.24,1.75,1.25,1.10,C.coral,true);house(w,3.25,-.72,1.57,1.14,.96,'#b39161');bridge(w);smallThings(w);return w.items;}

export function renderScene(canvas,inputState,{width=1600,height=1060}={}){
 const state=normalizeState(inputState),W=Number.isFinite(width)?Math.max(1,Math.round(width)):1,H=Number.isFinite(height)?Math.max(1,Math.round(height)):1;
 if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
 const items=buildWorld(state),project=camera(state,W,H,items.flatMap(item=>item.points));
 const result=drawWorld(canvas,items,state,project,W,H);
 return {items:items.length,width:W,height:H,state,...result};
}
