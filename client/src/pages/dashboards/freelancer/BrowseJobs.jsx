import { useRef, useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import DashboardShell from '../../../components/layout/DashboardShell';
import { freelancerNav } from '../../../components/layout/navConfig';
import { SectionLabel, Field, inputCls, Toast, SkeletonBlock } from '../../../components/common/TechUI';
import { listProjects } from '../../../services/projectService';
import { submitProposal } from '../../../services/proposalService';
import { money } from '../../../utils/format';
import { ArrowUpRight, Clock, Users, Bookmark, X, Send, SlidersHorizontal, Loader2 } from 'lucide-react';

gsap.registerPlugin(useGSAP);

const TAGS = ['All', 'Frontend', 'Backend', 'Full Stack', 'Web3', 'AI / ML', '3D / WebGL'];
const SAVED_KEY = 'skillgrid_saved_jobs';

export default function BrowseJobs() {
  const [selectedTag, setSelectedTag] = useState('All');
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState('');
  const [pitchingJob, setPitchingJob] = useState(null);
  const [pitch, setPitch] = useState({ amount: '', days: '', cover: '' });
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SAVED_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState('');
  const modalRef = useRef(null);
  const listRef = useRef(null);

  const load = useCallback(() => {
    const params = { status: 'open' };
    if (selectedTag !== 'All') params.category = selectedTag;
    listProjects(params)
      .then((data) => {
        setJobs(data);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [selectedTag]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = jobs || [];

  useGSAP(
    () => {
      gsap.fromTo('.job-card', { opacity: 0, y: 16 }, { opacity: 1, y: 0, stagger: 0.06, duration: 0.35, ease: 'power3.out' });
    },
    { scope: listRef, dependencies: [selectedTag, jobs] }
  );

  useGSAP(() => {
    if (pitchingJob) {
      gsap.fromTo(modalRef.current, { opacity: 0, y: 24, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.4)' });
    }
  }, [pitchingJob]);

  const toggleSave = (id) => {
    setSaved((s) => {
      const next = s.includes(id) ? s.filter((x) => x !== id) : [...s, id];
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  };

  const openPitch = (job) => {
    setPitch({ amount: String(job.budget), days: String(job.duration).replace(/[^\d]/g, '') || '14', cover: '' });
    setPitchingJob(job);
  };

  const sendPitch = async () => {
    if (!pitchingJob) return;
    if (!pitch.amount || !pitch.days) {
      setToast('Bid amount and delivery time are required');
      setTimeout(() => setToast(''), 2600);
      return;
    }
    setSending(true);
    try {
      await submitProposal(pitchingJob.id, {
        amount: Number(pitch.amount),
        deliveryDays: Number(pitch.days),
        coverLetter: pitch.cover,
      });
      setPitchingJob(null);
      setToast('Pitch transmitted successfully');
      setTimeout(() => setToast(''), 2600);
      load();
    } catch (e) {
      setToast(e.message);
      setTimeout(() => setToast(''), 3200);
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardShell roleTitle="Freelancer" roleBadgeColor="text-emerald-400" navItems={freelancerNav}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel>job feed · updated live</SectionLabel>
            <h1 className="mt-1.5 text-xl font-semibold text-white">Browse Jobs</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Find your next contract — {jobs ? filtered.length : '…'} open matches
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-neutral-600 border border-white/[0.06] rounded-lg px-3 py-2">
            <SlidersHorizontal className="w-3 h-3" /> auto-match on
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-400">Failed to load jobs: {error}</div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                selectedTag === tag
                  ? 'bg-emerald-500 text-black shadow-[0_0_20px_-6px_rgba(16,185,129,0.6)]'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06]'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Job list */}
        <div ref={listRef} className="space-y-2.5">
          {!jobs && (
            <>
              <SkeletonBlock className="h-24" />
              <SkeletonBlock className="h-24" />
              <SkeletonBlock className="h-24" />
            </>
          )}
          {jobs && jobs.length === 0 && (
            <p className="font-mono text-xs text-neutral-600 text-center py-10">no open jobs in this category right now</p>
          )}
          {filtered.map((job) => (
            <div key={job.id} className="job-card group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:border-emerald-500/25 hover:bg-white/[0.04]">
              <span className="absolute left-0 top-0 h-full w-[2px] scale-y-0 bg-emerald-400 transition-transform duration-300 group-hover:scale-y-100 origin-top" />
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-[9px] uppercase border border-white/[0.08] bg-white/[0.04] text-neutral-400 rounded px-1.5 py-0.5">{job.tag}</span>
                    <span className="text-[10px] text-neutral-600 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{job.duration}</span>
                    <span className="text-[10px] text-neutral-600 flex items-center gap-1"><Users className="w-2.5 h-2.5" />{job.bids} bids</span>
                    <span className="text-[10px] text-neutral-600">{job.level}</span>
                    <span className="text-[10px] text-neutral-700">· {job.time}</span>
                  </div>
                  <h3 className="text-sm font-medium text-neutral-200 group-hover:text-white transition mb-1.5">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(job.skills || []).map((s) => (
                      <span key={s} className="font-mono text-[9px] text-neutral-500 border border-white/[0.06] rounded px-1.5 py-0.5">{s}</span>
                    ))}
                    <span className="text-[11px] text-neutral-600 ml-1">· {job.client}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <p className="font-mono text-base font-semibold text-emerald-400">{money(job.budget)}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSave(job.id)}
                      className={`p-1.5 rounded-lg border transition ${saved.includes(job.id) ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-white/[0.08] text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.05]'}`}
                      aria-label="Save job"
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${saved.includes(job.id) ? 'fill-amber-400' : ''}`} />
                    </button>
                    <button
                      onClick={() => openPitch(job)}
                      className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-medium text-neutral-300 hover:bg-emerald-500 hover:text-black transition"
                    >
                      Pitch <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pitch Modal */}
        {pitchingJob && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !sending && setPitchingJob(null)}>
            <div ref={modalRef} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-white/[0.09] bg-[#101211] p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-1">
                <SectionLabel>submit pitch</SectionLabel>
                <button onClick={() => !sending && setPitchingJob(null)} className="text-neutral-500 hover:text-white transition" aria-label="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[13px] text-neutral-300 mb-4">{pitchingJob.title}</p>

              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="bid amount (usd)">
                    <input type="number" value={pitch.amount} onChange={(e) => setPitch((p) => ({ ...p, amount: e.target.value }))} className={inputCls} />
                  </Field>
                  <Field label="delivery (days)">
                    <input type="number" value={pitch.days} onChange={(e) => setPitch((p) => ({ ...p, days: e.target.value }))} className={inputCls} />
                  </Field>
                </div>
                <Field label="cover letter">
                  <textarea
                    rows="4"
                    value={pitch.cover}
                    onChange={(e) => setPitch((p) => ({ ...p, cover: e.target.value }))}
                    placeholder="Your approach, stack, and timeline..."
                    className={`${inputCls} resize-none`}
                  />
                </Field>
              </div>

              <div className="flex gap-2 mt-5">
                <button disabled={sending} onClick={() => setPitchingJob(null)} className="flex-1 rounded-lg border border-white/[0.08] py-2.5 text-xs font-medium text-neutral-400 hover:bg-white/[0.04] transition disabled:opacity-50">
                  Cancel
                </button>
                <button
                  onClick={sendPitch}
                  disabled={sending}
                  className="group flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2.5 text-xs font-semibold text-black hover:bg-emerald-400 transition disabled:opacity-60"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />}
                  {sending ? 'Transmitting…' : 'Send pitch'}
                </button>
              </div>
            </div>
          </div>
        )}

        <Toast show={!!toast} message={toast} />
      </div>
    </DashboardShell>
  );
}
