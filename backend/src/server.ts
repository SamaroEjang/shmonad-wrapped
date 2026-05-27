import Fastify from 'fastify';
import cors from '@fastify/cors';
import { isAddress } from 'viem';
import { runIndexer } from './indexer/index';
import { wrappedRoutes } from './api/routes/wrapped';
import { giveawayRoutes } from './api/routes/giveaway';
import { runMigrations } from './db/migrate';
import { recoverClaims, startPeriodicRecovery } from './giveaway/recovery';
import { loadEligibility } from './giveaway/eligibility';
import { getDistributorAddress, getChainId } from './giveaway/distributor';
import 'dotenv/config';

const server = Fastify({ logger: true });

function validateEnv() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set');
  }
  if (!process.env.MONAD_RPC_URL) {
    throw new Error('MONAD_RPC_URL must be set');
  }
  const token = process.env.HMON_TOKEN_ADDRESS;
  if (!token || !isAddress(token) || token === '0x0000000000000000000000000000000000000000') {
    throw new Error('HMON_TOKEN_ADDRESS must be a valid non-zero ERC-20 address');
  }
  const pk = process.env.DISTRIBUTOR_PRIVATE_KEY;
  if (!pk || !/^0x[a-fA-F0-9]{64}$/.test(pk) || /^0x0+$/.test(pk)) {
    throw new Error('DISTRIBUTOR_PRIVATE_KEY must be a non-zero 32-byte hex string');
  }

  const expectedRaw = process.env.EXPECTED_CHAIN_ID;
  if (expectedRaw !== undefined && expectedRaw !== '') {
    if (!/^[0-9]+$/.test(expectedRaw)) {
      throw new Error(
        `EXPECTED_CHAIN_ID must be a positive integer with no prefix/decimals/whitespace; got "${expectedRaw}"`
      );
    }
    const parsed = Number(expectedRaw);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      throw new Error(`EXPECTED_CHAIN_ID out of range; got "${expectedRaw}"`);
    }
  }
}

async function main() {
  validateEnv();
  await runMigrations();
  loadEligibility();
  const distributorAddress = getDistributorAddress();
  const chainId = await getChainId();
  console.log(`Giveaway distributor: ${distributorAddress} on chain ${chainId}`);

  const expectedRaw = process.env.EXPECTED_CHAIN_ID;
  if (expectedRaw) {
    const expected = Number(expectedRaw);
    if (expected !== chainId) {
      console.warn(
        `WARNING: RPC reports chain id ${chainId} but EXPECTED_CHAIN_ID=${expected}. ` +
        `Frontend EIP-712 signatures will fail if the wallet's active chain doesn't match.`
      );
    }
  }

  await server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await server.register(wrappedRoutes);
  await server.register(giveawayRoutes);

  const port = parseInt(process.env.PORT || '3001');
  await server.listen({ port, host: '0.0.0.0' });

  // Background-best-effort jobs.
  recoverClaims().catch(err => console.error('Initial recoverClaims failed:', err));
  startPeriodicRecovery();
  runIndexer().catch(err => console.error('indexer failed:', err));
}

main().catch(err => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
