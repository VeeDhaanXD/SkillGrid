import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import DashboardShell from '../../../components/layout/DashboardShell';
import { freelancerNav } from '../../../components/layout/navConfig';
import { useAuth } from '../../../context/AuthContext';
import { StatCard, Panel, SectionLabel, Sparkline, ProgressBar, CountUp, SkeletonBlock } from '../../../components/common/TechUI';
import { fetchFreelancerDashboard } from '../../../services/dashboardService';
import { feedTone, money, monthLabels, pctChange, parseHours } from '../../../utils/format';
import { Search, Zap, ArrowUpRight, Timer, TrendingUp, Terminal } from 'lucide-react';

gsap.registerPlugin(useGSAP);

const LABELS = monthLabels(12);

export default function FreelancerOverview() {
  const container = useRef(null);
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetchFreelancerDashboard()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  const loaded = !!data;

  useGSAP(
    () => {
      if (!loaded) return;
      gsap.fromTo('.job-row', { opacity: 0, x: -16 }, { opacity: 1, x: 0, stagger: 0.08, duration: 0.4, ease: 'power3.out', delay: 0.15 });
      gsap.fromTo('.task-row', { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: 0.09, duration: 0.4, ease: 'power3.out', delay: 0.25 });
      gsap.fromTo('.feed-line', { opacity: 0, x: -8 }, { opacity: 1, x: 0, stagger: 0.07, duration: 0.3, ease: 'power2.out', delay: 0.45 });
      gsap.fromTo('.dash-header > *', { opacity: 0, y: -10 }, { opacity: 1, y: 0, stagger: 0.07, duration: 0.4, ease: 'power3.out' });
    },
    { scope: container, dependencies: [loaded] }
  );

  const stats = data?.stats;
  const delta = stats ? pctChange(stats.chart?.inflow) : null;

  return (
    <DashboardShell roleTitle="Freelancer" roleBadgeColor="text-emerald-400" navItems={freelancerNav}>
      <div ref={container} className="space-y-6">
        {/* Header */}
        <div className="dash-header flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel>welcome back operator</SectionLabel>
            <h1 className="mt-1.5 text-xl font-semibold text-white">
              {user?.name} <span className="text-neutral-600 font-normal">— ready to ship?</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <Link
              to="/freelancer/profile"
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-neutral-300 hover:border-emerald-500/40 hover:text-emerald-300 transition"
            >
              My profile
            </Link>
            <Link
              to="/freelancer/browse"
              className="group flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-black hover:bg-emerald-400 transition"
            >
              Browse jobs <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-400">
            Failed to load dashboard: {error}
          </div>
        )}

        {!loaded ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SkeletonBlock className="h-28" />
            <SkeletonBlock className="h-28" />
            <SkeletonBlock className="h-28" />
            <SkeletonBlock className="h-28" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="success rate" value={stats.success} suffix="%" accent="emerald" spark={stats.sparks.success} delay={0.05} />
              <StatCard label="total earned" value={stats.earned} prefix="$" accent="sky" delta={delta !== null ? `${delta >= 0 ? '+' : ''}${delta}%` : undefined} spark={stats.sparks.earned} delay={0.12} />
              <StatCard label="active bids" value={stats.activeBids} accent="teal" spark={stats.sparks.bids} delay={0.19} />
              <StatCard label="avg response" value={parseHours(stats.responseTime)} decimals={1} suffix="h" accent="violet" spark={stats.sparks.rating} delay={0.26} />
            </div>

            {/* Earnings pulse chart */}
            <Panel delay={0.3} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <SectionLabel>earnings pulse · last 12 months</SectionLabel>
                  <p className="mt-1.5 text-2xl font-semibold text-white">
                    <CountUp to={stats.earned} prefix="$" delay={0.5} />
                    {delta !== null && (
                      <span className={`ml-2 align-middle text-[11px] font-medium rounded px-1.5 py-0.5 ${delta >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                        {delta >= 0 ? '+' : ''}{delta}%
                      </span>
                    )}
                  </p>
                </div>
                <span className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-neutral-600">
                  <TrendingUp className="w-3 h-3 text-emerald-400" /> from escrow releases
                </span>
              </div>
              <div className="mt-3 rounded-lg bg-[#0b0d0d] border border-white/[0.04] p-3">
                <Sparkline data={stats.chart.inflow} color="#34d399" height={110} strokeWidth={2} delay={0.55} duration={1.8} />
                <div className="mt-1.5 flex justify-between font-mono text-[9px] text-neutral-700">
                  <span>{LABELS[0]}</span>
                  <span>{LABELS[3]}</span>
                  <span>{LABELS[7]}</span>
                  <span>{LABELS[11]}</span>
                </div>
              </div>
            </Panel>

            {/* Jobs + Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recommended jobs */}
              <Panel delay={0.38} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center justify-between mb-4">
                  <SectionLabel><Search className="w-3 h-3 inline -mt-0.5 mr-1" />recommended for you</SectionLabel>
                  <Link to="/freelancer/browse" className="text-[11px] text-emerald-400 hover:text-emerald-300 transition">view all →</Link>
                </div>
                <div className="space-y-2">
                  {data.jobs.length === 0 && (
                    <p className="text-xs text-neutral-600 font-mono py-6 text-center">no open jobs right now — check back soon</p>
                  )}
                  {data.jobs.map((job) => (
                    <Link
                      key={job.id}
                      to="/freelancer/browse"
                      className="job-row group block rounded-xl border border-white/[0.05] bg-[#0d0f0f] p-4 hover:border-emerald-500/25 hover:bg-white/[0.03] transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-mono text-[9px] uppercase border border-white/[0.08] bg-white/[0.04] text-neutral-400 rounded px-1.5 py-0.5">{job.tag}</span>
                            <span className="text-[10px] text-neutral-600">{job.time}</span>
                          </div>
                          <h3 className="text-[13px] font-medium text-neutral-300 group-hover:text-white transition truncate">{job.title}</h3>
                          <p className="mt-1 text-[11px] text-neutral-600">{job.client} · {job.bids} bids · {job.duration}</p>
                        </div>
                        <span className="shrink-0 font-mono text-sm font-semibold text-emerald-400">{money(job.budget)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </Panel>

              {/* Active tasks */}
              <Panel delay={0.46} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center justify-between mb-4">
                  <SectionLabel><Zap className="w-3 h-3 inline -mt-0.5 mr-1" />active tasks</SectionLabel>
                  <span className="font-mono text-[10px] text-neutral-600">{data.tasks.length} in progress</span>
                </div>
                <div className="space-y-4">
                  {data.tasks.length === 0 && (
                    <p className="text-xs text-neutral-600 font-mono py-6 text-center">no active work — accept a bid to get moving</p>
                  )}
                  {data.tasks.map((t, i) => (
                    <div key={t.id} className="task-row">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] font-medium text-neutral-300 truncate mr-3">{t.title}</span>
                        <span className={`font-mono text-[10px] shrink-0 ${t.status === 'disputed' ? 'text-rose-400' : 'text-neutral-600'}`}>
                          {t.status === 'disputed' ? 'disputed' : `due ${t.due}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <ProgressBar value={t.progress} color={t.color} delay={0.55 + i * 0.12} className="flex-1" />
                        <span className="font-mono text-[11px] text-neutral-400 tabular-nums w-9 text-right">{t.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-white/[0.06] grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'on-time', value: `${stats.onTime}%`, icon: Timer },
                    { label: 'rating', value: `${stats.rating}★`, icon: TrendingUp },
                    { label: 'jobs', value: `${stats.jobs}`, icon: Terminal },
                  ].map((m) => (
                    <div key={m.label}>
                      <m.icon className="w-3.5 h-3.5 mx-auto mb-1 text-neutral-600" />
                      <p className="font-mono text-[13px] text-neutral-300">{m.value}</p>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-neutral-700">{m.label}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            {/* Activity feed */}
            <Panel delay={0.54} className="rounded-xl border border-white/[0.06] bg-[#0b0d0d] p-5">
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>activity stream</SectionLabel>
                <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase text-emerald-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  live
                </span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                {data.feed.length === 0 && <p className="text-neutral-700 py-3">no activity yet</p>}
                {data.feed.map((f, i) => (
                  <div key={i} className="feed-line flex items-center gap-3">
                    <span className="text-neutral-700 tabular-nums">{f.t}</span>
                    <span className="text-emerald-400/60">❯</span>
                    <span className={feedTone(f.tone)}>{f.text}</span>
                  </div>
                ))}
                <div className="feed-line flex items-center gap-3">
                  <span className="text-neutral-700 tabular-nums">--:--</span>
                  <span className="text-emerald-400/60">❯</span>
                  <span className="inline-block h-3 w-1.5 animate-pulse bg-emerald-400/70" />
                </div>
              </div>
            </Panel>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
