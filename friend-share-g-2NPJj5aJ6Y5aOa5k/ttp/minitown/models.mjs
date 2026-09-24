import * as THREE from './vendor/three.module.js';
import {CELL,SIZE,seeded,boundaryEdges,plotFootprint} from './simulation.mjs';
const mats=new Map(),boxGeo=new THREE.BoxGeometry(1,1,1);
export const windows=[],glows=[];
const nightLights=new Set();
export function clearNightLights(group){group.traverse(o=>nightLights.delete(o));}
function warmLight(g,x,y,z,power=1.7){const light=new THREE.PointLight(0xffb65c,0,3.6,2);light.position.set(x,y,z);light.userData.nightPower=power;nightLights.add(light);g.add(light);return light;}
export function material(color){if(!mats.has(color))mats.set(color,new THREE.MeshStandardMaterial({color,roughness:.9,metalness:0}));return mats.get(color);}
export function box(parent,x,y,z,w,h,d,color){const m=new THREE.Mesh(boxGeo,typeof color==='object'?color:material(color));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function cylinder(parent,x,y,z,r,h,color,sides=8){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,sides),material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
const glowMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{strength:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float strength;void main(){float d=length(vUv-.5)*2.;float a=pow(max(0.,1.-d),2.5)*strength;gl_FragColor=vec4(1.,.69,.27,a);}',blending:THREE.AdditiveBlending});
export function groundGlow(parent,x,z,size){const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),glowMat);m.rotation.x=-Math.PI/2;m.position.set(x,.065,z);parent.add(m);return m;}
const windowMat=new THREE.MeshStandardMaterial({color:0x719697,emissive:0xffa945,emissiveIntensity:0,roughness:.45});
export function nightMaterials(amount,study=false){windowMat.emissiveIntensity=amount*(study?.65:1.25);windowMat.color.setHex(amount>.25?0xffcb79:0x719697);glowMat.uniforms.strength.value=amount*(study?.28:.62);for(const light of nightLights)light.intensity=amount*light.userData.nightPower;}
function windowUnit(g,x,y,z,w=.34,h=.44,side=false){const frame=box(g,x,y,z,w+.1,h+.1,.075,0xe9dbbb);const pane=box(g,x,y,z+.045,w,h,.03,windowMat);const v=box(g,x,y,z+.065,.035,h,.03,0xded4b8);const line=box(g,x,y,z+.065,w,.035,.03,0xded4b8);if(side){for(const m of [frame,pane,v,line]){const xx=m.position.x,zz=m.position.z;m.position.set(zz,y,xx);m.rotation.y=Math.PI/2;}}}
function roof(g,y,width,depth,height,color){const vertices=new Float32Array([-width/2,0,-depth/2,width/2,0,-depth/2,0,height,-depth/2,-width/2,0,depth/2,width/2,0,depth/2,0,height,depth/2]);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(vertices,3));geo.setIndex([0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4,0,1,4,0,4,3]);geo.computeVertexNormals();const m=new THREE.Mesh(geo,material(color));m.position.y=y;m.castShadow=true;m.receiveShadow=true;g.add(m);
 for(let i=1;i<6;i++){const yy=y+height*i/6,xx=width/2*(1-i/6);const a=box(g,-xx,yy,0,.026,.027,depth+.02,0x39473c);const b=box(g,xx,yy,0,.026,.027,depth+.02,0x39473c);a.material=material(color);b.material=material(color);}
 box(g,0,y+height+.02,0,.13,.09,depth+.13,color);return m;}
function sign(g,text,x,y,z,w=1.35,bg='#344c45'){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,256,64);ctx.fillStyle='#fff1ca';ctx.font='bold 36px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,128,34);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,.33),new THREE.MeshBasicMaterial({map:tex}));m.position.set(x,y,z);g.add(m);}
export function tree(parent,x,z,scale=1,seed=2){const r=seeded(seed),g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);parent.add(g);box(g,0,.55,0,.17,1.1,.19,0x6a5840);const colors=[0x5c803f,0x789344,0x8f9f4e,0x3d653b];for(let i=0;i<5;i++){const angle=i*2.4;const sz=.58+r()*.3;box(g,Math.sin(angle)*.27,1.04+r()*.38,Math.cos(angle)*.27,sz,.65+r()*.2,sz,colors[i%4]);}box(g,.08,1.67,.03,.45,.35,.43,0x8fa85a);return g;}
function fence(g,x,z,w,side=false){const group=new THREE.Group();group.position.set(x,0,z);if(side)group.rotation.y=Math.PI/2;g.add(group);for(let i=0;i<=4;i++)box(group,-w/2+w*i/4,.27,0,.065,.5,.07,0xd9d0ac);box(group,0,.24,0,w,.045,.06,0xc2b68e);box(group,0,.41,0,w,.045,.06,0xc2b68e);}
function flowerbox(g,x,z,color=0xd6968b){box(g,x,.12,z,.48,.22,.28,0x9b6349);box(g,x,.26,z,.44,.1,.25,0x69824c);for(let i=0;i<4;i++)box(g,x-.15+i*.1,.32+(i%2)*.025,z,.085,.065,.15,color);}
// A three-house study traced from the live game's tier-2 silhouette, not its cover art.
function referenceHouse(g,index,grown=false){
 const wall=[0xc3b496,0xd3c2a6,0xc3bda8][index%3],width=1.66,depth=1.52,h=grown?2.2:1.65;
 box(g,0,.17,0,width+.15,.2,depth+.14,0x716e61);
 box(g,0,h/2+.2,0,width,h,depth,wall);
 // A shallow hipped roof keeps the low, compact silhouette visible in the reference.
 const w=width/2+.2,d=depth/2+.2,y=h+.2;
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([-w,y,-d,w,y,-d,w,y,d,-w,y,d,-.5,y+.28,0,.5,y+.28,0],3));
 geo.setIndex([0,4,5,0,5,1,1,5,2,2,5,4,2,4,3,3,4,0]);geo.computeVertexNormals();
 const top=new THREE.Mesh(geo,material(0x607440));top.castShadow=true;top.receiveShadow=true;g.add(top);
 box(g,0,y-.025,0,width+.44,.09,depth+.44,0x485d32);
 for(const x of [-.52,.12])windowUnit(g,x,grown?1.93:1.43,depth/2+.04,.25,.3);
 box(g,.51,.63,depth/2+.055,.32,.86,.08,0x514a38);box(g,.61,.66,depth/2+.105,.025,.035,.025,0xe0bd6b);
 box(g,.5,.14,1.02,.6,.12,.42,0x8b806d);
 box(g,-.52,.17,1.09,.56,.13,.25,0x66533b);box(g,-.52,.34,1.19,.56,.23,.045,0x725c3d);
 box(g,-1.05,.2,.85,.22,.3,.22,0x564c3a);box(g,-1.05,.4,.85,.32,.22,.32,0x486745);
 if(grown){
  // Observed tier-3 silhouette: taller main volume, a lower side room and window planter.
  box(g,.95,.95,.1,.78,1.6,1.46,wall);box(g,.95,1.78,.1,.87,.12,1.58,0xb6ab8e);
  box(g,.95,.15,.1,.9,.2,1.6,0x716e61);
  flowerbox(g,-.22,depth/2+.16,0xd3bd67);
  const planter=g.children.slice(-6);for(const m of planter)m.position.y+=1.23;
 }
 groundGlow(g,0,1,3.9);warmLight(g,-.15,1.32,1.1,1.3);
 if(index===0){const parked=car(45,0x953c40);parked.position.set(.02,.02,1.35);parked.rotation.y=Math.PI/2;g.add(parked);}
 return g;
}
export function building(block,plot,index,phase){const random=seeded(block.seed+index*83),g=new THREE.Group();const [x,z]=plot;g.position.set((x+.5)*CELL-SIZE*CELL/2,0,(z+.5)*CELL-SIZE*CELL/2);g.userData.blockId=block.id;g.userData.plot=index;
 const footprint=plotFootprint(block.plots,plot);
 const soil=block.style==='reference'?0x75824b:block.type==='park'?0x86a961:0xb5b681;box(g,footprint.x,.055,footprint.z,footprint.width,.1,footprint.depth,soil);box(g,0,.1,1.23,.55,.045,.72,0xd5c8a6);
 if(phase<3&&block.type!=='park'){
  box(g,0,.13,0,2.05,.18,1.8,0x989382);for(let i=0;i<5;i++)box(g,-.85+i*.42,.245,-.4, .33,.07,.55,0xb8a88b);
  if(phase>=1){for(const a of [-.88,.88])for(const b of [-.73,.73])box(g,a,.75,b,.08,1.35,.08,0xb79862);for(const z of [-.73,.73])box(g,0,1.38,z,1.84,.1,.09,0xb79862);}
  if(phase>=2){box(g,0,.68,0,1.75,1.15,1.45,0xd8c59b);for(const a of [-1.1,1.1])for(const b of [-.94,.94])box(g,a,.9,b,.045,1.75,.045,0x79766b);for(const b of [-.94,.94])box(g,0,1.58,b,2.3,.08,.22,0xb3a180);}
  box(g,1.05,.22,1,.55,.4,.5,0xb38754);box(g,-1.1,.22,1,.13,.36,.15,0xf3b95a);box(g,-1.1,.035,1,.3,.06,.3,0x514e42);return g;
 }
 if(block.style==='reference'&&block.type==='home')return referenceHouse(g,index,phase>=4);
 if(block.type==='park'){
  box(g,0,.12,0,2.8,.08,.4,0xd2cba5);box(g,0,.12,0,.4,.08,2.8,0xd2cba5);
  const gardenStyle=(block.seed+index)%3;
  if(gardenStyle===0){cylinder(g,0,.25,0,.64,.26,0xd4d1b7,12);cylinder(g,0,.395,0,.51,.04,0x74b6b5,16);cylinder(g,0,.56,0,.1,.4,0xd4d1b7);const fountain=cylinder(g,0,.82,0,.23,.07,0x8fc8c6,10);g.userData.fountain=fountain;}
  else if(gardenStyle===1){cylinder(g,0,.19,0,.79,.12,0xaea884,12);cylinder(g,0,.26,0,.67,.035,0x579b9c,16);for(let i=0;i<5;i++){const a=i*1.35;cylinder(g,Math.sin(a)*.51,.29,Math.cos(a)*.46,.11,.02,0x82a45c,6);}box(g,.17,.33,.15,.16,.12,.26,0xe8dab5);box(g,.17,.43,.25,.1,.1,.1,0xe8dab5);box(g,.17,.43,.31,.05,.045,.08,0xe1af63);}
  else{box(g,0,.2,0,1.5,.15,1.3,0x8ca366);for(let i=0;i<3;i++)for(let j=0;j<3;j++){const colors=[0xdcba64,0xc6888e,0xe6d8ba];box(g,-.5+i*.5,.29,-.4+j*.4,.33,.16,.28,colors[(i+j)%3]);}for(const x of [-.72,.72])box(g,x,.35,0,.06,.55,1.5,0xccbd93);}
  groundGlow(g,0,0,3);
  tree(g,-1,-.95,.66,block.seed);tree(g,1,-.95,.8,block.seed+1);
  for(const z of [-.8,.85]){box(g,.95,.35,z,.72,.1,.27,0x9f7650);box(g,.95,.55,z-.17,.72,.35,.06,0x9f7650);for(const x of [.72,1.16])box(g,x,.18,z,.07,.3,.17,0x3e5345);}flowerbox(g,-1,1,0xe1b757);return g;
 }
 const wallColors=[0xe1d4b0,0xc4d3bd,0xe0b797,0xced4cd,0xe9debb,0xb8c9c4];const roofColors=[0x8e4e3d,0x4d7071,0x515c65,0x7c6551,0x677551];const wall=wallColors[Math.floor(random()*wallColors.length)],roofColor=roofColors[Math.floor(random()*roofColors.length)];
 if(block.type==='home'){
  const floors=phase>=4?2:1+(random()>.6?1:0);const h=floors===2?1.95:1.28;const w=1.7+random()*.24,d=1.55+random()*.22;
  box(g,0,.22,0,w+.14,.28,d+.14,0xa8a188);box(g,0,h/2+.24,0,w,h,d,wall);box(g,0,.38,0,w+.06,.13,d+.06,0xb8af95);roof(g,h+.24,w+.4,d+.4,.66,roofColor);
  for(let f=0;f<floors;f++){for(const x of [-.5,.5])windowUnit(g,x,.78+f*.85,d/2+.045,.33,.42);for(const z of [-.44,.44])windowUnit(g,z,.78+f*.85,w/2+.045,.31,.4,true);}
  box(g,0,.52,d/2+.04,.33,.62,.08,0x5f7569);box(g,0,.18,d/2+.3,.63,.12,.55,0xd4cead);box(g,0,.11,d/2+.55,.74,.1,.29,0xcac2a1);
  box(g,.51,h+.7,-.3,.24,.67,.25,0xa67b63);box(g,.51,h+1.06,-.3,.3,.1,.3,0x7b6f5f);
  for(const x of [-.48,.48])box(g,x,.7,d/2+.36,.055,1.1,.06,0xdcd1b3);const aw=box(g,0,1.3,d/2+.35,1.2,.11,.63,roofColor);aw.rotation.x=.13;
  fence(g,-1.42,0,2.6,true);fence(g,0,-1.42,2.6);tree(g,-1.15,-.95,.45,block.seed+index);flowerbox(g,-.84,1.25);flowerbox(g,.84,1.25,0xefc772);
  if(phase>=4){box(g,1.05,.47,-.55,.5,.8,.7,wall);roof(g,.92,.7,.9,.34,roofColor);}
 }else if(block.type==='shop'){
  const h=phase>=4?1.9:1.35;box(g,0,h/2+.19,0,2.15,h,1.8,wall);box(g,0,.26,0,2.25,.22,1.92,0xac9a7a);box(g,0,h+.22,0,2.32,.17,1.98,0x536a5e);box(g,0,h+.34,-.12,2.12,.13,1.68,0x83907c);
  for(const x of [-.62,.62]){windowUnit(g,x,.79,.935,.63,.72);flowerbox(g,x,1.45,0xd59a71);}box(g,0,.62,.947,.36,.93,.08,0x3d5e56);windowUnit(g,0,.7,.995,.24,.5);
  const awnColor=[0xb56752,0x527f7b,0xb19a4c][index%3];for(let i=0;i<10;i++){const m=box(g,-1.05+i*.235,1.31,1.2,.235,.09,.73,i%2?0xf1e3bc:awnColor);m.rotation.x=.2;box(g,-1.05+i*.235,1.19,1.56,.235,.22,.045,i%2?0xf1e3bc:awnColor);}
  if(h>1.5){windowUnit(g,-.62,1.76,.93,.4,.4);windowUnit(g,.62,1.76,.93,.4,.4);}sign(g,['BAKERY','MARKET','CAFE'][index%3],0,h+.12,1.01,1.45);
  box(g,-1.24,.22,.8,.27,.42,.5,0x78644b);box(g,-1.24,.45,.8,.24,.08,.45,0xd5b470);
 }else{
  const h=phase>=4?2.6:1.9;box(g,0,h/2+.19,0,2.15,h,1.85,wall);box(g,0,h+.25,0,2.35,.18,2.04,0x5e6965);box(g,0,h+.35,0,2.08,.1,1.78,0xb8b8a0);
  for(let f=0;f<(h>2?3:2);f++){for(const x of [-.65,0,.65])windowUnit(g,x,.65+f*.68,.96,.37,.4);for(const z of [-.55,.25])windowUnit(g,z,.65+f*.68,1.12,.44,.4,true);}
  box(g,0,.49,1,.44,.61,.075,0x567776);box(g,-.5,h+.58,-.3,.56,.44,.64,0x879593);box(g,.5,h+.55,-.4,.45,.36,.45,0xa8aea0);for(let i=0;i<4;i++)box(g,-.5,h+.81,-.52+i*.14,.47,.02,.045,0x5f736f);
  sign(g,['STUDIO','WORKS','OFFICE'][index%3],0,1.33,1.03,1.22);flowerbox(g,-.94,1.38,0xdad193);flowerbox(g,.94,1.38,0xdad193);
 }
 groundGlow(g,0,1.1,3.5);return g;
}
export function streetLamp(parent,x,z,lit=false){
 const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);
 if(lit){
  box(g,0,.07,0,.13,.13,.13,0x4c5050);
  box(g,0,.92,0,.038,1.76,.038,0x363b3d);
  box(g,0,1.77,0,.18,.045,.18,0x343a38);
  box(g,0,1.865,0,.11,.145,.11,windowMat);
  for(const a of [-.062,.062])for(const b of [-.062,.062])box(g,a,1.865,b,.017,.17,.017,0x343a38);
  box(g,0,1.96,0,.205,.05,.205,0x333937);
  groundGlow(g,0,0,3.2);warmLight(g,0,1.73,0,1.4);
 }else{
  box(g,0,.07,0,.18,.13,.18,0x56625c);box(g,0,.76,0,.055,1.43,.055,0x46544b);box(g,0,1.44,0,.25,.06,.25,0x5a6656);box(g,0,1.35,0,.145,.16,.145,windowMat);box(g,0,1.51,0,.3,.065,.3,0x4b5c4b);groundGlow(g,0,0,3.2);
 }return g;
}
export function person(seed){const rand=seeded(seed),g=new THREE.Group();const shirt=[0xb65f4f,0x7798ac,0xe4c578,0x67866c,0x927ea2,0xc9876b][Math.floor(rand()*6)],skin=[0xe9bf94,0xb68763,0x865c41][Math.floor(rand()*3)];box(g,0,.33,0,.15,.2,.105,shirt);box(g,0,.5,0,.115,.13,.12,skin);box(g,0,.573,-.009,.125,.035,.13,0x554834);const legs=[box(g,-.044,.13,0,.055,.2,.067,0x414e57),box(g,.044,.13,0,.055,.2,.067,0x414e57)];const arms=[box(g,-.108,.31,0,.048,.21,.059,skin),box(g,.108,.31,0,.048,.21,.059,skin)];g.userData.limbs=[...legs,...arms];return g;}
export function car(seed,colorOverride){const rand=seeded(seed),g=new THREE.Group();const color=colorOverride??[0xc17258,0x98b6ab,0xd8c687,0x839aae,0xe0d6be][Math.floor(rand()*5)];box(g,0,.24,0,.46,.22,.88,color);box(g,0,.42,-.04,.4,.2,.49,color);box(g,0,.445,.218,.34,.15,.025,0x385866);box(g,0,.445,-.3,.34,.15,.025,0x385866);for(const x of [-.21,.21])box(g,x,.435,-.05,.02,.13,.39,0x385866);for(const x of [-.245,.245])for(const z of [-.27,.27]){const w=cylinder(g,x,.15,z,.12,.07,0x34403d,10);w.rotation.z=Math.PI/2;}for(const x of [-.16,.16])box(g,x,.27,.45,.08,.055,.02,windowMat);return g;}
export function terrain(scene,study=false){const g=new THREE.Group();scene.add(g);const width=SIZE*CELL*(study?1.5:1);box(g,0,-.22,0,width,.4,width,0x768257);box(g,0,-.46,0,width-.1,.1,width-.1,0x5d684b);box(g,0,-.015,0,width,.035,width,study?0x8aac8b:0x8d9f53);
 const r=seeded(1024);for(let i=0;i<(study?0:360);i++){const x=(r()-.5)*width,z=(r()-.5)*width;box(g,x,.01,z,.1+r()*.5,.015,.1+r()*.4,[0x98aa61,0xa1b26a,0xa8b772][i%3]);}
 for(let i=0;i<56;i++){let x,z;const v=(r()-.5)*(width-1.5);if(i%4===0){x=-width/2+.6+r();z=v;}else if(i%4===1){x=width/2-.6-r();z=v;}else if(i%4===2){x=v;z=-width/2+.6+r();}else{x=v;z=width/2-.6-r();}tree(g,x,z,.65+r()*.65,i*111);}
 for(let i=0;i<20;i++){const x=(r()-.5)*(width-2),z=(i%2?1:-1)*(width/2-.8);box(g,x,.12,z,.25+r()*.25,.2+r()*.2,.3,0x8d977b);}
 return g;}
