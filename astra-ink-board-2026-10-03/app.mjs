import {createSession,execute,undo,redo,at,parseSquare,squareName,NAMES,cleanView,centerOf,captureState,clone} from './model.mjs';
import {Renderer} from './renderer.mjs';

const $=selector=>document.querySelector(selector),$$=selector=>[...document.querySelectorAll(selector)];
const canvas=$('#art-canvas'),wrap=$('#canvas-wrap'),session=createSession();
let view=cleanView(),mode='select',pieceType='knight',side='light',renderer,frame=0,downloadURL=null,captureNumber=0,keyboardSquare=null,disposed=false;
const status=message=>{$('#status').textContent=message;};
for(let rank=0;rank<8;rank++)for(let file=0;file<8;file++){const option=document.createElement('option');option.value=squareName(file,rank);option.textContent=option.value;$('#square-picker').append(option);}
function currentState(){return {...session.present,focusSquare:keyboardSquare};}
function render(){frame=0;if(disposed||!renderer)return;try{const rect=canvas.getBoundingClientRect(),pixelRatio=Math.min(window.devicePixelRatio||1,2),width=Math.max(1,Math.round(rect.width*pixelRatio)),height=Math.max(1,Math.round(rect.height*pixelRatio));renderer.render(currentState(),view,{width,height,pixelRatio});canvas.dataset.ready='true';}catch(error){fail(error);}}
function requestRender(){if(!frame&&!disposed&&renderer)frame=requestAnimationFrame(render);}
function revokeDownload(){if(downloadURL){URL.revokeObjectURL(downloadURL);downloadURL=null;}$('#download-link').hidden=true;$('#download-link').removeAttribute('href');}
function update(){
 const selected=session.present.pieces.find(p=>p.id===session.present.selected);$('#remove').disabled=!selected;$('#clear-selection').disabled=!selected;$('#undo').disabled=!session.past.length;$('#redo').disabled=!session.future.length;$('#piece-count').textContent=`${session.present.pieces.length} pieces`;
 $('#mode-select').setAttribute('aria-pressed',String(mode==='select'));$('#mode-place').setAttribute('aria-pressed',String(mode==='place'));
 $$('[data-piece]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.piece===pieceType)));$$('[data-side]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.side===side)));
 $('#mode-help').innerHTML=mode==='place'?`${side==='light'?'白':'青'}の${NAMES[pieceType]}を、空いたマスにタップ。<br>続けていくつでも置けます。`:'駒 → 空きマスの順にタップ。<br>別の駒をタップすると選び直せます。';
 $('#apply-square').textContent=mode==='place'?'このマスに置く':'このマスを選ぶ';
 $('#camera-top').setAttribute('aria-pressed',String(view.elevation===90));$('#camera-iso').setAttribute('aria-pressed',String(view.elevation!==90));
 for(const key of['ink','hatching']){$('#'+key).value=String(view[key]);$('#'+key+'-value').value=String(Math.round(view[key]));}
 canvas.setAttribute('aria-label',selected?`${squareName(selected.file,selected.rank)} の${NAMES[selected.type]}を選択中。空きマスをタップすると移動。矢印キーとEnterでも操作できます。`:`青いボールペンのスケッチ盤。${session.present.pieces.length}駒。${mode==='place'?NAMES[pieceType]+'を空きマスに置けます。':'駒を選んで空きマスに動かせます。'}矢印キーとEnterでも操作できます。`);
 requestRender();
}
function command(cmd){const result=execute(session,cmd);if(result.message)status(result.message);if(result.changed)revokeDownload();update();return result;}
function chooseMode(next){mode=next;command({type:'select',id:null});status(next==='place'?`${side==='light'?'白':'青'}の${NAMES[pieceType]}を、空いたマスに置いてください。`:'動かしたい駒を選んでください。');}
function applySquare(file,rank){
 $('#square-picker').value=squareName(file,rank);const occupant=at(session.present,file,rank);
 if(mode==='place'){command({type:'place',file,rank,piece:pieceType,side});return;}
 if(occupant){command({type:'select',id:occupant.id===session.present.selected?null:occupant.id});}
 else if(session.present.selected){command({type:'move',file,rank});}
 else status(`${squareName(file,rank)} は空いています。「駒を置く」で新しい駒を置けます。`);
}
function fail(error){console.error(error);renderer=null;canvas.hidden=true;$('#fallback').hidden=false;$$('.tools button,.tools input,.tools select').forEach(el=>el.disabled=true);status('立体表示を開けませんでした。完成見本を表示しています。');}
try{renderer=new Renderer(canvas);}catch(error){fail(error);}
$('#mode-select').addEventListener('click',()=>chooseMode('select'));$('#mode-place').addEventListener('click',()=>chooseMode('place'));
$$('[data-piece]').forEach(b=>b.addEventListener('click',()=>{pieceType=b.dataset.piece;chooseMode('place');}));$$('[data-side]').forEach(b=>b.addEventListener('click',()=>{side=b.dataset.side;chooseMode('place');}));
$('#remove').addEventListener('click',()=>command({type:'remove'}));$('#clear-selection').addEventListener('click',()=>command({type:'select',id:null}));
$('#apply-square').addEventListener('click',()=>{const square=parseSquare($('#square-picker').value);if(square)applySquare(square.file,square.rank);});
$('#composition').addEventListener('change',event=>{keyboardSquare=null;command({type:'preset',name:event.target.value});});
$('#undo').addEventListener('click',()=>{if(undo(session)){revokeDownload();status('ひとつ前の並びに戻しました。');update();}});
$('#redo').addEventListener('click',()=>{if(redo(session)){revokeDownload();status('並びをやり直しました。');update();}});
$('#camera-iso').addEventListener('click',()=>{view.elevation=44;view.yaw=-32;revokeDownload();update();status('斜めから眺めています。');});
$('#camera-top').addEventListener('click',()=>{view.elevation=90;view.yaw=0;revokeDownload();update();status('真上から眺めています。');});
for(const[id,delta]of[['orbit-left',-20],['orbit-right',20]])$('#'+id).addEventListener('click',()=>{view.yaw=((view.yaw+delta+540)%360)-180;revokeDownload();update();status('眺める向きを変えました。');});
for(const key of['ink','hatching'])$('#'+key).addEventListener('input',event=>{view=cleanView({...view,[key]:event.target.value});revokeDownload();update();});
$('#reset').addEventListener('click',()=>{view=cleanView();mode='select';pieceType='knight';side='light';keyboardSquare=null;$('#composition').value='quiet';command({type:'preset',name:'quiet'});status('最初の午後へ戻しました。並びは「元に戻す」で復元できます。');});
let pointerStart=null;
canvas.addEventListener('pointerdown',event=>{pointerStart={x:event.clientX,y:event.clientY};});
canvas.addEventListener('pointercancel',()=>{pointerStart=null;});
canvas.addEventListener('pointerup',event=>{if(!renderer||!pointerStart)return;const p=pointerStart;pointerStart=null;if(Math.hypot(event.clientX-p.x,event.clientY-p.y)>10)return;const rect=canvas.getBoundingClientRect(),hit=renderer.pick((event.clientX-rect.left)*canvas.width/rect.width,(event.clientY-rect.top)*canvas.height/rect.height);keyboardSquare=null;
 if(hit?.id){const piece=session.present.pieces.find(p=>p.id===hit.id);if(piece)applySquare(piece.file,piece.rank);}else if(hit?.square){applySquare(hit.square.file,hit.square.rank);}else if(session.present.selected)command({type:'select',id:null});else status('盤のマスをタップしてください。');
});
canvas.addEventListener('keydown',event=>{
 const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]};if(moves[event.key]){event.preventDefault();const p=keyboardSquare||parseSquare($('#square-picker').value)||{file:0,rank:0},[df,dr]=moves[event.key];keyboardSquare={file:Math.min(7,Math.max(0,p.file+df)),rank:Math.min(7,Math.max(0,p.rank+dr))};$('#square-picker').value=squareName(keyboardSquare.file,keyboardSquare.rank);const piece=at(session.present,keyboardSquare.file,keyboardSquare.rank);status(`${$('#square-picker').value}、${piece?NAMES[piece.type]:'空きマス'}。Enterで${mode==='place'?'置く':'選択・移動'}。`);requestRender();}
 else if(event.key==='Enter'||event.key===' '){event.preventDefault();const p=keyboardSquare||parseSquare($('#square-picker').value);if(p)applySquare(p.file,p.rank);}
 else if(event.key==='Escape'){event.preventDefault();keyboardSquare=null;command({type:'select',id:null});}
 else if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();command({type:'remove'});}
});
canvas.addEventListener('blur',()=>{keyboardSquare=null;requestRender();});
document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)){event.preventDefault();const changed=event.shiftKey?redo(session):undo(session);if(changed){revokeDownload();status(event.shiftKey?'並びをやり直しました。':'ひとつ前の並びに戻しました。');update();}}});
$('#save-png').addEventListener('click',()=>{
 if(!renderer)return;const number=++captureNumber,snapshot=captureState(session,view);revokeDownload();if(frame){cancelAnimationFrame(frame);frame=0;}render();if(!renderer)return;
 // Export only the drawing. Hide interaction marks for the synchronous copy,
 // then immediately restore them on screen before asynchronous PNG encoding.
 const pixelRatio=Math.min(window.devicePixelRatio||1,2);
 renderer.render({pieces:snapshot.pieces,selected:null,focusSquare:null},snapshot.view,{width:canvas.width,height:canvas.height,pixelRatio});
 const copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;const ctx=copy.getContext('2d');ctx.drawImage(canvas,0,0);render();const save=$('#save-png');save.disabled=true;status('この瞬間のスケッチを画像にしています。');
 copy.toBlob(blob=>{save.disabled=false;if(!blob){status('画像を作れませんでした。もう一度お試しください。');return;}if(disposed||number!==captureNumber)return;downloadURL=URL.createObjectURL(blob);const link=$('#download-link');link.href=downloadURL;link.download=`ink-board-${snapshot.count}pieces-${snapshot.view.elevation===90?'top':'angle'}.png`;link.hidden=false;link.textContent='保存した画像をもう一度ダウンロード';link.click();status(`${snapshot.count}駒のスケッチを保存しました。下のリンクからも取り出せます。`);},'image/png');
});
const resize=new ResizeObserver(requestRender);resize.observe(wrap);
window.addEventListener('pagehide',()=>{disposed=true;if(frame)cancelAnimationFrame(frame);frame=0;captureNumber++;revokeDownload();});
window.addEventListener('pageshow',()=>{disposed=false;update();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;}else requestRender();});
// Read-only diagnostics for reproducible acceptance. No hidden UI interaction path.
Object.defineProperty(window,'__inkBoard',{value:Object.freeze({snapshot:()=>clone({state:session.present,view,mode,pieceType,side,past:session.past.length,future:session.future.length,frame,stats:renderer?.stats||null}),projectSquare:(name)=>{const p=parseSquare(name);if(!p||!renderer?.camera)return null;const point=renderer.camera.project(centerOf(p.file,p.rank)),rect=canvas.getBoundingClientRect();return {x:rect.left+point.x*rect.width/canvas.width,y:rect.top+point.y*rect.height/canvas.height};}})});
update();
