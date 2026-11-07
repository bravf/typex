"""Generate portable MP3 pronunciation using the installed Samantha voice on macOS."""
import concurrent.futures, hashlib, json, subprocess, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/audio/samantha-v1'; OUT.mkdir(parents=True,exist_ok=True)
entries=json.loads((ROOT/'src/data/words.json').read_text())['items']
texts=list(dict.fromkeys(t for e in entries for t in [e['word'],e.get('example')] if t))
manifest={t:'/audio/samantha-v1/'+hashlib.sha256(t.encode()).hexdigest()[:20]+'.mp3' for t in texts}
def build(text):
 target=ROOT/'public'/manifest[text].lstrip('/')
 if target.exists() and target.stat().st_size>500:return
 with tempfile.TemporaryDirectory(prefix='typex-audio-') as tmp:
  aiff=Path(tmp)/'voice.aiff';mp3=Path(tmp)/'voice.mp3'
  subprocess.run(['say','-v','Samantha','-r','175','-o',str(aiff),text],check=True,capture_output=True,timeout=45)
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(aiff),'-codec:a','libmp3lame','-b:a','64k',str(mp3)],check=True,capture_output=True,timeout=30)
  target.write_bytes(mp3.read_bytes())
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 for i,_ in enumerate(pool.map(build,texts),1):
  if i%100==0 or i==len(texts):print(f'Audio {i}/{len(texts)}',flush=True)
(ROOT/'src/data/audio.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Complete:',len(texts),'files;',sum((ROOT/'public'/p.lstrip('/')).stat().st_size for p in manifest.values()),'bytes',flush=True)
