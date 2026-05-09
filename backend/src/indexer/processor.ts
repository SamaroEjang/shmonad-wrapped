import { db } from '../db/client';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

type TimestampFetcher = (block: bigint) => Promise<Date>;

export async function processTransferBatch(
  logs: any[],
  getTimestamp: TimestampFetcher
) {
  const blockNumbers = [...new Set(logs.map((l: any) => l.blockNumber))];
  const timestamps = new Map<bigint, Date>();
  await Promise.all(
    blockNumbers.map(async (bn: any) => {
      timestamps.set(bn, await getTimestamp(bn));
    })
  );

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const log of logs) {
      const from = log.args?.from as string;
      const to = log.args?.to as string;
      const value = BigInt(log.args?.value ?? 0);

      const blockTimestamp = timestamps.get(log.blockNumber)!;
      const blockNumber = Number(log.blockNumber);

      await client.query(
        `INSERT INTO transfer_events
           (block_number, block_timestamp, tx_hash, log_index, from_address, to_address, amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (tx_hash, log_index) DO NOTHING`,
        [blockNumber, blockTimestamp, log.transactionHash, log.logIndex,
         from.toLowerCase(), to.toLowerCase(), value.toString()]
      );

      const affected: { wallet: string; delta: bigint }[] = [];
      if (from.toLowerCase() !== ZERO_ADDRESS)
        affected.push({ wallet: from.toLowerCase(), delta: -value });
      if (to.toLowerCase() !== ZERO_ADDRESS)
        affected.push({ wallet: to.toLowerCase(), delta: value });

      for (const { wallet, delta } of affected) {
        const prev = await client.query(
          `SELECT balance FROM balance_snapshots WHERE wallet = $1
           ORDER BY block_number DESC, id DESC LIMIT 1`,
          [wallet]
        );
        const prevBal = prev.rows.length > 0 ? BigInt(prev.rows[0].balance) : 0n;
        const newBal = prevBal + delta;
        await client.query(
          `INSERT INTO balance_snapshots (wallet, block_number, block_timestamp, balance)
           VALUES ($1,$2,$3,$4)`,
          [wallet, blockNumber, blockTimestamp, newBal.toString()]
        );
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
