// Chinese instructions use an explicitly identified Mandarin device voice.
// English word recordings remain on the existing recorded-audio channel.
export const MANDARIN_PROMPTS = {
  common_start: '开始游戏。',
  common_continue: '继续吧。',
  common_correct: '答对啦！',
  common_listen_again: '再听一次。',
  typewriter_return: '这一行打好了，拉一下回车杆吧。',
  typewriter_fix: '先用退格键改一改，再继续。',
  typewriter_done: '电报写好啦！',
};

export function mandarinVoice(voices) {
  const candidates = voices.filter(v => /^(zh(?:[-_](?:CN|SG|Hans)(?:[-_].*)?)?|cmn(?:[-_].*)?)$/i.test(v.lang));
  const score = voice => Number(/CN|Hans/i.test(voice.lang)) * 4 + Number(voice.localService) * 2 + Number(/natural|premium|enhanced|ting.?ting|xiaoxiao|普通话|婷婷/i.test(voice.name));
  return candidates.sort((a, b) => score(b) - score(a))[0] ?? null;
}

export class MandarinPrompts {
  enabled = true;
  utterance = null;
  constructor(synth = globalThis.speechSynthesis, Utterance = globalThis.SpeechSynthesisUtterance) {
    this.synth = synth; this.Utterance = Utterance;
  }
  stop() {
    if (this.utterance) { try { this.synth?.cancel(); } catch { /* Text feedback stays available. */ } }
    this.utterance = null;
  }
  setEnabled(enabled) { this.enabled = enabled; if (!enabled) this.stop(); }
  speak(name) {
    this.stop();
    if (!this.enabled || !MANDARIN_PROMPTS[name] || !this.Utterance || !this.synth) return false;
    try {
      const voice = mandarinVoice(this.synth.getVoices());
      // Never fall back to an English or Cantonese voice for Mandarin text.
      if (!voice) return false;
      const utterance = new this.Utterance(MANDARIN_PROMPTS[name]);
      utterance.voice = voice; utterance.lang = voice.lang;
      utterance.rate = 1; utterance.pitch = 1; utterance.volume = 0.9;
      const clear = () => { if (this.utterance === utterance) this.utterance = null; };
      utterance.onend = clear; utterance.onerror = clear;
      this.utterance = utterance; this.synth.speak(utterance);
      return true;
    } catch { this.utterance = null; return false; }
  }
}
