import { useRef, useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import DashboardShell from '../../../components/layout/DashboardShell';
import { adminNav } from '../../../components/layout/navConfig';
import { fetchAdminDashboard } from '../../../services/dashboardService';
import { resolveDispute } from '../../../services/adminService';
import { Toast, SkeletonBlock } from '../../../components/common/TechUI';
import { money, fmtDateLite } from '../../../utils/format';
import { Activity, ShieldAlert, AlertTriangle, Check, XCircle, Users, FolderKanban, Loader2 } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function AdminOverview() {
  const container = useRef(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');

  const load = useCallback(() => {
    fetchAdminDashboard()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loaded = !!data;

  useGSAP(() => {
    if (!loaded) return;
    gsap.fromTo('.dispute-row',
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, stagger: 0.06, duration: 0.3, ease: 'power2.out' }
    );
  }, { scope: container, dependencies: [loaded] });

  const resolve = async (d, resolution) => {
    setBusyId(d.dbId);
    try {
      await resolveDispute(d.dbId, resolution, `Resolved from dashboard (${resolution})`);
      setToast(resolution === 'refund' ? `Refunded ${money(d.amount)} — "${d.project}"` : `Released ${money(d.amount)} to the developer`);
      load();
    } catch (e) {
      setToast(e.message);
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(''), 3200);
    }
  };

  const stats = data?.stats;
  const disputes = data?.disputes || [];

  return (
    <DashboardShell roleTitle="Admin" roleBadgeColor="text-rose-400" navItems={adminNav}>
      <div ref={container} className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-white mb-1">Platform Overview</h1>
          <p className="text-sm text-neutral-500">Monitor activity and resolve disputes</p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-400">Failed to load dashboard: {error}</div>
        )}

        {/* Metrics */}
        {!loaded && !error && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <SkeletonBlock className="h-24" />
            <SkeletonBlock className="h-24" />
            <SkeletonBlock className="h-24" />
            <SkeletonBlock className="h-24" />
          </div>
        )}
        {loaded && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { label: 'Open Disputes', value: stats.openDisputes.toLocaleString(), color: 'text-rose-400', icon: ShieldAlert },
              { label: 'Escrow Volume', value: money(stats.escrowVolume), color: 'text-white', icon: Activity },
              { label: 'Platform Users', value: stats.users.toLocaleString(), color: 'text-emerald-400', icon: Users },
              { label: 'Projects', value: stats.projects.toLocaleString(), color: 'text-sky-400', icon: FolderKanban },
            ].map((m) => (
              <div key={m.label} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <span className="flex items-center justify-between text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
                  {m.label}
                  <m.icon className="w-3.5 h-3.5 opacity-40" />
                </span>
                <p className={`text-2xl font-semibold mt-2 ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Disputes */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-rose-400 opacity-60" />
            <h2 className="text-sm font-medium text-neutral-300">Recent Disputes</h2>
            {loaded && <span className="font-mono text-[10px] text-neutral-600">{disputes.length} shown</span>}
          </div>

          <div className="space-y-2">
            {loaded && disputes.length === 0 && (
              <div className="p-8 rounded-xl border border-dashed border-white/[0.08] text-center">
                <p className="text-sm text-neutral-500">No disputes — the platform is calm.</p>
              </div>
            )}
            {disputes.map((d) => {
              const isOpen = d.status === 'open';
              return (
                <div key={d.dbId} className="dispute-row group p-4 rounded-xl border border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-mono text-rose-400 font-medium">{d.id}</span>
                        <span className="text-xs text-neutral-500">· {d.project}</span>
                        <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded ${isOpen ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {isOpen ? 'open' : d.status.replace('resolved_', '')}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mb-1">
                        raised by <span className="text-neutral-400">{d.initiatedBy}</span> · {fmtDateLite(d.createdAt)}
                      </p>
                      <p className="text-xs text-neutral-600 italic">"{d.reason}"</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-neutral-300">{money(d.amount)}</span>
                      {isOpen ? (
                        <>
                          <button
                            disabled={busyId === d.dbId}
                            onClick={() => resolve(d, 'refund')}
                            className="p-1.5 rounded-md border border-white/[0.06] text-neutral-500 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 transition disabled:opacity-40"
                            title="Refund client"
                          >
                            {busyId === d.dbId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            disabled={busyId === d.dbId}
                            onClick={() => resolve(d, 'release')}
                            className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-neutral-950 transition disabled:opacity-40"
                            title="Release to dev"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="font-mono text-[10px] uppercase text-neutral-600">resolved</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Toast show={!!toast} message={toast} />
    </DashboardShell>
  );
}
