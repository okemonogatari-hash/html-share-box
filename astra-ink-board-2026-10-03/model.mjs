// Pure composition model. Chess movement rules are deliberately absent.
export const TYPES=['king','queen','rook','bishop','knight','pawn'];
export const NAMES={king:'キング',queen:'クイーン',rook:'ルーク',bishop:'ビショップ',knight:'ナイト',pawn:'ポーン'};
export const SYMBOLS={king:'♔',queen:'♕',rook:'♖',bishop:'♗',knight:'♘',pawn:'♙'};
export const FILES='abcdefgh';
export const clamp=(n,min,max,fallback=min)=>Number.isFinite(Number(n))?Math.min(max,Math.max(min,Number(n))):fallback;
export const squareName=(file,rank)=>FILES[file]+(rank+1);
export function parseSquare(value){const m=/^([a-h])([1-8])$/.exec(String(value));return m?{file:FILES.indexOf(m[1]),rank:Number(m[2])-1}:null;}
export const validSquare=(f,r)=>Number.isInteger(f)&&Number.isInteger(r)&&f>=0&&f<8&&r>=0&&r<8;
export const centerOf=(f,r)=>[f-3.5,.045,3.5-r];
export const clone=value=>JSON.parse(JSON.stringify(value));
export function composition(name='quiet'){
 const pieces=[];const add=(type,side,file,rank)=>pieces.push({id:'p'+(pieces.length+1),type,side,file,rank});
 if(name==='opening'){for(const side of['light','dark']){const back=side==='light'?0:7,front=side==='light'?1:6;['rook','knight','bishop','queen','king','bishop','knight','rook'].forEach((t,f)=>add(t,side,f,back));for(let f=0;f<8;f++)add('pawn',side,f,front);}}
 else if(name==='study'){
  [['king','light',1,2],['queen','dark',4,4],['bishop','light',3,1],['knight','dark',6,3],['rook','light',1,5],['pawn','dark',5,6]].forEach(p=>add(...p));
 }else{
  [['king','light',4,0],['queen','light',2,2],['knight','light',5,2],['pawn','light',3,3],['rook','dark',6,5],['king','dark',4,7],['bishop','dark',2,5],['pawn','dark',5,5]].forEach(p=>add(...p));
 }
 return {pieces,nextId:pieces.length+1,selected:null};
}
export function createSession(name='quiet'){return {present:composition(name),past:[],future:[]};}
export const at=(state,file,rank)=>state.pieces.find(p=>p.file===file&&p.rank===rank)||null;
export function execute(session,command){
 const state=clone(session.present),before=clone(session.present);let message='',changed=false;
 if(command.type==='select'){const piece=state.pieces.find(p=>p.id===command.id);state.selected=piece?.id??null;session.present=state;return {changed:false,message:piece?`${NAMES[piece.type]} ${squareName(piece.file,piece.rank)} を選択。空いたマスを選ぶと移動します。`:'選択を解除しました。'};}
 if(command.type==='place'){
  const {file,rank}=command;if(!validSquare(file,rank)||!TYPES.includes(command.piece)||!['light','dark'].includes(command.side))return {changed:false,message:'置く駒とマスを選んでください。'};
  if(at(state,file,rank))return {changed:false,message:`${squareName(file,rank)} には駒があります。「選ぶ・動かす」で選べます。`};
  state.pieces.push({id:'p'+state.nextId++,type:command.piece,side:command.side,file,rank});state.selected=null;changed=true;message=`${squareName(file,rank)} に${NAMES[command.piece]}を置きました。`;
 }else if(command.type==='move'){
  const piece=state.pieces.find(p=>p.id===state.selected);if(!piece||!validSquare(command.file,command.rank))return {changed:false,message:'動かす駒を先に選んでください。'};
  if(at(state,command.file,command.rank))return {changed:false,message:'そのマスには駒があります。空いたマスへ移動できます。'};
  piece.file=command.file;piece.rank=command.rank;changed=true;message=`${NAMES[piece.type]}を ${squareName(piece.file,piece.rank)} へ動かしました。`;state.selected=null;
 }else if(command.type==='remove'){
  const piece=state.pieces.find(p=>p.id===state.selected);if(!piece)return {changed:false,message:'取り除く駒を選んでください。'};
  state.pieces=state.pieces.filter(p=>p.id!==state.selected);state.selected=null;changed=true;message=`${NAMES[piece.type]}を取り除きました。`;
 }else if(command.type==='preset'){
  if(!['quiet','study','opening','empty'].includes(command.name))return {changed:false,message:'構図を選んでください。'};
  const next=command.name==='empty'?{pieces:[],nextId:1,selected:null}:composition(command.name);Object.assign(state,next);changed=true;message=command.name==='empty'?'盤を空にしました。元に戻すこともできます。':'構図を並べ直しました。';
 }
 if(changed){session.past.push(before);if(session.past.length>100)session.past.shift();session.future=[];session.present=state;}
 return {changed,message};
}
export function undo(session){if(!session.past.length)return false;session.future.push(clone(session.present));session.present=session.past.pop();return true;}
export function redo(session){if(!session.future.length)return false;session.past.push(clone(session.present));session.present=session.future.pop();return true;}
export function cleanView(view={}){return {yaw:clamp(view.yaw,-3600,3600,-32),elevation:clamp(view.elevation,28,90,44),ink:clamp(view.ink,35,100,76),hatching:clamp(view.hatching,0,100,68)};}
const dot=(a,b)=>a.reduce((sum,n,i)=>sum+n*b[i],0);
export function makeCamera(width,height,view={}){
 const W=clamp(width,1,10000,800),H=clamp(height,1,10000,700),v=cleanView(view),a=v.yaw*Math.PI/180,e=v.elevation*Math.PI/180;
 const right=[Math.cos(a),0,-Math.sin(a)],up=[-Math.sin(a)*Math.sin(e),Math.cos(e),-Math.cos(a)*Math.sin(e)],front=[Math.sin(a)*Math.cos(e),Math.sin(e),Math.cos(a)*Math.cos(e)];
 const bounds=[];for(const x of[-4.85,4.85])for(const y of[-.06,2.1])for(const z of[-4.85,4.85])bounds.push([x,y,z]);
 const xs=bounds.map(p=>dot(p,right)),ys=bounds.map(p=>dot(p,up)),loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys);
 const scale=Math.min(W*.93/(hiX-loX),H*.89/(hiY-loY)),cx=W/2-(loX+hiX)/2*scale,cy=H*.49+(loY+hiY)/2*scale;
 const project=p=>({x:cx+dot(p,right)*scale,y:cy-dot(p,up)*scale,depth:dot(p,front),scale});
 return {project,scale,width:W,height:H,front,right,up};
}
export function inTriangle(x,y,a,b,c){const area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);if(Math.abs(area)<1e-8)return null;const u=((b.x-x)*(c.y-y)-(b.y-y)*(c.x-x))/area,v=((c.x-x)*(a.y-y)-(c.y-y)*(a.x-x))/area,w=1-u-v;return u>=-1e-5&&v>=-1e-5&&w>=-1e-5?{u,v,w}:null;}
export function captureState(session,view){return Object.freeze({pieces:clone(session.present.pieces),view:cleanView(view),count:session.present.pieces.length});}
