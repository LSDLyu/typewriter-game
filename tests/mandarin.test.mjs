import test from 'node:test';
import assert from 'node:assert/strict';
import { MandarinPrompts, mandarinVoice } from '../public/mandarin-prompts.mjs';
import { IrisAudio } from '../public/iris-audio.mjs';

test('Chinese instructions require a Mandarin voice, never a default English or Cantonese voice', () => {
  const en={lang:'en-US',name:'English'}, yue={lang:'zh-HK',name:'Cantonese'}, zh={lang:'zh-CN',name:'Tingting',localService:true};
  assert.equal(mandarinVoice([en,yue]),null);
  assert.equal(mandarinVoice([en,yue,zh]),zh);
  const spoken=[];
  const synth={getVoices:()=>[en,yue],speak:u=>spoken.push(u),cancel(){}};
  const speaker=new MandarinPrompts(synth,class { constructor(text){this.text=text;} });
  assert.equal(speaker.speak('typewriter_fix'),false); assert.equal(spoken.length,0);
  synth.getVoices=()=>[en,zh];
  assert.equal(speaker.speak('typewriter_fix'),true);
  assert.equal(spoken[0].voice,zh); assert.equal(spoken[0].lang,'zh-CN');
  assert.equal(spoken[0].text,'先用退格键改一改，再继续。');
  assert.equal(spoken[0].rate,1);
});

test('Chinese prompts share cancellation with recordings, honor cooldown and have their own switch', () => {
  const spoken=[],recordings=[];let cancelled=0;
  const speaker=new MandarinPrompts({getVoices:()=>[{lang:'zh-CN',name:'Mandarin'}],speak:u=>spoken.push(u),cancel(){cancelled++;}},class {constructor(text){this.text=text;}});
  const original=globalThis.Audio;
  globalThis.Audio=class {constructor(src){this.src=src;recordings.push(this);} play(){return Promise.resolve();} pause(){this.paused=true;}};
  try {
    const audio=new IrisAudio('./iris/','zh',speaker);
    audio.prompt('typewriter_fix',12000); audio.prompt('typewriter_fix',12000);
    assert.equal(spoken.length,1); assert.equal(recordings.length,0);
    audio.say('../audio/cat.mp3'); assert.equal(cancelled,1); assert.equal(recordings[0].src,'./iris/../audio/cat.mp3');
    audio.prompt('typewriter_return'); assert.equal(recordings[0].paused,true);
    audio.setEnabled(false); assert.equal(cancelled,2); audio.prompt('typewriter_done');assert.equal(spoken.length,2);
    audio.setEnabled(true);speaker.setEnabled(false);audio.prompt('typewriter_done');assert.equal(spoken.length,2);
    audio.say('../audio/sun.mp3');assert.equal(recordings.length,2);
  } finally {globalThis.Audio=original;}
});

test('unavailable or blocked speech leaves text feedback usable without throwing', () => {
  const s=new MandarinPrompts({getVoices(){throw Error('unavailable');}},class {});
  assert.equal(s.speak('typewriter_fix'),false);
  assert.doesNotThrow(()=>s.stop());
});
