// NEON RUSH — Crystal Run: every tunable number of the game in one place.
// Canvas is 1280x720. The ship flies in the lower two thirds of the field;
// crystals, meteors and power-ups fall from the top.
export const FIELD = { width: 1280, height: 720 };

export const PLAYER = {
  width: 64,
  height: 44,
  speed: 560, // pixels per second, keyboard
  mouseEase: 14, // how fast the ship chases the pointer
  startX: FIELD.width / 2 - 32,
  startY: FIELD.height - 110,
  minY: FIELD.height * 0.32,
  maxY: FIELD.height - 64,
  invulnerableSeconds: 1.2,
};

export const LIVES = 3;

// One level is cleared by collecting this many crystals; three levels win the game.
export const LEVELS = [
  { crystals: 12, fall: 150, spawnEvery: 0.85, meteors: 0.44 },
  { crystals: 14, fall: 205, spawnEvery: 0.68, meteors: 0.54 },
  { crystals: 16, fall: 265, spawnEvery: 0.55, meteors: 0.64 },
];
export const LEVEL_COUNT = LEVELS.length;

export const SCORE = {
  crystal: 10,
  comboStep: 5, // every 5 combo raises the multiplier by 1
  comboMax: 5,
  comboWindowSeconds: 2.5, // collect again within this or the combo resets
  levelBonus: 250,
  winBonus: 500,
};

export const POWER = {
  shieldSeconds: 0, // shield lasts until it absorbs one hit
  magnetSeconds: 6,
  slowSeconds: 5,
  slowFactor: 0.5,
  dropChance: 0.09, // chance a spawn is a power-up instead of a crystal/meteor
};

export const STEP = 1 / 60; // the world advances in fixed 1/60 s steps

export const BEST_KEY = 'neon-rush-best';

export const COLORS = {
  background: '#050510',
  crystal: '#37f5e8',
  crystalCore: '#eafffd',
  meteor: '#ff5a3c',
  meteorCore: '#ffb03c',
  shield: '#5aa2ff',
  magnet: '#c26bff',
  slow: '#7dff6b',
  ship: '#8ef6ff',
  shipCore: '#ffffff',
  text: '#eaf6ff',
  dim: '#8fa8c8',
  danger: '#ff5a6e',
  gold: '#ffd75a',
};
