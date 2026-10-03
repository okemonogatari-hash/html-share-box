import bpy,json,bmesh,math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
R=Path(__file__).resolve().parent;s=bpy.context.scene
ball=bpy.data.objects['BALL_SINGLE'];pins=[bpy.data.objects['Pin_%02d'%i] for i in range(1,11)]
samples=[]
for f in range(152,167):
 s.frame_set(f);dg=bpy.context.evaluated_depsgraph_get();c=ball.evaluated_get(dg).matrix_world.translation
 distances=[]
 for p in pins:
  ob=p.evaluated_get(dg);me=ob.to_mesh();bm=bmesh.new();bm.from_mesh(me);bvh=BVHTree.FromBMesh(bm)
  nearest=bvh.find_nearest(ob.matrix_world.inverted()@c);dist=nearest[3]
  distances.append((p.name,dist));bm.free();ob.to_mesh_clear()
 pin,dist=min(distances,key=lambda x:x[1]);samples.append({'frame':f,'seconds':(f-1)/60,'nearest_pin':pin,'ball_surface_gap_m':dist-.205})
poses=json.loads((R/'poses.json').read_text());start=poses[0]['pins'];pre=poses[:158]
maxdiff=max((Vector(p['position'])-Vector(start[i]['position'])).length for row in pre for i,p in enumerate(row['pins']))
preangle=max(abs(p['up_z']-1) for row in pre for p in row['pins'])
firstcontact=next((row for row in samples if row['ball_surface_gap_m']<=.001),None)
# The rigid-body solver separates the surfaces after resolving an impact, so
# sampled post-response separation is not a valid test for whether impact occurred.
# Find the first continuous intersection against the upright pre-impact pin mesh.
s.frame_set(1);dg=bpy.context.evaluated_depsgraph_get();ob=pins[0].evaluated_get(dg);me=ob.to_mesh();bm=bmesh.new();bm.from_mesh(me);bvh=BVHTree.FromBMesh(bm);inv=ob.matrix_world.inverted()
meta=json.loads((R/'metadata.json').read_text())
def gap_at(t):
 c=Vector((.11,meta['ball_start_y']+meta['ball_speed']*t,.213))
 return bvh.find_nearest(inv@c)[3]-.205
lo,hi=2.6,2.7
for _ in range(50):
 mid=(lo+hi)/2
 if gap_at(mid)>0:lo=mid
 else:hi=mid
first_response=next(row for row in poses if math.dist(row['pins'][0]['position'][:2],poses[0]['pins'][0]['position'][:2])>.0001)
continuous={'seconds':(lo+hi)/2,'frame_60fps':1+(lo+hi)*30,'gap_at_158_seconds':gap_at(157/60),'gap_at_159_seconds_without_collision_response':gap_at(158/60),'method':'sphere distance to exact initial pin mesh, bisection; the response sample then separates surfaces'}
bm.free();ob.to_mesh_clear()
result={'continuous_mesh_contact':continuous,'first_solver_horizontal_response':{'frame':first_response['frame'],'seconds':first_response['seconds']},'collision_shape':'MESH','ball_mode':'single kinematic sphere; rotation distance/radius','pin_mode':'unconstrained Bullet rigid bodies after frame158','contact_samples':samples,'sampled_post_response_intersection':firstcontact,'pin_precontact_max_position_difference_m':maxdiff,'pin_precontact_max_up_z_difference':preangle,'single_ball_mesh_count':len([o for o in bpy.data.objects if o.name.startswith('BALL_SINGLE')]),'ball_y_is_monotonic':all(a['ball'][1]<b['ball'][1] for a,b in zip(poses,poses[1:])),'pins_down_final':sum(abs(p['up_z'])<.7 for p in poses[-1]['pins']),'final_pin_up_z':{p['name']:p['up_z'] for p in poses[-1]['pins']},'first_tilt_by_pin':{name:next((r['seconds'] for r in poses if next(p for p in r['pins'] if p['name']==name)['up_z']<.98),None) for name in [p['name'] for p in start]},'render_verified':False}
(R/'physics-qa.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
