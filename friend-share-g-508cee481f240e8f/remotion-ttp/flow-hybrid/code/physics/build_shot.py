import bpy, math, json, os, sys, argparse, random
from mathutils import Vector, Quaternion
from pathlib import Path

ROOT=Path(__file__).resolve().parent
p=argparse.ArgumentParser(); p.add_argument('--render',choices=['none','stills','all'],default='none'); p.add_argument('--samples',type=int,default=48); p.add_argument('--percent',type=int,default=100)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
random.seed(31)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for d in bpy.data.materials: bpy.data.materials.remove(d)
s=bpy.context.scene
s.render.engine='CYCLES'
s.cycles.samples=a.samples
s.cycles.use_denoising=True
s.cycles.device='GPU'
prefs=bpy.context.preferences.addons['cycles'].preferences
try:
 prefs.compute_device_type='METAL'; prefs.get_devices()
 for d in prefs.devices: d.use=True
except Exception: s.cycles.device='CPU'
s.render.resolution_x=720; s.render.resolution_y=1280; s.render.resolution_percentage=a.percent
s.render.fps=60; s.frame_start=1; s.frame_end=270
s.render.image_settings.file_format='PNG'; s.render.film_transparent=False
s.view_settings.view_transform='AgX'; s.view_settings.look='AgX - Medium High Contrast'; s.view_settings.exposure=.45
s.world.color=(.17,.19,.24)
world=s.world; world.use_nodes=True; world.node_tree.nodes['Background'].inputs[0].default_value=(.17,.22,.32,1); world.node_tree.nodes['Background'].inputs[1].default_value=.30
s.render.image_settings.color_mode='RGB'

# Clear, reproducible, physically shaded materials.
def mat(name,color,rough=.3,metal=0):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
 q=m.node_tree.nodes.get('Principled BSDF');q.inputs['Base Color'].default_value=(*color,1);q.inputs['Roughness'].default_value=rough;q.inputs['Metallic'].default_value=metal
 return m
ivory=mat('Ivory glazed porcelain pin',(.92,.91,.82),.20)
red=mat('Vermilion double neck rings',(.55,.018,.012),.23)
black=mat('Midnight blue rubber and return',(.012,.025,.05),.22,.25)
gutter=mat('Deep steel blue polished gutters',(.022,.038,.065),.20,.65)
blue=mat('Sapphire blue back panel',(.025,.18,.33),.32,.08)
blue2=mat('Cyan blue back panel',(.055,.34,.48),.3)
cream=mat('Warm cream crown and rays',(.85,.75,.53),.32,.12)
wall=mat('Warm caramel wall',(.33,.18,.075),.68)
wood=bpy.data.materials.new('Golden maple long-grain lacquer');wood.use_nodes=True
n=wood.node_tree.nodes;l=wood.node_tree.links; bs=n.get('Principled BSDF');bs.inputs['Roughness'].default_value=.19;bs.inputs['Coat Weight'].default_value=.5;bs.inputs['Coat Roughness'].default_value=.13
tex=n.new('ShaderNodeTexCoord');vm=n.new('ShaderNodeVectorMath');vm.operation='MULTIPLY';vm.inputs[1].default_value=(28,.8,2);l.new(tex.outputs['Generated'],vm.inputs[0])
noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=3;noise.inputs['Detail'].default_value=2.5;noise.inputs['Roughness'].default_value=.7;l.new(vm.outputs[0],noise.inputs['Vector'])
ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.15;ramp.color_ramp.elements[0].color=(.20,.07,.014,1);ramp.color_ramp.elements[1].position=.83;ramp.color_ramp.elements[1].color=(.70,.38,.105,1);l.new(noise.outputs['Fac'],ramp.inputs[0]);l.new(ramp.outputs[0],bs.inputs['Base Color'])
bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.10;bump.inputs['Distance'].default_value=.014;l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs[0],bs.inputs['Normal'])
ballmat=bpy.data.materials.new('Single navy marble bowling ball');ballmat.use_nodes=True
n=ballmat.node_tree.nodes;l=ballmat.node_tree.links;bs=n.get('Principled BSDF');bs.inputs['Metallic'].default_value=.05;bs.inputs['Roughness'].default_value=.21;bs.inputs['Coat Weight'].default_value=.50;bs.inputs['Coat Roughness'].default_value=.10
tex=n.new('ShaderNodeTexCoord');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=3;noise.inputs['Detail'].default_value=4;noise.inputs['Roughness'].default_value=.7;noise.inputs['Distortion'].default_value=3.5;l.new(tex.outputs['Generated'],noise.inputs[0])
ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.26;ramp.color_ramp.elements[0].color=(.003,.009,.033,1);ramp.color_ramp.elements[1].position=.77;ramp.color_ramp.elements[1].color=(.08,.19,.40,1)
ramp.color_ramp.elements.new(.55).color=(.014,.042,.105,1);ramp.color_ramp.elements.new(.62).color=(.07,.12,.23,1);l.new(noise.outputs['Fac'],ramp.inputs[0]);l.new(ramp.outputs[0],bs.inputs['Base Color'])

def cube(name,loc,scale,material,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1, location=loc);o=bpy.context.object;o.name=name;o.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
 if bevel:
  b=o.modifiers.new('Soft crafted edges','BEVEL');b.width=bevel;b.segments=3;o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
 return o

def rb(o,typ='ACTIVE',shape='CONVEX_HULL',mass=1):
 bpy.context.view_layer.objects.active=o;bpy.ops.rigidbody.object_add();r=o.rigid_body;r.type=typ;r.collision_shape=shape;r.mass=mass;r.friction=.16;r.restitution=.10;r.use_margin=True;r.collision_margin=.001
 return r

# Continuous collision floor and individual softly beveled planks.
floor=cube('Continuous lane collision surface',(0,4,-.06),(2.28,20,.12),wood);rb(floor,'PASSIVE','BOX').friction=.16
for i in range(20):
 x=-1.14+(i+.5)*2.28/20
 for j in range(6):
  y=-5+j*3.3+(i%3)*1.1
  plank=cube('Maple board %02d-%02d'%(i,j),(x,y,.002),(2.28/20-.002,3.3-.003,.005),wood,.001)
# Sculpted half-round gutters running continuously beside the golden lane.
for side in [-1,1]:
 verts=[]; faces=[]; count=24
 for yy in [-5,14]:
  for k in range(count+1):
   theta=math.pi*k/count
   verts.append((side*(1.14+.19-.19*math.cos(theta)),yy,-.145*math.sin(theta)-.006))
 for k in range(count): faces.append((k,k+1,k+count+2,k+count+1))
 mesh=bpy.data.meshes.new('Gutter profile');mesh.from_pydata(verts,[],faces);mesh.materials.append(gutter);o=bpy.data.objects.new('Sculpted gutter '+str(side),mesh);bpy.context.collection.objects.link(o)
 for poly in mesh.polygons:poly.use_smooth=True
 rb(o,'PASSIVE','MESH')
 rail=cube('Round divider '+str(side),(side*1.58,4,-.016),(.13,20,.11),black,.045);rb(rail,'PASSIVE','BOX')
 cube('Adjacent maple lane '+str(side),(side*2.74,4,-.075),(2.13,20,.12),wood,.02)
# Foul line and directional inlays, proper perspective and no on-screen labels.
inlay=mat('Maple dark walnut inlay',(.065,.035,.025),.28)
for y in [1.9,3.2]:
 for x in [-.64,-.32,0,.32,.64]:
  if y==1.9:
   bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.025,depth=.001,location=(x,y,.006));bpy.context.object.data.materials.append(inlay)
  else:
   mesh=bpy.data.meshes.new('Arrow inlay');mesh.from_pydata([(x-.045,y-.08,.006),(x+.045,y-.08,.006),(x,y+.07,.006)],[],[(0,1,2)]);mesh.materials.append(inlay);o=bpy.data.objects.new('Direction inlay',mesh);bpy.context.collection.objects.link(o)

# Lathed bowling pin, exact ten-body triangular rack.
# z/r contours: round foot, belly, narrow red-band neck and bulb crown.
profile=[(0,.043),(.012,.048),(.032,.060),(.067,.077),(.105,.091),(.15,.096),(.195,.092),(.245,.077),(.292,.057),(.325,.040),(.352,.033),(.376,.034),(.395,.041),(.415,.051),(.439,.055),(.462,.051),(.482,.041),(.496,.024),(.501,.002)]
N=48
vs=[]
for z,r in profile:
 for k in range(N):
  th=2*math.pi*k/N;vs.append((r*math.cos(th),r*math.sin(th),z-.21))
fs=[]; mi=[]
for j in range(len(profile)-1):
 for k in range(N):fs.append((j*N+k,j*N+(k+1)%N,(j+1)*N+(k+1)%N,(j+1)*N+k));mi.append(1 if j in [9,11] else 0)
fs.append(tuple(reversed(range(N))));mi.append(0);fs.append(tuple((len(profile)-1)*N+k for k in range(N)));mi.append(0)
mesh=bpy.data.meshes.new('Pin lathe geometry');mesh.from_pydata(vs,[],fs);mesh.materials.append(ivory);mesh.materials.append(red)
for poly,m in zip(mesh.polygons,mi):poly.use_smooth=True;poly.material_index=m
pins=[];num=0
for row in range(4):
 for col in range(row+1):
  num+=1;x=(col-row/2)*.34;y=8.55+row*(.312*.34/.36)
  o=bpy.data.objects.new('Pin_%02d'%num,mesh);bpy.context.collection.objects.link(o);o.location=(x,y,.218)
  r=rb(o,shape='MESH',mass=1.45);r.use_margin=False;r.friction=.12;r.restitution=.12;r.linear_damping=.10;r.angular_damping=.12;r.use_deactivation=True;r.use_start_deactivated=True
  # Freeze to the sampled first collision, then release to Bullet.
  r.kinematic=True;r.keyframe_insert('kinematic',frame=1);r.keyframe_insert('kinematic',frame=158)
  r.kinematic=False;r.keyframe_insert('kinematic',frame=159)
  pins.append(o)
# Ball one object; commanded rolling delivery, active solver pins.
R=.205;target_time=2.6276;start_y=-.55;contact_y=8.55-math.sqrt((R+.091)**2-.022**2)
velocity=(contact_y-start_y)/target_time
bpy.ops.mesh.primitive_uv_sphere_add(segments=72,ring_count=48,radius=R,location=(.11,start_y,R+.008));ball=bpy.context.object;ball.name='BALL_SINGLE';ball.data.materials.append(ballmat)
for poly in ball.data.polygons:poly.use_smooth=True
r=rb(ball,shape='SPHERE',mass=7.3);r.use_margin=False;r.kinematic=True;r.friction=.18;r.restitution=.10
for f in range(1,s.frame_end+1):
 t=(f-1)/60;y=start_y+velocity*t
 ball.location=(.11,y,R+.008);ball.rotation_euler=(-velocity*t/R,0,.28);ball.keyframe_insert('location',frame=f);ball.keyframe_insert('rotation_euler',frame=f)
# Clear return pit, black surround and warm/blue architectural motifs.
pit=cube('Back safety pit',(0,11.7,-.20),(3.08,3.3,.2),black);rb(pit,'PASSIVE','BOX')
back=cube('Dark pin deck background',(0,10.85,.50),(5.2,.16,1.5),black,.035)
# The full back wall is behind the blue mural.
cube('Honey wall',(0,12.4,2.2),(12,.24,5.4),wall,.04)
cube('Mural frame',(0,11.05,1.58),(5.25,.20,1.3),black,.025)
cube('Sapphire mural',(0,10.93,1.60),(5.1,.03,1.16),blue,.006)
# Radial sweeping rays as geometry. Warm royal-crown reference drawn in 3D.
def face_panel(name,coords,material,y=10.907):
 me=bpy.data.meshes.new(name);me.from_pydata([(x,y,z) for x,z in coords],[],[tuple(range(len(coords)))]);me.materials.append(material);ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);return ob
for side in [-1,1]:
 face_panel('Cream ascending ray '+str(side),[(side*.24,1.1),(side*.50,1.1),(side*2.5,2.1),(side*1.95,2.18)],cream)
 face_panel('Cyan rising ray '+str(side),[(side*.56,1.08),(side*.86,1.08),(side*2.55,1.72),(side*2.55,1.98)],blue2)
 face_panel('Fine diagonal ray '+str(side),[(side*.09,1.38),(side*.15,1.41),(side*1.43,2.19),(side*1.2,2.19)],blue2)
face_panel('Golden crown', [(-.25,1.46),(-.32,1.80),(-.13,1.64),(0,1.96),(.13,1.64),(.32,1.80),(.25,1.46)],cream,10.88)
for x in [-3.3,3.3]:
 cube('Architectural steel blue column',(x,6,2),(.3,.5,4.5),black,.04)

# Large soft overhead strips provide warm reflections and dimensional pins.
def area(name,loc,power,color,size,target,size_y=None):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.color=color;o.data.shape='RECTANGLE';o.data.size=size;o.data.size_y=size_y or size
 o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o
for y in [-1,3,6.5,9.0]:
 area('Warm lane ceiling softbox '+str(y),(-.6,y,3.4),210,(1,.73,.45),2.4,(0,y,0),.72)
area('Front warm soft reflection',(0,-2.5,2.5),125,(1,.84,.65),3,(0,1,0),2)
area('Soft camera fill',(1.6,3.5,2.7),110,(.56,.73,1),3,(0,8,.3),2)
area('Pin rim at deck',(-1.25,9.7,2.8),240,(1,.81,.56),2,(0,8.8,.2),1)
cube('Warm dark ceiling',(0,4,3.80),(12,25,.12),wall,.015)
# Glowing ceiling practicals visible at the upper edge of the frame.
emit=mat('Warm glowing fixture',(1,.66,.24),.25)
bs=emit.node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=(1,.63,.25,1);bs.inputs['Emission Strength'].default_value=4
for y in [2,5,8,11]:
 for x in [-1.5,1.5]: cube('Ceiling light',(x,y,3.16),(.42,.32,.035),emit,.06)

# Restrained dolly: stays behind the single ball, ends on readable ten-pin rack.
bpy.ops.object.camera_add();cam=bpy.context.object;cam.name='Hero camera';s.camera=cam;cam.data.lens=43;cam.data.sensor_width=36;cam.data.sensor_fit='HORIZONTAL';cam.data.dof.use_dof=True;cam.data.dof.aperture_fstop=8
bpy.ops.object.empty_add(location=(0,8.6,.23));focus=bpy.context.object;focus.name='Camera_focus';cam.data.dof.focus_object=focus
for f in range(1,s.frame_end+1):
 t=(f-1)/60;progress=min(t/target_time,1);stop_start=2.30;camera_speed=3.1
 if t<stop_start:distance=camera_speed*t
 elif t<target_time:
  u=(t-stop_start)/(target_time-stop_start);distance=camera_speed*stop_start+camera_speed*(target_time-stop_start)*(u-u*u/2)
 else:distance=camera_speed*stop_start+camera_speed*(target_time-stop_start)/2
 cam.location=(.25,-2.7+distance,1.28);aim=Vector((0,5.8+progress*3.18,-1.65+progress*.95));cam.rotation_euler=(aim-cam.location).to_track_quat('-Z','Y').to_euler();cam.keyframe_insert('location',frame=f);cam.keyframe_insert('rotation_euler',frame=f)
 focus.location=(0,2.8+progress*5.8,.22);focus.keyframe_insert('location',frame=f)
# Simple linear per-frame keys so no unintended overshoot.
for o in [ball,cam,focus]:
 if o.animation_data:
  for layer in o.animation_data.action.layers:
   for strip in layer.strips:
    for bag in strip.channelbags:
     for fc in bag.fcurves:
      for key in fc.keyframe_points:key.interpolation='LINEAR'
world=s.rigidbody_world;world.substeps_per_frame=12;world.solver_iterations=40;world.point_cache.frame_start=1;world.point_cache.frame_end=s.frame_end
s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'bowling.blend'))
# Run solver, retain full measured pose history.
poses=[]
for f in range(1,s.frame_end+1):
 s.frame_set(f);deps=bpy.context.evaluated_depsgraph_get();row={'frame':f,'seconds':round((f-1)/60,6),'ball':list(ball.evaluated_get(deps).matrix_world.translation),'pins':[]}
 for o in pins:
  m=o.evaluated_get(deps).matrix_world;q=m.to_quaternion();up=q@Vector((0,0,1));row['pins'].append({'name':o.name,'position':list(m.translation),'up_z':up.z,'quaternion':list(q)})
 poses.append(row)
(ROOT/'poses.json').write_text(json.dumps(poses,indent=2))
# Bake transform animation after solving so renders don't depend on seeking a cache.
for o in pins:
 o.rigid_body.kinematic=True
 bpy.context.view_layer.objects.active=o;bpy.ops.rigidbody.object_remove();o.animation_data_clear();o.rotation_mode='QUATERNION'
for row in poses:
 for o,pin in zip(pins,row['pins']):
  o.location=pin['position'];o.rotation_quaternion=pin['quaternion'];o.keyframe_insert('location',frame=row['frame']);o.keyframe_insert('rotation_quaternion',frame=row['frame'])
summary={'fps':60,'frames':s.frame_end,'duration_seconds':s.frame_end/60,'target_first_contact_seconds':target_time,'ball_radius':R,'ball_x':.11,'collision_shape':'MESH','camera':'low-speed linear tracking then deceleration, no screen-space reversal','ball_speed':velocity,'ball_start_y':start_y,'ball_contact_y':contact_y,'mode':'Bullet exact-MESH rigid body simulated pins; ball is a single kinematic rolling sphere; poses baked for deterministic rendering','pin_count':len(pins),'samples':a.samples,'final_up_z':{p['name']:round(p['up_z'],3) for p in poses[-1]['pins']},'first_pin_tilt_frame':next((r['frame'] for r in poses if any(p['up_z']<.995 for p in r['pins'])),None),'stills':[1,150,159,170,190,270]}
(ROOT/'metadata.json').write_text(json.dumps(summary,indent=2))
print('PHYSICS_SUMMARY '+json.dumps(summary),flush=True)
s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'bowling-baked.blend'))
if a.render=='stills':
 (ROOT/'stills').mkdir(exist_ok=True)
 for f in summary['stills']:
  s.frame_set(f);s.render.filepath=str(ROOT/'stills'/('frame-%04d.png'%f));bpy.ops.render.render(write_still=True)
elif a.render=='all':
 (ROOT/'frames').mkdir(exist_ok=True);s.render.filepath=str(ROOT/'frames'/'frame-');bpy.ops.render.render(animation=True)
