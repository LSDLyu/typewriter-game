export const english = new URLSearchParams(location.search).get("lang") === "en" || location.pathname.startsWith("/en/");

export const levelCopy = english ? [
  { title: "The first little note", label: "Meet the letters", introduction: "Type two short words. Pull the return lever after each line.", hints: ["Cat · C A T", "Sun · S U N"] },
  { title: "Good morning telegram", label: "Letters and spaces", introduction: "Separate words with a space and send a friendly greeting.", hints: ["Hello · H E L L O", "Good day · mind the space"] },
  { title: "Sentence post", label: "Full sentences", introduction: "Set each sentence neatly. Remember the period at the end.", hints: ["I can type.", "You can too."] },
  { title: "Two-color ribbon", label: "Color challenge", introduction: "Switch ribbons: use red ink for the first line and black for the second.", hints: ["Red rose · switch to red ink", "Blue sky · switch back to black ink"] },
  { title: "A letter to tomorrow", label: "Final mission", introduction: "Type three short lines to finish your letter.", hints: ["Make a wish.", "Keep learning.", "The end."] },
] : null;

const messages = {
  completed: "Completed", locked: "Locked", ready: "Ready",
  levelAria: (number, title, status) => `Level ${number}, ${title}, ${status}`,
  lineProgress: (current, total, color) => `Line ${current} of ${total}${color ? ` · Use ${color} ink` : ""}`,
  red: "red", black: "black", inkNote: (color) => `${color} ink`,
  newPaper: "Fresh paper is ready. Strike the first key.",
  lineReady: "This line is finished. Pull the return lever.",
  fixLine: "This line is not quite right. Use Backspace to fix it.",
  correct: "That's right! Pull the return lever to advance.",
  wrong: (letter, color) => `This position needs ${letter}${color ? ` in ${color} ink` : ""}. Use Backspace to fix it.`,
  strike: "The typebar left its mark. Keep going.",
  backspace: "One step back. Try this letter again.",
  completeSummary: (level, points, errors, last) => `Level ${level} complete · ${points} points · ${errors} mistakes. ${last ? "All five levels finished!" : "The next level is unlocked."}`,
  stars: (count) => `${count} of 3 stars earned`,
  next: "Next level", levels: "Choose a level",
  finishLineFirst: "Finish this line correctly before pulling the lever.",
  telegramDone: "Your paper telegram is ready!",
  nextLine: "The paper moved up one line. Keep typing.",
  ribbonChanged: (color) => `Ribbon switched to ${color} ink.`,
  vibrationUnsupported: "Vibration is not supported by this device or browser",
};

export const msg = english ? messages : null;

export function applyLocale() {
  if (!english) return;
  document.documentElement.lang = "en";
  document.title = "Paper Telegraph Bureau | Typewriter Game | Zide Learning";
  document.querySelector('meta[name="description"]').content = "Play five family-friendly word missions on a vintage typewriter. Type, switch ribbons, and pull the return lever.";
  const set = (selector, value) => { const node = document.querySelector(selector); if (node) node.textContent = value; };
  const label = (selector, value) => { const node = document.querySelector(selector); if (node) node.setAttribute("aria-label", value); };
  set(".skip-link", "Skip to game");
  set(".brand strong", "Zide Learning");
  label(".brand", "Zide Learning home");
  document.querySelector(".brand").href = "https://edu.alading.org/en";
  set(".return-link", "Back to learning games ↗");
  document.querySelector(".return-link").href = "https://edu.alading.org/en/games";
  set(".eyebrow", "LEARNING GAMES / ENGLISH · LETTERS & WORDS");
  set("#page-title", "Paper Telegraph Bureau.");
  set(".intro-copy", "Strike each key to put a message on paper. Switch the ribbon and pull the return lever to fill the page.");
  label(".mission-panel", "Missions and settings");
  set(".panel-index", "MISSION FILES / 01—05");
  set(".target-box span", "TYPE THIS NOW");
  set(".score-row div:first-child span", "Current score");
  set(".score-row div:last-child span", "Mistakes");
  set(".level-list-wrap h3", "Choose a level");
  label("#level-list", "Choose a level");
  set(".how-to summary", "How to play & settings");
  set(".how-to > p", "Type with a physical keyboard or tap the round keys. Use Backspace to correct a mistake. When a line is right, pull the return lever.");
  const settingLabels = document.querySelectorAll(".settings label");
  ["Typing sounds", "Gentle vibration", "Completion animation"].forEach((value, index) => settingLabels[index]?.append(document.createTextNode(" " + value)));
  settingLabels.forEach((item) => { for (const node of [...item.childNodes]) if (node.nodeType === Node.TEXT_NODE && /[\u3400-\u9fff]/.test(node.textContent)) node.remove(); });
  label(".play-area", "Mechanical typewriter");
  label("#return-lever", "Pull the return lever to finish this line and advance");
  document.querySelector("#return-lever").title = "Return lever · Enter";
  set(".paper-heading span:first-child", "Zide Learning · Paper Telegraph Bureau");
  label("#paper-lines", "Text printed on the paper");
  set(".ribbon-controls > span:first-child", "RIBBON COLOR");
  label(".ribbon-switch", "Ribbon color");
  set('[data-ink="black"]', "BLACK");
  set('[data-ink="red"]', "RED");
  label("#keyboard", "On-screen typewriter keyboard");
  set("#backspace-button", "Backspace ⌫");
  set("#return-button", "Pull return lever ↵");
  set("#feedback", "Strike the first key to make the paper speak.");
  set(".keyboard-note", "Use your keyboard on desktop · Tap the keys on mobile · Progress stays in this browser");
  set(".complete-inner > .eyebrow", "TELEGRAM DELIVERED / MISSION COMPLETE");
  set("#complete-title", "Your page is complete!");
  set("#replay-button", "Type it again");
  set("#next-button", "Next level");
  set(".site-footer", "Made by Zide Learning · ChatGPT collaboration and human review · No personal data collected");
}
