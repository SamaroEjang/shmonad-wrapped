'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected && address) router.push(`/wrapped/${address}`);
  }, [isConnected, address]);

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <div className="text-6xl mb-4">⬡</div>
        <h1 className="text-5xl font-black text-white mb-2">shMonad Wrapped</h1>
        <p className="text-white/50 text-lg">Your on-chain story, visualized.</p>
      </div>
      <ConnectButton />
    </main>
  );
}