import { recoverTypedDataAddress, getAddress, isAddressEqual } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const CAMPAIGN_NAME = process.env.GIVEAWAY_CAMPAIGN_NAME || 'shMonad Wrapped Giveaway';

let distributorAddress: `0x${string}` | null = null;

function getDistributorAddress(): `0x${string}` {
  if (distributorAddress) return distributorAddress;
  const pk = process.env.DISTRIBUTOR_PRIVATE_KEY as `0x${string}` | undefined;
  if (!pk) throw new Error('DISTRIBUTOR_PRIVATE_KEY is not set');
  distributorAddress = privateKeyToAccount(pk).address;
  return distributorAddress;
}

export function buildClaimTypedData(params: {
  chainId: number;
  wallet: `0x${string}`;
  amount: bigint;
}) {
  return {
    domain: {
      name: CAMPAIGN_NAME,
      version: '1',
      chainId: params.chainId,
      verifyingContract: getDistributorAddress(),
    },
    types: {
      Claim: [
        { name: 'wallet', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
    },
    primaryType: 'Claim' as const,
    message: {
      wallet: params.wallet,
      amount: params.amount,
    },
  };
}

export async function verifyClaimSignature(params: {
  chainId: number;
  wallet: string;
  amount: bigint;
  signature: `0x${string}`;
}): Promise<boolean> {
  let walletAddr: `0x${string}`;
  try {
    walletAddr = getAddress(params.wallet);
  } catch {
    return false;
  }

  const typedData = buildClaimTypedData({
    chainId: params.chainId,
    wallet: walletAddr,
    amount: params.amount,
  });

  try {
    const recovered = await recoverTypedDataAddress({
      domain: typedData.domain,
      types: typedData.types,
      primaryType: typedData.primaryType,
      message: typedData.message,
      signature: params.signature,
    });
    return isAddressEqual(recovered, walletAddr);
  } catch (err) {
    console.warn('Signature recovery failed:', err);
    return false;
  }
}
