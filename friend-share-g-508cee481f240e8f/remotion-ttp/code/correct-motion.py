"""Astra measured throwing-arm anchors correct occlusion and identity swaps.
Keeps raw JSON immutable; segments smoothing at the source camera cut.
"""
from pathlib import Path
import json,numpy as np
from scipy.interpolate import PchipInterpolator
from scipy.signal import savgol_filter
p=Path(__file__).resolve().parent;r=json.loads((p/'analysis/pose-raw.json').read_text());raw=np.array(r['frames']);arr=raw.copy();anchors=json.loads((p/'consult/manual-arm-anchors.json').read_text());times=np.array([a['time'] for a in anchors]);ball=json.loads((p/'consult/ball-samples.json').read_text())['samples'];bt=np.array([a['time'] for a in ball]);bxy=np.array([[a['x'],a['y']] for a in ball]);bcurve=PchipInterpolator(bt,bxy);armCurves={j:PchipInterpolator(times,np.array([a[key] for a in anchors])) for j,key in [(12,'throwing_shoulder'),(14,'throwing_elbow'),(16,'throwing_wrist')]};nonthrow=json.loads((p/'consult/manual-nonthrow-arm-anchors.json').read_text());armCurves.update({j:PchipInterpolator(times,np.array([a[key] for a in nonthrow])) for j,key in [(11,'nonthrowing_shoulder'),(13,'nonthrowing_elbow'),(15,'nonthrowing_wrist')]});swaps=0
for i in range(round(times[0]*r['fps']),round(times[-1]*r['fps'])+1):
 t=i/r['fps'];bp=bcurve(t);nearest=15 if np.linalg.norm(raw[i,15,:2]-bp)<np.linalg.norm(raw[i,16,:2]-bp) else 16
 if nearest==15:
  for a,b in [(11,12),(13,14),(15,16),(17,18),(19,20),(21,22)]:arr[i,a]=raw[i,b];arr[i,b]=raw[i,a]
  swaps+=1
 for j,curve in armCurves.items():arr[i,j,:2]=curve(np.clip(t,times[0],times[-1]));arr[i,j,2]=.9
sm=arr.copy()
for lo,hi in [(0,546),(546,len(arr))]:sm[lo:hi,:,:2]=savgol_filter(arr[lo:hi,:,:2],7,2,axis=0)
sm=np.round(sm,3);m={'fps':r['fps'],'width':r['width'],'height':r['height'],'frameCount':len(raw),'cutFrame':546,'frames':sm.tolist()};(p/'motion.json').write_text(json.dumps(m,separators=(',',':')))
metrics={}
for j in [11,12,13,14,15,16,23,24,25,26,27,28]:
 delta=np.linalg.norm(sm[:,j,:2]-arr[:,j,:2],axis=1);metrics[str(j)]={'median_smoothing_displacement_px':round(float(np.median(delta)),3),'p95_px':round(float(np.quantile(delta,.95)),3)}
(p/'analysis/pose-corrected.json').write_text(json.dumps({'fps':r['fps'],'frames':arr.tolist()},separators=(',',':')))
(p/'analysis/correction-summary.json').write_text(json.dumps({'manual_throwing_arm_anchors':len(anchors),'corrected_source_frames':[round(times[0]*r['fps']),round(times[-1]*r['fps'])],'swapped_arm_frames':swaps,'smoothing':'7frame Savitzky-Golay, poly2, split at frame546','metrics':metrics,'scope':'residual measures smoothing relative to corrected data, not physical truth or perceptual quality'},indent=2))
print('corrected',swaps,'arm-ID frames; anchors',len(anchors),flush=True)
