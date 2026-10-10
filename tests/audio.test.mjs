import test from 'node:test';
import assert from 'node:assert/strict';
import { IrisAudio } from '../public/iris-audio.mjs';
import worker from '../worker.mjs';
let played = [];
class Recording {
  constructor(src) { this.src = src; this.paused = true; played.push(this); }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
}
globalThis.Audio = Recording;
test('muting cancels narration, effects and queued continuation', () => {
  played = []; const audio = new IrisAudio('/iris/', 'en');
  audio.sequence(['one.mp3', 'two.mp3']); audio.effect('05_level_complete');
  const first = played[0]; audio.setEnabled(false); first.onended();
  assert.equal(played.length, 2); assert.ok(played.every(item => item.paused));
  audio.prompt('common_start'); assert.equal(played.length, 2);
});
test('new narration replaces old queue; retries and effects are bounded', () => {
  played = []; const audio = new IrisAudio('/iris/', 'zh');
  audio.sequence(['one.mp3', 'stale.mp3']); const old = played[0];
  audio.prompt('typewriter_fix', 12000); old.onended(); audio.prompt('typewriter_fix', 12000);
  assert.equal(played.length, 2); assert.ok(old.paused);
  for (let n = 0; n < 8; n++) audio.effect(String(n));
  assert.equal(played.length, 5);
});
test('media rejection does not escape into game logic', async () => {
  globalThis.Audio = class extends Recording { play() { return Promise.reject(new Error('blocked')); } };
  const audio = new IrisAudio('/iris/', 'en'); audio.prompt('common_start'); audio.effect('04_gentle_retry');
  await new Promise(resolve => setImmediate(resolve)); audio.stop(); globalThis.Audio = Recording;
});
test('both deployed locale paths serve only the intended audio assets', async () => {
  const fetched = [];
  const env = { ASSETS: { fetch: async req => { fetched.push(new URL(req.url).pathname); return new Response('audio', { headers: { 'Content-Type': 'audio/mpeg' } }); } } };
  for (const base of ['/games/typewriter', '/en/games/typewriter']) {
    const result = await worker.fetch(new Request('https://edu.alading.org'+base+'/iris/audio/prompts/en/typewriter_done.mp3'), env);
    assert.equal(result.status, 200); assert.equal(result.headers.get('content-type'), 'audio/mpeg');
    assert.equal((await worker.fetch(new Request('https://edu.alading.org'+base+'/iris/private.json'),env)).status,404);
  }
  assert.equal(fetched.length,2);
});
