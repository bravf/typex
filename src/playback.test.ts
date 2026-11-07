import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
vi.mock('./data/audio.json',()=>({default:{}}));
import {pronounce,stopSpeech} from './playback';
import {selectEnglishVoice} from './speech';
class Utterance{text:string;voice?:unknown;lang='';rate=1;volume=1;pitch=1;onstart:(()=>void)|null=null;onend:(()=>void)|null=null;onerror:((e:{error:string})=>void)|null=null;constructor(text:string){this.text=text;}}
let spoken:Utterance[],synth:{getVoices:ReturnType<typeof vi.fn>;speak:ReturnType<typeof vi.fn>;cancel:ReturnType<typeof vi.fn>;addEventListener:ReturnType<typeof vi.fn>;removeEventListener:ReturnType<typeof vi.fn>;paused:boolean;resume:ReturnType<typeof vi.fn>};
beforeEach(()=>{vi.useFakeTimers();spoken=[];synth={getVoices:vi.fn(()=>[{name:'Microsoft David Desktop',lang:'en-US',localService:true}]),speak:vi.fn((u:Utterance)=>spoken.push(u)),cancel:vi.fn(),addEventListener:vi.fn(),removeEventListener:vi.fn(),paused:false,resume:vi.fn()};vi.stubGlobal('window',{speechSynthesis:synth,SpeechSynthesisUtterance:Utterance});vi.stubGlobal('SpeechSynthesisUtterance',Utterance);});
afterEach(()=>{stopSpeech();vi.useRealTimers();vi.unstubAllGlobals();});
describe('speech request lifecycle',()=>{
 it('finishes with an error when Windows never fires a playback event',()=>{const status=vi.fn();pronounce('apple',status);vi.advanceTimersByTime(6300);expect(spoken).toHaveLength(2);expect(status.mock.lastCall?.[0]).toContain('未能启动');expect(vi.getTimerCount()).toBe(0);});
 it('clears pending status and timers when cancelled',()=>{const status=vi.fn();pronounce('apple',status);stopSpeech();expect(status.mock.lastCall?.[0]).toBe('');expect(vi.getTimerCount()).toBe(0);});
 it('old button cleanup cannot cancel another button playback',()=>{const first=vi.fn(),second=vi.fn();const cancelFirst=pronounce('apple',first);pronounce('library',second);const count=synth.cancel.mock.calls.length;cancelFirst();expect(synth.cancel.mock.calls.length).toBe(count);spoken.at(-1)?.onstart?.();expect(second.mock.lastCall?.[0]).toBe('正在朗读');});
 it('uses an independent deadline when start fires but end never does',()=>{const status=vi.fn();pronounce('apple',status);spoken[0].onstart?.();vi.advanceTimersByTime(9000);expect(status.mock.lastCall?.[0]).toContain('未响应');expect(vi.getTimerCount()).toBe(0);});
 it('attempts default English even if voice enumeration stays empty',()=>{synth.getVoices.mockReturnValue([]);const status=vi.fn();pronounce('apple',status);vi.advanceTimersByTime(1800);expect(spoken).toHaveLength(1);expect(spoken[0].lang).toBe('en-US');spoken[0].onstart?.();spoken[0].onend?.();expect(status.mock.lastCall?.[0]).toBe('');});
 it('handles synchronous voice failures without leaking timer state',()=>{synth.speak.mockImplementation(()=>{throw new Error('voice broken');});const status=vi.fn();pronounce('apple',status);vi.advanceTimersByTime(200);expect(status.mock.lastCall?.[0]).toContain('未能启动');expect(vi.getTimerCount()).toBe(0);});
 it('prefers installed Windows English over network-only natural voices',()=>{expect(selectEnglishVoice([{name:'Microsoft Jenny Online (Natural)',lang:'en-US',localService:false},{name:'Microsoft Zira Desktop',lang:'en-US',localService:true}])?.name).toContain('Zira');});
});
