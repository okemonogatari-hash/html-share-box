import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_STATE,normalizeState,foldAmount,pagePoint,paperPoint,camera} from '../model.mjs';
import {buildWorld} from '../renderer.mjs';
import {triangulate} from '../gpu.mjs';

test('不正な開き具合・角度・ズームは有限の操作範囲に収まる',()=>{
 for(const input of [{opening:NaN,yaw:Infinity,pitch:NaN,zoom:Infinity},{opening:-2,pitch:-9,zoom:0},{opening:300,pitch:9,zoom:300}]){
  const state=normalizeState(input);for(const key of ['opening','yaw','pitch','zoom'])assert.ok(Number.isFinite(state[key]));assert.ok(state.opening>=0&&state.opening<=100);assert.ok(state.pitch>=.28&&state.pitch<=1.36);assert.ok(state.zoom>=.72&&state.zoom<=1.5);
 }
 for(const [w,h]of[[0,0],[NaN,Infinity],[1,1]]){const p=camera(DEFAULT_STATE,w,h)([0,0,0]);assert.ok(Object.values(p).every(Number.isFinite));}
});
test('紙の立ち上がりは0から1へ単調に進む',()=>{
 assert.equal(foldAmount(0),0);assert.equal(foldAmount(100),1);let previous=-1;for(let n=0;n<=100;n++){const now=foldAmount(n);assert.ok(now>=previous&&now<=1);previous=now;}
});
test('閉じた時は、両側の紙片が左右ページの間に収まる',()=>{
 for(const x of[.3,1,2,5.5]){
  const lower=pagePoint([-x,0,0],-1,0)[1],upper=pagePoint([x,0,0],1,0)[1];
  for(const side of[-1,1])for(const height of[0,.5,1,3.1]){
   const p=paperPoint([0,height,0],[side*x,0,0],{opening:0});assert.ok(p[1]>lower&&p[1]<upper);assert.ok(Math.abs(p[0]+x)<1e-9);
  }
 }
});
test('全開の木はページから立ち上がり、0%では完全に平らになる',()=>{
 const a=[-3,0,-2];for(const opening of[0,100]){const root=paperPoint([0,0,0],a,{opening}),top=paperPoint([0,2,0],a,{opening});assert.ok(Math.abs((top[1]-root[1])-(opening?2:0))<1e-9);}
});
test('全操作域の頂点は有限で、標準倍率では実際の描画範囲に収まる',()=>{
 let checked=0;
 for(const opening of[0,1,25,50,60,99,100])for(const yaw of[-Math.PI,-Math.PI/2,-.37,0,Math.PI/2,Math.PI])for(const pitch of[.28,.72,1.36]){
  const state={...DEFAULT_STATE,opening,yaw,pitch},points=buildWorld(state).flatMap(item=>item.points);assert.ok(points.every(p=>p.every(Number.isFinite)));
  for(const [width,height]of[[1290,792],[371,353]]){
   const project=camera(state,width,height,points);
   for(const p of points){const q=project(p);assert.ok(Object.values(q).every(Number.isFinite));assert.ok(q.x>=width*.05-1e-6&&q.x<=width*.95+1e-6);assert.ok(q.y>=height*.12-1e-6&&q.y<=height*.89+1e-6);checked++;}
  }
 }
 assert.ok(checked>500000);
});
const area=points=>Math.abs(points.reduce((sum,p,i)=>sum+p.x*points[(i+1)%points.length].y-points[(i+1)%points.length].x*p.y,0)*.5);
test('凹んだ木や表紙の三角形分割が、元の紙面の面積を失わない',()=>{
 for(const opening of[0,1,25,60,100])for(const yaw of[-2,-.37,0,1.5]){
  const state={...DEFAULT_STATE,opening,yaw},items=buildWorld(state),project=camera(state,1290,792,items.flatMap(item=>item.points));
  for(const item of items){if(item.kind!=='poly')continue;const ps=item.points.map(project),a=area(ps),b=triangulate(ps).reduce((sum,t)=>sum+area(t.map(i=>ps[i])),0);assert.ok(Math.abs(a-b)<.02,`${opening}%, ${yaw}, ${item.color}: ${a-b}`);}
 }
});
