import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { targetAudio } from '../public/target-audio.mjs';

const root = new URL('../public/', import.meta.url);
const credits = JSON.parse(readFileSync(new URL('audio/credits.json', root), 'utf8'));
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
for (const word of ['cat', 'sun', 'hello']) {
  const c = credits[word];
  assert.equal(c.file, `audio/${word}.mp3`);
  assert.equal(c.accent, 'en-US');
  assert.ok(c.author && c.license.url && c.changes);
  assert.ok(readFileSync(new URL(c.file, root)).length > 100);
  targetAudio[word.toUpperCase()] = '../' + c.file;
}
writeFileSync(new URL('target-audio.mjs', root), '// Paths are relative to the shared Iris narration channel (iris/).\nexport const targetAudio = ' + JSON.stringify(targetAudio, null, 2) + ';\n');
for (const en of [false, true]) {
  const title = en ? 'Word audio sources' : '单词录音来源';
  const intro = en ? 'CAT, SUN and HELLO use human US English recordings from Wikimedia Commons, Wikipedia’s sister media repository. The eight English phrases and game prompts use Iris English recordings.' : 'CAT、SUN 和 HELLO 使用维基共享资源（Wikimedia Commons，维基百科的姊妹媒体库）的真人美式英语录音。8 段完整英文短句和游戏提示使用 Iris 英文录音。';
  const note = en ? 'Converted to MP3 with volume adjustment; pronunciation, speed and pitch are unchanged. Each file retains the licensing status shown below.' : '录音已转为 MP3 并调整音量；发音内容、语速和音高未改动。每段录音保留下面标明的许可或公有领域状态。';
  const cards = ['cat','sun','hello'].map(word => {
    const c = credits[word];
    return `<article><h2>${word.toUpperCase()}</h2><p>${en ? 'US English' : '美式英语'}</p><audio controls preload="none" aria-label="${word}" src="${word}.mp3"></audio><p>${esc(c.author)} · <a href="${esc(c.source)}">Wikimedia Commons</a> · <a href="${esc(c.license.url)}">${esc(c.license.name)}</a></p></article>`;
  }).join('');
  writeFileSync(new URL(en ? 'audio/credits-en.html' : 'audio/credits.html', root), `<!doctype html>
<html lang="${en ? 'en' : 'zh-CN'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>body{margin:0;background:#eee8d9;color:#323d3b;font:17px/1.7 system-ui,sans-serif}main{max-width:720px;margin:24px auto;padding:24px}a{color:#215c53;text-underline-offset:3px}.back{display:inline-block;padding:12px 0}article{background:#fffdf5;padding:24px;margin:16px 0;border:1px solid #c9c4b3;border-radius:12px}audio{width:100%;min-height:44px}</style></head><body><main><a class="back" href="${en ? '../?lang=en' : '../'}">${en ? '← Back to game' : '← 返回游戏'}</a><h1>${title}</h1><p>${intro}</p><p>${note}</p>${cards}</main><script>document.addEventListener('play',function(e){if(e.target.tagName==='AUDIO')document.querySelectorAll('audio').forEach(function(a){if(a!==e.target)a.pause()})},true);document.addEventListener('visibilitychange',function(){if(document.hidden)document.querySelectorAll('audio').forEach(function(a){a.pause()})});</script></body></html>\n`);
}
console.log('Built CAT/SUN/HELLO mapping and bilingual, per-recording attribution.');
