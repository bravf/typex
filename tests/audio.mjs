import {chromium} from '@playwright/test';import assert from 'node:assert/strict';
const base=process.env.TYPEX_URL||'http://127.0.0.1:5173';const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.__audio=[];window.__speech=[];window.Audio=class{constructor(url){this.src=url;this.paused=true;}play(){window.__audio.push(this.src);this.paused=false;this.onplaying?.();return Promise.resolve();}pause(){this.paused=true;}load(){}removeAttribute(){}};
  window.AudioContext=class{
   state='suspended';currentTime=0;destination={};resume(){window.__audio.push('resume');return new Promise(resolve=>setTimeout(()=>{this.state='running';window.__audio.push('running');resolve();},80));}
   createOscillator(){return{type:'',frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){window.__audio.push('start');},stop(){}};}
   createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
  };
  Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{name:'Samantha',lang:'en-US'}],cancel(){window.__speech.push('cancel');},resume(){window.__speech.push('resume');},addEventListener(){},removeEventListener(){},speak(u){window.__speech.push({text:u.text,voice:u.voice?.name||'default'});if(u.voice)setTimeout(()=>u.onerror?.({error:'voice-unavailable'}),10);else{u.onstart?.();setTimeout(()=>u.onend?.(),20);}}}});
  window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
 });
 await page.goto(base);await page.getByRole('button',{name:'练习设置',exact:true}).click();await page.getByRole('button',{name:'试听按键音',exact:true}).click();await page.waitForFunction(()=>window.__audio.includes('start'));assert.deepEqual(await page.evaluate(()=>window.__audio),['resume','running','start']);await page.getByRole('button',{name:'关闭',exact:true}).click();await page.getByRole('dialog').waitFor({state:'detached'});await page.getByRole('button',{name:/看看练习内容/}).click();await page.locator('.voice-preview button').first().click();await page.waitForFunction(()=>window.__audio.some(e=>e.includes('/audio/')));assert.match((await page.evaluate(()=>window.__audio)).at(-1),/audio\/samantha-v1/);
 assert.deepEqual(errors,[]);console.log('PASS: sound waits for resume; diagnostic test available; bundled MP3 playback is used independently of system voices.');
}finally{await browser.close();}
