import { WrappedData } from '@/lib/api';

const PROTOCOL_ICONS: Record<string, string> = {
  'FastLane Degen Pool': '/icons/degen.png',
  'Curvance shMON': '/icons/curvance.png',
  'Uniswap V3': '/icons/uniswap.png',
  'shMON Wallet': '/icons/shmon.png',
  'Zero Yield': '/icons/zero-yield.png',
  'Euler': '/icons/euler.jpg',
  'Neverland': '/icons/neverland.png',
  'Balancer': '/icons/balancer.png',
  'Townsquare': '/icons/townesquare.png',
  'PancakeSwap': '/icons/searchnad.png',
  'Monday Trade': '/icons/searchnad.png',
  'Morpho': '/icons/searchnad.png',
  'Aave Supply': '/icons/searchnad.png',
  'Other Protocols': '/icons/searchnad.png',
  'Other': '/icons/searchnad.png',
};

export function PointsSlide({ data }: { data: WrappedData }) {
  const topProtocols = data.pointsBreakdown.filter((item) => item.amount > 0).slice(0, 4);
  
  return (
    <div className="min-h-full grid grid-cols-1 md:grid-cols-2 items-center text-white relative">
      <div className="absolute top-4 left-4 md:top-8 md:left-8 font-mono text-[10px] md:text-xs tracking-widest text-white/30 uppercase">
        PROTOCOL DISTRIBUTION
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
            POINTS BREAKDOWN
          </div>
          
          <h2 className="text-2xl md:text-3xl font-semibold mb-1 md:mb-2 tracking-tight">Your Points</h2>
          <p className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-white/90">{data.totalPoints.toLocaleString()}</p>
          
          <div className="space-y-2">
            {topProtocols.map((item, idx) => (
              <div key={idx} className="bg-white/5 rounded-xl md:rounded-2xl p-2.5 md:p-3 backdrop-blur-sm flex items-center gap-2 md:gap-3">
                <img src={PROTOCOL_ICONS[item.protocol] || PROTOCOL_ICONS['Other']} alt={item.protocol} className="w-6 h-6 md:w-8 md:h-8 rounded-full" />
                <div className="flex-1">
                  <p className="font-medium text-xs md:text-sm">{item.protocol.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] md:text-xs text-white/50 font-mono">{item.amount.toLocaleString()} points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
