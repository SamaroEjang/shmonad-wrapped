'use client';
import { useState } from 'react';
import domtoimage from 'dom-to-image-more';

export function ShareButtons({ wallet }: { wallet: string }) {
  const [isCapturing, setIsCapturing] = useState(false);

  const captureAndDownload = async () => {
  setIsCapturing(true);
  try {
    // Target just the content card, not the full screen
    const card = document.querySelector('.slide-container .absolute.inset-0:last-child > div') as HTMLElement 
              || document.querySelector('.slide-container') as HTMLElement;
    
    if (!card) return;

    const dataUrl = await domtoimage.toPng(card, {
      quality: 1,
      bgcolor: '#0a0a14',
      style: {
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
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