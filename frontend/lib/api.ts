const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface WrappedData {
  wallet: string;
  firstDepositDate: string | null;
  totalDaysHolding: number;
  currentBalance: string;
  peakBalance: string;
  longestStreakDays: number;
  timeWeightedBalance: number;
  convictionScore: number;
  traits: Array<{ id: string; label: string; description: string }>;
  percentileRank: number | null;
  totalPoints: number;
  protocolCount: number;
  totalTransactions: number;
  pointsBreakdown: Array<{ protocol: string; amount: number }>;
  monthlyData: Array<{ month: string; amount: number }>;
  bestMonth: { month: string; amount: number };
}

export async function fetchWrapped(wallet: string): Promise<WrappedData> {
  const res = await fetch(`${API_BASE}/api/wrapped/${wallet}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
}