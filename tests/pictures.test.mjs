import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LEVELS } from '../public/logic.mjs';
import { pictureSheet, targetPictures } from '../public/target-pictures.mjs';
import worker from '../worker.mjs';

test('every target has its own picture cell and bilingual description in the actual illustration sheet', () => {
  assert.deepEqual(Object.keys(targetPictures).sort(), LEVELS.flatMap(level => level.lines.map(line => line.text)).sort());
  const png = readFileSync(new URL('../public/' + pictureSheet.src, import.meta.url));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), pictureSheet.width);
  assert.equal(png.readUInt32BE(20), pictureSheet.height);
  assert.equal(pictureSheet.width / pictureSheet.columns, pictureSheet.height / pictureSheet.rows);
  const cells = new Set();
  for (const scene of Object.values(targetPictures)) {
    assert.ok(Number.isInteger(scene.column) && scene.column >= 0 && scene.column < pictureSheet.columns);
    assert.ok(Number.isInteger(scene.row) && scene.row >= 0 && scene.row < pictureSheet.rows);
    assert.ok(scene.zh.length > 5 && scene.en.length > 5);
    cells.add(`${scene.column},${scene.row}`);
  }
  assert.equal(cells.size, Object.keys(targetPictures).length);
});

test('both locale routes serve illustration resources and reject unrelated files', async () => {
  const env = { ASSETS: { fetch: async request => new Response(new URL(request.url).pathname) } };
  for (const prefix of ['/games/typewriter', '/en/games/typewriter']) {
    for (const suffix of ['/target-pictures.mjs', '/' + pictureSheet.src]) {
      const response = await worker.fetch(new Request('https://edu.alading.org' + prefix + suffix), env);
      assert.equal(response.status, 200); assert.equal(await response.text(), suffix);
    }
    assert.equal((await worker.fetch(new Request('https://edu.alading.org' + prefix + '/illustrations/private.png'), env)).status, 404);
  }
});
