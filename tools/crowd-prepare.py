"""Prepare a diffuse crowd bed from Breviceps' CC0 German crowd recording."""
import pathlib,urllib.request,subprocess,json,math,tempfile
from array import array
root=pathlib.Path(__file__).resolve().parent.parent
out=root/'assets/audio/ambience'
url='https://cdn.freesound.org/previews/473/473586_9159316-hq.mp3'
src=pathlib.Path(tempfile.gettempdir())/'hk-german-crowd-473586.mp3'
if not src.exists(): urllib.request.urlretrieve(url,src)
# Keep voices in the distance, without the previous Spanish market conversations.
raw=subprocess.check_output(['ffmpeg','-v','error','-ss','1','-i',str(src),'-t','34','-af','highpass=f=250,lowpass=f=1800','-ar','32000','-ac','2','-f','f32le','-'])
data=array('f',raw);n=32000*2*2
join=array('f',(data[-n+i]*math.cos((i//2)/(n//2-1)*math.pi/2)+data[i]*math.sin((i//2)/(n//2-1)*math.pi/2) for i in range(n)))
data=data[n:-n]+join
# Quiet offset layers mask individual foreground sentences. All offsets wrap at
# the same seamless join; no reversed speech, pitch shifts or synthetic hiss.
mixed=array('f',(v*.75+data[(i+7*64000)%len(data)]*.3+data[(i+19*64000)%len(data)]*.18 for i,v in enumerate(data)))
subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','32000','-ac','2','-i','-','-af','loudnorm=I=-23:TP=-7:LRA=5','-ar','32000','-codec:a','libmp3lame','-q:a','4',str(out/'crowd.mp3')],input=mixed.tobytes(),check=True)
m=dict(kind='crowd',author='Breviceps',source='https://freesound.org/people/Breviceps/sounds/473586/',original=url,license='CC0 1.0',licenseUrl='https://creativecommons.org/publicdomain/zero/1.0/',duration=len(data)/64000,changes='Excerpt 1–35 s, high/low-pass filtering, 2 s loop crossfade, quiet offset layers at 7 and 19 s, loudness adjustment, MP3 encoding.')
meta=json.loads((out/'sources.json').read_text());meta=[x for x in meta if x['kind']!='crowd']+[m]
(out/'sources.json').write_text(json.dumps(meta,indent=2)+'\n')
(out/'CREDITS.txt').write_text('\n\n'.join(x['kind']+' — '+x['author']+'\n'+x['source']+'\n'+x['license']+' '+x['licenseUrl']+'\n'+x['changes'] for x in meta)+'\n')
print('crowd:',m['duration'],'seconds')
