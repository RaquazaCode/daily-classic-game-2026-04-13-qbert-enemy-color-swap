# Design

## Core Concept
- Base game: Q*bert.
- Twist: enemies swap target tile colors on collision, forcing recovery routing.

## MVP Scope
- 7-row isometric pyramid of tiles.
- Player hops diagonally with arrow keys.
- Each first land on a tile paints it to target color.
- Enemy pair spawns on fixed intervals and walks deterministic patterns.
- If enemy hits player: lose one life, respawn.
- If enemy lands on a painted tile, it unpaints it.

## Determinism
- Fixed-step simulation (`STEP_MS=100`).
- Enemy spawn and movement schedules are frame-driven.
- No runtime randomness.

## Controls
- Arrow keys: hop diagonally.
- `P`: pause/resume.
- `R`: reset run.
- `Enter` on game-over: restart.

## Hooks
- `window.advanceTime(ms)` advances deterministic simulation steps.
- `window.render_game_to_text()` returns machine-readable state summary.
