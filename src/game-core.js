export const STEP_MS = 100;
const ROWS = 7;

const DIRECTIONS = {
  ArrowUp: [-1, -1],
  ArrowRight: [-1, 0],
  ArrowLeft: [1, 0],
  ArrowDown: [1, 1]
};

const ENEMY_PATHS = [
  [
    [0, 0], [1, 0], [2, 0], [3, 1], [4, 2], [5, 2], [6, 3], [5, 3], [4, 2], [3, 2], [2, 1], [1, 1]
  ],
  [
    [0, 0], [1, 1], [2, 2], [3, 2], [4, 3], [5, 4], [6, 5], [5, 4], [4, 3], [3, 3], [2, 2], [1, 1]
  ]
];

export function createInitialState() {
  const totalTiles = (ROWS * (ROWS + 1)) / 2;
  return {
    rows: ROWS,
    score: 0,
    lives: 3,
    state: "running",
    painted: new Set(),
    totalTiles,
    player: { r: 0, c: 0 },
    step: 0,
    enemies: [],
    spawnEverySteps: 11,
    nextEnemyPath: 0,
    pendingMove: null,
    lastEvent: "start"
  };
}

export function cloneState(state) {
  return {
    ...state,
    painted: new Set(state.painted),
    player: { ...state.player },
    enemies: state.enemies.map((enemy) => ({ ...enemy }))
  };
}

function tileKey(r, c) {
  return `${r},${c}`;
}

function validTile(r, c, rows) {
  return r >= 0 && r < rows && c >= 0 && c <= r;
}

function paintTile(state, r, c) {
  const key = tileKey(r, c);
  if (!state.painted.has(key)) {
    state.painted.add(key);
    state.score += 25;
    state.lastEvent = "paint";
  }
}

function enqueueEnemy(state) {
  const id = `e${state.step}-${state.enemies.length}`;
  const pathIndex = state.nextEnemyPath % ENEMY_PATHS.length;
  state.nextEnemyPath += 1;
  state.enemies.push({
    id,
    pathIndex,
    stepIndex: 0,
    r: 0,
    c: 0,
    alive: true
  });
}

function movePlayer(state) {
  if (!state.pendingMove) {
    return;
  }
  const [dr, dc] = DIRECTIONS[state.pendingMove] ?? [0, 0];
  state.pendingMove = null;
  const nextR = state.player.r + dr;
  const nextC = state.player.c + dc;
  if (!validTile(nextR, nextC, state.rows)) {
    state.lives -= 1;
    state.player = { r: 0, c: 0 };
    state.lastEvent = "fall";
    if (state.lives <= 0) {
      state.state = "gameover";
    }
    return;
  }
  state.player = { r: nextR, c: nextC };
  paintTile(state, nextR, nextC);
}

function moveEnemies(state) {
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    const path = ENEMY_PATHS[enemy.pathIndex];
    enemy.stepIndex = (enemy.stepIndex + 1) % path.length;
    const [r, c] = path[enemy.stepIndex];
    enemy.r = r;
    enemy.c = c;

    const key = tileKey(r, c);
    if (state.painted.delete(key)) {
      state.lastEvent = "enemy-unpaint";
    }

    if (enemy.r === state.player.r && enemy.c === state.player.c) {
      state.lives -= 1;
      state.player = { r: 0, c: 0 };
      state.lastEvent = "enemy-hit";
      if (state.lives <= 0) {
        state.state = "gameover";
        return;
      }
    }
  }

  state.enemies = state.enemies.filter((enemy) => enemy.alive);
}

function checkWin(state) {
  if (state.painted.size === state.totalTiles) {
    state.score += 500;
    state.state = "won";
    state.lastEvent = "win";
  }
}

export function queueMove(state, key) {
  if (state.state !== "running") {
    return;
  }
  if (DIRECTIONS[key]) {
    state.pendingMove = key;
  }
}

export function tick(state, options = {}) {
  const force = Boolean(options.force);
  if (state.state !== "running" && !force) {
    return state;
  }

  state.step += 1;

  if (state.step % state.spawnEverySteps === 0) {
    enqueueEnemy(state);
  }

  movePlayer(state);
  if (state.state === "gameover") {
    return state;
  }

  moveEnemies(state);
  if (state.state === "gameover") {
    return state;
  }

  checkWin(state);
  return state;
}

export function setStatePaused(state, paused) {
  if (state.state === "running") {
    state.paused = paused;
  }
}

export function resetState() {
  const state = createInitialState();
  paintTile(state, 0, 0);
  return state;
}

export function renderStateText(state) {
  const enemies = state.enemies.map((enemy) => `${enemy.r},${enemy.c}`).join("|") || "none";
  return [
    `state=${state.state}`,
    `score=${state.score}`,
    `lives=${state.lives}`,
    `painted=${state.painted.size}/${state.totalTiles}`,
    `player=${state.player.r},${state.player.c}`,
    `enemies=${enemies}`,
    `step=${state.step}`,
    `event=${state.lastEvent}`
  ].join("\n");
}
