import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { targetAudio } from '../public/target-audio.mjs';
import { LEVELS } from '../public/logic.mjs';
import worker from '../worker.mjs';

test('all eleven targets resolve to real recordings; Commons words have exact attribution', () => {
  const targets = LEVELS.flatMap(level => level.lines.map(line => line.text));
  assert.deepEqual(Object.keys(targetAudio).sort(), targets.sort());
  const credits = JSON.parse(readFileSync(new URL('../public/audio/credits.json', import.meta.url)));
  for (const [text, path] of Object.entries(targetAudio)) {
    assert.ok(existsSync(new URL('../public/iris/' + path, import.meta.url)), text);
    if (path.startsWith('../audio/')) {
      const credit = credits[text.toLowerCase()];
      assert.equal(path, '../' + credit.file);
      assert.ok(credit.author && credit.changes);
      assert.match(credit.source, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      assert.ok(credit.license.url.startsWith('https://creativecommons.org/') || credit.license.url === 'https://commons.wikimedia.org/wiki/Template:PD-self');
      assert.equal(credit.accent, 'en-US');
      assert.equal(createHash('sha256').update(readFileSync(new URL('../public/' + credit.file, import.meta.url))).digest('hex'), credit.sha256);
    }
  }
  assert.equal(targetAudio.CAT, '../audio/cat.mp3');
  assert.equal(targetAudio.SUN, '../audio/sun.mp3');
  assert.equal(targetAudio.HELLO, '../audio/hello.mp3');
});

test('both worker locales serve Commons audio and credit pages, rejecting unrelated paths', async () => {
  const env = { ASSETS: { fetch: async request => new Response(new URL(request.url).pathname) } };
  for (const base of ['/games/typewriter', '/en/games/typewriter']) {
    for (const path of ['/audio/cat.mp3', '/audio/sun.mp3', '/audio/hello.mp3', '/audio/credits.html', '/audio/credits-en.html', '/target-audio.mjs']) {
      const result = await worker.fetch(new Request('https://edu.alading.org' + base + path), env);
      assert.equal(result.status, 200);
      assert.equal(await result.text(), path);
    }
    assert.equal((await worker.fetch(new Request('https://edu.alading.org' + base + '/audio/private.txt'), env)).status, 404);
  }
});
