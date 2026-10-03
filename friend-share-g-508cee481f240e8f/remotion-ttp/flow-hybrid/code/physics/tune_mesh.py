import bpy,json,itertools
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent;results=[]
for x in [.07,.09,.11]:
 bpy.ops.wm.open_mainfile(filepath=str(R/'bowling.blend'));s=bpy.context.scene;ball=bpy.data.objects['BALL_SINGLE'];pins=[bpy.data.objects['Pin_%02d'%i] for i in range(1,11)]
 for p in pins:p.rigid_body.collision_shape='MESH';p.rigid_body.use_margin=False
 ball.rigid_body.use_margin=False
 for layer in ball.animation_data.action.layers:
  for strip in layer.strips:
   for bag in strip.channelbags:
    for fc in bag.fcurves:
     if fc.data_path=='location' and fc.array_index==0:
      for key in fc.keyframe_points:key.co[1]=x
 for f in range(1,s.frame_end+1):s.frame_set(f)
 deps=bpy.context.evaluated_depsgraph_get();upz=[round((p.evaluated_get(deps).matrix_world.to_quaternion()@Vector((0,0,1))).z,3) for p in pins]
 res={'shape':'MESH','x':x,'final_up_z':upz,'down':sum(abs(z)<.70 for z in upz)};results.append(res);print('RESULT '+json.dumps(res),flush=True)
(R/'tuning-mesh.json').write_text(json.dumps(results,indent=2))
