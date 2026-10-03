import bpy,json,math
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent;s=bpy.context.scene;ball=bpy.data.objects['BALL_SINGLE'];pins=[bpy.data.objects['Pin_%02d'%i] for i in range(1,11)]
bpy.context.view_layer.objects.active=ball;bpy.ops.rigidbody.object_remove()
max_tilt=0;max_hshift=0;initial=[p.location.copy() for p in pins];last=[]
for f in range(1,271):
 s.frame_set(f);dg=bpy.context.evaluated_depsgraph_get();last=[]
 for pin,start in zip(pins,initial):
  m=pin.evaluated_get(dg).matrix_world;up=(m.to_quaternion()@Vector((0,0,1))).z;xy=math.dist(list(m.translation)[:2],list(start)[:2]);max_hshift=max(max_hshift,xy);max_tilt=max(max_tilt,math.degrees(math.acos(max(-1,min(1,up)))));last.append({'pin':pin.name,'up_z':up,'position':list(m.translation)})
result={'test':'same MESH pins, floor, gravity and release at frame159; BALL_SINGLE rigid body removed before simulation; render disabled','last_frame':270,'max_tilt_degrees':max_tilt,'max_horizontal_shift_m':max_hshift,'standing_at_end':sum(p['up_z']>.99 for p in last),'fallen_at_end':sum(abs(p['up_z'])<.7 for p in last),'final_pins':last,'ball_present_fallen_count':10,'pass':all(p['up_z']>.99 for p in last)}
(R/'counterfactual-qa.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
