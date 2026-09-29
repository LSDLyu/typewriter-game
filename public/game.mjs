import { LEVELS, backspace, createGame, currentLine, returnCarriage, score, stars, typeCharacter } from "./logic.mjs";

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
};
let game = createGame(0);
let ink = "black";
let audioContext;
let hammerTimer;

const $ = (id) => document.getElementById(id);
const machine = $("typewriter");
const feedback = $("feedback");
const dialog = $("complete-dialog");

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

function animateStrike(character) {
  if (settings.motion) {
    machine.classList.remove("strike");
    void machine.offsetWidth;
    machine.classList.add("strike");
    clearTimeout(hammerTimer);
    hammerTimer = setTimeout(() => machine.classList.remove("strike"), 210);
  }
  const key = [...document.querySelectorAll(".key")].find((button) => button.dataset.key === character);
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
    const status = Number.isFinite(progress.best[index]) ? "已完成" : index > progress.unlocked ? "未解锁" : "可开始";
    button.setAttribute("aria-label", `第 ${index + 1} 关，${level.title}，${status}`);
    button.innerHTML = `<span class="level-number">${String(index + 1).padStart(2, "0")}</span><span class="level-name">${level.title}</span><span class="level-status">${status}</span>`;
    button.addEventListener("click", () => startLevel(index));
    list.append(button);
  });
}

function render() {
  const level = LEVELS[game.levelIndex];
  const line = currentLine(game);
  $("level-label").textContent = `${String(game.levelIndex + 1).padStart(2, "0")} / 05 · ${level.label}`;
  $("level-title").textContent = level.title;
  $("level-intro").textContent = level.introduction;
  $("target-text").textContent = line.text;
  $("target-hint").textContent = line.hint;
  $("line-progress").textContent = `第 ${game.lineIndex + 1} 行，共 ${level.lines.length} 行${line.ink ? ` · 本行需用${line.ink === "red" ? "红" : "黑"}墨` : ""}`;
  $("score").textContent = String(score(game));
  $("errors").textContent = String(game.errors);
  $("paper-level").textContent = `${String(game.levelIndex + 1).padStart(2, "0")} / 05`;
  $("return-button").disabled = game.phase !== "return";
  $("ink-note").textContent = `${ink === "red" ? "红" : "黑"}色墨迹`;
  document.querySelectorAll("[data-ink]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.ink === ink)));
  renderPaper();
  renderLevels();
}

function startLevel(index) {
  if (index > progress.unlocked) return;
  game = createGame(index);
  ink = "black";
  if (dialog.open) dialog.close();
  announce("新纸张已放好。开始敲击第一个字母吧。");
  render();
}

function handleCharacter(character) {
  if (dialog.open) return;
  if (game.phase === "return") {
    announce("这一行已经打好，请拉动回车杆。");
    return;
  }
  if (game.phase === "complete") return;
  const before = game;
  game = typeCharacter(game, character, ink);
  if (before === game) {
    if (game.imprints.length >= currentLine(game).text.length) announce("这一行还没有完全正确，先用退格键修正。");
    return;
  }
  const imprint = game.imprints.at(-1);
  animateStrike(imprint.char);
  playSound(imprint.correct ? "key" : "wrong");
  if (!imprint.correct) vibrate([12, 25, 12]);
  if (game.phase === "return") announce("打对了！现在拉动回车杆换行。");
  else if (!imprint.correct) announce(`这里应输入 ${currentLine(game).text[game.imprints.length - 1] === " " ? "空格" : currentLine(game).text[game.imprints.length - 1]}${currentLine(game).ink && ink !== currentLine(game).ink ? `，并切换${currentLine(game).ink === "red" ? "红" : "黑"}墨` : ""}。用退格键修正。`);
  else announce("字锤落下，墨迹留在纸上。继续吧。");
  render();
}

function handleBackspace() {
  if (dialog.open) return;
  const before = game;
  game = backspace(game);
  if (before === game) return;
  playSound("key");
  announce("退回一格，重新敲这个字母。");
  render();
}

function showCompletion() {
  const points = score(game);
  const rating = stars(game);
  progress.best[game.levelIndex] = Math.max(progress.best[game.levelIndex] || 0, points);
  progress.unlocked = Math.max(progress.unlocked, Math.min(LEVELS.length - 1, game.levelIndex + 1));
  saveStorage();
  $("complete-summary").textContent = `第 ${game.levelIndex + 1} 关完成 · ${points} 分 · ${game.errors} 次失误。${game.levelIndex < LEVELS.length - 1 ? "下一关已经解锁。" : "五关都完成了！"}`;
  const starsRow = $("complete-stars");
  starsRow.replaceChildren();
  starsRow.setAttribute("aria-label", `获得 ${rating} 颗星，共 3 颗`);
  for (let index = 0; index < 3; index += 1) {
    const star = document.createElement("span");
    star.className = `star ${index < rating ? "" : "empty"}`;
    starsRow.append(star);
  }
  $("next-button").textContent = game.levelIndex < LEVELS.length - 1 ? "下一关" : "返回关卡";
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
    announce("先把这一行准确打完，再拉回车杆。" );
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
    announce("这封纸上电报写好了！");
    showCompletion();
  } else {
    announce("纸张前进一行。继续打印下一行。" );
  }
}

function buildKeyboard() {
  const keyboard = $("keyboard");
  for (const letters of ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"]) {
    const row = document.createElement("div");
    row.className = "keyboard-row";
    for (const letter of letters) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "key";
      button.dataset.key = letter;
      button.textContent = letter;
      button.setAttribute("aria-label", `输入字母 ${letter}`);
      button.addEventListener("click", () => handleCharacter(letter));
      row.append(button);
    }
    keyboard.append(row);
  }
  const row = document.createElement("div");
  row.className = "keyboard-row";
  for (const [character, label, className] of [[" ", "SPACE · 空格", "wide"], [".", ".", "special"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `key ${className}`;
    button.dataset.key = character;
    button.textContent = label;
    button.setAttribute("aria-label", character === " " ? "输入空格" : "输入句点");
    button.addEventListener("click", () => handleCharacter(character));
    row.append(button);
  }
  keyboard.append(row);
  const bars = $("typebars");
  for (let index = 0; index < 25; index += 1) bars.append(document.createElement("span"));
}

buildKeyboard();
$("return-lever").addEventListener("click", handleReturn);
$("return-button").addEventListener("click", handleReturn);
$("backspace-button").addEventListener("click", handleBackspace);
document.querySelectorAll("[data-ink]").forEach((button) => button.addEventListener("click", () => {
  ink = button.dataset.ink;
  announce(`色带已切到${ink === "red" ? "红" : "黑"}色。`);
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
    input.parentElement.title = "此设备或浏览器不支持震动";
  }
  input.addEventListener("change", () => {
    settings[setting] = input.checked;
    saveStorage();
  });
}

window.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || dialog.open) return;
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) return;
  if ((event.key === "Enter" || event.key === " ") && (target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement || target instanceof HTMLElement && target.tagName === "SUMMARY")) return;
  if (event.key === "Backspace") {
    event.preventDefault();
    handleBackspace();
  } else if (event.key === "Enter") {
    event.preventDefault();
    handleReturn();
  } else if (/^[a-zA-Z .]$/.test(event.key)) {
    event.preventDefault();
    handleCharacter(event.key);
  }
});

render();
