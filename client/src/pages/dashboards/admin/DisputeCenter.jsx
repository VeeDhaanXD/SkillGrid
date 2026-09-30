import { useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import DashboardShell from '../../../components/layout/DashboardShell';
import { adminNav } from '../../../components/layout/navConfig';
import { listDisputes, resolveDispute } from '../../../services/adminService';
import { Toast, SkeletonBlock } from '../../../components/common/TechUI';
import { money, fmtDateLite } from '../../../utils/format';
import { Check, XCircle, Loader2 } from 'lucide-react';

gsap.registerPlugin(useGSAP);

const STATUS_LABEL = {
  open: 'open',
  resolved_client_refund: 'refunded to client',
  resolved_dev_release: 'released to dev',
};

export default function DisputeCenter() {
  const [disputes, setDisputes] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');

  const load = useCallback(() => {
    listDisputes()
      .then(setDisputes)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loaded = !!disputes;

  useGSAP(() => {
    if (!loaded) return;
    gsap.fromTo('.dsp-row', { opacity: 0, y: 10 }, { opacity: 1, y: 0, stagger: 0.06, duration: 0.35, ease: 'power3.out' });
  }, [loaded]);

  const resolve = async (d, resolution) => {
    setBusyId(d.dbId);
    try {
      await resolveDispute(d.dbId, resolution, `Resolved from dispute center (${resolution})`);
      setToast(resolution === 'refund' ? `Refunded ${money(d.amount)} to ${d.client}` : `Released ${money(d.amount)} to ${d.dev}`);
      load();
    } catch (e) {
      setToast(e.message);
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(''), 3200);
    }
  };

  return (
    <DashboardShell roleTitle="Admin" roleBadgeColor="text-rose-400" navItems={adminNav}>
      <div className="space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-white mb-1">Disputes</h1>
          <p className="text-sm text-neutral-500">Mediate and resolve conflicts</p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-400">Failed to load disputes: {error}</div>
        )}

        {!loaded && !error && (
          <div className="space-y-2">
            <SkeletonBlock className="h-24 w-full" />
            <SkeletonBlock className="h-24 w-full" />
            <SkeletonBlock className="h-24 w-full" />
          </div>
        )}

        {loaded && disputes.length === 0 && (
          <div className="p-10 rounded-xl border border-dashed border-white/[0.08] text-center">
            <p className="text-sm text-neutral-500">No disputes — nothing to mediate right now.</p>
          </div>
        )}

        <div className="space-y-2">
          {(disputes || []).map((d) => {
            const isOpen = d.status === 'open';
            return (
              <div key={d.dbId} className="dsp-row p-4 rounded-xl border border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-mono text-rose-400">{d.id}</span>
                      <span className="text-xs text-neutral-500">· {d.project}</span>
                      <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded ${isOpen ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {STATUS_LABEL[d.status] || d.status}
                      </span>
                      <span className="font-mono text-[9px] text-neutral-700 ml-auto">{d.time}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-1">
                      <span className="text-neutral-400">{d.client}</span> → <span className="text-neutral-400">{d.dev}</span>
                      <span className="text-neutral-700"> · raised by {d.initiatedBy}</span>
                    </p>
                    <p className="text-xs text-neutral-600 italic">"{d.reason}"</p>
                    {d.notes ? <p className="text-[11px] text-neutral-600 mt-1">admin note: {d.notes}</p> : null}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-neutral-300">{money(d.amount)}</span>
                    {isOpen ? (
                      <>
                        <button
                          disabled={busyId === d.dbId}
                          onClick={() => resolve(d, 'refund')}
                          className="p-1.5 rounded-md border border-white/[0.06] text-neutral-500 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 transition disabled:opacity-40"
                          title="Refund"
                        >
                          {busyId === d.dbId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          disabled={busyId === d.dbId}
                          onClick={() => resolve(d, 'release')}
                          className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-neutral-950 transition disabled:opacity-40"
                          title="Release"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="font-mono text-[10px] uppercase text-neutral-600">{fmtDateLite(d.createdAt) || 'resolved'}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Toast show={!!toast} message={toast} />
    </DashboardShell>
  );
}
