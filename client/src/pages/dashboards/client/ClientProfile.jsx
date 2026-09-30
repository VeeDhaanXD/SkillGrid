import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import DashboardShell from '../../../components/layout/DashboardShell';
import { clientNav } from '../../../components/layout/navConfig';
import { useAuth } from '../../../context/AuthContext';
import {
  CountUp, Panel, StatCard, ProgressBar, SectionLabel, Field, inputCls, Toast,
} from '../../../components/common/TechUI';
import {
  MapPin, Clock, Pencil, Check, X, Star, Building2, Globe, ShieldCheck,
  BadgeCheck, Users, CreditCard, Target, Plus, Trash2, Briefcase, Loader2,
} from 'lucide-react';
import { pctChange } from '../../../utils/format';

gsap.registerPlugin(useGSAP);

export default function ClientProfile() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const rootRef = useRef(null);

  useGSAP(
    () => {
      gsap.fromTo('.prof-banner', { opacity: 0, y: -14, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' });
    },
    { scope: rootRef }
  );

  if (!user) return null;

  const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const startEdit = () => {
    setDraft({
      ...user,
      categoriesRaw: (user.categories || []).join(', '),
      team: (user.team || []).map((t) => ({ ...t })),
    });
    setEditing(true);
  };

  const save = async () => {
    const categories = (draft.categoriesRaw || '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    setBusy(true);
    try {
      await updateProfile({
        headline: draft.headline?.trim() || user.headline,
        company: draft.company?.trim() || user.company,
        industry: draft.industry?.trim() || user.industry,
        companySize: draft.companySize?.trim() || user.companySize,
        website: draft.website?.trim() || user.website,
        location: draft.location?.trim() || user.location,
        timezone: draft.timezone?.trim() || user.timezone,
        bio: draft.bio?.trim() || user.bio,
        budgetRange: draft.budgetRange?.trim() || user.budgetRange,
        engagement: draft.engagement,
        categories,
        team: (draft.team || []).filter((t) => t.name.trim()),
      });
      setEditing(false);
      setToast('Profile updated');
      setTimeout(() => setToast(''), 2600);
    } catch (err) {
      setToast(err.message);
      setTimeout(() => setToast(''), 3200);
    } finally {
      setBusy(false);
    }
  };

  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const setTeam = (i, k, v) =>
    setDraft((d) => ({ ...d, team: d.team.map((m, idx) => (idx === i ? { ...m, [k]: v } : m)) }));
  const addTeam = () =>
    setDraft((d) => ({ ...d, team: [...d.team, { name: '', role: 'Member', initials: '??' }] }));
  const removeTeam = (i) => setDraft((d) => ({ ...d, team: d.team.filter((_, idx) => idx !== i) }));

  const stats = user.stats || {};
  const sparks = stats.sparks || {};
  const spendDelta = (() => {
    const c = pctChange(stats.monthlySpend);
    return c === null ? null : `${c >= 0 ? '+' : ''}${c}%`;
  })();

  return (
    <DashboardShell roleTitle="Client" roleBadgeColor="text-teal-400" navItems={clientNav}>
      <div ref={rootRef} className="space-y-6">
        {/* ===================== BANNER ===================== */}
        <div
          className="prof-banner relative overflow-hidden rounded-2xl border border-white/[0.07] p-6"
          style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.14), rgba(56,189,248,0.05) 45%, transparent 75%)' }}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-teal-400/[0.06] to-transparent" style={{ animation: 'profScan 5s linear infinite' }} aria-hidden="true" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/30 to-sky-500/30 border border-teal-500/40 flex items-center justify-center text-2xl font-bold text-teal-200 shadow-[0_0_40px_-8px_rgba(45,212,191,0.5)]">
                {initials}
              </div>
              <span className="absolute -bottom-1 -right-1 flex items-center gap-1 rounded-full border border-[#0a0a0a] bg-teal-500/90 px-1.5 py-0.5 font-mono text-[8px] uppercase text-black">
                <span className="h-1 w-1 rounded-full bg-black/60" />
                hiring
              </span>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-white">{user.name}</h1>
                <BadgeCheck className="w-4 h-4 text-teal-400" />
                <span className="font-mono text-[10px] border border-teal-500/25 bg-teal-500/10 text-teal-400 rounded px-1.5 py-0.5 uppercase">verified client</span>
              </div>

              {editing ? (
                <div className="mt-2 flex flex-wrap gap-2 max-w-lg">
                  <input value={draft.headline} onChange={(e) => setField('headline', e.target.value)} className={`${inputCls} flex-1 min-w-48 py-1.5 text-sm`} placeholder="Headline" />
                  <input value={draft.company} onChange={(e) => setField('company', e.target.value)} className={`${inputCls} w-40 py-1.5 text-sm`} placeholder="Company" />
                </div>
              ) : (
                <p className="text-sm text-teal-300/90 mt-0.5">{user.headline} · {user.company}</p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-500">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{editing ? <input value={draft.location} onChange={(e) => setField('location', e.target.value)} className="bg-transparent border-b border-white/10 focus:border-teal-400 outline-none text-neutral-300" /> : user.location}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{editing ? <input value={draft.timezone} onChange={(e) => setField('timezone', e.target.value)} className="w-20 bg-transparent border-b border-white/10 focus:border-teal-400 outline-none text-neutral-300" /> : user.timezone}</span>
                <span className="font-mono text-neutral-600">member since {user.memberSince}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                <span className="font-mono text-[10px] uppercase text-neutral-500">avg budget</span>
                <span className="font-mono text-sm text-teal-300"><CountUp to={stats.avgBudget} prefix="$" duration={1} /></span>
              </div>
              {editing ? (
                <div className="flex gap-2">
                  <button disabled={busy} onClick={save} className="flex items-center gap-1.5 rounded-lg bg-teal-500 px-3.5 py-2 text-xs font-semibold text-black hover:bg-teal-400 transition disabled:opacity-50">
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} {busy ? 'Saving…' : 'Save'}
                  </button>
                  <button disabled={busy} onClick={() => setEditing(false)} className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3.5 py-2 text-xs font-medium text-neutral-400 hover:bg-white/[0.05] transition disabled:opacity-50">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              ) : (
                <button onClick={startEdit} className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-neutral-300 hover:border-teal-500/40 hover:text-teal-300 transition">
                  <Pencil className="w-3.5 h-3.5" /> Edit profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ===================== STAT STRIP ===================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="projects posted" value={stats.posted} accent="teal" spark={sparks.posted} delay={0.05} />
          <StatCard label="hire rate" value={stats.hireRate} suffix="%" accent="emerald" delay={0.12} />
          <StatCard label="total spent" value={stats.spent} prefix="$" accent="sky" delta={spendDelta} spark={sparks.spend} delay={0.19} />
          <StatCard label="repeat hire" value={stats.repeat} suffix="%" accent="violet" delay={0.26} />
        </div>

        {/* ===================== BODY ===================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <Panel delay={0.3} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <SectionLabel className="mb-3">about the company</SectionLabel>
              {editing ? (
                <textarea rows="6" value={draft.bio} onChange={(e) => setField('bio', e.target.value)} className={`${inputCls} resize-none leading-relaxed`} />
              ) : (
                <p className="text-sm leading-relaxed text-neutral-400">{user.bio}</p>
              )}
            </Panel>

            {/* Hiring preferences */}
            <Panel delay={0.38} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <SectionLabel className="mb-4"><Target className="w-3 h-3 inline -mt-0.5 mr-1" />hiring preferences</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-neutral-600">categories</span>
                  {editing ? (
                    <input value={draft.categoriesRaw} onChange={(e) => setField('categoriesRaw', e.target.value)} placeholder="Comma separated" className={inputCls} />
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {user.categories.map((c) => (
                        <span key={c} className="text-[11px] font-medium border border-teal-500/20 bg-teal-500/10 text-teal-300 rounded-md px-2 py-1">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-neutral-600">budget range</span>
                    {editing ? (
                      <input value={draft.budgetRange} onChange={(e) => setField('budgetRange', e.target.value)} className={inputCls} />
                    ) : (
                      <p className="text-[13px] text-neutral-300 font-mono">{user.budgetRange}</p>
                    )}
                  </div>
                  <div>
                    <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-neutral-600">engagement</span>
                    {editing ? (
                      <div className="flex flex-wrap gap-1.5">
                        {['Fixed-price', 'Hourly', 'Open to both'].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setField('engagement', opt)}
                            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${draft.engagement === opt ? 'bg-teal-500 text-black' : 'border border-white/[0.08] text-neutral-400 hover:bg-white/[0.05]'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[13px] text-neutral-300">{user.engagement}</p>
                    )}
                  </div>
                </div>
              </div>
            </Panel>

            {/* Posted projects */}
            <Panel delay={0.46} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-4">
                <SectionLabel><Briefcase className="w-3 h-3 inline -mt-0.5 mr-1" />posted projects</SectionLabel>
                <span className="font-mono text-[10px] text-neutral-600">{(user.projects || []).length} total</span>
              </div>
              <div className="space-y-2">
                {(user.projects || []).length === 0 && (
                  <p className="font-mono text-xs text-neutral-600 text-center py-4">no projects posted yet</p>
                )}
                {(user.projects || []).map((p, i) => (
                  <div key={i} className="group rounded-xl border border-white/[0.05] bg-[#0d0f0f] p-4 hover:border-teal-500/25 transition-all duration-300">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-[13px] font-medium text-neutral-300 group-hover:text-white transition truncate">{p.title}</h4>
                        <p className="text-[11px] text-neutral-600 mt-0.5">${p.budget.toLocaleString()} · {p.freelancer}</p>
                      </div>
                      <span className={`shrink-0 font-mono text-[10px] uppercase rounded px-2 py-1 ${
                        p.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                        p.status === 'In Progress' ? 'bg-sky-500/10 text-sky-400' :
                        p.status === 'Reviewing' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-white/[0.05] text-neutral-400'
                      }`}>{p.status}</span>
                    </div>
                    {p.progress > 0 && (
                      <div className="mt-3 flex items-center gap-3">
                        <ProgressBar value={p.progress} color={p.progress === 100 ? 'bg-emerald-400' : 'bg-teal-400'} delay={0.5 + i * 0.08} className="flex-1" />
                        <span className="font-mono text-[10px] text-neutral-500 tabular-nums w-8 text-right">{p.progress}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Panel>

            {/* Reviews */}
            <Panel delay={0.54} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <SectionLabel className="mb-4">freelancer reviews</SectionLabel>
              <div className="space-y-3">
                {(user.reviews || []).length === 0 && (
                  <p className="font-mono text-xs text-neutral-600 text-center py-4">no reviews yet</p>
                )}
                {(user.reviews || []).map((r, i) => (
                  <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500/25 to-sky-500/25 border border-teal-500/25 flex items-center justify-center text-[10px] font-bold text-teal-300">{r.name[0]}</span>
                        <div>
                          <p className="text-[13px] font-medium text-neutral-200">{r.name}</p>
                          <p className="text-[10px] text-neutral-600">{r.role}</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: r.rating }).map((_, s) => <Star key={s} className="w-3 h-3 fill-amber-400" />)}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-neutral-500">“{r.text}”</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* Company details */}
            <Panel delay={0.34} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <SectionLabel className="mb-3"><Building2 className="w-3 h-3 inline -mt-0.5 mr-1" />company details</SectionLabel>
              {editing ? (
                <div className="space-y-2.5">
                  <Field label="industry"><input value={draft.industry} onChange={(e) => setField('industry', e.target.value)} className={inputCls} /></Field>
                  <Field label="company size"><input value={draft.companySize} onChange={(e) => setField('companySize', e.target.value)} className={inputCls} /></Field>
                  <Field label="website"><input value={draft.website} onChange={(e) => setField('website', e.target.value)} className={inputCls} /></Field>
                </div>
              ) : (
                <ul className="space-y-3">
                  {[
                    { icon: Building2, label: 'Industry', value: user.industry },
                    { icon: Users, label: 'Size', value: user.companySize },
                    { icon: Globe, label: 'Website', value: user.website },
                    { icon: Clock, label: 'Founded', value: String(user.founded) },
                  ].map(({ icon: Icon, label, value }) => (
                    <li key={label} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[12px] text-neutral-500"><Icon className="w-3.5 h-3.5 text-neutral-600" />{label}</span>
                      <span className="text-[13px] text-neutral-300">{value}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {/* Team */}
            <Panel delay={0.42} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>team members</SectionLabel>
                {editing && (
                  <button onClick={addTeam} className="flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 transition">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                )}
              </div>
              <div className="space-y-2.5">
                {(editing ? draft.team : user.team).map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-7 h-7 shrink-0 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[10px] font-semibold text-neutral-400">
                      {(m.initials || m.name.slice(0, 2) || '??').toUpperCase()}
                    </span>
                    {editing ? (
                      <div className="flex flex-1 gap-2">
                        <input value={m.name} onChange={(e) => setTeam(i, 'name', e.target.value)} placeholder="Name" className={`${inputCls} py-1.5 text-[13px]`} />
                        <input value={m.role} onChange={(e) => setTeam(i, 'role', e.target.value)} placeholder="Role" className={`${inputCls} w-28 py-1.5 text-[13px]`} />
                        <button onClick={() => removeTeam(i)} className="text-neutral-600 hover:text-rose-400 transition" aria-label="Remove member">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-neutral-300 truncate">{m.name}</p>
                        <p className="text-[10px] text-neutral-600">{m.role}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Panel>

            {/* Payment */}
            <Panel delay={0.5} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <SectionLabel className="mb-3"><CreditCard className="w-3 h-3 inline -mt-0.5 mr-1" />payment & billing</SectionLabel>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-neutral-400">{user.payment.method}</span>
                  <span className="flex items-center gap-1 font-mono text-[10px] uppercase text-emerald-400"><ShieldCheck className="w-3 h-3" />verified</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-neutral-600">next charge</span>
                  <span className="font-mono text-neutral-400">{user.payment.nextCharge}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-neutral-600">escrow balance</span>
                  <span className="font-mono text-teal-300"><CountUp to={stats.escrow ? stats.escrow.locked : 0} prefix="$" duration={1.2} /></span>
                </div>
              </div>
            </Panel>

            {/* Verification */}
            <Panel delay={0.58} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <SectionLabel className="mb-3">verifications</SectionLabel>
              <div className="space-y-2.5">
                {[
                  { label: 'Email verified', ok: user.verified.email },
                  { label: 'Identity verified', ok: user.verified.identity },
                  { label: 'Payment method', ok: user.verified.payment },
                ].map((v) => (
                  <div key={v.label} className="flex items-center justify-between">
                    <span className="text-[13px] text-neutral-400">{v.label}</span>
                    <span className={`flex items-center gap-1 font-mono text-[10px] uppercase ${v.ok ? 'text-teal-400' : 'text-neutral-600'}`}>
                      <ShieldCheck className="w-3 h-3" />{v.ok ? 'passed' : 'pending'}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <style>{`
          @keyframes profScan {
            0% { transform: translateY(-100%); opacity: 0; }
            15% { opacity: 1; }
            100% { transform: translateY(400%); opacity: 0; }
          }
        `}</style>
      </div>
      <Toast show={!!toast} message={toast} />
    </DashboardShell>
  );
}
