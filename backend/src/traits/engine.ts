import { BalancePoint } from '../analytics/balances';
import { StreakStats } from '../analytics/streaks';
import { genesisHolderRule } from './rules/genesisHolder';
import { diamondRootsRule } from './rules/diamondRoots';
import { accumulatorRule } from './rules/accumulator';
import { activeRebalancerRule } from './rules/activeRebalancer';

export interface TraitContext {
  wallet: string;
  history: BalancePoint[];
  streaks: StreakStats;
  firstDepositAt: Date | null;
  currentBalance: bigint;
  timeWeightedBalance: number;
  totalDaysHolding: number;
}

export interface TraitResult {
  id: string;
  label: string;
  description: string;
}

export type TraitRule = (ctx: TraitContext) => TraitResult | null;

const ALL_RULES: TraitRule[] = [
  genesisHolderRule, diamondRootsRule, accumulatorRule, activeRebalancerRule
];

export function evaluateTraits(ctx: TraitContext): TraitResult[] {
  return ALL_RULES.map(r => r(ctx)).filter((t): t is TraitResult => t !== null);
}