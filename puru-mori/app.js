import * as THREE from './vendor/three.module.js';

// Original geometry, lighting, room and textures. The only dependency is local Three.js r147.
THREE.ColorManagement.legacyMode = false;
const canvas = document.querySelector('#jelly-canvas');
const stage = document.querySelector('.stage');
const mood = document.querySelector('#mood');
const whisper = document.querySelector('.whisper');
const touchRing = document.querySelector('.touch-ring');
const sleepButton = document.querySelector('#sleep');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = motion.matches;
let renderer;
function fail(message) {
  document.querySelector('.failure').hidden = false;
  if (message) document.querySelector('.failure p').textContent = message;
  document.querySelectorAll('button').forEach(button => { button.disabled = true; });
  canvas.dataset.ready = 'false';
}
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
} catch (error) { fail(); throw error; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.03;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf2f2e8);
const camera = new THREE.PerspectiveCamera(36, 1, .1, 60);
camera.position.set(.2,2.65,6.5);
camera.lookAt(0,1.15,0);
const root = new THREE.Group();
scene.add(root);
const hemi = new THREE.HemisphereLight(0xfafff4,0x9ba38a,.55);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xfff5df,1.15);
key.position.set(-3,5,4);
scene.add(key);
const fill = new THREE.DirectionalLight(0xc3f7f3,.50);
fill.position.set(3,2,-2);
scene.add(fill);

// A room photographed by a cube camera: the window panes become real environment reflections.
const environment = new THREE.Scene();
environment.background = new THREE.Color(0xcedacb);
const room = new THREE.Mesh(new THREE.SphereGeometry(9,64,40),new THREE.ShaderMaterial({
  side:THREE.BackSide,
  uniforms:{lowerRoom:{value:new THREE.Color(0x74796c)},middleRoom:{value:new THREE.Color(0xb4c0af)},upperRoom:{value:new THREE.Color(0xd4ddc8)}},
  vertexShader:`varying vec3 roomDirection;void main(){roomDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`varying vec3 roomDirection;uniform vec3 lowerRoom;uniform vec3 middleRoom;uniform vec3 upperRoom;
    void main(){float elevation=normalize(roomDirection).y;
      vec3 color=mix(lowerRoom,middleRoom,smoothstep(-.75,.30,elevation));
      color=mix(color,upperRoom,smoothstep(.18,.90,elevation));gl_FragColor=vec4(color,1.0);}`
}));
environment.add(room);
function lightPanel(x,y,z,width,height,intensity,rotation = 0) {
  const material = new THREE.MeshBasicMaterial({color:new THREE.Color(1,1,.96).multiplyScalar(intensity),side:THREE.DoubleSide});
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);
  panel.position.set(x,y,z); panel.rotation.y = rotation;
  environment.add(panel);
}
for (const x of [-2.95,-1.45]) for (const y of [1.8,3.9]) lightPanel(x,y,4.5,1.32,1.9,4.6,-.30);
lightPanel(5,2,1.2,1.2,5,1.6,-1.1);
lightPanel(-1,5,-4,4,2,2.0,0);
lightPanel(.6,4.3,3.7,.32,.50,6.5,-.12);
lightPanel(1.20,3.6,4.1,.18,.29,5.0,-.18);
const envFloor = new THREE.Mesh(new THREE.PlaneGeometry(16,16),new THREE.MeshBasicMaterial({color:0x74796c,side:THREE.DoubleSide}));
envFloor.rotation.x = -Math.PI/2; envFloor.position.y=-3; // The room gradient replaces a hard floor horizon in reflections.
const pmrem = new THREE.PMREMGenerator(renderer);
const environmentMap = pmrem.fromScene(environment,.015,.1,30);
scene.environment = environmentMap.texture;
pmrem.dispose();

function texture(width,height,draw) {
  const surface=document.createElement('canvas'); surface.width=width;surface.height=height;
  draw(surface.getContext('2d'),width,height);
  const result=new THREE.CanvasTexture(surface);result.encoding=THREE.sRGBEncoding;
  return result;
}
const wallTexture=texture(1024,512,(ctx,w,h)=>{
  const gradient=ctx.createLinearGradient(0,0,w,h);
  gradient.addColorStop(0,'#f9faef');gradient.addColorStop(.5,'#e5eddc');gradient.addColorStop(1,'#ccdccc');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  // Soft window light, painted from scratch rather than an external room photograph.
  ctx.save();ctx.translate(w*.27,h*.23);ctx.rotate(-.23);
  ctx.shadowBlur=40;ctx.shadowColor='#ffffff';ctx.fillStyle='rgba(255,255,245,.53)';
  for(let x=0;x<2;x++)for(let y=0;y<2;y++)ctx.fillRect(x*190,y*180,172,162);
  ctx.restore();
});
const wall=new THREE.Mesh(new THREE.PlaneGeometry(18,8),new THREE.MeshBasicMaterial({map:wallTexture}));
wall.position.set(0,3,-4); // Window light is used only by the reflection environment.
const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({color:0xe5eadb,roughness:.9}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.26;
// A soft-edged porcelain-green tray; no marble image or borrowed surface.
const trayProfile=[new THREE.Vector2(0,-.22),new THREE.Vector2(3.1,-.22),new THREE.Vector2(3.24,-.18),new THREE.Vector2(3.29,-.08),new THREE.Vector2(3.25,-.025),new THREE.Vector2(3.15,0),new THREE.Vector2(0,0)];
const tray=new THREE.Mesh(new THREE.LatheGeometry(trayProfile,128),new THREE.MeshPhysicalMaterial({color:0xf2f1dc,roughness:.48,metalness:0,clearcoat:.20,clearcoatRoughness:.35}));
// Opaque-looking decor stays out of the refraction capture to avoid a giant tray rim inside the jelly.
tray.material.transparent=true;tray.material.opacity=1;tray.material.depthWrite=false;
scene.add(tray);
tray.material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vTrayPoint;').replace('#include <begin_vertex>','#include <begin_vertex>\nvTrayPoint=(modelMatrix*vec4(position,1.0)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vTrayPoint;').replace('#include <color_fragment>',`#include <color_fragment>
    float windowPool=exp(-pow((vTrayPoint.x+1.2+vTrayPoint.z*.45)/1.5,2.0));
    float softShade=exp(-pow((vTrayPoint.x-2.1)/1.1,2.0)-pow((vTrayPoint.z+1.0)/2.4,2.0));
    diffuseColor.rgb*=.93+.13*windowPool-.06*softShade;
  `);
};

const backRim=new THREE.Mesh(new THREE.CylinderGeometry(3.18,3.23,.32,96,1,true,Math.PI/2,Math.PI),new THREE.MeshStandardMaterial({color:0xdde8cf,roughness:.6,side:THREE.DoubleSide}));
backRim.material.transparent=true;backRim.material.opacity=1;backRim.material.depthWrite=false;backRim.position.y=.13;scene.add(backRim);
const rimCurve=[];for(let i=0;i<=80;i++){const a=Math.PI/2+i/80*Math.PI;rimCurve.push(new THREE.Vector3(Math.sin(a)*3.18,.29,Math.cos(a)*3.18));}
const rimTop=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimCurve),96,.025,8,false),new THREE.MeshStandardMaterial({color:0xf5f7e9,roughness:.4}));rimTop.material.transparent=true;rimTop.material.opacity=1;rimTop.material.depthWrite=false;scene.add(rimTop);

const trayShadowTexture=texture(256,256,(ctx,w,h)=>{
  const g=ctx.createRadialGradient(w/2,h/2,30,w/2,h/2,w/2);g.addColorStop(0,'rgba(54,77,51,.19)');g.addColorStop(.65,'rgba(54,77,51,.12)');g.addColorStop(1,'rgba(54,77,51,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
});
const trayShadow=new THREE.Mesh(new THREE.PlaneGeometry(7.8,7.8),new THREE.MeshBasicMaterial({map:trayShadowTexture,transparent:true,depthWrite:false}));
trayShadow.rotation.x=-Math.PI/2;trayShadow.position.y=-.245;scene.add(trayShadow);
const shadowTexture=texture(256,256,(ctx,w,h)=>{
  const g=ctx.createRadialGradient(w/2,h/2,8,w/2,h/2,w/2);g.addColorStop(0,'rgba(58,102,86,.30)');g.addColorStop(.36,'rgba(67,116,93,.21)');g.addColorStop(.72,'rgba(75,122,99,.06)');g.addColorStop(1,'rgba(75,122,99,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
});
const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3,2.9),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));
shadow.rotation.x=-Math.PI/2;shadow.position.y=.004;scene.add(shadow);

const contactTexture=texture(192,192,(ctx,w,h)=>{
  const g=ctx.createRadialGradient(w/2,h/2,8,w/2,h/2,w*.48);
  g.addColorStop(0,'rgba(51,61,43,.42)');g.addColorStop(.48,'rgba(57,69,47,.28)');g.addColorStop(.76,'rgba(66,78,56,.10)');g.addColorStop(1,'rgba(66,78,56,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
});
const contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.9),new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false}));
contactShadow.rotation.x=-Math.PI/2;contactShadow.position.y=.005;scene.add(contactShadow);
const reflectionTexture=texture(256,192,(ctx,w,h)=>{
  const g=ctx.createRadialGradient(w/2,h*.50,2,w/2,h*.50,w*.49);
  g.addColorStop(0,'rgba(255,255,255,.35)');g.addColorStop(.40,'rgba(255,255,255,.20)');g.addColorStop(.74,'rgba(255,255,255,.07)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
});
const reflection=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.25),new THREE.MeshBasicMaterial({map:reflectionTexture,color:0xf2ba57,transparent:true,opacity:.45,depthWrite:false}));
reflection.rotation.x=-Math.PI/2;reflection.position.y=.007;scene.add(reflection);

const causticTexture=texture(256,256,(ctx,w,h)=>{
  ctx.translate(w/2,h/2);
  const gradient=ctx.createRadialGradient(0,0,22,0,0,112);
  gradient.addColorStop(0,'rgba(136,255,231,.05)');gradient.addColorStop(.54,'rgba(118,240,219,.18)');gradient.addColorStop(.70,'rgba(237,255,222,.32)');gradient.addColorStop(.79,'rgba(154,242,213,.10)');gradient.addColorStop(1,'rgba(120,235,216,0)');
  ctx.fillStyle=gradient;ctx.fillRect(-w/2,-h/2,w,h);
  ctx.strokeStyle='rgba(255,255,231,.20)';ctx.lineWidth=3;ctx.shadowColor='#b9fff0';ctx.shadowBlur=8;
  // Keep the caustic broad and diffuse; no decorative luminous rings.
});
const caustic=new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.6),new THREE.MeshBasicMaterial({map:causticTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
caustic.rotation.x=-Math.PI/2;caustic.position.y=.008;scene.add(caustic);

const flavors={
  mint:{color:0xffe4a1,attenuation:0xf0c16b,glow:0xffdfa0,name:'はちみつ色'},
  peach:{color:0xc4f1fb,attenuation:0x72bcd7,glow:0xabebff,name:'しずく色'},
  grape:{color:0xe3d5ff,attenuation:0xb293da,glow:0xe2c6ff,name:'すみれ色'}
};
const jellyMaterial=new THREE.MeshPhysicalMaterial({color:flavors.mint.color,metalness:0,roughness:.075,transmission:.985,thickness:1.40,ior:1.34,clearcoat:.62,clearcoatRoughness:.065,attenuationColor:flavors.mint.attenuation,attenuationDistance:1.25,envMapIntensity:1.35});

function gelOptics(material,edgeStrength=1){
  material.onBeforeCompile=shader=>{
    const chunk=THREE.ShaderChunk.transmission_fragment.replace('material.thickness = thickness;',`
      float gelFacing=clamp(dot(geometry.normal,geometry.viewDir),0.0,1.0);
      material.thickness=thickness*(.82+${edgeStrength.toFixed(2)}*pow(1.0-gelFacing,1.35));
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <transmission_fragment>',chunk);
  };
  material.customProgramCacheKey=()=>`gel-volume-v3-${edgeStrength}`;
}
gelOptics(jellyMaterial,1.25);

const geometry=new THREE.SphereGeometry(1,96,72);
const vertices=geometry.attributes.position;
const unitPositions=new Float32Array(vertices.array);
let restHeight=.66;
let petType='capybara';
let flavorName='mint';
for(let i=0;i<vertices.count;i++){
  const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i);
  const width=1.05+(1-y)*.18;
  vertices.setXYZ(i,x*width,Math.max(-.66,y*.82),z*(.99+(1-y)*.07));
}
geometry.computeVertexNormals();
const base=new Float32Array(vertices.array);
const baseNormals=new Float32Array(geometry.attributes.normal.array);
const offsets=new Float32Array(base.length), velocities=new Float32Array(base.length);
const jelly=new THREE.Mesh(geometry,jellyMaterial);root.add(jelly);
const vertexColors=new Float32Array(base.length);vertexColors.fill(1);geometry.setAttribute('color',new THREE.BufferAttribute(vertexColors,3));jellyMaterial.vertexColors=true;
geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,0,0),2.2);
const anchors=[];
function anchor(object,point){
  object.position.copy(point);root.add(object);
  let index=0,min=Infinity;
  for(let i=0;i<base.length;i+=3){const d=(base[i]-point.x)**2+(base[i+1]-point.y)**2+(base[i+2]-point.z)**2;if(d<min){min=d;index=i;}}
  const difference=new THREE.Vector3(point.x-base[index],point.y-base[index+1],point.z-base[index+2]);
  anchors.push({object,index,difference,original:point.clone()});
}
function sphere(parent,pos,scale,material,segments=32){const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,segments,24),material);mesh.position.set(...pos);mesh.scale.set(...scale);parent.add(mesh);return mesh;}
const earMaterial=jellyMaterial.clone();earMaterial.vertexColors=false;earMaterial.thickness=.36;earMaterial.attenuationDistance=.85;gelOptics(earMaterial,.60);
const ears=[];
for(const side of [-1,1]){
  const ear=new THREE.Group();
  sphere(ear,[0,0,0],[.16,.19,.14],earMaterial);
  anchor(ear,new THREE.Vector3(side*.54,.69,-.025));ears.push(ear);
}
const ink=new THREE.MeshBasicMaterial({color:0x17261e,transparent:true,opacity:1,depthWrite:false});
const glint=new THREE.MeshBasicMaterial({color:0xf9fff4,transparent:true,opacity:1,depthWrite:false});
const eyes=[];
for(const side of [-1,1]){
  const group=new THREE.Group();group.rotation.y=side*.22;
  const open=sphere(group,[0,0,.005],[.076,.10,.035],ink);
  sphere(open,[-.22,.29,.91],[.20,.15,.12],glint,16);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.08,-.005,.03),new THREE.Vector3(-.035,.023,.039),new THREE.Vector3(.035,.023,.039),new THREE.Vector3(.08,-.005,.03)]);
  const closed=new THREE.Mesh(new THREE.TubeGeometry(curve,16,.013,6,false),ink);closed.visible=false;group.add(closed);
  anchor(group,new THREE.Vector3(side*.40,.22,.992));eyes.push({group,open,closed});
}
const mouth=new THREE.Group();
const mouthCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.04,.01,0),new THREE.Vector3(0,-.008,.009),new THREE.Vector3(.04,.01,0)]);
mouth.add(new THREE.Mesh(new THREE.TubeGeometry(mouthCurve,12,.008,5,false),ink));
anchor(mouth,new THREE.Vector3(0,-.18,1.073));

// A generous rounded muzzle belongs to the capybara; every feature rides a body vertex.
const muzzleMaterial=jellyMaterial.clone();muzzleMaterial.vertexColors=false;muzzleMaterial.thickness=.70;muzzleMaterial.attenuationDistance=1.35;muzzleMaterial.roughness=.085;gelOptics(muzzleMaterial,.65);
const muzzle=new THREE.Group();
sphere(muzzle,[0,0,0],[.58,.285,.29],muzzleMaterial,48);
for(const side of [-1,1])sphere(muzzle,[side*.19,.025,.277],[.042,.024,.016],ink,24);
const smileCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.11,-.105,.264),new THREE.Vector3(0,-.127,.281),new THREE.Vector3(.11,-.105,.264)]);
muzzle.add(new THREE.Mesh(new THREE.TubeGeometry(smileCurve,16,.006,5,false),ink));
anchor(muzzle,new THREE.Vector3(0,-.055,1.025));
const wingMaterial=jellyMaterial.clone();wingMaterial.vertexColors=false;wingMaterial.thickness=.38;wingMaterial.attenuationDistance=1.4;gelOptics(wingMaterial,.70);
const headAccentMaterial=jellyMaterial.clone();headAccentMaterial.vertexColors=false;headAccentMaterial.thickness=.20;gelOptics(headAccentMaterial,.5);
const beakMaterial=new THREE.MeshPhysicalMaterial({color:0xf7a12b,roughness:.16,transmission:.35,thickness:.20,ior:1.3,clearcoat:.7,attenuationColor:0xf7ae32,attenuationDistance:.5});
const beak=new THREE.Group();sphere(beak,[0,0,.025],[.125,.11,.16],beakMaterial);sphere(beak,[0,-.07,.03],[.085,.065,.085],beakMaterial);
anchor(beak,new THREE.Vector3(0,.08,1.028));
const wings=[];
for(const side of [-1,1]){
  const wing=new THREE.Group();sphere(wing,[0,0,0],[.16,.36,.29],wingMaterial);wing.rotation.z=side*-.24;anchor(wing,new THREE.Vector3(side*1.03,-.06,0));wings.push(wing);
}
const tail=new THREE.Group();
for(let i=-1;i<=1;i++){const feather=sphere(tail,[i*.12,0,-.15-Math.abs(i)*.015],[.12,.075,.40],wingMaterial);feather.rotation.y=i*.15;}
anchor(tail,new THREE.Vector3(.29,-.45,-.80));
const crest=new THREE.Group();
const feather=sphere(crest,[0,.06,0],[.095,.19,.095],headAccentMaterial);feather.rotation.z=-.20;
anchor(crest,new THREE.Vector3(.04,.83,-.05));
const birdFeatures=[beak,...wings,tail,crest];birdFeatures.forEach(feature=>feature.visible=false);
mouth.visible=false;

// Sparse bubbles seen through the transmitted surface provide a quiet cue to volume.
const bubbleMaterial=new THREE.MeshPhysicalMaterial({color:0xeefff6,roughness:.08,metalness:0,transparent:true,opacity:.32,clearcoat:1,envMapIntensity:1.3});
const bubbles=[];
for(const [x,y,z,r] of [[-.49,-.19,.28,.048],[.36,.43,-.13,.04],[-.24,.46,-.26,.025],[.47,-.31,.15,.027]]){
  const bubble=sphere(root,[x,y,z],[r,r,r],bubbleMaterial,20);bubbles.push({bubble,base:new THREE.Vector3(x,y,z),phase:y*9});
}

let time=0,previous=performance.now();
let sleeping=false,pointerId=null,gesture=null,auto=null;
let statusKey='';
let collisionCount=0,lastCollision='none';
let affection=0,blink=0,nextBlink=3.2;
let squish=0,squishVelocity=0;
let shapeY=1,shapeX=1,shapeZ=1;
let sideSquish=0,sideSquishVelocity=0,depthSquish=0,depthSquishVelocity=0;
const impactRipples=[];
const surfaceWaves=[];
let lastAction=-10;
let maxX=1.4;
const position=new THREE.Vector3(0,0,0); // y is the height of the body above its resting contact.
const velocity=new THREE.Vector3();
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
const cameraNormal=new THREE.Vector3();
const dragPlane=new THREE.Plane();
const tempA=new THREE.Vector3(),tempB=new THREE.Vector3(),tempC=new THREE.Vector3(),bary=new THREE.Vector3();
const dragTarget=new THREE.Vector3();
let contact=null;
const handVelocity=new THREE.Vector3();
let lastHand=null,lastHandTime=0;

function state(key,text,word=''){
  if(key===statusKey)return;statusKey=key;
  mood.textContent=text;whisper.textContent=word;whisper.classList.toggle('visible',Boolean(word));
  canvas.dataset.state=key;
}
function wake(){sleeping=false;sleepButton.setAttribute('aria-pressed','false');sleepButton.querySelector('span').textContent='おやすみ';}
function aim(event){const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);}
function pick(event){
  aim(event);const hit=ray.intersectObject(jelly,false)[0];if(!hit)return null;
  const point=root.worldToLocal(hit.point.clone());
  tempA.fromBufferAttribute(vertices,hit.face.a);tempB.fromBufferAttribute(vertices,hit.face.b);tempC.fromBufferAttribute(vertices,hit.face.c);
  THREE.Triangle.getBarycoord(point,tempA,tempB,tempC,bary);
  const original=new THREE.Vector3(),normal=new THREE.Vector3();
  const indices=[hit.face.a*3,hit.face.b*3,hit.face.c*3],weights=[bary.x,bary.y,bary.z];
  indices.forEach((index,j)=>{const w=weights[j];original.x+=base[index]*w;original.y+=base[index+1]*w;original.z+=base[index+2]*w;normal.x+=baseNormals[index]*w;normal.y+=baseNormals[index+1]*w;normal.z+=baseNormals[index+2]*w;});
  return {point:original,normal:normal.normalize(),world:hit.point.clone(),age:0,depth:.32};
}
function ring(event,show){const r=stage.getBoundingClientRect();touchRing.style.left=`${event.clientX-r.left}px`;touchRing.style.top=`${event.clientY-r.top}px`;touchRing.classList.toggle('visible',show);}
canvas.addEventListener('pointerdown',event=>{
  if(pointerId!==null||(event.pointerType==='mouse'&&event.button!==0))return;
  const hit=pick(event);if(!hit)return;
  event.preventDefault();wake();auto=null;pointerId=event.pointerId;canvas.setPointerCapture(pointerId);
  contact=hit;kick(hit.normal);emitWave(hit.normal,.065,-.12);gesture={startX:event.clientX,startY:event.clientY,dragging:false,start:time};
  camera.getWorldDirection(cameraNormal);dragPlane.setFromNormalAndCoplanarPoint(cameraNormal,hit.world);
  dragTarget.copy(hit.world);lastHand=hit.world.clone();lastHandTime=time;handVelocity.set(0,0,0);
  lastAction=time;ring(event,true);state('poke','ふにゅ…','ふにゅ');
});
canvas.addEventListener('pointermove',event=>{
  if(pointerId!==event.pointerId){if(pointerId===null&&event.pointerType==='mouse')canvas.style.cursor=pick(event)?'grab':'default';return;}
  event.preventDefault();ring(event,true);aim(event);
  const target=new THREE.Vector3();if(!ray.ray.intersectPlane(dragPlane,target))return;
  if(Math.hypot(event.clientX-gesture.startX,event.clientY-gesture.startY)>7)gesture.dragging=true;
  if(!gesture.dragging)return;
  target.x=THREE.MathUtils.clamp(target.x,-maxX-.5,maxX+.5);
  target.y=THREE.MathUtils.clamp(target.y,.20,2.65);
  target.z=THREE.MathUtils.clamp(target.z,-2.4,2.0);
  const dt=Math.max(.012,time-lastHandTime);
  tempA.subVectors(target,lastHand).divideScalar(dt).clampLength(0,7);
  handVelocity.lerp(tempA,.48);lastHand.copy(target);lastHandTime=time;dragTarget.copy(target);
  lastAction=time;state('lift','ひょい。','ひょい');
});
function release(cancelled=false){
  const id=pointerId;pointerId=null;
  if(id!==null&&contact&&!cancelled&&!gesture?.dragging)emitWave(contact.normal,.11,0);
  if(gesture?.dragging){
    if(!cancelled&&!reduced){velocity.x+=handVelocity.x*.36;velocity.y+=handVelocity.y*.36;velocity.z+=handVelocity.z*.7;velocity.clampLength(0,6);}
    state('fall','ぷるん、って戻る。','ぷるん');
  }else if(id!==null){
    if(!cancelled&&contact&&time-gesture.start<.22)auto={type:'tap',start:time,point:contact.point.clone(),normal:contact.normal.clone()};
    state('ripple','ぷるぷる…','ぷる…');
  }
  if(id!==null)lastAction=time;
  gesture=null;contact=null;lastHand=null;touchRing.classList.remove('visible');
  if(id!==null&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
}
canvas.addEventListener('pointerup',event=>{if(event.pointerId===pointerId)release();});
canvas.addEventListener('pointercancel',event=>{if(event.pointerId===pointerId)release(true);});
canvas.addEventListener('lostpointercapture',event=>{if(event.pointerId===pointerId)release(true);});
function stopHand(){release(true);auto=null;contact=null;velocity.x*=.25;velocity.z*=.25;}
window.addEventListener('blur',stopHand);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopHand();});
motion.addEventListener('change',event=>{reduced=event.matches;stopHand();});
canvas.addEventListener('keydown',event=>{
  const directions={ArrowUp:new THREE.Vector3(0,0,1),ArrowDown:new THREE.Vector3(0,0,-1),ArrowLeft:new THREE.Vector3(1,0,0),ArrowRight:new THREE.Vector3(-1,0,0)};
  if(!directions[event.key])return;event.preventDefault();stopHand();wake();kick(directions[event.key],2.4);lastAction=time;state('roll','ころん、ぷるん。','ころん');
});
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();stopHand();fail('描画が中断されました。このページを再読み込みしてください。');});

function run(type){stopHand();wake();auto={type,start:time};if(type==='poke'){const normal=new THREE.Vector3(.42,.05,.9).normalize();kick(normal);emitWave(normal,.075,-.12);}lastAction=time;state(type,type==='poke'?'ふにゅ…':'ひょい。',type==='poke'?'ふにゅ':'ひょい');}
document.querySelector('#poke').addEventListener('click',()=>run('poke'));
document.querySelector('#drop').addEventListener('click',()=>run('drop'));
sleepButton.addEventListener('click',()=>{
  stopHand();sleeping=!sleeping;lastAction=time;sleepButton.setAttribute('aria-pressed',String(sleeping));sleepButton.querySelector('span').textContent=sleeping?'おはよう':'おやすみ';
  state(sleeping?'sleep':'idle',sleeping?'すぅ…、ぷる…':'ぷるぷる、してる。',sleeping?'すぅ…':'');
});
document.querySelectorAll('.flavor').forEach(button=>button.addEventListener('click',()=>{
  flavorName=button.dataset.flavor;applyPalette();
  document.querySelectorAll('.flavor').forEach(other=>{const active=other===button;other.setAttribute('aria-pressed',String(active));other.classList.toggle('selected',active);});
  canvas.dataset.flavor=flavorName;mood.textContent=`${petType==='parakeet'&&flavorName==='mint'?'わかば色':flavors[flavorName].name}に、ぷるん。`;lastAction=time;
}));
function reanchor(object,point){
  const a=anchors.find(entry=>entry.object===object);if(point)a.original.copy(point);
  let min=Infinity,index=0;
  for(let i=0;i<base.length;i+=3){const d=(base[i]-a.original.x)**2+(base[i+1]-a.original.y)**2+(base[i+2]-a.original.z)**2;if(d<min){min=d;index=i;}}
  a.index=index;a.difference.set(a.original.x-base[index],a.original.y-base[index+1],a.original.z-base[index+2]);
}
function applyPalette(){
  const flavor=flavors[flavorName];
  const bird=petType==='parakeet';
  jellyMaterial.color.setHex(bird?0xffffff:flavor.color);
  jellyMaterial.attenuationColor.setHex(bird?0xc8e78e:flavor.attenuation);
  jellyMaterial.attenuationDistance=bird?1.50:1.25;
  earMaterial.color.setHex(flavor.color);earMaterial.attenuationColor.setHex(flavor.attenuation);
  muzzleMaterial.color.setHex(flavor.color);muzzleMaterial.attenuationColor.setHex(flavor.attenuation);
  const low=new THREE.Color(flavorName==='mint'?0xa4dc65:flavorName==='peach'?0x85cbdc:0xc4a5e3);
  const high=new THREE.Color(0xffe65d),color=new THREE.Color();
  for(let i=0;i<base.length;i+=3){
    if(bird){const amount=THREE.MathUtils.smoothstep(base[i+1],-.30,.92);color.copy(low).lerp(high,amount);vertexColors[i]=color.r;vertexColors[i+1]=color.g;vertexColors[i+2]=color.b;}
    else{vertexColors[i]=vertexColors[i+1]=vertexColors[i+2]=1;}
  }
  geometry.attributes.color.needsUpdate=true;
  wingMaterial.color.copy(low);wingMaterial.attenuationColor.setHex(0x9acb53);
  headAccentMaterial.color.setHex(0xffd937);headAccentMaterial.attenuationColor.setHex(0xe8c842);
  caustic.material.color.setHex(bird?0xc4f8a0:flavor.glow);
  reflection.material.color.setHex(bird?0xb2d961:flavorName==='mint'?0xf3be64:flavorName==='peach'?0x8acfe0:0xc2a5e3);
}
function selectPet(type){
  stopHand();wake();petType=type;const bird=type==='parakeet';
  position.set(0,0,0);velocity.set(0,0,0);squish=squishVelocity=sideSquish=sideSquishVelocity=depthSquish=depthSquishVelocity=0;
  offsets.fill(0);velocities.fill(0);impactRipples.length=0;surfaceWaves.length=0;restHeight=bird?.73:.66;
  for(let i=0;i<base.length;i+=3){
    const x=unitPositions[i],y=unitPositions[i+1],z=unitPositions[i+2];
    base[i]=x*(bird?1.06+(1-y)*.075:1.05+(1-y)*.18);
    base[i+1]=Math.max(-restHeight,y*(bird?.93:.82));
    base[i+2]=z*(bird?1.01:.99+(1-y)*.07);
  }
  vertices.array.set(base);geometry.computeVertexNormals();baseNormals.set(geometry.attributes.normal.array);
  ears.forEach(ear=>ear.visible=!bird);muzzle.visible=!bird;birdFeatures.forEach(feature=>feature.visible=bird);mouth.visible=false;
  eyes.forEach((eye,i)=>reanchor(eye.group,new THREE.Vector3((i?1:-1)*(bird?.31:.40),bird?.23:.22,bird?.94:.992)));
  anchors.forEach(a=>reanchor(a.object));
  applyPalette();lastAction=time;state('idle',bird?'インコ、ぷるぷる。':'カピバラ、ぷるぷる。');
  canvas.dataset.pet=type;document.body.dataset.pet=type;
  document.querySelector('.flavors button[data-flavor="mint"]').setAttribute('aria-label',bird?'わかば色':'はちみつ色');
  document.querySelectorAll('.companions button').forEach(button=>{const chosen=button.dataset.pet===type;button.classList.toggle('chosen',chosen);button.setAttribute('aria-pressed',String(chosen));});
  canvas.setAttribute('aria-label',`${bird?'インコ':'カピバラ'}の透明なゼリー。つつくと奥に動き、ドラッグで持ち上げ、離すと弾みます。下のボタンでも遊べます。`);
}
document.querySelectorAll('.companions button').forEach(button=>button.addEventListener('click',()=>selectPet(button.dataset.pet)));
document.querySelector('#photo').addEventListener('click',()=>{
  renderer.render(scene,camera);
  const photo=document.createElement('canvas');photo.width=canvas.width;photo.height=canvas.height+Math.round(canvas.height*.15);
  const ctx=photo.getContext('2d');ctx.fillStyle='#f2f2e8';ctx.fillRect(0,0,photo.width,photo.height);ctx.drawImage(canvas,0,0);
  ctx.fillStyle='#637d67';ctx.textAlign='center';ctx.font=`${Math.round(photo.width*.025)}px "Hiragino Mincho ProN",serif`;ctx.fillText('ぷるもり。',photo.width/2,photo.height*.96);
  photo.toBlob(blob=>{if(!blob){mood.textContent='写真を用意できませんでした。';return;}const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='ぷるもり.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);mood.textContent='写真を用意しました。';},'image/png');
});

function updateAuto(){
  if(!auto)return;const elapsed=time-auto.start;
  if(auto.type==='poke'||auto.type==='tap'){
    if(elapsed>.6){if(contact)emitWave(contact.normal,.105,0);contact=null;auto=null;lastAction=time;state('ripple','ぷるぷる…','ぷる…');return;}
    contact={point:auto.point||new THREE.Vector3(.45,.1,.96),normal:auto.normal||new THREE.Vector3(.42,.05,.9).normalize(),depth:.37*Math.sin(elapsed/.6*Math.PI),age:elapsed};
  }else{
    if(elapsed<1.15){
      const progress=THREE.MathUtils.smoothstep(elapsed,0,.95);
      contact={point:new THREE.Vector3(.12,.70,.42),normal:new THREE.Vector3(.1,.87,.45).normalize(),depth:0,age:elapsed};
      dragTarget.set(.12,restHeight+.70+(reduced ? .36 : 1.12)*progress,.42);
    }else{auto=null;contact=null;velocity.y=reduced?-.7:-1.3;lastAction=time;state('fall','ぷるん、って戻る。','ぷるん');}
  }
}
function isDragging(){return Boolean(gesture?.dragging||(auto&&auto.type==='drop'));}
function emitWave(normal,amplitude,age=0){
  if(reduced)return;surfaceWaves.push({normal:normal.clone().normalize(),amplitude,age});
  if(surfaceWaves.length>5)surfaceWaves.shift();
}
function collide(normal,speed){
  if(speed<.3)return;
  emitWave(normal,Math.min(.095,speed*.025),-.06);
  collisionCount++;lastCollision=normal.y<-.5?'floor':normal.x>.5?'right':normal.x<-.5?'left':normal.z>.5?'front':'back';
  canvas.dataset.lastCollision=lastCollision;canvas.dataset.collisionCount=String(collisionCount);
  impactRipples.push({point:normal.clone().multiplyScalar(.98),normal:normal.clone(),amount:Math.min(.23,speed*.075),age:0});
  if(impactRipples.length>5)impactRipples.shift();
  if(!sleeping)state(lastCollision==='floor'?'bounce':'wall-bounce',lastCollision==='floor'?'ぽよよん。':'こつん、ぷるん。','ぷるん');
}
function kick(normal,strength=2.6){velocity.addScaledVector(normal,-strength*(reduced?.28:1));}
function updateBody(dt){
  const dragging=isDragging();
  if(dragging&&contact){
    const targetX=dragTarget.x-contact.point.x*shapeX;
    const targetY=dragTarget.y-contact.point.y*shapeY-restHeight*shapeY;
    const targetZ=dragTarget.z-contact.point.z*shapeZ;
    const stiffness=reduced?80:43,damping=reduced?19:8.4;
    velocity.x+=((targetX-position.x)*stiffness-velocity.x*damping)*dt;
    velocity.y+=((targetY-position.y)*stiffness-velocity.y*damping-5.5)*dt;
    velocity.z+=((targetZ-position.z)*stiffness-velocity.z*damping)*dt;
  }else{
    velocity.y-=11.4*dt;
    velocity.x*=Math.exp(-dt*(position.y<.02?.42:.18));
    velocity.z*=Math.exp(-dt*(position.y<.02?.30:.15));
  }
  position.addScaledVector(velocity,dt);
  if(position.y<0){
    const impact=-velocity.y;position.y=0;
    velocity.y=impact>(reduced?1.8:.65)?impact*(reduced?.12:.46):0;
    if(impact>.5){collide(new THREE.Vector3(0,-1,0),impact);squishVelocity+=Math.min(reduced?1.2:5.5,impact*.8);if(!dragging&&time-lastAction<5)state('bounce','ぽよよん。','ぽよん');}
    velocity.x*=.995;velocity.z*=.995;
  }
  if(position.y>1.34){position.y=1.34;velocity.y=Math.min(0,velocity.y)*.3;}
  const xLimit=Math.max(.24,maxX-Math.max(0,position.z)*(stage.clientWidth<600?.25:.12));
  if(Math.abs(position.x)>xLimit){
    const side=Math.sign(position.x),impact=Math.abs(velocity.x);
    position.x=side*xLimit;velocity.x=-side*impact*(reduced?.25:.76);
    sideSquishVelocity+=Math.min(4.2,impact*.9);
    collide(new THREE.Vector3(side,0,0),impact);
  }
  if(position.z < -1.55 || position.z > .95){
    const side=position.z<0?-1:1,impact=Math.abs(velocity.z);
    position.z=side<0?-1.55:.95;velocity.z=-side*impact*(reduced?.25:.77);
    depthSquishVelocity+=Math.min(4.2,impact*.95);
    collide(new THREE.Vector3(0,0,side),impact);
  }
  squishVelocity+=(-squish*72-squishVelocity*(reduced?19:7.5))*dt;
  squish+=squishVelocity*dt;squish=THREE.MathUtils.clamp(squish,-.28,.72);
  sideSquishVelocity+=(-sideSquish*80-sideSquishVelocity*(reduced?20:8))*dt;
  depthSquishVelocity+=(-depthSquish*80-depthSquishVelocity*(reduced?20:8))*dt;
  sideSquish=THREE.MathUtils.clamp(sideSquish+sideSquishVelocity*dt,-.25,.62);
  depthSquish=THREE.MathUtils.clamp(depthSquish+depthSquishVelocity*dt,-.25,.62);
  shapeY=1-squish*.48+sideSquish*.15+depthSquish*.15;
  shapeX=1+squish*.26-sideSquish*.42+depthSquish*.17;
  shapeZ=1+squish*.26+sideSquish*.17-depthSquish*.42;
  root.position.set(position.x,restHeight*shapeY+position.y,position.z);
  shadow.position.set(position.x,.004,position.z);
  const shadowSize=1+position.y*.26;shadow.scale.set(shadowSize,shadowSize,1);shadow.material.opacity=.76-position.y*.28;
  contactShadow.position.set(position.x,.005,position.z);contactShadow.scale.set(1+squish*.20,1+squish*.12,1);contactShadow.material.opacity=Math.exp(-position.y*4.5);
  reflection.position.set(position.x,.007,position.z+.48);reflection.scale.set(1+squish*.20,1,1);reflection.material.opacity=.50*Math.exp(-position.y*3.5);
  caustic.position.set(position.x+.12,.008,position.z+.05);caustic.scale.setScalar(1+squish*.2+position.y*.12);caustic.material.opacity=.15-position.y*.07;
  canvas.dataset.height=position.y.toFixed(3);
  canvas.dataset.x=position.x.toFixed(3);canvas.dataset.z=position.z.toFixed(3);canvas.dataset.vx=velocity.x.toFixed(3);canvas.dataset.vz=velocity.z.toFixed(3);
  canvas.dataset.position=`${position.x.toFixed(2)},${position.y.toFixed(2)},${position.z.toFixed(2)}`;
  canvas.dataset.squash=squish.toFixed(3);
}
function deform(dt){
  if(reduced)surfaceWaves.length=0;
  let stretchX=0,stretchY=0,stretchZ=0;
  const dragging=isDragging();
  if(dragging&&contact){
    tempA.set(dragTarget.x-root.position.x-contact.point.x*shapeX,dragTarget.y-root.position.y-contact.point.y*shapeY,dragTarget.z-root.position.z-contact.point.z*shapeZ).clampLength(0,reduced?.24:.88);
    stretchX=tempA.x;stretchY=tempA.y;stretchZ=tempA.z;
  }
  const stiffness=reduced?220:106,damping=reduced?29:8.25;
  let maximum=0;
  for(let i=0;i<base.length;i+=3){
    let tx=0,ty=0,tz=0;
    if(contact){
      const dx=base[i]-contact.point.x,dy=base[i+1]-contact.point.y,dz=base[i+2]-contact.point.z;
      const d2=dx*dx+dy*dy+dz*dz;
      const facing=Math.max(0,baseNormals[i]*contact.normal.x+baseNormals[i+1]*contact.normal.y+baseNormals[i+2]*contact.normal.z);
      if(dragging){
        const pull=Math.exp(-d2/.9)*(.3+.7*facing);
        tx=stretchX*pull;ty=stretchY*pull;tz=stretchZ*pull;
      }else if(d2<3){
        const distance=Math.sqrt(d2),depth=contact.depth*(reduced?.52:1);
        const dent=Math.exp(-d2/.13)*depth*facing;
        const ridge=Math.exp(-(((distance-.46)/.19)**2))*depth*.39*facing;
        const ripple=reduced?0:Math.sin(distance*12-contact.age*14)*Math.exp(-distance*2-contact.age*1.6)*depth*.11;
        tx=-contact.normal.x*dent+baseNormals[i]*(ridge+ripple);
        ty=-contact.normal.y*dent+baseNormals[i+1]*(ridge+ripple);
        tz=-contact.normal.z*dent+baseNormals[i+2]*(ridge+ripple);
      }
    }
    for(const wave of surfaceWaves){
      if(wave.age<0)continue;
      const cosine=THREE.MathUtils.clamp(baseNormals[i]*wave.normal.x+baseNormals[i+1]*wave.normal.y+baseNormals[i+2]*wave.normal.z,-1,1);
      const distance=Math.acos(cosine)*1.05;
      const travel=distance-wave.age*2.55;
      const front=Math.exp(-(travel*travel)/.095)*Math.cos(travel*7.5);
      const displacement=wave.amplitude*front*Math.exp(-wave.age*1.9)/(1+distance*.35);
      tx+=baseNormals[i]*displacement;ty+=baseNormals[i+1]*displacement;tz+=baseNormals[i+2]*displacement;
    }
    for(const impact of impactRipples){
      const distance2=(base[i]-impact.point.x)**2+(base[i+1]-impact.point.y)**2+(base[i+2]-impact.point.z)**2;
      const amplitude=impact.amount*Math.exp(-impact.age*5)*Math.cos(impact.age*13)*Math.exp(-distance2/.45);
      tx-=impact.normal.x*amplitude;ty-=impact.normal.y*amplitude;tz-=impact.normal.z*amplitude;
    }
    for(let axis=0;axis<3;axis++){
      const index=i+axis,target=axis===0?tx:axis===1?ty:tz;
      velocities[index]+=((target-offsets[index])*stiffness-velocities[index]*damping)*dt;
      offsets[index]+=velocities[index]*dt;
      if(Math.abs(offsets[index])+Math.abs(velocities[index])<.000015){offsets[index]=0;velocities[index]=0;}
      const scale=axis===0?shapeX:axis===1?shapeY:shapeZ;
      vertices.array[index]=base[index]*scale+offsets[index];
      maximum=Math.max(maximum,Math.abs(offsets[index]));
    }
    const breathing=reduced?0:Math.sin(time*(sleeping?1.05:1.4))*.006;
    vertices.array[i]+=(base[i]*breathing);
    vertices.array[i+1]+=Math.max(0,base[i+1]+.7)*breathing;
    // The tabletop is a hard limit, even for local fingertip displacement and impact squash.
    vertices.array[i+1]=Math.max(vertices.array[i+1],.012-root.position.y);
  }
  vertices.needsUpdate=true;geometry.computeVertexNormals();
  for(const a of anchors){
    const i=a.index;a.object.position.set(vertices.array[i]+a.difference.x*shapeX,vertices.array[i+1]+a.difference.y*shapeY,vertices.array[i+2]+a.difference.z*shapeZ);
    a.object.scale.set(Math.max(.72,shapeX),Math.max(.62,shapeY),Math.max(.72,shapeZ));
  }
  for(const b of bubbles){b.bubble.position.set(b.base.x*shapeX,b.base.y*shapeY+(reduced?0:Math.sin(time*.8+b.phase)*.008),b.base.z*shapeZ);}
  if(contact)contact.age+=dt;
  for(let j=surfaceWaves.length-1;j>=0;j--){surfaceWaves[j].age+=dt;if(surfaceWaves[j].age>1.65)surfaceWaves.splice(j,1);}
  canvas.dataset.waves=String(surfaceWaves.length);
  for(let j=impactRipples.length-1;j>=0;j--){impactRipples[j].age+=dt;if(impactRipples[j].age>1.3)impactRipples.splice(j,1);}
  canvas.dataset.deformation=maximum.toFixed(3);
}
function expression(dt){
  const target=sleeping ? 1 : isDragging() ? .1 : contact ? .95 : Math.max(0,1-(time-lastAction)/2.3)*.8;
  affection+=(target-affection)*(1-Math.exp(-dt*5));
  if(time>nextBlink&&!sleeping){blink=1;nextBlink=time+3.5+Math.random()*3;}
  blink=Math.max(0,blink-dt*5.5);
  const closed=sleeping||affection>.68||Math.sin(blink*Math.PI)>.72;
  for(const eye of eyes){eye.open.visible=!closed;eye.closed.visible=closed;eye.open.scale.y=(isDragging()?.115:.1)*(1-affection*.55);}
  for(let i=0;i<ears.length;i++)ears[i].rotation.z=(i?1:-1)*(squish*.22+(sleeping?.12:0));
  if(!sleeping&&!contact&&!auto&&position.y<.01&&Math.abs(squish)<.015&&Math.hypot(velocity.x,velocity.z)<.08&&time-lastAction>3.3)state('idle','ぷるぷる、してる。');
}
function resize(){
  if(pointerId!==null||auto)stopHand();
  const width=stage.clientWidth,height=stage.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;
  camera.position.set(.15,2.05,width<600?5.1:4.65);camera.fov=width<600?39:35;camera.lookAt(0,.95,0);camera.updateProjectionMatrix();
  maxX=width<600?.49:width<850?1.1:1.65;
  position.x=THREE.MathUtils.clamp(position.x,-maxX,maxX);
}
new ResizeObserver(resize).observe(stage);resize();
canvas.dataset.flavor='mint';canvas.dataset.ready='false';canvas.dataset.lastCollision='none';canvas.dataset.collisionCount='0';selectPet('capybara');
function frame(now){
  requestAnimationFrame(frame);const elapsed=Math.min((now-previous)/1000,1/30);previous=now;if(document.hidden)return;time+=elapsed;
  updateAuto();
  // Two small integration steps keep fast releases stable at ordinary laptop frame rates.
  updateBody(elapsed/2);updateBody(elapsed/2);deform(elapsed);expression(elapsed);
  const lift = reduced ? 0 : position.y;
  camera.position.set(.15,2.05+lift*.2,(stage.clientWidth<600?5.1:4.65)+lift*.55);
  camera.lookAt(0,.95+lift*.4,0);
  renderer.render(scene,camera);
  if(canvas.dataset.ready!=='true')canvas.dataset.ready='true';
}
requestAnimationFrame(frame);
