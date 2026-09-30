import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MagneticButton from '../../../components/animations/MagneticButton';
import { api } from '../../../services/api';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const GLYPHS = '!<>-_\\/[]{}=+*^?#@$%&0123456789';

function buildScript(freelancers) {
  return [
    { t: 'cmd', text: 'skillgrid init --escrow' },
    { t: 'out', text: `→ linked · ${Number(freelancers || 0).toLocaleString('en-US')} verified freelancers` },
    { t: 'ok', text: '✓ escrow vault secured' },
    { t: 'cmd', text: 'skillgrid post --budget 1200' },
    { t: 'out', text: '→ broadcasting to talent pool...' },
    { t: 'ok', text: '✓ 12 bids received in 4.2s' },
    { t: 'cmd', text: 'skillgrid accept @maya.dev' },
    { t: 'ok', text: '✓ contract signed · milestone 1' },
    { t: 'cmd', text: 'skillgrid ship --release' },
    { t: 'ok', text: '✓ $1,200 released · rating 5.0' },
  ];
}

/* -------------------------------------------------------------
   Cipher scramble text — decodes left→right, re-runs on hover
------------------------------------------------------------- */
function Scramble({ text, className = '', startDelay = 0, hover = true }) {
  const rafRef = useRef(0);
  const runIdRef = useRef(0);
  const [out, setOut] = useState(() => text.replace(/[^ ]/g, '\u00A0'));

  const run = (delay) => {
    cancelAnimationFrame(rafRef.current);
    const id = ++runIdRef.current;
    const begin = performance.now() + delay;
    const duration = 550 + text.length * 40;

    const tick = (now) => {
      if (id !== runIdRef.current) return;
      if (now < begin) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const p = Math.min(1, (now - begin) / duration);
      const revealed = Math.floor(p * text.length);
      let out = text.slice(0, revealed);
      for (let i = revealed; i < text.length; i++) {
        out += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      setOut(out);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    run(startDelay);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span
      className={className}
      onMouseEnter={hover ? () => run(0) : undefined}
      aria-label={text}
    >
      {out}
    </span>
  );
}

/* -------------------------------------------------------------
   Live particle network canvas — links, data packets, mouse field
------------------------------------------------------------- */
function NetworkCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let rafId = 0;
    let particles = [];
    let packets = [];
    let lastSpawn = 0;
    const mouse = { x: -9999, y: -9999 };
    const LINK = 132;

    const build = () => {
      const count = Math.max(26, Math.min(78, Math.round((width * height) / 15500)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.34,
        vy: (Math.random() - 0.5) * 0.34,
        r: Math.random() * 1.3 + 0.6,
        sky: Math.random() > 0.78,
      }));
      packets = [];
      for (let i = 0; i < Math.min(6, count); i++) spawn(particles[i]);
    };

    const neighborsOf = (p) =>
      particles.filter((o) => o !== p && Math.hypot(o.x - p.x, o.y - p.y) < LINK);

    const spawn = (from) => {
      if (!from || packets.length > 15) return;
      const opts = neighborsOf(from);
      if (!opts.length) return;
      packets.push({
        a: from,
        b: opts[(Math.random() * opts.length) | 0],
        t: 0,
        speed: 0.006 + Math.random() * 0.013,
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      if (reduce) draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = width + 20;
        else if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        else if (p.y > height + 20) p.y = -20;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 15000 && d2 > 1) {
          const d = Math.sqrt(d2);
          const force = (122 - d) / 122;
          p.x += (dx / d) * force * 1.8;
          p.y += (dy / d) * force * 1.8;
        }
      }

      ctx.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(52,211,153,${(1 - d / LINK) * 0.3})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      if (mouse.x > -9000) {
        for (const p of particles) {
          const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          if (d < 175) {
            ctx.strokeStyle = `rgba(103,232,249,${(1 - d / 175) * 0.35})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.fillStyle = p.sky ? 'rgba(103,232,249,0.8)' : 'rgba(52,211,153,0.75)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = packets.length - 1; i >= 0; i--) {
        const pk = packets[i];
        pk.t += pk.speed;
        if (pk.t >= 1) {
          const next = pk.b;
          packets.splice(i, 1);
          spawn(next);
          continue;
        }
        const x = pk.a.x + (pk.b.x - pk.a.x) * pk.t;
        const y = pk.a.y + (pk.b.y - pk.a.y) * pk.t;
        const tx = pk.a.x + (pk.b.x - pk.a.x) * Math.max(0, pk.t - 0.14);
        const ty = pk.a.y + (pk.b.y - pk.a.y) * Math.max(0, pk.t - 0.14);
        ctx.strokeStyle = 'rgba(167,243,208,0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.save();
        ctx.shadowBlur = 9;
        ctx.shadowColor = 'rgba(52,211,153,0.95)';
        ctx.fillStyle = 'rgba(209,255,235,0.95)';
        ctx.beginPath();
        ctx.arc(x, y, 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const loop = (now) => {
      if (now - lastSpawn > 650) {
        lastSpawn = now;
        spawn(particles[(Math.random() * particles.length) | 0]);
      }
      draw();
      rafId = requestAnimationFrame(loop);
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        mouse.x = -9999;
        mouse.y = -9999;
        return;
      }
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    if (!reduce) {
      window.addEventListener('mousemove', onMove, { passive: true });
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-canvas absolute inset-0 h-full w-full" aria-hidden="true" />;
}

/* -------------------------------------------------------------
   Typewriter terminal — loops a realistic skillgrid session
------------------------------------------------------------- */
function TerminalLines({ freelancers }) {
  const [rendered, setRendered] = useState([]);
  const [typing, setTyping] = useState('');

  useEffect(() => {
    let cancelled = false;
    const timers = [];
    const SCRIPT = buildScript(freelancers);
    const wait = (ms) =>
      new Promise((res) => {
        timers.push(setTimeout(res, ms));
      });

    (async () => {
      while (!cancelled) {
        setRendered([]);
        setTyping('');
        await wait(500);
        for (const line of SCRIPT) {
          if (cancelled) return;
          if (line.t === 'cmd') {
            for (let i = 1; i <= line.text.length; i++) {
              if (cancelled) return;
              setTyping(line.text.slice(0, i));
              await wait(24 + Math.random() * 26);
            }
            setRendered((r) => [...r, line]);
            setTyping('');
            await wait(420);
          } else {
            await wait(300);
            setRendered((r) => [...r, line]);
            await wait(380);
          }
        }
        await wait(2800);
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [freelancers]);

  const colorFor = (t) =>
    t === 'cmd' ? 'text-neutral-100' : t === 'ok' ? 'text-emerald-400' : 'text-neutral-500';

  return (
    <div className="space-y-0.5">
      {rendered.map((l, i) => (
        <div
          key={i}
          className={`flex gap-2 term-line ${colorFor(l.t)}`}
          style={{ animation: 'heroTermLine 0.3s ease-out both' }}
        >
          {l.t === 'cmd' && <span className="text-emerald-400 select-none">❯</span>}
          <span className={l.t === 'cmd' ? 'text-neutral-100' : 'pl-4'}>{l.text}</span>
        </div>
      ))}
      <div className="flex gap-2">
        <span className="text-emerald-400 select-none">❯</span>
        <span className="text-neutral-100">{typing}</span>
        <span className="inline-block h-3.5 w-2 translate-y-0.5 bg-emerald-400/90 animate-pulse" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   Hero
------------------------------------------------------------- */
export default function HeroSection() {
  const sectionRef = useRef(null);
  const visualRef = useRef(null);
  const spotRef = useRef(null);
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    escrow: 482140,
    bids: 127,
    latency: 24,
    rating: 4.9,
    freelancers: 1420,
  });

  useEffect(() => {
    api('/public/stats')
      .then((s) => {
        setStats((prev) => ({
          escrow: s.escrowVolume || prev.escrow,
          bids: s.proposals || prev.bids,
          latency: s.latency || prev.latency,
          rating: s.rating || prev.rating,
          freelancers: s.freelancers || prev.freelancers,
        }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setStats((s) => ({
        ...s,
        escrow: s.escrow + 120 + Math.floor(Math.random() * 700),
        bids: Math.max(1, s.bids + Math.round((Math.random() - 0.45) * 6)),
        latency: 16 + Math.floor(Math.random() * 18),
      }));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' }, delay: 1 });
      tl.from('.hero-canvas', { opacity: 0, duration: 1.4, ease: 'power2.out' }, 0)
        .from('.hero-gridfloor', { opacity: 0, y: 50, duration: 1.2 }, 0)
        .from('.hero-eyebrow', { opacity: 0, x: -16, duration: 0.5 }, 0.1)
        .from(
          '.hero-badge',
          { opacity: 0, scale: 0.85, filter: 'blur(8px)', duration: 0.6, ease: 'back.out(1.7)' },
          0.15
        )
        .from('.hero-line span', { yPercent: 118, stagger: 0.09, duration: 0.9 }, 0.3)
        .from('.hero-sub', { y: 18, opacity: 0, duration: 0.5 }, 0.75)
        .from(
          '.hero-cta > *',
          { y: 14, opacity: 0, scale: 0.94, stagger: 0.08, duration: 0.45, ease: 'back.out(1.6)' },
          0.9
        )
        .from('.hero-stat', { y: 14, opacity: 0, stagger: 0.07, duration: 0.4 }, 1.05)
        .from('.hero-visual', { x: 70, opacity: 0, filter: 'blur(6px)', duration: 1 }, 0.45)
        .from(
          '.hero-float',
          { scale: 0.6, opacity: 0, stagger: 0.1, duration: 0.5, ease: 'back.out(2)' },
          1.15
        )
        .from('.hero-cue', { opacity: 0, y: 12, duration: 0.5 }, 1.5);

      gsap.to('.hero-float', {
        y: -9,
        duration: 2.4,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        stagger: { each: 0.45, from: 'random' },
        delay: 1.8,
      });

      // Scroll-scrubbed exit — layers leave at different speeds
      gsap
        .timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
          },
        })
        .to('.hero-left', { y: -90, opacity: 0.08, ease: 'none' }, 0)
        .to('.hero-visual', { y: -150, scale: 0.95, rotate: -1.5, ease: 'none' }, 0)
        .to('.hero-gridfloor', { yPercent: 45, ease: 'none' }, 0)
        .to('.hero-canvas', { yPercent: 16, ease: 'none' }, 0);

      // Mouse tilt + spotlight (fine pointers only)
      gsap.set(spotRef.current, { xPercent: -50, yPercent: -50 });
      if (window.matchMedia('(pointer: fine)').matches && visualRef.current) {
        const tilt = visualRef.current.querySelector('.hero-tilt');
        const xTo = gsap.quickTo(tilt, 'x', { duration: 0.7, ease: 'power3' });
        const yTo = gsap.quickTo(tilt, 'y', { duration: 0.7, ease: 'power3' });
        const rxTo = gsap.quickTo(tilt, 'rotateX', { duration: 0.7, ease: 'power3' });
        const ryTo = gsap.quickTo(tilt, 'rotateY', { duration: 0.7, ease: 'power3' });
        const sxTo = gsap.quickTo(spotRef.current, 'x', { duration: 0.9, ease: 'power3' });
        const syTo = gsap.quickTo(spotRef.current, 'y', { duration: 0.9, ease: 'power3' });

        const onMove = (e) => {
          const r = sectionRef.current.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          xTo(px * 20);
          yTo(py * 14);
          rxTo(-py * 7);
          ryTo(px * 9);
          sxTo(e.clientX - r.left - r.width / 2);
          syTo(e.clientY - r.top - r.height / 2);
        };
        sectionRef.current.addEventListener('mousemove', onMove, { passive: true });
        return () => sectionRef.current.removeEventListener('mousemove', onMove);
      }
    },
    { scope: sectionRef }
  );

  const chips = [
    { cls: 'top-2 -left-3 sm:-left-6', dot: 'bg-emerald-400', label: 'escrow.locked', val: '$1,200' },
    { cls: 'bottom-10 -left-4 sm:-left-8', dot: 'bg-sky-400', label: 'bid_stream', val: `+${stats.bids}` },
    { cls: '-bottom-3 right-4 sm:right-10', dot: 'bg-violet-400', label: 'kyc.verify', val: 'pass' },
    { cls: 'top-1/3 -right-3 sm:-right-7 hidden sm:flex', dot: 'bg-amber-400', label: 'latency', val: `${stats.latency}ms` },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen items-center overflow-hidden px-6 pt-24 pb-20 lg:px-12"
      id="hero"
    >
      {/* Layer 0 — static texture grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Layer 1 — live particle network */}
      <NetworkCanvas />

      {/* Layer 2 — cursor spotlight */}
      <div
        ref={spotRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[540px] w-[540px] rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.09),transparent_68%)]"
      />

      {/* Layer 3 — perspective data floor */}
      <div
        className="hero-gridfloor pointer-events-none absolute inset-x-0 bottom-0 h-[42%] overflow-hidden"
        style={{
          perspective: '520px',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)',
        }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 origin-bottom"
          style={{
            transform: 'rotateX(68deg) scale(1.7)',
            backgroundImage:
              'linear-gradient(rgba(52,211,153,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.13) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            animation: 'heroGridFlow 3s linear infinite',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-8">
        {/* Left */}
        <div className="hero-left lg:col-span-6 lg:pr-6">
          <div className="hero-badge mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[11px] text-neutral-400">Freelance infrastructure for builders</span>
            <span className="font-mono text-[10px] text-emerald-400/70">v2.4</span>
          </div>

          <p className="hero-eyebrow mb-5 font-mono text-[11px] tracking-wide text-emerald-400/80">
            // escrow_native_protocol
            <span className="ml-1 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-emerald-400/80" />
          </p>

          <h1 className="mb-6 text-[clamp(2.6rem,8vw,5rem)] font-bold leading-[1.05] tracking-tight">
            <span className="hero-line block overflow-hidden">
              <Scramble text="Build" className="inline-block pb-[0.1em]" startDelay={1150} />
            </span>
            <span className="hero-line block overflow-hidden">
              <Scramble text="faster." className="inline-block pb-[0.1em]" startDelay={1350} />
            </span>
            <span className="hero-line block overflow-hidden">
              <Scramble
                text="Get paid."
                className="inline-block bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text pb-[0.1em] text-transparent"
                startDelay={1550}
              />
            </span>
          </h1>

          <p className="hero-sub mb-8 max-w-md text-sm leading-relaxed text-neutral-500">
            Escrow-backed contracts. Real-time bidding. Verified talent. One programmable
            workspace that moves as fast as you ship.
          </p>

          <div className="hero-cta mb-9 flex flex-wrap gap-3">
            <MagneticButton
              onClick={() => navigate('/client')}
              className="group relative overflow-hidden rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-neutral-950 shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:bg-emerald-400 hover:shadow-emerald-500/35"
            >
              <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                <span className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent" style={{ animation: 'heroShine 3.2s ease-in-out infinite' }} />
              </span>
              <span className="relative flex items-center gap-2">
                Hire Talent
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </MagneticButton>
            <MagneticButton
              onClick={() => navigate('/freelancer')}
              className="rounded-xl border border-white/[0.09] bg-white/[0.03] px-6 py-3 text-sm font-medium text-neutral-300 transition-all duration-300 hover:border-white/[0.18] hover:bg-white/[0.07]"
            >
              Find Work
            </MagneticButton>
          </div>

          {/* Live stats */}
          <div className="hero-stats flex flex-wrap gap-2.5">
            {[
              { label: 'escrow locked', value: `$${stats.escrow.toLocaleString('en-US')}`, dot: 'bg-emerald-400', tone: 'text-emerald-400' },
              { label: 'bids live', value: stats.bids, dot: 'bg-sky-400', tone: 'text-sky-400' },
              { label: 'avg rating', value: `${stats.rating}★`, dot: 'bg-violet-400', tone: 'text-violet-400' },
            ].map((s, i) => (
              <div
                key={i}
                className="hero-stat flex items-center gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 backdrop-blur-sm"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${s.dot} animate-pulse`} />
                <span className="font-mono text-[13px] font-semibold tabular-nums text-neutral-200">
                  {s.value}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-neutral-600">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — HUD visual */}
        <div className="hero-visual lg:col-span-6" ref={visualRef} style={{ perspective: '1100px' }}>
          <div className="hero-tilt relative" style={{ transformStyle: 'preserve-3d' }}>
            {/* Orbit rings */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <div className="relative h-[108%] w-[108%] rounded-full border border-dashed border-emerald-500/15" style={{ animation: 'heroSpin 46s linear infinite' }}>
                <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.6)]" />
              </div>
              <div className="absolute h-[76%] w-[76%] rounded-full border border-dashed border-sky-500/12" style={{ animation: 'heroSpinRev 30s linear infinite' }}>
                <span className="absolute left-0 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400 shadow-[0_0_10px_2px_rgba(56,189,248,0.6)]" />
              </div>
            </div>

            {/* Corner brackets */}
            <div className="pointer-events-none absolute -inset-4 hidden sm:block" aria-hidden="true">
              <span className="absolute left-0 top-0 h-5 w-5 border-l border-t border-emerald-400/40" />
              <span className="absolute right-0 top-0 h-5 w-5 border-r border-t border-emerald-400/40" />
              <span className="absolute bottom-0 left-0 h-5 w-5 border-b border-l border-emerald-400/40" />
              <span className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-emerald-400/40" />
            </div>

            {/* Terminal */}
            <div className="relative mx-auto max-w-lg overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0b0f0e]/85 shadow-[0_0_70px_-18px_rgba(16,185,129,0.45)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-x-0 h-20 bg-gradient-to-b from-transparent via-emerald-400/[0.07] to-transparent" style={{ animation: 'heroScan 4.5s linear infinite' }} aria-hidden="true" />

              <div className="relative flex h-10 items-center gap-1.5 border-b border-white/[0.06] bg-white/[0.02] px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                <span className="ml-3 font-mono text-[10px] text-neutral-500">skillgrid — zsh</span>
                <span className="ml-auto flex items-center gap-1.5 font-mono text-[9px] text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  LIVE
                </span>
              </div>

              <div className="relative h-[286px] overflow-hidden p-5 font-mono text-[11px] leading-[1.85]">
                <TerminalLines freelancers={stats.freelancers} />
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.02] px-5 py-2.5 font-mono text-[9px] text-neutral-500">
                <span>
                  branch: main · escrow: <span className="text-emerald-400">secured</span>
                </span>
                <span>
                  latency: <span className="text-sky-400">{stats.latency}ms</span>
                </span>
              </div>
            </div>

            {/* Floating HUD chips */}
            {chips.map((c, i) => (
              <div
                key={i}
                className={`hero-float absolute ${c.cls} hidden items-center gap-2 rounded-lg border border-white/[0.09] bg-[#0d1110]/92 px-3 py-2 font-mono text-[10px] text-neutral-400 shadow-xl backdrop-blur-md sm:flex`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                {c.label}
                <span className="text-neutral-200">{c.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="hero-cue pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex">
        <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-neutral-600">scroll</span>
        <span className="relative block h-10 w-px overflow-hidden bg-white/[0.08]">
          <span className="absolute inset-x-0 top-0 h-3.5 bg-gradient-to-b from-emerald-400 to-transparent" style={{ animation: 'heroScrollDrop 1.8s ease-in-out infinite' }} />
        </span>
      </div>

      <style>{`
        @keyframes heroGridFlow {
          to { background-position: 0 48px, 48px 0; }
        }
        @keyframes heroSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes heroSpinRev {
          to { transform: rotate(-360deg); }
        }
        @keyframes heroScan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(500%); }
        }
        @keyframes heroScrollDrop {
          0% { transform: translateY(-110%); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateY(320%); opacity: 0; }
        }
        @keyframes heroTermLine {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes heroShine {
          0% { left: -60%; }
          55%, 100% { left: 130%; }
        }
      `}</style>
    </section>
  );
}
