import bpy,json,itertools
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent
results=[]
for spacing,x,friction in itertools.product([.30,.32,.34],[.055,.09],[.12,.25]):
 bpy.ops.wm.open_mainfile(filepath=str(R/'bowling.blend'))
 s=bpy.context.scene;ball=bpy.data.objects['BALL_SINGLE'];pins=[bpy.data.objects['Pin_%02d'%i] for i in range(1,11)]
 for pin in pins:
  pin.location.x*=spacing/.36;pin.location.y=8.55+(pin.location.y-8.55)*spacing/.36;pin.rigid_body.friction=friction
 for layer in ball.animation_data.action.layers:
  for strip in layer.strips:
   for bag in strip.channelbags:
    for fc in bag.fcurves:
     if fc.data_path=='location' and fc.array_index==0:
      for key in fc.keyframe_points:key.co[1]=x
 for f in range(1,s.frame_end+1):s.frame_set(f)
 deps=bpy.context.evaluated_depsgraph_get();upz=[round((p.evaluated_get(deps).matrix_world.to_quaternion()@Vector((0,0,1))).z,3) for p in pins]
 res={'spacing':spacing,'x':x,'friction':friction,'final_up_z':upz,'down':sum(abs(z)<.70 for z in upz)};results.append(res);print('RESULT '+json.dumps(res),flush=True)
(R/'tuning2.json').write_text(json.dumps(results,indent=2))
