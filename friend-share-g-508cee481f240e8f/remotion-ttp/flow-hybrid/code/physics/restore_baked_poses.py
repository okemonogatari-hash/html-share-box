import bpy,json
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parent;s=bpy.context.scene;ball=bpy.data.objects['BALL_SINGLE'];pins=[bpy.data.objects['Pin_%02d'%i] for i in range(1,11)];poses=[]
for f in range(1,s.frame_end+1):
 s.frame_set(f);dg=bpy.context.evaluated_depsgraph_get();row={'frame':f,'seconds':round((f-1)/60,6),'ball':list(ball.evaluated_get(dg).matrix_world.translation),'pins':[]}
 for o in pins:
  m=o.evaluated_get(dg).matrix_world;q=m.to_quaternion();row['pins'].append({'name':o.name,'position':list(m.translation),'up_z':(q@Vector((0,0,1))).z,'quaternion':list(q)})
 poses.append(row)
(R/'poses.json').write_text(json.dumps(poses,indent=2));meta=json.loads((R/'metadata.json').read_text());meta['final_up_z']={p['name']:round(p['up_z'],3) for p in poses[-1]['pins']};meta['first_pin_tilt_frame']=next((r['frame'] for r in poses if any(p['up_z']<.995 for p in r['pins'])),None);meta['collision_shape']='MESH';meta['margin']='Blender automatic sensitivity';(R/'metadata.json').write_text(json.dumps(meta,indent=2));print(json.dumps(meta))
