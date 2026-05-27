'use client';
import { useState } from 'react';
import { WrappedData } from '@/lib/api';
import { SlideFrame } from './SlideFrame';

type WelcomeSlideProps = {
  data: WrappedData;
  twitterHandle: string;
  profilePic: string;
  setTwitterHandle: (handle: string) => void;
  setProfilePic: (url: string) => void;
};

export function WelcomeSlide({
  data,
  twitterHandle,
  profilePic,
  setTwitterHandle,
  setProfilePic,
}: WelcomeSlideProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const handleConnect = () => {
    if (twitterHandle.trim()) {
      const handle = twitterHandle.replace('@', '');
      setTwitterHandle(handle);
      setProfilePic(`https://unavatar.io/twitter/${handle}`);
      setImageFailed(false);
    }
  };

  const showInput = !profilePic;

  return (
    <div suppressHydrationWarning>
      <SlideFrame
        eyebrow="FASTLANE"
        logo={<img src="/icons/FL-icon.png" alt="FastLane" className="w-6 h-6 md:w-8 md:h-8" />}
        title="Replay your"
        accent="shMonad year."
        description="Paste a wallet, connect an X profile if you want the badge, and turn your staking history into a shareable story."
        maxWidth="max-w-md"
      >
          {profilePic && (
            <img 
              src={profilePic} 
              alt="Profile" 
              className={`w-12 h-12 md:w-16 md:h-16 rounded-full mb-3 md:mb-4 border-2 border-white/20 mx-auto ${imageFailed ? 'hidden' : ''}`}
              onError={() => setImageFailed(true)}
            />
          )}
          {profilePic && imageFailed && (
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full mb-3 md:mb-4 border border-white/20 bg-white/10 mx-auto flex items-center justify-center font-mono text-xs text-white/60">
              @{twitterHandle.slice(0, 2).toUpperCase()}
            </div>
          )}
          
          <div className="font-mono text-[10px] md:text-xs bg-white/7 px-3 md:px-4 py-1.5 md:py-2 rounded-full inline-block mb-2 md:mb-3 tracking-wider">
            WRAPPED 2025
          </div>
          
          <h1 className="text-2xl md:text-4xl font-semibold mb-1 md:mb-2 tracking-tight">
            shMonad Wrapped
          </h1>
          
          <p className="text-xs md:text-sm text-white/50 mb-4 md:mb-6 font-mono">
            {data.wallet.slice(0, 6)}...{data.wallet.slice(-4)}
          </p>
          
          {showInput && (
            <div className="mb-4 md:mb-5 flex flex-col gap-2">
              <input
                type="text"
                placeholder="@yourhandle"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                className="w-full px-4 md:px-5 py-2.5 md:py-3 rounded-full bg-white/5 text-white placeholder-white/30 border border-white/10 focus:outline-none focus:border-white/30 transition-colors text-xs md:text-sm"
              />
              <button
                onClick={handleConnect}
                className="w-full px-4 md:px-5 py-2.5 md:py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-all text-xs md:text-sm"
              >
                CONNECT X PROFILE
              </button>
            </div>
          )}
          
          <div className="bg-white/6 border border-white/8 rounded-2xl md:rounded-3xl p-4 md:p-6 mb-4 md:mb-5 text-center backdrop-blur-sm">
            <p className="text-4xl md:text-6xl font-bold mb-1">2025</p>
            <p className="text-[10px] md:text-xs text-white/50">Your shMonad journey</p>
          </div>
          
          <p className="text-center text-sm md:text-base">
            <span className="text-white/50">Top</span>{' '}
            <span className="font-bold">{100 - (data.percentileRank || 0)}%</span>{' '}
            <span className="text-white/50">of all holders</span>
          </p>
      </SlideFrame>
    </div>
  );
}
