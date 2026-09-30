import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    // Only run on desktop/pointing devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;

    // High performance coordinate trackers using quickTo
    const xDot = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3' });
    const yDot = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3' });

    const xRing = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power2.out' });
    const yRing = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power2.out' });

    const handleMouseMove = (e) => {
      xDot(e.clientX);
      yDot(e.clientY);
      xRing(e.clientX);
      yRing(e.clientY);
    };

    // Hover scale effects on interactive elements
    const handleElementHover = (e) => {
      const target = e.target.closest('button, a, input, textarea, [data-magnetic="true"]');
      if (target) {
        gsap.to(ring, { scale: 1.8, borderColor: 'rgba(52, 211, 153, 0.8)', duration: 0.25 });
        gsap.to(dot, { scale: 1.4, backgroundColor: '#34d399', duration: 0.25 });
      } else {
        gsap.to(ring, { scale: 1, borderColor: 'rgba(115, 115, 115, 0.4)', duration: 0.25 });
        gsap.to(dot, { scale: 1, backgroundColor: '#10b981', duration: 0.25 });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleElementHover);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleElementHover);
    };
  }, []);

  return (
    <>
      {/* Precision Follower Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 -ml-1 -mt-1 bg-emerald-500 rounded-full pointer-events-none z-[9999]"
      />

      {/* Trailing Elastic Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-8 h-8 -ml-4 -mt-4 rounded-full border border-neutral-600/40 pointer-events-none z-[9998] transition-colors"
      />
    </>
  );
}