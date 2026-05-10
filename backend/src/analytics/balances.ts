import 'dotenv/config';
import { db } from '../db/client';

const RPC_URL = process.env.MONAD_RPC_URL!;
const SHMONAD = process.env.SHMONAD_ADDRESS!;

export async function getCurrentBalance(wallet: string): Promise<string> {
  try {
    const data = '0x70a08231' + wallet.replace('0x', '').toLowerCase().padStart(64, '0');
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'eth_call',
        params: [{ to: SHMONAD, data }, 'latest'],
      }),
    });
    const json = await res.json() as { result?: string };
    if (!json.result || json.result === '0x') return '0.0000';
    const raw = BigInt(json.result);
    return (Number(raw) / 1e18).toFixed(4);
  } catch { return '0.0000'; }
}

export interface BalancePoint {
  balance: bigint;
  timestamp: Date;
}

export async function getBalanceHistory(wallet: string) {
  const result = await db.query(
    `SELECT date, balance FROM balance_history 
     WHERE wallet = $1 
     ORDER BY date ASC`,
    [wallet.toLowerCase()]
  );
  return result.rows;
}

export function computeBalanceStats(history: BalancePoint[], now: Date) {
  if (history.length === 0) {
    return {
      peakBalance: 0,
      currentBalance: 0,
      timeWeightedBalance: 0,
      totalDaysHolding: 0,
      firstDepositAt: null,
    };
  }

  const peakBalance = Math.max(...history.map(h => Number(h.balance)));
  const currentBalance = Number(history[history.length - 1].balance);
  
  const firstDepositAt = history[0].timestamp;
  const totalDaysHolding = Math.floor((now.getTime() - firstDepositAt.getTime()) / (1000 * 60 * 60 * 24));
  
  const totalDays = history.length;
  const timeWeightedBalance = history.reduce((sum, h) => sum + Number(h.balance), 0) / totalDays;

  return {
    peakBalance,
    currentBalance,
    timeWeightedBalance: Math.round(timeWeightedBalance),
    totalDaysHolding,
    firstDepositAt,
  };
}