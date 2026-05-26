import { WrappedData } from '@/lib/api';

type TraitsSlideProps = {
  data: WrappedData;
  twitterHandle?: string;
  profilePic?: string;
};

const ARCHETYPE_IMAGES: Record<string, string> = {
  Balancer: '/archetypes/balancer-baron.png',
  Curvance: '/archetypes/curvance-commander.png',
  'Curvance shMON': '/archetypes/curvance-commander.png',
  'FastLane Degen Pool': '/archetypes/degen-overlord.png',
  Euler: '/archetypes/euler-elite.png',
  Neverland: '/archetypes/neverland-noble.png',
  PancakeSwap: '/archetypes/pancake-paladin.png',
  Townsquare: '/archetypes/townesquare-titan.png',
  'Uniswap V3': '/archetypes/uniswap-ultramarine.png',
  'shMON Wallet': '/archetypes/yield-sovereign.png',
  'Zero Yield': '/archetypes/yield-sovereign.png',
};

function getTraitTitle(label: string, hasArchetypeImage: boolean) {
  if (!hasArchetypeImage) return label;

  return label.replace(/^(\S+)\s+/, '');
}

export function TraitsSlide({ data, twitterHandle, profilePic }: TraitsSlideProps) {
  const displayHandle = twitterHandle ? `@${twitterHandle.replace('@', '')}` : '';
  const sortedTraits = [...data.traits].sort((a, b) => {
    const aHasArchetypeImage = Boolean(ARCHETYPE_IMAGES[a.id]);
    const bHasArchetypeImage = Boolean(ARCHETYPE_IMAGES[b.id]);

    if (aHasArchetypeImage === bHasArchetypeImage) return 0;
    return aHasArchetypeImage ? -1 : 1;
  });

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
              <div className="flex items-center gap-4 rounded-3xl bg-white/8 border border-white/15 px-4 py-3 shadow-2xl shadow-black/20 md:min-w-64">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-full bg-[#8B5CF6] blur-md opacity-35" />
                  <img
                    src={profilePic}
                    alt={displayHandle || 'X profile'}
                    className="relative h-16 w-16 md:h-20 md:w-20 rounded-full border-2 border-white/25 object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-white/40">X Profile</p>
                  <p className="max-w-44 truncate text-xl md:text-2xl font-bold text-white">{displayHandle}</p>
                  <p className="text-[10px] md:text-xs text-white/45">Verified archetype badge</p>
                </div>
              </div>
            )}
          </div>
          
          {sortedTraits.length === 0 ? (
            <div className="bg-white/5 rounded-2xl md:rounded-3xl p-6 md:p-8 text-center backdrop-blur-sm">
              <p className="text-white/50 text-sm md:text-base">Keep staking to unlock traits!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 md:gap-3">
              {sortedTraits.map((trait) => {
                const archetypeImage = ARCHETYPE_IMAGES[trait.id];
                const title = getTraitTitle(trait.label, Boolean(archetypeImage));

                return (
                  <div
                    key={trait.id}
                    className="flex items-center gap-3 bg-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 backdrop-blur-sm"
                  >
                    {archetypeImage ? (
                      <div className="relative h-16 w-16 md:h-20 md:w-20 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/30">
                        <img
                          src={archetypeImage}
                          alt={trait.label}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl md:text-2xl">
                        {trait.label.split(' ')[0]}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-lg md:text-xl font-bold leading-tight">{title}</p>
                      <p className="mt-1 text-xs md:text-sm text-white/60">{trait.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
