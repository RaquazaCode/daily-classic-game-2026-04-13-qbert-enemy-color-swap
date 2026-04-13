import test from "node:test";
import assert from "node:assert/strict";
import { resetState, queueMove, tick, renderStateText } from "../src/game-core.js";

test("player paint increases score deterministically", () => {
  const state = resetState();
  const baseScore = state.score;
  queueMove(state, "ArrowDown");
  tick(state);
  assert.ok(state.score > baseScore);
  assert.equal(state.player.r, 1);
});

test("falling off board removes a life", () => {
  const state = resetState();
  queueMove(state, "ArrowUp");
  tick(state);
  assert.equal(state.lives, 2);
  assert.equal(state.player.r, 0);
  assert.match(renderStateText(state), /event=fall/);
});

test("enemy spawn schedule is deterministic", () => {
  const state = resetState();
  for (let i = 0; i < 10; i += 1) {
    tick(state);
  }
  assert.equal(state.enemies.length, 0);
  tick(state);
  assert.equal(state.enemies.length, 1);
});
