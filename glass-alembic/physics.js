// A constrained-particle model: real gravity projected onto an arc-length rail,
// inelastic sphere collisions, followed by free 3D spheres in tapered vessels.
// This is an explicit approximation, not a general rigid-body glass solver.
export const RADIUS = .064;
export const CAPACITY = 120;
export const DT = 1 / 180;
export const BOWLS = { left: [-1.18,.32,.56], right: [1.18,.32,.56] };
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const mul=(a,n)=>a.map(v=>v*n);
const length=a=>Math.hypot(...a);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
export function bezier(a,b,c,d,t){const u=1-t;return add(add(mul(a,u*u*u),mul(b,3*u*u*t)),add(mul(c,3*u*t*t),mul(d,t*t*t)));}
function curvePoints(a,b,c,d,n=90){return Array.from({length:n+1},(_,i)=>bezier(a,b,c,d,i/n));}
export class Rail {
  constructor(points){this.points=points;this.distances=[0];for(let i=1;i<points.length;i++)this.distances.push(this.distances.at(-1)+length(sub(points[i],points[i-1])));this.length=this.distances.at(-1);}
  at(s){s=Math.max(0,Math.min(this.length,s));let lo=0,hi=this.distances.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(this.distances[m]<s)lo=m;else hi=m;}const a=this.distances[lo],b=this.distances[hi];return lerp(this.points[lo],this.points[hi],(s-a)/(b-a||1));}
  tangent(s){const d=sub(this.at(Math.min(this.length,s+.008)),this.at(Math.max(0,s-.008)));return mul(d,1/(length(d)||1));}
}
const feeder=curvePoints([0,4.94,0],[0,4.65,0],[-.48,4.5,-.94],[0,4.25,-.94]);
const spiral=Array.from({length:721},(_,i)=>{const t=i/720,a=-Math.PI/2+4*Math.PI*t;return [.94*Math.cos(a),4.25-2.48*t,.94*Math.sin(a)];});
export const commonRail=new Rail([...feeder,...spiral.slice(1)]);
export const branchRails=Object.fromEntries(['left','right'].map(side=>{const sign=side==='left'?-1:1;return [side,new Rail(curvePoints([0,1.77,-.94],[sign*.8,1.62,-.94],[sign*1.18,1.48,.56],[sign*1.18,1.06,.56],150))];}));
export function trackPosition(s,side='right'){return s<=commonRail.length?commonRail.at(s):branchRails[side||'right'].at(s-commonRail.length);}
export function trackTangent(s,side='right'){return s<commonRail.length?commonRail.tangent(s):branchRails[side||'right'].tangent(s-commonRail.length);}
export class Simulation {
  constructor(){this.reset();}
  reset(){this.particles=[];this.gate='right';this.running=false;this.slow=false;this.time=0;this.emission=0;this.emitted=0;this.left=0;this.right=0;this.escaped=0;this.maxPenetration=0;this.collisionCount=0;this.maxWallError=0;this.seed=891;}
  random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  release(){if(this.emitted<CAPACITY)this.running=true;}
  setGate(side){if(side==='left'||side==='right')this.gate=side;}
  step(dt=DT){
    this.time+=dt;
    this.emission-=dt;
    if(this.running&&this.emitted<CAPACITY&&this.emission<=0&&!this.particles.some(p=>p.state==='track'&&p.s<RADIUS*2.15)){
      this.particles.push({id:this.emitted++,state:'track',s:0,speed:.12,side:null,pos:[0,4.94,0],vel:[0,0,0],sleep:0,collected:false});this.emission=.075;
    }
    const track=this.particles.filter(p=>p.state==='track');
    for(const p of track){const t=trackTangent(p.s,p.side);p.speed=Math.max(0,p.speed+(-9.81*t[1]-.07*p.speed)*dt);p.s+=p.speed*dt;if(p.s>commonRail.length&&!p.side)p.side=this.gate;}
    // Collision along the shared rail and each branch. Equal mass impulse.
    for(let iteration=0;iteration<4;iteration++){
      track.sort((a,b)=>b.s-a.s);
      for(let i=0;i<track.length;i++)for(let j=i+1;j<track.length;j++){
        const front=track[i],back=track[j];if(front.s-back.s>RADIUS*2.01)break;
        if(front.side&&back.side&&front.side!==back.side&&back.s>commonRail.length+.18)continue;
        const overlap=RADIUS*2.01-(front.s-back.s);
        if(overlap>0){front.s+=overlap*.5;back.s=Math.max(0,back.s-overlap*.5);if(back.speed>front.speed){const mean=(front.speed+back.speed)*.5,delta=(back.speed-front.speed)*.16;front.speed=mean+delta;back.speed=mean-delta;this.collisionCount++;}}
      }
    }
    for(const p of track){
      if(p.s>commonRail.length&&!p.side)p.side=this.gate;
      const rail=branchRails[p.side||this.gate];
      if(p.s>=commonRail.length+rail.length){p.state='free';p.pos=rail.at(rail.length);p.vel=mul(rail.tangent(rail.length),Math.min(p.speed,2.2));p.vel[0]+=(this.random()-.5)*.12;p.vel[2]+=(this.random()-.5)*.12;}
      else p.pos=trackPosition(p.s,p.side);
    }
    const free=this.particles.filter(p=>p.state==='free');
    for(const p of free){p.vel[1]-=9.81*dt;for(let k=0;k<3;k++)p.pos[k]+=p.vel[k]*dt;}
    for(let iteration=0;iteration<7;iteration++){
      for(const p of free)this.constrainBowl(p);
      for(let i=0;i<free.length;i++)for(let j=i+1;j<free.length;j++){
        const a=free[i],b=free[j];if(a.side!==b.side)continue;
        const dx=b.pos[0]-a.pos[0],dy=b.pos[1]-a.pos[1],dz=b.pos[2]-a.pos[2],distance2=dx*dx+dy*dy+dz*dz;
        if(distance2>=RADIUS*RADIUS*4)continue;
        const dist=Math.sqrt(distance2),overlap=RADIUS*2-dist;
        if(overlap>0){const n=dist>1e-8?[dx/dist,dy/dist,dz/dist]:[1,0,0];for(let k=0;k<3;k++){a.pos[k]-=n[k]*overlap*.5;b.pos[k]+=n[k]*overlap*.5;}
          const rel=b.vel.reduce((v,x,k)=>v+(x-a.vel[k])*n[k],0);if(rel<0){const impulse=-(1+.22)*rel*.5;for(let k=0;k<3;k++){a.vel[k]-=impulse*n[k];b.vel[k]+=impulse*n[k];}if(iteration===0)this.collisionCount++;}
        }
      }
    }
    for(const p of free){
      this.constrainBowl(p);
      p.vel[0]*=.996;p.vel[2]*=.996;
      if(length(p.vel)<.11&&p.pos[1]<.95)p.sleep+=dt;else p.sleep=0;
      if(!p.collected&&p.sleep>.45){p.collected=true;this[p.side]++;}
      if(!p.escaped&&(p.pos[1]<0||Math.abs(p.pos[0])>2.1||Math.abs(p.pos[2])>1.5)){p.escaped=true;this.escaped++;}
    }
    if(this.emitted===CAPACITY)this.running=false;
  }
  constrainBowl(p){
    const center=BOWLS[p.side];let dx=p.pos[0]-center[0],dz=p.pos[2]-center[2],rad=Math.hypot(dx,dz);
    const floor=center[1]+RADIUS;
    if(p.pos[1]<floor){p.pos[1]=floor;if(p.vel[1]<0)p.vel[1]*=-.22;p.vel[0]*=.95;p.vel[2]*=.95;}
    const allowed=.43+.25*Math.max(0,Math.min(.70,p.pos[1]-center[1]))/.70-RADIUS;
    if(rad>allowed&&p.pos[1]<1.12){const nx=dx/rad,nz=dz/rad;p.pos[0]=center[0]+nx*allowed;p.pos[2]=center[2]+nz*allowed;const vn=p.vel[0]*nx+p.vel[2]*nz;if(vn>0){p.vel[0]-=1.3*vn*nx;p.vel[2]-=1.3*vn*nz;}}
  }
  get stats(){return {emitted:this.emitted,stored:CAPACITY-this.emitted,moving:this.emitted-this.left-this.right,left:this.left,right:this.right,collected:this.left+this.right,escaped:this.escaped,collisions:this.collisionCount,gate:this.gate,time:Number(this.time.toFixed(3)),slow:this.slow};}
  diagnostics(){
    let spherePenetration=0,wallError=0,nonFinite=0;
    const free=this.particles.filter(p=>p.state==='free');
    for(const p of this.particles)if(!p.pos.every(Number.isFinite))nonFinite++;
    for(let i=0;i<free.length;i++){const a=free[i],c=BOWLS[a.side];const allowed=.43+.25*Math.max(0,Math.min(.7,a.pos[1]-.32))/.7-RADIUS;wallError=Math.max(wallError,Math.hypot(a.pos[0]-c[0],a.pos[2]-c[2])-allowed,.32+RADIUS-a.pos[1]);for(let j=i+1;j<free.length;j++){const b=free[j];if(a.side===b.side)spherePenetration=Math.max(spherePenetration,2*RADIUS-length(sub(a.pos,b.pos)));}}
    return {...this.stats,spherePenetration,wallError,nonFinite,trackCount:this.particles.filter(p=>p.state==='track').length,freeCount:free.length};
  }
}
