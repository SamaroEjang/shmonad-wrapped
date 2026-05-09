import { BalancePoint } from './balances';

export interface StreakStats {
  longestStreakDays: number;
  currentStreakDays: number;
  exitCount: number;
  neverExited: boolean;
}

export function computeStreaks(history: BalancePoint[], now = new Date()): StreakStats {
  if (history.length === 0)
    return { longestStreakDays: 0, currentStreakDays: 0, exitCount: 0, neverExited: true };

  const SECS = 86400;
  let exitCount = 0, longestSecs = 0;
  let streakStart: Date | null = null;
  let inPosition = false;

  for (const { balance, timestamp } of history) {
    if (!inPosition && balance > 0n) { streakStart = timestamp; inPosition = true; }
    else if (inPosition && balance === 0n) {
      exitCount++;
      const secs = (timestamp.getTime() - streakStart!.getTime()) / 1000;
      if (secs > longestSecs) longestSecs = secs;
      streakStart = null; inPosition = false;
    }
  }

  let currentSecs = 0;
  if (inPosition && streakStart) {
    currentSecs = (now.getTime() - streakStart.getTime()) / 1000;
    if (currentSecs > longestSecs) longestSecs = currentSecs;
  }

  return {
    longestStreakDays: longestSecs / SECS,
    currentStreakDays: currentSecs / SECS,
    exitCount,
    neverExited: exitCount === 0 && inPosition,
  };
}