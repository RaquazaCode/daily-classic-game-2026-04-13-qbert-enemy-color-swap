import { resetState, queueMove, tick, renderStateText } from "../src/game-core.js";

const state = resetState();

const sequence = [
  "ArrowDown", "ArrowDown", "ArrowRight", "ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft",
  "ArrowDown", "ArrowRight", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp"
];

for (const key of sequence) {
  queueMove(state, key);
  tick(state);
  tick(state);
}

for (let i = 0; i < 30; i += 1) {
  tick(state);
}

if (state.score <= 0) {
  throw new Error("self-check failed: score did not increase");
}
if (state.step <= 0) {
  throw new Error("self-check failed: simulation did not advance");
}

console.log("self-check ok");
console.log(renderStateText(state));
