// The screenshot scenes behind ?shot=start|play|win|end. Each one plays the real
// rules forward from a fresh world for a fixed number of steps, steered by a
// simple autopilot (keep clear of meteors, chase the lowest crystal) — except
// the end scene, whose pilot chases crystals and never dodges, so it loses —
// and the same seed always gives the same frame.
import { FIELD, PLAYER, STEP } from './config.js';
import { EVENT_OVER, EVENT_WIN, KIND_METEOR } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 30;
const WIN_LIMIT_SECONDS = 600;
const END_LIMIT_SECONDS = 600;
/** The end scene's pilot: a hurried player who chases every crystal and never
 *  looks out for meteors at all, so it is caught out again and again. */
function greedyPilot(state) {
  const ship = state.ship;
  let crystal = null;
  for (const item of state.items) {
    if (item.active && item.kind !== KIND_METEOR && (crystal === null || item.y > crystal.y)) crystal = item;
  }
  if (crystal === null) return [0, 0];
  const centreX = ship.x + ship.width / 2;
  const centreY = ship.y + ship.height / 2;
  return [
    crystal.x + crystal.width / 2 > centreX + 10 ? 1 : crystal.x + crystal.width / 2 < centreX - 10 ? -1 : 0,
    crystal.y + crystal.height / 2 > centreY + 10 ? 1 : crystal.y + crystal.height / 2 < centreY - 10 ? -1 : 0,
  ];
}
/** How far ahead, in seconds, the autopilot checks a move; the win scene looks
 *  far ahead and keeps all its lives. */
const HORIZON_PLAY = 0.8;
const HORIZON_WIN = 0.9;
const SAMPLE = 1 / 30;
/** Extra room, each side, it keeps between the ship and a meteor. */
const MARGIN = 12;

/** Seconds until steering in `direction` ([x, y]) runs the ship into a meteor. */
function timeToHit(state, direction, horizon) {
  const ship = state.ship;
  for (let t = SAMPLE; t <= horizon; t += SAMPLE) {
    const x = Math.min(FIELD.width - ship.width, Math.max(0, ship.x + direction[0] * PLAYER.speed * t));
    const y = Math.min(PLAYER.maxY, Math.max(PLAYER.minY, ship.y + direction[1] * PLAYER.speed * t));
    for (const item of state.items) {
      if (!item.active || item.kind !== KIND_METEOR) continue;
      const itemY = item.y + item.speed * t;
      if (
        itemY + item.height > y &&
        itemY < y + ship.height &&
        item.x < x + ship.width + MARGIN &&
        item.x + item.width > x - MARGIN
      ) {
        return t;
      }
    }
  }
  return Infinity;
}

/** Of the safe moves, the one toward the lowest crystal (or the centre). */
function autopilot(state, horizon) {
  const ship = state.ship;
  let crystal = null;
  for (const item of state.items) {
    if (item.active && item.kind !== KIND_METEOR && (crystal === null || item.y > crystal.y)) crystal = item;
  }
  const targetX = crystal === null ? FIELD.width / 2 : crystal.x + crystal.width / 2;
  const targetY = crystal === null ? ship.y : crystal.y;
  const centreX = ship.x + ship.width / 2;
  const centreY = ship.y + ship.height / 2;
  const wanted = [
    targetX > centreX + 10 ? 1 : targetX < centreX - 10 ? -1 : 0,
    targetY > centreY + 10 ? 1 : targetY < centreY - 10 ? -1 : 0,
  ];
  const candidates = [
    wanted,
    [wanted[0], 0],
    [0, wanted[1]],
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  let best = [0, 0];
  let bestTime = -1;
  for (const direction of candidates) {
    const time = timeToHit(state, direction, horizon);
    if (time > bestTime) {
      bestTime = time;
      best = direction;
    }
    if (time === Infinity && direction === wanted) break;
  }
  return best;
}

/**
 * Set `world` to the named scene (start, play, win or end; any other name is
 * start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'win' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) world.step(STEP, [0, 0], null, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'play' ? PLAY_SECONDS : name === 'win' ? WIN_LIMIT_SECONDS : END_LIMIT_SECONDS;
  const horizon = name === 'play' ? HORIZON_PLAY : HORIZON_WIN;
  let events = 0;
  for (let index = 0; index < limit / STEP; index += 1) {
    const steer = name === 'end' ? greedyPilot(world.state) : autopilot(world.state, horizon);
    events = world.step(STEP, steer, null, false);
    if (events & EVENT_OVER || events & EVENT_WIN) break;
  }
  if (world.state.won) return { screen: SCREEN_WIN, best: world.state.score };
  if (world.state.over) return { screen: SCREEN_OVER, best: world.state.score };
  return { screen: SCREEN_PLAY, best: world.state.score };
}
