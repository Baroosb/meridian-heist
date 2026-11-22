// Meridian Heist — the ALARM meter, 0 to 100. Guard eyes fill it fast, cameras
// slower; it decays while nobody can see the thief. At 100 the bank locks down.

import { TUNE } from './config.js';

export function createAlarm() {
  return {
    value: 0,
    events: 0, // how many times a guard has spotted the thief (breaks GHOST)
    seenByGuard: false,
    seenByCamera: false,
    seen: false, // any watcher has the thief right now
  };
}

/**
 * Advance the meter one step. Returns 'lockdown' when the meter hits 100.
 * A guard spotting the thief for the first time counts one detection event.
 */
export function updateAlarm(alarm, dt, guardSeen, cameraSeen) {
  const wasSeenByGuard = alarm.seenByGuard;
  alarm.seenByGuard = guardSeen;
  alarm.seenByCamera = cameraSeen;
  alarm.seen = guardSeen || cameraSeen;
  if (guardSeen && !wasSeenByGuard) alarm.events += 1;
  if (guardSeen) alarm.value += TUNE.alarmGuardPerSec * dt;
  else if (cameraSeen) alarm.value += TUNE.alarmCameraPerSec * dt;
  else alarm.value -= TUNE.alarmDecayPerSec * dt;
  if (alarm.value < 0) alarm.value = 0;
  if (alarm.value >= 100) {
    alarm.value = 100;
    return 'lockdown';
  }
  return null;
}
