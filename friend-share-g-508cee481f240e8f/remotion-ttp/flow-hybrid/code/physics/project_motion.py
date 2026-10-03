import bpy,json
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
R=Path(__file__).resolve().parent;s=bpy.context.scene;ball=bpy.data.objects['BALL_SINGLE'];out=[]
for f in range(1,160):
 s.frame_set(f);dg=bpy.context.evaluated_depsgraph_get();v=ball.evaluated_get(dg).matrix_world.translation;c=world_to_camera_view(s,s.camera,v);d=world_to_camera_view(s,s.camera,v+Vector((.205,0,0)));out.append({'frame':f,'x_px':720*c.x,'y_px':1280*(1-c.y),'radius_px':720*(d.x-c.x)})
(R/'projected-ball-motion.json').write_text(json.dumps(out,indent=2));print(json.dumps(out[::15],indent=2))
