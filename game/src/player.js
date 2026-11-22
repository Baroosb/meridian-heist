// Meridian Heist — Vex, the thief: WASD / arrow movement, Shift to sneak, and
// click-to-move for the mouse. Walls stop the player; furniture is solid cover.

import { TUNE, moveCircle } from './config.js';

export function createPlayer(x, y) {
  return {
    x,
    y,
    radius: TUNE.playerRadius,
    dir: -Math.PI / 2, // facing up, toward the vault
    sneak: false,
    moving: false,
    clickTarget: null, // {x, y} set by a mouse click, cleared by keys or arrival
    smoke: TUNE.smokeCount,
  };
}

/** Move the player one step; returns the distance actually travelled. */
export function updatePlayer(player, dt, input, floor) {
  const axis = input.moveAxis();
  player.sneak = input.sneak();
  let mx = 0;
  let my = 0;
  if (axis) {
    mx = axis.x;
    my = axis.y;
    player.clickTarget = null;
  } else if (player.clickTarget) {
    const dx = player.clickTarget.x - player.x;
    const dy = player.clickTarget.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) {
      player.clickTarget = null;
    } else {
      mx = dx / d;
      my = dy / d;
    }
  }
  if (input.mouse.clicked) {
    player.clickTarget = { x: input.mouse.clickX, y: input.mouse.clickY };
    const dx = player.clickTarget.x - player.x;
    const dy = player.clickTarget.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d >= 8) {
      mx = dx / d;
      my = dy / d;
    }
  }
  const speed = player.sneak ? TUNE.sneakSpeed : TUNE.walkSpeed;
  const moved = moveCircle(player.x, player.y, mx * speed * dt, my * speed * dt, player.radius, floor.solids);
  const travelled = Math.hypot(moved.x - player.x, moved.y - player.y);
  player.x = moved.x;
  player.y = moved.y;
  player.moving = travelled > 0.1;
  if (mx !== 0 || my !== 0) player.dir = Math.atan2(my, mx);
  return travelled;
}
