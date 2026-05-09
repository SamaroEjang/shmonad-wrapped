export interface ConvictionInput {
  timeWeightedBalance: number;
  maxTimeWeightedBalance: number;
  exitCount: number;
  totalDaysHolding: number;
  currentBalance: number;
}

export function computeConvictionScore(input: ConvictionInput): number {
  const { timeWeightedBalance, maxTimeWeightedBalance,
          exitCount, totalDaysHolding, currentBalance } = input;

  const twbNorm = maxTimeWeightedBalance > 0
    ? Math.min(timeWeightedBalance / maxTimeWeightedBalance, 1) : 0;
  const stability = Math.max(1.0 - exitCount * 0.15, 0.1);
  const timeNorm = totalDaysHolding > 0 ? Math.min(totalDaysHolding / 365, 1) : 0;

  const raw = twbNorm * 50 * stability + timeNorm * 30 + 0.5 * 20;
  return Math.round(Math.min(raw, 100) * 100) / 100;
}