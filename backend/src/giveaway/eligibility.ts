import { readFileSync } from 'fs';
import { join } from 'path';

export interface EligibilityEntry {
  points: string;
  claimable: string;
}

type EligibilityMap = Record<string, EligibilityEntry>;

let cache: EligibilityMap | null = null;

function load(): EligibilityMap {
  if (cache) return cache;

  const raw = readFileSync(join(__dirname, '..', 'data', 'eligibility.json'), 'utf-8');
  const parsed = JSON.parse(raw) as Record<string, EligibilityEntry>;

  const normalized: EligibilityMap = {};
  let totalClaimable = 0n;

  for (const [wallet, entry] of Object.entries(parsed)) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      console.warn(`Eligibility: skipping invalid address "${wallet}"`);
      continue;
    }
    if (!entry || typeof entry.claimable !== 'string') {
      console.warn(`Eligibility: skipping malformed entry for ${wallet}`);
      continue;
    }
    try {
      const amt = BigInt(entry.claimable);
      if (amt <= 0n) continue;
      totalClaimable += amt;
      normalized[wallet.toLowerCase()] = {
        points: entry.points ?? '0',
        claimable: amt.toString(),
      };
    } catch {
      console.warn(`Eligibility: invalid claimable for ${wallet}: ${entry.claimable}`);
    }
  }

  console.log(
    `Eligibility loaded: ${Object.keys(normalized).length} wallets, ` +
    `total claimable = ${totalClaimable.toString()} wei`
  );
  cache = normalized;
  return cache;
}

export function getEligibility(wallet: string): EligibilityEntry | null {
  const map = load();
  return map[wallet.toLowerCase()] ?? null;
}

export function totalEligibleWallets(): number {
  return Object.keys(load()).length;
}

// Eager load called at startup so a missing/malformed eligibility.json
// surfaces immediately instead of as a per-request 500.
export function loadEligibility(): void {
  load();
}
