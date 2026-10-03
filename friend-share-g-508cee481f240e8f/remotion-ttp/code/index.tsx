import React from 'react';
import {AbsoluteFill,Composition,OffthreadVideo,registerRoot,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import motion from './motion.json';
import balls from './ball-motion.json';
import ballFrames from './ball-frames.json';
const FPS=60, N=658;
type Pt=[number,number];
const mix=(a:number,b:number,k:number)=>a+(b-a)*k;
function poseAt(t:number){const f=Math.min(motion.frames.length-1,Math.max(0,t*motion.fps)),i=Math.floor(f),j=(i===545?i:Math.min(i+1,motion.frames.length-1));return motion.frames[i].map((a,k)=>a.map((n,d)=>mix(n,motion.frames[j][k][d],f-i)));}
function ballAt(t:number){let f=Math.max(0,Math.min(657,t*60)),i=Math.floor(f),j=Math.min(657,i+1),k=f-i;return {x:mix(ballFrames[i][0],ballFrames[j][0],k),y:mix(ballFrames[i][1],ballFrames[j][1],k),r:mix(ballFrames[i][2],ballFrames[j][2],k)};}
const poly=(ps:Pt[])=>ps.map(p=>p.join(',')).join(' ');
const mid=(a:Pt,b:Pt):Pt=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
const dist=(a:Pt,b:Pt)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const line=(a:Pt,b:Pt,color:string,width:number,key:string)=><line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth={width} strokeLinecap="round"/>;
function Ball({b,opacity=1}:{b:{x:number;y:number;r:number};opacity?:number}){return <g opacity={opacity}><circle cx={b.x} cy={b.y} r={b.r} fill="url(#ball)"/><ellipse cx={b.x-b.r*.28} cy={b.y-b.r*.32} rx={b.r*.27} ry={b.r*.12} fill="#aaaaa7" opacity=".28" transform={`rotate(-30,${b.x},${b.y})`}/></g>}
function Lane(){return <g>
<rect width="720" height="1280" fill="url(#wood)"/><rect width="720" height="400" fill="url(#ceiling)"/>
{[0,1,2,3].map(i=><path key={i} d={`M0 ${30+i*74} L720 ${40+i*74}`} stroke="#f8f2d8" strokeWidth="11"/>)}
<rect y="313" width="720" height="64" fill="#e7ded1"/>
{Array.from({length:9},(_,i)=><g key={i}><rect x={i*94-35} y="344" width="76" height="26" rx="2" fill={i%2?'#ab6793':'#7082a3'}/><path d={`M${i*94-18} 357 h38`} stroke="#fff7ed" strokeWidth="3"/></g>)}
<rect y="382" width="720" height="24" fill="#182427"/>
{Array.from({length:10},(_,i)=>{let v=90+i*78;return <polygon key={i} points={`${v},412 ${v+37},412 ${(v-360)*5+360+125},788 ${(v-360)*5+360},788`} fill={i%2?'#dcb866':'#dfc27d'} stroke="#a69669" strokeWidth="2"/>;})}
<polygon points="380,412 431,412 576,786 10,786" fill="url(#lane)" stroke="#ad9455" strokeWidth="2"/>
<polygon points="431,412 442,412 622,786 576,786" fill="#505557"/>
<polygon points="367,412 380,412 10,786 -50,786" fill="#66696a"/>
<path d="M0 786 H720" stroke="#8e6829" strokeWidth="3"/>
{Array.from({length:24},(_,i)=>{let x=-140+i*44;return <path key={i} d={`M${x} 1280 L${360+(x-360)*.22} 786`} stroke="#b28b3c" strokeWidth="1.5" opacity=".35"/>})}
{[180,230,280,330,380,430,480].map(x=><circle key={x} cx={x} cy="895" r="2" fill="#755928"/>)}
</g>}
function Pins({t}:{t:number}){return <g>{Array.from({length:10},(_,i)=>{let row=Math.floor((Math.sqrt(8*i+1)-1)/2),col=i-row*(row+1)/2,x=405+(col-row/2)*8,y=443-row*4,delay=i*.024,k=Math.max(0,Math.min(1,(t-7.974633333-delay)/.24));return <g key={i} transform={`translate(${x+k*(i%2?22:-18)},${y+k*5}) rotate(${k*(i%2?86:-95)})`} opacity={1-Math.max(0,(t-8.6)*2)}><path d="M-2 0 Q-5 -6 -2 -10 L-1 -16 Q-3 -20 0 -21 Q3 -20 1 -16 L2 -10 Q5 -6 2 0 Z" fill="#fff" stroke="#c5c7c4" strokeWidth=".8"/><path d="M-1.5 -13 H1.5" stroke="#be4142" strokeWidth="2"/></g>})}</g>}
function Bowler({t,skeleton=false}:{t:number;skeleton?:boolean}){let p=poseAt(t).map(a=>[a[0],a[1]] as Pt),ls=p[11],rs=p[12],lh=p[23],rh=p[24],hip=mid(lh,rh),should=mid(ls,rs),s=dist(ls,rs),body=dist(hip,should),th=Math.max(14,body*.13),head=[(p[7][0]+p[8][0])/2,(p[7][1]+p[8][1])/2] as Pt,b=ballAt(t),rhip:Pt=[rh[0]+body*.12,rh[1]+body*.29],lhip:Pt=[lh[0]-body*.12,lh[1]+body*.29];
const axis:Pt=[hip[0]-should[0],hip[1]-should[1]],bl=Math.max(1,Math.hypot(...axis)),normal:Pt=[axis[1]/bl,-axis[0]/bl];
const sw=Math.max(Math.abs((rs[0]-ls[0])*normal[0]+(rs[1]-ls[1])*normal[1]),body*.42),hw=Math.max(Math.abs((rh[0]-lh[0])*normal[0]+(rh[1]-lh[1])*normal[1]),body*.3);
const offset=(c:Pt,width:number,sign:number):Pt=>[c[0]+normal[0]*width*sign,c[1]+normal[1]*width*sign];
const sl=offset(should,sw/2+body*.06,-1),sr=offset(should,sw/2+body*.06,1),hl=offset(hip,hw/2+body*.1,-1),hr=offset(hip,hw/2+body*.1,1),sk:Pt=[hip[0]+axis[0]*.3,hip[1]+axis[1]*.3],skl=offset(sk,hw/2+body*.12,-1),skr=offset(sk,hw/2+body*.12,1);
if(t>=3.6&&t<5.3053){let vx=b.x-p[14][0],vy=b.y-p[14][1],len=Math.hypot(vx,vy);p[16]=[b.x-vx/len*b.r*.85,b.y-vy/len*b.r*.85];}
return <g>
<ellipse cx={mid(p[27],p[28])[0]} cy={Math.max(p[27][1],p[28][1])+9} rx={s*.7} ry={s*.1} fill="#553b27" opacity=".22"/>
{t>=3.6&&t<4.05&&<Ball b={b}/>}
{[24,23].map((h,i)=>{let knee=p[i?25:26],ankle=p[i?27:28],foot=p[i?31:32],start=p[h];return <g key={h}>{line(start,knee,'#ceab8e',th*1.55,'thigh')}{line(knee,ankle,'#e4c7a6',th*1.12,'shin')}{line(ankle,foot,'#211c28',th*1.18,'shoe')} {line(ankle,foot,'#d0a5dc',th*.38,'shoe-light')}</g>})}
{line(ls,p[13],'#dac0a0',th*1.04,'left-up')}{line(p[13],p[15],'#dec2a3',th*.83,'left-fore')}
{line(rs,p[14],'#d9b994',th*1.04,'right-up')}{line(p[14],p[16],'#dec2a3',th*.83,'right-fore')}
<path d={`M${sl[0]},${sl[1]} Q${should[0]},${should[1]-body*.07} ${sr[0]},${sr[1]} L${hr[0]},${hr[1]} Q${hip[0]},${hip[1]+body*.05} ${hl[0]},${hl[1]} Z`} fill="url(#shirt)" stroke="#654784" strokeWidth="1.6"/>
{line(ls,mid(ls,p[13]),'#855bb5',th*1.38,'sleeveL')}{line(rs,mid(rs,p[14]),'#8054af',th*1.38,'sleeveR')}
<path d={`M${hl[0]},${hl[1]} L${hr[0]},${hr[1]} L${skr[0]},${skr[1]} Q${sk[0]},${sk[1]+body*.025} ${skl[0]},${skl[1]} Z`} fill="url(#skirt)" stroke="#aaaab1" strokeWidth="1.2"/>
<path d={`M${hip[0]},${hip[1]+6} L${hip[0]+5},${hip[1]+body*.27}`} stroke="#b9b9ba" strokeWidth="1.2"/>
<path d={`M${ls[0]+s*.12},${ls[1]+body*.27} L${rs[0]-s*.12},${rs[1]+body*.27}`} stroke="#ede5f4" strokeWidth={Math.max(2,s*.03)} opacity=".85"/>
<ellipse cx={head[0]} cy={head[1]+s*.01} rx={body*.25} ry={body*.34} fill="url(#hair)" transform={`rotate(${Math.atan2(rs[1]-ls[1],rs[0]-ls[0])*180/Math.PI},${head[0]},${head[1]})`}/>
{t>=9.1091&&<g><ellipse cx={head[0]} cy={head[1]+body*.015} rx={body*.18} ry={body*.21} fill="#d5b393"/><ellipse cx={p[2][0]} cy={p[2][1]} rx={body*.012} ry={body*.01} fill="#201e28"/><ellipse cx={p[5][0]} cy={p[5][1]} rx={body*.012} ry={body*.01} fill="#201e28"/><path d={`M${head[0]-body*.15},${head[1]+body*.025} Q${head[0]},${head[1]+body*.005} ${head[0]+body*.15},${head[1]+body*.025} L${head[0]+body*.1},${head[1]+body*.17} Q${head[0]},${head[1]+body*.21} ${head[0]-body*.1},${head[1]+body*.17} Z`} fill="#e4e7e6" stroke="#bbc2c0" strokeWidth="1.2"/></g>}
<path d={`M${head[0]-s*.1},${head[1]-s*.26} Q${head[0]-s*.24},${head[1]} ${head[0]-s*.14},${head[1]+s*.21}`} stroke="#41434c" strokeWidth={body*.03} opacity=".55" fill="none"/>
{t>=3.95&&t<5.31&&<g>{line(rs,p[14],'#d9b994',th*1.04,'front-up')}{line(p[14],p[16],'#dec2a3',th*.83,'front-fore')}{line(rs,mid(rs,p[14]),'#8054af',th*1.38,'front-sleeve')}</g>}
{t>=9.1091&&<g>{line(p[13],p[15],'#dec2a3',th*.83,'front-left-fore')}{line(p[14],p[16],'#dec2a3',th*.83,'front-right-fore')}<ellipse cx={p[16][0]} cy={p[16][1]} rx={th*.65} ry={th*.8} fill="#dec2a3"/></g>}
{t>=4.05&&t<8.2&&<Ball b={b} opacity={t>8.02?Math.max(0,1-(t-8.02)/.18):1}/>}{skeleton&&<g opacity=".9">{[[11,12],[11,23],[12,24],[23,24],[11,13],[13,15],[12,14],[14,16],[23,25],[25,27],[24,26],[26,28]].map(([a,b],i)=>line(p[a],p[b],'#67fff0',2.5,'e'+i))}{[11,12,13,14,15,16,23,24,25,26,27,28].map(i=><circle key={i} cx={p[i][0]} cy={p[i][1]} r="5" fill="#fff" stroke="#168e88" strokeWidth="2"/>)}</g>}
</g>}
function Reconstruction({skeleton=false}:{skeleton?:boolean}){const t=useCurrentFrame()/useVideoConfig().fps;return <svg viewBox="0 0 720 1280" width="100%" height="100%"><defs><linearGradient id="wood" x2=".35" y2="1"><stop stopColor="#dfc477"/><stop offset="1" stopColor="#c49e41"/></linearGradient><linearGradient id="ceiling" x2="0" y2="1"><stop stopColor="#b6aa83"/><stop offset="1" stopColor="#ddd5b4"/></linearGradient><linearGradient id="lane" x2="0" y2="1"><stop stopColor="#e4d4a0"/><stop offset="1" stopColor="#d6b46a"/></linearGradient><linearGradient id="shirt"><stop stopColor="#7352a5"/><stop offset=".55" stopColor="#9772c3"/><stop offset="1" stopColor="#68448e"/></linearGradient><linearGradient id="skirt"><stop stopColor="#c4c8ca"/><stop offset=".55" stopColor="#e4e6e4"/><stop offset="1" stopColor="#b0b6b9"/></linearGradient><radialGradient id="hair"><stop stopColor="#282830"/><stop offset="1" stopColor="#0c1016"/></radialGradient><radialGradient id="ball" cx=".3" cy=".25"><stop stopColor="#373a45"/><stop offset=".65" stopColor="#171a23"/><stop offset="1" stopColor="#070b11"/></radialGradient></defs><Lane/><Pins t={t}/><Bowler t={t} skeleton={skeleton}/></svg>}
function Comparison(){let t=useCurrentFrame()/FPS,phase=t<3.5?'構え':t<4.25?'助走・プッシュアウェイ':t<4.9?'高いバックスイング':t<5.31?'ダウンスイング・リリース':t<7.974633333?'ボールの走行':t<9.1091?'接触・フォロースルー':'カット後：カメラへのリアクション';return <AbsoluteFill style={{background:'#f3f1e9',color:'#263d3a',fontFamily:'"Hiragino Sans",sans-serif'}}><div style={{position:'absolute',top:24,left:48,fontSize:31,fontWeight:600}}>ボウリングの動きを、計測して組み直す。</div><div style={{position:'absolute',top:77,left:54,fontSize:19}}>元映像 / Rankseeker・坂本かや</div><div style={{position:'absolute',top:77,left:687,fontSize:19}}>Remotion / 骨格＋ボール軌道の再構成</div><div style={{position:'absolute',left:54,top:115,width:540,height:960,overflow:'hidden',borderRadius:12}}><OffthreadVideo src={staticFile('reference.mp4')} muted style={{width:'100%',height:'100%'}}/></div><div style={{position:'absolute',left:687,top:115,width:540,height:960,overflow:'hidden',borderRadius:12}}><Reconstruction/></div><div style={{position:'absolute',top:1105,left:54,fontSize:28,fontWeight:600}}>{t.toFixed(2)} 秒　{phase}</div><div style={{position:'absolute',top:1153,left:54,fontSize:18,color:'#64716b'}}>同じ時間軸・速度で比較。右は描画したリグ。実写の完全同一再現ではありません。</div><div style={{position:'absolute',top:1200,left:54,height:4,width:1173,background:'#d3d9ce'}}><div style={{height:4,width:`${t/10.967*100}%`,background:'#408b7d'}}/></div></AbsoluteFill>}
registerRoot(()=> <><Composition id="Comparison" component={Comparison} width={1280} height={1240} fps={FPS} durationInFrames={N}/><Composition id="Reconstruction" component={Reconstruction} width={720} height={1280} fps={FPS} durationInFrames={N}/><Composition id="Skeleton" component={()=> <Reconstruction skeleton/>} width={720} height={1280} fps={FPS} durationInFrames={N}/></>);
