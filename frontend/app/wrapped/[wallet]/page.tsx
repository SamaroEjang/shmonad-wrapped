'use client';
import { useState, useEffect, use } from 'react';
import { fetchWrapped, WrappedData } from '@/lib/api';
import { SlideContainer } from '@/components/slides/SlideContainer';

export default function WrappedPage({ params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = use(params);
  const [data, setData] = useState<WrappedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWrapped(wallet)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [wallet]);

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
  return <SlideContainer data={data} />;
}

