'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { fetchWrapped, WrappedData } from '@/lib/api';
import { SlideContainer } from '@/components/slides/SlideContainer';

export default function WrappedPage({ params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = use(params);
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [data, setData] = useState<WrappedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const mismatched =
    isConnected && !!address && address.toLowerCase() !== wallet.toLowerCase();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setData(null);
    fetchWrapped(wallet, controller.signal)
      .then((d) => {
        if (controller.signal.aborted) return;
        setData(d);
      })
      .catch((e: Error) => {
        if (controller.signal.aborted || e.name === 'AbortError') return;
        setError(e.message);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
      });
    return () => controller.abort();
  }, [wallet]);

  useEffect(() => {
    if (!mismatched || !address) return;
    const timer = setTimeout(() => {
      router.replace(`/wrapped/${address}`);
    }, 1200);
    return () => clearTimeout(timer);
  }, [mismatched, address, router]);

  if (mismatched) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-white text-lg md:text-xl">Wallet switched.</p>
      <p className="text-white/60 text-sm md:text-base">
        Loading your Wrapped for{' '}
        <span className="font-mono">{address?.slice(0, 6)}…{address?.slice(-4)}</span>…
      </p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white text-xl animate-pulse">Loading your Wrapped...</p>
    </div>
  );
  if (!data || error) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-red-400 text-xl">{error || "No data found"}</p>
    </div>
  );
  return <SlideContainer key={data.wallet} data={data} />;
}
