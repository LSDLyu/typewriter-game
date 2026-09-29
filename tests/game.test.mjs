import assert from "node:assert/strict";
import test from "node:test";
import { LEVELS, backspace, createGame, returnCarriage, score, stars, typeCharacter } from "../public/logic.mjs";

function typeText(game, text, ink = "black") {
  for (const char of text) game = typeCharacter(game, char, ink);
  return game;
}

test("a line advances only after exact typing and a carriage return", () => {
  let game = createGame(0);
  game = typeText(game, "CAT");
  assert.equal(game.phase, "return");
  assert.equal(game.lineIndex, 0);
  game = returnCarriage(game);
  assert.equal(game.lineIndex, 1);
  game = typeText(game, "SUN");
  game = returnCarriage(game);
  assert.equal(game.phase, "complete");
  assert.equal(score(game), 110);
  assert.equal(stars(game), 3);
});

test("incorrect letters require correction and cannot earn repeat points", () => {
  let game = createGame(0);
  game = typeText(game, "CAX");
  assert.equal(game.phase, "typing");
  assert.equal(returnCarriage(game), game);
  game = backspace(game);
  game = typeCharacter(game, "T");
  assert.equal(game.phase, "return");
  assert.equal(game.errors, 1);
  assert.equal(game.corrections, 1);
  assert.equal(score(game), 26);
  game = backspace(game);
  game = typeCharacter(game, "T");
  assert.equal(score(game), 25);
});

test("the ribbon challenge checks ink color as well as letters", () => {
  let game = createGame(3);
  game = typeCharacter(game, "R", "black");
  assert.equal(game.imprints[0].correct, false);
  game = backspace(game);
  game = typeText(game, LEVELS[3].lines[0].text, "red");
  assert.equal(game.phase, "return");
  game = returnCarriage(game);
  game = typeText(game, LEVELS[3].lines[1].text, "black");
  assert.equal(returnCarriage(game).phase, "complete");
});

test("invalid input and locked phases leave the game unchanged", () => {
  let game = createGame(0);
  assert.equal(typeCharacter(game, "1"), game);
  game = typeText(game, "CAT");
  assert.equal(typeCharacter(game, "S"), game);
  assert.equal(typeCharacter(game, "S", "red"), game);
  assert.throws(() => createGame(LEVELS.length), RangeError);
});
