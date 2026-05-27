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

export async function fetchWrapped(
  wallet: string,
  signal?: AbortSignal
): Promise<WrappedData> {
  const res = await fetch(`${API_BASE}/api/wrapped/${wallet}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    signal,
  });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
}

export interface ClaimDomain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: `0x${string}`;
}

export interface EligibilityResponse {
  wallet: string;
  eligible: boolean;
  claimable: string | null;
  points: string | null;
  alreadyClaimed: boolean;
  status: 'pending' | 'broadcast' | 'confirmed' | null;
  txHash: string | null;
  domain: ClaimDomain;
}

export async function fetchEligibility(
  wallet: string,
  signal?: AbortSignal
): Promise<EligibilityResponse> {
  const res = await fetch(`${API_BASE}/api/eligibility/${wallet}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    signal,
  });
  if (!res.ok) throw new Error(`Failed to fetch eligibility: ${res.status}`);
  return res.json();
}

export interface ClaimResponse {
  status: 'pending' | 'broadcast' | 'confirmed';
  txHash: string | null;
  message?: string;
}

export interface ClaimErrorBody {
  error: string;
  txHash?: string;
  recoverable?: boolean;
}

async function parseJsonSafely(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function postClaim(
  wallet: string,
  signature: string,
  signal?: AbortSignal
): Promise<{ ok: boolean; status: number; body: ClaimResponse | ClaimErrorBody | null }> {
  const res = await fetch(`${API_BASE}/api/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet, signature }),
    signal,
  });
  const body = (await parseJsonSafely(res)) as ClaimResponse | ClaimErrorBody | null;
  return { ok: res.ok, status: res.status, body };
}