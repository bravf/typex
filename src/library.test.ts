import {beforeEach,describe,it,expect,vi} from 'vitest';
import {wordEntries,hanziEntries} from './library';
import {questionPool,nextQuestion,markPresented,resetDeckMemory,EMPTY_STATS,grade,type Config,type Result,topics} from './game';
const base:Config={mode:'words',difficulty:'hard',chineseMode:'pinyin',topic:'all'};
const stored=new Map<string,string>();
beforeEach(()=>{stored.clear();resetDeckMemory();vi.stubGlobal('localStorage',{getItem:(k:string)=>stored.get(k)||null,setItem:(k:string,v:string)=>stored.set(k,v)});});
describe('expanded content',()=>{
 it('has substantial unique banks and populated learning fields',()=>{expect(wordEntries.length).toBeGreaterThanOrEqual(1000);expect(hanziEntries.length).toBe(2500);for(const bank of [wordEntries,hanziEntries]){expect(new Set(bank.map(e=>e.id)).size).toBe(bank.length);for(const e of bank){expect(e.explanation.length).toBeGreaterThan(3);expect(e.source).toBeTruthy();expect([1,2,3]).toContain(e.level);}}});
 it('has valid ASCII pinyin and contextual polyphones',()=>{for(const e of hanziEntries){expect(e.input).toMatch(/^[a-zv]+$/);expect(e.context).toContain(e.char);}const by=(c:string)=>hanziEntries.find(e=>e.char===c)!;expect(by('绿').input).toBe('lv');expect(by('女').input).toBe('nv');expect(by('长').context).toBe('长大');expect(by('长').input).toBe('zhang');expect(by('行').input).toBe('xing');expect(by('的').input).toBe('de');});
 it('rejects malformed dictionary fragments and irrelevant example sentences',()=>{for(const e of hanziEntries){expect(e.meaning).not.toMatch(/毒纯洁|二氧化碳|：\)\。|性交|阴部|强奸/);if(e.example)expect(e.example).toContain(e.context);}});
 it('validates every available level and topic without silently returning another range',()=>{for(const mode of ['words','chinese'] as const)for(const difficulty of ['easy','medium','hard'] as const)for(const topic of ['all',...topics(mode,difficulty)]){const pool=questionPool({...base,mode,difficulty,topic});expect(pool.length).toBeGreaterThan(0);for(const q of pool){expect(q.entry).toBeTruthy();if(topic!=='all')expect(q.entry!.topic).toBe(topic);}}});
 it('has translated examples and audible spelling targets',()=>{for(const e of wordEntries){expect(e.word).toMatch(/^[a-zA-Z-]+$/);expect(e.phonetic).toMatch(/^\/.+\/$/);expect(e.partOfSpeech).toBeTruthy();if(e.example)expect(e.exampleTranslation).toBeTruthy();}expect(wordEntries.filter(e=>e.example).length).toBeGreaterThan(100);});
});
describe('persistent question decks',()=>{
 it('does not repeat before a complete cycle and survives memory resets',()=>{const c={...base,mode:'keys' as const,difficulty:'easy' as const};const seen=new Set<string>();let previous='';for(let i=0;i<26;i++){const q=nextQuestion(c,previous);expect(seen.has(q.label)).toBe(false);seen.add(q.label);markPresented(c,q);previous=q.label;if(i===12)resetDeckMemory();}const q=nextQuestion(c,previous);expect(q.label).not.toBe(previous);markPresented(c,q);expect(seen.size).toBe(26);});
 it('shares shown labels when changing topics and Chinese input modes',()=>{const c={...base,mode:'chinese' as const,difficulty:'easy' as const};const q=nextQuestion(c);markPresented(c,q);for(let i=0;i<20;i++){const next=nextQuestion({...c,chineseMode:'hanzi'});expect(next.label).not.toBe(q.label);markPresented({...c,chineseMode:'hanzi'},next);}});
 it('rendering without committing does not consume entries',()=>{const c={...base,mode:'keys' as const,difficulty:'easy' as const};for(let i=0;i<100;i++)nextQuestion(c);expect(stored.size).toBe(0);});
});
describe('cycle boundary purity',()=>{
 it('does not reset a completed cycle during uncommitted renders or duplicate effects',()=>{const c={...base,mode:'keys' as const,difficulty:'easy' as const};let last=nextQuestion(c);for(let i=0;i<26;i++){last=nextQuestion(c,last.label);markPresented(c,last);}const before=[...stored.entries()];for(let i=0;i<20;i++)nextQuestion(c,last.label);markPresented(c,last);expect([...stored.entries()]).toEqual(before);const next=nextQuestion(c,last.label);markPresented(c,next);const state=JSON.parse([...stored.values()][0]);expect(state.seen).toEqual([next.label]);});
});
describe('character scoring migration',()=>{
 const result=(extra:Partial<Result>):Result=>({...EMPTY_STATS(),id:'test',date:'2026-11-06',config:base,elapsed:300,finished:true,scoringVersion:2,...extra});
 it('gives a long word the same credit per letter as short words',()=>{expect(grade(result({correct:175,completed:10})).stars).toBe(3);expect(grade(result({correct:75,completed:5})).stars).toBe(2);expect(grade(result({correct:74,completed:50})).stars).toBe(1);});
 it('keeps historical completed-question ratings',()=>{expect(grade(result({scoringVersion:undefined,correct:30,completed:23})).stars).toBe(3);});
});
