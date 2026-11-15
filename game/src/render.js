// Everything NEON RUSH paints: the neon field, the ship, the falling items,
// the HUD, and the title / pause / win / game-over screens. All art is drawn
// with canvas paths and gradients — no image files.
import { COLORS, FIELD, LEVELS, LEVEL_COUNT, LIVES } from './config.js';
import { KIND_CRYSTAL, KIND_MAGNET, KIND_METEOR, KIND_SHIELD, KIND_SLOW } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function drawHeart(context, x, y, size, filled) {
  context.save();
  context.translate(x, y);
  context.scale(size / 16, size / 16);
  context.beginPath();
  context.moveTo(8, 14);
  context.bezierCurveTo(0, 8, 0, 2, 4, 2);
  context.bezierCurveTo(6, 2, 8, 4, 8, 6);
  context.bezierCurveTo(8, 4, 10, 2, 12, 2);
  context.bezierCurveTo(16, 2, 16, 8, 8, 14);
  context.closePath();
  context.fillStyle = filled ? '#ff5a6e' : 'rgba(255,90,110,0.22)';
  context.shadowColor = filled ? '#ff5a6e' : 'transparent';
  context.shadowBlur = filled ? 12 : 0;
  context.fill();
  context.restore();
}

function drawCrystal(context, item) {
  const cx = item.x + item.width / 2;
  const cy = item.y + item.height / 2;
  const half = item.width / 2;
  context.save();
  context.translate(cx, cy);
  context.rotate(Math.sin(item.angle * 0.7) * 0.35);
  context.shadowColor = COLORS.crystal;
  context.shadowBlur = 16;
  context.beginPath();
  context.moveTo(0, -half);
  context.lineTo(half * 0.72, 0);
  context.lineTo(0, half);
  context.lineTo(-half * 0.72, 0);
  context.closePath();
  context.fillStyle = COLORS.crystal;
  context.fill();
  context.shadowBlur = 0;
  context.beginPath();
  context.moveTo(0, -half * 0.55);
  context.lineTo(half * 0.38, 0);
  context.lineTo(0, half * 0.55);
  context.lineTo(-half * 0.38, 0);
  context.closePath();
  context.fillStyle = COLORS.crystalCore;
  context.fill();
  context.restore();
}

function drawMeteor(context, item) {
  const cx = item.x + item.width / 2;
  const cy = item.y + item.height / 2;
  const radius = item.width / 2;
  context.save();
  context.translate(cx, cy);
  context.rotate(item.angle);
  context.shadowColor = COLORS.meteor;
  context.shadowBlur = 14;
  context.beginPath();
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const bump = index % 2 === 0 ? radius : radius * 0.78;
    const x = Math.cos(angle) * bump;
    const y = Math.sin(angle) * bump;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.fillStyle = '#a83a22';
  context.fill();
  context.shadowBlur = 0;
  context.beginPath();
  context.arc(-radius * 0.25, -radius * 0.2, radius * 0.3, 0, Math.PI * 2);
  context.fillStyle = COLORS.meteorCore;
  context.fill();
  context.beginPath();
  context.arc(radius * 0.3, radius * 0.28, radius * 0.18, 0, Math.PI * 2);
  context.fillStyle = 'rgba(255,176,60,0.75)';
  context.fill();
  context.restore();
}

function drawPowerup(context, item) {
  const cx = item.x + item.width / 2;
  const cy = item.y + item.height / 2;
  const radius = item.width / 2;
  const color = item.kind === KIND_SHIELD ? COLORS.shield : item.kind === KIND_MAGNET ? COLORS.magnet : COLORS.slow;
  const label = item.kind === KIND_SHIELD ? 'S' : item.kind === KIND_MAGNET ? 'M' : 'T';
  context.save();
  context.translate(cx, cy);
  context.shadowColor = color;
  context.shadowBlur = 16;
  context.beginPath();
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.fillStyle = 'rgba(10,10,32,0.9)';
  context.fill();
  context.lineWidth = 2.5;
  context.strokeStyle = color;
  context.stroke();
  context.shadowBlur = 0;
  context.fillStyle = color;
  context.font = `bold ${Math.round(radius)}px system-ui, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, 0, 1);
  context.restore();
}

function drawShip(context, ship, time) {
  const cx = ship.x + ship.width / 2;
  const cy = ship.y + ship.height / 2;
  // Engine trail.
  for (const puff of ship.trail) {
    const alpha = Math.max(0, puff.life / 0.25) * 0.5;
    context.beginPath();
    context.arc(puff.x, puff.y, 4, 0, Math.PI * 2);
    context.fillStyle = `rgba(56,245,232,${alpha})`;
    context.fill();
  }
  const blink = ship.invulnerable > 0 && Math.floor(time * 12) % 2 === 0;
  context.save();
  context.translate(cx, cy);
  if (blink) context.globalAlpha = 0.35;
  context.shadowColor = COLORS.ship;
  context.shadowBlur = 18;
  context.beginPath();
  context.moveTo(0, -ship.height / 2);
  context.lineTo(ship.width / 2, ship.height / 2);
  context.lineTo(ship.width * 0.18, ship.height * 0.22);
  context.lineTo(-ship.width * 0.18, ship.height * 0.22);
  context.lineTo(-ship.width / 2, ship.height / 2);
  context.closePath();
  context.fillStyle = '#0e7490';
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = COLORS.ship;
  context.stroke();
  context.shadowBlur = 0;
  context.beginPath();
  context.arc(0, -2, 7, 0, Math.PI * 2);
  context.fillStyle = COLORS.shipCore;
  context.fill();
  // Engine flame.
  const flame = 10 + Math.sin(time * 30) * 4;
  context.beginPath();
  context.moveTo(-8, ship.height * 0.3);
  context.lineTo(0, ship.height * 0.3 + flame + 8);
  context.lineTo(8, ship.height * 0.3);
  context.closePath();
  context.fillStyle = '#ffb03c';
  context.fill();
  context.restore();
  if (ship.shield) {
    context.save();
    context.beginPath();
    context.arc(cx, cy, ship.width * 0.72, 0, Math.PI * 2);
    context.strokeStyle = 'rgba(90,162,255,0.85)';
    context.lineWidth = 3;
    context.shadowColor = COLORS.shield;
    context.shadowBlur = 14;
    context.stroke();
    context.restore();
  }
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');

  function drawBackground(state) {
    const gradient = context.createLinearGradient(0, 0, 0, FIELD.height);
    gradient.addColorStop(0, '#0a0a24');
    gradient.addColorStop(0.55, '#0d1030');
    gradient.addColorStop(1, '#050510');
    context.fillStyle = gradient;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    // Nebula blobs.
    context.save();
    context.globalAlpha = 0.16;
    context.fillStyle = '#7b2ff7';
    context.beginPath();
    context.arc(220, 180, 150, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#0ea5b7';
    context.beginPath();
    context.arc(1080, 420, 170, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#ff5a8a';
    context.beginPath();
    context.arc(980, 120, 90, 0, Math.PI * 2);
    context.fill();
    context.restore();
    for (const star of state.stars) {
      const alpha = 0.35 + 0.4 * Math.abs(Math.sin(star.twinkle));
      context.fillStyle = `rgba(234,246,255,${alpha})`;
      context.fillRect(star.x, star.y, star.size, star.size);
    }
    // Ground glow line.
    context.fillStyle = 'rgba(56,245,232,0.14)';
    context.fillRect(0, FIELD.height - 26, FIELD.width, 2);
  }

  function drawItems(state) {
    for (const item of state.items) {
      if (item.kind === KIND_CRYSTAL) drawCrystal(context, item);
      else if (item.kind === KIND_METEOR) drawMeteor(context, item);
      else drawPowerup(context, item);
    }
  }

  function drawParticles(state) {
    for (const particle of state.particles) {
      const alpha = Math.max(0, particle.life / particle.maxLife);
      context.globalAlpha = alpha;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
  }

  function drawFloaters(state) {
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    for (const floater of state.floaters) {
      const alpha = Math.max(0, floater.life / floater.maxLife);
      context.globalAlpha = alpha;
      context.font = 'bold 20px system-ui, sans-serif';
      context.fillStyle = floater.color;
      context.fillText(floater.text, floater.x, floater.y);
    }
    context.globalAlpha = 1;
  }

  function drawHud(state, best) {
    context.save();
    // Top bar.
    context.fillStyle = 'rgba(5,5,16,0.55)';
    context.fillRect(0, 0, FIELD.width, 64);
    context.textBaseline = 'middle';
    context.textAlign = 'left';
    context.fillStyle = COLORS.text;
    context.font = 'bold 26px system-ui, sans-serif';
    context.fillText(`SCORE ${state.score}`, 20, 24);
    context.font = '15px system-ui, sans-serif';
    context.fillStyle = COLORS.dim;
    context.fillText(`BEST ${Math.max(best, state.score)}`, 20, 48);
    // Lives.
    for (let index = 0; index < LIVES; index += 1) {
      drawHeart(context, 330 + index * 30, 30, 22, index < state.lives);
    }
    // Level + progress.
    const spec = LEVELS[Math.min(state.level, LEVEL_COUNT) - 1];
    context.textAlign = 'center';
    context.fillStyle = COLORS.text;
    context.font = 'bold 22px system-ui, sans-serif';
    context.fillText(`LEVEL ${state.level} / ${LEVEL_COUNT}`, FIELD.width / 2, 22);
    const barWidth = 260;
    const barX = FIELD.width / 2 - barWidth / 2;
    context.fillStyle = 'rgba(143,168,200,0.3)';
    roundedRect(context, barX, 38, barWidth, 10, 5);
    context.fill();
    const progress = Math.min(1, state.levelCrystals / spec.crystals);
    context.fillStyle = COLORS.crystal;
    roundedRect(context, barX, 38, barWidth * progress, 10, 5);
    context.fill();
    context.font = '13px system-ui, sans-serif';
    context.fillStyle = COLORS.dim;
    context.fillText(`${state.levelCrystals} / ${spec.crystals} crystals`, FIELD.width / 2, 58);
    // Combo + active powers, right side.
    context.textAlign = 'right';
    if (state.combo >= 2) {
      context.fillStyle = COLORS.gold;
      context.font = 'bold 24px system-ui, sans-serif';
      context.fillText(`COMBO x${Math.min(1 + Math.floor(state.combo / 5), 5)} (${state.combo})`, FIELD.width - 20, 24);
    }
    const powers = [];
    if (state.ship.shield) powers.push('SHIELD');
    if (state.ship.magnet > 0) powers.push(`MAGNET ${Math.ceil(state.ship.magnet)}s`);
    if (state.ship.slow > 0) powers.push(`SLOW ${Math.ceil(state.ship.slow)}s`);
    if (powers.length > 0) {
      context.fillStyle = COLORS.text;
      context.font = '15px system-ui, sans-serif';
      context.fillText(powers.join('  ·  '), FIELD.width - 20, 48);
    }
    context.restore();
  }

  function drawBanner(state) {
    if (!state.banner || state.time > state.banner.until) return;
    const alpha = Math.min(1, (state.banner.until - state.time) * 2);
    context.save();
    context.globalAlpha = alpha;
    context.textAlign = 'center';
    context.fillStyle = COLORS.gold;
    context.font = 'bold 54px system-ui, sans-serif';
    context.shadowColor = COLORS.gold;
    context.shadowBlur = 24;
    context.fillText(state.banner.text, FIELD.width / 2, FIELD.height / 2 - 60);
    context.shadowBlur = 0;
    context.fillStyle = COLORS.text;
    context.font = '22px system-ui, sans-serif';
    context.fillText(state.banner.sub, FIELD.width / 2, FIELD.height / 2 - 16);
    context.restore();
  }

  function drawTitle(state, best) {
    context.save();
    context.fillStyle = 'rgba(5,5,16,0.55)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.textAlign = 'center';
    context.fillStyle = COLORS.crystal;
    context.font = 'bold 84px system-ui, sans-serif';
    context.shadowColor = COLORS.crystal;
    context.shadowBlur = 30;
    context.fillText('NEON RUSH', FIELD.width / 2, 230);
    context.shadowBlur = 0;
    context.fillStyle = COLORS.gold;
    context.font = 'bold 34px system-ui, sans-serif';
    context.fillText('— CRYSTAL RUN —', FIELD.width / 2, 282);
    context.fillStyle = COLORS.text;
    context.font = '22px system-ui, sans-serif';
    context.fillText('Catch the crystals. Dodge the meteors. Clear 3 levels to win.', FIELD.width / 2, 350);
    context.font = '19px system-ui, sans-serif';
    context.fillStyle = COLORS.dim;
    context.fillText('Move: Arrow keys / WASD or mouse  ·  Pause: P  ·  Sound: M', FIELD.width / 2, 392);
    context.fillText('Shield absorbs one hit  ·  Magnet pulls crystals  ·  Slow-mo calms the storm', FIELD.width / 2, 424);
    const pulse = 0.65 + 0.35 * Math.sin(state.time * 4);
    context.globalAlpha = pulse;
    context.fillStyle = COLORS.text;
    context.font = 'bold 26px system-ui, sans-serif';
    context.fillText('PRESS SPACE OR CLICK TO START', FIELD.width / 2, 500);
    context.globalAlpha = 1;
    if (best > 0) {
      context.fillStyle = COLORS.gold;
      context.font = '20px system-ui, sans-serif';
      context.fillText(`BEST SCORE: ${best}`, FIELD.width / 2, 548);
    }
    context.restore();
  }

  function drawPaused() {
    context.save();
    context.fillStyle = 'rgba(5,5,16,0.65)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.textAlign = 'center';
    context.fillStyle = COLORS.text;
    context.font = 'bold 56px system-ui, sans-serif';
    context.fillText('PAUSED', FIELD.width / 2, FIELD.height / 2 - 10);
    context.font = '22px system-ui, sans-serif';
    context.fillStyle = COLORS.dim;
    context.fillText('Press P or Space to keep flying', FIELD.width / 2, FIELD.height / 2 + 38);
    context.restore();
  }

  function drawEnd(state, best, won) {
    context.save();
    context.fillStyle = 'rgba(5,5,16,0.62)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.textAlign = 'center';
    context.fillStyle = won ? COLORS.gold : COLORS.danger;
    context.font = 'bold 72px system-ui, sans-serif';
    context.shadowColor = won ? COLORS.gold : COLORS.danger;
    context.shadowBlur = 26;
    context.fillText(won ? 'YOU WIN!' : 'GAME OVER', FIELD.width / 2, 250);
    context.shadowBlur = 0;
    context.fillStyle = COLORS.text;
    context.font = 'bold 30px system-ui, sans-serif';
    context.fillText(`SCORE  ${state.score}`, FIELD.width / 2, 330);
    context.font = '22px system-ui, sans-serif';
    context.fillStyle = COLORS.dim;
    context.fillText(
      `Crystals ${state.collected}  ·  Meteors hit ${state.hits}  ·  Best ${Math.max(best, state.score)}`,
      FIELD.width / 2,
      376,
    );
    const pulse = 0.65 + 0.35 * Math.sin(state.time * 4);
    context.globalAlpha = pulse;
    context.fillStyle = COLORS.text;
    context.font = 'bold 26px system-ui, sans-serif';
    context.fillText('PRESS SPACE OR CLICK TO PLAY AGAIN', FIELD.width / 2, 452);
    context.globalAlpha = 1;
    context.restore();
  }

  return {
    draw(state, screen, best) {
      context.save();
      if (state.shake > 0) {
        const magnitude = state.shake * 14;
        context.translate((Math.random() - 0.5) * magnitude, (Math.random() - 0.5) * magnitude);
      }
      drawBackground(state);
      drawItems(state);
      drawShip(context, state.ship, state.time);
      drawParticles(state);
      drawFloaters(state);
      context.restore();
      if (screen === SCREEN_TITLE) {
        drawHud(state, best);
        drawTitle(state, best);
      } else if (screen === SCREEN_PLAY) {
        drawHud(state, best);
        drawBanner(state);
      } else if (screen === SCREEN_PAUSED) {
        drawHud(state, best);
        drawPaused();
      } else if (screen === SCREEN_WIN) {
        drawHud(state, best);
        drawEnd(state, best, true);
      } else if (screen === SCREEN_OVER) {
        drawHud(state, best);
        drawEnd(state, best, false);
      }
    },
  };
}
