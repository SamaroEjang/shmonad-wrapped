import { FastifyInstance } from 'fastify';
import { db } from '../../db/client';
import { getCurrentBalance } from '../../analytics/balances';

const MERKL_API = 'https://api.merkl.xyz/v4/users';

const PROTOCOL_TRAITS: Record<string, { label: string; description: string; emoji: string }> = {
  'FastLane Degen Pool': { emoji: '🎰', label: 'Degen Overlord', description: 'Highest points from the Degen Pool' },
  'Curvance shMON': { emoji: '🔵', label: 'Curvance Commander', description: 'Highest points from Curvance' },
  'Uniswap V3': { emoji: '🦄', label: 'Uniswap Ultramarine', description: 'Highest points from Uniswap' },
  'shMON Wallet': { emoji: '💜', label: 'Yield Sovereign', description: 'Highest points from shMON staking' },
  'Zero Yield': { emoji: '⚡', label: 'Yield Sovereign', description: 'Highest points from Zero Yield staking' },
  'Euler': { emoji: '📐', label: 'Euler Elite', description: 'Highest points from Euler' },
  'Neverland': { emoji: '🏰', label: 'Neverland Noble', description: 'Highest points from Neverland' },
  'Balancer': { emoji: '⚖️', label: 'Balancer Baron', description: 'Highest points from Balancer' },
  'Townsquare': { emoji: '🏙️', label: 'Townesquare Titan', description: 'Highest points from Townesquare' },
};
function getProtocolKey(reason: string): string {
  if (reason.includes('Townsquare') || reason.includes('Towne')) return 'Townsquare';
  if (reason.includes('FastLaneZeroYieldTranche')) return 'Zero Yield';
  if (reason.includes('FastLane Degen Pool') || reason.includes('FastLaneDegenPool')) return 'FastLane Degen Pool';
  if (reason.includes('Neverland')) return 'Neverland';
  if (reason.includes('Balancer')) return 'Balancer';
  if (reason.includes('Euler_') || reason.includes('EULER_')) return 'Euler';
  if (reason.includes('Uniswap')) return 'Uniswap V3';
  if (reason.includes('PANCAKESWAP')) return 'PancakeSwap';
  if (reason.includes('MONDAY_TRADE') || reason.includes('MONDAY TRADE')) return 'Monday Trade';
  if (reason.includes('MorphoVault') || reason.includes('MorphoVaultV2')) return 'Morpho';
  if (reason.includes('Aave')) return 'Aave Supply';
  if (reason.toLowerCase().includes('curvance')) return 'Curvance';
  if (reason.includes('103222f020e98Bba0AD9809A011FDF8e6F067496')) return 'Townsquare';
  if (reason.includes('852FF1EC21D63b405eC431e04AE3AC760e29263D')) return 'FastLane Degen Pool';
  if (reason.includes('Ad4AA2a713fB86FBb6b60dE2aF9E32a11DB6Abf2')) return 'Curvance shMON';
  if (reason.includes('fD493ce1A0ae986e09d17004B7E748817a47d73c')) return 'Neverland';
  if (reason.includes('E01d426B589c7834a5F6B20D7e992A705d3c22ED')) return 'shMON Wallet';
  if (reason.includes('8E94704607E857eB3E10Bd21D90bf8C1Ecba0452')) return 'Zero Yield';

  // Remove addresses (0x...)
  let cleaned = reason.replace(/0x[a-fA-F0-9]{40}/g, '').trim();
  
  // Clean up common patterns
  if (cleaned.startsWith('Euler_') || cleaned.startsWith('EULER_')) return 'Euler';
  if (cleaned.includes('Neverland')) return 'Neverland';
  if (cleaned.includes('Balancer')) return 'Balancer';
  if (cleaned.includes('Townsquare') || cleaned.includes('Towne')) return 'Townsquare';
  if (cleaned.startsWith('FastLaneZeroYieldTranche')) return 'Zero Yield';
  if (cleaned.startsWith('ERC20')) return 'Other Protocols';
  
  // Replace underscores with spaces and trim
  return cleaned.replace(/_/g, ' ').trim();
}
const EXTRA_PROTOCOL_TRAITS: Record<string, { label: string; description: string; emoji: string }> = {
  'Euler': { emoji: '📐', label: 'Euler Elite', description: 'Highest points from Euler' },
  'Neverland': { emoji: '🏰', label: 'Neverland Noble', description: 'Highest points from Neverland' },
  'Balancer': { emoji: '⚖️', label: 'Balancer Baron', description: 'Highest points from Balancer' },
  'Townsquare': { emoji: '🏙️', label: 'Townsquare Titan', description: 'Highest points from Townsquare' },
};

function formatRewardAmount(amount: string | number | bigint, decimals = 18): number {
  const value = BigInt(amount.toString().split('.')[0] || '0');
  const divisor = 10 ** decimals;
  return Number(value) / divisor;
}

async function getProtocolStats(wallet: string) {
  const traits: { id: string; label: string; description: string }[] = [];
  let totalPoints = 0;
  let protocolCount = 0;
  const pointsBreakdown: { protocol: string; amount: number }[] = [];
  
  try {
    const res = await fetch(`${MERKL_API}/${wallet}/rewards?chainId=143`);
    const data = await res.json() as any[];
    if (!data || data.length === 0) return { traits, totalPoints, protocolCount, pointsBreakdown };
    
    const rewards = data[0]?.rewards;
    if (!rewards || rewards.length === 0) return { traits, totalPoints, protocolCount, pointsBreakdown };

    // Merge amounts by protocol
    const merged: Record<string, number> = {};
    let hasRPC = false;

    for (const reward of rewards) {
      const decimals = reward.token?.decimals ?? 18;

      if (reward.amount) {
        totalPoints += formatRewardAmount(reward.amount, decimals);
      }

      const breakdowns = reward.breakdowns || [];
      for (const b of breakdowns) {
        const reason = b.reason as string;
        if (reason.includes('FastlaneRPC') || reason.includes('Fastlane_RPC') || reason.includes('RPC')) {
          hasRPC = true;
          continue;
        }

        const key = getProtocolKey(reason);
        merged[key] = (merged[key] || 0) + formatRewardAmount(b.amount, decimals);
      }
    }

    totalPoints = Math.round(totalPoints);

    // Convert merged data to breakdown array and sort by amount descending
    for (const [protocol, amount] of Object.entries(merged)) {
      const roundedAmount = Math.round(amount);
      if (roundedAmount <= 0) continue;

      pointsBreakdown.push({
        protocol,
        amount: roundedAmount
      });
    }

    // Sort by amount in descending order
    pointsBreakdown.sort((a, b) => b.amount - a.amount);

    // Count visible protocols (including RPC if present)
    protocolCount = pointsBreakdown.length + (hasRPC ? 1 : 0);

    // Find top protocol
    let topKey = '';
    let topAmount = 0;
    for (const [key, amount] of Object.entries(merged)) {
      if (amount > topAmount) { topAmount = amount; topKey = key; }
    }

    if (topKey) {
      const trait = PROTOCOL_TRAITS[topKey] || EXTRA_PROTOCOL_TRAITS[topKey];
      if (trait) {
        traits.push({ id: topKey, label: `${trait.emoji} ${trait.label}`, description: trait.description });
      }
    }

    if (hasRPC) {
      traits.push({ id: 'rpc_reformer', label: '⚡ RPC Reformer', description: 'Uses the Fastlane RPC' });
    }
  } catch (e) {
    console.error('Merkl fetch error:', e);
  }
  
  return { traits, totalPoints, protocolCount, pointsBreakdown };
}

export async function wrappedRoutes(server: FastifyInstance) {
  server.get('/api/wrapped/:wallet', async (request, reply) => {
    const { wallet } = request.params as { wallet: string };
    const w = wallet.toLowerCase();

    try {
      const currentBalance = await getCurrentBalance(wallet);

      const firstRes = await db.query(`
        SELECT MIN(block_timestamp) as first_seen
        FROM transfer_events WHERE to_address = $1
      `, [w]);
      const firstDepositDate = firstRes.rows[0]?.first_seen || null;
      const totalDaysHolding = firstDepositDate
        ? Math.floor((Date.now() - new Date(firstDepositDate).getTime()) / 86400000)
        : 0;

      const peakRes = await db.query(`
        SELECT MAX(running_balance) as peak FROM (
          SELECT SUM(CASE WHEN to_address = $1 THEN amount ELSE -amount END)
            OVER (ORDER BY block_number, log_index) as running_balance
          FROM transfer_events WHERE from_address = $1 OR to_address = $1
        ) t
      `, [w]);
      const peakRaw = parseFloat(peakRes.rows[0]?.peak || '0');
      const peakBalance = Math.max(0, peakRaw / 1e18).toFixed(1);

      const txRes = await db.query(`
        SELECT block_timestamp,
          CASE WHEN to_address = $1 THEN amount ELSE -amount END as delta
        FROM transfer_events WHERE from_address = $1 OR to_address = $1
        ORDER BY block_number, log_index
      `, [w]);

      let longestStreakDays = 0;
      let streakStart: Date | null = null;
      let runningBalance = BigInt(0);
      for (const row of txRes.rows) {
        const prev = runningBalance;
        const deltaStr = row.delta.toString().split('.')[0];
        runningBalance += BigInt(deltaStr || '0');
        if (prev === BigInt(0) && runningBalance > BigInt(0)) streakStart = new Date(row.block_timestamp);
        if (prev > BigInt(0) && runningBalance <= BigInt(0) && streakStart) {
          const days = (new Date(row.block_timestamp).getTime() - streakStart.getTime()) / 86400000;
          if (days > longestStreakDays) longestStreakDays = days;
          streakStart = null;
        }
      }
      if (streakStart && runningBalance > BigInt(0)) {
        const days = (Date.now() - streakStart.getTime()) / 86400000;
        if (days > longestStreakDays) longestStreakDays = days;
      }
      if (longestStreakDays === 0 && totalDaysHolding > 0 && parseFloat(currentBalance) > 0) {
        longestStreakDays = totalDaysHolding;
      }

      const twbRes = await db.query(`
        SELECT SUM(amount * EXTRACT(EPOCH FROM (NOW() - block_timestamp)) / 86400) as twb
        FROM transfer_events WHERE to_address = $1
      `, [w]);
      const timeWeightedBalance = Math.round(parseFloat(twbRes.rows[0]?.twb || '0') / 1e18);

      // Calculate actual ranking by balance
      const rankRes = await db.query(`
        WITH balances AS (
          SELECT to_address, SUM(CASE WHEN to_address = transfer_events.to_address THEN amount ELSE -amount END) as balance
          FROM transfer_events
          WHERE to_address IN (SELECT DISTINCT to_address FROM transfer_events)
             OR from_address IN (SELECT DISTINCT to_address FROM transfer_events)
          GROUP BY to_address
          HAVING SUM(CASE WHEN to_address = transfer_events.to_address THEN amount ELSE -amount END) > 0
        )
        SELECT COUNT(*) as total, 
               COUNT(*) FILTER (WHERE balance > (SELECT balance FROM balances WHERE to_address = $1)) as better
        FROM balances
      `, [w]);
      const total = parseFloat(rankRes.rows[0]?.total || '0');
      const better = parseFloat(rankRes.rows[0]?.better || '0');
      const pct = total > 0 ? Math.round((better / total) * 100) : null;

      const traits: { id: string; label: string; description: string }[] = [];

      // Basic traits
      if (firstDepositDate) {
        const daysSinceLaunch = (new Date(firstDepositDate).getTime() - new Date('2025-11-24').getTime()) / 86400000;
        if (daysSinceLaunch <= 7) traits.push({ id: 'genesis', label: '🌱 Genesis Holder', description: 'Staked within the first week of launch' });
      }
      if (parseFloat(currentBalance) > 1000) traits.push({ id: 'accumulator', label: '🐋 Accumulator', description: 'Holds over 1,000 shMON' });
      if (Math.round(longestStreakDays) >= 30) traits.push({ id: 'diamond', label: '💎 Diamond Roots', description: 'Held for 30+ days straight' });
      if (totalDaysHolding >= 100) traits.push({ id: 'veteran', label: '🏆 Veteran', description: 'Holding for 100+ days' });

      // Protocol traits from Merkl
      const { traits: protocolTraits, totalPoints, protocolCount, pointsBreakdown } = await getProtocolStats(wallet);
      traits.push(...protocolTraits);

      // Monthly performance analysis
      const monthlyRes = await db.query(`
        SELECT 
          DATE_TRUNC('month', block_timestamp) as month,
          SUM(amount) / 1e18 as total_deposited
        FROM transfer_events 
        WHERE to_address = $1 
        GROUP BY DATE_TRUNC('month', block_timestamp)
        ORDER BY month
      `, [w]);

      const monthlyData = monthlyRes.rows.map(row => ({
        month: new Date(row.month).toISOString(),
        amount: parseFloat(row.total_deposited)
      }));

      const bestMonth = monthlyData.length > 0 
        ? monthlyData.reduce((best, current) => 
            current.amount > best.amount ? current : best
          )
        : { month: new Date().toISOString(), amount: 0 };

      return reply.send({
        wallet,
        firstDepositDate,
        totalDaysHolding,
        currentBalance,
        peakBalance,
        longestStreakDays: Math.round(longestStreakDays),
        timeWeightedBalance,
        convictionScore: Math.min(100, totalDaysHolding + Math.round(parseFloat(currentBalance) / 100)),
        traits,
        percentileRank: pct,
        totalPoints,
        protocolCount,
        totalTransactions: txRes.rows.length,
        pointsBreakdown,
        monthlyData,
        bestMonth,
      });
    } catch (err) {
      console.error(err);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
