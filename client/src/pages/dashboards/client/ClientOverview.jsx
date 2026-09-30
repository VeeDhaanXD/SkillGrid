import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import DashboardShell from '../../../components/layout/DashboardShell';
import { clientNav } from '../../../components/layout/navConfig';
import { useAuth } from '../../../context/AuthContext';
import { StatCard, Panel, SectionLabel, ProgressBar, CountUp, Toast, SkeletonBlock } from '../../../components/common/TechUI';
import { fetchClientDashboard } from '../../../services/dashboardService';
import { listProjectProposals } from '../../../services/projectService';
import { acceptProposal, declineProposal } from '../../../services/proposalService';
import { feedTone, money, fmtDateLite } from '../../../utils/format';
import { Briefcase, Users, Lock, Plus, ArrowUpRight, X, Star, Shield, Loader2, Check } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function ClientOverview() {
  const container = useRef(null);
  const drawerRef = useRef(null);
  const [selectedBid, setSelectedBid] = useState(null);
  const [bidData, setBidData] = useState(null);
  const [bidLoading, setBidLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const load = useCallback(() => {
    fetchClientDashboard()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loaded = !!data;

  useGSAP(
    () => {
      if (!loaded) return;
      gsap.fromTo('.dash-header > *', { opacity: 0, y: -10 }, { opacity: 1, y: 0, stagger: 0.07, duration: 0.4, ease: 'power3.out' });
      gsap.fromTo('.project-row', { opacity: 0, x: -16 }, { opacity: 1, x: 0, stagger: 0.08, duration: 0.4, ease: 'power3.out', delay: 0.2 });
      gsap.fromTo('.feed-line', { opacity: 0, x: -8 }, { opacity: 1, x: 0, stagger: 0.07, duration: 0.3, ease: 'power2.out', delay: 0.45 });
    },
    { scope: container, dependencies: [loaded] }
  );

  const openBids = (p) => {
    setSelectedBid(p);
    setBidData(null);
    setBidLoading(true);
    listProjectProposals(p.id)
      .then((rows) => {
        const pending = rows.filter((r) => r.status === 'pending');
        pending.sort((a, b) => b.match - a.match);
        setBidData(pending);
      })
      .catch((e) => setToast(e.message))
      .finally(() => setBidLoading(false));
  };

  useGSAP(() => {
    if (selectedBid) {
      gsap.fromTo(drawerRef.current, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
      gsap.fromTo('.backdrop', { opacity: 0 }, { opacity: 1, duration: 0.3 });
    }
  }, [selectedBid]);

  const decide = async (action, proposalId) => {
    setBusy(true);
    try {
      if (action === 'accept') {
        await acceptProposal(proposalId);
        setToast('Proposal accepted — escrow locked, work has started');
      } else {
        await declineProposal(proposalId);
        setToast('Proposal declined');
      }
      setSelectedBid(null);
      load();
    } catch (e) {
      setToast(e.message);
    } finally {
      setBusy(false);
      setTimeout(() => setToast(''), 3000);
    }
  };

  const stats = data?.stats;
  const escrow = data?.escrow;
  const topBid = bidData && bidData.length ? bidData[0] : null;

  return (
    <DashboardShell roleTitle="Client" roleBadgeColor="text-teal-400" navItems={clientNav}>
      <div ref={container} className="space-y-6">
        {/* Header */}
        <div className="dash-header flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel>command center</SectionLabel>
            <h1 className="mt-1.5 text-xl font-semibold text-white">
              {user?.name} <span className="text-neutral-600 font-normal">— {loaded ? stats.active : '…'} projects active</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <Link
              to="/client/profile"
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-neutral-300 hover:border-teal-500/40 hover:text-teal-300 transition"
            >
              My profile
            </Link>
            <Link
              to="/client/create"
              className="group flex items-center gap-1.5 rounded-lg bg-teal-500 px-3.5 py-2 text-xs font-semibold text-black hover:bg-teal-400 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Post project
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-400">Failed to load dashboard: {error}</div>
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
              <StatCard label="active postings" value={stats.active} icon={Briefcase} accent="emerald" spark={stats.sparks.posted} delay={0.05} />
              <StatCard label="proposals received" value={stats.proposals} icon={Users} accent="teal" spark={stats.sparks.bids} delay={0.12} />
              <StatCard label="escrow locked" value={escrow.locked} prefix="$" icon={Lock} accent="sky" spark={stats.sparks.spend} delay={0.19} />
              <StatCard label="hire rate" value={stats.hireRate} suffix="%" icon={Shield} accent="violet" spark={stats.sparks.posted} delay={0.26} />
            </div>

            {/* Escrow meter */}
            <Panel delay={0.3} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <SectionLabel>escrow health</SectionLabel>
                  <p className="mt-1.5 text-2xl font-semibold text-white">
                    <CountUp to={escrow.locked} prefix="$" delay={0.5} />
                    <span className="text-sm font-normal text-neutral-600"> / {money(escrow.allocated)} allocated</span>
                  </p>
                </div>
                <div className="w-full sm:w-72">
                  <div className="flex justify-between mb-1.5 font-mono text-[10px] text-neutral-600">
                    <span>locked</span>
                    <span className="text-teal-400">{escrow.pct}%</span>
                  </div>
                  <ProgressBar value={escrow.pct} color="bg-teal-400" delay={0.6} />
                  <div className="mt-2 flex justify-between font-mono text-[9px] text-neutral-700">
                    <span>{escrow.pendingMilestones} milestones pending release</span>
                    <span>{escrow.next ? `next: ${fmtDateLite(escrow.next.due)}` : 'next: —'}</span>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Projects + Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Projects */}
              <Panel delay={0.38} className="lg:col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center justify-between mb-4">
                  <SectionLabel>recent projects</SectionLabel>
                  <Link to="/client/manage" className="text-[11px] text-teal-400 hover:text-teal-300 transition">manage all →</Link>
                </div>
                <div className="space-y-2">
                  {data.projects.length === 0 && (
                    <p className="font-mono text-xs text-neutral-600 text-center py-6">no projects yet — post your first one</p>
                  )}
                  {data.projects.map((p) => (
                    <div key={p.id} className="project-row group rounded-xl border border-white/[0.05] bg-[#0d0f0f] p-4 hover:border-teal-500/25 transition-all duration-300">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-[13px] font-medium text-neutral-300 group-hover:text-white transition truncate">{p.title}</h3>
                          <p className="text-[11px] text-neutral-600 mt-0.5">{money(p.budget)} · {p.proposals} proposals</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`font-mono text-[9px] uppercase rounded px-2 py-1 ${
                            p.status === 'Open' ? 'bg-emerald-500/10 text-emerald-400' :
                            p.status === 'Reviewing' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-sky-500/10 text-sky-400'
                          }`}>{p.status}</span>
                          <button
                            onClick={() => openBids(p)}
                            className="flex items-center gap-1 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[11px] text-neutral-400 hover:bg-teal-500 hover:text-black transition"
                          >
                            Bids <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  to="/client/create"
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.08] py-3 text-[12px] text-neutral-600 hover:border-teal-500/40 hover:text-teal-400 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> New project
                </Link>
              </Panel>

              {/* Feed */}
              <Panel delay={0.46} className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-[#0b0d0d] p-5">
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>activity stream</SectionLabel>
                  <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase text-teal-400">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-400" />
                    </span>
                    live
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {data.feed.length === 0 && <p className="text-neutral-700 py-3">no activity yet</p>}
                  {data.feed.map((f, i) => (
                    <div key={i} className="feed-line flex items-start gap-2.5">
                      <span className="text-neutral-700 tabular-nums">{f.t}</span>
                      <span className="text-teal-400/60">❯</span>
                      <span className={`${feedTone(f.tone)} leading-relaxed`}>{f.text}</span>
                    </div>
                  ))}
                  <div className="feed-line flex items-center gap-2.5">
                    <span className="text-neutral-700 tabular-nums">--:--</span>
                    <span className="text-teal-400/60">❯</span>
                    <span className="inline-block h-3 w-1.5 animate-pulse bg-teal-400/70" />
                  </div>
                </div>
              </Panel>
            </div>
          </>
        )}

        {/* Proposal drawer */}
        {selectedBid && (
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => !busy && setSelectedBid(null)}>
            <div className="backdrop absolute inset-0 bg-black/65 backdrop-blur-sm opacity-0" />
            <div
              ref={drawerRef}
              onClick={(e) => e.stopPropagation()}
              className="relative h-full w-full max-w-md border-l border-white/[0.08] bg-[#101211] p-6 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <SectionLabel>top proposal</SectionLabel>
                <button onClick={() => !busy && setSelectedBid(null)} className="text-neutral-500 hover:text-white transition" aria-label="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <h3 className="text-base font-semibold text-white mb-1">{selectedBid.title}</h3>
                <p className="text-xs text-neutral-500 mb-5 font-mono">budget {money(selectedBid.budget)} · {selectedBid.proposals} bids</p>

                {bidLoading && <SkeletonBlock className="h-40 w-full" />}

                {!bidLoading && !topBid && (
                  <div className="rounded-xl border border-dashed border-white/[0.08] p-6 text-center">
                    <p className="text-xs text-neutral-500">No pending proposals on this project yet.</p>
                  </div>
                )}

                {topBid && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500/25 to-sky-500/25 border border-teal-500/30 flex items-center justify-center text-[11px] font-bold text-teal-300">{topBid.initials}</span>
                        <div>
                          <p className="text-sm font-medium text-neutral-200">{topBid.freelancer}</p>
                          <p className="text-[10px] text-neutral-600 flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> {topBid.rating} · {topBid.jobs} jobs
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-semibold text-teal-400">{money(topBid.bid)}</span>
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">{topBid.summary || 'No cover letter provided.'}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(topBid.skills || []).slice(0, 6).map((s) => (
                        <span key={s} className="font-mono text-[9px] text-neutral-500 border border-white/[0.06] rounded px-1.5 py-0.5">{s}</span>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/[0.06] grid grid-cols-3 text-center">
                      {[
                        { l: 'match', v: `${topBid.match}%` },
                        { l: 'eta', v: topBid.eta },
                        { l: 'rating', v: `${topBid.rating}★` },
                      ].map((m) => (
                        <div key={m.l}>
                          <p className="font-mono text-[13px] text-teal-300">{m.v}</p>
                          <p className="font-mono text-[9px] uppercase text-neutral-700">{m.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bidData && bidData.length > 1 && (
                  <div className="mt-4">
                    <SectionLabel className="mb-2">other pending bids ({bidData.length - 1})</SectionLabel>
                    <div className="space-y-2">
                      {bidData.slice(1, 4).map((b) => (
                        <div key={b.id} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2">
                          <div className="min-w-0">
                            <p className="text-[12px] text-neutral-300 truncate">{b.freelancer}</p>
                            <p className="text-[10px] text-neutral-600">{b.match}% match · {b.eta}</p>
                          </div>
                          <span className="font-mono text-[12px] text-teal-400">{money(b.bid)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 mt-4 border-t border-white/[0.06]">
                <button
                  disabled={!topBid || busy}
                  onClick={() => decide('decline', topBid.id)}
                  className="flex-1 rounded-lg border border-white/[0.08] py-2.5 text-xs font-medium text-neutral-400 hover:bg-white/[0.04] transition disabled:opacity-40"
                >
                  Decline
                </button>
                <button
                  disabled={!topBid || busy}
                  onClick={() => decide('accept', topBid.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-teal-500 py-2.5 text-xs font-semibold text-black hover:bg-teal-400 transition disabled:opacity-40"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {busy ? 'Working…' : 'Accept proposal'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Toast show={!!toast} message={toast} />
    </DashboardShell>
  );
}
