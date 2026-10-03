export const TAU=Math.PI*2;
export const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export const wrap=v=>((v%TAU)+TAU)%TAU;
export const VIEWS={workshop:{yaw:-.58,pitch:.34},side:{yaw:0,pitch:.12},intake:{yaw:-1.37,pitch:.16},above:{yaw:-.42,pitch:1.18}};
export function initialState(reduced=false){return{cutaway:64,explode:14,speed:30,playing:!reduced,angle:.32,airflow:true,yaw:VIEWS.workshop.yaw,pitch:VIEWS.workshop.pitch,view:'workshop'};}
export function setValue(state,key,value){
 const bounds={cutaway:[0,100],explode:[0,100],speed:[0,100],angle:[0,360],yaw:[-Math.PI,Math.PI],pitch:[-.18,1.4]};
 if(!bounds[key]||!Number.isFinite(Number(value)))return false;
 let v=clamp(Number(value),...bounds[key]);if(key==='angle')v=v/180*Math.PI;state[key]=v;return true;
}
export function moving(state){return state.playing&&state.speed>0;}
export function advance(state,delta){if(!moving(state)||!Number.isFinite(delta)||delta<=0)return 0;const dt=Math.min(delta,.05);state.angle=wrap(state.angle+dt*state.speed/100*2.4);return dt;}
export function shifts(explode){const e=clamp(explode,0,100)/100;return[-2.25*e,0,2.25*e];}
export function cameraBasis(yaw,pitch){
 const sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);
 return{right:[cy,0,-sy],up:[-sy*sp,cp,-cy*sp],eye:[sy*cp,sp,cy*cp]};
}
export const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export function fitCamera(points,state,aspect){
 const basis=cameraBasis(state.yaw,state.pitch);let lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(const p of points){const q=[dot(p,basis.right),dot(p,basis.up),dot(p,basis.eye)];for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],q[i]);hi[i]=Math.max(hi[i],q[i]);}}
 const target=lo.map((v,i)=>(v+hi[i])/2),margin=aspect<.8?1.20:1.17;
 const scale=2/Math.max((hi[0]-lo[0])/Math.max(.1,aspect),hi[1]-lo[1],.1)/margin;
 const depthScale=1/24;
 const matrix=new Float32Array([basis.right[0]*scale/aspect,basis.up[0]*scale,-basis.eye[0]*depthScale,0,basis.right[1]*scale/aspect,basis.up[1]*scale,-basis.eye[1]*depthScale,0,basis.right[2]*scale/aspect,basis.up[2]*scale,-basis.eye[2]*depthScale,0,-target[0]*scale/aspect,-target[1]*scale,target[2]*depthScale,1]);
 return{...basis,matrix,scale,target,lo,hi};
}
export function project(point,camera){const m=camera.matrix;return[0,1,2].map(i=>m[i]*point[0]+m[i+4]*point[1]+m[i+8]*point[2]+m[i+12]);}
