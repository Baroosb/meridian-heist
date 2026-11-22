// Meridian Heist — the game itself: state, the loop, floor flow, loot, lasers,
// the alarm, win / fail, and the staged screenshot mode (?shot=hero|vault|title|escape).

import { TUNE, VIEW } from './config.js';
import { createInput } from './input.js';
import { buildFloor } from './bank.js';
import { createGuard, updateGuard } from './guards.js';
import { createCamera, updateCamera, cameraSees } from './cameras.js';
import { laserHitsPlayer, laserSwitchNear } from './lasers.js';
import { createPlayer, updatePlayer } from './player.js';
import { createAlarm, updateAlarm } from './alarm.js';
import {
  createAudio,
  unlockAudio,
  soundGrab,
  soundDiamond,
  soundZap,
  soundAlarmTick,
  soundSwitch,
  soundWin,
  soundFail,
} from './audio.js';
import { drawGame } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function gradeFor(total) {
  if (total >= 60000) return 'S';
  if (total >= 50000) return 'A';
  if (total >= 35000) return 'B';
  return 'C';
}

export function createGame() {
  return {
    screen: 'title',
    floorIndex: 0,
    floor: null,
    guards: [],
    cameras: [],
    player: null,
    alarm: createAlarm(),
    loot: 0,
    timeLeft: TUNE.timeLimitSec,
    now: 0,
    smoke: [],
    laserDisabledUntil: 0,
    laserGraceUntil: 0,
    diamondTaken: false,
    hint: null,
    interT: 0,
    nextFloorName: '',
    ghost: true,
    timeBonus: 0,
    totalScore: 0,
    grade: 'C',
    failReason: '',
    lastAlarmTick: 0,
    shot: null,
    audio: createAudio(),
    input: createInput(canvas),
  };
}

function loadFloor(game, index) {
  game.floorIndex = index;
  game.floor = buildFloor(index);
  game.guards = game.floor.guards.map(createGuard);
  game.cameras = game.floor.cameras.map(createCamera);
  game.player = createPlayer(game.floor.spawn.x, game.floor.spawn.y);
  game.smoke = [];
  game.laserDisabledUntil = 0;
  game.laserGraceUntil = 0;
  game.diamondTaken = game.floor.loot.some((item) => item.kind === 'diamond' && item.taken);
}

function resetRun(game) {
  game.alarm = createAlarm();
  game.loot = 0;
  game.timeLeft = TUNE.timeLimitSec;
  game.now = 0;
  game.diamondTaken = false;
  game.hint = null;
  game.ghost = true;
  loadFloor(game, 0);
}

function setHint(game, text, seconds = 2.5) {
  game.hint = { text, until: game.now + seconds };
}

/** Where the gold arrow points: the diamond, the exit, or the van. */
function objectivePoint(game) {
  const floor = game.floor;
  if (!floor) return null;
  if (floor.index === 2 && !game.diamondTaken) {
    const diamond = floor.loot.find((item) => item.kind === 'diamond');
    if (diamond) return { x: diamond.x, y: diamond.y };
  }
  return { x: floor.exit.x + floor.exit.w / 2, y: floor.exit.y + floor.exit.h / 2 };
}

function winGame(game) {
  game.timeBonus = Math.max(0, Math.round(game.timeLeft)) * TUNE.timeBonusPerSec;
  game.ghost = game.alarm.events === 0;
  game.totalScore = game.loot + (game.ghost ? TUNE.ghostBonus : 0) + game.timeBonus;
  game.grade = gradeFor(game.totalScore);
  game.screen = 'win';
  soundWin(game.audio);
}

function failGame(game, reason) {
  game.failReason = reason;
  game.screen = 'fail';
  soundFail(game.audio);
}

function tryGrab(game) {
  const player = game.player;
  const floor = game.floor;
  for (const item of floor.loot) {
    if (item.taken) continue;
    if (Math.hypot(player.x - item.x, player.y - item.y) > TUNE.lootGrabRadius) continue;
    item.taken = true;
    game.loot += item.value;
    if (item.kind === 'diamond') {
      game.diamondTaken = true;
      soundDiamond(game.audio);
      setHint(game, 'AURORA DIAMOND SECURED — GET TO THE VAN', 3.5);
    } else {
      soundGrab(game.audio);
      setHint(game, 'CASH GRABBED  +$' + item.value.toLocaleString('en-US'), 2);
    }
    return;
  }
  if (laserSwitchNear(floor.laserSwitch, player)) {
    game.laserDisabledUntil = game.now + TUNE.laserDisableSeconds;
    soundSwitch(game.audio);
    setHint(game, 'LASERS DOWN — 5 SECONDS', 2.5);
  }
}

function updatePlay(game, dt) {
  const input = game.input;
  game.timeLeft -= dt;
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    failGame(game, 'OUT OF TIME — THE CREW LEFT WITHOUT YOU');
    return;
  }

  updatePlayer(game.player, dt, input, game.floor);

  let guardSeen = false;
  for (const guard of game.guards) {
    if (updateGuard(guard, dt, game.player, game.floor, game.smoke)) guardSeen = true;
  }
  let cameraSeen = false;
  for (const camera of game.cameras) {
    updateCamera(camera, game.now);
    if (cameraSees(camera, game.player.x, game.player.y, game.floor, game.player.sneak, game.smoke)) {
      cameraSeen = true;
    }
  }

  if (updateAlarm(game.alarm, dt, guardSeen, cameraSeen) === 'lockdown') {
    failGame(game, 'THE ALARM HIT 100 — THE BANK LOCKED DOWN');
    return;
  }
  if (game.alarm.seen && game.now - game.lastAlarmTick > 0.5) {
    game.lastAlarmTick = game.now;
    soundAlarmTick(game.audio);
  }

  // Lasers: one hit per second at most, +25 alarm each.
  for (const beam of game.floor.lasers) {
    if (laserHitsPlayer(beam, game.now, game.player, game.laserDisabledUntil) && game.now > game.laserGraceUntil) {
      game.laserGraceUntil = game.now + 1;
      game.alarm.value = Math.min(100, game.alarm.value + TUNE.alarmLaserHit);
      soundZap(game.audio);
      setHint(game, 'LASER!  +25 ALARM', 2);
      if (game.alarm.value >= 100) {
        failGame(game, 'THE ALARM HIT 100 — THE BANK LOCKED DOWN');
        return;
      }
    }
  }

  if (input.wasPressed('KeyE')) tryGrab(game);
  if (input.wasPressed('KeyQ') && game.player.smoke > 0) {
    game.player.smoke -= 1;
    game.smoke.push({ x: game.player.x, y: game.player.y, r: TUNE.smokeRadius, t: TUNE.smokeSeconds });
    setHint(game, 'SMOKE OUT — CONES CANNOT SEE THROUGH IT', 2);
  }
  game.smoke = game.smoke.filter((s) => {
    s.t -= dt;
    return s.t > 0;
  });

  // The exit: stairs up, the lift up, or the getaway van.
  const e = game.floor.exit;
  const p = game.player;
  const overlaps =
    p.x + p.radius > e.x && p.x - p.radius < e.x + e.w && p.y + p.radius > e.y && p.y - p.radius < e.y + e.h;
  if (overlaps) {
    if (game.floorIndex < 2) {
      game.nextFloorName = buildFloor(game.floorIndex + 1).name;
      game.interT = 1.4;
      game.screen = 'inter';
    } else if (game.diamondTaken) {
      winGame(game);
    } else if (!game.hint || game.now > game.hint.until) {
      setHint(game, 'GRAB THE AURORA DIAMOND FIRST', 2.5);
    }
  }
}

function update(game, dt) {
  const input = game.input;
  if (input.pressed.size > 0 || input.mouse.clicked) unlockAudio(game.audio);

  if (input.wasPressed('KeyM')) game.audio.muted = !game.audio.muted;

  if (game.screen === 'title') {
    game.now += dt;
    if (input.wasPressed('Enter') || input.wasPressed('NumpadEnter') || input.mouse.clicked) {
      resetRun(game);
      game.screen = 'play';
    }
  } else if (game.screen === 'play') {
    game.now += dt;
    if (input.wasPressed('KeyP')) {
      game.screen = 'pause';
    } else {
      updatePlay(game, dt);
    }
  } else if (game.screen === 'pause') {
    if (input.wasPressed('KeyP') || input.wasPressed('Enter')) game.screen = 'play';
  } else if (game.screen === 'inter') {
    game.now += dt;
    game.interT -= dt;
    if (game.interT <= 0) {
      loadFloor(game, game.floorIndex + 1);
      game.screen = 'play';
      setHint(game, game.floor.name + ' — ' + game.floor.objective.toUpperCase(), 3);
    }
  } else if (game.screen === 'win' || game.screen === 'fail') {
    game.now += dt;
    if (input.wasPressed('KeyR')) {
      resetRun(game);
      game.screen = 'play';
    }
  }
  input.endFrame();
}

function main() {
  const game = createGame();
  game.objectivePoint = () => objectivePoint(game);
  // Debug handles (harmless in play): lets a test driver inspect and steer the run.
  game.loadFloor = (index) => loadFloor(game, index);
  game.resetRun = () => resetRun(game);
  window.__meridian = game;
  loadFloor(game, 0);

  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) {
    // Staged screenshot mode: one deterministic frame, no loop.
    stageShot(shot, game);
    drawGame(ctx, game);
    document.title = 'Meridian Heist — ' + shot;
    return;
  }

  let last = performance.now();
  function frame(nowMs) {
    const dt = Math.min(0.05, Math.max(0, (nowMs - last) / 1000));
    last = nowMs;
    update(game, dt);
    drawGame(ctx, game);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

main();
