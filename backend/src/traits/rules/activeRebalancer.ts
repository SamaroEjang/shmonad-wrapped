import { TraitRule } from '../engine';

export const activeRebalancerRule: TraitRule = ({ streaks }) => {
  if (streaks.exitCount < 5) return null;
  return {
    id: 'active_rebalancer',
    label: 'Active Rebalancer',
    description: 'Frequently adjusted position'
  };
};