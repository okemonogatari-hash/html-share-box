import bpy,json
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
R=Path(__file__).resolve().parent;s=bpy.context.scene;cam=s.camera;ball=bpy.data.objects['BALL_SINGLE'];s.frame_set(1);m=cam.matrix_world.copy();cam.animation_data_clear();cam.matrix_world=m;focus=bpy.data.objects['Camera_focus'];focus.animation_data_clear();focus.location=(0,8.55,.22)
out=[]
for f in range(1,160):
 s.frame_set(f);dg=bpy.context.evaluated_depsgraph_get();v=ball.evaluated_get(dg).matrix_world.translation;c=world_to_camera_view(s,cam,v);d=world_to_camera_view(s,cam,v+Vector((.205,0,0)));out.append({'frame':f,'x_px':720*c.x,'y_px':1280*(1-c.y),'radius_px':720*(d.x-c.x)})
q={'ball_y_screen_is_monotonic_upward':all(a['y_px']>=b['y_px'] for a,b in zip(out,out[1:])),'ball_radius_is_monotonic_decreasing':all(a['radius_px']>=b['radius_px'] for a,b in zip(out,out[1:])),'samples':[out[0],out[-1]]};(R/'camera-fixed-qa.json').write_text(json.dumps(q,indent=2));s.frame_set(159);s.render.filepath=str(R/'stills-fixed'/'frame-0159.png');bpy.ops.render.render(write_still=True)
