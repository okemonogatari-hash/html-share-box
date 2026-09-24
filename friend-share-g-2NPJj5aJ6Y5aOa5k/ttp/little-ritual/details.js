export const PLACES=[
 {id:'bell',title:'街の上の、小さな鐘',action:'鐘を鳴らす',x:9.05,z:-.8,h:7.35,hint:'階段の先、屋上で風を待つ鐘。',memory:'ひとつ鳴らすと、屋根の向こうまで朝が届いた。'},
 {id:'garden',title:'花に、おはよう',action:'花に水をあげる',x:-3.8,z:4.2,h:0,hint:'花屋の前に、小さなじょうろ。',memory:'少しの水で、うつむいていた花が顔を上げた。'},
 {id:'pond',title:'水面を、ひと跳び',action:'池に小石を投げる',x:-3,z:20,h:0,hint:'池のふちに、平たい小石。',memory:'ぽん、ぽん。輪っかだけが、しばらく残った。'}
];
export function restoreDiscoveries(raw){try{return new Set(JSON.parse(raw).filter(id=>PLACES.some(p=>p.id===id)));}catch{return new Set();}}
export function createDetails({THREE,scene,place,mat}){
 const entries=new Map(),geometries=[];
 function mesh(geometry,color,parent){geometries.push(geometry);const m=new THREE.Mesh(geometry,mat(color));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(parent,x,y,z,w,h,d,color){const m=mesh(new THREE.BoxGeometry(w,h,d),color,parent);m.position.set(x,y,z);return m;}
 function ball(parent,x,y,z,r,color){const m=mesh(new THREE.SphereGeometry(r,12,8),color,parent);m.position.set(x,y,z);return m;}
 for(const p of PLACES){const g=new THREE.Group();scene.add(g);place(g,p.x,p.z,p.h);const e={g,p,elapsed:99};entries.set(p.id,e);
  if(p.id==='bell'){
   for(const x of [-.65,.65])box(g,x,1.2,0,.1,2.4,.12,'#8c6b44');box(g,0,2.38,0,1.52,.12,.15,'#8c6b44');const pivot=new THREE.Group();g.add(pivot);pivot.position.y=2.15;e.pivot=pivot;
   const bell=mesh(new THREE.CylinderGeometry(.15,.38,.48,24),'#bb9d59',pivot);bell.position.y=-.27;const rim=mesh(new THREE.TorusGeometry(.37,.035,8,32),'#a08045',pivot);rim.rotation.x=Math.PI/2;rim.position.y=-.52;
   box(pivot,0,-.72,0,.025,.45,.025,'#c7bb93');ball(pivot,0,-.95,0,.09,'#866a42');const plaque=box(g,0,.65,.14,.7,.35,.04,'#efe5c9');
  }else if(p.id==='garden'){
   const can=new THREE.Group();g.add(can);can.position.set(-.18,.28,.05);e.pivot=can;
   mesh(new THREE.CylinderGeometry(.19,.22,.42,16),'#98ab82',can);const handle=mesh(new THREE.TorusGeometry(.22,.026,6,20),'#708661',can);handle.position.set(0,.22,0);
   const spout=mesh(new THREE.CylinderGeometry(.034,.06,.48,10),'#8c9f72',can);spout.rotation.z=-.85;spout.position.set(.32,.08,0);
   e.flowers=[];for(let i=0;i<12;i++){const x=.1+(i%4)*.17,z=-.5+Math.floor(i/4)*.2;const bloom=new THREE.Group();g.add(bloom);bloom.position.set(x,0,z);box(bloom,0,.15,0,.012,.3,.012,'#7a8d61');for(let k=0;k<5;k++){const a=k*Math.PI*2/5;ball(bloom,Math.cos(a)*.055,.32,Math.sin(a)*.055,.053,i%2?'#e1b4a4':'#ead8a8').scale.y=.5;}ball(bloom,0,.34,0,.023,'#c3a358');e.flowers.push(bloom);}
   e.drops=[];for(let i=0;i<14;i++){const d=ball(g,0,0,0,.018,'#b5d2cc');d.visible=false;e.drops.push(d);}
  }else{
   for(let i=0;i<6;i++)ball(g,(i%3)*.15,.065,Math.floor(i/3)*.16,.085,'#b7b9a4').scale.set(1,.42,.75);
   e.stone=ball(g,0,.1,0,.055,'#9b9f8e');e.stone.visible=false;e.rings=[];
   for(let i=0;i<3;i++){const r=mesh(new THREE.TorusGeometry(.3,.009,5,40),'#ceded1',g);r.rotation.x=Math.PI/2;r.position.set(1.5+i*.45,.08,1+i*.27);r.visible=false;e.rings.push(r);}
  }
 }
 return {trigger(id){const e=entries.get(id);if(e)e.elapsed=0;},update(dt){for(const e of entries.values()){e.elapsed+=dt;const t=e.elapsed;if(e.p.id==='bell')e.pivot.rotation.z=t<6?Math.sin(t*10)*.47*Math.exp(-t*.7):0;
  if(e.p.id==='garden'){e.pivot.rotation.z=t<3?-.6*Math.sin(Math.min(t,3)/3*Math.PI):0;for(let i=0;i<e.drops.length;i++){const d=e.drops[i];d.visible=t<2.7;if(d.visible){const f=(t*1.7+i/14)%1;d.position.set(.3+f*.4,.52-f*.5,-.2+Math.sin(i)*.1);}}for(let i=0;i<e.flowers.length;i++)e.flowers[i].scale.y=t<6?.85+Math.min(t/4,.25)+Math.sin(t*2+i)*.03:1;}
  if(e.p.id==='pond'){e.stone.visible=t<1.8;if(e.stone.visible)e.stone.position.set(t*1.35,.12+Math.abs(Math.sin(t*Math.PI*3))*.35*Math.max(0,1-t/2),t*.85);e.rings.forEach((r,i)=>{const age=t-.55-i*.45;r.visible=age>0&&age<3;if(r.visible)r.scale.setScalar(.2+age*1.4);});}
 }}};
}
