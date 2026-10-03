import test from 'node:test';
import assert from 'node:assert/strict';
import {composition,createSession,execute,undo,redo,captureState,cleanView,makeCamera,parseSquare,inTriangle} from '../model.mjs';
import {buildScene} from '../geometry.mjs';

test('three compositions contain unique, valid squares and the full opening has 32 pieces',()=>{
 for(const[name,count]of[['quiet',8],['study',6],['opening',32]]){const s=composition(name);assert.equal(s.pieces.length,count);assert.equal(new Set(s.pieces.map(p=>`${p.file},${p.rank}`)).size,count);assert.equal(new Set(s.pieces.map(p=>p.id)).size,count);for(const p of s.pieces){assert.ok(p.file>=0&&p.file<8&&p.rank>=0&&p.rank<8);}}
 assert.equal(new Set(composition('study').pieces.map(p=>p.type)).size,6);
});
test('placement rejects occupied squares without erasing or adding history',()=>{
 const s=createSession(),before=JSON.stringify(s);const result=execute(s,{type:'place',file:4,rank:0,piece:'queen',side:'dark'});assert.equal(result.changed,false);assert.equal(JSON.stringify(s),before);
 execute(s,{type:'place',file:0,rank:0,piece:'knight',side:'dark'});assert.equal(s.present.pieces.length,9);assert.equal(s.past.length,1);assert.equal(s.present.pieces.at(-1).side,'dark');
});
test('selection is reversible UI state, movement is one undoable transaction',()=>{
 const s=createSession(),first=s.present.pieces[0];execute(s,{type:'select',id:first.id});assert.equal(s.past.length,0);execute(s,{type:'move',file:0,rank:2});assert.equal(s.present.pieces[0].file,0);assert.equal(s.present.selected,null);assert.equal(s.past.length,1);assert.ok(undo(s));assert.equal(s.present.pieces[0].file,first.file);assert.equal(s.present.selected,first.id);assert.ok(redo(s));assert.equal(s.present.pieces[0].rank,2);
});
test('occupied moves and invalid commands do not change a composition',()=>{
 const s=createSession();execute(s,{type:'select',id:s.present.pieces[0].id});const before=JSON.stringify(s);for(const cmd of[{type:'move',file:2,rank:2},{type:'move',file:-1,rank:0},{type:'place',file:NaN,rank:0,piece:'rook',side:'light'},{type:'place',file:0,rank:0,piece:'dragon',side:'light'},{type:'place',file:0,rank:0,piece:'king',side:'neon'},{type:'preset',name:'unknown'}]){assert.equal(execute(s,cmd).changed,false);assert.equal(JSON.stringify(s),before);}
});
test('remove, clear and a full preset can each be undone without losing pieces',()=>{
 const s=createSession();execute(s,{type:'select',id:s.present.pieces[0].id});execute(s,{type:'remove'});assert.equal(s.present.pieces.length,7);assert.ok(undo(s));assert.equal(s.present.pieces.length,8);execute(s,{type:'preset',name:'empty'});assert.equal(s.present.pieces.length,0);assert.ok(undo(s));assert.equal(s.present.pieces.length,8);execute(s,{type:'preset',name:'opening'});assert.equal(s.present.pieces.length,32);assert.ok(undo(s));assert.equal(s.present.pieces.length,8);
});
test('a changed branch clears redo and piece IDs remain unique',()=>{
 const s=createSession();execute(s,{type:'place',file:0,rank:0,piece:'rook',side:'light'});undo(s);assert.equal(s.future.length,1);execute(s,{type:'place',file:0,rank:1,piece:'pawn',side:'dark'});assert.equal(s.future.length,0);assert.equal(redo(s),false);assert.equal(new Set(s.present.pieces.map(p=>p.id)).size,9);
});
test('capture is independent of subsequent edits to pieces, camera and history',()=>{
 const s=createSession(),view=cleanView(),snapshot=captureState(s,view);execute(s,{type:'preset',name:'empty'});view.yaw=150;assert.equal(snapshot.count,8);assert.equal(snapshot.pieces.length,8);assert.equal(snapshot.view.yaw,-32);s.past[0].pieces[0].file=1;assert.equal(snapshot.pieces[0].file,4);assert.ok(Object.isFrozen(snapshot));
});
test('camera and ink inputs are finite and bounded',()=>{
 const v=cleanView({yaw:Infinity,elevation:NaN,ink:-900,hatching:999});assert.deepEqual(v,{yaw:-32,elevation:44,ink:35,hatching:100});assert.equal(parseSquare('a1').rank,0);assert.deepEqual(parseSquare('h8'),{file:7,rank:7});for(const v of['a0','i8','a11',null,{}])assert.equal(parseSquare(v),null);
});
test('every real mesh vertex fits at all allowed views on a phone and desktop',()=>{
 const scene=buildScene(composition('opening')),points=scene.triangles.flatMap(t=>t.v.map(v=>v.p)).concat(scene.lines.flatMap(l=>l.points));
 for(const[W,H]of[[690,622],[347,365]])for(const elevation of[28,44,70,90])for(let yaw=-180;yaw<=180;yaw+=20){const {project}=makeCamera(W,H,{yaw,elevation});for(const p of points){const q=project(p);assert.ok(Number.isFinite(q.x)&&Number.isFinite(q.y)&&Number.isFinite(q.depth));assert.ok(q.x>=0&&q.x<=W&&q.y>=0&&q.y<=H,`${W}x${H} / yaw${yaw} / elevation${elevation}: ${JSON.stringify(q)}`);}}
});
test('all six piece meshes have finite normals, recognizable heights and complete triangles',()=>{
 const state=composition('study'),scene=buildScene(state);for(const piece of state.pieces){const tris=scene.triangles.filter(t=>t.id===piece.id);assert.ok(tris.length>100);const ys=tris.flatMap(t=>t.v.map(v=>v.p[1]));assert.ok(Math.max(...ys)>1.1);for(const tri of tris)for(const v of tri.v){assert.equal(v.p.length,3);assert.ok(v.p.every(Number.isFinite));assert.ok(v.n.every(Number.isFinite));}}
});
test('screen triangle picking rejects zero-area triangles and interpolates depths',()=>{
 const a={x:0,y:0,depth:0},b={x:10,y:0,depth:10},c={x:0,y:10,depth:20},r=inTriangle(2,3,a,b,c);assert.ok(r);assert.equal(Math.round((r.u*a.depth+r.v*b.depth+r.w*c.depth)*10),80);assert.equal(inTriangle(11,11,a,b,c),null);assert.equal(inTriangle(1,1,a,a,a),null);
});
