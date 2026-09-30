import { useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import DashboardShell from '../../../components/layout/DashboardShell';
import { adminNav } from '../../../components/layout/navConfig';
import { listFlaggedProjects, moderateProject } from '../../../services/adminService';
import { Toast, SkeletonBlock } from '../../../components/common/TechUI';
import { money } from '../../../utils/format';
import { Check, XCircle, Loader2, Flag } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function ProjectModeration() {
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [toast, setToast] = useState('');

  const load = useCallback(() => {
    listFlaggedProjects(true)
      .then(setProjects)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loaded = !!projects;

  useGSAP(() => {
    if (!loaded) return;
    gsap.fromTo('.mod-row', { opacity: 0, y: 10 }, { opacity: 1, y: 0, stagger: 0.07, duration: 0.35, ease: 'power3.out' });
  }, [loaded]);

  const act = async (p, action) => {
    if (action === 'remove' && confirmId !== p.dbId) {
      setConfirmId(p.dbId);
      return;
    }
    setBusyId(p.dbId);
    try {
      await moderateProject(p.dbId, action, action === 'remove' ? 'Removed by moderation' : undefined);
      setToast(action === 'approve' ? `"${p.title}" approved — visible again` : `"${p.title}" removed from the platform`);
      setConfirmId(null);
      load();
    } catch (e) {
      setToast(e.message);
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(''), 3200);
    }
  };

  const statusStyle = (status) =>
    status === 'Flagged' ? 'text-rose-400 bg-rose-500/10' : 'text-yellow-400 bg-yellow-500/10';

  return (
    <DashboardShell roleTitle="Admin" roleBadgeColor="text-rose-400" navItems={adminNav}>
      <div className="space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-white mb-1">Moderation</h1>
          <p className="text-sm text-neutral-500">Review flagged projects</p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-400">Failed to load flagged projects: {error}</div>
        )}

        {!loaded && !error && (
          <div className="space-y-2">
            <SkeletonBlock className="h-24 w-full" />
            <SkeletonBlock className="h-24 w-full" />
          </div>
        )}

        {loaded && projects.length === 0 && (
          <div className="p-10 rounded-xl border border-dashed border-white/[0.08] text-center flex flex-col items-center gap-2">
            <Flag className="w-5 h-5 text-emerald-400 opacity-60" />
            <p className="text-sm text-neutral-500">No flagged projects — queue is clear.</p>
          </div>
        )}

        <div className="space-y-2">
          {(projects || []).map((p) => (
            <div key={p.dbId} className="mod-row p-4 rounded-xl border border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-mono text-rose-400">{p.id}</span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${statusStyle(p.status)}`}>
                      {p.status}
                    </span>
                    <span className="font-mono text-[9px] text-neutral-700">{p.time}</span>
                  </div>
                  <h3 className="text-sm font-medium text-neutral-200 mb-1">{p.title}</h3>
                  <p className="text-xs text-neutral-600">{p.client} · "{p.reason}" · {money(p.budget)}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    disabled={busyId === p.dbId}
                    onClick={() => act(p, 'remove')}
                    className={`p-1.5 rounded-md border transition disabled:opacity-40 ${
                      confirmId === p.dbId
                        ? 'border-rose-500/60 bg-rose-500/20 text-rose-300'
                        : 'border-white/[0.06] text-neutral-500 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5'
                    }`}
                    title={confirmId === p.dbId ? 'Click again to confirm removal' : 'Remove'}
                  >
                    {busyId === p.dbId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    disabled={busyId === p.dbId}
                    onClick={() => act(p, 'approve')}
                    className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-neutral-950 transition disabled:opacity-40"
                    title="Approve"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
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
