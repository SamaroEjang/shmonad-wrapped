import { WrappedData } from '@/lib/api';

type TraitsSlideProps = {
  data: WrappedData;
  twitterHandle?: string;
  profilePic?: string;
};

export function TraitsSlide({ data, twitterHandle, profilePic }: TraitsSlideProps) {
  const displayHandle = twitterHandle ? `@${twitterHandle.replace('@', '')}` : '';

  return (
    <div className="min-h-full grid grid-cols-1 md:grid-cols-2 items-center text-white relative">
      <div className="absolute top-4 left-4 md:top-8 md:left-8 font-mono text-[10px] md:text-xs tracking-widest text-white/30 uppercase">
        IDENTITY MATRIX
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
            YOUR TRAITS
          </div>
          
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Your Archetype</h2>

            {profilePic && (
              <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
                <img
                  src={profilePic}
                  alt={displayHandle || 'X profile'}
                  className="h-11 w-11 rounded-full border border-white/20 object-cover"
                />
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/40">X Profile</p>
                  <p className="max-w-32 truncate text-sm font-semibold text-white">{displayHandle}</p>
                </div>
              </div>
            )}
          </div>
          
          {data.traits.length === 0 ? (
            <div className="bg-white/5 rounded-2xl md:rounded-3xl p-6 md:p-8 text-center backdrop-blur-sm">
              <p className="text-white/50 text-sm md:text-base">Keep staking to unlock traits!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 md:gap-3">
              {data.traits.map((trait) => (
                <div key={trait.id} className="bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-5 backdrop-blur-sm">
                  <p className="text-lg md:text-xl font-bold mb-1">{trait.label}</p>
                  <p className="text-xs md:text-sm text-white/60">{trait.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
