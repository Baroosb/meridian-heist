// Meridian Heist — Vex's tools at a cost: the decoy coin. Toss one (F) and it
// lands a short throw ahead, glinting on the marble; every guard close enough
// to hear it turns to stare at it while it lasts. Three coins a floor, no more:
// spend them where a patrol has to be moved, not where it is merely annoying.

import { PLAY, TUNE } from './config.js';

/** Where a coin tossed by this player lands: a short throw along his facing. */
export function coinLanding(player) {
  const x = player.x + Math.cos(player.dir) * TUNE.coinThrowRange;
  const y = player.y + Math.sin(player.dir) * TUNE.coinThrowRange;
  return {
    x: Math.min(Math.max(x, PLAY.x + 20), PLAY.x + PLAY.w - 20),
    y: Math.min(Math.max(y, PLAY.y + 20), PLAY.y + PLAY.h - 20),
  };
}

/** A fresh decoy coin at (x, y); it glints for TUNE.coinSeconds, then is spent. */
export function createCoin(x, y) {
  return { x, y, t: TUNE.coinSeconds };
}

/** Age every live coin by dt and drop the spent ones. */
export function updateCoins(coins, dt) {
  return coins.filter((coin) => {
    coin.t -= dt;
    return coin.t > 0;
  });
}

/** The live coin nearest this guard, if one is close enough to draw his eye. */
export function coinDrawing(guard, coins) {
  let best = null;
  let bestD = TUNE.coinRadius;
  for (const coin of coins) {
    const d = Math.hypot(coin.x - guard.x, coin.y - guard.y);
    if (d < bestD) {
      best = coin;
      bestD = d;
    }
  }
  return best;
}
