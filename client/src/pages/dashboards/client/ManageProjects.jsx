import { useRef, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import DashboardShell from '../../../components/layout/DashboardShell';
import { clientNav } from '../../../components/layout/navConfig';
import { SectionLabel, Panel, ProgressBar, Toast, SkeletonBlock } from '../../../components/common/TechUI';
import { listProjects, updateProject } from '../../../services/projectService';
import { money, fmtDateLite } from '../../../utils/format';
import { Plus, FolderKanban, ArrowUpRight, CalendarClock, Loader2, X } from 'lucide-react';

gsap.registerPlugin(useGSAP);

const FILTERS = ['All', 'Open', 'Reviewing', 'In Progress', 'Completed', 'Disputed'];

function ProgressRing({ value, delay }) {
  const ref = useRef(null);
  const R = 17;
  const C = 2 * Math.PI * R;

  useGSAP(() => {
    gsap.fromTo(
      ref.current,
      { strokeDashoffset: C },
      { strokeDashoffset: C - (C * value) / 100, duration: 1.2, delay, ease: 'power3.out' }
    );
  }, [value]);

  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0 -rotate-90" aria-hidden="true">
      <circle cx="22" cy="22" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle
        ref={ref}
        cx="22"
        cy="22"
        r={R}
        fill="none"
        stroke={value === 100 ? '#34d399' : value > 0 ? '#2dd4bf' : '#38bdf8'}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C}
      />
      <text x="22" y="24" textAnchor="middle" transform="rotate(90 22 22)" className="fill-neutral-400 font-mono" style={{ fontSize: 10 }}>
        {value}
      </text>
    </svg>
  );
}

export default function ManageProjects() {
  const [filter, setFilter] = useState('All');
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');
  const container = useRef(null);
  const navigate = useNavigate();

  const load = useCallback(() => {
    listProjects({ mine: 1 })
      .then(setProjects)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loaded = !!projects;
  const filtered = !loaded ? [] : filter === 'All' ? projects : projects.filter((p) => p.statusLabel === filter);

  useGSAP(
    () => {
      if (!loaded) return;
      gsap.fromTo('.proj-card', { opacity: 0, y: 16 }, { opacity: 1, y: 0, stagger: 0.07, duration: 0.4, ease: 'power3.out' });
    },
    { scope: container, dependencies: [loaded, filter] }
  );

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const act = async (p, payload, msg) => {
    setBusyId(p.id);
    try {
      await updateProject(p.id, payload);
      flash(msg);
      load();
    } catch (e) {
      flash(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const statusStyle = (status) =>
    status === 'In Progress' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
    : status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : status === 'Reviewing' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    : status === 'Disputed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    : status === 'Cancelled' ? 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20'
    : 'bg-white/[0.05] text-neutral-400 border-white/[0.08]';

  const totals = loaded
    ? {
        active: projects.filter((p) => p.status === 'in_progress').length,
        pipeline: projects.reduce((sum, p) => sum + (p.status !== 'completed' && p.status !== 'cancelled' ? p.budget : 0), 0),
        done: projects.filter((p) => p.status === 'completed').length,
      }
    : { active: 0, pipeline: 0, done: 0 };

  return (
    <DashboardShell roleTitle="Client" roleBadgeColor="text-teal-400" navItems={clientNav}>
      <div ref={container} className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel><FolderKanban className="w-3 h-3 inline -mt-0.5 mr-1" />project pipeline</SectionLabel>
            <h1 className="mt-1.5 text-xl font-semibold text-white">Projects</h1>
          </div>
          <Link
            to="/client/create"
            className="flex items-center gap-1.5 rounded-lg bg-teal-500 px-3.5 py-2 text-xs font-semibold text-black hover:bg-teal-400 transition"
          >
            <Plus className="w-3.5 h-3.5" /> New project
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-400">Failed to load projects: {error}</div>
        )}

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'in progress', value: totals.active },
            { label: 'pipeline value', value: money(totals.pipeline) },
            { label: 'completed', value: totals.done },
          ].map((m, i) => (
            <Panel key={m.label} delay={0.05 + i * 0.07} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">{m.label}</p>
              <p className="mt-1 font-mono text-lg text-white">{loaded ? m.value : '—'}</p>
            </Panel>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filter === f ? 'bg-teal-500 text-black' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] border hover:border-white/[0.06] border-transparent'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Project cards */}
        <div className="space-y-2.5">
          {!loaded && (
            <>
              <SkeletonBlock className="h-24 w-full" />
              <SkeletonBlock className="h-24 w-full" />
              <SkeletonBlock className="h-24 w-full" />
            </>
          )}
          {loaded && filtered.length === 0 && (
            <Panel className="rounded-xl border border-dashed border-white/[0.08] p-10 text-center">
              <p className="text-sm text-neutral-500">
                {projects.length === 0 ? 'No projects yet — post your first one.' : `No projects with status “${filter}”.`}
              </p>
            </Panel>
          )}
          {filtered.map((p, i) => (
            <div key={p.id} className="proj-card group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:border-teal-500/25 hover:bg-white/[0.04]">
              <span className="absolute left-0 top-0 h-full w-[2px] scale-y-0 bg-teal-400 transition-transform duration-300 group-hover:scale-y-100 origin-top" />
              <div className="flex items-center gap-4">
                <ProgressRing value={p.progress} delay={0.35 + i * 0.08} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-medium text-neutral-200 group-hover:text-white transition truncate">{p.title}</h3>
                    <span className={`font-mono text-[9px] uppercase border rounded px-2 py-0.5 ${statusStyle(p.statusLabel)}`}>{p.statusLabel}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>{p.freelancer}</span>
                    <span className="font-mono text-teal-400/80">{money(p.budget)}</span>
                    <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" /> due {fmtDateLite(p.dueDate)}</span>
                    <span>{p.proposals} proposals</span>
                  </p>
                  {p.progress > 0 && p.progress < 100 && (
                    <div className="mt-2.5">
                      <ProgressBar value={p.progress} color="bg-teal-400" delay={0.4 + i * 0.08} />
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {p.status === 'open' && (
                    <button
                      disabled={busyId === p.id}
                      onClick={() => act(p, { status: 'cancelled' }, `Cancelled "${p.title}"`)}
                      className="rounded-lg border border-white/[0.08] p-2 text-neutral-500 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:border-rose-500/30 transition-all duration-200 disabled:opacity-40"
                      aria-label="Cancel project"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {p.status === 'open' && (
                    <button
                      onClick={() => navigate('/client/review')}
                      className="flex items-center gap-1 rounded-lg border border-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-neutral-400 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-teal-500 hover:text-black hover:border-teal-500"
                    >
                      Bids <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                  {p.status === 'in_progress' && (
                    <button
                      disabled={busyId === p.id}
                      onClick={() => act(p, { delta: 25 }, p.progress + 25 >= 100 ? `"${p.title}" completed — escrow released` : `Advanced "${p.title}" to ${Math.min(100, p.progress + 25)}%`)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-neutral-400 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-teal-500 hover:text-black hover:border-teal-500 disabled:opacity-40"
                    >
                      {busyId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      {busyId === p.id ? 'Saving…' : 'Advance +25%'}
                    </button>
                  )}
                  {(p.status === 'completed' || p.status === 'disputed' || p.status === 'cancelled') && (
                    <span className="font-mono text-[10px] uppercase text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {p.status === 'disputed' ? 'with admin' : p.status === 'cancelled' ? 'closed' : 'settled'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Toast show={!!toast} message={toast} />
    </DashboardShell>
  );
}
