import 'dotenv/config';

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



