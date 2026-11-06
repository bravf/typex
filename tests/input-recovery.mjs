import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173');await page.locator('.mode-card.words').click();await page.getByRole('button',{name:/准备好了/}).click();await page.locator('.game-overlay').waitFor({state:'detached'});await page.getByRole('dialog').waitFor({state:'detached'});
 const input=page.getByLabel('练习输入框');let count=0;
 const begin=async()=>{await input.focus();await input.evaluate(el=>el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true})));};
 const complete=async()=>{const word=await page.locator('.target-word').textContent();await page.keyboard.type(word);assert.equal(await page.locator('.game-dashboard>div').nth(1).locator('strong').textContent(),String(++count));};
 await begin();await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'w',isComposing:true,keyCode:229,bubbles:true})));assert.equal(await page.locator('.typing-slots .filled').count(),0);await page.getByText('检测到输入法正在组词',{exact:false}).waitFor();
 // No compositionend: switching IME back to English must recover from the next normal key.
 await complete();assert.equal(await page.locator('.input-notice').count(),0);
 await begin();await page.locator('.exercise-label').click();await complete();
 await begin();await page.getByRole('button',{name:/了解单词/}).click();await page.getByRole('button',{name:'继续练习',exact:true}).click();await page.getByRole('dialog').waitFor({state:'detached'});await complete();
 await begin();await page.getByRole('button',{name:'暂停',exact:true}).click();await page.getByRole('button',{name:'继续探险',exact:true}).click();await page.getByRole('dialog').waitFor({state:'detached'});await complete();
 await begin();await page.getByRole('button',{name:'恢复输入',exact:true}).click();assert.equal(await input.evaluate(el=>el===document.activeElement),true);await complete();
 assert.deepEqual(errors,[]);console.log('PASS: IME keys are not scored; missing compositionend recovers on normal keys, blur, knowledge close, pause/resume and recovery button.');
}finally{await browser.close();}
