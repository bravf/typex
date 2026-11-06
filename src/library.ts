import words from './data/words.json';
import hanzi from './data/hanzi.json';
export type WordEntry = {id:string;word:string;meaning:string;phonetic:string;partOfSpeech:string;explanation:string;example?:string;exampleTranslation?:string;topic:string;level:1|2|3;emoji:string;source:string};
export type HanziEntry = {id:string;char:string;pinyin:string;input:string;meaning:string;explanation:string;words:string[];example?:string;context:string;topic:string;level:1|2|3;source:string};
export const wordEntries = words.items as unknown as WordEntry[];
export const hanziEntries = hanzi.items as unknown as HanziEntry[];
export const libraryVersion='primary-v2';
export const levelNames={1:'基础',2:'进阶',3:'拓展'} as const;
