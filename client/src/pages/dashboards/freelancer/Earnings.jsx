import { useRef, useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import DashboardShell from '../../../components/layout/DashboardShell';
import { freelancerNav } from '../../../components/layout/navConfig';
import { StatCard, Panel, SectionLabel, Sparkline, ProgressBar, Toast, Field, inputCls, SkeletonBlock } from '../../../components/common/TechUI';
import { fetchEarnings, withdraw as withdrawApi } from '../../../services/earningsService';
import { money, monthLabels, fmtDateLite } from '../../../utils/format';
import { ArrowDownLeft, CircleDollarSign, Clock, Wallet, X, Loader2 } from 'lucide-react';

gsap.registerPlugin(useGSAP);

const LABELS = monthLabels(12).filter((_, i) => i % 2 === 0);

function cumulative(series) {
  let sum = 0;
  return series.map((v) => (sum += v));
}

export default function Earnings() {
  const [toast, setToast] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const container = useRef(null);

  const load = useCallback(() => {
    fetchEarnings()
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
      gsap.fromTo('.tx-row', { opacity: 0, x: -14 }, { opacity: 1, x: 0, stagger: 0.07, duration: 0.35, ease: 'power3.out', delay: 0.15 });
    },
    { scope: container, dependencies: [loaded] }
  );

  const openWithdraw = () => {
    setAmount(String(data?.stats?.available || 0));
    setWithdrawing(true);
  };

  const confirmWithdraw = async () => {
    const n = Number(amount);
    if (!n || n <= 0) {
      setToast('Enter a valid amount');
      setTimeout(() => setToast(''), 2600);
      return;
    }
    setBusy(true);
    try {
      await withdrawApi(n);
      setWithdrawing(false);
      setToast(`Withdrawal of ${money(n)} initiated · processing`);
      setTimeout(() => setToast(''), 3000);
      load();
    } catch (e) {
      setToast(e.message);
      setTimeout(() => setToast(''), 3200);
    } finally {
      setBusy(false);
    }
  };

  const s = data?.stats;
  const paidSpark = data ? cumulative(data.chart.inflow).slice(-8) : [];

  return (
    <DashboardShell roleTitle="Freelancer" roleBadgeColor="text-emerald-400" navItems={freelancerNav}>
      <div ref={container} className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel>revenue console</SectionLabel>
            <h1 className="mt-1.5 text-xl font-semibold text-white">Earnings</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Track your payments and revenue</p>
          </div>
          <button
            onClick={openWithdraw}
            disabled={!loaded || s.available <= 0}
            className="group flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 transition shadow-[0_0_24px_-8px_rgba(16,185,129,0.7)] disabled:opacity-50 disabled:shadow-none"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
            Withdraw {loaded ? money(s.available) : '…'}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-400">Failed to load earnings: {error}</div>
        )}

        {!loaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SkeletonBlock className="h-28" />
            <SkeletonBlock className="h-28" />
            <SkeletonBlock className="h-28" />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard label="total earned" value={s.earned} prefix="$" accent="emerald" spark={s.sparks.earned} delay={0.05} />
              <StatCard label="pending" value={s.pending} prefix="$" accent="amber" spark={s.sparks.earned} delay={0.12} />
              <StatCard label="available" value={s.available} prefix="$" accent="sky" spark={paidSpark} delay={0.19} />
            </div>

            {/* Chart */}
            <Panel delay={0.26} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <SectionLabel>revenue · last 12 months</SectionLabel>
                <div className="flex gap-3 font-mono text-[10px] text-neutral-600">
                  <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> earned</span>
                  <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> payouts</span>
                </div>
              </div>
              <div className="relative rounded-lg bg-[#0b0d0d] border border-white/[0.04] p-4">
                {/* grid lines */}
                <div className="absolute inset-4 flex flex-col justify-between pointer-events-none" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => <span key={i} className="block h-px bg-white/[0.04]" />)}
                </div>
                <div className="relative">
                  <Sparkline data={data.chart.inflow} color="#34d399" height={130} strokeWidth={2} delay={0.5} duration={2} />
                  <div className="mt-2">
                    <Sparkline data={data.chart.outflow} color="#fbbf24" height={50} strokeWidth={1.5} fill={false} delay={0.8} duration={1.6} />
                  </div>
                </div>
                <div className="mt-2 flex justify-between font-mono text-[9px] text-neutral-700">
                  {LABELS.map((m, i) => <span key={`${m}-${i}`}>{m}</span>)}
                </div>
              </div>
            </Panel>

            {/* Payout status */}
            <Panel delay={0.34} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-neutral-200">Next payout</p>
                    <p className="text-[11px] text-neutral-600">
                      {s.next ? `${money(s.next.amount)} · milestone release · ${fmtDateLite(s.next.due)}` : 'No active milestone — pending work in escrow'}
                    </p>
                  </div>
                </div>
                <div className="flex-1 min-w-48 max-w-xs">
                  <div className="flex items-center justify-between mb-1.5 text-[10px] font-mono text-neutral-600">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> clearing</span>
                    <span className="text-amber-400">{s.next ? s.next.pct : 0}%</span>
                  </div>
                  <ProgressBar value={s.next ? s.next.pct : 0} color="bg-amber-400" delay={0.6} />
                </div>
              </div>
            </Panel>

            {/* Transactions */}
            <Panel delay={0.42} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-4">
                <SectionLabel><CircleDollarSign className="w-3 h-3 inline -mt-0.5 mr-1" />transactions</SectionLabel>
                <span className="font-mono text-[10px] text-neutral-600">{data.transactions.length} entries</span>
              </div>

              {/* table head */}
              <div className="hidden sm:grid grid-cols-12 gap-3 px-3 pb-2 border-b border-white/[0.06] font-mono text-[9px] uppercase tracking-widest text-neutral-700">
                <span className="col-span-5">project</span>
                <span className="col-span-2">client</span>
                <span className="col-span-2">method</span>
                <span className="col-span-1">date</span>
                <span className="col-span-1 text-right">amount</span>
                <span className="col-span-1 text-right">status</span>
              </div>

              <div className="mt-1 divide-y divide-white/[0.04]">
                {data.transactions.length === 0 && (
                  <p className="font-mono text-xs text-neutral-600 text-center py-8">no transactions yet</p>
                )}
                {data.transactions.map((t) => (
                  <div key={t.id} className="tx-row grid grid-cols-12 gap-3 items-center rounded-lg px-3 py-3 transition-colors hover:bg-white/[0.03]">
                    <span className="col-span-12 sm:col-span-5 text-[13px] font-medium text-neutral-300 truncate">{t.title}</span>
                    <span className="col-span-4 sm:col-span-2 text-[11px] text-neutral-600 truncate">{t.client}</span>
                    <span className="col-span-4 sm:col-span-2 text-[11px] text-neutral-600 truncate">{t.method}</span>
                    <span className="col-span-4 sm:col-span-1 font-mono text-[10px] text-neutral-700">{t.date}</span>
                    <span className={`col-span-6 sm:col-span-1 text-right font-mono text-[13px] font-semibold ${t.direction === 'out' ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {t.direction === 'out' ? '-' : '+'}{money(t.amount)}
                    </span>
                    <span className="col-span-6 sm:col-span-1 text-right">
                      <span
                        className={`font-mono text-[9px] uppercase rounded px-1.5 py-0.5 ${
                          t.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : t.status === 'Cancelled' ? 'bg-neutral-500/10 text-neutral-500' : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {t.status}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </>
        )}
      </div>

      {/* Withdraw modal */}
      {withdrawing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !busy && setWithdrawing(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-white/[0.09] bg-[#101211] p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-1">
              <SectionLabel>withdraw funds</SectionLabel>
              <button onClick={() => !busy && setWithdrawing(false)} className="text-neutral-500 hover:text-white transition" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-neutral-600 mb-4">Available balance: <span className="text-emerald-400">{money(s?.available || 0)}</span></p>
            <Field label="amount (usd)">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
            </Field>
            <div className="flex gap-2 mt-5">
              <button disabled={busy} onClick={() => setWithdrawing(false)} className="flex-1 rounded-lg border border-white/[0.08] py-2.5 text-xs font-medium text-neutral-400 hover:bg-white/[0.04] transition disabled:opacity-50">
                Cancel
              </button>
              <button
                onClick={confirmWithdraw}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2.5 text-xs font-semibold text-black hover:bg-emerald-400 transition disabled:opacity-60"
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {busy ? 'Processing…' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast show={!!toast} message={toast} />
    </DashboardShell>
  );
}
