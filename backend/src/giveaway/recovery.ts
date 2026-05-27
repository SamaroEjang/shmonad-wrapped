import { db } from '../db/client';
import { getTransferState } from './distributor';
import type { Hash } from 'viem';

// Pending rows deleted only if older than this — protects in-flight requests.
const PENDING_DELETE_AGE_SECONDS = 300;

// A tx classified as 'dropped' is only honored as dropped if it was broadcast
// at least this many seconds ago. Multi-RPC mempool propagation lag can
// briefly throw TransactionNotFoundError; long mempool sits at low gas can
// also surface as 'dropped' on a node that lost its mempool — we need a
// generous threshold here to avoid wiping legitimately-pending txs.
const DROPPED_MIN_AGE_SECONDS = 300;

// Periodic recovery interval. Catches runtime-orphaned rows without requiring
// a process restart.
const PERIODIC_INTERVAL_MS = 60_000;

let periodicTimer: ReturnType<typeof setInterval> | null = null;
let inFlight = false;

export async function recoverClaims() {
  if (inFlight) return; // Skip overlapping runs.
  inFlight = true;
  try {
    await sweepStalePending();
    await reconcileBroadcastRows();
  } finally {
    inFlight = false;
  }
}

export function startPeriodicRecovery() {
  if (periodicTimer) return;
  periodicTimer = setInterval(() => {
    recoverClaims().catch(err => console.error('Periodic recovery failed:', err));
  }, PERIODIC_INTERVAL_MS);
  // Don't keep the process alive solely for this timer.
  periodicTimer.unref?.();
}

async function sweepStalePending() {
  try {
    const dropped = await db.query(
      `DELETE FROM claims
       WHERE status = 'pending'
         AND tx_hash IS NULL
         AND created_at < NOW() - ($1::int * INTERVAL '1 second')
       RETURNING wallet`,
      [PENDING_DELETE_AGE_SECONDS]
    );
    if (dropped.rowCount && dropped.rowCount > 0) {
      console.log(`Recovery: dropped ${dropped.rowCount} stale pending claim(s)`);
    }
  } catch (err) {
    console.error('Recovery: failed to drop stale pending claims:', err);
  }
}

async function reconcileBroadcastRows() {
  let broadcast;
  try {
    broadcast = await db.query(
      `SELECT wallet, tx_hash, broadcast_at
       FROM claims
       WHERE status = 'broadcast' AND tx_hash IS NOT NULL`
    );
  } catch (err) {
    console.error('Recovery: failed to list broadcast claims:', err);
    return;
  }

  for (const row of broadcast.rows) {
    const txHash = row.tx_hash as Hash;
    const broadcastAt: Date | null = row.broadcast_at;
    let state;
    try {
      state = await getTransferState(txHash);
    } catch (err) {
      console.warn(`Recovery: RPC error checking ${txHash} for ${row.wallet}; will retry next cycle:`, err);
      continue;
    }

    if (state === 'dropped') {
      // No broadcast_at recorded → assume the row is too new to act on
      // (defensive against data-integrity issues). Otherwise honor the age gate.
      if (!broadcastAt) continue;
      const ageSec = (Date.now() - broadcastAt.getTime()) / 1000;
      if (ageSec < DROPPED_MIN_AGE_SECONDS) continue;
    }

    try {
      if (state === 'success') {
        await db.query(
          `UPDATE claims
           SET status = 'confirmed', confirmed_at = NOW()
           WHERE wallet = $1 AND status = 'broadcast' AND tx_hash = $2`,
          [row.wallet, txHash]
        );
        console.log(`Recovery: confirmed claim for ${row.wallet} (${txHash})`);
      } else if (state === 'reverted' || state === 'dropped') {
        await db.query(
          `DELETE FROM claims
           WHERE wallet = $1 AND status = 'broadcast' AND tx_hash = $2`,
          [row.wallet, txHash]
        );
        console.log(`Recovery: removed ${state} claim for ${row.wallet} (${txHash})`);
      }
    } catch (err) {
      console.error(`Recovery: DB error updating ${row.wallet}:`, err);
    }
  }
}
