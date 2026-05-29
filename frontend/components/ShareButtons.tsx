'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import domtoimage from 'dom-to-image-more';
import { WrappedData } from '@/lib/api';

type ShareButtonsProps = {
  wallet: string;
  data?: WrappedData;
  twitterHandle?: string;
  profilePic?: string;
  onShare?: () => void;
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

function shortWallet(wallet: string) {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function imageToDataUrl(src: string) {
  const response = await fetch(src, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Image failed to load: ${response.status}`);
  return blobToDataUrl(await response.blob());
}

async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll('img'));

  await Promise.all(images.map((image) => {
    if (image.complete && image.naturalWidth > 0) return Promise.resolve();

    if (typeof image.decode === 'function') {
      return image.decode().catch(() => undefined);
    }

    return new Promise<void>((resolve) => {
      const finish = () => resolve();
      image.onload = finish;
      image.onerror = finish;
      window.setTimeout(finish, 1500);
    });
  }));
}

export function ShareButtons({ wallet, data, twitterHandle, profilePic, onShare }: ShareButtonsProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [exportAvatarData, setExportAvatarData] = useState<string | null>(null);
  const exportCardRef = useRef<HTMLDivElement>(null);
  const displayHandle = twitterHandle ? `@${twitterHandle.replace('@', '')}` : shortWallet(wallet);
  const cleanTwitterHandle = twitterHandle?.replace('@', '') ?? '';
  const exportAvatar = profilePic?.startsWith('/')
    ? profilePic
    : cleanTwitterHandle
      ? `/api/avatar/${encodeURIComponent(cleanTwitterHandle)}`
      : null;
  const exportTraits = useMemo(() => {
    const traits = data?.traits ?? [];
    return [...traits]
      .sort((a, b) => {
        const aHasImage = Boolean(ARCHETYPE_IMAGES[a.id]);
        const bHasImage = Boolean(ARCHETYPE_IMAGES[b.id]);
        if (aHasImage === bHasImage) return 0;
        return aHasImage ? -1 : 1;
      })
      .slice(0, 5);
  }, [data?.traits]);

  useEffect(() => {
    let cancelled = false;
    setExportAvatarData(null);

    if (!exportAvatar) return;

    imageToDataUrl(exportAvatar)
      .then((dataUrl) => {
        if (!cancelled) setExportAvatarData(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setExportAvatarData(null);
      });

    return () => {
      cancelled = true;
    };
  }, [exportAvatar]);

  const captureAndDownload = async () => {
    setIsCapturing(true);
    const restored: Array<() => void> = [];
    let fallbackBackground: HTMLDivElement | null = null;

    try {
      if (exportCardRef.current && data) {
        const exportNodes = [
          exportCardRef.current,
          ...Array.from(exportCardRef.current.querySelectorAll<HTMLElement>('*')),
        ];
        exportNodes.forEach((el) => {
          el.style.border = '0';
          el.style.outline = '0';
          el.style.boxShadow = 'none';
          el.style.textDecoration = 'none';
          el.style.backgroundClip = 'padding-box';
        });

        await waitForImages(exportCardRef.current);
        await new Promise(r => setTimeout(r, 100));

        const dataUrl = await domtoimage.toPng(exportCardRef.current, {
          quality: 1,
          bgcolor: '#080312',
          width: 900,
          height: 1200,
          style: {
            width: '900px',
            height: '1200px',
            transform: 'none',
          },
        });

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `shmonad-wrapped-${wallet.slice(0, 6)}.png`;
        link.click();
        return;
      }

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
    const text = encodeURIComponent(`Check out my shWrapped! 🎊\n\n${window.location.href}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    onShare?.();
  };

  return (
    <>
      <div className="pointer-events-none fixed left-[-10000px] top-0 opacity-100">
        {data && (
          <div
            ref={exportCardRef}
            style={{
              width: '900px',
              height: '1200px',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '44px',
              background:
                'radial-gradient(circle at 16% 10%, rgba(139,92,246,0.65), rgba(67,31,140,0.2) 16%, rgba(8,3,18,0) 30%), radial-gradient(circle at 104% 40%, rgba(139,92,246,0.52), rgba(67,31,140,0.14) 15%, rgba(8,3,18,0) 29%), linear-gradient(145deg, #100620 0%, #080312 48%, #12062a 100%)',
              color: 'white',
              fontFamily: '"Space Grotesk", Arial, sans-serif',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '54px 54px', opacity: 0.14 }} />
            <div style={{ position: 'absolute', width: 150, height: 150, left: 36, top: 42, borderRadius: 999, background: 'radial-gradient(circle, rgba(139,92,246,0.92), rgba(139,92,246,0.22) 58%, transparent 70%)' }} />
            <div style={{ position: 'absolute', width: 118, height: 118, right: -34, top: 410, borderRadius: 999, background: 'radial-gradient(circle, rgba(139,92,246,0.8), rgba(139,92,246,0.18) 58%, transparent 70%)' }} />
            <div style={{ position: 'absolute', width: 128, height: 128, left: -44, bottom: 44, borderRadius: 999, background: 'radial-gradient(circle, rgba(139,92,246,0.65), rgba(139,92,246,0.14) 58%, transparent 72%)' }} />

            <div style={{ position: 'absolute', right: 54, top: 58, display: 'flex', alignItems: 'center', gap: 16 }}>
              <img src="/icons/FL-icon.png" alt="FastLane" style={{ width: 54, height: 54 }} />
              <div style={{ fontSize: 30, fontWeight: 700 }}>FastLane</div>
            </div>

            <div style={{ position: 'relative', padding: '150px 50px 56px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                <div style={{ width: 150, height: 150, borderRadius: 34, overflow: 'hidden', background: 'linear-gradient(135deg, rgba(139,92,246,0.72), rgba(255,255,255,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ fontSize: 54, fontWeight: 800, color: 'rgba(255,255,255,0.82)' }}>
                    {displayHandle.slice(1, 3).toUpperCase()}
                  </div>
                  {exportAvatarData && (
                    <img
                      src={exportAvatarData}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', border: 0 }}
                    />
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div style={{ fontSize: 46, lineHeight: 1, fontWeight: 800, letterSpacing: '-1px', maxWidth: 540, whiteSpace: 'nowrap' }}>
                      {displayHandle.replace('@', '')}
                    </div>
                    <div style={{ width: 46, height: 46, borderRadius: 16, background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 900 }}>
                      ✓
                    </div>
                  </div>
                  <div style={{ marginTop: 14, fontSize: 24, color: 'rgba(255,255,255,0.66)', fontWeight: 600 }}>
                    shWrapped 2026
                  </div>
                  <div style={{ marginTop: 8, fontSize: 20, color: 'rgba(255,255,255,0.48)', fontFamily: 'monospace' }}>
                    {shortWallet(wallet)}
                  </div>
                </div>
              </div>

              {data && (
                <div style={{ marginTop: 38, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {[
                    { label: 'RANK', value: data.percentileRank ? `Top ${data.percentileRank}%` : 'Private' },
                    { label: 'DAYS', value: data.totalDaysHolding.toLocaleString() },
                    { label: 'PROTOCOLS', value: data.protocolCount.toLocaleString() },
                  ].map((stat) => (
                    <div key={stat.label} style={{ borderRadius: 18, background: 'rgba(139,92,246,0.22)', padding: '18px 20px' }}>
                      <div style={{ fontSize: 15, letterSpacing: 3, color: '#A855F7', fontWeight: 800 }}>{stat.label}</div>
                      <div style={{ marginTop: 8, fontSize: 29, color: 'white', fontWeight: 800 }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 34, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(exportTraits.length ? exportTraits : [{ id: 'wallet', label: 'shMonad Holder', description: 'Built on Monad' }]).map((trait) => {
                  const image = ARCHETYPE_IMAGES[trait.id];
                  const title = getTraitTitle(trait.label, Boolean(image));

                  return (
                    <div key={trait.id} style={{ minHeight: 98, borderRadius: 20, background: 'linear-gradient(90deg, rgba(139,92,246,0.34), rgba(139,92,246,0.15))', display: 'flex', alignItems: 'center', gap: 20, padding: '16px 22px' }}>
                      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>
                        {image ? <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', border: 0 }} /> : trait.label.split(' ')[0]}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 25, lineHeight: 1.05, fontWeight: 800, whiteSpace: 'nowrap' }}>
                          {title}
                        </div>
                        <div style={{ marginTop: 8, fontSize: 18, lineHeight: 1.25, color: 'rgba(255,255,255,0.62)', whiteSpace: 'nowrap' }}>
                          {trait.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 28 }}>
                <div />
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 96, height: 2, backgroundColor: '#8B5CF6' }} />
                  <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 7 }}>SHWRAPPED</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
    </>
  );
}
