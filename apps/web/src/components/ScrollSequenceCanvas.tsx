import React, { useEffect, useRef, useState } from 'react';

interface ScrollSequenceCanvasProps {
  containerRef: React.RefObject<HTMLElement>;
  onProgressChange?: (progress: number) => void;
}

const TOTAL_FRAMES = 90;

// Exact laptop screen coordinates measured in 1920x1080 space
const LAPTOP_SCREEN = {
  left: 585,
  top: 352,
  width: 750,
  height: 470,
  imgWidth: 1920,
  imgHeight: 1080,
};

export const ScrollSequenceCanvas: React.FC<ScrollSequenceCanvasProps> = ({ 
  containerRef,
  onProgressChange 
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [screenRect, setScreenRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Image cache and loaded status
    const images: HTMLImageElement[] = [];
    const loadedStatus: boolean[] = new Array(TOTAL_FRAMES + 1).fill(false);

    let targetFrame = 1;
    let currentFrame = 1;
    let lastDrawnFrame = -1;
    let lastNotifiedProgress = -1;
    let animFrameId: number;
    let isDestroyed = false;

    // Calculate laptop screen bounding box in viewport space
    const updateScreenRect = (
      offsetX: number,
      offsetY: number,
      renderW: number,
      renderH: number
    ) => {
      const scaleX = renderW / LAPTOP_SCREEN.imgWidth;
      const scaleY = renderH / LAPTOP_SCREEN.imgHeight;
      const x = offsetX + LAPTOP_SCREEN.left * scaleX;
      const y = offsetY + LAPTOP_SCREEN.top * scaleY;
      const width = LAPTOP_SCREEN.width * scaleX;
      const height = LAPTOP_SCREEN.height * scaleY;

      setScreenRect({ x, y, width, height });
    };

    // High-DPR and responsive cover drawing function
    const drawFrame = (frameNum: number) => {
      if (!canvas || isDestroyed) return;

      // Select frame or fallback to nearest loaded frame
      let img = images[frameNum];
      if (!loadedStatus[frameNum] || !img?.complete || img.naturalWidth === 0) {
        let bestDist = Infinity;
        let fallback = -1;
        for (let i = 1; i <= TOTAL_FRAMES; i++) {
          if (loadedStatus[i] && images[i]?.complete && images[i].naturalWidth > 0) {
            const d = Math.abs(i - frameNum);
            if (d < bestDist) {
              bestDist = d;
              fallback = i;
            }
          }
        }
        if (fallback !== -1) {
          img = images[fallback];
        } else {
          return; // No frame loaded yet
        }
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (width === 0 || height === 0) return;

      const targetW = Math.round(width * dpr);
      const targetH = Math.round(height * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Object-fit: cover with centered alignment
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = width / height;
      let renderW = width;
      let renderH = height;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        renderW = width;
        renderH = width / imgRatio;
        offsetX = 0;
        offsetY = (height - renderH) / 2;
      } else {
        renderW = height * imgRatio;
        renderH = height;
        offsetX = (width - renderW) / 2;
        offsetY = 0;
      }

      ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
      ctx.restore();
      lastDrawnFrame = frameNum;

      // Update laptop screen overlay position whenever dimensions change
      updateScreenRect(offsetX, offsetY, renderW, renderH);
    };

    // Preload frames progressively
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const paddedIndex = String(i).padStart(3, '0');
      img.src = `/frames/ezgif-frame-${paddedIndex}.png`;
      img.onload = () => {
        if (isDestroyed) return;
        loadedStatus[i] = true;
        // Immediate first frame render
        if (i === 1 && lastDrawnFrame === -1) {
          drawFrame(1);
        } else if (i === Math.round(currentFrame)) {
          drawFrame(i);
        }
      };
      images[i] = img;
    }

    // Scroll progress handler
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
      if (totalScrollable <= 0) {
        targetFrame = 1;
        return;
      }
      const scrolled = -rect.top;
      const rawProgress = Math.min(Math.max(scrolled / totalScrollable, 0), 1);
      targetFrame = 1 + rawProgress * (TOTAL_FRAMES - 1);
    };

    // Resize handler to maintain sharp DPR and aspect ratio
    const handleResize = () => {
      if (lastDrawnFrame !== -1) {
        drawFrame(lastDrawnFrame);
      }
    };

    // Persistent RAF animation loop with lerp easing
    const loop = () => {
      if (isDestroyed) return;

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        currentFrame = targetFrame;
      } else {
        // Smooth easing towards targetFrame
        const diff = targetFrame - currentFrame;
        currentFrame += diff * 0.14;
      }

      const normalizedProgress = (currentFrame - 1) / (TOTAL_FRAMES - 1);
      setCurrentProgress(normalizedProgress);

      if (Math.abs(normalizedProgress - lastNotifiedProgress) > 0.001) {
        onProgressChange?.(normalizedProgress);
        lastNotifiedProgress = normalizedProgress;
      }

      const rounded = Math.round(currentFrame);
      if (rounded !== lastDrawnFrame) {
        drawFrame(rounded);
      }

      animFrameId = requestAnimationFrame(loop);
    };

    // Initialize
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    animFrameId = requestAnimationFrame(loop);

    return () => {
      isDestroyed = true;
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [containerRef, onProgressChange]);

  // Laptop screen logo opacity: fades in smoothly between 92% and 98%
  const laptopLogoOpacity = currentProgress >= 0.92 
    ? Math.min(Math.max((currentProgress - 0.92) / 0.06, 0), 1) 
    : 0;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 select-none">
      {/* HTML5 Canvas for the frame sequence */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* =========================================================================
          FINAL 95-100% LAPTOP SCREEN OVERLAY: ONLY THE AUTHENTIC BYOLABS LOGO
         ========================================================================= */}
      {screenRect && currentProgress >= 0.90 && (
        <div
          style={{
            position: 'absolute',
            left: `${screenRect.x}px`,
            top: `${screenRect.y}px`,
            width: `${screenRect.width}px`,
            height: `${screenRect.height}px`,
            pointerEvents: 'none',
            transform: 'translateZ(0)',
          }}
          className="flex items-center justify-center bg-[#06080f] rounded-[4px] overflow-hidden shadow-2xl z-10"
        >
          {/* Subtle screen glass highlight reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-cyan-500/[0.04] pointer-events-none" />
          
          {/* Subtle cyan ambient screen glow */}
          <div className="absolute w-2/3 h-2/3 rounded-full bg-cyan-500/[0.08] blur-xl pointer-events-none" />

          {/* Authentic BYOLabs Logo naturally centered with comfortable space and preserved aspect ratio */}
          <img
            src="/byolabs-logo.png"
            alt="BYOLabs"
            style={{
              opacity: laptopLogoOpacity,
              transition: 'opacity 0.15s ease-out',
            }}
            className="relative z-10 w-[55%] h-[55%] max-w-[340px] max-h-[150px] object-contain drop-shadow-[0_0_25px_rgba(6,182,212,0.45)]"
          />
        </div>
      )}

      {/* Cinematic Dark Luxury / Deep Gold Overlays */}
      {/* Deep dark fade from bottom and top to blend seamlessly into background */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#090a10] via-transparent to-[#090a10]/80 pointer-events-none" />
      
      {/* Radial vignette to eliminate any visible canvas edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(9,10,16,0.15)_0%,#090a10_85%)] pointer-events-none" />

      {/* Subtle luxury ambient gold glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-500/[0.035] rounded-full blur-[150px] pointer-events-none" />

      {/* Subtle violet/cyan depth accent */}
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/[0.04] rounded-full blur-[140px] pointer-events-none" />
    </div>
  );
};
