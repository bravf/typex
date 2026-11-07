import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const base = process.env.TYPEX_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  const errors = [], responses = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().includes('/audio/')) responses.push({url: response.url(), status: response.status(), type: response.headers()['content-type']});
  });
  await page.addInitScript(() => {
    window.__recordings = [];
    Object.defineProperty(window, 'speechSynthesis', {value: {getVoices() {throw new Error('System speech must not be used');}}});
    const NativeAudio = window.Audio;
    window.Audio = function(url) {
      const audio = new NativeAudio(url), context = new AudioContext(), analyser = context.createAnalyser();
      context.createMediaElementSource(audio).connect(analyser); analyser.connect(context.destination);
      const record = {url, playing: false, ended: false, peak: 0}; window.__recordings.push(record);
      const samples = new Float32Array(analyser.fftSize);
      const interval = setInterval(() => {analyser.getFloatTimeDomainData(samples); for(const sample of samples) record.peak = Math.max(record.peak, Math.abs(sample));}, 10);
      audio.addEventListener('playing', () => {record.playing = true;});
      audio.addEventListener('ended', () => {record.ended = true; clearInterval(interval); void context.close();});
      audio.addEventListener('error', () => {clearInterval(interval); void context.close();});
      void context.resume(); return audio;
    };
  });
  await page.goto(base);
  await page.getByRole('button', {name: /看看练习内容/}).click();
  for(let index = 0; index < 3; index++) {
    await page.locator('.voice-preview button').nth(index).click();
    await page.waitForFunction(i => window.__recordings[i]?.ended, index, {timeout: 15000});
  }
  const recordings = await page.evaluate(() => window.__recordings);
  assert.equal(recordings.length, 3);
  for(const record of recordings) {
    assert.equal(record.playing, true); assert.equal(record.ended, true);
    assert.ok(record.peak > 0.001, 'Silent decoded audio: ' + record.url);
  }
  assert.ok(responses.length >= 3);
  for(const response of responses) {
    assert.ok([200, 206].includes(response.status), JSON.stringify(response));
    assert.ok(response.type.startsWith('audio/'), JSON.stringify(response));
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({base, recordings, responses}, null, 2));
  console.log('PASS: real MP3 files load, produce nonzero audio, and end without system speech.');
} finally { await browser.close(); }
