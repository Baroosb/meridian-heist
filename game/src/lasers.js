// Meridian Heist — the vault's laser grid: beams that pulse on and off on their own
// phase, plus a wall switch that kills the whole grid for a few seconds.

import { pointSegDist } from './config.js';

export function laserActive(beam, now) {
  return ((now + beam.phase) % beam.period) < beam.period * beam.duty;
}

/** Is the player touching an active beam? (Beams are thin: 10px from the line.) */
export function laserHitsPlayer(beam, now, player, disabledUntil) {
  if (now < disabledUntil) return false;
  if (!laserActive(beam, now)) return false;
  return pointSegDist(player.x, player.y, beam.x1, beam.y1, beam.x2, beam.y2) < 10 + player.radius * 0.4;
}

export function laserSwitchNear(sw, player) {
  if (!sw) return false;
  return Math.hypot(player.x - sw.x, player.y - sw.y) < 46;
}
