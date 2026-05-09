import { WrappedData } from '@/lib/api';

export function ConvictionSlide({ data }: { data: WrappedData }) {
  return (
    <div className="min-h-full grid grid-cols-1 md:grid-cols-2 items-center text-white relative">
      <div className="absolute top-4 left-4 md:top-8 md:left-8 font-mono text-[10px] md:text-xs tracking-widest text-white/30 uppercase">
        COMMITMENT ANALYSIS
      </div>
      
      <div className="hidden md:block"></div>
      
      <div className="flex flex-col items-center justify-center p-4 md:p-8 md:pr-16">
        <div className="w-full max-w-md" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '32px',
          padding: '24px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          <div className="font-mono text-[10px] md:text-xs bg-white/5 px-3 md:px-4 py-1.5 md:py-2 rounded-full inline-block mb-3 md:mb-4 tracking-wider">
            CONVICTION SCORE
          </div>
          
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 md:mb-6 tracking-tight">Your Dedication</h2>
          
          <div className="bg-white/5 rounded-2xl md:rounded-3xl p-6 md:p-8 mb-4 md:mb-5 text-center backdrop-blur-sm">
            <p className="text-5xl md:text-7xl font-bold mb-1">{data.convictionScore}</p>
            <p className="text-[10px] md:text-xs text-white/50 font-mono">OUT OF 100</p>
          </div>
          
          <div className="space-y-2 md:space-y-3">
            <div className="bg-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 backdrop-blur-sm">
              <p className="text-[10px] md:text-xs text-white/50 mb-1 font-mono">Longest Streak</p>
              <p className="text-lg md:text-xl font-bold">{data.longestStreakDays} days</p>
            </div>
            <div className="bg-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 backdrop-blur-sm">
              <p className="text-[10px] md:text-xs text-white/50 mb-1 font-mono">Time-Weighted Balance</p>
              <p className="text-lg md:text-xl font-bold">{data.timeWeightedBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}