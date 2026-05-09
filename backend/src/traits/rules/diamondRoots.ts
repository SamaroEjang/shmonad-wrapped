import { TraitRule } from '../engine';

export const diamondRootsRule: TraitRule = ({ streaks, currentBalance }) => {
  if (!streaks.neverExited || currentBalance === 0n) return null;
  return {
    id: 'diamond_roots',
    label: 'Diamond Roots',
    description: 'Never fully exited shMonad position'
  };
};