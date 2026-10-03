import React from 'react';
import {AbsoluteFill,Composition,OffthreadVideo,Sequence,registerRoot,staticFile,useCurrentFrame} from 'remotion';
// Native Flow acting is kept at its original speed. The ball/rack shot is rendered
// from a single 3D simulation; this compositor never invents a collision by a timer.
const fps=60;
const approachFrames=223; // includes native Flow frame88: clear visible separation.
const physicsFrames=267; // trim first 3 native60fps frames to keep contact and 15s duration.
const celebrationFrames=410;
const total=approachFrames+physicsFrames+celebrationFrames;
const Picture=({src,startFrom=0}:{src:string;startFrom?:number})=><OffthreadVideo muted startFrom={startFrom} src={staticFile(src)} style={{width:'100%',height:'100%',objectFit:'cover'}}/>;
function Hybrid(){return <AbsoluteFill style={{background:'#101010'}}>
 <Sequence durationInFrames={approachFrames}><Picture src="flow-hybrid/approach.mp4"/></Sequence>
 <Sequence from={approachFrames} durationInFrames={physicsFrames}><Picture src="flow-hybrid/physics.mp4" startFrom={3}/></Sequence>
 <Sequence from={approachFrames+physicsFrames} durationInFrames={celebrationFrames}><Picture src="flow-hybrid/reaction.mp4"/></Sequence>
</AbsoluteFill>}
function Audit(){const t=useCurrentFrame()/fps;const release=88/24; const physicsStart=approachFrames/fps; const sourceOffset=5.3053-release;
return <AbsoluteFill style={{background:'#f5f1e6',fontFamily:'"Hiragino Sans",sans-serif',color:'#29423d'}}>
 <div style={{position:'absolute',left:40,top:20,fontSize:28,fontWeight:600}}>離球を揃えて、球の走行と接触を比べる。</div>
 <div style={{position:'absolute',left:40,top:66,fontSize:17}}>左：元投球　右：Flow演技＋3D衝突ショット</div>
 <div style={{position:'absolute',left:40,top:110,width:540,height:960,overflow:'hidden',borderRadius:10}}><OffthreadVideo src={staticFile('reference.mp4')} startFrom={Math.round(sourceOffset*fps)} muted style={{width:'100%',height:'100%'}}/></div>
 <div style={{position:'absolute',left:640,top:110,width:540,height:960,overflow:'hidden',borderRadius:10}}><Hybrid/></div>
 <div style={{position:'absolute',left:40,top:1097,fontSize:24}}>{t.toFixed(3)} 秒　{t<release?'投球':t<physicsStart+2.633390163-3/fps?'一球の走行':'接触後'}</div>
 <div style={{position:'absolute',left:40,top:1140,fontSize:17}}>元はRankseeker・坂本かや。離球からの比較。右は見た目や全動作の完全一致ではありません。</div>
</AbsoluteFill>}
registerRoot(()=> <><Composition id="FlowHybrid" component={Hybrid} width={720} height={1280} fps={fps} durationInFrames={total}/><Composition id="ContactAudit" component={Audit} width={1220} height={1190} fps={fps} durationInFrames={Math.ceil(7.85*fps)}/></>);
