import {selectEnglishVoice,SPEECH_RATE} from './speech';
import audioFiles from './data/audio.json';
const recordings:Record<string,string>=audioFiles;
type Request={cancel:()=>void};
let active:Request|undefined;
export function stopSpeech(){active?.cancel();}
export function pronounce(text:string,onStatus?:(s:string)=>void):()=>void{
 stopSpeech();
 if(recordings[text])return playRecording(recordings[text],onStatus);
 if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){
  onStatus?.('这个浏览器暂不支持朗读，请用 Chrome、Edge 或 Safari 打开网站。');return()=>{};
 }
 const synth=window.speechSynthesis;
 let done=false,attempt=0,utterance:SpeechSynthesisUtterance|undefined;
 const timers=new Set<ReturnType<typeof setTimeout>>();
 const later=(fn:()=>void,ms:number)=>{const timer=setTimeout(()=>{timers.delete(timer);if(!done)fn();},ms);timers.add(timer);return timer;};
 const clear=(timer:ReturnType<typeof setTimeout>|undefined)=>{if(timer!==undefined){clearTimeout(timer);timers.delete(timer);}};
 function detach(){if(utterance){utterance.onstart=null;utterance.onend=null;utterance.onerror=null;}}
 function finish(status:string,cancel=false){
  if(done)return;done=true;for(const timer of timers)clearTimeout(timer);timers.clear();
  synth.removeEventListener?.('voiceschanged',ready);detach();
  if(active===request)active=undefined;
  if(cancel)try{synth.cancel();}catch{/* Status still resolves if the engine fails. */}
  utterance=undefined;onStatus?.(status);
 }
 const request:Request={cancel:()=>finish('',true)};active=request;
 const failure=(reason:string)=>'未能启动英语朗读（'+reason+'）。请再次点击重试，或在 Windows 语言设置中安装英语语音包。';
 let startTimer:ReturnType<typeof setTimeout>|undefined,voiceTimer:ReturnType<typeof setTimeout>|undefined;
 function retry(reason:string){
  if(done)return;
  clear(startTimer);detach();
  if(attempt>=2){finish(failure(reason),true);return;}
  try{synth.cancel();}catch{/* Try a fresh utterance anyway. */}
  onStatus?.('正在切换备用声音…');
  // Let cancellation finish before queuing another utterance on Windows engines.
  later(()=>speak(true),120);
 }
 function speak(useDefault=false){
  if(done)return;clear(voiceTimer);synth.removeEventListener?.('voiceschanged',ready);
  try{
   const voice=selectEnglishVoice(synth.getVoices());
   const u=new SpeechSynthesisUtterance(text);utterance=u;attempt++;const current=attempt;
   u.lang=voice?.lang.replace('_','-')||'en-US';if(voice&&!useDefault)u.voice=voice;
   u.rate=SPEECH_RATE;u.volume=1;u.pitch=1;
   u.onstart=()=>{if(done||current!==attempt)return;clear(startTimer);onStatus?.('正在朗读');};
   u.onend=()=>{if(!done&&current===attempt)finish('');};
   u.onerror=e=>{if(!done&&current===attempt)retry(e.error||'语音引擎错误');};
   // Install the watchdog before speak(): callbacks may fire synchronously.
   startTimer=later(()=>retry('播放超时'),3000);
   if(synth.paused)synth.resume();synth.speak(u);
  }catch{retry('语音引擎不可用');}
 }
 function ready(){if(done||attempt)return;try{if(selectEnglishVoice(synth.getVoices()))speak();}catch{finish(failure('无法读取声音列表'),true);}}
 onStatus?.('准备播放…');
 // Independent deadline also handles engines that swallow every event, including cancellation.
 later(()=>finish(failure('语音引擎未响应'),true),8500+Math.min(text.length*60,20000));
 try{
  if(selectEnglishVoice(synth.getVoices()))speak();
  else{synth.addEventListener?.('voiceschanged',ready);voiceTimer=later(()=>speak(true),1800);}
 }catch{finish(failure('无法读取声音列表'),true);}
 return request.cancel;
}

function playRecording(url:string,onStatus?: (s:string)=>void):()=>void{
 let done=false,audio:HTMLAudioElement|undefined,timer:ReturnType<typeof setTimeout>|undefined;
 function finish(status:string){if(done)return;done=true;clearTimeout(timer);if(active===request)active=undefined;if(audio){audio.onplaying=null;audio.onended=null;audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();}onStatus?.(status);}
 const request:Request={cancel:()=>finish('')};active=request;
 onStatus?.('加载发音…');
 try{
  audio=new Audio(url);audio.preload='auto';audio.volume=1;
  audio.onplaying=()=>{if(done)return;clearTimeout(timer);onStatus?.('正在朗读');timer=setTimeout(()=>finish('播放中断，请点击重试。'),Math.max(15000,(audio?.duration||15)*1000+5000));};
  audio.onended=()=>finish('');
  audio.onerror=()=>finish('发音文件加载失败，请检查网络后点击重试。');
  timer=setTimeout(()=>finish('发音文件加载超时，请检查网络后点击重试。'),12000);
  const result=audio.play();void result?.catch(error=>{if(done)return;finish(error?.name==='NotAllowedError'?'浏览器阻止播放，请允许此网站播放声音后再次点击。':'发音播放失败，请检查设备输出和网络后重试。');});
 }catch{finish('当前浏览器无法播放发音文件，请换用 Chrome 或 Edge。');}
 return request.cancel;
}
