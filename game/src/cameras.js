// Meridian Heist — CCTV cameras: fixed mounts that sweep a pale-blue cone back and
// forth. Being caught in one fills the alarm slower than a guard's eyes do.

import { TUNE, coneHit } from './config.js';

export function createCamera(def) {
  return {
    x: def.x,
    y: def.y,
    base: def.base,
    sweep: def.sweep,
    period: def.period,
    phase: def.phase,
    angle: def.base,
    seen: false,
  };
}

/** Advance the sweep to time `now` (seconds) and return the current angle. */
export function updateCamera(camera, now) {
  camera.angle = camera.base + Math.sin((now * Math.PI * 2) / camera.period + camera.phase) * camera.sweep;
  return camera.angle;
}

/** Is the player inside this camera's sweeping cone right now? */
export function cameraSees(camera, px, py, floor, sneak, smoke) {
  const range = TUNE.cameraRange * (sneak ? TUNE.sneakRangeFactor : 1);
  const seen = coneHit(camera.x, camera.y, camera.angle, TUNE.cameraHalfAngle, range, px, py, floor.solids, smoke);
  camera.seen = seen;
  return seen;
}
