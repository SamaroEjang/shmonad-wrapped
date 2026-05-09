import { TraitRule } from '../engine';

const LAUNCH = new Date(process.env.PROTOCOL_LAUNCH_DATE || '2025-01-01');

export const genesisHolderRule: TraitRule = ({ firstDepositAt }) => {
  if (!firstDepositAt) return null;
  const withinWindow = firstDepositAt.getTime() - LAUNCH.getTime() <= 30 * 86400000;
  if (!withinWindow) return null;
  return {
    id: 'genesis_holder',
    label: 'Genesis Holder',
    description: 'Deposited within 30 days of launch'
  };
};