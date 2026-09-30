import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight, Terminal } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import MagneticButton from '../../components/animations/MagneticButton';
import HeroSection from './sections/HeroSection';
import { api } from '../../services/api';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FALLBACK_STATS = {
  freelancers: 1420,
  escrowVolume: 48200,
  completed: 340,
  rating: 4.9,
  latency: 24,
};

const FALLBACK_SHOWCASE = [
  { n: '01', title: 'MERN Admin Dashboard', desc: 'Real-time analytics with WebSocket feeds and GSAP data visualizations.', tag: 'Full Stack', tech: ['React', 'Node', 'GSAP'], border: 'border-emerald-500/20', badge: 'bg-emerald-500/10 text-emerald-400', progress: 100, client: 'Alpha Labs' },
  { n: '02', title: 'Three.js Product Config', desc: 'Interactive 3D product viewer with WebGL shaders and dynamic lighting.', tag: '3D / WebGL', tech: ['Three.js', 'React', 'GLSL'], border: 'border-sky-500/20', badge: 'bg-sky-500/10 text-sky-400', progress: 100, client: 'RetailTech' },
  { n: '03', title: 'Solana Escrow Suite', desc: 'Rust-based smart contracts for milestone payments and dispute resolution.', tag: 'Web3', tech: ['Rust', 'Solana', 'Anchor'], border: 'border-violet-500/20', badge: 'bg-violet-500/10 text-violet-400', progress: 85, client: 'DeFi Corp' },
  { n: '04', title: 'GSAP Scroll Portfolio', desc: 'Horizontal scroll sections with parallax depth and sub-second transitions.', tag: 'Frontend', tech: ['GSAP', 'React', 'Tailwind'], border: 'border-teal-500/20', badge: 'bg-teal-500/10 text-teal-400', progress: 100, client: 'CreativeCo' },
  { n: '05', title: 'AI Support Bot', desc: 'Fine-tuned LLM with RAG pipeline and multi-channel deployment.', tag: 'AI / ML', tech: ['Python', 'LangChain', 'GPT'], border: 'border-amber-500/20', badge: 'bg-amber-500/10 text-amber-400', progress: 70, client: 'FinServ' },
  { n: '06', title: 'Node Microservices', desc: 'API gateway with JWT auth, Redis caching, and Docker orchestration.', tag: 'Backend', tech: ['Node', 'Redis', 'Docker'], border: 'border-rose-500/20', badge: 'bg-rose-500/10 text-rose-400', progress: 100, client: 'ScaleUp' },
];

const CARD_PALETTE = [
  { border: 'border-emerald-500/20', badge: 'bg-emerald-500/10 text-emerald-400' },
  { border: 'border-sky-500/20', badge: 'bg-sky-500/10 text-sky-400' },
  { border: 'border-violet-500/20', badge: 'bg-violet-500/10 text-violet-400' },
  { border: 'border-teal-500/20', badge: 'bg-teal-500/10 text-teal-400' },
  { border: 'border-amber-500/20', badge: 'bg-amber-500/10 text-amber-400' },
  { border: 'border-rose-500/20', badge: 'bg-rose-500/10 text-rose-400' },
];

const FALLBACK_TICKER = [
  '99.8% Uptime',
  'Instant Dispute Resolution',
  'Zero-Fee Bidding',
  'On-Chain Audit Trail',
  'Milestone-Based Payments',
  '24h Average Response Time',
  'End-to-End Encryption',
];

export default function LandingPage() {
  const container = useRef(null);
  const horizontalSection = useRef(null);
  const trackRef = useRef(null);
  const navigate = useNavigate();
  const [publicStats, setPublicStats] = useState(FALLBACK_STATS);
  const [showcase, setShowcase] = useState(null);

  useEffect(() => {
    api('/public/stats')
      .then((s) => setPublicStats({ ...FALLBACK_STATS, ...s }))
      .catch(() => {});
    api('/public/showcase')
      .then((rows) => {
        if (Array.isArray(rows) && rows.length) setShowcase(rows);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (showcase) ScrollTrigger.refresh();
  }, [showcase]);

  const tickerItems = [
    `${publicStats.freelancers.toLocaleString('en-US')}+ Verified Freelancers`,
    `$${publicStats.escrowVolume.toLocaleString('en-US')} In Escrow`,
    `${publicStats.completed}+ Projects Completed`,
    ...FALLBACK_TICKER,
  ];

  const showcaseItems = (showcase || FALLBACK_SHOWCASE).map((raw, idx) => ({
    n: typeof raw.n === 'number' ? String(raw.n).padStart(2, '0') : raw.n,
    title: raw.title,
    desc: raw.desc,
    tag: raw.tag,
    tech: raw.tech || [],
    progress: typeof raw.progress === 'number' ? raw.progress : 100,
    client: raw.client || 'Client',
    border: CARD_PALETTE[idx % CARD_PALETTE.length].border,
    badge: CARD_PALETTE[idx % CARD_PALETTE.length].badge,
  }));

  const statItems = [
    { value: `${publicStats.freelancers.toLocaleString('en-US')}+`, label: 'Freelancers', color: 'text-emerald-400' },
    {
      value: publicStats.escrowVolume >= 1000
        ? `$${Math.round(publicStats.escrowVolume / 1000)}K+`
        : `$${publicStats.escrowVolume}+`,
      label: 'In Escrow',
      color: 'text-teal-400',
    },
    { value: `${publicStats.completed}+`, label: 'Projects Completed', color: 'text-sky-400' },
    { value: `${publicStats.rating}★`, label: 'Avg Rating', color: 'text-violet-400' },
  ];

  useGSAP(() => {
    // Preloader
    const preloader = document.getElementById('preloader');
    if (preloader) {
      gsap.to(preloader, {
        yPercent: -100,
        duration: 0.8,
        ease: 'power4.inOut',
        delay: 0.3,
        onComplete: () => preloader.remove(),
      });
    }

    // Nav entrance (hero entrance lives inside HeroSection)
    gsap.from('nav', { y: -30, opacity: 0, duration: 0.5, delay: 0.6, ease: 'power4.out' });

    // Horizontal Pin & Scroll Effect
    if (horizontalSection.current && trackRef.current) {
      const getScrollAmount = () => -(trackRef.current.scrollWidth - window.innerWidth + 80);

      gsap.to(trackRef.current, {
        x: getScrollAmount,
        ease: 'none',
        scrollTrigger: {
          trigger: horizontalSection.current,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          start: 'top top',
          end: () => `+=${trackRef.current.scrollWidth - window.innerWidth}`,
        },
      });
    }

    // Stats bar
    gsap.from('.stat-bar-item', {
      scrollTrigger: { trigger: '.stat-bar-item', start: 'top 90%' },
      y: 20,
      opacity: 0,
      stagger: 0.08,
      duration: 0.5,
      ease: 'power2.out',
    });

    // Testimonial
    gsap.from('.testimonial-section', {
      scrollTrigger: { trigger: '.testimonial-section', start: 'top 80%' },
      y: 30,
      opacity: 0,
      duration: 0.7,
      ease: 'power2.out',
    });

    // CTA section
    gsap.from('.final-cta', {
      scrollTrigger: { trigger: '.final-cta', start: 'top 85%' },
      y: 30,
      opacity: 0,
      duration: 0.7,
      ease: 'power2.out',
    });
  }, { scope: container });

  return (
    <div ref={container} className="bg-[#0a0a0a] text-neutral-100 overflow-x-hidden selection:bg-emerald-500 selection:text-black">
      {/* Preloader */}
      <div id="preloader" className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
          <Terminal className="w-4 h-4 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <span className="text-[11px] font-mono text-neutral-600 tracking-widest uppercase">SkillGrid</span>
      </div>

      {/* Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-emerald-500/8 blur-[120px] pointer-events-none -z-10" />

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 h-14 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl z-50 flex items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <span className="text-[9px] font-black text-neutral-950">S</span>
          </div>
          <span className="text-xs font-semibold tracking-wide text-neutral-300">SkillGrid</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth/login" className="text-[11px] font-medium px-3 py-1.5 rounded-md text-neutral-500 hover:text-white transition">
            Sign In
          </Link>
          <Link to="/freelancer" className="text-[11px] font-medium px-3 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition">
            Get Started
          </Link>
        </div>
      </nav>

      <HeroSection />

      {/* Ticker Strip */}
      <section className="py-6 border-y border-white/[0.04] overflow-hidden">
        <div className="ticker flex gap-8 whitespace-nowrap">
          {tickerItems.map((item, i) => (
            <span key={i} className="flex items-center gap-3 text-sm text-neutral-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/40 flex-shrink-0" />
              {item}
            </span>
          ))}
          {tickerItems.map((item, i) => (
            <span key={`dup-${i}`} className="flex items-center gap-3 text-sm text-neutral-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/40 flex-shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </section>

      <style>{`
        .ticker {
          animation: ticker 30s linear infinite;
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* Previous Projects - Horizontal Pin & Scrub */}
      <section 
        ref={horizontalSection} 
        className="h-screen w-full relative flex flex-col justify-center overflow-hidden border-b border-white/[0.04] bg-[#0a0a0a]"
      >
        {/* Background accent */}
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none -translate-y-1/2" />
        
        {/* Section Heading Header */}
        <div className="px-6 lg:px-12 mb-8 z-10 w-full max-w-7xl mx-auto flex items-end justify-between">
          <div>
            <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-1.5">// Portfolio</p>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">Previous Projects</h2>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-neutral-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Scroll down to navigate horizontally
          </div>
        </div>

        {/* Scrolling Card Track */}
        <div 
          ref={trackRef} 
          className="flex gap-6 pl-6 lg:pl-12 items-center will-change-transform pr-24"
        >
          {showcaseItems.map((item, idx) => (
            <div 
              key={idx} 
              className={`group w-[320px] md:w-[380px] h-[370px] rounded-2xl border ${item.border} bg-[#111111]/80 backdrop-blur-xl flex flex-col flex-shrink-0 overflow-hidden hover:border-white/[0.2] transition-all duration-300 shadow-xl relative select-none`}
            >
              <div className="p-6 flex flex-col justify-between h-full">
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-sm font-mono font-bold text-neutral-200">
                        {item.n}
                      </span>
                      <span className={`text-[10px] font-medium px-2.5 py-1 rounded-md border border-current/20 ${item.badge}`}>
                        {item.tag}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/[0.05] flex items-center justify-center text-[10px] font-bold text-neutral-400">
                        {item.client[0]}
                      </div>
                      <span className="text-[11px] text-neutral-500 font-medium">{item.client}</span>
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">
                    {item.desc}
                  </p>
                </div>

                <div>
                  {/* Tech stack */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {item.tech.map((t, i) => (
                      <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] text-neutral-400 border border-white/[0.06]">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Bottom Progress Row */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-24 h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-white/[0.05]">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${item.progress}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500">{item.progress}%</span>
                    </div>
                    <span className="text-xs font-medium text-neutral-400 group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                      Case Study <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 px-6 border-y border-white/[0.04] bg-white/[0.01]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {statItems.map((s, i) => (
            <div key={i} className="stat-bar-item text-center">
              <p className={`text-xl md:text-2xl font-bold ${s.color} mb-1`}>{s.value}</p>
              <p className="text-[10px] font-medium text-neutral-600 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="testimonial-section py-24 px-6 relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-[10px] text-neutral-500 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            From our community
          </div>
          
          <blockquote className="text-xl md:text-2xl font-medium text-neutral-200 leading-relaxed mb-8">
            "SkillGrid cut our hiring time from 2 weeks to 48 hours. The escrow system gives us zero-risk experimentation with new talent."
          </blockquote>
          
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-sm font-bold text-neutral-950">
              A
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Alex Chen</p>
              <p className="text-[11px] text-neutral-500">CTO, DevStudio</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta py-28 px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[400px] bg-emerald-500/8 rounded-full blur-[100px]" />
        </div>
        
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Start building<br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
              today.
            </span>
          </h2>
          <p className="text-sm text-neutral-500 mb-10 max-w-md mx-auto leading-relaxed">
            Join thousands of freelancers and clients already shipping faster with SkillGrid.
          </p>
          
          <div className="flex gap-3 justify-center mb-12">
            <MagneticButton
              onClick={() => navigate('/client')}
              className="group px-7 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
            >
              <span className="flex items-center gap-2">Hire Talent <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></span>
            </MagneticButton>
            <MagneticButton
              onClick={() => navigate('/freelancer')}
              className="px-7 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-neutral-300 text-sm font-medium transition-all duration-300"
            >
              Find Work
            </MagneticButton>
          </div>

          {/* Trust row */}
          <div className="flex items-center justify-center gap-6 text-[11px] text-neutral-600">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Free to start
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-12 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <span className="text-[9px] font-black text-neutral-950">S</span>
                </div>
                <span className="text-xs font-semibold text-neutral-300">SkillGrid</span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed max-w-xs">
                The freelance infrastructure for builders. Escrow-backed, milestone-based, zero friction.
              </p>
            </div>

            {/* Links */}
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Docs'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Security'] },
            ].map((col, i) => (
              <div key={i}>
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-[12px] text-neutral-600 hover:text-neutral-300 transition">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-white/[0.04] flex items-center justify-between">
            <span className="text-[11px] text-neutral-700">&copy; 2026 SkillGrid. All rights reserved.</span>
            <div className="flex items-center gap-4">
              {['Twitter', 'GitHub', 'Discord'].map((social, i) => (
                <a key={i} href="#" className="text-[11px] text-neutral-600 hover:text-neutral-300 transition">{social}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
