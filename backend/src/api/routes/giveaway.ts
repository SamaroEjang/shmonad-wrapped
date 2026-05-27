import { FastifyInstance } from 'fastify';
import { getAddress, isAddress, type Hash } from 'viem';
import { db } from '../../db/client';
import { getEligibility } from '../../giveaway/eligibility';
import { verifyClaimSignature } from '../../giveaway/signature';
import {
  signTransfer,
  sendSignedTransfer,
  waitForTransferReceipt,
  getTransferState,
  getChainId,
  getDistributorAddress,
} from '../../giveaway/distributor';
import { enqueue } from '../../giveaway/queue';

const CAMPAIGN_NAME = process.env.GIVEAWAY_CAMPAIGN_NAME || 'shMonad Wrapped Giveaway';

// Multi-RPC mempool propagation can briefly throw TransactionNotFoundError
// for a freshly broadcast tx. Don't honor 'dropped' until the tx has had
// time to fully propagate.
const DROPPED_MIN_AGE_SECONDS = 300;

type ClaimRow = {
  wallet: string;
  amount: string;
  tx_hash: string | null;
  status: 'pending' | 'broadcast' | 'confirmed';
  broadcast_at: Date | null;
};

class PostBroadcastError extends Error {
  constructor(public readonly txHash: Hash, public readonly cause: unknown) {
    super(`Tx ${txHash} broadcast but DB persistence failed: ${cause}`);
    this.name = 'PostBroadcastError';
  }
}

async function readClaim(wallet: string): Promise<ClaimRow | null> {
  const res = await db.query<ClaimRow>(
    `SELECT wallet, amount, tx_hash, status, broadcast_at FROM claims WHERE wallet = $1`,
    [wallet]
  );
  return res.rows[0] ?? null;
}

async function deletePendingLock(wallet: string): Promise<boolean> {
  const res = await db.query(
    `DELETE FROM claims WHERE wallet = $1 AND status = 'pending' AND tx_hash IS NULL`,
    [wallet]
  );
  return (res.rowCount ?? 0) === 1;
}

async function deleteBroadcastClaim(wallet: string, txHash: Hash): Promise<boolean> {
  const res = await db.query(
    `DELETE FROM claims WHERE wallet = $1 AND status = 'broadcast' AND tx_hash = $2`,
    [wallet, txHash]
  );
  return (res.rowCount ?? 0) === 1;
}

// Idempotently record that a tx has been broadcast for this wallet. Used both
// in the happy path AND to restore the lock if the original pending row was
// deleted concurrently (e.g. by recovery). After this returns, the row exists
// in 'broadcast' or 'confirmed' state — guaranteeing replay protection.
async function ensureBroadcastRecord(
  wallet: string,
  amount: bigint,
  txHash: Hash
): Promise<void> {
  // Try the happy path first: update the lock row from pending to broadcast.
  const upd = await db.query(
    `UPDATE claims
     SET status = 'broadcast', tx_hash = $2, broadcast_at = NOW()
     WHERE wallet = $1 AND status = 'pending'
     RETURNING wallet`,
    [wallet, txHash]
  );
  if ((upd.rowCount ?? 0) === 1) return;

  // Lock row was deleted under us OR has already advanced. Restore the
  // invariant by inserting a fresh broadcast row (preserving any more advanced
  // state via ON CONFLICT DO UPDATE that only steps forward).
  await db.query(
    `INSERT INTO claims (wallet, amount, status, tx_hash, broadcast_at)
     VALUES ($1, $2, 'broadcast', $3, NOW())
     ON CONFLICT (wallet) DO UPDATE
       SET tx_hash = COALESCE(claims.tx_hash, EXCLUDED.tx_hash),
           status = CASE
             WHEN claims.status = 'confirmed' THEN claims.status
             ELSE EXCLUDED.status
           END,
           broadcast_at = COALESCE(claims.broadcast_at, EXCLUDED.broadcast_at)`,
    [wallet, amount.toString(), txHash]
  );
}

// Idempotently record that a tx has been confirmed. Restores the lock row if
// it was deleted by a concurrent path while we held the broadcast tx hash.
async function ensureConfirmedRecord(
  wallet: string,
  amount: bigint,
  txHash: Hash
): Promise<void> {
  const upd = await db.query(
    `UPDATE claims
     SET status = 'confirmed', confirmed_at = NOW(), tx_hash = $2
     WHERE wallet = $1 AND status IN ('pending', 'broadcast')
     RETURNING wallet`,
    [wallet, txHash]
  );
  if ((upd.rowCount ?? 0) === 1) return;

  await db.query(
    `INSERT INTO claims (wallet, amount, status, tx_hash, broadcast_at, confirmed_at)
     VALUES ($1, $2, 'confirmed', $3, NOW(), NOW())
     ON CONFLICT (wallet) DO UPDATE
       SET status = 'confirmed',
           tx_hash = COALESCE(claims.tx_hash, EXCLUDED.tx_hash),
           confirmed_at = COALESCE(claims.confirmed_at, EXCLUDED.confirmed_at)`,
    [wallet, amount.toString(), txHash]
  );
}

export async function giveawayRoutes(server: FastifyInstance) {
  server.get('/api/eligibility/:wallet', async (request, reply) => {
    const { wallet } = request.params as { wallet: string };
    if (!isAddress(wallet)) return reply.status(400).send({ error: 'Invalid wallet' });
    const w = wallet.toLowerCase();

    let entry, claim, chainId, distributorAddress;
    try {
      entry = getEligibility(w);
      claim = await readClaim(w);
      chainId = await getChainId();
      distributorAddress = getDistributorAddress();
    } catch (err) {
      request.log.error({ err }, 'eligibility lookup failed');
      return reply.status(503).send({ error: 'Eligibility service temporarily unavailable' });
    }

    return reply.send({
      wallet: w,
      eligible: entry !== null,
      claimable: entry?.claimable ?? null,
      points: entry?.points ?? null,
      alreadyClaimed: claim?.status === 'confirmed',
      status: claim?.status ?? null,
      txHash: claim?.tx_hash ?? null,
      domain: {
        name: CAMPAIGN_NAME,
        version: '1',
        chainId,
        verifyingContract: distributorAddress,
      },
    });
  });

  server.post('/api/claim', async (request, reply) => {
    const body = request.body as {
      wallet?: string;
      signature?: string;
    } | undefined;

    if (!body?.wallet || !body?.signature) {
      return reply.status(400).send({ error: 'wallet and signature are required' });
    }
    if (!isAddress(body.wallet)) {
      return reply.status(400).send({ error: 'Invalid wallet' });
    }

    const wallet = body.wallet.toLowerCase();
    const signature = body.signature as `0x${string}`;

    const entry = getEligibility(wallet);

    // Step 1: existing-row state machine. Idempotent retry path.
    const existing = await readClaim(wallet);
    if (existing) {
      if (existing.status === 'confirmed') {
        return reply.send({ status: 'confirmed', txHash: existing.tx_hash });
      }
      if (existing.status === 'broadcast' && existing.tx_hash) {
        let onChain;
        try {
          onChain = await getTransferState(existing.tx_hash as Hash);
        } catch (err) {
          request.log.warn({ err, txHash: existing.tx_hash }, 'transient RPC error');
          return reply.status(503).send({
            error: 'Could not check on-chain status; retry shortly',
            txHash: existing.tx_hash,
          });
        }

        if (onChain === 'dropped') {
          if (!existing.broadcast_at) {
            // Missing broadcast_at on a broadcast row → defensive: refuse to
            // delete, treat as still pending.
            return reply.send({ status: 'broadcast', txHash: existing.tx_hash });
          }
          const ageSec = (Date.now() - existing.broadcast_at.getTime()) / 1000;
          if (ageSec < DROPPED_MIN_AGE_SECONDS) {
            return reply.send({ status: 'broadcast', txHash: existing.tx_hash });
          }
        }

        if (onChain === 'success') {
          // Use existing.amount (the row's recorded amount, on-chain truth)
          // not entry.claimable (the live eligibility list, which may have drifted).
          await ensureConfirmedRecord(wallet, BigInt(existing.amount), existing.tx_hash as Hash);
          return reply.send({ status: 'confirmed', txHash: existing.tx_hash });
        }
        if (onChain === 'reverted' || onChain === 'dropped') {
          await deleteBroadcastClaim(wallet, existing.tx_hash as Hash);
          // Fall through to fresh attempt.
        } else {
          return reply.send({ status: 'broadcast', txHash: existing.tx_hash });
        }
      } else if (existing.status === 'broadcast' && !existing.tx_hash) {
        // Defensive: incoherent state. Refuse to act until operator reconciles.
        request.log.error({ wallet }, 'incoherent claim row: broadcast status with NULL tx_hash');
        return reply.status(503).send({
          error: 'Claim row in inconsistent state; contact support',
        });
      } else if (existing.status === 'pending') {
        return reply.send({ status: 'pending', txHash: null });
      }
    }

    // Step 2: eligibility + signature verification.
    if (!entry) return reply.status(403).send({ error: 'Wallet not eligible' });

    const amount = BigInt(entry.claimable);

    let chainId: number;
    try {
      chainId = await getChainId();
    } catch (err) {
      request.log.error({ err }, 'failed to read chain id');
      return reply.status(503).send({ error: 'Chain not reachable' });
    }

    const sigOk = await verifyClaimSignature({ chainId, wallet, amount, signature });
    if (!sigOk) return reply.status(401).send({ error: 'Invalid signature' });

    // Step 3: atomic lock via INSERT-or-fail.
    let lock;
    try {
      lock = await db.query(
        `INSERT INTO claims (wallet, amount, status)
         VALUES ($1, $2, 'pending')
         ON CONFLICT (wallet) DO NOTHING
         RETURNING wallet`,
        [wallet, amount.toString()]
      );
    } catch (err) {
      request.log.error({ err }, 'claim lock insert failed');
      return reply.status(503).send({ error: 'Database temporarily unavailable' });
    }

    if (!lock.rowCount) {
      const row = await readClaim(wallet);
      if (!row) {
        return reply.status(503).send({
          error: 'Concurrent claim failed mid-flight; retry shortly',
        });
      }
      return reply.send({
        status: row.status,
        txHash: row.tx_hash,
      });
    }

    // Step 4: inside queue → sign locally, persist tx_hash, then broadcast.
    // Signing inside the queue serializes nonce assignment; persisting BEFORE
    // sendRawTransaction means a broadcast failure can never produce an
    // on-chain tx the DB doesn't know about.
    const checksumWallet = getAddress(wallet);
    let txHash: Hash;
    try {
      txHash = await enqueue(async () => {
        const { serializedTx, txHash: hash } = await signTransfer(checksumWallet, amount);
        try {
          await ensureBroadcastRecord(wallet, amount, hash);
        } catch (dbErr) {
          // DB failed but nothing has been broadcast — safe to surface as a
          // pre-broadcast failure (route catch will release the lock).
          throw dbErr;
        }
        try {
          await sendSignedTransfer(serializedTx);
        } catch (broadcastErr) {
          // Tx may or may not have been accepted by the RPC. Row already
          // records the hash; do NOT delete. Recovery / waitForTransferReceipt
          // will reconcile. Surface as PostBroadcastError so the route's catch
          // does not call deletePendingLock.
          throw new PostBroadcastError(hash, broadcastErr);
        }
        return hash;
      });
    } catch (err) {
      if (err instanceof PostBroadcastError) {
        request.log.error(
          { err, wallet, txHash: err.txHash },
          'POST-BROADCAST FAILURE — row recorded; reconciliation will resolve'
        );
        // Even though the broadcast call errored, the row has the tx_hash and
        // recovery will check the chain. Tell the client it's pending.
        return reply.status(202).send({
          status: 'broadcast',
          txHash: err.txHash,
          message: 'Transaction submitted but the RPC response was unclear; refresh shortly.',
        });
      }
      // Pre-broadcast failure (signing, gas estimation, DB write). No tx on
      // chain → release the lock so the user can retry.
      try {
        await deletePendingLock(wallet);
      } catch (cleanupErr) {
        request.log.error({ err: cleanupErr, wallet }, 'failed to release lock after pre-broadcast failure');
      }
      request.log.error({ err, wallet }, 'pre-broadcast failure');
      return reply.status(500).send({
        error: 'Failed to send transaction; please retry shortly.',
      });
    }

    // Step 5: wait for receipt OUTSIDE the queue (parallel-safe).
    const status = await waitForTransferReceipt(txHash, 60_000);

    if (status === 'success') {
      await ensureConfirmedRecord(wallet, amount, txHash);
      return reply.send({ status: 'confirmed', txHash });
    }

    if (status === 'reverted') {
      await deleteBroadcastClaim(wallet, txHash);
      return reply.status(502).send({ error: 'Transaction reverted', txHash });
    }

    return reply.status(202).send({
      status: 'broadcast',
      txHash,
      message: 'Transaction still pending; refresh shortly to check status.',
    });
  });
}
