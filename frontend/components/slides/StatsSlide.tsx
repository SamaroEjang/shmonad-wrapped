import { WrappedData } from '@/lib/api';

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
    <div className="min-h-full grid grid-cols-1 md:grid-cols-2 items-center text-white relative">
      <div className="absolute top-4 left-4 md:top-8 md:left-8 font-mono text-[10px] md:text-xs tracking-widest text-white/30 uppercase">
        ANALYTICS OVERVIEW
      </div>
      
      <div className="hidden md:block"></div>
      
      <div className="flex flex-col items-center justify-center p-4 md:p-8 md:pr-16">
        <div className="w-full max-w-2xl" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '32px',
          padding: '24px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          <div className="font-mono text-[10px] md:text-xs bg-white/5 px-3 md:px-4 py-1.5 md:py-2 rounded-full inline-block mb-3 md:mb-4 tracking-wider">
            YOUR STATS
          </div>
          
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 md:mb-6 tracking-tight">By The Numbers</h2>
          
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 backdrop-blur-sm">
                <p className="text-[10px] md:text-xs text-white/50 mb-1 font-mono uppercase tracking-wider">{stat.label}</p>
                <p className="text-lg md:text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}