'use client';

type GiveawayPillProps = {
  visible: boolean;
  onClick: () => void;
};

export function GiveawayPill({ visible, onClick }: GiveawayPillProps) {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      className="fixed top-4 right-4 md:top-6 md:right-6 z-30 flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-full font-mono text-[10px] md:text-xs tracking-wider uppercase backdrop-blur-md transition-all hover:scale-105 active:scale-95"
      style={{
        backgroundColor: 'rgba(139, 92, 246, 0.18)',
        border: '1px solid rgba(196, 181, 253, 0.4)',
        color: '#E9D5FF',
        boxShadow: '0 0 24px rgba(139, 92, 246, 0.25)',
      }}
    >
      <span>🎁</span>
      <span>Giveaway</span>
      <span aria-hidden>→</span>
    </button>
  );
}
