// Meridian Heist — staged screenshot scenes (?shot=hero|vault|title|escape).
// Each one sets a fixed, deterministic game state and freezes time, so the same
// seed always renders the same frame. Nothing here plays the game forward.

import { TUNE } from './config.js';
import { buildFloor } from './bank.js';
import { createGuard } from './guards.js';
import { createCamera, updateCamera } from './cameras.js';
import { createPlayer } from './player.js';
import { createAlarm } from './alarm.js';

function loadFloorInto(game, index) {
  game.floorIndex = index;
  game.floor = buildFloor(index);
  game.guards = game.floor.guards.map(createGuard);
  game.cameras = game.floor.cameras.map(createCamera);
  game.player = createPlayer(game.floor.spawn.x, game.floor.spawn.y);
  game.smoke = [];
  game.laserDisabledUntil = 0;
  game.laserGraceUntil = 0;
  game.alarm = createAlarm();
  game.loot = 0;
  game.diamondTaken = false;
  game.hint = null;
}

function syncCameras(game) {
  for (const camera of game.cameras) updateCamera(camera, game.now);
}

/**
 * Stage the named scene on `game` (hero, vault, title or escape; anything else
 * is the hero). The render after this call is the screenshot.
 */
export function stageShot(name, game) {
  game.shot = name;
  if (name === 'title') {
    game.screen = 'title';
    game.now = 1.0;
    return;
  }

  if (name === 'vault') {
    // The grab: diamond in hand, lasers live, alarm at 70, red vignette.
    loadFloorInto(game, 2);
    game.screen = 'play';
    game.now = 0.3; // every laser beam is lit at this phase
    game.player.x = 640;
    game.player.y = 278;
    game.player.dir = -Math.PI / 2;
    const diamond = game.floor.loot.find((item) => item.kind === 'diamond');
    diamond.taken = true;
    game.diamondTaken = true;
    game.loot = 51200;
    game.alarm.value = 70;
    game.timeLeft = 132;
    game.guards[0].x = 420;
    game.guards[0].y = 480;
    game.guards[0].dir = -Math.PI / 2;
    game.guards[1].x = 860;
    game.guards[1].y = 480;
    game.guards[1].dir = -Math.PI / 2;
    game.guards[2].x = 1100;
    game.guards[2].y = 320;
    game.guards[2].dir = Math.PI;
    syncCameras(game);
    return;
  }

  if (name === 'escape') {
    // The getaway: Vex at the van, the take tallied, guards converging.
    loadFloorInto(game, 2);
    game.screen = 'play';
    game.now = 2.0;
    const diamond = game.floor.loot.find((item) => item.kind === 'diamond');
    diamond.taken = true;
    game.diamondTaken = true;
    game.loot = 54800;
    game.alarm.value = 45;
    game.timeLeft = 88;
    game.player.x = 640;
    game.player.y = 700;
    game.player.dir = -Math.PI / 2;
    const aim = (guard, tx, ty) => {
      guard.dir = Math.atan2(ty - guard.y, tx - guard.x);
      guard.seen = true;
    };
    game.guards[0].x = 520;
    game.guards[0].y = 600;
    aim(game.guards[0], 640, 700);
    game.guards[1].x = 760;
    game.guards[1].y = 600;
    aim(game.guards[1], 640, 700);
    game.guards[2].x = 1100;
    game.guards[2].y = 640;
    aim(game.guards[2], 640, 700);
    syncCameras(game);
    return;
  }

  // Hero (default): floor 1 mid-crossing — Vex centre-room, two guards with amber
  // cones, a sweeping camera cone, the vault marker glowing, alarm at 35%.
  loadFloorInto(game, 0);
  game.screen = 'play';
  game.now = 1.2;
  game.player.x = 640;
  game.player.y = 480;
  game.player.dir = -Math.PI / 2;
  game.loot = 1200;
  game.alarm.value = 35;
  game.timeLeft = 274;
  game.guards[0].x = 430;
  game.guards[0].y = 340;
  game.guards[0].dir = 0; // east, cone sweeping past Vex (he is just out of range)
  game.guards[1].x = 880;
  game.guards[1].y = 580;
  game.guards[1].dir = Math.PI; // west, cone sweeping past Vex
  game.guards[0].seen = false;
  game.guards[1].seen = false;
  syncCameras(game);
}
