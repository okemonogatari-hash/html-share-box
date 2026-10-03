from pathlib import Path
import json,numpy as np
from scipy.interpolate import PchipInterpolator
p=Path(__file__).resolve().parent;b=json.loads((p/'consult/ball-samples.json').read_text())['samples'];a=[{'t':3.6,'x':270,'y':840,'r':0}]+[{'t':r['time'],'x':r['x'],'y':r['y'],'r':r['radius']} for r in b];(p/'ball-motion.json').write_text(json.dumps(a,indent=2));ts=np.array([r['t'] for r in a]);values=np.array([[r['x'],r['y'],r['r']] for r in a]);curve=PchipInterpolator(ts,values);tt=np.arange(658)/60;v=curve(np.clip(tt,ts[0],ts[-1]));(p/'ball-frames.json').write_text(json.dumps(np.round(v,3).tolist(),separators=(',',':')));print('measured ball samples',len(b))
