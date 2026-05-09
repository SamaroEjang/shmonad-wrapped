'use client';
import { useState } from 'react';
import domtoimage from 'dom-to-image-more';

export function ShareButtons({ wallet }: { wallet: string }) {
  const [isCapturing, setIsCapturing] = useState(false);

  const captureAndDownload = async () => {
    setIsCapturing(true);
    try {
      const slideElement = document.querySelector('.slide-container') as HTMLElement;
      if (!slideElement) return;

      const dataUrl = await domtoimage.toPng(slideElement, {
        quality: 0.95,
        bgcolor: '#4c1d95',
        width: slideElement.offsetWidth * 2,
        height: slideElement.offsetHeight * 2,
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
          width: slideElement.offsetWidth + 'px',
          height: slideElement.offsetHeight + 'px'
        }
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `shmonad-wrapped-${wallet.slice(0, 6)}.png`;
      link.click();
    } catch (error) {
      console.error('Failed to capture:', error);
      alert('Screenshot failed. Please use your browser\'s screenshot tool instead!');
    } finally {
      setIsCapturing(false);
    }
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`Check out my shMonad Wrapped 2025! 🟣\n\n${window.location.href}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

 return (
    <div className="flex gap-3">
      <button
        onClick={captureAndDownload}
        disabled={isCapturing}
        className="px-6 py-3 rounded-full font-medium transition-all"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        {isCapturing ? '📸 CAPTURING...' : '⬇️ DOWNLOAD'}
      </button>
      <button
        onClick={shareToTwitter}
        className="px-6 py-3 rounded-full font-medium transition-all hover:opacity-90"
        style={{
          backgroundColor: '#1DA1F2',
          color: 'white',
        }}
      >
        🐦 SHARE ON X
      </button>
    </div>
  );
}