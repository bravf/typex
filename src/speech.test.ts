import {describe,it,expect} from 'vitest';
import {selectEnglishVoice,SPEECH_RATE} from './speech';
describe('English voice choice',()=>{
 it('selects Samantha rather than the first Albert voice',()=>{expect(selectEnglishVoice([{name:'Albert',lang:'en-US'},{name:'Samantha',lang:'en-US'}])?.name).toBe('Samantha');});
 it('avoids effect voices even when there is no US standard voice',()=>{expect(selectEnglishVoice([{name:'Bells',lang:'en-US'},{name:'Daniel',lang:'en-GB'}])?.name).toBe('Daniel');});
 it('does not fall back to novelty or non-English voices',()=>{expect(selectEnglishVoice([{name:'Albert',lang:'en-US'},{name:'Tingting',lang:'zh-CN'}])).toBeUndefined();});
 it('supports other platforms and near-normal speed',()=>{expect(selectEnglishVoice([{name:'Test English',lang:'en-US'},{name:'Google US English',lang:'en-US'}])?.name).toBe('Google US English');expect(SPEECH_RATE).toBe(.96);});
});
