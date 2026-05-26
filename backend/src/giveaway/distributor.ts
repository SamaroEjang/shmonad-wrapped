import {
  createPublicClient,
  http,
  parseAbi,
  encodeFunctionData,
  keccak256,
  TransactionNotFoundError,
  TransactionReceiptNotFoundError,
  WaitForTransactionReceiptTimeoutError,
  type Hex,
  type Hash,
  type TransactionSerializableEIP1559,
  type TransactionSerializableLegacy,
} from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import 'dotenv/config';

const ERC20_ABI = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
]);

const RPC_URL = process.env.MONAD_RPC_URL!;
const TOKEN_ADDRESS = process.env.HMON_TOKEN_ADDRESS as `0x${string}` | undefined;
const PRIVATE_KEY = process.env.DISTRIBUTOR_PRIVATE_KEY as Hex | undefined;

// Transport timeout bounds every RPC call — prevents recovery & queue
// from hanging indefinitely on an unresponsive node.
const RPC_TIMEOUT_MS = 30_000;
const publicClient = createPublicClient({
  transport: http(RPC_URL, { timeout: RPC_TIMEOUT_MS }),
});

let cachedAccount: PrivateKeyAccount | null = null;
let chainIdPromise: Promise<number> | null = null;

function getAccount(): PrivateKeyAccount {
  if (cachedAccount) return cachedAccount;
  if (!PRIVATE_KEY) throw new Error('DISTRIBUTOR_PRIVATE_KEY is not set');
  cachedAccount = privateKeyToAccount(PRIVATE_KEY);
  return cachedAccount;
}

export function getDistributorAddress(): `0x${string}` {
  return getAccount().address;
}

// Cache the Promise (not the resolved value) so two concurrent first-time
// callers share one in-flight RPC call instead of racing two.
export function getChainId(): Promise<number> {
  if (chainIdPromise) return chainIdPromise;
  chainIdPromise = publicClient.getChainId().catch((err) => {
    chainIdPromise = null; // allow retry on failure
    throw err;
  });
  return chainIdPromise;
}

export type TransferStatus = 'success' | 'reverted' | 'timeout';
export type TransferState = 'success' | 'reverted' | 'pending' | 'dropped';

export interface SignedTransfer {
  txHash: Hash;
  serializedTx: Hex;
}

// Sign locally without broadcasting. Returns the deterministic tx hash so the
// caller can persist it to the DB BEFORE the network sees the tx — the only
// safe ordering for replay-protection.
export async function signTransfer(
  to: `0x${string}`,
  amount: bigint
): Promise<SignedTransfer> {
  if (!TOKEN_ADDRESS) throw new Error('HMON_TOKEN_ADDRESS is not set');
  const account = getAccount();
  const data = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [to, amount],
  });

  const [nonce, gas, chainId, fees] = await Promise.all([
    publicClient.getTransactionCount({ address: account.address, blockTag: 'pending' }),
    publicClient.estimateGas({ account: account.address, to: TOKEN_ADDRESS, data }),
    getChainId(),
    publicClient
      .estimateFeesPerGas()
      .then((f) => ({ ok: true as const, ...f }))
      .catch(() => ({ ok: false as const })),
  ]);

  let txRequest: TransactionSerializableEIP1559 | TransactionSerializableLegacy;
  if (fees.ok && fees.maxFeePerGas !== undefined && fees.maxPriorityFeePerGas !== undefined) {
    txRequest = {
      to: TOKEN_ADDRESS,
      data,
      nonce,
      gas,
      maxFeePerGas: fees.maxFeePerGas,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      chainId,
      type: 'eip1559',
    };
  } else {
    const gasPrice = await publicClient.getGasPrice();
    txRequest = {
      to: TOKEN_ADDRESS,
      data,
      nonce,
      gas,
      gasPrice,
      chainId,
      type: 'legacy',
    };
  }

  const serializedTx = await account.signTransaction(txRequest);
  const txHash = keccak256(serializedTx);
  return { serializedTx, txHash };
}

export async function sendSignedTransfer(serializedTx: Hex): Promise<Hash> {
  return publicClient.sendRawTransaction({ serializedTransaction: serializedTx });
}

export async function waitForTransferReceipt(
  txHash: Hash,
  timeoutMs = 60_000
): Promise<TransferStatus> {
  try {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
      timeout: timeoutMs,
    });
    return receipt.status === 'success' ? 'success' : 'reverted';
  } catch (err) {
    if (err instanceof WaitForTransactionReceiptTimeoutError) return 'timeout';
    console.warn('waitForTransferReceipt non-timeout error:', err);
    return 'timeout';
  }
}

// Distinguishes pending (still in mempool) from dropped (gone). Throws on
// transient RPC errors so callers can surface them as 5xx instead of
// mis-classifying.
export async function getTransferState(txHash: Hash): Promise<TransferState> {
  let tx;
  try {
    tx = await publicClient.getTransaction({ hash: txHash });
  } catch (err) {
    if (err instanceof TransactionNotFoundError) return 'dropped';
    throw err;
  }

  if (tx.blockNumber === null) return 'pending';

  try {
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
    return receipt.status === 'success' ? 'success' : 'reverted';
  } catch (err) {
    if (err instanceof TransactionReceiptNotFoundError) return 'pending';
    throw err;
  }
}
