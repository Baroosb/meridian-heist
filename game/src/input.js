// Meridian Heist — keyboard + mouse input.
// Held keys, edge-triggered action presses, and a click-to-move target in canvas space.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (!event.repeat) pressed.add(event.code);
    keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousemove', (event) => {
    const p = canvasPoint(event);
    mouse.x = p.x;
    mouse.y = p.y;
  });
  canvas.addEventListener('mousedown', (event) => {
    const p = canvasPoint(event);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.clicked = true;
    mouse.clickX = p.x;
    mouse.clickY = p.y;
  });

  return {
    keys,
    pressed,
    mouse,
    /** True while the key is held. */
    down(code) {
      return keys.has(code);
    },
    /** True once, on the frame the key went down; consumed by the caller. */
    wasPressed(code) {
      return pressed.has(code);
    },
    /** Clear edge-triggered presses; call once per frame after reading them. */
    endFrame() {
      pressed.clear();
      mouse.clicked = false;
    },
    /** Normalised WASD / arrow movement vector, or null when no key is held. */
    moveAxis() {
      let x = 0;
      let y = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      if (x === 0 && y === 0) return null;
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len };
    },
    sneak() {
      return keys.has('ShiftLeft') || keys.has('ShiftRight');
    },
  };
}
