// Keyboard, mouse and touch input for NEON RUSH.
// Arrow keys / WASD steer the ship; the pointer steers it too (it chases the
// pointer while the mouse is down or moving over the canvas); Space / Enter /
// click confirms on menus; P or Escape pauses; M toggles sound.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;

const KEY_DIRECTION = {
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
};

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let pointer = null; // {x, y} in canvas pixels, or null when idle
  let pointerDown = false;

  function onKeyDown(event) {
    if (event.code in KEY_DIRECTION) {
      keys.add(event.code);
      event.preventDefault();
      return;
    }
    if (event.code === 'Space' || event.code === 'Enter') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyM') {
      actions |= ACTION_MUTE;
    }
  }

  function onKeyUp(event) {
    keys.delete(event.code);
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function onPointerMove(event) {
    pointer = canvasPoint(event);
  }

  function onPointerDown(event) {
    pointer = canvasPoint(event);
    pointerDown = true;
    actions |= ACTION_CONFIRM;
  }

  function onPointerUp() {
    pointerDown = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);

  return {
    // Normalised steering direction from the keys held down, or [0, 0].
    direction() {
      let x = 0;
      let y = 0;
      for (const code of keys) {
        const vector = KEY_DIRECTION[code];
        if (!vector) continue;
        x += vector[0];
        y += vector[1];
      }
      if (x === 0 && y === 0) return [0, 0];
      const length = Math.hypot(x, y);
      return [x / length, y / length];
    },
    // Where the pointer is, or null. The ship chases it while it is down,
    // and glides toward it for a moment after it moves.
    pointer() {
      return pointerDown || pointer ? pointer : null;
    },
    pointerActive() {
      return pointerDown;
    },
    // Actions pressed since the last call; reading them clears them.
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
