'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { WrappedData, EligibilityResponse, fetchEligibility, postClaim } from '@/lib/api';

const EXPLORER_BASE = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://testnet.monadexplorer.com';

type ClaimSlideProps = {
  data: WrappedData;
  sharedOnX: boolean;
};

type ClaimState =
  | { kind: 'idle' }
  | { kind: 'signing' }
  | { kind: 'submitting' }
  | { kind: 'pending'; txHash?: string }
  | { kind: 'confirmed'; txHash: string }
  | { kind: 'lost'; txHash?: string }
  | { kind: 'unreachable' }
  | { kind: 'error'; message: string };

const WEI_PER_HMON = BigInt('1000000000000000000');
const ZERO = BigInt(0);

function formatHmon(weiString: string): string {
  try {
    const wei = BigInt(weiString);
    if (wei === ZERO) return '0';
    const whole = wei / WEI_PER_HMON;
    const frac = wei % WEI_PER_HMON;
    if (frac === ZERO) return whole.toString();

    const fracStr = frac.toString().padStart(18, '0');
    if (whole > ZERO) {
      const trimmed = fracStr.slice(0, 4).replace(/0+$/, '');
      return trimmed ? `${whole.toString()}.${trimmed}` : whole.toString();
    }
    // For sub-1 amounts, show up to 4 significant digits after the first non-zero.
    const firstNonZero = fracStr.search(/[1-9]/);
    if (firstNonZero === -1) return '0';
    const end = Math.min(firstNonZero + 4, 18);
    const sig = fracStr.slice(0, end).replace(/0+$/, '');
    return sig ? `0.${sig}` : '0';
  } catch {
    return weiString;
  }
}

export function ClaimSlide({ data, sharedOnX }: ClaimSlideProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const [eligibility, setEligibility] = useState<EligibilityResponse | null>(null);
  const [loadingEligibility, setLoadingEligibility] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [claimState, setClaimState] = useState<ClaimState>({ kind: 'idle' });

  const refreshEligibility = useCallback(
    async (wallet: string, signal?: AbortSignal) => {
      const res = await fetchEligibility(wallet, signal);
      if (signal?.aborted) return res;
      setEligibility(res);
      setClaimState((prev) => {
        // Never stomp user-driven transient states.
        if (prev.kind === 'signing' || prev.kind === 'submitting') return prev;
        if (prev.kind === 'confirmed') return prev;

        if (res.alreadyClaimed && res.txHash) {
          return { kind: 'confirmed', txHash: res.txHash };
        }
        if (res.status === 'broadcast' && res.txHash) {
          return { kind: 'pending', txHash: res.txHash };
        }
        // Only transition pending → lost when the backend says definitively
        // 'no row exists' (status:null). status='pending' means a lock is
        // still held by another in-flight request — keep waiting.
        if (prev.kind === 'pending' && res.status === null) {
          return { kind: 'lost', txHash: prev.txHash };
        }
        return prev;
      });
      return res;
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoadingEligibility(true);
    setFetchError(null);
    refreshEligibility(data.wallet, controller.signal)
      .catch((err: Error) => {
        if (controller.signal.aborted || err.name === 'AbortError') return;
        setEligibility(null);
        setFetchError(err.message || 'Could not check eligibility');
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoadingEligibility(false);
      });
    return () => controller.abort();
  }, [data.wallet, refreshEligibility]);

  // Poll while pending. Backoff on consecutive failures, cap attempts, and
  // serialize in-flight requests so we don't pile up on a degraded backend.
  const pollInFlightRef = useRef(false);
  useEffect(() => {
    if (claimState.kind !== 'pending') return;

    const controller = new AbortController();
    let consecutiveFailures = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const MAX_FAILURES = 15;
    const BASE_MS = 4000;
    const MAX_DELAY_MS = 30_000;

    const schedule = () => {
      const delay = Math.min(BASE_MS * Math.pow(1.5, consecutiveFailures), MAX_DELAY_MS);
      timeoutId = setTimeout(tick, delay);
    };

    const tick = async () => {
      if (controller.signal.aborted) return;
      if (pollInFlightRef.current) {
        schedule();
        return;
      }
      pollInFlightRef.current = true;
      try {
        await refreshEligibility(data.wallet, controller.signal);
        consecutiveFailures = 0;
      } catch (err) {
        if (controller.signal.aborted || (err as Error).name === 'AbortError') return;
        consecutiveFailures += 1;
      } finally {
        pollInFlightRef.current = false;
        if (controller.signal.aborted) return;
        if (consecutiveFailures >= MAX_FAILURES) {
          setClaimState((prev) =>
            prev.kind === 'pending' ? { kind: 'unreachable' } : prev
          );
          return;
        }
        schedule();
      }
    };

    schedule();
    return () => {
      controller.abort();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [claimState.kind, data.wallet, refreshEligibility]);

  const walletMatches =
    isConnected &&
    connectedAddress?.toLowerCase() === data.wallet.toLowerCase();

  // Tie any in-flight POST /api/claim to the component lifecycle so a wallet
  // switch / unmount cancels the pending request instead of letting setState
  // fire on a stale component.
  const claimAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    return () => {
      claimAbortRef.current?.abort();
    };
  }, []);

  async function handleClaim() {
    if (!eligibility?.claimable || !walletMatches || !connectedAddress) return;
    claimAbortRef.current?.abort();
    const controller = new AbortController();
    claimAbortRef.current = controller;
    setClaimState({ kind: 'signing' });
    try {
      const amount = BigInt(eligibility.claimable);
      const signature = await signTypedDataAsync({
        domain: eligibility.domain,
        types: {
          Claim: [
            { name: 'wallet', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
        },
        primaryType: 'Claim',
        message: {
          wallet: connectedAddress,
          amount,
        },
      });
      if (controller.signal.aborted) return;

      setClaimState({ kind: 'submitting' });
      const { ok, status, body } = await postClaim(connectedAddress, signature, controller.signal);
      if (controller.signal.aborted) return;

      if (!body) {
        setClaimState({
          kind: 'error',
          message: `Server returned ${status} with no readable response. Try again shortly.`,
        });
        return;
      }

      if (ok && 'status' in body) {
        if (body.status === 'confirmed' && body.txHash) {
          setClaimState({ kind: 'confirmed', txHash: body.txHash });
        } else {
          setClaimState({ kind: 'pending', txHash: body.txHash ?? undefined });
        }
        return;
      }
      // PostBroadcastError or other error-with-txHash: tx may be on chain.
      // Surface as pending so the user sees the tx hash; polling will catch up.
      if ('txHash' in body && body.txHash) {
        setClaimState({ kind: 'pending', txHash: body.txHash });
        return;
      }
      const errMsg = 'error' in body && typeof body.error === 'string'
        ? body.error
        : `Claim failed (HTTP ${status})`;
      setClaimState({ kind: 'error', message: errMsg });
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof Error && err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Signing rejected';
      setClaimState({ kind: 'error', message });
    }
  }

  return (
    <div className="min-h-full grid grid-cols-1 md:grid-cols-2 items-center text-white relative">
      <div className="absolute top-4 left-4 md:top-8 md:left-8 font-mono text-[10px] md:text-xs tracking-widest text-white/30 uppercase">
        REWARD DISPATCH
      </div>

      <div className="hidden md:block"></div>

      <div className="flex flex-col items-center justify-center p-4 md:p-8 md:pr-16">
        <div
          className="w-full max-w-md"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '32px',
            padding: '24px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {loadingEligibility ? (
            <div className="py-10 text-center text-white/60 text-sm animate-pulse">
              Checking eligibility…
            </div>
          ) : fetchError ? (
            <FetchErrorCard message={fetchError} />
          ) : !eligibility?.eligible ? (
            <IneligibleCard data={data} />
          ) : (
            <EligibleCard
              eligibility={eligibility}
              isConnected={isConnected}
              walletMatches={walletMatches}
              sharedOnX={sharedOnX}
              claimState={claimState}
              onClaim={handleClaim}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function FetchErrorCard({ message }: { message: string }) {
  return (
    <>
      <div className="font-mono text-[10px] md:text-xs bg-red-500/10 text-red-200 px-3 md:px-4 py-1.5 md:py-2 rounded-full inline-block mb-3 md:mb-4 tracking-wider">
        TEMPORARY ISSUE
      </div>
      <h2 className="text-2xl md:text-3xl font-semibold mb-2 tracking-tight">
        Couldn&apos;t check eligibility
      </h2>
      <p className="text-white/60 text-sm md:text-base mb-4 break-words">
        {message}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="w-full px-5 py-3 rounded-full font-medium transition-all text-sm md:text-base"
        style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
      >
        Try again
      </button>
    </>
  );
}

function IneligibleCard({ data }: { data: WrappedData }) {
  return (
    <>
      <div className="font-mono text-[10px] md:text-xs bg-white/5 px-3 md:px-4 py-1.5 md:py-2 rounded-full inline-block mb-3 md:mb-4 tracking-wider">
        GIVEAWAY STATUS
      </div>
      <h2 className="text-2xl md:text-3xl font-semibold mb-2 tracking-tight">
        Not eligible this round
      </h2>
      <p className="text-white/60 text-sm md:text-base mb-4 md:mb-5">
        This round of the hMON giveaway was for a snapshot of holders. Here&apos;s your shMonad
        journey so far — stay tuned for the next round.
      </p>

      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <RecapStat label="Conviction" value={String(data.convictionScore)} />
        <RecapStat
          label="Days holding"
          value={String(data.totalDaysHolding)}
        />
        <RecapStat
          label="Total points"
          value={data.totalPoints.toLocaleString()}
        />
        <RecapStat
          label="Protocols used"
          value={String(data.protocolCount)}
        />
      </div>
    </>
  );
}

function RecapStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm">
      <p className="text-[10px] md:text-xs text-white/50 mb-1 font-mono uppercase tracking-wider">
        {label}
      </p>
      <p className="text-base md:text-lg font-bold">{value}</p>
    </div>
  );
}

type EligibleCardProps = {
  eligibility: EligibilityResponse;
  isConnected: boolean;
  walletMatches: boolean;
  sharedOnX: boolean;
  claimState: ClaimState;
  onClaim: () => void;
};

function EligibleCard({
  eligibility,
  isConnected,
  walletMatches,
  sharedOnX,
  claimState,
  onClaim,
}: EligibleCardProps) {
  const amountDisplay = eligibility.claimable
    ? `${formatHmon(eligibility.claimable)} hMON`
    : '— hMON';

  return (
    <>
      <div className="font-mono text-[10px] md:text-xs bg-white/5 px-3 md:px-4 py-1.5 md:py-2 rounded-full inline-block mb-3 md:mb-4 tracking-wider">
        🎁 YOUR REWARD
      </div>
      <h2 className="text-2xl md:text-3xl font-semibold mb-2 tracking-tight">
        You qualified
      </h2>
      <div className="bg-white/5 rounded-2xl md:rounded-3xl p-5 md:p-6 mb-4 md:mb-5 text-center backdrop-blur-sm">
        <p className="text-3xl md:text-5xl font-bold mb-1">{amountDisplay}</p>
        <p className="text-[10px] md:text-xs text-white/50 font-mono">CLAIMABLE</p>
      </div>

      {claimState.kind === 'confirmed' ? (
        <ConfirmedState txHash={claimState.txHash} />
      ) : claimState.kind === 'pending' ? (
        <PendingState txHash={claimState.txHash} />
      ) : claimState.kind === 'lost' ? (
        <LostState
          txHash={claimState.txHash}
          onRetry={onClaim}
          sharedOnX={sharedOnX}
          walletMatches={walletMatches}
          isConnected={isConnected}
        />
      ) : claimState.kind === 'unreachable' ? (
        <UnreachableState />
      ) : (
        <ClaimAction
          isConnected={isConnected}
          walletMatches={walletMatches}
          sharedOnX={sharedOnX}
          claimState={claimState}
          onClaim={onClaim}
        />
      )}
    </>
  );
}

function ClaimAction({
  isConnected,
  walletMatches,
  sharedOnX,
  claimState,
  onClaim,
}: {
  isConnected: boolean;
  walletMatches: boolean;
  sharedOnX: boolean;
  claimState: ClaimState;
  onClaim: () => void;
}) {
  if (!isConnected) {
    return (
      <div className="flex flex-col items-stretch gap-3">
        <p className="text-xs md:text-sm text-white/60 text-center">
          Connect the wallet you searched to sign your claim.
        </p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (!walletMatches) {
    return (
      <p className="text-amber-300/90 text-xs md:text-sm text-center">
        Switching wallets…
      </p>
    );
  }

  const busy = claimState.kind === 'signing' || claimState.kind === 'submitting';

  return (
    <div className="flex flex-col items-stretch gap-3">
      {!sharedOnX && (
        <p className="text-xs md:text-sm text-white/60 text-center">
          Share on X below to unlock the Claim button.
        </p>
      )}
      <button
        onClick={onClaim}
        disabled={!sharedOnX || busy}
        className="w-full px-5 py-3 rounded-full font-semibold transition-all text-sm md:text-base disabled:cursor-not-allowed"
        style={{
          backgroundColor: sharedOnX && !busy ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
          color: sharedOnX && !busy ? '#030407' : 'rgba(255,255,255,0.5)',
        }}
      >
        {claimState.kind === 'signing'
          ? 'WAITING FOR SIGNATURE…'
          : claimState.kind === 'submitting'
            ? 'CONFIRMING ON-CHAIN…'
            : 'CLAIM hMON'}
      </button>
      {claimState.kind === 'error' && (
        <p className="text-red-400/90 text-xs md:text-sm text-center break-words">
          {claimState.message}
        </p>
      )}
    </div>
  );
}

function ConfirmedState({ txHash }: { txHash: string }) {
  return (
    <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-4 text-center">
      <p className="text-emerald-300 font-semibold text-sm md:text-base mb-2">
        Reward sent ✓
      </p>
      <a
        href={`${EXPLORER_BASE}/tx/${txHash}`}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-[10px] md:text-xs text-white/70 underline break-all"
      >
        {txHash.slice(0, 10)}…{txHash.slice(-8)}
      </a>
    </div>
  );
}

function PendingState({ txHash }: { txHash?: string }) {
  return (
    <div className="bg-white/5 rounded-2xl p-4 text-center">
      <p className="text-white/80 font-medium text-sm md:text-base mb-1 animate-pulse">
        Transaction pending…
      </p>
      {txHash && (
        <a
          href={`${EXPLORER_BASE}/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[10px] md:text-xs text-white/50 underline break-all"
        >
          {txHash.slice(0, 10)}…{txHash.slice(-8)}
        </a>
      )}
    </div>
  );
}

function LostState({
  txHash,
  onRetry,
  sharedOnX,
  walletMatches,
  isConnected,
}: {
  txHash?: string;
  onRetry: () => void;
  sharedOnX: boolean;
  walletMatches: boolean;
  isConnected: boolean;
}) {
  const canRetry = sharedOnX && walletMatches;
  let hint: string | null = null;
  if (!isConnected) hint = 'Reconnect your wallet to retry.';
  else if (!walletMatches) hint = 'Switch to the wallet you searched to retry.';
  else if (!sharedOnX) hint = 'Share on X below to unlock the retry button.';

  return (
    <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4 text-center flex flex-col gap-3">
      <p className="text-amber-200 font-semibold text-sm md:text-base">
        Couldn&apos;t confirm your claim
      </p>
      <p className="text-white/60 text-xs md:text-sm">
        The server lost track of this claim. Check the transaction on the explorer
        and retry below if it didn&apos;t land.
      </p>
      {txHash && (
        <a
          href={`${EXPLORER_BASE}/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[10px] md:text-xs text-white/70 underline break-all"
        >
          {txHash.slice(0, 10)}…{txHash.slice(-8)}
        </a>
      )}
      <button
        onClick={onRetry}
        disabled={!canRetry}
        className="w-full px-5 py-2.5 rounded-full font-medium transition-all text-xs md:text-sm disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
      >
        Try again
      </button>
      {hint && (
        <p className="text-[10px] md:text-xs text-white/50">{hint}</p>
      )}
    </div>
  );
}

function UnreachableState() {
  return (
    <div className="bg-white/5 rounded-2xl p-4 text-center flex flex-col gap-3">
      <p className="text-white/80 font-medium text-sm md:text-base">
        Couldn&apos;t reach the server
      </p>
      <p className="text-white/50 text-xs md:text-sm">
        Your transaction may still be in flight. Refresh in a moment to check.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="w-full px-5 py-2.5 rounded-full font-medium transition-all text-xs md:text-sm"
        style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
      >
        Refresh
      </button>
    </div>
  );
}
