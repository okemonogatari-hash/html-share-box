import {initialState,setValue,moving,advance,wrap,VIEWS,clamp} from './model.mjs';
import {Renderer} from './renderer.mjs';
const $=id=>document.getElementById(id),canvas=$('engine-canvas');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let state=initialState(reduced.matches),renderer,frame=0,lastTime=null,active=!document.hidden,failed=false,blobURL=null,exportToken=0,drag=null;
const message=text=>$('message').textContent=text;
function sync(){
 for(const key of['cutaway','explode','speed']){$(key).value=String(state[key]);$(key+'-value').value=`${Math.round(state[key])}%`;$(key).style.setProperty('--fill',state[key]+'%');}
 const degrees=Math.round(wrap(state.angle)*180/Math.PI);$('angle').value=String(degrees);$('angle-value').value=degrees+'°';$('angle').style.setProperty('--fill',degrees/360*100+'%');$('angle').disabled=moving(state)||failed;
 $('toggle-play').setAttribute('aria-pressed',String(state.playing));$('play-label').textContent=state.playing?'一時停止':'再開';$('play-icon').textContent=state.playing?'Ⅱ':'▷';
 $('airflow').setAttribute('aria-checked',String(state.airflow));
 $('angle-hint').textContent=moving(state)?'一時停止すると、手で回せます。':'角度を動かして、羽根の曲がりを眺めましょう。';
 $('motion-status').replaceChildren();const dot=document.createElement('i');if(!moving(state))dot.style.background='#a19472';$('motion-status').append(dot,document.createTextNode(moving(state)?'羽根が回っています':state.speed===0?'速度 0・停止中':'静かな機関室・停止中'));
 document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===state.view)));
}
function stopFrame(){if(frame)cancelAnimationFrame(frame);frame=0;lastTime=null;}
function fail(){failed=true;stopFrame();$('fallback').hidden=false;$('stage').classList.add('failed');document.querySelectorAll('.controls button,.controls input,.view-bar button').forEach(el=>el.disabled=true);canvas.tabIndex=-1;message('WebGL対応のブラウザで操作できます。');}
function draw(){if(!failed&&renderer)renderer.draw(state);}
function tick(time){frame=0;if(!active||failed)return;const elapsed=lastTime===null?0:(time-lastTime)/1000;lastTime=time;advance(state,elapsed);draw();if(moving(state)){const deg=Math.round(wrap(state.angle)*180/Math.PI);$('angle').value=String(deg);$('angle-value').value=deg+'°';frame=requestAnimationFrame(tick);}else lastTime=null;}
function requestDraw(){if(active&&!failed&&!frame)frame=requestAnimationFrame(tick);}
function edited(){sync();requestDraw();}
for(const key of['cutaway','explode','speed','angle'])$(key).addEventListener('input',()=>{if(failed)return;if(key==='angle'&&moving(state))return;setValue(state,key,$(key).value);if(key==='speed'&&!moving(state))lastTime=null;edited();});
$('toggle-play').addEventListener('click',()=>{state.playing=!state.playing;lastTime=null;edited();});
$('airflow').addEventListener('click',()=>{state.airflow=!state.airflow;edited();});
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{Object.assign(state,VIEWS[button.dataset.view]);state.view=button.dataset.view;edited();}));
$('reset').addEventListener('click',()=>{state=initialState(reduced.matches);lastTime=null;message('はじめの姿に戻しました。');edited();});
canvas.addEventListener('pointerdown',event=>{if(failed||event.button!==0)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,yaw:state.yaw,pitch:state.pitch};canvas.setPointerCapture(event.pointerId);});
canvas.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;state.yaw=wrap(drag.yaw+(event.clientX-drag.x)*.007+Math.PI)-Math.PI;state.pitch=clamp(drag.pitch+(event.clientY-drag.y)*.006,-.18,1.4);state.view='custom';edited();});
const endDrag=event=>{if(drag?.id===event.pointerId)drag=null;};canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',endDrag);
canvas.addEventListener('keydown',event=>{if(failed||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();if(event.key==='ArrowLeft')state.yaw-=.12;if(event.key==='ArrowRight')state.yaw+=.12;if(event.key==='ArrowUp')state.pitch+=.08;if(event.key==='ArrowDown')state.pitch-=.08;state.yaw=wrap(state.yaw+Math.PI)-Math.PI;state.pitch=clamp(state.pitch,-.18,1.4);state.view='custom';edited();});
function revokeURL(){if(blobURL){URL.revokeObjectURL(blobURL);blobURL=null;}$('download-again').hidden=true;$('download-again').removeAttribute('href');}
$('export').addEventListener('click',()=>{
 if(failed)return;const token=++exportToken;revokeURL();
 // Copy immediately: later animation or edits cannot change this capture.
 draw();const snapshot=document.createElement('canvas');snapshot.width=canvas.width;snapshot.height=canvas.height;const context=snapshot.getContext('2d');if(!context){message('画像の保存を準備できませんでした。');return;}context.drawImage(canvas,0,0);message('この姿を保存しています…');
 snapshot.toBlob(blob=>{if(token!==exportToken||!blob){if(token===exportToken)message('画像の保存を準備できませんでした。');return;}blobURL=URL.createObjectURL(blob);const filename='風の機関室.png',a=document.createElement('a');a.href=blobURL;a.download=filename;a.click();$('download-again').href=blobURL;$('download-again').download=filename;$('download-again').hidden=false;message('PNGを保存しました。今の構図はそのままです。');},'image/png');
});
document.addEventListener('visibilitychange',()=>{active=!document.hidden;if(!active)stopFrame();else{lastTime=null;requestDraw();}});
window.addEventListener('pagehide',()=>{active=false;stopFrame();exportToken++;revokeURL();});
window.addEventListener('pageshow',()=>{active=!document.hidden;lastTime=null;requestDraw();});
window.addEventListener('resize',requestDraw);
if(typeof ResizeObserver!=='undefined')new ResizeObserver(requestDraw).observe(canvas);
reduced.addEventListener?.('change',event=>{if(event.matches){state.playing=false;lastTime=null;edited();}});
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fail();});
try{renderer=new Renderer(canvas);sync();draw();requestDraw();}catch(error){console.warn('機関室の描画を開始できませんでした。',error);fail();}
Object.defineProperty(window,'__ENGINE__',{value:Object.freeze({snapshot:()=>Object.freeze({state:Object.freeze({...state}),running:active&&!failed&&moving(state),rafPending:frame!==0,frame,active,failed,stats:Object.freeze({...renderer?.stats}),camera:renderer?.camera?Object.freeze({scale:renderer.camera.scale,eye:[...renderer.camera.eye],target:[...renderer.camera.target]}):null})}),writable:false,configurable:false});
