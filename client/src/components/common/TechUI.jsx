import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const ACCENTS = {
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-400', ring: 'from-emerald-500/20', hex: '#34d399' },
  teal: { text: 'text-teal-400', bg: 'bg-teal-400', ring: 'from-teal-500/20', hex: '#2dd4bf' },
  sky: { text: 'text-sky-400', bg: 'bg-sky-400', ring: 'from-sky-500/20', hex: '#38bdf8' },
  violet: { text: 'text-violet-400', bg: 'bg-violet-400', ring: 'from-violet-500/20', hex: '#a78bfa' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-400', ring: 'from-amber-500/20', hex: '#fbbf24' },
};

/* Animated number counter */
export function CountUp({
  to,
  from = 0,
  duration = 1.6,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  delay = 0,
}) {
  const elRef = useRef(null);

  const fmt = (v) => {
    const n = decimals > 0 ? v.toFixed(decimals) : Math.round(v);
    const [int, frac] = String(n).split('.');
    const grouped = Number(int).toLocaleString('en-US');
    return frac ? `${grouped}.${frac}` : grouped;
  };

  useGSAP(() => {
    const obj = { v: from };
    const tween = gsap.to(obj, {
      v: to,
      duration,
      delay,
      ease: 'power2.out',
      onUpdate: () => {
        if (elRef.current) elRef.current.textContent = `${prefix}${fmt(obj.v)}${suffix}`;
      },
    });
    return () => tween.kill();
  }, [to, from]);

  return (
    <span ref={elRef} className={`tabular-nums ${className}`}>
      {prefix}
      {fmt(from)}
      {suffix}
    </span>
  );
}

/* SVG line chart that draws itself in */
export function Sparkline({
  data = [0, 0],
  color = '#34d399',
  height = 40,
  strokeWidth = 1.5,
  fill = true,
  delay = 0.3,
  duration = 1.4,
}) {
  const pathRef = useRef(null);
  const W = 100;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / Math.max(1, data.length - 1)) * W,
    height - 3 - ((v - min) / range) * (height - 8),
  ]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  const area = `${line} L ${W} ${height} L 0 ${height} Z`;

  useGSAP(
    () => {
      const path = pathRef.current;
      if (!path) return;
      const len = path.getTotalLength();
      gsap.fromTo(
        path,
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration, delay, ease: 'power2.out' }
      );
    },
    { dependencies: [data.join('-'), height] }
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      aria-hidden="true"
    >
      {fill && <path d={area} fill={color} opacity={0.09} />}
      <path
        ref={pathRef}
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* Panel with staggered entrance */
export function Panel({ children, className = '', delay = 0, y = 14, as: Tag = 'div' }) {
  const ref = useRef(null);
  useGSAP(() => {
    gsap.fromTo(
      ref.current,
      { opacity: 0, y },
      { opacity: 1, y: 0, duration: 0.5, delay, ease: 'power3.out' }
    );
  }, [delay]);
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

/* Stat card with counter + sparkline */
export function StatCard({ label, value, prefix = '', suffix = '', decimals = 0, delta, icon: Icon, accent = 'emerald', spark, delay = 0 }) {
  const a = ACCENTS[accent] || ACCENTS.emerald;
  return (
    <Panel delay={delay} className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]">
      <span className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${a.ring} via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
      <div className="flex items-start justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">{label}</span>
        {Icon && <Icon className={`w-3.5 h-3.5 ${a.text} opacity-50`} />}
      </div>
      <div className="flex items-end justify-between gap-2">
        <CountUp
          to={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          delay={delay + 0.15}
          className="text-2xl font-semibold text-white"
        />
        {delta && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${delta.startsWith('-') ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
            {delta}
          </span>
        )}
      </div>
      {spark && (
        <div className="mt-2 -mb-1">
          <Sparkline data={spark} color={a.hex} height={34} delay={delay + 0.3} />
        </div>
      )}
    </Panel>
  );
}

/* Animated progress bar */
export function ProgressBar({ value, color = 'bg-emerald-400', delay = 0.4, duration = 1.2, className = '' }) {
  const ref = useRef(null);
  useGSAP(() => {
    gsap.fromTo(ref.current, { width: '0%' }, { width: `${value}%`, duration, delay, ease: 'power3.out' });
  }, [value]);
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06] ${className}`}>
      <div ref={ref} className={`h-full rounded-full ${color}`} style={{ width: '0%' }} />
    </div>
  );
}

/* Mono section label */
export function SectionLabel({ children, className = '' }) {
  return (
    <p className={`font-mono text-[10px] uppercase tracking-widest text-neutral-500 ${className}`}>
      <span className="text-emerald-400/70">//</span> {children}
    </p>
  );
}

/* Form input with label */
export function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-neutral-500">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  'w-full rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none transition focus:border-emerald-500/50 focus:bg-white/[0.05]';

/* Toast notification driven by GSAP */
export function Toast({ show, message }) {
  const ref = useRef(null);
  useGSAP(() => {
    if (show) {
      gsap.fromTo(ref.current, { opacity: 0, y: 16, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.6)' });
    } else {
      gsap.to(ref.current, { opacity: 0, y: 16, duration: 0.25, ease: 'power2.in' });
    }
  }, [show]);
  return (
    <div
      ref={ref}
      className={`pointer-events-none fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-[#0d1110]/95 px-4 py-3 text-sm text-emerald-300 shadow-2xl backdrop-blur-xl ${show ? '' : 'opacity-0'}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      {message}
    </div>
  );
}

/* Loading skeleton placeholder */
export function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.04] ${className}`} />;
}
