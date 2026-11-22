// Meridian Heist — shared constants, palette, geometry helpers and the seeded RNG.
// One file, one job: everything the other modules need to agree on lives here.

export const VIEW = { width: 1280, height: 800 };
export const HUD_H = 64;
/** The playable floor area, inside the border walls. */
export const PLAY = { x: 24, y: HUD_H + 16, w: 1232, h: 696 };

export const COLORS = {
  floorA: '#a8874a',
  floorB: '#96783f',
  floorLine: '#7d5f33',
  carpet: '#6e2b2b',
  carpetEdge: '#c9a24a',
  wall: '#16323a',
  wallTop: '#2b5a5e',
  wallEdge: '#0d2228',
  wood: '#6b4a2a',
  woodTop: '#8a6238',
  pillar: '#1e4046',
  gold: '#f2c14e',
  goldBright: '#ffd76a',
  diamond: '#bff3ff',
  cash: '#5fae5f',
  ink: '#0d1b26',
  panel: 'rgba(10, 24, 34, 0.92)',
  panelSoft: 'rgba(10, 24, 34, 0.78)',
  red: '#ff4a3c',
  green: '#57d977',
  amber: '#ffb020',
  coneGuard: 'rgba(255, 176, 32, 0.30)',
  coneGuardHot: 'rgba(255, 64, 40, 0.38)',
  coneCam: 'rgba(140, 200, 255, 0.26)',
  smoke: 'rgba(200, 200, 205, 0.42)',
};

/** Tuning: movement, senses, alarm, timer. */
export const TUNE = {
  playerRadius: 14,
  walkSpeed: 178,
  sneakSpeed: 102,
  guardSpeed: 62,
  guardChaseSpeed: 118,
  guardRange: 225,
  guardHalfAngle: 0.61, // ~35 degrees
  cameraRange: 265,
  cameraHalfAngle: 0.44, // ~25 degrees
  sneakRangeFactor: 0.68,
  alarmGuardPerSec: 42,
  alarmCameraPerSec: 16,
  alarmDecayPerSec: 8,
  alarmLaserHit: 25,
  timeLimitSec: 360,
  lootGrabRadius: 42,
  smokeCount: 3,
  smokeRadius: 72,
  smokeSeconds: 5,
  coinCount: 3,
  coinThrowRange: 95,
  coinRadius: 280,
  coinSeconds: 4,
  laserDisableSeconds: 5,
  ghostBonus: 5000,
  timeBonusPerSec: 10,
};

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Deterministic RNG (mulberry32) so layouts and screenshots are stable. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Liang-Barsky: does segment (x1,y1)-(x2,y2) touch rect {x,y,w,h}? */
export function segHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i += 1) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

export function segBlocked(x1, y1, x2, y2, solids) {
  for (const s of solids) if (segHitsRect(x1, y1, x2, y2, s)) return true;
  return false;
}

/** Does segment (x1,y1)-(x2,y2) pass through circle (cx,cy,r)? */
export function segHitsCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
  t = clamp(t, 0, 1);
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  return (px - cx) * (px - cx) + (py - cy) * (py - cy) < r * r;
}

/**
 * Is (px,py) inside the vision cone from (ox,oy) facing `dir` with half-angle
 * `half` and range `range`, with a clear line of sight (walls block, smoke blocks)?
 */
export function coneHit(ox, oy, dir, half, range, px, py, solids, smoke) {
  const dx = px - ox;
  const dy = py - oy;
  const d = Math.hypot(dx, dy);
  if (d > range) return false;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), dir)) > half) return false;
  if (segBlocked(ox, oy, px, py, solids)) return false;
  if (smoke) {
    for (const s of smoke) {
      if (segHitsCircle(ox, oy, px, py, s.x, s.y, s.r)) return false;
      if (Math.hypot(px - s.x, py - s.y) < s.r) return false;
    }
  }
  return true;
}

function circleHitsSolids(x, y, r, solids) {
  for (const s of solids) {
    const cx = clamp(x, s.x, s.x + s.w);
    const cy = clamp(y, s.y, s.y + s.h);
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
  }
  return false;
}

/** Move a circle axis by axis, sliding along walls instead of sticking. */
export function moveCircle(x, y, dx, dy, r, solids) {
  let nx = x + dx;
  if (circleHitsSolids(nx, y, r, solids)) nx = x;
  let ny = y + dy;
  if (circleHitsSolids(nx, ny, r, solids)) ny = y;
  return { x: nx, y: ny };
}

/** Distance from point (px,py) to segment (x1,y1)-(x2,y2). */
export function pointSegDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = clamp(t, 0, 1);
  const qx = x1 + t * dx;
  const qy = y1 + t * dy;
  return Math.hypot(px - qx, py - qy);
}
