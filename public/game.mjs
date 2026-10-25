import { allowsAudio, subscribeAudio } from './site-audio.mjs';
import { targetAudio } from "./target-audio.mjs";
import { targetPictures } from "./target-pictures.mjs";
import { IrisAudio } from "./iris-audio.mjs";
import { MandarinPrompts } from "./mandarin-prompts.mjs";
import { ALLOWED_CHARACTERS, LEVELS, backspace, createGame, currentLine, returnCarriage, score, stars, typeCharacter } from "./logic.mjs?v=20261025-keys";
import { keyboardRows } from './keyboard.mjs';
import { applyLocale, english, levelCopy, msg } from "./locale.mjs?v=20261025-keys";

applyLocale();
document.querySelector(english ? "#lang-en" : "#lang-zh").setAttribute("aria-current", "page");
if (location.hostname === "lsdlyu.github.io") {
  document.querySelector("#lang-zh").href = "./";
  document.querySelector("#lang-en").href = "./?lang=en";
}

const STORAGE_KEY = "zide-typewriter-v1";
const canVibrate = typeof navigator.vibrate === "function";
const stored = readStorage();
const progress = {
  unlocked: Math.min(LEVELS.length - 1, Math.max(0, Number.isInteger(stored.unlocked) ? stored.unlocked : 0)),
  best: Array.isArray(stored.best) ? stored.best.slice(0, LEVELS.length) : [],
};
const settings = {
  sound: stored.settings?.sound !== false,
  vibration: stored.settings?.vibration !== false && canVibrate,
  motion: stored.settings?.motion !== false,
  chineseVoice: stored.settings?.chineseVoice !== false,
  keyboardZoom: stored.settings?.keyboardZoom === true,
};
const mandarin = english ? null : new MandarinPrompts();
mandarin?.setEnabled(settings.chineseVoice);
const voice = new IrisAudio('./iris/', english ? 'en' : 'zh', mandarin);
voice.setEnabled(settings.sound);

function readTarget() { const file = targetAudio[currentLine(game).text]; if (file) voice.say(file); }
document.addEventListener('visibilitychange', () => { if (document.hidden) voice.stop(); });
let game = createGame(0);
let ink = "black";
let audioContext;
subscribeAudio(() => { voice.stop(); if (!allowsAudio('effects')) void audioContext?.suspend(); });
let hammerTimer;
let shiftLatched = false, shiftHeld = false;

const $ = (id) => document.getElementById(id);
const machine = $("typewriter");
const missionMedia = matchMedia('(max-width: 950px)');
$('mission-panel').open = !missionMedia.matches;
missionMedia.addEventListener('change', event => { $('mission-panel').open = !event.matches; });
if (english) document.querySelector('.summary-label').textContent = 'Mission, levels & settings';
const feedback = $("feedback");
const dialog = $("complete-dialog");
const picture = $("target-picture");
const pictureImage = $("target-picture-image");
let picturedTarget;
let pictureUnavailable = false;
function hideUnavailablePicture() {
  pictureUnavailable = true;
  picture.hidden = true;
  picture.closest('.target-box').classList.add('without-picture');
}
pictureImage.addEventListener('error', hideUnavailablePicture);
if (pictureImage.complete && !pictureImage.naturalWidth) hideUnavailablePicture();

function renderPicture(text) {
  if (picturedTarget === text) return;
  picturedTarget = text;
  const scene = targetPictures[text];
  picture.hidden = !scene || pictureUnavailable;
  picture.closest('.target-box').classList.toggle('without-picture', picture.hidden);
  if (!scene) return;
  picture.dataset.target = text;
  pictureImage.style.left = `${-scene.column * 100}%`;
  pictureImage.style.top = `${-scene.row * 100}%`;
  pictureImage.alt = english ? scene.en : scene.zh;
}

function readStorage() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function saveStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...progress, settings }));
  } catch {
    // The game remains playable when private browsing blocks storage.
  }
}

function announce(message) {
  feedback.textContent = message;
}

function playSound(kind) {
  if (!settings.sound) return;
  if (kind === "wrong") { voice.effect("04_gentle_retry", 1500); voice.prompt("typewriter_fix", 12000); return; }
  if (!allowsAudio('effects')) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    audioContext ||= new AudioContextClass();
    if (audioContext.state === "suspended") void audioContext.resume();
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = kind === "return" ? "triangle" : "square";
    oscillator.frequency.setValueAtTime(kind === "return" ? 195 : kind === "wrong" ? 175 : 285 + Math.random() * 45, now);
    oscillator.frequency.exponentialRampToValueAtTime(kind === "return" ? 105 : 120, now + (kind === "return" ? .14 : .055));
    gain.gain.setValueAtTime(.018, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + (kind === "return" ? .18 : .07));
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + (kind === "return" ? .19 : .08));
  } catch {
    // Audio is optional; browser permission or device settings may block it.
  }
}

function vibrate(pattern) {
  if (settings.vibration && canVibrate) navigator.vibrate(pattern);
}

function animateStrike(character, tappedKey) {
  if (settings.motion) {
    machine.classList.remove("strike");
    void machine.offsetWidth;
    machine.classList.add("strike");
    clearTimeout(hammerTimer);
    hammerTimer = setTimeout(() => machine.classList.remove("strike"), 210);
  }
  const keys = [...document.querySelectorAll('.key')];
  const key = tappedKey || keys.find(button => button.dataset.key === character) || keys.find(button => button.dataset.shifted === character);
  if (key) {
    key.classList.add("pressed");
    setTimeout(() => key.classList.remove("pressed"), 110);
  }
}

function makeImprint(item) {
  const span = document.createElement("span");
  span.className = `imprint ${item.ink === "red" ? "red" : ""} ${item.correct ? "" : "wrong"}`;
  span.textContent = item.char === " " ? "\u00a0" : item.char;
  return span;
}

function renderPaper() {
  const paperLines = $("paper-lines");
  paperLines.replaceChildren();
  for (const line of game.completedLines) {
    const row = document.createElement("div");
    row.className = "paper-line printed";
    line.imprints.forEach((item) => row.append(makeImprint(item)));
    paperLines.append(row);
  }
  if (game.phase !== "complete") {
    const row = document.createElement("div");
    row.className = "paper-line current";
    game.imprints.forEach((item) => row.append(makeImprint(item)));
    const caret = document.createElement("span");
    caret.className = "caret";
    caret.setAttribute("aria-hidden", "true");
    row.append(caret);
    paperLines.append(row);
  }
  const blankCount = Math.max(0, LEVELS[game.levelIndex].lines.length - paperLines.children.length);
  for (let index = 0; index < blankCount; index += 1) {
    const blank = document.createElement("div");
    blank.className = "paper-line placeholder";
    blank.textContent = "· · · · · · · ·";
    paperLines.append(blank);
  }
}

function renderLevels() {
  const list = $("level-list");
  list.replaceChildren();
  LEVELS.forEach((level, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "level-button";
    button.disabled = index > progress.unlocked;
    if (index === game.levelIndex) button.setAttribute("aria-current", "step");
    const title = english ? levelCopy[index].title : level.title;
    const status = Number.isFinite(progress.best[index]) ? (msg?.completed || "已完成") : index > progress.unlocked ? (msg?.locked || "未解锁") : (msg?.ready || "可开始");
    button.setAttribute("aria-label", english ? msg.levelAria(index + 1, title, status) : `第 ${index + 1} 关，${title}，${status}`);
    button.innerHTML = `<span class="level-number">${String(index + 1).padStart(2, "0")}</span><span class="level-name"></span><span class="level-status"></span>`;
    button.querySelector(".level-name").textContent = title;
    button.querySelector(".level-status").textContent = status;
    button.addEventListener("click", () => startLevel(index));
    list.append(button);
  });
}

function render() {
  $('mission-summary-level').textContent = (english ? 'Level ' : '第 ') + (game.levelIndex + 1) + (english ? ' / 5' : ' / 5 关');
  const level = LEVELS[game.levelIndex];
  const line = currentLine(game);
  $("level-label").textContent = `${String(game.levelIndex + 1).padStart(2, "0")} / 05 · ${english ? levelCopy[game.levelIndex].label : level.label}`;
  $("level-title").textContent = english ? levelCopy[game.levelIndex].title : level.title;
  $("level-intro").textContent = english ? levelCopy[game.levelIndex].introduction : level.introduction;
  $("target-text").textContent = line.text;
  $("target-hint").textContent = english ? levelCopy[game.levelIndex].hints[game.lineIndex] : line.hint;
  renderPicture(line.text);
  $("line-progress").textContent = english ? msg.lineProgress(game.lineIndex + 1, level.lines.length, line.ink) : `第 ${game.lineIndex + 1} 行，共 ${level.lines.length} 行${line.ink ? ` · 本行需用${line.ink === "red" ? "红" : "黑"}墨` : ""}`;
  $("score").textContent = String(score(game));
  $("errors").textContent = String(game.errors);
  $("paper-level").textContent = `${String(game.levelIndex + 1).padStart(2, "0")} / 05`;
  $("return-button").disabled = game.phase !== "return";
  $("ink-note").textContent = english ? msg.inkNote(ink) : `${ink === "red" ? "红" : "黑"}色墨迹`;
  document.querySelectorAll("[data-ink]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.ink === ink)));
  renderPaper();
  renderLevels();
}

function startLevel(index) {
  if (index > progress.unlocked) return;
  shiftLatched = shiftHeld = false;
  renderShift();
  voice.stop();
  game = createGame(index);
  readTarget();
  ink = "black";
  if (dialog.open) dialog.close();
  announce(msg?.newPaper || "新纸张已放好。开始敲击第一个字母吧。");
  render();
}

function handleCharacter(character, tappedKey) {
  if (dialog.open) return;
  if (game.phase === "return") {
    announce(msg?.lineReady || "这一行已经打好，请拉动回车杆。");
    return;
  }
  if (game.phase === "complete") return;
  const before = game;
  game = typeCharacter(game, character, ink);
  if (before === game) {
    if (game.imprints.length >= currentLine(game).text.length) announce(msg?.fixLine || "这一行还没有完全正确，先用退格键修正。");
    return;
  }
  const imprint = game.imprints.at(-1);
  animateStrike(imprint.char, tappedKey);
  playSound(imprint.correct ? "key" : "wrong");
  if (!imprint.correct) vibrate([12, 25, 12]);
  if (game.phase === "return") { announce(msg?.correct || "打对了！现在拉动回车杆换行。"); voice.prompt("typewriter_return"); }
  else if (!imprint.correct) {
    const expected = currentLine(game).text[game.imprints.length - 1];
    announce(english ? msg.wrong(expected === " " ? "Space" : expected, currentLine(game).ink && ink !== currentLine(game).ink ? currentLine(game).ink : "") : `这里应输入 ${expected === " " ? "空格" : expected}${currentLine(game).ink && ink !== currentLine(game).ink ? `，并切换${currentLine(game).ink === "red" ? "红" : "黑"}墨` : ""}。用退格键修正。`);
  } else announce(msg?.strike || "字锤落下，墨迹留在纸上。继续吧。");
  render();
}

function handleBackspace() {
  if (dialog.open) return;
  const before = game;
  game = backspace(game);
  if (before === game) return;
  playSound("key");
  announce(msg?.backspace || "退回一格，重新敲这个字母。");
  render();
}

function showCompletion() {
  voice.stop(); voice.effect("05_level_complete"); voice.prompt("typewriter_done");
  const points = score(game);
  const rating = stars(game);
  progress.best[game.levelIndex] = Math.max(progress.best[game.levelIndex] || 0, points);
  progress.unlocked = Math.max(progress.unlocked, Math.min(LEVELS.length - 1, game.levelIndex + 1));
  saveStorage();
  $("complete-summary").textContent = english ? msg.completeSummary(game.levelIndex + 1, points, game.errors, game.levelIndex === LEVELS.length - 1) : `第 ${game.levelIndex + 1} 关完成 · ${points} 分 · ${game.errors} 次失误。${game.levelIndex < LEVELS.length - 1 ? "下一关已经解锁。" : "五关都完成了！"}`;
  const starsRow = $("complete-stars");
  starsRow.replaceChildren();
  starsRow.setAttribute("aria-label", english ? msg.stars(rating) : `获得 ${rating} 颗星，共 3 颗`);
  for (let index = 0; index < 3; index += 1) {
    const star = document.createElement("span");
    star.className = `star ${index < rating ? "" : "empty"}`;
    starsRow.append(star);
  }
  $("next-button").textContent = game.levelIndex < LEVELS.length - 1 ? (msg?.next || "下一关") : (msg?.levels || "返回关卡");
  const sparks = $("completion-spark");
  sparks.replaceChildren();
  for (let index = 0; index < 5; index += 1) {
    const ray = document.createElement("span");
    ray.style.setProperty("--i", index);
    sparks.append(ray);
  }
  dialog.classList.toggle("celebrate", settings.motion && !matchMedia("(prefers-reduced-motion: reduce)").matches);
  dialog.showModal();
}

function handleReturn() {
  if (dialog.open) return;
  const before = game;
  game = returnCarriage(game);
  if (before === game) {
    announce(msg?.finishLineFirst || "先把这一行准确打完，再拉回车杆。" );
    return;
  }
  machine.classList.remove("returning");
  if (settings.motion) {
    void machine.offsetWidth;
    machine.classList.add("returning");
    setTimeout(() => machine.classList.remove("returning"), 510);
  }
  playSound("return");
  vibrate([18, 28, 12]);
  render();
  if (game.phase === "complete") {
    announce(msg?.telegramDone || "这封纸上电报写好了！");
    showCompletion();
  } else {
    readTarget();
    announce(msg?.nextLine || "纸张前进一行。继续打印下一行。" );
  }
}

function buildKeyboard() {
  const keyboard = $("keyboard");
  keyboard.addEventListener('focusin', () => document.documentElement.classList.add('typing-focus'));
  keyboard.addEventListener('focusout', event => {
    if (!keyboard.contains(event.relatedTarget)) document.documentElement.classList.remove('typing-focus');
  });
  const actionLabels = english ? { backspace:'Backspace', tab:'Type space · TAB', return:'Finish this line · Return', shift:'Shift · use the upper symbol' } : { backspace:'退格修正', tab:'输入空格 · TAB', return:'完成本行并换行', shift:'换档 · 输入上方符号' };
  for (const [index, keys] of keyboardRows.entries()) {
    const row = document.createElement("div");
    row.className = `keyboard-row keyboard-row-${index}`;
    for (const key of keys) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = 'key' + (key.action ? ' key-control' : '') + (key.shifted ? ' key-symbol' : '');
      const cap = document.createElement('span'); cap.className = 'key-cap'; cap.setAttribute('aria-hidden','true');
      if (key.shifted && key.shifted !== key.key) {
        const upper = document.createElement('span'); upper.className = 'key-upper'; upper.textContent = key.shifted; cap.append(upper);
      }
      const main = document.createElement('span'); main.className = 'key-legend'; main.textContent = key.label || key.key; cap.append(main); button.append(cap);
      if (key.action) {
        button.dataset.action = key.action; button.setAttribute('aria-label',actionLabels[key.action]); button.title = actionLabels[key.action];
        if (key.action === 'shift') button.setAttribute('aria-pressed','false');
        button.addEventListener('click', () => {
          if (dialog.open) return;
          button.classList.add('pressed'); setTimeout(() => button.classList.remove('pressed'),110);
          if (key.action === 'backspace') handleBackspace();
          if (key.action === 'return') handleReturn();
          if (key.action === 'tab') { handleCharacter(' ',button); shiftLatched=false; renderShift(); }
          if (key.action === 'shift') { shiftLatched = !shiftLatched; playSound('key'); renderShift(); }
        });
      } else {
        button.dataset.key = key.key;
        if (key.shifted) button.dataset.shifted = key.shifted;
        button.addEventListener('click', () => {
          handleCharacter((shiftLatched || shiftHeld) && key.shifted ? key.shifted : key.key,button);
          shiftLatched = false; renderShift();
        });
      }
      row.append(button);
    }
    keyboard.append(row);
  }
  const row = document.createElement("div");
  row.className = "keyboard-row space-row";
  for (const [character, label, className] of [[" ", english ? "SPACE" : "SPACE · 空格", "wide"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `key ${className}`;
    button.dataset.key = character;
    const cap = document.createElement('span'); cap.className = 'key-cap'; cap.textContent = label; cap.setAttribute('aria-hidden','true'); button.append(cap);
    button.setAttribute("aria-label", english ? (character === " " ? "Type space" : "Type period") : (character === " " ? "输入空格" : "输入句点"));
    button.addEventListener("click", () => { handleCharacter(character,button); shiftLatched=false; renderShift(); });
    row.append(button);
  }
  keyboard.append(row);
  const bars = $("typebars");
  for (let index = 0; index < 25; index += 1) bars.append(document.createElement("span"));
  renderShift();
}

function renderShift() {
  const shifted = shiftLatched || shiftHeld;
  machine.classList.toggle('shifted',shifted);
  document.querySelectorAll('.key[data-action="shift"]').forEach(button => button.setAttribute('aria-pressed',String(shifted)));
  document.querySelectorAll('.key[data-key]').forEach(button => {
    const char = shifted && button.dataset.shifted ? button.dataset.shifted : button.dataset.key;
    const name = char === ' ' ? (english ? 'Type space' : '输入空格') : char === '.' ? (english ? 'Type period' : '输入句点') : english ? `Type ${/^[A-Z]$/.test(char) ? 'letter ' : ''}${char}` : `输入${/^[A-Z]$/.test(char) ? '字母' : /^[0-9]$/.test(char) ? '数字' : '符号'} ${char}`;
    button.setAttribute('aria-label',name); button.title = name;
  });
}
function renderKeyboardZoom() {
  document.querySelector('.keyboard-shell').classList.toggle('large-keycaps',settings.keyboardZoom);
  $('keyboard-zoom').setAttribute('aria-pressed',String(settings.keyboardZoom));
  $('keyboard-zoom').textContent = settings.keyboardZoom ? (english ? 'Show whole keyboard' : '显示完整键盘') : (english ? 'Enlarge keycaps' : '放大键帽');
  $('keyboard-pan-note').hidden = !settings.keyboardZoom;
}
$('keyboard-zoom').addEventListener('click', () => { settings.keyboardZoom = !settings.keyboardZoom; renderKeyboardZoom(); saveStorage(); });
renderKeyboardZoom();

const listenButton = document.createElement('button');
listenButton.className = 'secondary-button listen-button';
listenButton.type = 'button'; listenButton.textContent = english ? 'Listen to this line' : '听一听这一行';
listenButton.addEventListener('click', () => { if (!allowsAudio('voice')) { announce(english ? 'Turn on voice in the shared sound settings, then listen again.' : '先在页尾声音设置里开启语音、取消静音，再来听一听。'); return; } if (!settings.sound) { settings.sound = true; $('sound-toggle').checked = true; voice.setEnabled(true); saveStorage(); } readTarget(); });
$('target-actions').append(listenButton);
const audioCredit = document.createElement('a');
audioCredit.href = english ? 'audio/credits-en.html' : 'audio/credits.html';
audioCredit.textContent = english ? 'Word audio sources' : '单词录音来源';
audioCredit.className = 'audio-credit';
listenButton.after(audioCredit);
if (!english) {
  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox'; checkbox.id = 'chinese-voice-toggle'; checkbox.checked = settings.chineseVoice;
  label.append(checkbox, ' 普通话提示');
  const note = document.createElement('p'); note.className = 'voice-note';
  note.textContent = '使用设备的普通话音色。没有可用音色时显示文字提示；英文发音使用录音。';
  $('sound-toggle').closest('label').after(label, note);
  checkbox.addEventListener('change', () => {
    settings.chineseVoice = checkbox.checked; mandarin.setEnabled(checkbox.checked); saveStorage();
    if (checkbox.checked && settings.sound) voice.prompt('common_continue');
  });
}
buildKeyboard();
// Keep keyboard focus clear of the sticky word/picture card on small screens.
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(([entry]) => {
    document.querySelector('.play-area').style.setProperty('--target-height', `${entry.target.getBoundingClientRect().height}px`);
  }).observe(document.querySelector('.target-box'));
}
$("return-lever").addEventListener("click", handleReturn);
$("return-button").addEventListener("click", handleReturn);
$("backspace-button").addEventListener("click", handleBackspace);
document.querySelectorAll("[data-ink]").forEach((button) => button.addEventListener("click", () => {
  ink = button.dataset.ink;
  announce(english ? msg.ribbonChanged(ink) : `色带已切到${ink === "red" ? "红" : "黑"}色。`);
  render();
}));
$("replay-button").addEventListener("click", () => startLevel(game.levelIndex));
$("next-button").addEventListener("click", () => {
  if (game.levelIndex === LEVELS.length - 1) dialog.close();
  else startLevel(game.levelIndex + 1);
});

for (const [setting, elementId] of [["sound", "sound-toggle"], ["vibration", "vibration-toggle"], ["motion", "motion-toggle"]]) {
  const input = $(elementId);
  input.checked = settings[setting];
  if (setting === "vibration" && !canVibrate) {
    input.disabled = true;
    input.parentElement.title = msg?.vibrationUnsupported || "此设备或浏览器不支持震动";
  }
  input.addEventListener("change", () => {
    settings[setting] = input.checked;
    if (setting === "sound") { voice.setEnabled(input.checked); if (input.checked) readTarget(); }
    saveStorage();
  });
}

window.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || dialog.open) return;
  // Shadow DOM retargets header/footer events to their host. Inspect the full
  // path so native links, controls and editable fields retain keyboard access.
  const path = event.composedPath();
  if (event.defaultPrevented || path.some(target => target instanceof HTMLElement && (target.matches('input, textarea, select') || target.isContentEditable))) return;
  if (event.key === 'Shift') { shiftHeld = true; renderShift(); return; }
  if ((event.key === "Enter" || event.key === " ") && path.some(target => target instanceof HTMLElement && target.matches('button, a, summary, [role="button"]'))) return;
  if (event.key === "Backspace") {
    event.preventDefault();
    handleBackspace();
  } else if (event.key === "Enter") {
    event.preventDefault();
    handleReturn();
  } else if (ALLOWED_CHARACTERS.test(event.key.toUpperCase())) {
    event.preventDefault();
    handleCharacter(event.key);
  }
});
window.addEventListener('keyup',event => { if (event.key === 'Shift') { shiftHeld=false; renderShift(); } });
window.addEventListener('blur',() => { shiftHeld=shiftLatched=false; renderShift(); });

render();
