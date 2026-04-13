import { STEP_MS, queueMove, renderStateText, resetState, tick } from "./game-core.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const paintedEl = document.getElementById("painted");
const totalEl = document.getElementById("total");
const stateEl = document.getElementById("state");

let state = resetState();
let paused = false;
let accumulator = 0;
let lastTime = performance.now();

const baseX = canvas.width / 2;
const baseY = 90;
const tileW = 76;
const tileH = 42;

function toScreen(r, c) {
  return {
    x: baseX + (c - r / 2) * tileW,
    y: baseY + r * (tileH * 0.62)
  };
}

function drawDiamond(x, y, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y - tileH / 2);
  ctx.lineTo(x + tileW / 2, y);
  ctx.lineTo(x, y + tileH / 2);
  ctx.lineTo(x - tileW / 2, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = "#1a2236";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function tileKey(r, c) {
  return `${r},${c}`;
}

function drawBoard() {
  for (let r = 0; r < state.rows; r += 1) {
    for (let c = 0; c <= r; c += 1) {
      const { x, y } = toScreen(r, c);
      const painted = state.painted.has(tileKey(r, c));
      drawDiamond(x, y, painted ? "#ffbf4f" : "#5f6f8a");
    }
  }
}

function drawPlayer() {
  const { x, y } = toScreen(state.player.r, state.player.c);
  ctx.fillStyle = "#ff5c4f";
  ctx.beginPath();
  ctx.arc(x, y - 8, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x - 5, y - 10, 3, 0, Math.PI * 2);
  ctx.arc(x + 5, y - 10, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemies() {
  for (const enemy of state.enemies) {
    const { x, y } = toScreen(enemy.r, enemy.c);
    ctx.fillStyle = "#72f0d7";
    ctx.fillRect(x - 10, y - 18, 20, 20);
    ctx.strokeStyle = "#073f3a";
    ctx.strokeRect(x - 10, y - 18, 20, 20);
  }
}

function drawOverlay() {
  if (state.state === "running" && !paused) return;
  ctx.fillStyle = "rgba(7, 10, 15, 0.72)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "700 42px Trebuchet MS";
  const label = state.state === "won" ? "YOU WIN" : state.state === "gameover" ? "GAME OVER" : "PAUSED";
  ctx.fillText(label, canvas.width / 2, canvas.height / 2 - 8);
  ctx.font = "500 18px Trebuchet MS";
  ctx.fillText("Press R to reset", canvas.width / 2, canvas.height / 2 + 28);
}

function updateHud() {
  scoreEl.textContent = String(state.score);
  livesEl.textContent = String(state.lives);
  paintedEl.textContent = String(state.painted.size);
  totalEl.textContent = String(state.totalTiles);
  stateEl.textContent = paused && state.state === "running" ? "paused" : state.state;
}

function frame(now) {
  const delta = now - lastTime;
  lastTime = now;

  if (!paused && state.state === "running") {
    accumulator += delta;
    while (accumulator >= STEP_MS) {
      tick(state);
      accumulator -= STEP_MS;
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  drawEnemies();
  drawPlayer();
  drawOverlay();
  updateHud();
  requestAnimationFrame(frame);
}

function restart() {
  state = resetState();
  paused = false;
  accumulator = 0;
}

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"].includes(event.key)) {
    queueMove(state, event.key);
    event.preventDefault();
    return;
  }

  if (event.key.toLowerCase() === "p" && state.state === "running") {
    paused = !paused;
    return;
  }

  if (event.key.toLowerCase() === "r") {
    restart();
    return;
  }

  if (event.key === "Enter" && state.state !== "running") {
    restart();
  }
});

window.advanceTime = (ms) => {
  const steps = Math.max(0, Math.floor(ms / STEP_MS));
  const wasPaused = paused;
  paused = false;
  for (let i = 0; i < steps; i += 1) {
    tick(state, { force: true });
  }
  paused = wasPaused;
  return renderStateText(state);
};

window.render_game_to_text = () => renderStateText(state);
window.__gameState = () => state;

requestAnimationFrame(frame);
