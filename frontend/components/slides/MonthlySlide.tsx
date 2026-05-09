import { WrappedData } from '@/lib/api';

export function MonthlySlide({ data }: { data: WrappedData }) {
  const bestMonthDate = new Date(data.bestMonth.month);
  const monthName = bestMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  return (
    <div className="min-h-full grid grid-cols-1 md:grid-cols-2 items-center text-white relative">
      <div className="absolute top-4 left-4 md:top-8 md:left-8 font-mono text-[10px] md:text-xs tracking-widest text-white/30 uppercase">
        TEMPORAL ANALYSIS
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
            BEST MONTH
          </div>
          
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 md:mb-6 tracking-tight">Peak Performance</h2>
          
          <div className="bg-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 mb-4 md:mb-5 text-center backdrop-blur-sm">
            <p className="text-lg md:text-2xl font-bold mb-1">{monthName}</p>
            <p className="text-3xl md:text-4xl font-bold mb-1">{data.bestMonth.amount.toLocaleString()}</p>
            <p className="text-[10px] md:text-xs text-white/50 font-mono">shMON DEPOSITED</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-[10px] md:text-xs text-white/50 mb-2 font-mono uppercase tracking-wider">Recent History</p>
            {data.monthlyData.slice(-6).map(({ month, amount }) => {
              const date = new Date(month);
              const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              const isBest = month === data.bestMonth.month;
              
              return (
                <div key={month} className={`flex justify-between items-center p-2.5 md:p-3 rounded-xl md:rounded-2xl backdrop-blur-sm ${isBest ? 'bg-white/10' : 'bg-white/5'}`}>
                  <span className="text-xs md:text-sm font-mono">{label}</span>
                  <span className={`font-bold text-xs md:text-sm ${isBest ? 'text-white' : 'text-white/70'}`}>
                    {amount.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}