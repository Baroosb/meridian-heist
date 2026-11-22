// Meridian Heist — everything the eye sees: the brass-marble bank floor, teal walls,
// lamp pools, amber guard cones and pale-blue camera cones, lasers, loot, Vex,
// the getaway van, and the title / win / fail posters. One canvas, no images.

import { COLORS, HUD_H, PLAY, TUNE, VIEW, mulberry32 } from './config.js';
import { laserActive } from './lasers.js';
import { drawHUD, drawHint } from './hud.js';

/** Deterministic marble speckles, fixed once so every frame (and screenshot) matches. */
const SPECKLES = (() => {
  const rng = mulberry32(99);
  const dots = [];
  for (let i = 0; i < 320; i += 1) {
    dots.push({
      x: PLAY.x + rng() * PLAY.w,
      y: PLAY.y + rng() * PLAY.h,
      r: 0.8 + rng() * 1.8,
      light: rng() > 0.5,
    });
  }
  return dots;
})();

function money(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function drawFloor(ctx, floor) {
  ctx.fillStyle = COLORS.floorA;
  ctx.fillRect(PLAY.x, PLAY.y, PLAY.w, PLAY.h);
  // Marble tiles, 64px, alternating shades.
  for (let ty = 0; ty < PLAY.h / 64; ty += 1) {
    for (let tx = 0; tx < PLAY.w / 64; tx += 1) {
      if ((tx + ty) % 2 === 0) {
        ctx.fillStyle = COLORS.floorB;
        ctx.fillRect(PLAY.x + tx * 64, PLAY.y + ty * 64, 64, 64);
      }
    }
  }
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = PLAY.x; x <= PLAY.x + PLAY.w; x += 64) {
    ctx.moveTo(x + 0.5, PLAY.y);
    ctx.lineTo(x + 0.5, PLAY.y + PLAY.h);
  }
  for (let y = PLAY.y; y <= PLAY.y + PLAY.h; y += 64) {
    ctx.moveTo(PLAY.x, y + 0.5);
    ctx.lineTo(PLAY.x + PLAY.w, y + 0.5);
  }
  ctx.stroke();
  for (const d of SPECKLES) {
    ctx.fillStyle = d.light ? 'rgba(255, 230, 170, 0.10)' : 'rgba(60, 40, 10, 0.12)';
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }
  if (floor.carpet) {
    const c = floor.carpet;
    ctx.fillStyle = COLORS.carpet;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = COLORS.carpetEdge;
    ctx.lineWidth = 3;
    ctx.strokeRect(c.x + 1.5, c.y + 1.5, c.w - 3, c.h - 3);
  }
  // Pools of warm lamp light.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const lamp of floor.lamps) {
    const g = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, lamp.r);
    g.addColorStop(0, 'rgba(255, 214, 130, 0.20)');
    g.addColorStop(1, 'rgba(255, 214, 130, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSolid(ctx, s) {
  ctx.save();
  if (s.kind === 'wall' || s.kind === 'vaultwall') {
    ctx.fillStyle = s.kind === 'vaultwall' ? '#3a2f14' : COLORS.wall;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = s.kind === 'vaultwall' ? COLORS.gold : COLORS.wallTop;
    if (s.h <= 20) ctx.fillRect(s.x, s.y, s.w, 3);
    else ctx.fillRect(s.x, s.y, 3, s.h);
    ctx.strokeStyle = COLORS.wallEdge;
    ctx.lineWidth = 1;
    ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
  } else if (s.kind === 'counter') {
    ctx.fillStyle = COLORS.wood;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = COLORS.woodTop;
    ctx.fillRect(s.x, s.y, s.w, 8);
    ctx.strokeStyle = '#3d2a16';
    ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
  } else if (s.kind === 'desk') {
    ctx.fillStyle = '#4a3a28';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = '#7a5c38';
    ctx.fillRect(s.x + 6, s.y + 6, s.w - 12, s.h - 12);
    ctx.fillStyle = '#2c2114';
    ctx.fillRect(s.x + s.w / 2 - 14, s.y + s.h / 2 - 10, 28, 20);
  } else if (s.kind === 'pillar') {
    ctx.fillStyle = COLORS.pillar;
    ctx.beginPath();
    ctx.arc(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x + s.w / 2, s.y + s.h / 2, s.w / 2 - 3, 0, Math.PI * 2);
    ctx.stroke();
  } else if (s.kind === 'plant') {
    ctx.fillStyle = '#7a4a26';
    ctx.fillRect(s.x, s.y + s.h - 12, s.w, 12);
    ctx.fillStyle = '#3f7a3a';
    ctx.beginPath();
    ctx.arc(s.x + s.w / 2, s.y + 10, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#57a04e';
    ctx.beginPath();
    ctx.arc(s.x + s.w / 2 - 5, s.y + 6, 7, 0, Math.PI * 2);
    ctx.fill();
  } else if (s.kind === 'partition') {
    ctx.fillStyle = '#24343c';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(s.x, s.y, s.w, 4);
  } else if (s.kind === 'pedestal') {
    ctx.fillStyle = '#d8d2c2';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.strokeRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
  }
  ctx.restore();
}

function drawCone(ctx, x, y, dir, half, range, fill) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, dir - half, dir + half);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = fill.replace(/[\d.]+\)$/, '0.55)');
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, dir - half, dir + half);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawGuard(ctx, guard, now) {
  ctx.save();
  ctx.translate(guard.x, guard.y);
  // Body: dark uniform, gold-trimmed cap.
  ctx.fillStyle = '#27364f';
  ctx.beginPath();
  ctx.arc(0, 0, guard.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = guard.seen ? COLORS.red : COLORS.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#1a2636';
  ctx.beginPath();
  ctx.arc(Math.cos(guard.dir) * 4, Math.sin(guard.dir) * 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(guard.dir) * (guard.radius + 7), Math.sin(guard.dir) * (guard.radius + 7));
  ctx.stroke();
  // Name tag.
  ctx.rotate(0);
  ctx.fillStyle = guard.seen ? COLORS.red : '#c8d4de';
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(guard.name, 0, -guard.radius - 6);
  if (guard.seen) {
    ctx.fillStyle = COLORS.red;
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText('!', 0, guard.radius + 14);
  }
  ctx.restore();
}

function drawCamera(ctx, camera) {
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.rotate(camera.angle);
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(-4, -6, 18, 12);
  ctx.fillStyle = camera.seen ? COLORS.red : '#8fc8ff';
  ctx.beginPath();
  ctx.arc(14, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = '#c8d4de';
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CCTV', camera.x, camera.y - 14);
  ctx.restore();
}

function drawLoot(ctx, item, now) {
  if (item.taken) return;
  ctx.save();
  ctx.translate(item.x, item.y);
  if (item.kind === 'diamond') {
    const pulse = 1 + Math.sin(now * 3) * 0.12;
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 34 * pulse);
    glow.addColorStop(0, 'rgba(191, 243, 255, 0.85)');
    glow.addColorStop(1, 'rgba(191, 243, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 34 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = COLORS.diamond;
    ctx.fillRect(-11, -11, 22, 22);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-11, -11, 22, 22);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(-6, 0);
    ctx.moveTo(16, 0);
    ctx.lineTo(6, 0);
    ctx.moveTo(0, -16);
    ctx.lineTo(0, -6);
    ctx.moveTo(0, 16);
    ctx.lineTo(0, 6);
    ctx.stroke();
    ctx.fillStyle = '#0d2b3a';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AURORA DIAMOND', 0, -30);
  } else {
    ctx.fillStyle = '#2e6b34';
    ctx.fillRect(-13, -9, 26, 18);
    ctx.fillStyle = '#7ed07e';
    ctx.fillRect(-10, -6, 20, 12);
    ctx.fillStyle = '#1d4a22';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', 0, 4);
    ctx.fillStyle = COLORS.goldBright;
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('$' + item.value.toLocaleString('en-US'), 0, -14);
  }
  ctx.restore();
}

function drawLaser(ctx, beam, now, disabledUntil) {
  const disabled = now < disabledUntil;
  const on = !disabled && laserActive(beam, now);
  ctx.save();
  ctx.strokeStyle = disabled ? 'rgba(120, 130, 130, 0.5)' : on ? 'rgba(255, 60, 50, 0.95)' : 'rgba(255, 120, 110, 0.22)';
  ctx.lineWidth = on ? 3 : 1.5;
  if (on) {
    ctx.shadowColor = '#ff3c32';
    ctx.shadowBlur = 12;
  }
  if (!on) ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(beam.x1, beam.y1);
  ctx.lineTo(beam.x2, beam.y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;
  // Emitters at both ends.
  ctx.fillStyle = disabled ? '#5a6666' : '#3a1a1a';
  ctx.fillRect(beam.x1 - 5, beam.y1 - 5, 10, 10);
  ctx.fillRect(beam.x2 - 5, beam.y2 - 5, 10, 10);
  ctx.fillStyle = on ? '#ff3c32' : '#7a4a44';
  ctx.beginPath();
  ctx.arc(beam.x1, beam.y1, 3, 0, Math.PI * 2);
  ctx.arc(beam.x2, beam.y2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer(ctx, player, game) {
  ctx.save();
  ctx.translate(player.x, player.y);
  // Sneak = crouched, smaller and dimmer.
  const r = player.sneak ? player.radius - 2 : player.radius;
  ctx.fillStyle = '#1d2b4a';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.strokeStyle = '#e8e2d2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(player.dir) * (r + 6), Math.sin(player.dir) * (r + 6));
  ctx.stroke();
  ctx.fillStyle = COLORS.goldBright;
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VEX', 0, -r - 7);
  if (game.shot === 'vault') {
    // The diamond, in hand, glowing.
    const glow = ctx.createRadialGradient(10, -10, 1, 10, -10, 26);
    glow.addColorStop(0, 'rgba(191, 243, 255, 0.9)');
    glow.addColorStop(1, 'rgba(191, 243, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(10, -10, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(10, -10);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = COLORS.diamond;
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
  }
  ctx.restore();
}

function drawExit(ctx, game) {
  const { floor } = game;
  const e = floor.exit;
  ctx.save();
  const pulse = 0.55 + Math.sin(game.now * 2.5) * 0.25;
  // The gold bar in the doorway itself.
  ctx.fillStyle = `rgba(242, 193, 78, ${pulse})`;
  ctx.fillRect(e.x, e.y - 6, e.w, 10);
  if (!floor.van) {
    // Pulsing ring + label inside the room, below the door.
    const ox = e.x + e.w / 2;
    const oy = e.y + 30;
    ctx.strokeStyle = `rgba(255, 215, 106, ${pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ox, oy, 26 + Math.sin(game.now * 2.5) * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#0d1b26';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(e.label, ox, e.y + 56);
  }
  ctx.restore();
}

/** The getaway van, parked at the bottom door — drawn after the walls so it reads. */
function drawVan(ctx, game) {
  const v = game.floor.van;
  if (!v) return;
  const e = game.floor.exit;
  ctx.save();
  ctx.fillStyle = '#c8a24a';
  ctx.beginPath();
  ctx.roundRect(v.x, v.y, v.w, v.h, 8);
  ctx.fill();
  ctx.strokeStyle = '#6b4a14';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#1d2b4a';
  ctx.fillRect(v.x + 12, v.y + 8, 34, 16);
  ctx.fillRect(v.x + 58, v.y + 8, 34, 16);
  ctx.fillRect(v.x + 104, v.y + 8, 34, 16);
  ctx.fillStyle = '#0d1b26';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GETAWAY VAN', v.x + v.w / 2, v.y + v.h - 14);
  // Pulsing ring on the door itself.
  const pulse = 0.55 + Math.sin(game.now * 2.5) * 0.25;
  ctx.strokeStyle = `rgba(255, 215, 106, ${pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(e.x + e.w / 2, e.y + e.h / 2, 24 + Math.sin(game.now * 2.5) * 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** A gold arrow above the thief pointing at the current objective. */
function drawObjectiveArrow(ctx, game) {
  const target = game.objectivePoint();
  if (!target) return;
  const p = game.player;
  const dx = target.x - p.x;
  const dy = target.y - p.y;
  const d = Math.hypot(dx, dy);
  if (d < 90) return;
  const ang = Math.atan2(dy, dx);
  const ax = p.x + Math.cos(ang) * (p.radius + 26);
  const ay = p.y + Math.sin(ang) * (p.radius + 26);
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(ang);
  ctx.fillStyle = 'rgba(255, 215, 106, 0.9)';
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(-6, -7);
  ctx.lineTo(-6, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = 'rgba(255, 215, 106, 0.9)';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(Math.round(d / 10) + 'm', ax, ay - 12);
  ctx.restore();
}

function drawVignette(ctx, game) {
  const alarm = game.alarm.value;
  const strength = game.alarm.seen ? 0.22 : 0;
  const alarmStrength = alarm >= 60 ? ((alarm - 60) / 40) * 0.3 : 0;
  const a = Math.max(strength, alarmStrength);
  if (a <= 0) return;
  const g = ctx.createRadialGradient(640, 400, 260, 640, 400, 720);
  g.addColorStop(0, 'rgba(255, 40, 30, 0)');
  g.addColorStop(1, `rgba(255, 40, 30, ${a})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.restore();
}

function drawEscapeTally(ctx, game) {
  ctx.save();
  const x = 840;
  const y = 100;
  const w = 330;
  const h = 128;
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.goldBright;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText('GETAWAY — THE TAKE', x + 18, y + 24);
  ctx.fillStyle = '#e8e2d2';
  ctx.font = '15px Arial, sans-serif';
  ctx.fillText('LOOT', x + 18, y + 56);
  ctx.fillText('GHOST BONUS', x + 18, y + 82);
  ctx.textAlign = 'right';
  ctx.fillText(money(game.loot), x + w - 18, y + 56);
  ctx.fillText(money(5000), x + w - 18, y + 82);
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(x + 18, y + 100, w - 36, 1);
  ctx.fillStyle = COLORS.goldBright;
  ctx.font = 'bold 17px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL', x + 18, y + 118);
  ctx.textAlign = 'right';
  ctx.fillText(money(game.loot + 5000), x + w - 18, y + 118);
  ctx.restore();
}

function drawTitle(ctx, game) {
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  g.addColorStop(0, '#0a1a22');
  g.addColorStop(0.55, '#122e33');
  g.addColorStop(1, '#05090c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Gold frame.
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(26, 26, VIEW.width - 52, VIEW.height - 52);
  ctx.strokeStyle = 'rgba(242, 193, 78, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(34, 34, VIEW.width - 68, VIEW.height - 68);

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.goldBright;
  ctx.font = 'bold 96px Georgia, serif';
  ctx.fillText('MERIDIAN', VIEW.width / 2, 190);
  ctx.font = 'bold 96px Georgia, serif';
  ctx.fillText('HEIST', VIEW.width / 2, 292);
  ctx.fillStyle = '#e8e2d2';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('— ONE LAST JOB AT THE MERIDIAN BANK —', VIEW.width / 2, 348);

  // Crew silhouettes: Vex in front, two lookouts behind.
  const crew = [
    { x: 520, y: 580, s: 1.15, label: 'VEX — THE THIEF' },
    { x: 640, y: 565, s: 1.35, label: '' },
    { x: 760, y: 580, s: 1.15, label: 'THE CREW' },
  ];
  for (const c of crew) {
    ctx.fillStyle = '#0a1418';
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y - 62 * c.s, 26 * c.s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(c.x - 34 * c.s, c.y + 90);
    ctx.quadraticCurveTo(c.x - 36 * c.s, c.y - 30 * c.s, c.x, c.y - 34 * c.s);
    ctx.quadraticCurveTo(c.x + 36 * c.s, c.y - 30 * c.s, c.x + 34 * c.s, c.y + 90);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (c.label) {
      ctx.fillStyle = COLORS.goldBright;
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.fillText(c.label, c.x, c.y + 116);
    }
  }
  ctx.fillStyle = '#c8b98a';
  ctx.font = '17px Georgia, serif';
  ctx.fillText('Vex is out of the game — until the Aurora Diamond calls him back.', VIEW.width / 2, 408);
  ctx.fillText('Three floors of guards, CCTV and lasers stand between him and the van.', VIEW.width / 2, 436);

  const blink = 0.65 + Math.sin(game.now * 3) * 0.35;
  ctx.fillStyle = `rgba(255, 215, 106, ${blink})`;
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText('PRESS ENTER OR CLICK TO START', VIEW.width / 2, 732);
  ctx.fillStyle = '#9fb4c0';
  ctx.font = '15px Arial, sans-serif';
  ctx.fillText('WASD / ARROWS move   ·   SHIFT sneak   ·   E grab / use   ·   Q smoke pellet   ·   P pause   ·   M mute', VIEW.width / 2, 756);
  ctx.restore();
}

function drawCentrePanel(ctx, title, titleColor, lines, grade, footer) {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 12, 16, 0.82)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const w = 620;
  const h = grade ? 430 : 360;
  const x = (VIEW.width - w) / 2;
  const y = (VIEW.height - h) / 2;
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = titleColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.textAlign = 'center';
  ctx.fillStyle = titleColor;
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText(title, VIEW.width / 2, y + 84);
  ctx.fillStyle = '#e8e2d2';
  ctx.font = '18px Arial, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, y + 140 + i * 34));
  if (grade) {
    ctx.fillStyle = COLORS.goldBright;
    ctx.font = 'bold 92px Georgia, serif';
    ctx.fillText(grade, VIEW.width / 2, y + 140 + lines.length * 34 + 84);
  }
  ctx.fillStyle = '#9fb4c0';
  ctx.font = '16px Arial, sans-serif';
  ctx.fillText(footer, VIEW.width / 2, y + h - 30);
  ctx.restore();
}

/** Draw one frame of the game for the current screen. */
export function drawGame(ctx, game) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  if (game.screen === 'title') {
    drawTitle(ctx, game);
    return;
  }
  const { floor } = game;
  drawFloor(ctx, floor);
  drawExit(ctx, game);
  for (const item of floor.loot) drawLoot(ctx, item, game.now);
  if (floor.laserSwitch) {
    ctx.save();
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(floor.laserSwitch.x - 12, floor.laserSwitch.y - 16, 24, 32);
    ctx.strokeStyle = game.now < game.laserDisabledUntil ? COLORS.green : COLORS.red;
    ctx.lineWidth = 2;
    ctx.strokeRect(floor.laserSwitch.x - 12, floor.laserSwitch.y - 16, 24, 32);
    ctx.fillStyle = '#e8e2d2';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LASER', floor.laserSwitch.x, floor.laserSwitch.y + 30);
    ctx.fillText('SWITCH [E]', floor.laserSwitch.x, floor.laserSwitch.y + 42);
    ctx.restore();
  }
  for (const beam of floor.lasers) drawLaser(ctx, beam, game.now, game.laserDisabledUntil);
  for (const s of game.smoke) {
    ctx.save();
    ctx.fillStyle = COLORS.smoke;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Vision cones first, so walls drawn after them read as cover.
  for (const cam of game.cameras) {
    drawCone(ctx, cam.x, cam.y, cam.angle, TUNE.cameraHalfAngle, TUNE.cameraRange, COLORS.coneCam);
  }
  for (const guard of game.guards) {
    drawCone(
      ctx,
      guard.x,
      guard.y,
      guard.dir,
      TUNE.guardHalfAngle,
      TUNE.guardRange,
      guard.seen ? COLORS.coneGuardHot : COLORS.coneGuard,
    );
  }
  for (const s of floor.solids) drawSolid(ctx, s);
  drawVan(ctx, game);
  for (const cam of game.cameras) drawCamera(ctx, cam);
  for (const guard of game.guards) drawGuard(ctx, guard, game.now);
  drawPlayer(ctx, game.player, game);
  drawObjectiveArrow(ctx, game);
  drawVignette(ctx, game);
  drawHUD(ctx, game);
  drawHint(ctx, game);

  if (game.shot === 'escape') drawEscapeTally(ctx, game);

  if (game.screen === 'pause') {
    drawCentrePanel(ctx, 'PAUSED', COLORS.goldBright, ['The bank waits. The guards do not.'], null, 'PRESS P TO RESUME');
  } else if (game.screen === 'inter') {
    drawCentrePanel(ctx, 'FLOOR CLEAR', COLORS.goldBright, [game.nextFloorName], null, 'Stay sharp — it only gets tighter upstairs.');
  } else if (game.screen === 'win') {
    drawCentrePanel(
      ctx,
      'CLEAN GETAWAY',
      COLORS.goldBright,
      [
        'LOOT  ' + money(game.loot),
        (game.ghost ? 'GHOST BONUS (never spotted)  ' : 'SPOTTED — no ghost bonus  ') + (game.ghost ? money(TUNE.ghostBonus) : '$0'),
        'TIME BONUS  ' + money(game.timeBonus),
        'TOTAL TAKE  ' + money(game.totalScore),
      ],
      game.grade,
      'PRESS R TO RUN IT AGAIN',
    );
  } else if (game.screen === 'fail') {
    drawCentrePanel(ctx, 'LOCKDOWN', COLORS.red, [game.failReason, 'LOOT KEPT  ' + money(game.loot)], null, 'PRESS R TO RETRY THE JOB');
  }

  // Controls reminder, bottom edge (not on the van floor — the van is there).
  if (game.screen === 'play' && !game.floor.van) {
    ctx.save();
    ctx.fillStyle = 'rgba(232, 226, 210, 0.55)';
    ctx.font = '12px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WASD move · SHIFT sneak · E grab · Q smoke · P pause · M mute', VIEW.width / 2, VIEW.height - 8);
    ctx.restore();
  }
}
