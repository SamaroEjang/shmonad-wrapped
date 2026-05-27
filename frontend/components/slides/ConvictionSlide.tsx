import { WrappedData } from '@/lib/api';
import { SlideFrame } from './SlideFrame';

export function ConvictionSlide({ data }: { data: WrappedData }) {
  return (
    <SlideFrame
      eyebrow="COMMITMENT ANALYSIS"
      title="Measure your"
      accent="conviction."
      description="Your score blends time in the position with balance strength, turning quiet holding into a single momentum read."
      maxWidth="max-w-md"
    >
      <div className="font-mono text-[10px] md:text-xs bg-white/7 px-3 md:px-4 py-1.5 md:py-2 rounded-full inline-block mb-3 md:mb-4 tracking-wider">
        CONVICTION SCORE
      </div>

      <h2 className="text-2xl md:text-3xl font-semibold mb-4 md:mb-6 tracking-tight">Your Dedication</h2>

      <div className="bg-white/6 border border-white/8 rounded-2xl md:rounded-3xl p-6 md:p-8 mb-4 md:mb-5 text-center backdrop-blur-sm">
        <p className="text-5xl md:text-7xl font-bold mb-1">{data.convictionScore}</p>
        <p className="text-[10px] md:text-xs text-white/50 font-mono">OUT OF 100</p>
      </div>

      <div className="space-y-2 md:space-y-3">
        <div className="bg-white/6 border border-white/8 rounded-xl md:rounded-2xl p-3 md:p-4 backdrop-blur-sm">
          <p className="text-[10px] md:text-xs text-white/50 mb-1 font-mono">Longest Streak</p>
          <p className="text-lg md:text-xl font-bold">{data.longestStreakDays} days</p>
        </div>
      </div>
    </SlideFrame>
  );
}
