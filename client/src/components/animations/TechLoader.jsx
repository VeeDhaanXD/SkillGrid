import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Terminal, Cpu, ShieldCheck } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function TechLoader({ onComplete }) {
  const container = useRef(null);
  const counterRef = useRef(null);
  const [percent, setPercent] = useState(0);

  useGSAP(() => {
    const tl = gsap.timeline({
      defaults: { ease: 'power4.inOut' },
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    // 1. Telemetry Counter 0 -> 100
    const counterObj = { val: 0 };
    tl.to(counterObj, {
      val: 100,
      duration: 1.6,
      ease: 'power2.inOut',
      onUpdate: () => {
        setPercent(Math.floor(counterObj.val));
      },
    })
    // 2. Terminal Log Line Glitches
    .from('.loader-log', {
      opacity: 0,
      x: -15,
      stagger: 0.1,
      duration: 0.2,
      ease: 'steps(4)',
    }, 0.2)
    // 3. Grid Laser Line Pulse
    .to('.scan-line', {
      top: '100%',
      duration: 1.2,
      ease: 'none',
      repeat: 1,
      yoyo: true,
    }, 0)
    // 4. Center Hologram HUD Collapse
    .to('.loader-hud', {
      scale: 0.85,
      opacity: 0,
      filter: 'blur(8px)',
      duration: 0.5,
      ease: 'power3.in',
    }, '-=0.2')
    // 5. Shutter Cut Split (Top & Bottom Doors Retract)
    .to('.shutter-top', {
      yPercent: -100,
      duration: 0.85,
      ease: 'expo.inOut',
    }, '-=0.1')
    .to('.shutter-bottom', {
      yPercent: 100,
      duration: 0.85,
      ease: 'expo.inOut',
    }, '<')
    // 6. Kill entire container from pointer tree
    .set(container.current, { display: 'none' });

  }, { scope: container });

  return (
    <div
      ref={container}
      className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-auto select-none overflow-hidden font-mono"
    >
      {/* Top Half Shutter */}
      <div className="shutter-top absolute top-0 left-0 w-full h-1/2 bg-neutral-950 border-b border-emerald-500/20 z-10 flex items-end justify-center pb-2">
        <div className="w-full max-w-5xl px-6 flex justify-between text-[10px] text-neutral-600">
          <span>// PROTOCOL: SKILLGRID_CORE_v4.2</span>
          <span>CHIP: ARM_64X_SYS</span>
        </div>
      </div>

      {/* Bottom Half Shutter */}
      <div className="shutter-bottom absolute bottom-0 left-0 w-full h-1/2 bg-neutral-950 border-t border-emerald-500/20 z-10 flex items-start justify-center pt-2">
        <div className="w-full max-w-5xl px-6 flex justify-between text-[10px] text-neutral-600">
          <span>STATUS: SECURE_SOCKET_VERIFIED</span>
          <span>LATENCY: 12ms</span>
        </div>
      </div>

      {/* Laser Scanning Line */}
      <div className="scan-line absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] z-20 pointer-events-none" />

      {/* Background Matrix Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#052e1615_1px,transparent_1px),linear-gradient(to_bottom,#052e1615_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none z-10" />

      {/* Center HUD & Diagnostics */}
      <div className="loader-hud relative z-20 flex flex-col items-center justify-center p-8 max-w-md w-full">
        {/* Animated HUD Emblem */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-md flex items-center justify-center rotate-45 shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-pulse">
            <Terminal className="w-8 h-8 text-emerald-400 -rotate-45" />
          </div>
          <div className="absolute -inset-2 border border-dashed border-emerald-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
        </div>

        {/* Dynamic Percentage Counter */}
        <div className="flex items-baseline gap-1 text-emerald-400 font-bold mb-4">
          <span ref={counterRef} className="text-6xl tracking-tighter">
            {percent}
          </span>
          <span className="text-xl font-mono text-emerald-600">%</span>
        </div>

        {/* Micro Terminal Output Feed */}
        <div className="w-full bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 text-[11px] space-y-1 backdrop-blur-md">
          <div className="loader-log flex items-center gap-2 text-neutral-400">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>MOUNTING_DISTRIBUTED_ESCROW...</span>
          </div>
          <div className="loader-log flex items-center gap-2 text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>DECRYPTING_ROLE_PERMISSIONS...</span>
          </div>
          <div className="loader-log flex items-center gap-2 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>SKILLGRID_ENVIRONMENT: READY</span>
          </div>
        </div>

        {/* Progress Fill Line */}
        <div className="w-full h-1 bg-neutral-900 rounded-full mt-4 overflow-hidden border border-neutral-800">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 shadow-[0_0_10px_#10b981] transition-all duration-75"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}