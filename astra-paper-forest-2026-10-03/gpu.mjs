// Native WebGL rasterization gives every paper face an independent depth test.
// All meshes, paper texture, lighting and lettering are generated locally.
import {polygonNormal} from './model.mjs';

const cache=new WeakMap();
const vertexSource=`attribute vec3 position; attribute vec4 color; attribute vec2 uv; attribute float effect;
varying vec4 vColor; varying vec2 vUV; varying float vEffect;
void main(){gl_Position=vec4(position,1.0);vColor=color;vUV=uv;vEffect=effect;}`;
const fragmentSource=`precision highp float; varying vec4 vColor; varying vec2 vUV; varying float vEffect;
uniform sampler2D glyph; uniform float useGlyph;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){vec4 c=vColor;
 if(useGlyph>0.5){c.a*=texture2D(glyph,vUV).a;if(c.a<0.025)discard;}
 else if(vEffect>1.5){float d=length(vUV-vec2(0.5))*2.0;c.a*=pow(max(0.0,1.0-d),2.1);}
 else if(vEffect>0.5){vec2 p=gl_FragCoord.xy;float fleck=hash(floor(p));float fiber=step(.982,hash(floor(p/vec2(6.0,1.0))));c.rgb*=.985+fleck*.027-fiber*.025;}
 gl_FragColor=c;}`;
const backgroundFragment=`precision highp float; varying vec2 vUV; uniform vec2 resolution; uniform vec2 shadowCenter; uniform float scale; uniform float night;
void main(){vec2 p=gl_FragCoord.xy;vec3 cream=mix(vec3(.933,.918,.878),vec3(.953,.941,.898),max(0.,1.-length((vUV-.48)*1.7)));vec3 dark=mix(vec3(.204,.239,.239),vec3(.243,.282,.259),max(0.,1.-length((vUV-.48)*1.7)));vec3 c=mix(cream,dark,night);float d=length((p-shadowCenter)/vec2(scale*6.7,scale*2.28));float sh=pow(max(0.,1.-d),1.45)*.16;c*=1.-sh;gl_FragColor=vec4(c,1.);}`;

function compile(gl,type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;}
function program(gl,fragment){const p=gl.createProgram(),v=compile(gl,gl.VERTEX_SHADER,vertexSource),f=compile(gl,gl.FRAGMENT_SHADER,fragment);gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
function initialize(canvas){
 const gl=canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:true,premultipliedAlpha:false});
 if(!gl)throw new Error('このブラウザでは立体の描画を使えませんでした。');
 const result={gl,solid:program(gl,fragmentSource),background:program(gl,backgroundFragment),buffer:gl.createBuffer(),glyphs:new Map()};cache.set(canvas,result);return result;
}
const colorRGB=color=>color.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255);
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function inTriangle(p,a,b,c,sign){return cross(a,b,p)*sign>=-1e-8&&cross(b,c,p)*sign>=-1e-8&&cross(c,a,p)*sign>=-1e-8;}
export function triangulate(points){
 if(points.length<3)return [];const order=points.map((_,i)=>i),triangles=[];
 let area=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];area+=a.x*b.y-b.x*a.y;}
 if(Math.abs(area)<.00001)return [];const sign=area>0?1:-1;let attempts=0;
 while(order.length>3&&attempts<points.length*points.length){let clipped=false;
  for(let i=0;i<order.length;i++){const ia=order[(i-1+order.length)%order.length],ib=order[i],ic=order[(i+1)%order.length],a=points[ia],b=points[ib],c=points[ic];
   if(cross(a,b,c)*sign<1e-7)continue;let inside=false;for(const k of order){if(k===ia||k===ib||k===ic)continue;if(inTriangle(points[k],a,b,c,sign)){inside=true;break;}}
   if(!inside){triangles.push([ia,ib,ic]);order.splice(i,1);clipped=true;break;}
  }
  if(!clipped){let minimum=Infinity,index=-1;for(let i=0;i<order.length;i++){const a=points[order[(i-1+order.length)%order.length]],b=points[order[i]],c=points[order[(i+1)%order.length]],value=Math.abs(cross(a,b,c));if(value<minimum){minimum=value;index=i;}}if(index>=0&&minimum<.01)order.splice(index,1);else break;}attempts++;
 }
 if(order.length===3)triangles.push([...order]);return triangles;
}
function vertex(array,p,color,W,H,uv=[0,0],effect=0,bias=0){array.push(p.x/W*2-1,1-p.y/H*2,-(p.depth+bias)/32,...color,...uv,effect);}
function triangle(array,a,b,c,color,W,H,effect=0,bias=0){vertex(array,a,color,W,H,[0,0],effect,bias);vertex(array,b,color,W,H,[0,0],effect,bias);vertex(array,c,color,W,H,[0,0],effect,bias);}
function lineMesh(array,points,color,width,W,H,{dash=false,bias=.002}={}){
 for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(length<.0001)continue;
  const nx=-dy/length*width*.5,ny=dx/length*width*.5,segments=dash?Math.max(1,Math.ceil(length/(width*5))):1;
  for(let j=0;j<segments;j++){if(dash&&j%2)continue;const t=j/segments,u=(j+1)/segments;
   const p={x:a.x+dx*t,y:a.y+dy*t,depth:a.depth+(b.depth-a.depth)*t},q={x:a.x+dx*u,y:a.y+dy*u,depth:a.depth+(b.depth-a.depth)*u};
   const v1={x:p.x+nx,y:p.y+ny,depth:p.depth},v2={x:p.x-nx,y:p.y-ny,depth:p.depth},v3={x:q.x+nx,y:q.y+ny,depth:q.depth},v4={x:q.x-nx,y:q.y-ny,depth:q.depth};triangle(array,v1,v2,v3,color,W,H,0,bias);triangle(array,v3,v2,v4,color,W,H,0,bias);
  }
 }
}
function useProgram(data,p){const {gl,buffer}=data;gl.useProgram(p);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);for(const [name,size,offset]of[['position',3,0],['color',4,12],['uv',2,28],['effect',1,36]]){const a=gl.getAttribLocation(p,name);if(a>=0){gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,40,offset);}}}
function drawBatch(data,p,array){if(!array.length)return;const gl=data.gl;useProgram(data,p);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(array),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,array.length/10);}
function glyphTexture(data,item){
 const key=item.text+'|'+!!item.serif;let found=data.glyphs.get(key);if(found)return found;
 const c=document.createElement('canvas'),ctx=c.getContext('2d');ctx.font=`64px ${item.serif?'"Hiragino Mincho ProN","Yu Mincho",Georgia,serif':'sans-serif'}`;const width=Math.ceil(ctx.measureText(item.text).width)+8;c.width=width;c.height=100;ctx.font=`64px ${item.serif?'"Hiragino Mincho ProN","Yu Mincho",Georgia,serif':'sans-serif'}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText(item.text,width/2,50);
 const gl=data.gl,texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);found={texture,width,height:100};data.glyphs.set(key,found);return found;
}
function drawLabel(data,item,project,W,H){
 const glyph=glyphTexture(data,item),[center,u,v]=item.points,U=u.map((n,i)=>n-center[i]),V=v.map((n,i)=>n-center[i]),ww=glyph.width/64*item.size,hh=glyph.height/64*item.size;
 const P=(x,y)=>project(center.map((n,i)=>n+U[i]*x+V[i]*y));
 const ps=[P(-ww/2,hh/2),P(ww/2,hh/2),P(ww/2,-hh/2),P(-ww/2,-hh/2)],uvs=[[0,0],[1,0],[1,1],[0,1]],mesh=[],col=[...colorRGB(item.color),1];
 for(const idx of[0,1,2,0,2,3])vertex(mesh,ps[idx],col,W,H,uvs[idx],0,.0003);
 const gl=data.gl;useProgram(data,data.solid);gl.uniform1f(gl.getUniformLocation(data.solid,'useGlyph'),1);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,glyph.texture);gl.uniform1i(gl.getUniformLocation(data.solid,'glyph'),0);drawBatch(data,data.solid,mesh);
}
export function drawWorld(canvas,items,state,project,W,H){
 const data=cache.get(canvas)||initialize(canvas),{gl}=data;gl.viewport(0,0,W,H);gl.clearColor(.93,.92,.88,1);gl.clearDepth(1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);
 const bg=[],dummy=[1,1,1,1],corners=[{x:0,y:0,depth:0},{x:W,y:0,depth:0},{x:W,y:H,depth:0},{x:0,y:H,depth:0}],uv=[[0,1],[1,1],[1,0],[0,0]];
 for(const i of[0,1,2,0,2,3])vertex(bg,corners[i],dummy,W,H,uv[i]);useProgram(data,data.background);
 const shadow=project([-1.8*(1-state.opening/100),-.21,.1]);gl.uniform2f(gl.getUniformLocation(data.background,'resolution'),W,H);gl.uniform2f(gl.getUniformLocation(data.background,'shadowCenter'),shadow.x,H-shadow.y-shadow.scale*.12);gl.uniform1f(gl.getUniformLocation(data.background,'scale'),shadow.scale);gl.uniform1f(gl.getUniformLocation(data.background,'night'),state.evening?1:0);drawBatch(data,data.background,bg);
 const opaque=[],transparent=[],labels=[];
 for(const item of items){const ps=item.points.map(project),scale=ps[0].scale||shadow.scale;
  if(item.kind==='poly'){
   const n=polygonNormal(item.points),lighting=item.unlit?1:.86+.20*Math.abs(n[0]*-.35+n[1]*.80+n[2]*.48),col=[...colorRGB(item.color).map(v=>Math.min(1,v*lighting*(state.evening?1.005:1))),item.alpha??1],target=col[3]<1?transparent:opaque;
   for(const t of triangulate(ps))triangle(target,ps[t[0]],ps[t[1]],ps[t[2]],col,W,H,item.grain?1:0);
   if(!item.noStroke&&col[3]===1)lineMesh(opaque,[...ps,ps[0]],[col[0]*.88,col[1]*.88,col[2]*.88,1],Math.max(.45,scale*.006),W,H,{bias:.0008});
  }else if(item.kind==='line'){lineMesh(opaque,ps,[...colorRGB(item.color),1],Math.max(.55,item.width*scale),W,H,{dash:!!item.dash});}
  else if(item.kind==='label')labels.push(item);
  else if(item.kind==='glow'){
   const p=ps[0],r=item.radius*scale,col=[1,.73,.39,item.alpha??.25],p4=[{x:p.x-r,y:p.y-r,depth:p.depth},{x:p.x+r,y:p.y-r,depth:p.depth},{x:p.x+r,y:p.y+r,depth:p.depth},{x:p.x-r,y:p.y+r,depth:p.depth}];
   for(const i of[0,1,2,0,2,3])vertex(transparent,p4[i],col,W,H,uv[i],2,.005);
  }
 }
 useProgram(data,data.solid);gl.uniform1f(gl.getUniformLocation(data.solid,'useGlyph'),0);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);drawBatch(data,data.solid,opaque);
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);drawBatch(data,data.solid,transparent);gl.depthMask(true);
 for(const item of labels)drawLabel(data,item,project,W,H);
 gl.disable(gl.BLEND);gl.flush();return{triangles:(opaque.length+transparent.length)/30,labels:labels.length};
}
