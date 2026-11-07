import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {pronounce,stopSpeech} from './playback';
let last:FakeAudio;
class FakeAudio{onplaying:(()=>void)|null=null;onended:(()=>void)|null=null;onerror:(()=>void)|null=null;duration=1;volume=0;preload='';pause=vi.fn();load=vi.fn();removeAttribute=vi.fn();play=vi.fn(()=>Promise.resolve());constructor(public src:string){last=this;}}
beforeEach(()=>{vi.useFakeTimers();vi.stubGlobal('window',{});vi.stubGlobal('Audio',FakeAudio);});
afterEach(()=>{stopSpeech();vi.useRealTimers();vi.unstubAllGlobals();});
it('plays a bundled word without speechSynthesis or installed voices',()=>{const status=vi.fn();pronounce('apple',status);expect(last.src).toMatch(/^\/audio\/samantha-v1\/.+mp3$/);expect(last.play).toHaveBeenCalledOnce();last.onplaying?.();expect(status.mock.lastCall?.[0]).toBe('正在朗读');last.onended?.();expect(status.mock.lastCall?.[0]).toBe('');expect(vi.getTimerCount()).toBe(0);});
it('cleans up a recording when another request replaces it',()=>{const status=vi.fn();pronounce('apple',status);const old=last;pronounce('library');expect(old.pause).toHaveBeenCalledOnce();expect(status.mock.lastCall?.[0]).toBe('');});
it('reports a file timeout rather than leaving preparation forever',()=>{const status=vi.fn();pronounce('apple',status);vi.advanceTimersByTime(12000);expect(status.mock.lastCall?.[0]).toContain('加载超时');});
