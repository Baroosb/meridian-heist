// Meridian Heist — guards: waypoint patrols, amber vision cones that turn red on
// detection, and a short chase at the player once they have been spotted.

import { TUNE, angleDiff, coneHit } from './config.js';

export function createGuard(def) {
  return {
    x: def.x,
    y: def.y,
    waypoints: def.waypoints,
    wp: 0,
    dir: 0,
    speed: def.speed,
    name: def.name,
    alert: 0, // seconds left of chasing the player
    seen: false, // the player is inside this guard's cone right now
    radius: 13,
  };
}

/** Does this guard see the player right now (cone + line of sight + smoke)? */
export function guardSees(guard, px, py, floor, sneak, smoke) {
  const range = TUNE.guardRange * (sneak ? TUNE.sneakRangeFactor : 1);
  return coneHit(guard.x, guard.y, guard.dir, TUNE.guardHalfAngle, range, px, py, floor.solids, smoke);
}

/**
 * Move the guard one step: patrol its waypoint loop, or chase the player while
 * alerted. Returns true when the guard sees the player this step.
 */
export function updateGuard(guard, dt, player, floor, smoke) {
  const seen = guardSees(guard, player.x, player.y, floor, player.sneak, smoke);
  guard.seen = seen;
  if (seen) guard.alert = 2.5;
  if (guard.alert > 0) guard.alert -= dt;

  let tx;
  let ty;
  let speed = guard.speed;
  if (guard.alert > 0) {
    tx = player.x;
    ty = player.y;
    speed = TUNE.guardChaseSpeed;
  } else {
    const wp = guard.waypoints[guard.wp];
    tx = wp[0];
    ty = wp[1];
    const d = Math.hypot(tx - guard.x, ty - guard.y);
    if (d < 6) {
      guard.wp = (guard.wp + 1) % guard.waypoints.length;
      const next = guard.waypoints[guard.wp];
      tx = next[0];
      ty = next[1];
    }
  }
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const d = Math.hypot(dx, dy);
  if (d > 0.5) {
    const step = Math.min(d, speed * dt);
    guard.x += (dx / d) * step;
    guard.y += (dy / d) * step;
    guard.dir = Math.atan2(dy, dx);
  }
  return seen;
}
