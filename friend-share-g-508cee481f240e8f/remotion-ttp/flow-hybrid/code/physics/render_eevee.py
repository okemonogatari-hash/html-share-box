import bpy
from pathlib import Path
R=Path(__file__).resolve().parent;s=bpy.context.scene
s.render.engine='CYCLES'
s.cycles.samples=16
s.render.filepath=str(R/'stills-final'/'frame-');(R/'stills-final').mkdir(exist_ok=True)
s.render.resolution_percentage=100
# EEVEE comparison uses actual ray traced reflections.
s.render.engine='BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in [i.identifier for i in s.render.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
s.eevee.taa_render_samples=48
s.eevee.use_raytracing=True
for f in [1,150,159,170,190,270]:
 s.frame_set(f);s.render.filepath=str(R/'stills-final'/('frame-%04d.png'%f));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'bowling-eevee-linear.blend'))
