import { WrappedData } from '@/lib/api';
import { SlideFrame } from './SlideFrame';

export function StatsSlide({ data }: { data: WrappedData }) {
  const stats = [
    { label: 'Days Holding', value: data.totalDaysHolding },
    { label: 'Current Balance', value: `${parseFloat(data.currentBalance).toFixed(1)} shMON` },
    { label: 'Peak Balance', value: `${data.peakBalance} shMON` },
    { label: 'Total Points', value: data.totalPoints.toLocaleString() },
    { label: 'Protocols Used', value: data.protocolCount },
    { label: 'Transactions', value: data.totalTransactions },
  ];

  return (
    <SlideFrame
      eyebrow="ANALYTICS OVERVIEW"
      title="Read your"
      accent="staking signal."
      description="A compact look at how long you held, how large your position got, and how much on-chain activity shaped your year."
    >
      <div className="font-mono text-[10px] md:text-xs bg-white/7 px-3 md:px-4 py-1.5 md:py-2 rounded-full inline-block mb-3 md:mb-4 tracking-wider">
        YOUR STATS
      </div>

      <h2 className="text-2xl md:text-3xl font-semibold mb-4 md:mb-6 tracking-tight">By The Numbers</h2>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white/6 border border-white/8 rounded-xl md:rounded-2xl p-3 md:p-4 backdrop-blur-sm">
            <p className="text-[10px] md:text-xs text-white/50 mb-1 font-mono uppercase tracking-wider">{stat.label}</p>
            <p className="text-lg md:text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </SlideFrame>
  );
}
