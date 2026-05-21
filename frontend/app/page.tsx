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
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 relative overflow-hidden">

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-20 pointer-events-none" />

      {/* Glass card */}
      <div className="relative z-10 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-10 flex flex-col items-center gap-6 w-full max-w-md mx-4 shadow-2xl">

        {/* Logo / icon */}
       <div className="w-16 h-16 rounded-full overflow-hidden">
  <img src="/shmonad-icon.png" alt="shMonad" className="w-full h-full object-cover" />
</div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">shMonad Wrapped</h1>
          <p className="text-white/40 text-sm">Your on-chain story, visualized.</p>
        </div>

        {/* Input */}
        <div className="w-full flex flex-col gap-2">
          <input
            type="text"
            placeholder="Paste your wallet address (0x...)"
            value={address}
            onChange={(e) => { setAddress(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-purple-500/60 focus:bg-white/8 transition-all text-sm"
          />
          {error && <p className="text-red-400 text-xs px-1">{error}</p>}
        </div>

        {/* Button */}
        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold transition-all text-sm shadow-lg shadow-purple-900/40"
        >
          View My Wrapped →
        </button>

        {/* Footer note */}
        <p className="text-white/20 text-xs">Read-only · No wallet connection needed</p>
      </div>
    </main>
  );
}