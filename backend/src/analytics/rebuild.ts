import { db } from '../db/client';
import { getBalanceHistory, computeBalanceStats } from './balances';
import { computeStreaks } from './streaks';
import { computeConvictionScore } from './conviction';
import { evaluateTraits } from '../traits/engine';

export async function rebuildWalletAggregate(wallet: string) {
  const history = await getBalanceHistory(wallet);
  const now = new Date();
  const stats = computeBalanceStats(history, now);
  const streaks = computeStreaks(history, now);

  const maxRes = await db.query(
    `SELECT MAX(time_weighted_balance) as max_twb FROM wallet_aggregates`
  );
  const maxTWB = parseFloat(maxRes.rows[0]?.max_twb || "0");

  const convictionScore = computeConvictionScore({
    timeWeightedBalance: stats.timeWeightedBalance,
    maxTimeWeightedBalance: Math.max(maxTWB, stats.timeWeightedBalance),
    exitCount: streaks.exitCount,
    totalDaysHolding: stats.totalDaysHolding,
    currentBalance: Number(stats.currentBalance) / 1e18,
  });

  const traits = evaluateTraits({
    wallet, history, streaks,
    firstDepositAt: stats.firstDepositAt,
    currentBalance: stats.currentBalance,
    timeWeightedBalance: stats.timeWeightedBalance,
    totalDaysHolding: stats.totalDaysHolding,
  });

  await db.query(
    `INSERT INTO wallet_aggregates
       (wallet, first_deposit_at, last_updated_at, current_balance, peak_balance,
        total_days_holding, time_weighted_balance, longest_streak_days,
        exit_count, conviction_score, traits)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (wallet) DO UPDATE SET
       first_deposit_at=$2, last_updated_at=$3, current_balance=$4,
       peak_balance=$5, total_days_holding=$6, time_weighted_balance=$7,
       longest_streak_days=$8, exit_count=$9, conviction_score=$10, traits=$11`,
    [wallet.toLowerCase(), stats.firstDepositAt, now,
     stats.currentBalance.toString(), stats.peakBalance.toString(),
     stats.totalDaysHolding, stats.timeWeightedBalance,
     streaks.longestStreakDays, streaks.exitCount,
     convictionScore, JSON.stringify(traits)]
  );
}