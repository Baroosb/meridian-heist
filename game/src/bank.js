// Meridian Heist — the bank itself: three escalating floors, built from one seeded
// layout each. Walls are solid rectangles (they block movement and line of sight);
// guards, cameras, loot, lasers and the exit are placed in open lanes by hand so
// every patrol route is walkable and every cone is readable.

import { PLAY } from './config.js';

const WALL = 16;
const X0 = PLAY.x;
const X1 = PLAY.x + PLAY.w;
const Y0 = PLAY.y;
const Y1 = PLAY.y + PLAY.h;

/** Border walls with a gap (door) in the top and bottom runs. */
function borderWalls(topGaps, bottomGaps) {
  const walls = [
    { x: X0, y: Y0, w: WALL, h: PLAY.h, kind: 'wall' },
    { x: X1 - WALL, y: Y0, w: WALL, h: PLAY.h, kind: 'wall' },
  ];
  for (const [runY, gaps] of [
    [Y0, topGaps],
    [Y1 - WALL, bottomGaps],
  ]) {
    let cursor = X0 + WALL;
    const sorted = [...gaps].sort((a, b) => a.x - b.x);
    for (const gap of sorted) {
      if (gap.x > cursor) walls.push({ x: cursor, y: runY, w: gap.x - cursor, h: WALL, kind: 'wall' });
      cursor = gap.x + gap.w;
    }
    if (cursor < X1 - WALL) walls.push({ x: cursor, y: runY, w: X1 - WALL - cursor, h: WALL, kind: 'wall' });
  }
  return walls;
}

function floorOne() {
  const solids = [
    ...borderWalls([{ x: 1060, w: 100 }], [{ x: 600, w: 80 }]),
    { x: 300, y: 300, w: 280, h: 36, kind: 'counter' },
    { x: 700, y: 300, w: 280, h: 36, kind: 'counter' },
    { x: 180, y: 180, w: 44, h: 44, kind: 'pillar' },
    { x: 1056, y: 180, w: 44, h: 44, kind: 'pillar' },
    { x: 180, y: 560, w: 44, h: 44, kind: 'pillar' },
    { x: 1056, y: 560, w: 44, h: 44, kind: 'pillar' },
    { x: 420, y: 480, w: 120, h: 54, kind: 'desk' },
    { x: 740, y: 480, w: 120, h: 54, kind: 'desk' },
    { x: 120, y: 420, w: 30, h: 30, kind: 'plant' },
    { x: 1130, y: 420, w: 30, h: 30, kind: 'plant' },
  ];
  return {
    index: 0,
    name: 'FLOOR 1 — LOBBY & TELLERS',
    objective: 'Reach the stairwell, top right',
    solids,
    spawn: { x: 640, y: 730 },
    exit: { x: 1060, y: Y0, w: 100, h: 20, label: 'STAIRWELL' },
    van: null,
    guards: [
      { x: 350, y: 180, waypoints: [[350, 180], [950, 180], [950, 250], [350, 250]], speed: 62, name: 'R. KANE' },
      { x: 420, y: 620, waypoints: [[420, 620], [860, 620]], speed: 58, name: 'M. ORTIZ' },
    ],
    cameras: [{ x: 80, y: 110, base: 0.7, sweep: 0.6, period: 6, phase: 0 }],
    loot: [
      { x: 350, y: 250, value: 500, kind: 'cash', taken: false },
      { x: 930, y: 250, value: 500, kind: 'cash', taken: false },
      { x: 640, y: 560, value: 1000, kind: 'cash', taken: false },
    ],
    lasers: [],
    laserSwitch: null,
    lamps: [
      { x: 320, y: 200, r: 190 },
      { x: 960, y: 200, r: 190 },
      { x: 640, y: 600, r: 210 },
      { x: 200, y: 700, r: 150 },
    ],
    carpet: { x: 600, y: 336, w: 80, h: 424 },
  };
}

function floorTwo() {
  const solids = [
    ...borderWalls([{ x: 120, w: 100 }], [{ x: 600, w: 80 }]),
    { x: 300, y: 220, w: 140, h: 60, kind: 'desk' },
    { x: 560, y: 220, w: 140, h: 60, kind: 'desk' },
    { x: 820, y: 220, w: 140, h: 60, kind: 'desk' },
    { x: 300, y: 420, w: 140, h: 60, kind: 'desk' },
    { x: 560, y: 420, w: 140, h: 60, kind: 'desk' },
    { x: 820, y: 420, w: 140, h: 60, kind: 'desk' },
    { x: 420, y: 560, w: 24, h: 110, kind: 'partition' },
    { x: 860, y: 560, w: 24, h: 110, kind: 'partition' },
    { x: 618, y: 500, w: 44, h: 44, kind: 'pillar' },
  ];
  return {
    index: 1,
    name: 'FLOOR 2 — GALLERY & OFFICES',
    objective: 'Reach the vault lift, top left',
    solids,
    spawn: { x: 640, y: 730 },
    exit: { x: 120, y: Y0, w: 100, h: 20, label: 'VAULT LIFT' },
    van: null,
    guards: [
      { x: 300, y: 160, waypoints: [[300, 160], [980, 160]], speed: 66, name: 'D. VOSS' },
      { x: 350, y: 340, waypoints: [[350, 340], [950, 340], [950, 520], [350, 520]], speed: 62, name: 'R. KANE' },
      { x: 1020, y: 480, waypoints: [[1020, 480], [1150, 480], [1150, 700], [1020, 700]], speed: 58, name: 'S. IBARRA' },
    ],
    cameras: [
      { x: 80, y: 110, base: 0.9, sweep: 0.5, period: 5, phase: 0 },
      { x: 1200, y: 110, base: Math.PI - 0.9, sweep: 0.5, period: 7, phase: 2 },
    ],
    loot: [
      { x: 370, y: 180, value: 500, kind: 'cash', taken: false },
      { x: 890, y: 180, value: 500, kind: 'cash', taken: false },
      { x: 640, y: 340, value: 1000, kind: 'cash', taken: false },
      { x: 640, y: 660, value: 500, kind: 'cash', taken: false },
    ],
    lasers: [],
    laserSwitch: null,
    lamps: [
      { x: 320, y: 180, r: 180 },
      { x: 960, y: 180, r: 180 },
      { x: 640, y: 540, r: 200 },
    ],
    carpet: null,
  };
}

function floorThree() {
  const solids = [
    ...borderWalls([], [{ x: 600, w: 80 }]),
    // The vault room: thick walls around the diamond, one guarded door.
    { x: 440, y: 96, w: 16, h: 160, kind: 'vaultwall' },
    { x: 824, y: 96, w: 16, h: 160, kind: 'vaultwall' },
    { x: 456, y: 240, w: 144, h: 16, kind: 'vaultwall' },
    { x: 680, y: 240, w: 144, h: 16, kind: 'vaultwall' },
    { x: 620, y: 150, w: 40, h: 40, kind: 'pedestal' },
    { x: 300, y: 560, w: 120, h: 54, kind: 'desk' },
    { x: 860, y: 560, w: 120, h: 54, kind: 'desk' },
    { x: 180, y: 180, w: 44, h: 44, kind: 'pillar' },
    { x: 1056, y: 180, w: 44, h: 44, kind: 'pillar' },
  ];
  return {
    index: 2,
    name: 'FLOOR 3 — THE VAULT',
    objective: 'Grab the Aurora Diamond, then reach the van',
    solids,
    spawn: { x: 640, y: 730 },
    exit: { x: 600, y: Y1 - WALL, w: 80, h: 16, label: 'GETAWAY VAN' },
    van: { x: 565, y: 730, w: 150, h: 46 },
    guards: [
      { x: 280, y: 480, waypoints: [[280, 480], [1000, 480]], speed: 70, name: 'D. VOSS' },
      { x: 350, y: 640, waypoints: [[350, 640], [930, 640]], speed: 66, name: 'M. ORTIZ' },
      { x: 1100, y: 200, waypoints: [[1100, 200], [1100, 640]], speed: 62, name: 'S. IBARRA' },
    ],
    cameras: [
      { x: 80, y: 110, base: 0.8, sweep: 0.55, period: 5, phase: 1 },
      { x: 1200, y: 110, base: Math.PI - 0.8, sweep: 0.55, period: 6, phase: 3 },
    ],
    loot: [
      { x: 520, y: 170, value: 1000, kind: 'cash', taken: false },
      { x: 760, y: 170, value: 1000, kind: 'cash', taken: false },
      { x: 640, y: 170, value: 50000, kind: 'diamond', taken: false },
      { x: 250, y: 650, value: 500, kind: 'cash', taken: false },
      { x: 1030, y: 650, value: 500, kind: 'cash', taken: false },
    ],
    lasers: [
      { x1: 320, y1: 300, x2: 960, y2: 300, period: 2.2, phase: 0, duty: 0.6 },
      { x1: 320, y1: 340, x2: 960, y2: 340, period: 2.2, phase: 0.5, duty: 0.6 },
      { x1: 320, y1: 380, x2: 960, y2: 380, period: 2.2, phase: 1.0, duty: 0.6 },
      { x1: 420, y1: 300, x2: 420, y2: 520, period: 2.2, phase: 0.2, duty: 0.6 },
      { x1: 860, y1: 300, x2: 860, y2: 520, period: 2.2, phase: 0.9, duty: 0.6 },
    ],
    laserSwitch: { x: 250, y: 500 },
    lamps: [
      { x: 640, y: 300, r: 200 },
      { x: 320, y: 620, r: 170 },
      { x: 960, y: 620, r: 170 },
    ],
    carpet: null,
  };
}

/** Build one floor by index (0, 1 or 2). Deterministic: no randomness at build time. */
export function buildFloor(index) {
  if (index === 1) return floorTwo();
  if (index === 2) return floorThree();
  return floorOne();
}
