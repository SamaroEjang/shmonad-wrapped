'use client';
import { useState } from 'react';
import domtoimage from 'dom-to-image-more';

export function ShareButtons({ wallet }: { wallet: string }) {
  const [isCapturing, setIsCapturing] = useState(false);

  const captureAndDownload = async () => {
    setIsCapturing(true);
    const restored: Array<() => void> = [];
    let fallbackBackground: HTMLDivElement | null = null;

    try {
      const captureRoot = document.querySelector('[data-shmonad-current-slide]') as HTMLElement | null;
      const shaderCanvas = document.querySelector('canvas') as HTMLCanvasElement | null;

      if (!captureRoot) {
        throw new Error('Could not find the wrapped slide to capture.');
      }

      const originalRootStyles = {
        backgroundColor: captureRoot.style.backgroundColor,
        backgroundImage: captureRoot.style.backgroundImage,
        width: captureRoot.style.width,
        height: captureRoot.style.height,
        minHeight: captureRoot.style.minHeight,
      };
      const captureWidth = window.innerWidth;
      const captureHeight = window.innerHeight;

      captureRoot.style.backgroundColor = '#030407';
      captureRoot.style.width = `${captureWidth}px`;
      captureRoot.style.height = `${captureHeight}px`;
      captureRoot.style.minHeight = `${captureHeight}px`;
      captureRoot.classList.add('shmonad-exporting');

      restored.push(() => {
        captureRoot.style.backgroundColor = originalRootStyles.backgroundColor;
        captureRoot.style.backgroundImage = originalRootStyles.backgroundImage;
        captureRoot.style.width = originalRootStyles.width;
        captureRoot.style.height = originalRootStyles.height;
        captureRoot.style.minHeight = originalRootStyles.minHeight;
        captureRoot.classList.remove('shmonad-exporting');
      });

      fallbackBackground = document.createElement('div');
      fallbackBackground.setAttribute('data-shmonad-export-bg', 'true');
      fallbackBackground.style.position = 'absolute';
      fallbackBackground.style.inset = '0';
      fallbackBackground.style.zIndex = '0';
      fallbackBackground.style.pointerEvents = 'none';
      fallbackBackground.style.backgroundColor = '#030407';
      fallbackBackground.style.backgroundImage = shaderCanvas
        ? `url("${shaderCanvas.toDataURL('image/png')}")`
        : [
            'radial-gradient(16% 76% at 42% 50%, rgba(255,255,255,0.82), rgba(196,181,253,0.58) 12%, rgba(139,92,246,0.42) 25%, rgba(3,4,7,0) 58%)',
            'radial-gradient(58% 105% at 26% 42%, rgba(139,92,246,0.36), rgba(62,31,131,0.2) 36%, rgba(3,4,7,0) 67%)',
          ].join(', ');
      fallbackBackground.style.backgroundSize = '100% 100%';
      fallbackBackground.style.backgroundPosition = 'center';
      fallbackBackground.style.backgroundRepeat = 'no-repeat';
      captureRoot.prepend(fallbackBackground);
      restored.push(() => fallbackBackground?.remove());

      const animatedSlides = captureRoot.querySelectorAll<HTMLElement>('.slide-in-right, .slide-in-left, .slide-out-left, .slide-out-right');
      animatedSlides.forEach((el) => {
        const originalAnimation = el.style.animation;
        const originalTransform = el.style.transform;
        const originalOpacity = el.style.opacity;

        el.style.animation = 'none';
        el.style.transform = 'none';
        el.style.opacity = '1';

        restored.push(() => {
          el.style.animation = originalAnimation;
          el.style.transform = originalTransform;
          el.style.opacity = originalOpacity;
        });
      });

      const filteredEls = captureRoot.querySelectorAll<HTMLElement>('*');
      filteredEls.forEach((el) => {
        const backdropClasses = Array.from(el.classList).filter((className) => className.startsWith('backdrop-'));
        const originalBorder = el.style.border;
        const originalOutline = el.style.outline;
        const originalBoxShadow = el.style.boxShadow;
        const originalTextDecoration = el.style.textDecoration;
        const originalBackgroundClip = el.style.backgroundClip;

        const originalBackdrop = el.style.backdropFilter;
        const originalWebkitBackdrop = el.style.getPropertyValue('-webkit-backdrop-filter');

        el.style.border = '0 solid transparent';
        el.style.outline = '0';
        el.style.boxShadow = 'none';
        el.style.textDecoration = 'none';
        el.style.backgroundClip = 'padding-box';
        el.style.backdropFilter = 'none';
        el.style.setProperty('-webkit-backdrop-filter', 'none');
        backdropClasses.forEach((className) => el.classList.remove(className));

        if (el.tagName === 'INPUT') {
          el.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        }

        restored.push(() => {
          el.style.border = originalBorder;
          el.style.outline = originalOutline;
          el.style.boxShadow = originalBoxShadow;
          el.style.textDecoration = originalTextDecoration;
          el.style.backgroundClip = originalBackgroundClip;
          el.style.backdropFilter = originalBackdrop;
          el.style.setProperty('-webkit-backdrop-filter', originalWebkitBackdrop);
          backdropClasses.forEach((className) => el.classList.add(className));
        });
      });

      await new Promise(r => setTimeout(r, 100));

      const dataUrl = await domtoimage.toPng(captureRoot, {
        quality: 1,
        bgcolor: '#030407',
        width: captureWidth,
        height: captureHeight,
        style: {
          backgroundColor: '#030407',
          height: `${captureHeight}px`,
          minHeight: `${captureHeight}px`,
          width: `${captureWidth}px`,
        },
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `shmonad-wrapped-${wallet.slice(0, 6)}.png`;
      link.click();
    } catch (error) {
      console.error('Failed to capture:', error);
      alert('Screenshot failed. Please use your browser\'s screenshot tool instead!');
    } finally {
      restored.reverse().forEach((restore) => restore());
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
