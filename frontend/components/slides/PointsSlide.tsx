import { WrappedData } from '@/lib/api';
import { SlideFrame } from './SlideFrame';

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
    <SlideFrame
      eyebrow="PROTOCOL DISTRIBUTION"
      title="Trace your"
      accent="points path."
      description="See which protocols generated the most shMON rewards and how your activity spread across the Monad ecosystem."
    >
      <div className="font-mono text-[10px] md:text-xs bg-white/7 px-3 md:px-4 py-1.5 md:py-2 rounded-full inline-block mb-3 md:mb-4 tracking-wider">
        POINTS BREAKDOWN
      </div>

      <h2 className="text-2xl md:text-3xl font-semibold mb-1 md:mb-2 tracking-tight">Your Points</h2>
      <p className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-white/90">{data.totalPoints.toLocaleString()}</p>

      <div className="space-y-2">
        {topProtocols.map((item, idx) => (
          <div key={idx} className="bg-white/6 border border-white/8 rounded-xl md:rounded-2xl p-2.5 md:p-3 backdrop-blur-sm flex items-center gap-2 md:gap-3">
            <img src={PROTOCOL_ICONS[item.protocol] || PROTOCOL_ICONS['Other']} alt={item.protocol} className="w-6 h-6 md:w-8 md:h-8 rounded-full" />
            <div className="flex-1">
              <p className="font-medium text-xs md:text-sm">{item.protocol.replace(/_/g, ' ')}</p>
              <p className="text-[10px] md:text-xs text-white/50 font-mono">{item.amount.toLocaleString()} points</p>
            </div>
          </div>
        ))}
      </div>
    </SlideFrame>
  );
}
