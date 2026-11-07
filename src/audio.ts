let context:AudioContext|undefined;
export function reportAudio(message:string){window.dispatchEvent(new CustomEvent('typex-audio-status',{detail:message}));}
export async function sound(kind:'key'|'error'|'complete',enabled:boolean):Promise<void>{
 if(!enabled)return;
 try{
  const AudioCtor=window.AudioContext||(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
  if(!AudioCtor)throw new Error('unsupported');
  if(!context||context.state==='closed')context=new AudioCtor();
  const ctx=context;
  if(ctx.state!=='running')await ctx.resume();
  if(ctx.state!=='running')throw new Error('suspended');
  const now=ctx.currentTime+.01,osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type=kind==='error'?'sine':'triangle';osc.frequency.setValueAtTime(kind==='error'?180:kind==='complete'?740:490,now);osc.frequency.exponentialRampToValueAtTime(kind==='error'?130:kind==='complete'?1100:660,now+.08);
  gain.gain.setValueAtTime(.1,now);gain.gain.exponentialRampToValueAtTime(.001,now+.16);osc.connect(gain);gain.connect(ctx.destination);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start(now);osc.stop(now+.18);reportAudio('');
 }catch{reportAudio('音效未能播放。请检查设备音量、浏览器标签页是否静音，并点击“试听按键音”重试。');}
}
