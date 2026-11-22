// Meridian Heist — the HUD: a labelled ALARM bar, LOOT counter, timer, floor name,
// detection eye and the current objective. Always on screen while playing.

import { COLORS, HUD_H, VIEW } from './config.js';

function money(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function alarmColor(value) {
  if (value >= 70) return COLORS.red;
  if (value >= 35) return COLORS.amber;
  return COLORS.green;
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

/** Draw the detection eye: open and red while spotted, a calm slit while hidden. */
function drawEye(ctx, x, y, seen, hot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = seen ? COLORS.red : '#e8e2d2';
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.quadraticCurveTo(0, -13, 16, 0);
  ctx.quadraticCurveTo(0, 13, -16, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = hot ? '#ff2e1f' : '#0d1b26';
  ctx.beginPath();
  ctx.arc(0, 0, seen ? 6 : 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawHUD(ctx, game) {
  const { alarm, loot, timeLeft, floor } = game;
  ctx.save();
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(0, 0, VIEW.width, HUD_H);
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(0, HUD_H - 2, VIEW.width, 2);

  // ALARM label + bar.
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = alarm.value >= 70 ? COLORS.red : '#e8e2d2';
  ctx.font = 'bold 17px Arial, sans-serif';
  ctx.fillText('ALARM', 24, 26);
  const barX = 100;
  const barY = 14;
  const barW = 300;
  const barH = 24;
  ctx.fillStyle = '#1a2c38';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = alarmColor(alarm.value);
  ctx.fillRect(barX + 2, barY + 2, (barW - 4) * (alarm.value / 100), barH - 4);
  ctx.strokeStyle = '#44596a';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX + 0.5, barY + 0.5, barW, barH);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText(Math.round(alarm.value) + '%', barX + barW + 10, 26);

  // Detection eye + word.
  drawEye(ctx, 486, 26, alarm.seen, alarm.value >= 70);
  ctx.fillStyle = alarm.seen ? COLORS.red : '#9fc3a8';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText(alarm.seenByGuard ? 'SPOTTED!' : alarm.seen ? 'ON CAMERA' : 'HIDDEN', 510, 26);

  // Floor name, centred.
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.goldBright;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText(floor.name, 740, 22);
  ctx.fillStyle = '#c8b98a';
  ctx.font = '13px Arial, sans-serif';
  ctx.fillText('OBJECTIVE: ' + floor.objective.toUpperCase(), 740, 46);

  // LOOT and TIMER, right side.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e8e2d2';
  ctx.font = 'bold 17px Arial, sans-serif';
  ctx.fillText('LOOT  ' + money(loot), 1120, 20);
  ctx.fillStyle = timeLeft <= 60 ? COLORS.red : '#e8e2d2';
  ctx.fillText('TIME  ' + formatTime(timeLeft), 1120, 44);
  ctx.fillStyle = '#9fb4c0';
  ctx.font = '13px Arial, sans-serif';
  ctx.fillText('SMOKE ×' + game.player.smoke + '  [Q]', 1240, 44);
  ctx.restore();
}

/** The small hint line under the HUD, shown for a few seconds after an event. */
export function drawHint(ctx, game) {
  if (!game.hint || game.now > game.hint.until) return;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillStyle = 'rgba(10, 24, 34, 0.85)';
  const w = ctx.measureText(game.hint.text).width + 36;
  ctx.fillRect((VIEW.width - w) / 2, HUD_H + 12, w, 34);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 1;
  ctx.strokeRect((VIEW.width - w) / 2 + 0.5, HUD_H + 12.5, w, 34);
  ctx.fillStyle = COLORS.goldBright;
  ctx.fillText(game.hint.text, VIEW.width / 2, HUD_H + 30);
  ctx.restore();
}
