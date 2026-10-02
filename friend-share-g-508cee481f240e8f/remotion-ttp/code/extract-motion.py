"""Measure all source frames; freeze image-space joints for deterministic Remotion.
Usage: python extract-motion.py source.mp4 pose_landmarker_heavy.task
"""
from pathlib import Path
import sys,json,cv2,numpy as np,mediapipe as mp
from scipy.signal import savgol_filter
P=Path(__file__).resolve().parent
source=Path(sys.argv[1]);model=Path(sys.argv[2]);cap=cv2.VideoCapture(str(source));fps=cap.get(cv2.CAP_PROP_FPS);w=int(cap.get(3));h=int(cap.get(4));raw=[];segs=[]
options=mp.tasks.vision.PoseLandmarkerOptions(base_options=mp.tasks.BaseOptions(model_asset_path=str(model)),running_mode=mp.tasks.vision.RunningMode.VIDEO,num_poses=1,min_pose_detection_confidence=.3,min_pose_presence_confidence=.3,min_tracking_confidence=.3)
with mp.tasks.vision.PoseLandmarker.create_from_options(options) as detector:
 i=0
 while True:
  ok,bgr=cap.read()
  if not ok:break
  im=mp.Image(image_format=mp.ImageFormat.SRGB,data=cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB));r=detector.detect_for_video(im,round(i*1000/fps))
  raw.append([[l.x*w,l.y*h,l.visibility,l.z*w] for l in r.pose_landmarks[0]] if r.pose_landmarks else None)
  if i%60==0:print('pose',i, bool(r.pose_landmarks),flush=True)
  i+=1
cap.release();(P/'analysis/pose-raw.json').write_text(json.dumps({'fps':fps,'width':w,'height':h,'frames':raw}))
# Fill only missing detections, then a small symmetric 7-frame window (100ms).
arr=np.full((len(raw),33,4),np.nan)
for i,r in enumerate(raw):
 if r is not None:arr[i]=r
missing=int(np.isnan(arr[:,0,0]).sum());t=np.arange(len(arr))
for j in range(33):
 for d in range(4):
  valid=np.isfinite(arr[:,j,d]);arr[:,j,d]=np.interp(t,t[valid],arr[valid,j,d])
sm=arr.copy();
for lo,hi in [(0,546),(546,len(arr))]:sm[lo:hi,:,:2]=savgol_filter(arr[lo:hi,:,:2],7,2,axis=0)
sm=np.round(sm,3)
(P/'motion.json').write_text(json.dumps({'fps':fps,'width':w,'height':h,'frameCount':len(raw),'cutFrame':546,'frames':sm.tolist()},separators=(',',':')))
(P/'analysis/pose-summary.json').write_text(json.dumps({'frames':len(raw),'fps':fps,'missing':missing,'smoothing':'symmetric Savitzky-Golay, window7 poly2, split at source cut frame546; no global timing shift'},indent=2))
# Overlaid evidence of the measurement, never used as the recreated footage.
indices=[0,180,240,270,285,300,312,324,360,420,480,600];cap=cv2.VideoCapture(str(source));tiles=[]
edges=[(11,13),(13,15),(12,14),(14,16),(11,12),(11,23),(12,24),(23,24),(23,25),(25,27),(24,26),(26,28),(27,31),(28,32)]
for i in indices:
 cap.set(cv2.CAP_PROP_POS_FRAMES,i);ok,img=cap.read()
 if not ok:continue
 for a,b in edges:
  cv2.line(img,tuple(sm[i,a,:2].astype(int)),tuple(sm[i,b,:2].astype(int)),(40,230,70),4)
 for j in [11,12,13,14,15,16,23,24,25,26,27,28]:cv2.circle(img,tuple(sm[i,j,:2].astype(int)),6,(20,60,255),-1)
 cv2.putText(img,f'{i/fps:.3f}s / f{i}',(20,100),cv2.FONT_HERSHEY_SIMPLEX,1.3,(255,255,255),3)
 tiles.append(cv2.resize(img,(180,320)))
cap.release();sheet=np.concatenate([np.concatenate(tiles[k:k+6],axis=1) for k in [0,6]],axis=0);cv2.imwrite(str(P/'qa/pose-measurement.jpg'),sheet)
print('DONE',len(raw),'missing',missing,flush=True)
