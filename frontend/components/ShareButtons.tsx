'use client';
import { useState } from 'react';
import domtoimage from 'dom-to-image-more';

export function ShareButtons({ wallet }: { wallet: string }) {
  const [isCapturing, setIsCapturing] = useState(false);

  const captureAndDownload = async () => {
    setIsCapturing(true);
    try {
      // Hide elements that break screenshots
      const shader = document.querySelector('canvas') as HTMLElement;
      const nav = document.querySelector('.flex-none') as HTMLElement;
      const indicators = document.querySelector('.absolute.bottom-28') as HTMLElement;

      if (shader) shader.style.display = 'none';
      if (nav) nav.style.display = 'none';
      if (indicators) indicators.style.display = 'none';

      // Set solid background
      const container = document.querySelector('.slide-container') as HTMLElement;
      const originalBg = container?.style.backgroundColor;
      if (container) container.style.backgroundColor = '#030407';

      // Remove all backdrop filters temporarily
      const blurEls = document.querySelectorAll<HTMLElement>('[style*="backdrop-filter"]');
      blurEls.forEach(el => {
        el.dataset.bf = el.style.backdropFilter;
        el.style.backdropFilter = 'none';
        el.style.webkitBackdropFilter = 'none';
      });

      await new Promise(r => setTimeout(r, 100));

      const slideElement = document.querySelector('.slide-container') as HTMLElement;
      const dataUrl = await domtoimage.toPng(slideElement, {
        quality: 1,
        bgcolor: '#030407',
      });

      // Restore everything
      if (shader) shader.style.display = '';
      if (nav) nav.style.display = '';
      if (indicators) indicators.style.display = '';
      if (container) container.style.backgroundColor = originalBg || '';
      blurEls.forEach(el => {
        el.style.backdropFilter = el.dataset.bf || '';
        el.style.webkitBackdropFilter = el.dataset.bf || '';
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
    const text = encodeURIComponent(`Check out my shMonad Wrapped! 🎊\n\n${window.location.href}`);
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
        {isCapturing ? '📷 CAPTURING...' : '⬇️ DOWNLOAD'}
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