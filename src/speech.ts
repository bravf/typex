// Exclude macOS effect/character voices from language-learning playback.
const novelty=/^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Fred|Good News|Jester|Junior|Kathy|Organ|Ralph|Superstar|Trinoids|Whisper|Wobble|Zarvox|Grandma|Grandpa|Rocko|Shelley|Sandy|Eddy|Flo|Reed)(\b|$)/i;
export function selectEnglishVoice<T extends {name:string;lang:string}>(voices:T[]):T|undefined{
 const english=voices.filter(v=>/^en(?:[-_]|$)/i.test(v.lang)&&!novelty.test(v.name));
 const score=(v:T)=> /Samantha/i.test(v.name)?100:/Natural|Neural|Premium|Enhanced/i.test(v.name)?95:/Google US English/i.test(v.name)?90:/Ava|Aria|Jenny|Joanna/i.test(v.name)?85:/^en[-_]US$/i.test(v.lang)?70:/Daniel|Karen|Moira/i.test(v.name)?60:40;
 return english.map((v,i)=>({v,i,score:score(v)})).sort((a,b)=>b.score-a.score||a.i-b.i)[0]?.v;
}
export const SPEECH_RATE=.96;
