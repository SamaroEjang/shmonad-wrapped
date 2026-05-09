import { createPublicClient, http, parseAbiItem } from 'viem';
import { db } from '../db/client';
import { processTransferBatch } from './processor';
import 'dotenv/config';

const SHMONAD_ADDRESS = process.env.SHMONAD_ADDRESS as `0x${string}`;
const RPC_URL = process.env.MONAD_RPC_URL!;
const DEPLOY_BLOCK = BigInt(process.env.DEPLOY_BLOCK || "0");
const BLOCK_BATCH_SIZE = 100n;
const POLL_INTERVAL_MS = 5000;

const client = createPublicClient({ transport: http(RPC_URL) });

const TRANSFER_ABI = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)'
);

async function getLastIndexedBlock(): Promise<bigint> {
  const res = await db.query('SELECT last_block FROM indexer_state WHERE id = 1');
  return BigInt(res.rows[0].last_block);
}

async function setLastIndexedBlock(block: bigint) {
  await db.query('UPDATE indexer_state SET last_block = $1 WHERE id = 1',
    [block.toString()]);
}

async function fetchBlockTimestamp(blockNumber: bigint): Promise<Date> {
  const block = await client.getBlock({ blockNumber });
  return new Date(Number(block.timestamp) * 1000);
}

export async function runIndexer() {
  console.log('Indexer starting...');
  while (true) {
    try {
      const lastBlock = await getLastIndexedBlock();
      const latestBlock = await client.getBlockNumber();
      const fromBlock = lastBlock === 0n ? DEPLOY_BLOCK : lastBlock + 1n;

      if (fromBlock > latestBlock) {
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
        continue;
      }

      const toBlock = fromBlock + BLOCK_BATCH_SIZE < latestBlock
        ? fromBlock + BLOCK_BATCH_SIZE : latestBlock;

      console.log(`Indexing blocks ${fromBlock} → ${toBlock}`);

      const logs = await client.getLogs({
        address: SHMONAD_ADDRESS,
        event: TRANSFER_ABI,
        fromBlock, toBlock,
      });

      if (logs.length > 0)
        await processTransferBatch(logs, fetchBlockTimestamp);

      await setLastIndexedBlock(toBlock);
    } catch (err) {
      console.error('Indexer error:', err);
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    }
  }
}