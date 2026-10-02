"""Rebuild the 15-second edit from generated Flow clips; no source Shorts used."""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent
FPS = 24
# 64 setup + 61 approach + 18 rolling + 86 strike + 131 joy = 360 frames.
graph = '''
[0:v]split=3[vs][va][vr];[0:a]asplit=3[as][aa][ar];
[vs]trim=start_frame=0:end_frame=32,setpts=2*(PTS-STARTPTS),tpad=stop_mode=clone:stop_duration=0.1,fps=24,trim=end_frame=64,setsar=1[v0];
[as]atrim=start=0:end=1.333333333,asetpts=PTS-STARTPTS,atempo=0.5,apad,atrim=end=2.666666667,aformat=sample_rates=48000:channel_layouts=stereo[a0];
[va]trim=start_frame=32:end_frame=93,setpts=PTS-STARTPTS,setsar=1[v1];
[aa]atrim=start=1.333333333:end=3.875,asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,afade=t=out:st=2.51:d=0.03[a1];
[vr]trim=start_frame=156:end_frame=174,setpts=PTS-STARTPTS,setsar=1[v2];
[ar]atrim=start=6.5:end=7.25,asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,afade=t=in:d=0.03,afade=t=out:st=0.72:d=0.03[a2];
[1:v]trim=start_frame=0:end_frame=86,setpts=PTS-STARTPTS,scale=720:1280,setsar=1[v3];
[1:a]atrim=start=0:end=3.583333333,asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,afade=t=in:d=0.03,afade=t=out:st=3.55:d=0.03[a3];
[2:v]trim=start_frame=13:end_frame=144,setpts=PTS-STARTPTS,setsar=1[v4];
[2:a]atrim=start=0.541666667:end=6,asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,afade=t=in:d=0.03,afade=t=out:st=5.258333333:d=0.2[a4];
[v0][a0][v1][a1][v2][a2][v3][a3][v4][a4]concat=n=5:v=1:a=1[v][a]
'''
(ROOT/'edit-filter.txt').write_text(graph)
subprocess.run([
    'ffmpeg','-y','-v','error',
    '-i',str(ROOT/'flow-02-cinematic-bowling.mp4'),
    '-i',str(ROOT/'flow-04-strike.mp4'),
    '-i',str(ROOT/'flow-03-celebration.mp4'),
    '-filter_complex_script',str(ROOT/'edit-filter.txt'),
    '-map','[v]','-map','[a]',
    '-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p',
    '-c:a','aac','-b:a','192k','-ar','48000',
    '-r','24','-frames:v','360','-t','15','-movflags','+faststart',
    str(ROOT/'capy-budgie-bowling-15s-v1.mp4')
],check=True)
print(ROOT/'capy-budgie-bowling-15s-v1.mp4')
