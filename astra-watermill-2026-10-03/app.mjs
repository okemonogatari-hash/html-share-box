import * as THREE from './vendor/three.module.js';
THREE.ColorManagement.legacyMode=false;

// All forms and textures below are made for this miniature. Metres are illustrative.
const $=id=>document.getElementById(id), stage=$('stage');
let seed=4817;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const pi=Math.PI, clamp=THREE.MathUtils.clamp;
const scene=new THREE.Scene();scene.background=new THREE.Color('#e6dcc8');scene.fog=new THREE.Fog('#e6dcc8',25,55);
const camera=new THREE.PerspectiveCamera(34,1,.1,100);
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch(error){fail(error);throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.96;stage.prepend(renderer.domElement);
renderer.domElement.setAttribute('aria-label','水車小屋の3D模型。右の操作で流れと視点を変更できます。');
renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fail(new Error('WebGL context lost'));});
function fail(error){$('loading').hidden=true;$('error').hidden=false;$('error-detail').textContent=String(error?.message||error);}
window.addEventListener('unhandledrejection',event=>fail(event.reason));
window.addEventListener('error',event=>{if(event.error)fail(event.error);});

scene.add(new THREE.HemisphereLight('#fff1cf','#708064',.85));
const sun=new THREE.DirectionalLight('#ffe0aa',2.35);sun.position.set(-4,13,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-11,right:11,top:11,bottom:-11,near:1,far:32});sun.shadow.bias=-.0005;sun.shadow.normalBias=.035;sun.shadow.radius=3;scene.add(sun);
const fill=new THREE.DirectionalLight('#bedcca',.65);fill.position.set(7,5,-8);scene.add(fill);
const backlight=new THREE.DirectionalLight('#f5b85c',.6);backlight.position.set(-9,4,-8);scene.add(backlight);

function texture(kind){const c=document.createElement('canvas');c.width=256;c.height=512;const x=c.getContext('2d');x.fillStyle=kind==='wood'?'#9a703e':kind==='roof'?'#66766a':'#a6a598';x.fillRect(0,0,256,512);for(let i=0;i<1500;i++){let p=rnd()*256,q=rnd()*512;x.strokeStyle=`rgba(${kind==='roof'?'25,41,32':'48,29,12'},${.025+rnd()*.17})`;x.lineWidth=.25+rnd()*1.4;x.beginPath();x.moveTo(p,q);x.bezierCurveTo(p+Math.sin(i)*6,q+25,p+Math.sin(i)*3,q+55,p+rnd()*2,q+20+rnd()*160);x.stroke();}if(kind==='wood')for(let i=0;i<8;i++){x.save();x.translate(rnd()*256,rnd()*512);x.scale(.65,2.5);for(let j=1;j<6;j++){x.strokeStyle='#56381924';x.beginPath();x.ellipse(0,0,j*2,j*2.6,0,0,pi*2);x.stroke();}x.restore();}for(let i=0;i<5500;i++){let v=Math.floor(50+rnd()*170);x.fillStyle=`rgba(${v},${v},${v},.075)`;x.fillRect(rnd()*256,rnd()*512,1+rnd()*2,1+rnd()*3);}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
const woodTex=texture('wood'),roofTex=texture('roof'),stoneTex=texture('stone');
const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.83,...extra});
const M={wood:material('#c8a36d',{map:woodTex}),oldWood:material('#9a8056',{map:woodTex}),darkWood:material('#856541',{map:woodTex}),paleWood:material('#debd80',{map:woodTex}),roof:material('#839083',{map:roofTex}),roofDark:material('#6e796d',{map:roofTex}),stone:material('#b3afa1',{map:stoneTex}),stoneDark:material('#939888',{map:stoneTex}),plaster:material('#e7d7ad',{roughness:1}),metal:material('#5d6758',{metalness:.72,roughness:.5}),brass:material('#d5af62',{metalness:.7,roughness:.32}),soil:material('#77664d'),grass:material('#7e894d'),water:material('#277b78',{transparent:true,opacity:.86,metalness:.12,roughness:.25,side:THREE.DoubleSide}),white:material('#e8f1da',{transparent:true,opacity:.65,roughness:.3}),moss:material('#717f44'),leaf:material('#c3a856',{roughness:1}),sack:material('#dac18d'),glass:material('#a3b7a5',{metalness:.1,roughness:.18})};
const root=new THREE.Group();scene.add(root);
const boxG=new THREE.BoxGeometry(1,1,1),sphereG=new THREE.IcosahedronGeometry(1,1);
function mesh(g,m,parent=root){const o=new THREE.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function box(w,h,d,x,y,z,m=M.wood,parent=root){const o=mesh(boxG,m,parent);o.scale.set(w,h,d);o.position.set(x,y,z);return o;}
function cyl(r,rb,h,x,y,z,m=M.wood,parent=root,n=20){const o=mesh(new THREE.CylinderGeometry(r,rb,h,n),m,parent);o.position.set(x,y,z);return o;}
function ball(x,y,z,s,m=M.stone,parent=root){const o=mesh(sphereG,m,parent);o.position.set(x,y,z);o.scale.set(s,s*.7,s*.86);o.rotation.set(rnd(),rnd(),rnd());return o;}
function beam(a,b,width,depth,m=M.wood,parent=root){const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),o=box(width,from.distanceTo(to),depth,0,0,0,m,parent);o.position.copy(from.add(to).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...b).sub(new THREE.Vector3(...a)).normalize());return o;}
function torus(r,t,x,y,z,m=M.wood,parent=root,axis='x',segments=80){const o=mesh(new THREE.TorusGeometry(r,t,8,segments),m,parent);o.position.set(x,y,z);if(axis==='x')o.rotation.y=pi/2;if(axis==='y')o.rotation.x=pi/2;return o;}
function bolt(x,y,z,axis='z',parent=root){const o=cyl(.035,.035,.055,x,y,z,M.metal,parent,6);if(axis==='z')o.rotation.x=pi/2;if(axis==='x')o.rotation.z=pi/2;return o;}
function gear(r,teeth,thick,m=M.wood){const s=new THREE.Shape(),pts=[];for(let i=0;i<teeth;i++){for(const [a,rad]of[[0,r*.88],[.15,r*.88],[.23,r],[.65,r],[.75,r*.88]]){const ang=(i+a)/teeth*pi*2;pts.push([Math.cos(ang)*rad,Math.sin(ang)*rad]);}}s.moveTo(...pts[0]);pts.slice(1).forEach(p=>s.lineTo(...p));s.closePath();const hole=new THREE.Path();hole.absarc(0,0,r*.57,0,pi*2,true);s.holes.push(hole);const g=new THREE.ExtrudeGeometry(s,{depth:thick,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.015,bevelThickness:.015});g.translate(0,0,-thick/2);const group=new THREE.Group();const ring=mesh(g,m,group);ring.rotation.y=pi/2;for(let i=0;i<6;i++){const a=i*pi/3;beam([0,0,0],[0,Math.cos(a)*r*.76,Math.sin(a)*r*.76],.13,.15,m,group);}const hub=cyl(r*.16,r*.16,thick+.18,0,0,0,M.darkWood,group);hub.rotation.z=pi/2;return group;}

// A hand-shaped landscape, sliced like a small piece of the valley.
const outline=new THREE.Shape();const edge=[[-6.3,-4.5],[-4.9,-5.15],[-1.9,-5.45],[2.1,-5.2],[5.4,-4.2],[6.3,-1.8],[6.1,1.7],[5.2,4.65],[2.1,5.2],[-1.9,5.25],[-5.1,4.3],[-6.35,1.4]];outline.moveTo(...edge[0]);edge.slice(1).forEach(p=>outline.lineTo(...p));outline.closePath();const earth=mesh(new THREE.ExtrudeGeometry(outline,{depth:.45,bevelEnabled:true,bevelSegments:3,bevelSize:.23,bevelThickness:.18,steps:1}),M.soil);earth.rotation.x=-pi/2;earth.position.y=-.57;
const grass=mesh(new THREE.ShapeGeometry(outline,30),M.grass);grass.rotation.x=-pi/2;grass.position.y=.07;
const floor=mesh(new THREE.PlaneGeometry(200,200),material('#e6dcc8',{roughness:1}),scene);floor.rotation.x=-pi/2;floor.position.y=-.79;
const streamCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(2.15,.14,-5.5),new THREE.Vector3(2.7,.14,-3),new THREE.Vector3(2.4,.14,0),new THREE.Vector3(2.1,.14,2.2),new THREE.Vector3(1.2,.14,3.7),new THREE.Vector3(1.8,.14,5.25)]);
function ribbon(curve,width,yOffset=0,segments=150){const pos=[],uv=[],idx=[];for(let i=0;i<=segments;i++){const p=curve.getPoint(i/segments),t=curve.getTangent(i/segments),n=new THREE.Vector3(-t.z,0,t.x).normalize();for(let s of[-1,1]){pos.push(p.x+n.x*width*.5*s,p.y+yOffset,p.z+n.z*width*.5*s);uv.push((s+1)/2,i/segments);}}for(let i=0;i<segments;i++){let a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
const bed=mesh(ribbon(streamCurve,2.25,-.015),material('#3d645a',{side:THREE.DoubleSide}));const river=mesh(ribbon(streamCurve,1.77,.035),M.water);river.castShadow=false;const waterBase=river.geometry.attributes.position.array.slice();
for(let i=0;i<140;i++){const p=streamCurve.getPoint(rnd());const t=streamCurve.getTangent(rnd());let side=rnd()<.5?-1:1;const rock=ball(p.x+side*(.93+rnd()*.31),.15+rnd()*.1,p.z+(rnd()-.5)*.2,.09+rnd()*.19,rnd()<.5?M.stone:M.stoneDark);rock.scale.y*=.8;}
for(let i=0;i<115;i++){let x=-5.5+rnd()*10.7,z=-4.5+rnd()*8.9;if(x>1&&x<3.7)continue;if(x>-3.9&&x<1&&z>-2.4&&z<2.4)continue;const o=ball(x,.08,z,.035+rnd()*.075,rnd()<.2?M.moss:M.stone);o.scale.y=.026;}

// Foundation, individual floorboards, joinery, and an open front wall.
for(let row=0;row<3;row++)for(let i=0;i<12;i++){const x=-3.75+i*.39+(row%2)*.12;box(.37,.2,.45,x,.18+row*.2,1.53,M.stone);box(.37,.2,.45,x,.18+row*.2,-1.8,M.stoneDark);}for(let row=0;row<3;row++)for(let i=0;i<8;i++)box(.45,.2,.39,-3.67,.18+row*.2,-1.5+i*.4,M.stone);
for(let i=0;i<18;i++){const plank=box(.247,.14,3.55,-3.69+i*.253,.78,-.11,i%3===0?M.paleWood:M.wood);plank.rotation.z=(rnd()-.5)*.006;for(let z of[-1.7,1.5])bolt(-3.69+i*.253,.858,z,'y');}
for(let x of[-3.62,.62])for(let z of[-1.76,1.52]){box(.24,3.06,.26,x,2.2,z,M.darkWood);box(.32,.11,.34,x,.89,z,M.wood);box(.31,.18,.34,x,3.63,z,M.wood);for(let sign of[-1,1]){const tx=x+sign*.65;if(tx>-3.7&&tx<.7)beam([x,2.9,z],[tx,3.68,z],.14,.16);}}for(let z of[-1.76,1.52])box(4.62,.26,.26,-1.5,3.68,z,M.darkWood);for(let x of[-3.62,.62]){box(.25,.23,3.7,x,3.65,-.1,M.darkWood);beam([x,2.95,-1.76],[x,3.63,-1.07],.14,.16);beam([x,2.95,1.52],[x,3.63,.82],.14,.16);}
// Plaster infill at the far side; timber cross braces remain visible.
box(4.09,2.53,.15,-1.5,2.2,-1.76,M.plaster);for(let x of[-2.25,-.82])box(.15,2.63,.19,x,2.21,-1.72,M.darkWood);box(4.25,.13,.2,-1.5,1.8,-1.66,M.wood);beam([-3.5,.95,-1.63],[-2.35,1.75,-1.63],.1,.1,M.oldWood);beam([-.72,1.85,-1.63],[.45,3.43,-1.63],.1,.1,M.oldWood);
box(.98,1.12,.06,-1.48,2.65,-1.62,M.darkWood);box(.81,.94,.065,-1.48,2.65,-1.575,M.glass);box(.06,1.08,.08,-1.48,2.65,-1.51,M.paleWood);box(.94,.055,.08,-1.48,2.65,-1.51,M.paleWood);box(1.1,.09,.3,-1.48,2.09,-1.49,M.wood);
for(let x of[-3.61,.61])for(let z of[-1.77,1.54])for(let y of[1.05,3.47])bolt(x,y,z+.145);
const roofBack=new THREE.Group(),roofFront=new THREE.Group();root.add(roofBack,roofFront);
for(let x of[-3.84,-2.78,-1.68,-.58,.84]){beam([x,3.63,-2.02],[x,4.78,-.1],.15,.16,M.darkWood,roofBack);beam([x,4.78,-.1],[x,3.63,1.94],.15,.16,M.darkWood,roofFront);}box(5.1,.2,.2,-1.5,4.79,-.1,M.darkWood,roofBack);
for(let side of[-1,1]){const group=side<0?roofBack:roofFront;for(let row=0;row<9;row++)for(let col=0;col<17;col++){const s=(row+.5)/9;const o=box(.321,.065,.315,-4.08+col*.321+(row%2)*.06,4.84-s*1.15,-.1+side*s*2.16,(col+row)%5===0?M.roofDark:M.roof,group);o.rotation.x=side*.49+(rnd()-.5)*.018;o.position.y+=rnd()*.015;}}roofFront.visible=false;
for(let i=0;i<16;i++){const o=box(.33,.09,.3,-4.05+i*.33,4.86,-.1,M.roofDark,roofBack);o.rotation.z=(rnd()-.5)*.012;}
// The left end has planks and a ladder to a short loft.
for(let i=0;i<7;i++)box(.16,1.26,.43,-3.59,1.53,-1.4+i*.45,M.oldWood);
for(let i=0;i<13;i++)box(.31,.09,1.15,-3.45+i*.315,3.03,-1.1,M.oldWood);
for(let x of[-3.3,-2.85])beam([x,.87,.8],[x,3.17,-.35],.065,.075,M.darkWood);for(let i=0;i<10;i++)box(.52,.055,.08,-3.075,1.05+i*.213,.71-i*.105,M.paleWood);

// Overshot wheel: two timber rims, 32 little buckets, scarf joints and iron pins.
const wheel=new THREE.Group();wheel.position.set(1.65,2.04,.67);root.add(wheel);
for(let side of[-1,1]){torus(1.45,.077,side*.35,0,0,M.darkWood,wheel);torus(1.27,.06,side*.35,0,0,M.wood,wheel);torus(1.48,.018,side*.398,0,0,M.metal,wheel);for(let i=0;i<8;i++){let a=i*pi/4;beam([side*.34,0,0],[side*.34,Math.cos(a)*1.42,Math.sin(a)*1.42],.115,.14,M.wood,wheel);bolt(side*.425,Math.cos(a)*1.3,Math.sin(a)*1.3,'x',wheel);}}
for(let i=0;i<32;i++){const a=i/32*pi*2,part=new THREE.Group();part.position.set(0,Math.cos(a)*1.43,Math.sin(a)*1.43);part.rotation.x=a;wheel.add(part);box(.78,.115,.27,0,0,0,M.paleWood,part);box(.77,.18,.055,0,.08,-.12,M.oldWood,part);for(let side of[-1,1])box(.055,.17,.26,side*.355,.065,0,M.darkWood,part);}
const axle=cyl(.14,.14,5.9,-.9,2.04,.67,M.darkWood);axle.rotation.z=pi/2;const axleCap=cyl(.205,.205,.16,2.13,2.04,.67,M.brass);axleCap.rotation.z=pi/2;const hub=cyl(.29,.29,.87,0,0,0,M.wood,wheel);hub.rotation.z=pi/2;for(let xx of[-.43,.44])torus(.235,.027,xx,0,0,M.metal,wheel);
// Bearing frame on the stream bank, mortise-shaped shoulders and metal straps.
for(let z of[-.22,1.59]){box(.25,1.87,.27,2.5,1.07,z,M.darkWood);box(.44,.13,.43,2.5,.2,z,M.stone);beam([2.5,1.07,z],[2.5,1.94,.67],.12,.14,M.wood);}box(.31,.27,2.16,2.5,2.04,.67,M.wood);box(.34,.09,.45,2.5,2.225,.67,M.metal);for(let z of[.49,.84])bolt(2.68,2.22,z,'x');
for(let x of[-3.13,.35]){box(.23,1.21,.25,x,1.42,.67,M.darkWood);box(.44,.24,.46,x,2.04,.67,M.wood);torus(.15,.023,x+.231,2.04,.67,M.brass);}
const mainGear=gear(.94,40,.2,M.paleWood);mainGear.position.set(-.8,2.04,.67);root.add(mainGear);
// The upright lantern pinion meets the inner face of the main wheel.
const pinion=new THREE.Group();pinion.position.set(-1.04,1.43,1.58);root.add(pinion);
for(let y of[-.24,.24]){cyl(.32,.32,.09,0,y,0,M.darkWood,pinion);torus(.315,.026,0,y,0,M.metal,pinion,'y');}for(let i=0;i<10;i++){const a=i/10*pi*2;cyl(.044,.044,.46,Math.cos(a)*.245,0,Math.sin(a)*.245,M.paleWood,pinion,8);}cyl(.105,.105,1.8,-1.04,1.67,1.58,M.brass);
const grind=new THREE.Group();grind.position.set(-1.04,2.53,1.58);root.add(grind);cyl(.54,.59,.19,0,0,0,M.stoneDark,grind,64);cyl(.57,.57,.13,-1.04,2.36,1.58,M.stone,root,64);for(let i=0;i<12;i++){const a=i*pi/6;const o=box(.012,.005,.43,Math.sin(a)*.25,.1,Math.cos(a)*.25,M.stoneDark,grind);o.rotation.y=a;}cyl(.14,.14,.06,0,.14,0,M.brass,grind);for(let x of[-1.66,-.43])for(let z of[1.04,2.02])box(.11,1.4,.12,x,1.52,z,M.darkWood);box(1.5,.15,1.3,-1.04,2.27,1.58,M.wood);
// A timber hopper suspended above the millstone.
function hopper(){const g=new THREE.Group();g.position.set(-1.04,3.13,1.58);root.add(g);for(let a of[0,pi/2,pi,pi*1.5]){const side=box(.75,.49,.06,0,0,.24,M.paleWood,g);side.rotation.x=-.37;side.position.applyAxisAngle(new THREE.Vector3(0,1,0),a);side.rotation.y=a;}box(.9,.07,.9,0,.25,0,M.darkWood,g);box(.73,.035,.73,0,.291,0,material('#cbb57c'),g);for(let i=0;i<32;i++)ball((rnd()-.5)*.66,.32,(rnd()-.5)*.66,.02,M.sack,g);box(.17,.29,.18,0,-.34,0,M.darkWood,g);return g;}hopper();

// Flume from the hillside; gate opening is tied to the same flow as the wheel.
const flume=new THREE.Group();root.add(flume);for(let i=0;i<14;i++)box(.78,.07,.34,1.66,3.76,-4.7+i*.34,M.oldWood,flume);for(let x of[1.22,2.1]){box(.1,.43,4.94,x,3.94,-2.5,M.wood,flume);box(.125,.055,4.98,x,4.16,-2.5,M.paleWood,flume);}for(let z of[-4.35,-2.63,-.94]){for(let x of[1.18,2.14])box(.14,3.48,.16,x,1.96,z,M.darkWood);box(1.18,.16,.19,1.66,3.6,z,M.darkWood);beam([1.18,2.92,z],[1.66,3.59,z],.1,.1,M.wood);}
const channelWater=mesh(new THREE.PlaneGeometry(.77,4.87,8,40),M.water);channelWater.rotation.x=-pi/2;channelWater.position.set(1.66,3.82,-2.48);channelWater.castShadow=false;
for(let x of[1.17,2.17])box(.13,.91,.15,x,4.14,-3.27,M.darkWood);box(1.19,.12,.19,1.67,4.63,-3.27,M.darkWood);const gate=box(.83,.46,.075,1.67,4.07,-3.27,M.darkWood);cyl(.028,.028,.67,1.67,4.61,-3.27,M.brass);torus(.16,.026,1.67,4.97,-3.27,M.metal,root,'y',32);beam([1.5,4.97,-3.27],[1.84,4.97,-3.27],.03,.03,M.metal);
// Transparent falling strips are joined by white droplets at high flow.
const falling=new THREE.Group();root.add(falling);const falls=[];for(let i=0;i<9;i++){const c=new THREE.CatmullRomCurve3([new THREE.Vector3(1.34+i*.08,3.84,-.04),new THREE.Vector3(1.34+i*.08,3.73,.48),new THREE.Vector3(1.34+i*.08,3.45,1.1),new THREE.Vector3(1.34+i*.08,2.73,1.97),new THREE.Vector3(1.34+i*.08,.28,2.34)]);const o=mesh(new THREE.TubeGeometry(c,30,.017+(i%3)*.008,4,false),M.water,falling);o.castShadow=false;falls.push(o);}
const droplets=[];for(let i=0;i<90;i++){const o=mesh(new THREE.SphereGeometry(.018,5,4),M.white,falling);o.castShadow=false;droplets.push({o,phase:rnd(),x:1.27+rnd()*.83,speed:.7+rnd()*.7});}
const foam=[];for(let i=0;i<105;i++){const o=mesh(new THREE.PlaneGeometry(.035+rnd()*.09,.022+rnd()*.025),M.white);o.rotation.x=-pi/2;o.castShadow=false;foam.push({o,t:rnd(),lane:(rnd()-.5)*1.45,speed:.7+rnd()*.7});}

// Workbench, sacks, barrels, rope, pottery, a warm little lamp.
box(1.12,.12,.54,-2.41,1.61,-1.08,M.darkWood);for(let x of[-2.86,-1.98])for(let z of[-1.28,-.89])box(.075,.77,.08,x,1.18,z,M.wood);box(.41,.055,.23,-2.44,1.72,-1.01,M.paleWood);cyl(.052,.048,.28,-2.15,1.82,-1.13,M.metal);box(.18,.06,.055,-2.15,1.99,-1.13,M.metal);
function barrel(x,y,z,s=1){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(s);root.add(g);const shape=[new THREE.Vector2(0,0),new THREE.Vector2(.25,0),new THREE.Vector2(.29,.11),new THREE.Vector2(.32,.35),new THREE.Vector2(.29,.61),new THREE.Vector2(.25,.68),new THREE.Vector2(0,.68)];mesh(new THREE.LatheGeometry(shape,20),M.oldWood,g);for(let h of[.09,.2,.52,.62])torus(h<.15||h>.59?.274:.309,.021,0,h,0,M.metal,g,'y',36);for(let i=0;i<20;i++){const a=i*pi/10;beam([Math.sin(a)*.255,.03,Math.cos(a)*.255],[Math.sin(a)*.3,.5,Math.cos(a)*.3],.012,.008,M.darkWood,g);}cyl(.245,.245,.028,0,.695,0,M.wood,g,32);return g;}barrel(-3.06,.84,-.18,.84);barrel(-4.15,.1,.96,1.02);barrel(-4.45,.1,1.5,.7);
for(let i=0;i<3;i++){const s=ball(-2.55+(i%2)*.38,1.11+(i>1?.42:0),1.02,.35,M.sack);s.scale.set(.29,.43,.25);const neck=cyl(.062,.11,.07,s.position.x,s.position.y+.39,s.position.z,M.sack);torus(.077,.012,s.position.x,s.position.y+.37,s.position.z,M.darkWood,root,'y',16);}
const potMat=material('#b77e59');cyl(.21,.15,.3,-2.8,.23,2.43,potMat,root,24);cyl(.175,.175,.02,-2.8,.388,2.43,M.soil,root,24);
for(let i=0;i<7;i++){const a=i*pi*.76;beam([-2.8,.4,2.43],[-2.8+Math.cos(a)*.23,.8+rnd()*.15,2.43+Math.sin(a)*.2],.016,.016,M.moss);const o=ball(-2.8+Math.cos(a)*.23,.78+rnd()*.2,2.43+Math.sin(a)*.2,.09,M.moss);o.scale.y=.18;}
beam([.48,3.43,1.59],[.09,3.43,1.59],.037,.037,M.metal);beam([.1,3.43,1.59],[.1,3.13,1.59],.025,.025,M.metal);box(.2,.05,.2,.1,3.14,1.59,M.metal);box(.16,.23,.16,.1,2.99,1.59,material('#ffe0a0',{emissive:'#efbe71',emissiveIntensity:.5,transparent:true,opacity:.82}));box(.2,.045,.2,.1,2.85,1.59,M.metal);for(let x of[.02,.18])for(let z of[1.51,1.67])box(.018,.26,.018,x,3,z,M.metal);const lamp=new THREE.PointLight('#ffd283',.8,2.6);lamp.position.set(.1,2.97,1.59);root.add(lamp);
for(let i=0;i<5;i++)box(.95,.055,.25,-2.12,.15+i*.055,2.77,M.oldWood);for(let i=0;i<3;i++){const o=cyl(.1,.11,.92,-3.83+i*.17,.23+i*.08,2.12,M.darkWood);o.rotation.z=pi/2;}
// Small stepping stones over the mill race.
for(let i=0;i<7;i++){const o=ball(.25+i*.44,.21,3.57+Math.sin(i*.9)*.13,.3,M.stone);o.scale.set(.28,.07,.24);}

// Trees: tapered branching limbs and clustered, individually lit leaves.
const leafMats=['#647947','#7a854d','#476640','#9b944e','#5f7645'].map(c=>material(c,{roughness:1}));
const leafMeshes=leafMats.map(m=>{const o=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),m,360);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;});const leafCounts=leafMeshes.map(()=>0),dummy=new THREE.Object3D();
function tree(x,z,h,spread){cyl(.09,.22,h,x,h/2+.08,z,M.darkWood,root,9);for(let j=0;j<6;j++){let a=j*2.39+.3,bx=x+Math.cos(a)*spread*.52,bz=z+Math.sin(a)*spread*.52,by=h*(.62+rnd()*.3);beam([x,h*.43,z],[bx,by,bz],.09,.075,M.oldWood);for(let k=0;k<34;k++){let u=rnd()*pi*2,v=Math.acos(rnd()*2-1),rr=(.45+rnd()*.6)*spread*.46;dummy.position.set(bx+Math.cos(u)*Math.sin(v)*rr,by+Math.cos(v)*rr*.63,bz+Math.sin(u)*Math.sin(v)*rr);dummy.scale.set(.12+rnd()*.21,.055+rnd()*.09,.12+rnd()*.21);dummy.rotation.set(rnd(),rnd()*pi,rnd());dummy.updateMatrix();const type=Math.floor(rnd()*leafMeshes.length),at=leafCounts[type]++;if(at<360)leafMeshes[type].setMatrixAt(at,dummy.matrix);}}}
tree(-4.65,-2.65,4.4,2.2);tree(-5.3,-.05,3.55,1.85);tree(4.52,-3.48,3.8,1.9);tree(4.94,1.21,2.5,1.4);leafMeshes.forEach((o,i)=>{o.count=Math.min(360,leafCounts[i]);o.instanceMatrix.needsUpdate=true;});
// Grass tufts, daisies and reeds have restrained silhouettes and cast tiny shadows.
const tuftMat=material('#6c7e42',{side:THREE.DoubleSide});for(let i=0;i<155;i++){let x=-5.5+rnd()*10.9,z=-4.8+rnd()*9.1;if((x>-.1&&x<3.2)||(x>-3.95&&x<.9&&z>-2.2&&z<2.7))continue;for(let k=0;k<3;k++){let h=.07+rnd()*.18;const shape=new THREE.Shape();shape.moveTo(-.015,0);shape.lineTo(.025,h);shape.lineTo(.02,0);const o=mesh(new THREE.ShapeGeometry(shape),tuftMat);o.position.set(x+k*.026,.085,z);o.rotation.y=rnd()*pi;o.castShadow=false;}if(i%7===0){beam([x,.1,z],[x,.34,z],.012,.012,M.moss);ball(x,.36,z,.045,M.white);}}
for(let i=0;i<23;i++){let x=3.2+rnd()*.35,z=-1.9+rnd()*2;const h=.35+rnd()*.45;beam([x,.1,z],[x+.05,h,z],.014,.014,M.moss);cyl(.025,.027,.14,x+.05,h+.05,z,M.darkWood,root,7);}
// A few drifting leaves and dust specks make the stillness feel alive.
const motes=[];for(let i=0;i<36;i++){const o=mesh(new THREE.SphereGeometry(.011,4,3),material('#ffe7a3',{emissive:'#e9ca82',emissiveIntensity:.4,transparent:true,opacity:.45}));o.castShadow=false;motes.push({o,x:-4+rnd()*8,y:1+rnd()*4,z:-3+rnd()*6,phase:rnd()*pi*2});}

// Join immutable timber and masonry by material. The individual boards keep their
// geometry, texture coordinates and shadows while sharing far fewer draw calls.
function mergeStatic(container,excluded=new Set()){
 container.updateWorldMatrix(true,true);
 const inverse=container.matrixWorld.clone().invert(),sets=new Map(),originals=[];
 container.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;
  for(let p=o;p&&p!==container;p=p.parent)if(excluded.has(p))return;
  const key=o.material.uuid+'|'+o.castShadow+'|'+o.receiveShadow;
  if(!sets.has(key))sets.set(key,{material:o.material,cast:o.castShadow,receive:o.receiveShadow,p:[],n:[],u:[],indices:[],count:0});
  const out=sets.get(key),geo=o.geometry,positions=geo.attributes.position,normals=geo.attributes.normal,uv=geo.attributes.uv;
  const matrix=inverse.clone().multiply(o.matrixWorld),normalMatrix=new THREE.Matrix3().getNormalMatrix(matrix),v=new THREE.Vector3(),n=new THREE.Vector3();
  for(let i=0;i<positions.count;i++){
   v.fromBufferAttribute(positions,i).applyMatrix4(matrix);out.p.push(v.x,v.y,v.z);
   if(normals)n.fromBufferAttribute(normals,i).applyNormalMatrix(normalMatrix);else n.set(0,1,0);
   out.n.push(n.x,n.y,n.z);out.u.push(uv?uv.getX(i):0,uv?uv.getY(i):0);
  }
  if(geo.index)for(let i=0;i<geo.index.count;i++)out.indices.push(geo.index.getX(i)+out.count);
  else for(let i=0;i<positions.count;i++)out.indices.push(i+out.count);
  out.count+=positions.count;originals.push(o);
 });
 for(const o of originals)o.removeFromParent();
 for(const data of sets.values()){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(data.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(data.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(data.u,2));g.setIndex(data.indices);g.computeBoundingSphere();
  const m=new THREE.Mesh(g,data.material);m.castShadow=data.cast;m.receiveShadow=data.receive;container.add(m);
 }
 return {before:originals.length,after:sets.size};
}
const batching={};
for(const [name,group]of Object.entries({wheel,mainGear,pinion,grind,roofFront}))batching[name]=mergeStatic(group);
const moving=new Set([wheel,mainGear,pinion,grind,roofFront,gate,channelWater,river,falling,...foam.map(f=>f.o),...motes.map(m=>m.o)]);
batching.landscape=mergeStatic(root,moving);

// Camera gestures are local; no network or browser permissions are needed.
const views={whole:{target:[-.3,1.5,.1],theta:1.03,phi:1.02,distance:20.7},wheel:{target:[1.55,2.05,.6],theta:1.17,phi:1.18,distance:9.7},gears:{target:[-1.05,2.07,.88],theta:.42,phi:1.11,distance:8.0}};
let desired={...views.whole,target:new THREE.Vector3(...views.whole.target)},orbit={...desired,target:desired.target.clone()},view='whole',drag=false,mouse={x:0,y:0},pinch=0,pointers=new Map();
function selectView(name){view=name;stage.classList.toggle('is-close',name!=='whole');const v=views[name];desired={...v,target:new THREE.Vector3(...v.target)};document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===name);b.setAttribute('aria-pressed',String(b.dataset.view===name));});$('scene-label').textContent=name==='wheel'?'ひとつひとつの桶に、水を受けて。':name==='gears'?'大きな歯から小さな歯へ、力が渡る。':'水音の似合う、ゆっくりした時間。';}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>selectView(b.dataset.view));
const canvas=renderer.domElement;
canvas.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);drag=true;mouse={x:e.clientX,y:e.clientY};if(pointers.size===2){const p=[...pointers.values()];pinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const p=[...pointers.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);desired.distance=clamp(desired.distance*pinch/Math.max(10,d),5,31);pinch=d;}else if(drag){desired.theta-=(e.clientX-mouse.x)*.008;desired.phi=clamp(desired.phi-(e.clientY-mouse.y)*.006,.3,1.48);}mouse={x:e.clientX,y:e.clientY};});
function release(e){pointers.delete(e.pointerId);drag=pointers.size>0;if(pointers.size===1)mouse={...pointers.values().next().value};}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('wheel',e=>{e.preventDefault();desired.distance=clamp(desired.distance*Math.exp(e.deltaY*.001),5,31);},{passive:false});
let flow=.65,speed=.65,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,elapsed=0,angle=0,last=performance.now(),frames=0;
function pauseUI(){$('pause').setAttribute('aria-pressed',String(paused));$('pause-label').textContent=paused?'時をうごかす':'時をとめる';$('pause-icon').textContent=paused?'▷':'Ⅱ';$('state').textContent=paused?'ひとやすみ':flow===0?(speed>.02?'ゆっくり停止中':'水門を閉じました'):'流れています';}
$('pause').onclick=()=>{paused=!paused;pauseUI();};$('flow').oninput=e=>{flow=Number(e.target.value)/100;$('flow-value').innerHTML=`${e.target.value}<span>%</span>`;pauseUI();};$('roof').onchange=e=>{roofFront.visible=!e.target.checked;};
let savedImageURL=null;
$('save-image').onclick=()=>{$('save-status').textContent='画像を用意しています…';renderer.render(scene,camera);canvas.toBlob(blob=>{if(!blob){$('save-status').textContent='画像を保存できませんでした。もう一度お試しください。';return;}if(savedImageURL)URL.revokeObjectURL(savedImageURL);savedImageURL=URL.createObjectURL(blob);const link=document.createElement('a');link.id='saved-image-download';link.href=savedImageURL;link.download='watermill-afternoon.png';link.textContent='PNGをダウンロード ↗';$('save-status').replaceChildren(link);},'image/png');};
$('reset').onclick=()=>{flow=.65;speed=.65;paused=false;elapsed=0;angle=0;$('flow').value=65;$('flow-value').innerHTML='65<span>%</span>';$('roof').checked=true;roofFront.visible=false;selectView('whole');pauseUI();};pauseUI();
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(stage);resize();
let accumulator=0;
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;const follow=1-Math.exp(-dt*5);orbit.theta+=(desired.theta-orbit.theta)*follow;orbit.phi+=(desired.phi-orbit.phi)*follow;orbit.distance+=(desired.distance-orbit.distance)*follow;orbit.target.lerp(desired.target,follow);let distance=orbit.distance*Math.max(1,(view==='whole'?1.1:.78)/camera.aspect);camera.position.set(orbit.target.x+Math.sin(orbit.theta)*Math.sin(orbit.phi)*distance,orbit.target.y+Math.cos(orbit.phi)*distance,orbit.target.z+Math.cos(orbit.theta)*Math.sin(orbit.phi)*distance);camera.lookAt(orbit.target);
 if(!paused||frames===0){elapsed+=paused?0:dt;speed+=(flow-speed)*(1-Math.exp(-dt*1.18));if(flow===0&&speed<.0008)speed=0;angle+=speed*dt*.95;wheel.rotation.x=angle;mainGear.rotation.x=angle;pinion.rotation.y=-angle*4;grind.rotation.y=-angle*4;gate.position.y=3.98+flow*.38;falling.visible=flow>.012;channelWater.scale.x=.28+flow*.72;channelWater.material.opacity=.48+flow*.3;
  const pos=river.geometry.attributes.position;for(let i=0;i<pos.count;i++){pos.setY(i,waterBase[i*3+1]+Math.sin(waterBase[i*3]*4+elapsed*(.35+flow*2.7))*Math.cos(waterBase[i*3+2]*2.4-elapsed*1.7)*(.009+flow*.019));}pos.needsUpdate=true;
  droplets.forEach(({o,phase,x,speed:rate},i)=>{const t=(elapsed*(.35+flow*.55)*rate+phase)%1;o.visible=i<flow*90;o.position.set(x+Math.sin(t*8+i)*.055,3.81-t*t*3.64,-.03+t*2.38);o.scale.set(.55,.6+t*2.9,.5);});
  foam.forEach(({o,t,lane,speed:rate},i)=>{const s=(t+elapsed*(.006+flow*.035)*rate)%1,p=streamCurve.getPoint(s),tangent=streamCurve.getTangent(s);o.position.set(p.x-tangent.z*lane,p.y+.058+Math.sin(elapsed*2+i)*.008,p.z+tangent.x*lane);o.rotation.z=Math.atan2(tangent.x,tangent.z);o.visible=flow>.01;});
  motes.forEach(({o,x,y,z,phase})=>o.position.set(x+Math.sin(elapsed*.13+phase)*.2,y+Math.sin(elapsed*.2+phase)*.13,z+Math.cos(elapsed*.16+phase)*.16));
 }
 accumulator+=dt;if(accumulator>.2){accumulator=0;$('rpm').textContent=paused?'0.0':(speed*.95*60/(pi*2)).toFixed(1);pauseUI();}renderer.render(scene,camera);frames++;
}
// Read-only state makes independent checks possible without changing the simulation.
Object.defineProperty(window,'watermill',{value:Object.freeze({snapshot:()=>({flow,speed,paused,elapsed,angle,wheelAngle:wheel.rotation.x,mainGearAngle:mainGear.rotation.x,pinionAngle:pinion.rotation.y,millstoneAngle:grind.rotation.y,roofOpen:!roofFront.visible,view,frames,threeRevision:THREE.REVISION,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,batching}),views:Object.keys(views)})});
$('loading').hidden=true;window.__watermillReady=true;requestAnimationFrame(animate);
