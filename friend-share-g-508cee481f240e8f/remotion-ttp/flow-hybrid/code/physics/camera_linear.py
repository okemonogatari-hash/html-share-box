import bpy,json,math
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
R=Path(__file__).resolve().parent;s=bpy.context.scene;cam=s.camera;ball=bpy.data.objects['BALL_SINGLE'];focus=bpy.data.objects['Camera_focus'];T=2.6276;stop_start=2.30;speed=3.1;cam.animation_data_clear();focus.animation_data_clear()
for f in range(1,271):
 t=(f-1)/60;p=min(t/T,1)
 if t<stop_start:distance=speed*t
 elif t<T:
  u=(t-stop_start)/(T-stop_start);distance=speed*stop_start+speed*(T-stop_start)*(u-u*u/2)
 else:distance=speed*stop_start+speed*(T-stop_start)/2
 cam.location=(.25,-2.7+distance,1.28);aim=Vector((0,5.8+p*3.18,-1.65+p*.95));cam.rotation_euler=(aim-cam.location).to_track_quat('-Z','Y').to_euler();cam.keyframe_insert('location',frame=f);cam.keyframe_insert('rotation_euler',frame=f)
 focus.location=(0,2.8+p*5.8,.22);focus.keyframe_insert('location',frame=f)
out=[]
for f in range(1,160):
 s.frame_set(f);dg=bpy.context.evaluated_depsgraph_get();v=ball.evaluated_get(dg).matrix_world.translation;c=world_to_camera_view(s,cam,v);d=world_to_camera_view(s,cam,v+Vector((.205,0,0)));out.append({'frame':f,'x_px':720*c.x,'y_px':1280*(1-c.y),'radius_px':720*(d.x-c.x)})
q={'camera_max_forward_speed':speed,'ball_forward_speed':3.35089766318,'ball_y_screen_is_monotonic_upward':all(a['y_px']>=b['y_px'] for a,b in zip(out,out[1:])),'ball_radius_is_monotonic_decreasing':all(a['radius_px']>=b['radius_px'] for a,b in zip(out,out[1:])),'samples':out[::15]};(R/'camera-linear-qa.json').write_text(json.dumps(q,indent=2));(R/'projected-ball-motion-linear.json').write_text(json.dumps(out,indent=2));print(json.dumps(q,indent=2));s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(R/'bowling-eevee-linear.blend'))
