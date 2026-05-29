'use client';
import { useEffect, useState } from 'react';
import { WrappedData } from '@/lib/api';
import { WelcomeSlide } from './WelcomeSlide';
import { StatsSlide } from './StatsSlide';
import { MonthlySlide } from './MonthlySlide';
import { ConvictionSlide } from './ConvictionSlide';
import { TraitsSlide } from './TraitsSlide';
import { PointsSlide } from './PointsSlide';
import { ClaimSlide } from './ClaimSlide';
import { ShareButtons } from '../ShareButtons';
import { ShaderBackground } from '../ShaderBackground';
import { GiveawayPill } from '../GiveawayPill';

const sharedKey = (wallet: string) => `shmonad_shared_${wallet.toLowerCase()}`;

export function SlideContainer({ data }: { data: WrappedData }) {
  const [current, setCurrent] = useState(0);
  const [previous, setPrevious] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isAnimating, setIsAnimating] = useState(false);
  const [twitterHandle, setTwitterHandle] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [sharedOnX, setSharedOnX] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (localStorage.getItem(sharedKey(data.wallet)) === '1') {
        setSharedOnX(true);
      }
    } catch {
      /* localStorage unavailable */
    }
  }, [data.wallet]);

  const handleShared = () => {
    setSharedOnX(true);
    try {
      localStorage.setItem(sharedKey(data.wallet), '1');
    } catch {
      /* ignore */
    }
  };

  const slides = [
    <WelcomeSlide
      key="welcome"
      data={data}
      twitterHandle={twitterHandle}
      profilePic={profilePic}
      setTwitterHandle={setTwitterHandle}
      setProfilePic={setProfilePic}
    />,
    <StatsSlide key="stats" data={data} />,
    <ConvictionSlide key="conviction" data={data} />,
    <PointsSlide key="points" data={data} />,
    <MonthlySlide key="monthly" data={data} />,
    <TraitsSlide key="traits" data={data} twitterHandle={twitterHandle} profilePic={profilePic} />,
    <ClaimSlide key="claim" data={data} sharedOnX={sharedOnX} />,
  ];

  const claimIndex = slides.length - 1;

  const handleSlideChange = (newIndex: number) => {
    if (isAnimating || newIndex === current) return;

    setPrevious(current);
    setDirection(newIndex > current ? 'right' : 'left');
    setIsAnimating(true);
    setCurrent(newIndex);

    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#030407' }}>
      <ShaderBackground />
      <GiveawayPill
        visible={current !== claimIndex}
        onClick={() => handleSlideChange(claimIndex)}
      />
      <div className="slide-container w-screen h-screen overflow-hidden relative flex flex-col">
        <div className="flex-1 relative overflow-hidden" data-shmonad-capture-root>
          {/* Previous slide animating out */}
          {isAnimating && (
            <div className={`absolute inset-0 overflow-y-auto scrollbar-hide ${direction === 'right' ? 'slide-out-left' : 'slide-out-right'}`}>
              {slides[previous]}
            </div>
          )}

          {/* Current slide animating in */}
          <div className={`absolute inset-0 overflow-y-auto scrollbar-hide ${isAnimating ? (direction === 'right' ? 'slide-in-right' : 'slide-in-left') : ''}`} data-shmonad-current-slide>
            {slides[current]}
          </div>
        </div>

        {/* Slide indicators - responsive */}
        <div className="absolute bottom-28 md:bottom-32 w-full grid grid-cols-1 md:grid-cols-2">
          <div className="hidden md:block"></div>
          <div className="flex justify-center gap-2 pointer-events-none p-4 md:p-8 md:pr-16">
            {slides.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>

        {/* Navigation - responsive */}
        <div className="flex-none grid grid-cols-1 md:grid-cols-2" style={{
          background: 'linear-gradient(to top, rgba(3, 4, 7, 0.95), rgba(3, 4, 7, 0))',
        }}>
          <div className="hidden md:block"></div>
          <div className="flex flex-col items-center p-4 md:p-8 md:pr-16 gap-3 md:gap-4">
            <ShareButtons
              wallet={data.wallet}
              data={data}
              twitterHandle={twitterHandle}
              profilePic={profilePic}
              onShare={handleShared}
            />
            <div className="flex gap-2 md:gap-3">
              {current > 0 && (
                <button
                  onClick={() => handleSlideChange(current - 1)}
                  disabled={isAnimating}
                  className="px-6 md:px-8 py-2.5 md:py-3 rounded-full font-medium transition-all disabled:opacity-50 text-sm md:text-base"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  ← BACK
                </button>
              )}
              {current < slides.length - 1 && (
                <button
                  onClick={() => handleSlideChange(current + 1)}
                  disabled={isAnimating}
                  className="px-6 md:px-8 py-2.5 md:py-3 rounded-full font-medium transition-all hover:opacity-90 disabled:opacity-50 text-sm md:text-base"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#030407',
                  }}
                >
                  NEXT →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
