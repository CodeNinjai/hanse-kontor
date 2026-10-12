# Refresh licensed tracks from their official source and retain attribution metadata.
import urllib.request,urllib.parse,json,subprocess,pathlib,sys
out=pathlib.Path(__file__).resolve().parent.parent/'assets'/'audio';out.mkdir(parents=True,exist_ok=True);tracks=[]
for kind,title,file,isrc in [('market','Angevin','Angevin.mp3','USUAN1200110'),('harbour','Lord of the Land','Lord of the Land.mp3','USUAN1400022'),('night','Evening Fall (Harp)','Evening Fall - Harp.mp3','USUAN1100236'),('cinematic','Windswept','Windswept.mp3','USUAN1100757'),('tavern','Thatched Villagers','Thatched Villagers.mp3','USUAN1100720'),('evening','Evening','Evening.mp3','USUAN2300002'),('healing','Healing','Healing.mp3','USUAN1200048'),('folk','Folk Round','Folk Round.mp3','USUAN1100357')]:
 if '--missing-only' in sys.argv and (out/(kind+'.mp3')).exists():
  tracks.append(next(t for t in json.loads((out/'score.json').read_text())['tracks'] if t['kind']==kind));continue
 url='https://incompetech.com/music/royalty-free/mp3-royaltyfree/'+urllib.parse.quote(file)
 source=pathlib.Path('/tmp')/('hk-source-'+kind+'.mp3');urllib.request.urlretrieve(url,source)
 duration=float(subprocess.check_output(['ffprobe','-v','quiet','-show_entries','format=duration','-of','csv=p=0',str(source)]))
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-af',f'loudnorm=I=-25:TP=-7:LRA=9,afade=t=in:d=2,afade=t=out:st={max(0,duration-4)}:d=4','-ar','44100','-codec:a','libmp3lame','-q:a','4','-metadata','artist=Kevin MacLeod','-metadata','title='+title,'-metadata','copyright=CC BY 4.0 https://creativecommons.org/licenses/by/4.0/',str(out/(kind+'.mp3'))],check=True)
 tracks.append(dict(kind=kind,title=title,artist='Kevin MacLeod',file=kind+'.mp3',duration=duration,source='https://incompetech.com/music/royalty-free/index.html?isrc='+isrc,download=url,license='CC BY 4.0',licenseUrl='https://creativecommons.org/licenses/by/4.0/',changes='Loudness adjusted to -25 LUFS, short fades, re-encoded as MP3.'))
 print(kind,title,round(duration),flush=True)
(out/'score.json').write_text(json.dumps(dict(title='Sundhaven – music selection',tracks=tracks),indent=2)+'\n')
(out/'CREDITS.txt').write_text('Music by Kevin MacLeod (https://incompetech.com/)\nLicensed under Creative Commons Attribution 4.0 International:\nhttps://creativecommons.org/licenses/by/4.0/\n\n'+'\n\n'.join(t['title']+'\n'+t['source']+'\n'+t['changes'] for t in tracks)+'\n')
