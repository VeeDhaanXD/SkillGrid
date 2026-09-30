import { useRef, useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import DashboardShell from '../../../components/layout/DashboardShell';
import { clientNav } from '../../../components/layout/navConfig';
import { SectionLabel, Panel, Toast, SkeletonBlock } from '../../../components/common/TechUI';
import { listReceivedProposals, acceptProposal, declineProposal } from '../../../services/proposalService';
import { Star, X, Check, FileText, Sparkles, Loader2 } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function ReviewProposals() {
  const [proposals, setProposals] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState('');
  const cardsRef = useRef({});
  const modalRef = useRef(null);

  const load = useCallback(() => {
    listReceivedProposals()
      .then(setProposals)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loaded = !!proposals;

  useGSAP(() => {
    if (!loaded) return;
    gsap.fromTo('.prop-card', { opacity: 0, y: 18 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: 'power3.out', delay: 0.15 });
    gsap.fromTo('.prop-bar', { scaleX: 0 }, { scaleX: 1, stagger: 0.1, duration: 0.9, ease: 'power3.out', delay: 0.4 });
  }, [loaded]);

  useGSAP(() => {
    if (selected) {
      gsap.fromTo(modalRef.current, { opacity: 0, y: 24, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.4)' });
    }
  }, [selected]);

  const decide = async (proposal, accept) => {
    if (busy) return;
    setBusy(true);
    try {
      if (accept) await acceptProposal(proposal.id);
      else await declineProposal(proposal.id);
    } catch (e) {
      setBusy(false);
      setToast(e.message);
      setTimeout(() => setToast(''), 3200);
      return;
    }
    setBusy(false);

    const el = cardsRef.current[proposal.id];
    const finish = () => {
      setProposals((list) => (list || []).filter((p) => p.id !== proposal.id));
      setSelected(null);
      setToast(accept ? `Accepted ${proposal.freelancer} · ${proposal.project}` : `Declined ${proposal.freelancer}`);
      setTimeout(() => setToast(''), 2600);
    };
    if (el) {
      gsap.to(el, {
        x: accept ? 60 : -60,
        opacity: 0,
        height: 0,
        marginBottom: 0,
        paddingTop: 0,
        paddingBottom: 0,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: finish,
      });
    } else {
      finish();
    }
  };

  return (
    <DashboardShell roleTitle="Client" roleBadgeColor="text-teal-400" navItems={clientNav}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel><FileText className="w-3 h-3 inline -mt-0.5 mr-1" />incoming bids</SectionLabel>
            <h1 className="mt-1.5 text-xl font-semibold text-white">Proposals</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Review and accept freelancer bids — {loaded ? proposals.length : '…'} awaiting decision</p>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-neutral-600 border border-white/[0.06] rounded-lg px-3 py-2">
            <Sparkles className="w-3 h-3 text-teal-400" /> match ranked
          </span>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-400">Failed to load proposals: {error}</div>
        )}

        {!loaded && !error && (
          <div className="space-y-3">
            <SkeletonBlock className="h-28 w-full" />
            <SkeletonBlock className="h-28 w-full" />
            <SkeletonBlock className="h-28 w-full" />
          </div>
        )}

        {/* Proposal cards */}
        <div className="space-y-3">
          {(proposals || []).map((p) => (
            <div
              key={p.id}
              ref={(el) => { cardsRef.current[p.id] = el; }}
              className="prop-card group overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:border-teal-500/25 hover:bg-white/[0.04]"
            >
              <div className="flex flex-wrap items-start gap-4">
                {/* Avatar */}
                <span className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-teal-500/25 to-sky-500/25 border border-teal-500/30 flex items-center justify-center text-[13px] font-bold text-teal-300">
                  {p.initials}
                </span>

                {/* Body */}
                <div className="flex-1 min-w-52">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[13px] font-semibold text-neutral-200 group-hover:text-white transition">{p.freelancer}</span>
                    <span className="flex items-center gap-0.5 text-[11px] text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" /> {Number(p.rating || 5).toFixed(1)}
                    </span>
                    <span className="text-[10px] text-neutral-600">· {p.jobs} jobs</span>
                    <span className="font-mono text-[9px] uppercase border border-white/[0.08] bg-white/[0.04] text-neutral-400 rounded px-1.5 py-0.5 ml-auto sm:ml-0">{p.project}</span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2 max-w-2xl">{p.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(p.skills || []).map((s) => (
                      <span key={s} className="font-mono text-[9px] text-neutral-500 border border-white/[0.06] rounded px-1.5 py-0.5">{s}</span>
                    ))}
                  </div>
                </div>

                {/* Match meter */}
                <div className="w-36 shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-600">match</span>
                    <span className="font-mono text-[11px] text-teal-400">{p.match}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="prop-bar h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 origin-left"
                      style={{ width: `${p.match}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between font-mono text-[9px] text-neutral-700">
                    <span>eta {p.eta}</span>
                    <span>bid ${p.bid.toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex w-full sm:w-auto items-center gap-2 sm:flex-col sm:items-end">
                  <p className="font-mono text-base font-semibold text-teal-400 sm:mb-2">${p.bid.toLocaleString()}</p>
                  <div className="flex gap-1.5 ml-auto sm:ml-0">
                    <button
                      disabled={busy}
                      onClick={() => decide(p, false)}
                      className="rounded-lg border border-white/[0.08] p-2 text-neutral-500 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/[0.06] transition disabled:opacity-40"
                      aria-label="Decline"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => decide(p, true)}
                      className="rounded-lg bg-teal-500 p-2 text-black hover:bg-teal-400 transition disabled:opacity-40"
                      aria-label="Accept"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSelected(p)}
                      className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-neutral-400 hover:bg-white/[0.05] hover:text-white transition"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loaded && proposals.length === 0 && (
          <Panel className="rounded-xl border border-dashed border-white/[0.08] p-10 text-center">
            <p className="text-sm text-neutral-500">All proposals reviewed — inbox zero.</p>
          </Panel>
        )}

        {/* Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div ref={modalRef} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-white/[0.09] bg-[#101211] p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <SectionLabel>proposal detail</SectionLabel>
                <button onClick={() => setSelected(null)} className="text-neutral-500 hover:text-white transition" aria-label="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500/25 to-sky-500/25 border border-teal-500/30 flex items-center justify-center text-[13px] font-bold text-teal-300">{selected.initials}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{selected.freelancer}</p>
                  <p className="text-[11px] text-neutral-600">★ {Number(selected.rating || 5).toFixed(1)} · {selected.jobs} jobs · eta {selected.eta}</p>
                </div>
                <span className="ml-auto font-mono text-lg font-semibold text-teal-400">${selected.bid.toLocaleString()}</span>
              </div>

              <p className="text-xs text-neutral-500 leading-relaxed mb-4">{selected.summary}</p>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] uppercase text-neutral-600">match score</span>
                  <span className="font-mono text-[12px] text-teal-400">{selected.match}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="prop-bar h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 origin-left" style={{ width: `${selected.match}%` }} />
                </div>
              </div>

              <div className="flex gap-2">
                <button disabled={busy} onClick={() => decide(selected, false)} className="flex-1 rounded-lg border border-white/[0.08] py-2.5 text-xs font-medium text-neutral-400 hover:bg-white/[0.04] transition disabled:opacity-40">
                  Decline
                </button>
                <button disabled={busy} onClick={() => decide(selected, true)} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-teal-500 py-2.5 text-xs font-semibold text-black hover:bg-teal-400 transition disabled:opacity-40">
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
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
