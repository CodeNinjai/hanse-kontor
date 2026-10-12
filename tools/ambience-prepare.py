# Download licensed recordings and prepare compact local ambience assets. Requires ffmpeg.
import urllib.request,json,subprocess,pathlib,zipfile,math,tempfile
from array import array
out=pathlib.Path(__file__).resolve().parent.parent/'assets'/'audio'/'ambience';out.mkdir(parents=True,exist_ok=True)
cache=pathlib.Path(tempfile.gettempdir());pack=cache/'hk-soundpack.zip'
if not pack.exists():urllib.request.urlretrieve('https://opengameart.org/sites/default/files/soundpack.zip',pack)
meta=[m for m in json.loads((out/'sources.json').read_text()) if m['kind']=='crowd'] if (out/'sources.json').exists() else []
sources=[('water','RandomMind','sea-and-river-wave-sounds','https://opengameart.org/sites/default/files/VistulaShort_0.mp3'),('bird','isaiah658','ambient-bird-sounds','https://opengameart.org/sites/default/files/birds-isaiah658_0.ogg')]
for kind,file in [('gull','seagull1.wav'),('gull2','seagull2.wav'),('cargo','build1.wav'),('work','build2.wav'),('hammer','smith1.wav'),('door','dooropen.wav'),('horse','horse.wav')]:
 sources.append((kind,'Tuomo Untinen','rpg-sound-package',file))
for kind,author,page,file in sources:
 if file.startswith('https:'):
  src=cache/('hk-recording-'+kind+'.mp3')
  if not src.exists() or not src.stat().st_size:urllib.request.urlretrieve(file,src)
 else:
  src=cache/('hk-'+file)
  with zipfile.ZipFile(pack) as z:src.write_bytes(z.read(next(n for n in z.namelist() if n.endswith('/'+file))))
 duration=float(subprocess.check_output(['ffprobe','-v','quiet','-show_entries','format=duration','-of','csv=p=0',str(src)]))
 limit=min(duration,65 if kind=='water' else 35 if kind=='bird' else 12)
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(src),'-t',str(limit),'-af','highpass=f=100,lowpass=f=6500,loudnorm=I=-23:TP=-7:LRA=7','-ar','32000','-ac','2','-f','f32le','-'])
 data=array('f',raw)
 if kind=='water':
  n=min(32000*3*2,len(data)//4);n-=n%2
  join=array('f',(data[-n+i]*math.cos((i//2)/(n//2-1)*math.pi/2)+data[i]*math.sin((i//2)/(n//2-1)*math.pi/2) for i in range(n)))
  data=data[n:-n]+join
 else:
  n=min(3200,len(data)//4)
  for i in range(n):data[i]*=i/n;data[-1-i]*=i/n
 subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','32000','-ac','2','-i','-','-codec:a','libmp3lame','-q:a','4',str(out/(kind+'.mp3'))],input=data.tobytes(),check=True)
 license='CC0 1.0' if file.startswith('https:') else 'CC BY 3.0'
 licenseUrl='https://creativecommons.org/'+('publicdomain/zero/1.0/' if license=='CC0 1.0' else 'licenses/by/3.0/')
 meta.append(dict(kind=kind,author=author,source='https://opengameart.org/content/'+page,original=file,license=license,licenseUrl=licenseUrl,duration=len(data)/64000,changes='Excerpt, filtering, loudness adjustment, fades or loop crossfade, MP3 encoding.'))
 print(kind,round(len(data)/64000,1),flush=True)
(out/'sources.json').write_text(json.dumps(meta,indent=2)+'\n')
(out/'CREDITS.txt').write_text('\n\n'.join(m['kind']+' — '+m['author']+'\n'+m['source']+'\n'+m['license']+' '+m['licenseUrl']+'\n'+m['changes'] for m in meta)+'\n')
