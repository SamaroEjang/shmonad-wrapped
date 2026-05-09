import { TraitRule } from '../engine';

export const accumulatorRule: TraitRule = ({ history }) => {
  const pts = history.filter(h => h.balance > 0n).slice(-5);
  if (pts.length < 3) return null;
  let ups = 0;
  for (let i = 1; i < pts.length; i++) if (pts[i].balance > pts[i-1].balance) ups++;
  if (ups < pts.length - 1) return null;
  return {
    id: 'accumulator',
    label: 'Accumulator',
    description: 'Consistently increasing balance'
  };
};