import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Simulation, RADIUS, CAPACITY, DT, commonRail, branchRails, BOWLS } from './physics.js';
const $=s=>document.querySelector(s);
const simulation=new Simulation();
const canvas=$('#canvas'),stage=$('#stage');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}catch(e){$('#loading').hidden=true;$('#error').hidden=false;$('#error').textContent='この展示にはWebGLが必要です。ブラウザのハードウェアアクセラレーションを有効にして、もう一度開いてください。';throw e;}
renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
const scene=new THREE.Scene();scene.fog=new THREE.Fog('#eeebe3',19,36);
const camera=new THREE.PerspectiveCamera(35,1,.1,60);
const controls=new OrbitControls(camera,canvas);controls.target.set(0,3.05,0);controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=7.5;controls.maxDistance=16;controls.minPolarAngle=.55;controls.maxPolarAngle=1.7;controls.enablePan=false;controls.rotateSpeed=.55;
const pmrem=new THREE.PMREMGenerator(renderer);const environment=new RoomEnvironment();scene.environment=pmrem.fromScene(environment,.035).texture;scene.environmentIntensity=.65;environment.dispose();pmrem.dispose();
scene.add(new THREE.HemisphereLight('#fffdf3','#8e9c8e',1.4));
const sunlight=new THREE.DirectionalLight('#fff8e7',2.8);sunlight.position.set(-5,10,5);sunlight.castShadow=true;sunlight.shadow.mapSize.set(2048,2048);Object.assign(sunlight.shadow.camera,{left:-5,right:5,top:8,bottom:-5,near:1,far:24});sunlight.shadow.bias=-.0005;sunlight.shadow.normalBias=.025;sunlight.shadow.radius=5;scene.add(sunlight);
const fill=new THREE.DirectionalLight('#d4e9e5',.65);fill.position.set(5,5,-6);scene.add(fill);
const stone=new THREE.MeshStandardMaterial({color:'#c7c6b4',roughness:.9});
const chalk=new THREE.MeshStandardMaterial({color:'#e0ddce',roughness:.94});
const brass=new THREE.MeshStandardMaterial({color:'#b39760',metalness:.82,roughness:.29});
const darkBrass=new THREE.MeshStandardMaterial({color:'#72623e',metalness:.75,roughness:.38});
const rimMaterial=new THREE.MeshPhysicalMaterial({color:'#8ba99b',metalness:.18,roughness:.19,transparent:true,opacity:.85,envMapIntensity:1.1});
const glass=new THREE.MeshPhysicalMaterial({color:'#a7c8bb',metalness:0,roughness:.15,transmission:.58,thickness:.18,ior:1.45,transparent:true,opacity:.84,side:THREE.DoubleSide,depthWrite:false,envMapIntensity:1.1,attenuationColor:'#8bad9d',attenuationDistance:2.2});
const tankGlass=glass.clone();tankGlass.opacity=.76;tankGlass.roughness=.2;tankGlass.transmission=.65;
const bowlGlass=glass.clone();bowlGlass.opacity=.76;bowlGlass.transmission=.65;
function mesh(geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);scene.add(m);return m;}
function cylinder(r1,r2,h,mat,x,y,z,segments=64){return mesh(new THREE.CylinderGeometry(r1,r2,h,segments),mat,x,y,z);}
function torus(r,t,mat,x,y,z){const m=mesh(new THREE.TorusGeometry(r,t,12,96),mat,x,y,z);m.rotation.x=Math.PI/2;return m;}
function rod(a,b,r=.015,mat=brass){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);const m=mesh(new THREE.CylinderGeometry(r,r,start.distanceTo(end),12),mat);m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());return m;}
// Gallery: warm mineral floor, a plaster wall, tall window reveals and real shadows.
const floor=mesh(new THREE.PlaneGeometry(120,120),new THREE.MeshStandardMaterial({color:'#e4e1d5',roughness:.91}),0,-.17,0);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;
const wall=mesh(new THREE.PlaneGeometry(50,20),chalk,0,5,-7);wall.receiveShadow=true;
for(const x of [-7,-3.5,0,3.5,7]){const pilaster=mesh(new THREE.BoxGeometry(.18,12,.55),chalk,x,5,-6.75);pilaster.castShadow=true;}
const windowMat=new THREE.MeshBasicMaterial({color:'#f7f4e5'});
for(const x of [-5.2,1.8,5.3])mesh(new THREE.PlaneGeometry(1.2,6.8),windowMat,x,4.4,-6.70);
const base=cylinder(2.1,2.16,.21,stone,0,-.025,0);base.receiveShadow=true;base.castShadow=true;
const top=cylinder(2.08,2.1,.10,chalk,0,.13,0);top.receiveShadow=true;
torus(2.07,.013,brass,0,.187,0);
const pedestal=cylinder(.63,.76,.13,stone,0,.245,-.48);pedestal.receiveShadow=true;
// Three spare brass columns keep the spiral visually open.
for(const a of [.4,2.6,4.75]){const x=1.08*Math.cos(a),z=1.08*Math.sin(a);rod([x,.22,z],[x,4.53,z],.017);cylinder(.065,.08,.07,darkBrass,x,.23,z);torus(.043,.01,brass,x,4.51,z);}
for(const y of [1.77,3.01,4.25])torus(1.045,.012,brass,0,y,0);
// The reservoir is an open, lathed shell; every surface is original geometry.
const tankProfile=[[.14,4.87],[.18,4.98],[.30,5.13],[.46,5.38],[.51,5.61],[.45,5.86],[.29,6.07],[.19,6.17],[.19,6.22]];
const tank=mesh(new THREE.LatheGeometry(tankProfile.map(([r,y])=>new THREE.Vector2(r,y)),80),tankGlass);tank.renderOrder=3;
torus(.19,.022,brass,0,6.22,0);torus(.15,.013,brass,0,4.92,0);torus(.475,.008,rimMaterial,0,5.7,0);
// Narrow, very transparent tubes with fine edge strands make the pearls readable.
class RailCurve extends THREE.Curve{constructor(rail){super();this.rail=rail;}getPoint(t,target=new THREE.Vector3()){return target.set(...this.rail.at(t*this.rail.length));}}
function buildTube(rail,radius=.20){const curve=new RailCurve(rail);const tube=mesh(new THREE.TubeGeometry(curve,Math.ceil(rail.length*50),radius,16,false),glass);tube.renderOrder=2;
  // The lower seam suggests glass thickness without painting over moving pearls.
  const edgePoints=rail.points.map(p=>new THREE.Vector3(p[0],p[1]-.17,p[2]));const edge=mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edgePoints),Math.ceil(rail.length*35),.009,5,false),rimMaterial);return tube;}
buildTube(commonRail);buildTube(branchRails.left);buildTube(branchRails.right);
for(const side of ['left','right']){
  const [x,,z]=BOWLS[side];
  const profile=[[0,.31],[.34,.31],[.43,.34],[.47,.43],[.55,.67],[.68,1.02],[.69,1.055]];
  const b=mesh(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),72),bowlGlass,x,0,z);b.renderOrder=4;
  torus(.686,.018,rimMaterial,x,1.05,z);torus(.43,.015,brass,x,.33,z);cylinder(.455,.48,.075,darkBrass,x,.245,z);cylinder(.46,.47,.032,brass,x,.292,z);
}
// The gate is a small visible brass switch at the exact simulated fork.
const gateHub=mesh(new THREE.SphereGeometry(.095,20,12),brass,0,1.77,-.94);
const gateLever=rod([0,1.84,-.94],[.23,1.91,-.94],.025);const gatePivot=new THREE.Group();scene.add(gatePivot);gatePivot.position.set(0,1.77,-.94);scene.remove(gateLever);gateLever.position.sub(gatePivot.position);gatePivot.add(gateLever);
const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=128;const label=labelCanvas.getContext('2d');label.fillStyle='#d4c09a';label.fillRect(0,0,512,128);label.fillStyle='#554d36';label.font='20px Georgia';label.textAlign='center';label.fillText('THE GLASS ALEMBIC',256,52);label.font='12px sans-serif';label.fillText('01   /   GRAVITY STUDY',256,83);const plaque=mesh(new THREE.PlaneGeometry(.94,.235),new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(labelCanvas),roughness:.55,metalness:.35}),0,.25,1.72);plaque.rotation.x=-Math.PI*.37;
const pearlMaterial=new THREE.MeshPhysicalMaterial({color:'#f6df9d',metalness:.27,roughness:.24,clearcoat:1,clearcoatRoughness:.12,iridescence:.4,iridescenceIOR:1.3,iridescenceThicknessRange:[100,300],emissive:'#73551b',emissiveIntensity:.075});
const pearls=new THREE.InstancedMesh(new THREE.SphereGeometry(RADIUS,14,10),pearlMaterial,CAPACITY);pearls.castShadow=true;pearls.receiveShadow=true;pearls.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(pearls);
const colors=['#f6df9d','#e8c985','#fff0c1','#c4d8c7','#e0c493'];for(let i=0;i<CAPACITY;i++)pearls.setColorAt(i,new THREE.Color(colors[i%colors.length]));
const dummy=new THREE.Object3D();
// Stored pearls are display-only, packed inside the egg; simulation starts at release.
const stored=[];for(let layer=0;layer<6;layer++){const y=5.15+layer*.121,offset=layer%2*.063;for(let ix=-3;ix<=3;ix++)for(let iz=-3;iz<=3;iz++){const x=ix*.132+offset,z=iz*.132+offset;const r=.42*Math.sqrt(Math.max(0,1-((y-5.52)/.52)**2));if(x*x+z*z<r*r){const jitter=.008;stored.push([x+Math.sin(ix*9+iz*3+layer)*jitter,y+Math.cos(ix*5+iz*7+layer)*jitter,z+Math.sin(ix*7+iz*5+layer)*jitter]);}}}stored.sort((a,b)=>a[1]-b[1]);
function drawPearls(){for(let i=0;i<CAPACITY;i++){const p=simulation.particles[i];const pos=p?p.pos:stored[(i-simulation.emitted)%stored.length];dummy.position.set(...pos);dummy.rotation.set(i*.7+simulation.time*.13,0,i*.4);dummy.updateMatrix();pearls.setMatrixAt(i,dummy.matrix);}pearls.instanceMatrix.needsUpdate=true;}
function restoreCamera(){const portrait=stage.clientWidth/stage.clientHeight<.85;camera.position.set(portrait?7.9:8.3,6.1,portrait?11.6:11.9);controls.target.set(0,3.07,0);controls.update();}
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}window.addEventListener('resize',resize);resize();restoreCamera();
const buttons={left:$('#gate-left'),right:$('#gate-right')};
let challengeActive=false;
// Pure challenge verdict; arrival counts, never emission counts, decide completion.
function challengeVerdict(active,left,right){
  if(!active)return {state:'idle',difference:null};
  if(left+right<CAPACITY)return {state:'playing',difference:null};
  const difference=Math.abs(left-CAPACITY/2);
  return {state:difference===0?'success':'finished',difference};
}
// End pure verdict.
function setGate(side){simulation.setGate(side);for(const s of ['left','right'])buttons[s].setAttribute('aria-pressed',String(side===s));gatePivot.rotation.y=side==='left'?Math.PI:0;}
function release(){simulation.release();$('#release-text').textContent='粒をはなしています';$('#release').disabled=true;updateUI();}
function reset(){challengeActive=false;simulation.reset();setGate('right');$('#slow').setAttribute('aria-pressed','false');$('#release').disabled=false;$('#release-text').textContent='粒をはなす';accumulator=0;drawPearls();updateUI();}
$('#challenge').addEventListener('click',()=>{reset();challengeActive=true;release();});
$('#release').addEventListener('click',release);$('#gate-left').addEventListener('click',()=>setGate('left'));$('#gate-right').addEventListener('click',()=>setGate('right'));$('#reset').addEventListener('click',reset);$('#slow').addEventListener('click',()=>{simulation.slow=!simulation.slow;$('#slow').setAttribute('aria-pressed',String(simulation.slow));});$('#view-reset').addEventListener('click',restoreCamera);
window.addEventListener('keydown',e=>{if(e.target.closest('button,summary,a,input,textarea'))return;if(e.code==='Space'){e.preventDefault();if(!$('#release').disabled)release();}if(e.code==='KeyL')setGate('left');if(e.code==='KeyR')setGate('right');});
function updateUI(){const s=simulation.stats;$('#moving').textContent=s.moving;$('#left').textContent=s.left;$('#right').textContent=s.right;$('#status-text').textContent=s.emitted===0?'120粒の、小さな旅。':s.collected===CAPACITY?'全部の粒が、器へ。':s.emitted<CAPACITY?`あと${s.stored}粒。ゆっくり目で追って。`:'最後の粒まで、見届けよう。';if(s.emitted===CAPACITY)$('#release-text').textContent='120粒をはなしました';const challenge=challengeVerdict(challengeActive,s.left,s.right);
  $('.controls').dataset.challenge=challenge.state;
  $('.controls').dataset.challengeDifference=challenge.difference===null?'':String(challenge.difference);
  $('#challenge').setAttribute('aria-pressed',String(challengeActive));
  $('#challenge').textContent=challengeActive?'もう一度挑戦':'半分チャレンジ';
  $('#challenge').setAttribute('aria-label',challengeActive?'ぴったり半分チャレンジをやり直す':'ぴったり半分チャレンジを始める');
  if(challenge.state==='playing')$('#status-text').textContent='目標60：60。分岐で行き先が決まる。';
  if(challenge.state==='success')$('#status-text').textContent='成功！ ぴったり60：60。';
  if(challenge.state==='finished')$('#status-text').textContent=`あと${challenge.difference}粒で半分。もう一度！`;
  const d={...simulation.diagnostics(),challenge};$('#diagnostics').textContent=JSON.stringify(d,null,2);$('#diagnostics').dataset.stats=JSON.stringify(d);}
// Read-only diagnostics for browser acceptance. No mutation hook is exported.
Object.defineProperty(window,'alembic',{value:Object.freeze({getSnapshot:()=>structuredClone({...simulation.diagnostics(),challenge:challengeVerdict(challengeActive,simulation.left,simulation.right)})}),writable:false});
let previous=performance.now(),accumulator=0,uiElapsed=0;
document.addEventListener('visibilitychange',()=>{previous=performance.now();accumulator=0;});
function frame(now){requestAnimationFrame(frame);const elapsed=Math.min((now-previous)/1000,.05);previous=now;accumulator+=elapsed*(simulation.slow?.25:1);let steps=0;while(accumulator>=DT&&steps<9){if(simulation.emitted>0||simulation.running)simulation.step(DT);accumulator-=DT;steps++;}controls.update();drawPearls();renderer.render(scene,camera);uiElapsed+=elapsed;if(uiElapsed>.2){updateUI();uiElapsed=0;}}
drawPearls();updateUI();$('#loading').hidden=true;requestAnimationFrame(frame);
