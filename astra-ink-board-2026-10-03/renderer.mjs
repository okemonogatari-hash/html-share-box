import {makeCamera,inTriangle} from './model.mjs';
import {buildScene} from './geometry.mjs';

const VS=`attribute vec3 position;attribute vec2 uv;attribute vec3 detail;varying vec2 vUV;varying vec3 vDetail;void main(){gl_Position=vec4(position,1.);vUV=uv;vDetail=detail;}`;
const FS=`precision highp float;varying vec2 vUV;varying vec3 vDetail;uniform float ink;uniform float hatching;uniform float pixelRatio;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float stroke(float coordinate,float period,float width){float d=abs(fract(coordinate/period)-.5);return 1.-smoothstep(width,width+.09,d);}
void main(){vec2 p=gl_FragCoord.xy/pixelRatio;float grain=hash(floor(gl_FragCoord.xy));vec3 paper=vec3(.970,.950,.904);paper*=.986+grain*.023;vec3 blue=vec3(.095,.235,.485);float kind=vDetail.z;
 if(kind<-.5){float fiber=step(.991,hash(floor(p/vec2(9.,.7))));paper-=fiber*.016;float vignette=length(vUV-.5);paper-=vignette*.018;gl_FragColor=vec4(paper,1.);return;}
 if(kind>3.5){vec3 col=mix(paper,kind>4.5?vec3(.60,.34,.18):blue,clamp(vDetail.x*ink,.0,.97));gl_FragColor=vec4(col,1.);return;}
 float wobble=sin(p.y*.071+sin(p.x*.029)*1.5)*.65+sin(p.x*.13)*.25;float first=stroke(p.x+p.y*.63+wobble,4.9,.03);float second=stroke(p.x-p.y*.82+wobble*.6,5.7,.025);float tone=clamp(vDetail.x,0.,1.),side=vDetail.y;float amount=0.;
 if(kind>1.5){float hatch=stroke(p.x+p.y*.78+wobble,4.25,.045);float broken=.70+.30*step(.12,hash(floor(p/vec2(17.,1.))));amount=hatch*.24*broken+.025;}
 else if(kind>.5){float weight=.06+tone*.40+side*.33;float curve=sin(vUV.x*6.28)*1.7;first=stroke(p.x+p.y*.61+wobble+curve,4.3-.6*side,.025+tone*.045+side*.025);second=stroke(p.x-p.y*.85+wobble+curve*.45,5.6,.025+side*.028);float third=stroke(p.x*.8+p.y*.12+wobble*.45,6.7,.026);amount=(first*weight+second*max(0.,tone-.38)*.65+second*side*.36+third*side*.13)*(.24+hatching*.92);amount+=.009+side*.045+tone*.012;}
 amount*=.82+hash(floor(p*.55))*.22;gl_FragColor=vec4(mix(paper,blue,clamp(amount*ink,0.,.91)),1.);
}`;
const labelFS=`precision highp float;varying vec2 vUV;varying vec3 vDetail;uniform sampler2D glyph;uniform float ink;void main(){float alpha=texture2D(glyph,vUV).a;if(alpha<.05)discard;gl_FragColor=vec4(.12,.25,.46,alpha*.72*ink);}`;
function shader(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
function program(gl,fs){const p=gl.createProgram(),v=shader(gl,gl.VERTEX_SHADER,VS),f=shader(gl,gl.FRAGMENT_SHADER,fs);gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const light=[-.48,.76,.43];
function push(target,p,uv,detail,W,H,bias=0){target.push(p.x/W*2-1,1-p.y/H*2,-(p.depth+bias)/24,...uv,...detail);}
function line(target,points,width,strength,W,H,kind=4,bias=.009){
 for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<.001)continue;const nx=-dy/len*width*.5,ny=dx/len*width*.5,ps=[{x:a.x+nx,y:a.y+ny,depth:a.depth},{x:a.x-nx,y:a.y-ny,depth:a.depth},{x:b.x+nx,y:b.y+ny,depth:b.depth},{x:b.x-nx,y:b.y-ny,depth:b.depth}];for(const j of[0,1,2,2,1,3])push(target,ps[j],[0,0],[strength,0,kind],W,H,bias);}
}
export class Renderer{
 constructor(canvas){this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:true,premultipliedAlpha:false});if(!this.gl)throw new Error('WebGL unavailable');const gl=this.gl;this.surface=program(gl,FS);this.label=program(gl,labelFS);this.buffer=gl.createBuffer();this.glyphs=new Map();this.scene=null;this.stateKey='';this.pickTriangles=[];this.stats={};}
 use(p){const gl=this.gl;gl.useProgram(p);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);for(const[name,size,offset]of[['position',3,0],['uv',2,12],['detail',3,20]]){const location=gl.getAttribLocation(p,name);if(location<0)continue;gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,32,offset);}}
 batch(p,arr){if(!arr.length)return;const gl=this.gl;this.use(p);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,arr.length/8);}
 texture(text){if(this.glyphs.has(text))return this.glyphs.get(text);const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font='italic 64px Georgia,serif';canvas.width=Math.ceil(ctx.measureText(text).width)+10;canvas.height=88;ctx.font='italic 64px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='white';ctx.fillText(text,canvas.width/2,44);const gl=this.gl,texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);const value={texture,aspect:canvas.width/canvas.height};this.glyphs.set(text,value);return value;}
 render(state,view,{width,height,pixelRatio=1}={}){
 const canvas=this.canvas,W=width||canvas.width,H=height||canvas.height,gl=this.gl;if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}this.camera=makeCamera(W,H,view);const project=this.camera.project,scale=this.camera.scale,key=JSON.stringify(state);if(key!==this.stateKey){this.scene=buildScene(state);this.stateKey=key;}const scene=this.scene;
 gl.viewport(0,0,W,H);gl.clearColor(.97,.95,.905,1);gl.clearDepth(1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);
 const background=[];const corners=[{x:0,y:0,depth:-20},{x:W,y:0,depth:-20},{x:W,y:H,depth:-20},{x:0,y:H,depth:-20}],uvs=[[0,0],[1,0],[1,1],[0,1]];for(const i of[0,1,2,0,2,3])push(background,corners[i],uvs[i],[0,0,-1],W,H);
 this.use(this.surface);gl.uniform1f(gl.getUniformLocation(this.surface,'ink'),.44+view.ink/100*.72);gl.uniform1f(gl.getUniformLocation(this.surface,'hatching'),view.hatching/100);gl.uniform1f(gl.getUniformLocation(this.surface,'pixelRatio'),pixelRatio);this.batch(this.surface,background);
 const surfaces=[],strokes=[];this.pickTriangles=[];
 for(const tri of scene.triangles){const ps=tri.v.map(v=>project(v.p));for(let j=0;j<3;j++){const v=tri.v[j],tone=Math.min(1,Math.max(0,.57-dot(v.n,light)*.53));push(surfaces,ps[j],v.uv,[tone,tri.side||0,tri.kind||0],W,H);}if(tri.id||tri.square)this.pickTriangles.push({ps,id:tri.id,square:tri.square});}
 // Surface test first, then narrow pen strokes with the same depth buffer.
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);this.batch(this.surface,surfaces);
 for(const l of scene.lines){const ps=l.points.map(project);line(strokes,ps,Math.max(pixelRatio*.48,l.width*scale),l.strength,W,H,l.accent?5:4,l.bias??.005);}
 // Lathe silhouettes follow the true profile and camera angle. A second faint trace
 // imitates a hand returning to an edge. Rear contour fragments fail the depth test.
 const angle=Math.atan2(this.camera.front[2],this.camera.front[0]);
 for(const mesh of scene.meshes){for(const side of[-1,1]){const a=angle+side*Math.PI/2;const ps=mesh.profile.map(([r,y],j)=>project([mesh.position[0]+(r+.002)*Math.cos(a),mesh.position[1]+y,mesh.position[2]+(r+.002)*Math.sin(a)]));line(strokes,ps,Math.max(pixelRatio*.72,scale*.014),.84,W,H,4,.019);const echo=ps.map((p,j)=>({...p,x:p.x+Math.sin(j*1.82)*pixelRatio*.8,y:p.y+Math.cos(j*.9)*pixelRatio*.32}));line(strokes,echo,Math.max(pixelRatio*.36,scale*.006),.25,W,H,4,.02);}}
 this.batch(this.surface,strokes);
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);this.use(this.label);gl.uniform1f(gl.getUniformLocation(this.label,'ink'),.44+view.ink/100*.72);
 for(const item of scene.labels){const g=this.texture(item.text),ww=item.size*g.aspect*1.375,hh=item.size*1.375,[x,y,z]=item.p,points=[[x-ww/2,y,z-hh/2],[x+ww/2,y,z-hh/2],[x+ww/2,y,z+hh/2],[x-ww/2,y,z+hh/2]].map(project),data=[];for(const i of[0,1,2,0,2,3])push(data,points[i],uvs[i],[0,0,0],W,H,.012);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,g.texture);gl.uniform1i(gl.getUniformLocation(this.label,'glyph'),0);this.batch(this.label,data);}
 gl.depthMask(true);gl.disable(gl.BLEND);gl.flush();this.stats={triangles:surfaces.length/24,strokeTriangles:strokes.length/24,width:W,height:H};return this.stats;
 }
 pick(x,y){let best=null,bestDepth=-Infinity;for(const t of this.pickTriangles){const b=inTriangle(x,y,...t.ps);if(!b)continue;const depth=b.u*t.ps[0].depth+b.v*t.ps[1].depth+b.w*t.ps[2].depth;if(depth>bestDepth){bestDepth=depth;best={id:t.id,square:t.square};}}return best;}
}
