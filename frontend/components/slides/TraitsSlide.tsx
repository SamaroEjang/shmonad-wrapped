import { WrappedData } from '@/lib/api';
import { SlideFrame } from './SlideFrame';

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
    <SlideFrame
      eyebrow="IDENTITY MATRIX"
      title="Decode your"
      accent="archetype."
      description="Your traits translate staking behavior into an identity: the protocol you leaned into, the habits you kept, and the role your wallet played."
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-5 md:mb-6">
        <div>
          <div className="font-mono text-[10px] md:text-xs bg-white/7 px-3 md:px-4 py-1.5 md:py-2 rounded-full inline-block mb-3 md:mb-4 tracking-wider">
            YOUR TRAITS
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Your Archetype</h2>
          <div className="mt-3 h-1 w-12 rounded-full bg-[#A855F7]" />
        </div>

        {profilePic && (
          <div className="flex items-center gap-3 rounded-3xl bg-white/8 border border-white/15 px-4 py-3 shadow-2xl shadow-black/20 md:min-w-64">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-[#8B5CF6] blur-md opacity-45" />
              <img
                src={profilePic}
                alt={displayHandle || 'X profile'}
                className="relative h-14 w-14 md:h-16 md:w-16 rounded-full border-2 border-white/25 object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-[#A855F7]">X Profile</p>
              <p className="max-w-44 truncate text-lg md:text-xl font-bold text-white">{displayHandle}</p>
              <p className="text-[10px] md:text-xs text-white/45">Verified archetype badge</p>
            </div>
          </div>
        )}
      </div>

      {sortedTraits.length === 0 ? (
        <div className="bg-white/6 border border-white/8 rounded-2xl md:rounded-3xl p-6 md:p-8 text-center backdrop-blur-sm">
          <p className="text-white/50 text-sm md:text-base">Keep staking to unlock traits!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 md:gap-3">
          {sortedTraits.map((trait, idx) => {
            const archetypeImage = ARCHETYPE_IMAGES[trait.id];
            const title = getTraitTitle(trait.label, Boolean(archetypeImage));

            return (
              <div
                key={trait.id}
                className="flex items-center gap-3 bg-white/6 border border-white/8 rounded-xl md:rounded-2xl p-3 md:p-4 backdrop-blur-sm"
              >
                {archetypeImage ? (
                  <div className="relative h-20 w-20 md:h-24 md:w-24 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/30">
                    <img
                      src={archetypeImage}
                      alt={trait.label}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 md:h-16 md:w-16 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-2xl">
                    {trait.label.split(' ')[0]}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="mb-1 font-mono text-[10px] md:text-xs uppercase tracking-wider text-[#A855F7]">
                    {archetypeImage && idx === 0 ? 'Primary Archetype' : 'Secondary Archetype'}
                  </p>
                  <p className="text-lg md:text-xl font-bold leading-tight">{title}</p>
                  <p className="mt-1 text-xs md:text-sm text-white/60">{trait.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 rounded-xl md:rounded-2xl border border-[#A855F7]/20 bg-[#A855F7]/20 px-4 py-3 text-xs md:text-sm text-white/70">
        Archetypes evolve. Keep building to unlock your next signal.
      </div>
    </SlideFrame>
  );
}
