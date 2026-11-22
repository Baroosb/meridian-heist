// Meridian Heist — tiny synthesized sounds (WebAudio, no audio files): a grab
// chime, a laser zap, alarm ticks and the win / fail stings. Silent until the
// player first presses a key or clicks, and M mutes everything.

export function createAudio() {
  return { ctx: null, muted: false };
}

function ensure(audio) {
  if (audio.ctx) return audio.ctx;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audio.ctx = new Ctx();
  } catch {
    return null;
  }
  return audio.ctx;
}

export function unlockAudio(audio) {
  const ctx = ensure(audio);
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

function tone(audio, freq, dur, type, vol, delay = 0) {
  if (audio.muted) return;
  const ctx = ensure(audio);
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const start = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  } catch {
    // Sound is garnish: a failure here must never break the game.
  }
}

export function soundGrab(audio) {
  tone(audio, 880, 0.12, 'sine', 0.16);
  tone(audio, 1318, 0.18, 'sine', 0.14, 0.08);
}

export function soundDiamond(audio) {
  tone(audio, 1046, 0.14, 'triangle', 0.18);
  tone(audio, 1568, 0.2, 'triangle', 0.16, 0.09);
  tone(audio, 2093, 0.3, 'sine', 0.12, 0.18);
}

export function soundZap(audio) {
  tone(audio, 220, 0.16, 'sawtooth', 0.16);
  tone(audio, 110, 0.2, 'square', 0.1, 0.05);
}

export function soundAlarmTick(audio) {
  tone(audio, 660, 0.07, 'square', 0.07);
}

export function soundSwitch(audio) {
  tone(audio, 520, 0.08, 'square', 0.12);
  tone(audio, 780, 0.12, 'square', 0.12, 0.07);
}

export function soundWin(audio) {
  [523, 659, 784, 1046].forEach((f, i) => tone(audio, f, 0.28, 'triangle', 0.16, i * 0.13));
}

export function soundFail(audio) {
  tone(audio, 196, 0.5, 'sawtooth', 0.16);
  tone(audio, 131, 0.7, 'sawtooth', 0.14, 0.18);
}
