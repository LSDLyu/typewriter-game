export const LEVELS = [
  {
    title: "第一封小纸条",
    label: "认识字母",
    introduction: "敲出两个短单词。每一行完成后，拉动回车杆换行。",
    lines: [
      { text: "CAT", hint: "猫 · C A T" },
      { text: "SUN", hint: "太阳 · S U N" },
    ],
  },
  {
    title: "早安电报",
    label: "字母与空格",
    introduction: "用空格把单词隔开，给朋友送去问候。",
    lines: [
      { text: "HELLO", hint: "你好 · H E L L O" },
      { text: "GOOD DAY", hint: "美好的一天 · 留意中间的空格" },
    ],
  },
  {
    title: "句子邮差",
    label: "完整句子",
    introduction: "把一句话排整齐，最后别忘了句点。",
    lines: [
      { text: "I CAN TYPE.", hint: "我会打字。" },
      { text: "YOU CAN TOO.", hint: "你也可以。" },
    ],
  },
  {
    title: "双色丝带",
    label: "换色挑战",
    introduction: "切换红黑色带：第一行用红色，第二行用黑色。",
    lines: [
      { text: "RED ROSE", hint: "红玫瑰 · 先把色带切到红色", ink: "red" },
      { text: "BLUE SKY", hint: "蓝天 · 把色带切回黑色", ink: "black" },
    ],
  },
  {
    title: "给未来的信",
    label: "最终任务",
    introduction: "完成三行小短句，让整张信纸成为你的作品。",
    lines: [
      { text: "MAKE A WISH.", hint: "许个愿。" },
      { text: "KEEP LEARNING.", hint: "继续学习。" },
      { text: "THE END.", hint: "写上结尾。" },
    ],
  },
];

export const ALLOWED_CHARACTERS = /^[A-Z .]$/;

export function createGame(levelIndex) {
  if (!Number.isInteger(levelIndex) || levelIndex < 0 || levelIndex >= LEVELS.length) {
    throw new RangeError("Unknown level");
  }
  return {
    levelIndex,
    lineIndex: 0,
    imprints: [],
    completedLines: [],
    errors: 0,
    corrections: 0,
    phase: "typing",
  };
}

export function currentLine(game) {
  return LEVELS[game.levelIndex].lines[game.lineIndex];
}

export function typeCharacter(game, character, ink = "black") {
  const char = character.toUpperCase();
  if (game.phase !== "typing" || !ALLOWED_CHARACTERS.test(char)) return game;
  const line = currentLine(game);
  if (game.imprints.length >= line.text.length) return game;
  const position = game.imprints.length;
  const correct = char === line.text[position] && (!line.ink || ink === line.ink);
  const imprints = [...game.imprints, { char, ink, correct }];
  const ready = imprints.length === line.text.length && imprints.every((item) => item.correct);
  return {
    ...game,
    imprints,
    errors: game.errors + (correct ? 0 : 1),
    phase: ready ? "return" : "typing",
  };
}

export function backspace(game) {
  if (game.phase === "complete" || game.imprints.length === 0) return game;
  return {
    ...game,
    imprints: game.imprints.slice(0, -1),
    corrections: game.corrections + 1,
    phase: "typing",
  };
}

export function returnCarriage(game) {
  if (game.phase !== "return") return game;
  const line = currentLine(game);
  const completedLines = [...game.completedLines, { ...line, imprints: game.imprints }];
  const isLastLine = game.lineIndex === LEVELS[game.levelIndex].lines.length - 1;
  return {
    ...game,
    lineIndex: isLastLine ? game.lineIndex : game.lineIndex + 1,
    completedLines,
    imprints: [],
    phase: isLastLine ? "complete" : "typing",
  };
}

export function score(game) {
  const completed = game.completedLines.reduce((sum, line) => sum + line.text.length, 0);
  const current = game.imprints.filter((item) => item.correct).length;
  return Math.max(0, (completed + current) * 10 - game.errors * 3 - game.corrections + (game.phase === "complete" ? 50 : 0));
}

export function stars(game) {
  const mistakes = game.errors + Math.floor(game.corrections / 2);
  return mistakes === 0 ? 3 : mistakes <= 4 ? 2 : 1;
}
