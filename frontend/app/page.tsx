'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = address.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      setError('Please enter a valid Ethereum address (0x...)');
      return;
    }
    setError('');
    router.push(`/wrapped/${trimmed}`);
  };

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <div className="text-6xl mb-4">⬡</div>
        <h1 className="text-5xl font-black text-white mb-2">shMonad Wrapped</h1>
        <p className="text-white/50 text-lg">Your on-chain story, visualized.</p>
      </div>

      <div className="flex flex-col items-center gap-3 w-full max-w-md px-4">
        <input
          type="text"
          placeholder="Paste your wallet address (0x...)"
          value={address}
          onChange={(e) => { setAddress(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 text-sm"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors"
        >
          View My Wrapped →
        </button>
      </div>

      <p className="text-white/20 text-xs">Read-only · No wallet connection needed</p>
    </main>
  );
}
