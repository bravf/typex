import {wordEntries,hanziEntries,libraryVersion,type WordEntry,type HanziEntry} from './library';
export type Mode = 'keys' | 'words' | 'chinese';
export type ChineseMode = 'pinyin' | 'hanzi';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Config = { mode: Mode; difficulty: Difficulty; chineseMode: ChineseMode; topic: string };
export type Question = { answer: string; label: string; detail: string; emoji: string; pinyin?: string; entry?: WordEntry | HanziEntry };
export type Stats = { correct: number; wrong: number; completed: number; combo: number; bestCombo: number; hints: number; mistakes: Record<string, number> };
export type Result = Stats & { id: string; date: string; config: Config; elapsed: number; finished: boolean; scoringVersion?: 2 };
export type Settings = { sound: boolean; hints: boolean; effects: boolean; autoRead: boolean };
export const DURATION = 300;
export const EMPTY_STATS = (): Stats => ({ correct: 0, wrong: 0, completed: 0, combo: 0, bestCombo: 0, hints: 0, mistakes: {} });
export const modeNames: Record<Mode,string> = { keys: '键盘寻宝', words: '单词森林', chinese: '汉字花园' };
export const difficultyNames: Record<Difficulty,string> = { easy: '轻松起步', medium: '渐入佳境', hard: '小小挑战' };
export function topics(mode: Mode, difficulty?: Difficulty) { return [...new Set((mode==='words'?wordEntries:mode==='chinese'?hanziEntries:[]).filter(x=>!difficulty||inLevel(x.level,difficulty)).map(x=>x.topic))]; }
export function inLevel(level:number,d:Difficulty){return level<={easy:1,medium:2,hard:3}[d];}
export const scopeNames:Record<Difficulty,string>={easy:'基础词字',medium:'基础 + 进阶',hard:'全部（含拓展）'};
export const keyPools: Record<Difficulty,string> = { easy: "abcdefghijklmnopqrstuvwxyz", medium: "abcdefghijklmnopqrstuvwxyz0123456789,.;/-=" + String.fromCharCode(39), hard: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}:<>?" + String.fromCharCode(34) };
const pools=new Map<string,Question[]>();
export function questionPool(c:Config):Question[]{
 const key=JSON.stringify(c);const cached=pools.get(key);if(cached)return cached;
 let pool:Question[];
 if(c.mode==='keys')pool=[...keyPools[c.difficulty]].map(a=>({answer:a,label:a,detail:/[A-Z!@#$%^&*()_+{}:<>?"]/.test(a)?'按住 Shift，再按对应按键':'在键盘上找到它，轻轻敲一下',emoji:'⌨️'}));
 else if(c.mode==='words')pool=wordEntries.filter(x=>inLevel(x.level,c.difficulty)&&(c.topic==='all'||x.topic===c.topic)).map(x=>({answer:x.word,label:x.word,detail:x.meaning,emoji:x.emoji,entry:x}));
 else pool=hanziEntries.filter(x=>inLevel(x.level,c.difficulty)&&(c.topic==='all'||x.topic===c.topic)).map(x=>({answer:c.chineseMode==='pinyin'?x.input:x.char,label:x.char,detail:x.context,emoji:'🌱',pinyin:x.pinyin,entry:x}));
 pools.set(key,pool);return pool;
}
export function poolSize(c:Config){return questionPool(c).length;}
type DeckState={seen:string[];recent:string[]};
// Seen labels are shared across topic/level changes and both Chinese input methods.
// Each eligible pool exhausts its unseen entries before starting another round.
const deckMemory=new Map<string,DeckState>();
function stateKey(c:Config){return 'key-island-deck-'+libraryVersion+'-'+c.mode+(c.mode==='keys'?'-'+c.difficulty:'');}
function deckState(c:Config):DeckState{
 const key=stateKey(c);let state=deckMemory.get(key);
 if(!state){const raw=storageRead<unknown>(key,null);state=raw&&typeof raw==='object'&&Array.isArray((raw as DeckState).seen)&&Array.isArray((raw as DeckState).recent)?{seen:(raw as DeckState).seen.filter(x=>typeof x==='string'),recent:(raw as DeckState).recent.filter(x=>typeof x==='string').slice(-20)}:{seen:[],recent:[]};deckMemory.set(key,state);}
 return state;
}
export function nextQuestion(c:Config,previous=''):Question{
 const pool=questionPool(c);if(!pool.length)throw new Error('所选范围暂无题目，请重新选择范围。');
 const state=deckState(c),seen=new Set(state.seen);let choices=pool.filter(q=>!seen.has(q.label));
 if(!choices.length)choices=pool;
 const avoid=choices.filter(q=>q.label!==previous);if(avoid.length)choices=avoid;
 const fresh=choices.filter(q=>!state.recent.includes(q.label));if(fresh.length)choices=fresh;
 const q=choices[Math.floor(Math.random()*choices.length)];return q;
}
// Commit only displayed questions, keeping React StrictMode's trial render side-effect free.
export function markPresented(c:Config,q:Question){const state=deckState(c),pool=questionPool(c),seen=new Set(state.seen);if(state.recent.at(-1)!==q.label&&pool.every(item=>seen.has(item.label))){const labels=new Set(pool.map(item=>item.label));state.seen=state.seen.filter(label=>!labels.has(label));}if(!state.seen.includes(q.label))state.seen.push(q.label);if(state.recent.at(-1)!==q.label)state.recent=[...state.recent,q.label].slice(-20);save(stateKey(c),state);}
export function resetDeckMemory(){deckMemory.clear();}
export function scoreUnit(c:Config){return c.mode==='keys'?'次正确按键':c.mode==='chinese'&&c.chineseMode==='hanzi'?'个正确汉字':'个正确字母';}
export function accuracy(s: Pick<Stats,'correct'|'wrong'>) { return s.correct+s.wrong ? Math.round(s.correct/(s.correct+s.wrong)*100) : 0; }
// 产品初始门槛，不代表教育测评标准。数量以完整五分钟为准，不外推提前结束的成绩。
export function thresholds(c: Config, version:1|2=2): [number,number] {
 if(version===1){const scale={easy:1,medium:.8,hard:.65}[c.difficulty];const base=c.mode==='keys'?[60,150]:c.mode==='words'?[15,35]:c.chineseMode==='pinyin'?[20,45]:[12,30];return base.map(x=>Math.round(x*scale)) as [number,number];}
 const base=c.mode==='keys'?[60,150]:c.mode==='words'?[75,175]:c.chineseMode==='pinyin'?[70,160]:[12,30];
 const scale=c.mode==='keys'?{easy:1,medium:.8,hard:.65}[c.difficulty]:1;
 return base.map(x=>Math.round(x*scale)) as [number,number];
}
export function grade(r: Result) {
  if(!r.finished) return {name:'练习已记录',stars:0,note:'提前结束不评级，下次一起完成五分钟。'};
  const [pass,great]=thresholds(r.config,r.scoringVersion===2?2:1), quantity=r.scoringVersion===2?r.correct:r.completed, a=r.correct+r.wrong ? r.correct/(r.correct+r.wrong)*100 : 0;
  if(quantity>=great&&a>=95) return {name:'优秀小探险家',stars:3,note:'准确又专注，你的努力正在闪闪发光！'};
  if(quantity>=pass&&a>=85) return {name:'顺利达标',stars:2,note:'稳稳地前进，每一次练习都算数。'};
  return {name:'成长进行中',stars:1,note:a<85?'慢一点也没关系，先把每个键敲准确。':'已经迈出很棒的一步，再熟悉一点就更快啦。'};
}
export function storageRead<T>(key: string, fallback: T): T { try { const v=localStorage.getItem(key);return v?JSON.parse(v):fallback; }catch{return fallback;} }
export function save(key: string,value: unknown): boolean {try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
