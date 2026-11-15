// The world of NEON RUSH: the ship, everything that falls, and the rules.
// The world advances in fixed STEP seconds. `step` returns a bitmask of events
// so the shell can play sounds and switch screens without reading internals.
import { COLORS, FIELD, LEVELS, LEVEL_COUNT, LIVES, PLAYER, POWER, SCORE, STEP } from './config.js';

export const KIND_CRYSTAL = 'crystal';
export const KIND_METEOR = 'meteor';
export const KIND_SHIELD = 'shield';
export const KIND_MAGNET = 'magnet';
export const KIND_SLOW = 'slow';

export const EVENT_COLLECT = 1;
export const EVENT_HIT = 2;
export const EVENT_POWERUP = 4;
export const EVENT_LEVEL = 8;
export const EVENT_WIN = 16;
export const EVENT_OVER = 32;

const POWER_KINDS = [KIND_SHIELD, KIND_MAGNET, KIND_SLOW];

function makeShip() {
  return {
    x: PLAYER.startX,
    y: PLAYER.startY,
    width: PLAYER.width,
    height: PLAYER.height,
    invulnerable: 0,
    shield: false,
    magnet: 0,
    slow: 0,
    trail: [],
  };
}

export function createWorld(random) {
  const state = {
    ship: makeShip(),
    items: [],
    particles: [],
    floaters: [],
    stars: [],
    score: 0,
    combo: 0,
    comboTimer: 0,
    lives: LIVES,
    level: 1,
    levelCrystals: 0,
    collected: 0,
    missed: 0,
    hits: 0,
    time: 0,
    spawnTimer: 0,
    shake: 0,
    banner: null, // {text, sub, until}
    won: false,
    over: false,
  };

  for (let index = 0; index < 90; index += 1) {
    state.stars.push({
      x: random.range(0, FIELD.width),
      y: random.range(0, FIELD.height),
      size: random.range(1, 2.6),
      speed: random.range(12, 55),
      twinkle: random.range(0, Math.PI * 2),
    });
  }

  function levelSpec() {
    return LEVELS[Math.min(state.level, LEVEL_COUNT) - 1];
  }

  function burst(x, y, color, count, speed) {
    for (let index = 0; index < count; index += 1) {
      const angle = random.range(0, Math.PI * 2);
      const velocity = random.range(speed * 0.3, speed);
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 40,
        life: random.range(0.35, 0.8),
        maxLife: 0.8,
        size: random.range(2, 5),
        color,
      });
    }
  }

  function floater(x, y, text, color) {
    state.floaters.push({ x, y, text, color, life: 0.9, maxLife: 0.9 });
  }

  function spawnItem() {
    const spec = levelSpec();
    const roll = random.next();
    let kind = KIND_CRYSTAL;
    if (roll < POWER.dropChance) kind = random.pick(POWER_KINDS);
    else if (roll < POWER.dropChance + spec.meteors * (1 - POWER.dropChance)) kind = KIND_METEOR;
    const size = kind === KIND_METEOR ? random.range(30, 52) : kind === KIND_CRYSTAL ? random.range(22, 30) : 30;
    state.items.push({
      kind,
      x: random.range(20, FIELD.width - 20 - size),
      y: -size - 8,
      width: size,
      height: size,
      speed: spec.fall * random.range(0.85, 1.25),
      drift: random.range(-28, 28),
      spin: random.range(-1.6, 1.6),
      angle: random.range(0, Math.PI * 2),
      active: true,
      wobble: random.range(0, Math.PI * 2),
    });
  }

  function multiplier() {
    return Math.min(1 + Math.floor(state.combo / SCORE.comboStep), SCORE.comboMax);
  }

  function collectCrystal(item) {
    state.combo += 1;
    state.comboTimer = SCORE.comboWindowSeconds;
    const points = SCORE.crystal * multiplier();
    state.score += points;
    state.collected += 1;
    state.levelCrystals += 1;
    burst(item.x + item.width / 2, item.y + item.height / 2, COLORS.crystal, 14, 220);
    floater(item.x + item.width / 2, item.y, `+${points}`, COLORS.crystal);
    return points;
  }

  function applyPowerup(item) {
    const centreX = item.x + item.width / 2;
    const centreY = item.y + item.height / 2;
    if (item.kind === KIND_SHIELD) {
      state.ship.shield = true;
      floater(centreX, centreY, 'SHIELD!', COLORS.shield);
    } else if (item.kind === KIND_MAGNET) {
      state.ship.magnet = POWER.magnetSeconds;
      floater(centreX, centreY, 'MAGNET!', COLORS.magnet);
    } else {
      state.ship.slow = POWER.slowSeconds;
      floater(centreX, centreY, 'SLOW-MO!', COLORS.slow);
    }
    burst(centreX, centreY, COLORS.gold, 16, 240);
  }

  function hitMeteor(item) {
    state.hits += 1;
    state.combo = 0;
    state.comboTimer = 0;
    const centreX = item.x + item.width / 2;
    const centreY = item.y + item.height / 2;
    burst(centreX, centreY, COLORS.meteor, 26, 320);
    burst(state.ship.x + state.ship.width / 2, state.ship.y + state.ship.height / 2, COLORS.ship, 18, 260);
    state.shake = 0.45;
    if (state.ship.shield) {
      state.ship.shield = false;
      floater(state.ship.x + state.ship.width / 2, state.ship.y - 12, 'SHIELD DOWN', COLORS.shield);
      return EVENT_HIT;
    }
    state.lives -= 1;
    state.ship.invulnerable = PLAYER.invulnerableSeconds;
    floater(state.ship.x + state.ship.width / 2, state.ship.y - 12, '-1 LIFE', COLORS.danger);
    if (state.lives <= 0) {
      state.over = true;
      return EVENT_HIT | EVENT_OVER;
    }
    return EVENT_HIT;
  }

  function overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function levelUp() {
    state.score += SCORE.levelBonus;
    if (state.level >= LEVEL_COUNT) {
      state.score += SCORE.winBonus;
      state.won = true;
      state.banner = { text: 'YOU WIN!', sub: `+${SCORE.levelBonus + SCORE.winBonus} bonus`, until: state.time + 2.5 };
      return EVENT_LEVEL | EVENT_WIN;
    }
    state.level += 1;
    state.levelCrystals = 0;
    state.banner = { text: `LEVEL ${state.level}`, sub: 'Faster. More meteors. Stay sharp.', until: state.time + 2.2 };
    return EVENT_LEVEL;
  }

  return {
    state,
    multiplier,

    reset() {
      state.ship = makeShip();
      state.items = [];
      state.particles = [];
      state.floaters = [];
      state.score = 0;
      state.combo = 0;
      state.comboTimer = 0;
      state.lives = LIVES;
      state.level = 1;
      state.levelCrystals = 0;
      state.collected = 0;
      state.missed = 0;
      state.hits = 0;
      state.time = 0;
      state.spawnTimer = 0.4;
      state.shake = 0;
      state.banner = null;
      state.won = false;
      state.over = false;
    },

    // Advance the world one fixed step. `steer` is [x, y] in -1..1 (keyboard),
    // `pointer` is a canvas point the ship chases, or null. `attract` runs the
    // title-screen demo: items fall but nothing can hurt the ship.
    step(dt, steer, pointer, attract) {
      if (state.over || state.won) return 0;
      let events = 0;
      state.time += dt;
      const ship = state.ship;
      const spec = levelSpec();
      const slowFactor = ship.slow > 0 ? POWER.slowFactor : 1;

      // --- ship movement ---
      const keyboardX = steer[0] * PLAYER.speed * dt;
      const keyboardY = steer[1] * PLAYER.speed * dt;
      ship.x = Math.min(FIELD.width - ship.width, Math.max(0, ship.x + keyboardX));
      ship.y = Math.min(PLAYER.maxY, Math.max(PLAYER.minY, ship.y + keyboardY));
      if (pointer) {
        const targetX = pointer.x - ship.width / 2;
        const targetY = pointer.y - ship.height / 2;
        ship.x += (targetX - ship.x) * Math.min(1, PLAYER.mouseEase * dt);
        ship.y += (targetY - ship.y) * Math.min(1, PLAYER.mouseEase * dt);
        ship.x = Math.min(FIELD.width - ship.width, Math.max(0, ship.x));
        ship.y = Math.min(PLAYER.maxY, Math.max(PLAYER.minY, ship.y));
      }
      ship.trail.push({ x: ship.x + ship.width / 2, y: ship.y + ship.height, life: 0.25 });
      if (ship.trail.length > 14) ship.trail.shift();
      if (ship.invulnerable > 0) ship.invulnerable -= dt;
      if (ship.magnet > 0) ship.magnet -= dt;
      if (ship.slow > 0) ship.slow -= dt;
      if (state.comboTimer > 0) {
        state.comboTimer -= dt;
        if (state.comboTimer <= 0) state.combo = 0;
      }
      if (state.shake > 0) state.shake -= dt;

      // --- spawning ---
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        spawnItem();
        state.spawnTimer = spec.spawnEvery * random.range(0.8, 1.2);
      }

      // --- items fall, drift, and meet the ship ---
      for (const item of state.items) {
        if (!item.active) continue;
        item.y += item.speed * slowFactor * dt;
        item.x += (item.drift + Math.sin(state.time * 2 + item.wobble) * 18) * dt;
        item.angle += item.spin * dt;
        if (ship.magnet > 0 && item.kind === KIND_CRYSTAL) {
          const dx = ship.x + ship.width / 2 - (item.x + item.width / 2);
          const dy = ship.y + ship.height / 2 - (item.y + item.height / 2);
          const distance = Math.hypot(dx, dy);
          if (distance < 260 && distance > 1) {
            item.x += (dx / distance) * 340 * dt;
            item.y += (dy / distance) * 340 * dt;
          }
        }
        if (item.y > FIELD.height + 20) {
          item.active = false;
          if (item.kind === KIND_CRYSTAL) state.missed += 1;
          continue;
        }
        if (attract || ship.invulnerable > 0) continue;
        if (!overlaps(ship, item)) continue;
        item.active = false;
        if (item.kind === KIND_CRYSTAL) {
          collectCrystal(item);
          events |= EVENT_COLLECT;
        } else if (item.kind === KIND_METEOR) {
          events |= hitMeteor(item);
        } else {
          applyPowerup(item);
          events |= EVENT_POWERUP;
        }
        if (state.over || state.won) break;
      }
      state.items = state.items.filter((item) => item.active);

      // --- level clear ---
      if (!state.over && !state.won && state.levelCrystals >= spec.crystals) {
        events |= levelUp();
        if (state.won) return events;
      }

      // --- particles and floaters fade ---
      for (const particle of state.particles) {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 260 * dt;
        particle.life -= dt;
      }
      state.particles = state.particles.filter((particle) => particle.life > 0);
      for (const floaterItem of state.floaters) {
        floaterItem.y -= 46 * dt;
        floaterItem.life -= dt;
      }
      state.floaters = state.floaters.filter((floaterItem) => floaterItem.life > 0);
      for (const star of state.stars) {
        star.y += star.speed * dt;
        star.twinkle += dt * 2;
        if (star.y > FIELD.height) {
          star.y = -2;
          star.x = random.range(0, FIELD.width);
        }
      }
      return events;
    },
  };
}
