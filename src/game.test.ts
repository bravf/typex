import {describe,it,expect} from 'vitest';
import {accuracy,EMPTY_STATS,grade,nextQuestion,markPresented,topics,thresholds,type Config,type Result} from './game';
const base:Config={mode:'keys',difficulty:'easy',chineseMode:'pinyin',topic:'all'};
function result(extra:Partial<Result>={}):Result{return {...EMPTY_STATS(),id:'test',date:new Date().toISOString(),config:base,elapsed:300,finished:true,...extra};}
describe('five-minute ratings',()=>{
 it('requires quantity AND accuracy for excellent',()=>{expect(grade(result({completed:150,correct:150})).stars).toBe(3);expect(grade(result({completed:150,correct:150,wrong:15})).stars).toBe(2);});
 it('does not round 94.6% up to an excellent result',()=>{expect(accuracy({correct:175,wrong:10})).toBe(95);expect(grade(result({completed:175,correct:175,wrong:10})).stars).toBe(2);});
 it('never grades an incomplete session',()=>{expect(grade(result({finished:false,completed:300,correct:300})).stars).toBe(0);});
 it('gives separate thresholds to pinyin and hanzi',()=>{expect(thresholds({...base,mode:'chinese',chineseMode:'pinyin'})).not.toEqual(thresholds({...base,mode:'chinese',chineseMode:'hanzi'}));});
});
describe('question banks',()=>{
 for(const mode of ['keys','words','chinese'] as const)for(const difficulty of ['easy','medium','hard'] as const)for(const topic of ['all',...topics(mode,difficulty)])it(mode+' '+difficulty+' '+topic+' has valid questions without repeats',()=>{const c={...base,mode,difficulty,topic};for(let n=0;n<10;n++){const q=nextQuestion(c);markPresented(c,q);expect(q.answer.length).toBeGreaterThan(0);expect(nextQuestion(c,q.label).label).not.toBe(q.label);}});
 it('uses hanzi targets only in native Chinese mode',()=>{const q=nextQuestion({...base,mode:'chinese',chineseMode:'hanzi'});expect(q.answer).toBe(q.label);expect(q.pinyin).toBeTruthy();});
});
