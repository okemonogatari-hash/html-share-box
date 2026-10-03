import {DEFAULT_STATE,VIEWS,normalizeState,clamp} from './model.mjs';
import {renderScene} from './renderer.mjs';

const $=id=>document.getElementById(id),canvas=$('scene'),opening=$('opening'),status=$('status');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let state={...DEFAULT_STATE},frame=0,animation=null,drag=null,downloadURL=null,renderFailed=false;
const size={width:1600,height:1060};

function controls(){
 opening.value=Math.round(state.opening);opening.style.setProperty('--progress',`${state.opening}%`);$('opening-value').innerHTML=`${Math.round(state.opening)}<span>%</span>`;
 const isOpen=state.opening>50;$('toggle-label').textContent=isOpen?'とじる':'ひらく';$('toggle-icon').textContent=isOpen?'↙':'↗';$('toggle-book').setAttribute('aria-label',isOpen?'絵本を閉じる':'絵本を開く');
 document.body.classList.toggle('evening',state.evening);$('daylight').setAttribute('aria-pressed',!state.evening);$('evening').setAttribute('aria-pressed',state.evening);$('fold-guides').checked=state.guides;
 $('scene-caption').textContent=state.opening<8?'次のページに、森が眠っています。':state.opening<75?'紙が起き上がる、その途中。':state.evening?'小さな灯りに、おかえりなさい。':'森の喫茶が、ひらきました。';
 for(const button of document.querySelectorAll('[data-view]')){const v=VIEWS[button.dataset.view];button.setAttribute('aria-pressed',Math.abs(v.yaw-state.yaw)<.015&&Math.abs(v.pitch-state.pitch)<.015&&Math.abs(v.zoom-state.zoom)<.015);}
}
function draw(){
 if(renderFailed)return;
 try{renderScene(canvas,state,size);controls();canvas.dataset.opening=state.opening.toFixed(3);canvas.dataset.rendered='true';}
 catch(error){renderFailed=true;animation=null;canvas.hidden=true;const fallback=document.createElement('div');fallback.className='render-fallback';fallback.innerHTML='<img src="poster.png" alt="ひらく、紙の森の全景"><p>このブラウザでは、立体の表示を開けませんでした。<br>別のブラウザでお試しください。</p>';canvas.parentElement.append(fallback);for(const control of document.querySelectorAll('.workbench button,.workbench input,.view-switch button'))control.disabled=true;status.textContent='このブラウザでは立体の表示を開けませんでした。';console.error(error);}
}
function requestDraw(){if(!frame)frame=requestAnimationFrame(t=>{frame=0;tick(t);});}
function tick(now){
 if(animation){if(animation.start===null)animation.start=now;const t=clamp((now-animation.start)/animation.duration,0,1),ease=t*t*(3-2*t);
  for(const key of Object.keys(animation.to))state[key]=animation.from[key]+(animation.to[key]-animation.from[key])*ease;
  if(t>=1){Object.assign(state,animation.to);animation=null;}
 }
 draw();if(animation)requestDraw();
}
function stopAnimation(){animation=null;}
function animate(to,duration=760){stopAnimation();if(reduced.matches){Object.assign(state,to);requestDraw();return;}animation={from:{...state},to,start:null,duration};requestDraw();}
function setDirect(to){stopAnimation();state=normalizeState({...state,...to});requestDraw();}
function measure(){const bounds=canvas.getBoundingClientRect();if(bounds.width<1||bounds.height<1)return;const ratio=Math.min(window.devicePixelRatio||1,2,2200/bounds.width);size.width=Math.max(1,Math.round(bounds.width*ratio));size.height=Math.max(1,Math.round(bounds.height*ratio));requestDraw();}

opening.addEventListener('input',()=>setDirect({opening:Number(opening.value)}));
$('toggle-book').addEventListener('click',()=>animate({opening:state.opening>50?0:100},1150));
$('daylight').addEventListener('click',()=>setDirect({evening:false}));$('evening').addEventListener('click',()=>setDirect({evening:true}));
$('fold-guides').addEventListener('change',()=>setDirect({guides:$('fold-guides').checked}));
for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>animate({...VIEWS[button.dataset.view]},650));
$('reset').addEventListener('click',()=>{stopAnimation();state={...DEFAULT_STATE};requestDraw();status.textContent='最初の景色に戻しました。';});

canvas.addEventListener('pointerdown',event=>{if(!event.isPrimary||event.button!==0)return;stopAnimation();drag={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);});
canvas.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;drag.x=event.clientX;drag.y=event.clientY;state.yaw+=dx*.006;state.pitch=clamp(state.pitch+dy*.004,.28,1.36);requestDraw();});
function release(event){if(drag?.id===event.pointerId){drag=null;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);}}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',()=>{drag=null;});
canvas.addEventListener('keydown',event=>{
 const keys={ArrowLeft:{yaw:state.yaw-.10},ArrowRight:{yaw:state.yaw+.10},ArrowUp:{pitch:state.pitch+.07},ArrowDown:{pitch:state.pitch-.07},'+':{zoom:state.zoom+.06},'=':{zoom:state.zoom+.06},'-':{zoom:state.zoom-.06}};
 if(keys[event.key]){event.preventDefault();setDirect(keys[event.key]);}
 else if(event.key==='Home'){event.preventDefault();setDirect({yaw:DEFAULT_STATE.yaw,pitch:DEFAULT_STATE.pitch,zoom:1});}
});
reduced.addEventListener('change',()=>{if(reduced.matches&&animation){Object.assign(state,animation.to);animation=null;requestDraw();}});

$('save-png').addEventListener('click',async()=>{
 const button=$('save-png');button.disabled=true;status.textContent='今の景色を画像にしています。';
 // Freeze the visible pose before a separate immutable canvas snapshots it.
 stopAnimation();draw();const snapshot=document.createElement('canvas');snapshot.width=canvas.width;snapshot.height=canvas.height;snapshot.getContext('2d').drawImage(canvas,0,0);
 const filename=`paper-forest-${state.evening?'evening':'day'}-${Math.round(state.opening)}.png`;
 try{
  const blob=await new Promise((resolve,reject)=>snapshot.toBlob(b=>b?resolve(b):reject(new Error('画像を作れませんでした。')),'image/png'));
  if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL=URL.createObjectURL(blob);const link=$('download-link');link.href=downloadURL;link.download=filename;link.hidden=false;link.click();status.textContent='画像を保存しました。必要なら「画像をダウンロード」からもう一度保存できます。';
 }catch(error){status.textContent='画像を保存できませんでした。もう一度お試しください。';}
 finally{button.disabled=false;}
});
window.addEventListener('pagehide',()=>{if(downloadURL){URL.revokeObjectURL(downloadURL);downloadURL=null;$('download-link').hidden=true;$('download-link').removeAttribute('href');}if(frame)cancelAnimationFrame(frame);frame=0;animation=null;});
window.addEventListener('pageshow',()=>{measure();});
if('ResizeObserver'in window)new ResizeObserver(measure).observe(canvas.parentElement);else window.addEventListener('resize',measure);
if(document.fonts?.ready)document.fonts.ready.then(requestDraw);
measure();draw();
