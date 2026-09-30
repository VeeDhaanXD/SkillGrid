import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import DashboardShell from '../../../components/layout/DashboardShell';
import { freelancerNav } from '../../../components/layout/navConfig';
import { useAuth } from '../../../context/AuthContext';
import {
  CountUp, Panel, StatCard, ProgressBar, SectionLabel, Field, inputCls, Toast,
} from '../../../components/common/TechUI';
import {
  MapPin, Clock, Pencil, Check, X, Star, Code2, Link2, Globe, ShieldCheck,
  BadgeCheck, Plus, Trash2, Zap, CalendarClock, GraduationCap, Languages,
} from 'lucide-react';

gsap.registerPlugin(useGSAP);

const AVAILABILITY = ['Available', 'Limited availability', 'Busy'];

export default function FreelancerProfile() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user);
  const [toast, setToast] = useState('');
  const rootRef = useRef(null);
  const skillInput = useRef(null);

  useGSAP(
    () => {
      gsap.fromTo('.prof-banner', { opacity: 0, y: -14, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' });
    },
    { scope: rootRef }
  );

  if (!user) return null;

  const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const startEdit = () => {
    setDraft({ ...user, languagesRaw: (user.languages || []).join(', ') });
    setEditing(true);
  };

  const save = async () => {
    const languages = (draft.languagesRaw || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await updateProfile({
        headline: draft.headline?.trim() || user.headline,
        location: draft.location?.trim() || user.location,
        timezone: draft.timezone?.trim() || user.timezone,
        bio: draft.bio?.trim() || user.bio,
        rate: Math.max(0, Number(draft.rate) || user.rate),
        hoursPerWeek: Math.max(0, Number(draft.hoursPerWeek) || user.hoursPerWeek),
        availability: draft.availability,
        skills: draft.skills,
        languages,
        links: {
          github: draft.links?.github?.trim() || '',
          linkedin: draft.links?.linkedin?.trim() || '',
          website: draft.links?.website?.trim() || '',
        },
      });
      setEditing(false);
      setToast('Profile updated');
      setTimeout(() => setToast(''), 2600);
    } catch (err) {
      setToast(err.message);
      setTimeout(() => setToast(''), 3200);
    }
  };

  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const setLink = (k, v) => setDraft((d) => ({ ...d, links: { ...d.links, [k]: v } }));
  const setSkillLevel = (i, level) =>
    setDraft((d) => ({ ...d, skills: d.skills.map((s, idx) => (idx === i ? { ...s, level: Number(level) } : s)) }));
  const removeSkill = (i) => setDraft((d) => ({ ...d, skills: d.skills.filter((_, idx) => idx !== i) }));
  const addSkill = () => {
    const name = skillInput.current?.value?.trim();
    if (!name) return;
    setDraft((d) => ({ ...d, skills: [...d.skills, { name, level: 70 }] }));
    skillInput.current.value = '';
  };

  const stats = user.stats;

  return (
    <DashboardShell roleTitle="Freelancer" roleBadgeColor="text-emerald-400" navItems={freelancerNav}>
      <div ref={rootRef} className="space-y-6">
        {/* ===================== BANNER ===================== */}
        <div
          className="prof-banner relative overflow-hidden rounded-2xl border border-white/[0.07] p-6"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.14), rgba(13,148,136,0.05) 45%, transparent 75%)' }}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-emerald-400/[0.06] to-transparent" style={{ animation: 'profScan 5s linear infinite' }} aria-hidden="true" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-500/40 flex items-center justify-center text-2xl font-bold text-emerald-200 shadow-[0_0_40px_-8px_rgba(16,185,129,0.5)]">
                {initials}
              </div>
              <span className={`absolute -bottom-1 -right-1 flex items-center gap-1 rounded-full border border-[#0a0a0a] px-1.5 py-0.5 font-mono text-[8px] uppercase ${user.availability === 'Available' ? 'bg-emerald-500/90 text-black' : user.availability === 'Limited availability' ? 'bg-amber-500/90 text-black' : 'bg-neutral-600 text-neutral-200'}`}>
                <span className="h-1 w-1 rounded-full bg-black/60" />
                {user.availability === 'Available' ? 'online' : 'away'}
              </span>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-white">{user.name}</h1>
                <BadgeCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-[10px] border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 rounded px-1.5 py-0.5 uppercase">verified pro</span>
              </div>

              {editing ? (
                <input value={draft.headline} onChange={(e) => setField('headline', e.target.value)} className={`${inputCls} mt-2 max-w-md py-1.5 text-sm`} placeholder="Headline" />
              ) : (
                <p className="text-sm text-emerald-300/90 mt-0.5">{user.headline}</p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-500">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{editing ? <input value={draft.location} onChange={(e) => setField('location', e.target.value)} className="bg-transparent border-b border-white/10 focus:border-emerald-400 outline-none text-neutral-300" /> : user.location}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{editing ? <input value={draft.timezone} onChange={(e) => setField('timezone', e.target.value)} className="w-20 bg-transparent border-b border-white/10 focus:border-emerald-400 outline-none text-neutral-300" /> : user.timezone}</span>
                <span className="font-mono text-neutral-600">member since {user.memberSince}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                <span className="font-mono text-[10px] uppercase text-neutral-500">rate</span>
                {editing ? (
                  <input type="number" value={draft.rate} onChange={(e) => setField('rate', e.target.value)} className="w-14 bg-transparent text-right font-mono text-sm text-emerald-300 outline-none" />
                ) : (
                  <span className="font-mono text-sm text-emerald-300"><CountUp to={user.rate} prefix="$" suffix="/hr" duration={1} /></span>
                )}
              </div>
              {editing ? (
                <div className="flex gap-2">
                  <button onClick={save} className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-black hover:bg-emerald-400 transition">
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                  <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3.5 py-2 text-xs font-medium text-neutral-400 hover:bg-white/[0.05] transition">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              ) : (
                <button onClick={startEdit} className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-neutral-300 hover:border-emerald-500/40 hover:text-emerald-300 transition">
                  <Pencil className="w-3.5 h-3.5" /> Edit profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ===================== STAT STRIP ===================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="rating" value={stats.rating} decimals={1} suffix="★" accent="amber" spark={stats.sparks.rating} delay={0.05} />
          <StatCard label="jobs done" value={stats.jobs} suffix="+" accent="emerald" spark={stats.sparks.jobs} delay={0.12} />
          <StatCard label="success rate" value={stats.success} suffix="%" accent="teal" spark={stats.sparks.success} delay={0.19} />
          <StatCard label="total earned" value={stats.earned} prefix="$" accent="sky" spark={stats.sparks.earned} delay={0.26} />
        </div>

        {/* ===================== BODY ===================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <Panel delay={0.3} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <SectionLabel className="mb-3">about</SectionLabel>
              {editing ? (
                <textarea rows="6" value={draft.bio} onChange={(e) => setField('bio', e.target.value)} className={`${inputCls} resize-none leading-relaxed`} />
              ) : (
                <p className="text-sm leading-relaxed text-neutral-400">{user.bio}</p>
              )}
            </Panel>

            {/* Skills */}
            <Panel delay={0.38} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-4">
                <SectionLabel>core skills</SectionLabel>
                <span className="font-mono text-[10px] text-neutral-600">{(editing ? draft.skills : user.skills).length} tagged</span>
              </div>
              <div className="space-y-3.5">
                {(editing ? draft.skills : user.skills).map((sk, i) => (
                  <div key={sk.name + i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-medium text-neutral-300 flex items-center gap-2">
                        {sk.name}
                        {editing && (
                          <button onClick={() => removeSkill(i)} className="text-neutral-600 hover:text-rose-400 transition" aria-label={`Remove ${sk.name}`}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                      {editing ? (
                        <input type="range" min="10" max="100" value={sk.level} onChange={(e) => setSkillLevel(i, e.target.value)} className="w-32 accent-emerald-400 h-1" />
                      ) : (
                        <span className="font-mono text-[11px] text-emerald-400/80 tabular-nums">{sk.level}%</span>
                      )}
                    </div>
                    <ProgressBar value={sk.level} color={sk.level >= 90 ? 'bg-emerald-400' : sk.level >= 80 ? 'bg-teal-400' : 'bg-sky-400'} delay={0.4 + i * 0.07} />
                  </div>
                ))}
              </div>
              {editing && (
                <div className="mt-4 flex gap-2">
                  <input
                    ref={skillInput}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="Add a skill…"
                    className={`${inputCls} flex-1 py-2 text-[13px]`}
                  />
                  <button onClick={addSkill} className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition">
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              )}
            </Panel>

            {/* Portfolio */}
            <Panel delay={0.46} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <SectionLabel className="mb-4">portfolio highlights</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {user.portfolio.map((p, i) => (
                  <div key={i} className="group rounded-xl border border-white/[0.06] bg-[#0d0f0f] p-4 hover:border-emerald-500/30 transition-all duration-300 cursor-default">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400/80 border border-emerald-500/20 bg-emerald-500/10 rounded px-1.5 py-0.5">{p.tag}</span>
                    <h4 className="mt-2.5 text-[13px] font-semibold text-neutral-200 group-hover:text-white transition">{p.title}</h4>
                    <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 line-clamp-3">{p.desc}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {p.stack.map((t) => (
                        <span key={t} className="font-mono text-[9px] text-neutral-500 border border-white/[0.06] rounded px-1.5 py-0.5">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Reviews */}
            <Panel delay={0.54} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <SectionLabel className="mb-4">client reviews</SectionLabel>
              <div className="space-y-3">
                {user.reviews.map((r, i) => (
                  <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/25 to-teal-500/25 border border-emerald-500/25 flex items-center justify-center text-[10px] font-bold text-emerald-300">{r.name[0]}</span>
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
            {/* Availability */}
            <Panel delay={0.34} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <SectionLabel className="mb-3">availability</SectionLabel>
              {editing ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABILITY.map((a) => (
                      <button
                        key={a}
                        onClick={() => setField('availability', a)}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition ${draft.availability === a ? 'bg-emerald-500 text-black' : 'border border-white/[0.08] text-neutral-400 hover:bg-white/[0.05]'}`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  <Field label="hours / week">
                    <input type="number" value={draft.hoursPerWeek} onChange={(e) => setField('hoursPerWeek', e.target.value)} className={inputCls} />
                  </Field>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-neutral-400 flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-emerald-400" />{user.availability}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] text-neutral-500">
                    <span className="flex items-center gap-2"><CalendarClock className="w-3.5 h-3.5 text-neutral-600" />{user.hoursPerWeek} hrs / week</span>
                  </div>
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] text-neutral-600">response time</span>
                    <span className="font-mono text-[12px] text-emerald-400">{stats.responseTime} avg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-600">on-time delivery</span>
                    <span className="font-mono text-[12px] text-emerald-400">{stats.onTime}%</span>
                  </div>
                </div>
              )}
            </Panel>

            {/* Languages */}
            <Panel delay={0.42} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <SectionLabel className="mb-3"><Languages className="w-3 h-3 inline -mt-0.5 mr-1" />languages</SectionLabel>
              {editing ? (
                <input value={draft.languagesRaw} onChange={(e) => setField('languagesRaw', e.target.value)} placeholder="Comma separated" className={inputCls} />
              ) : (
                <ul className="space-y-2">
                  {user.languages.map((l) => (
                    <li key={l} className="flex items-center justify-between text-[13px] text-neutral-400">
                      <span>{l.split(' — ')[0]}</span>
                      <span className="font-mono text-[10px] uppercase text-neutral-600">{l.split(' — ')[1]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {/* Education & certs */}
            <Panel delay={0.5} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <SectionLabel className="mb-3"><GraduationCap className="w-3 h-3 inline -mt-0.5 mr-1" />education & certs</SectionLabel>
              <div className="space-y-3">
                {user.education.map((e, i) => (
                  <div key={i}>
                    <p className="text-[13px] font-medium text-neutral-300">{e.title}</p>
                    <p className="text-[11px] text-neutral-600">{e.school} · {e.year}</p>
                  </div>
                ))}
                <div className="pt-3 border-t border-white/[0.06] space-y-1.5">
                  {user.certifications.map((c) => (
                    <p key={c} className="text-[11px] text-neutral-500 flex items-start gap-1.5">
                      <ShieldCheck className="w-3 h-3 mt-0.5 text-emerald-400 shrink-0" />{c}
                    </p>
                  ))}
                </div>
              </div>
            </Panel>

            {/* Links */}
            <Panel delay={0.58} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <SectionLabel className="mb-3">links</SectionLabel>
              {editing ? (
                <div className="space-y-2.5">
                  <Field label="github"><input value={draft.links?.github || ''} onChange={(e) => setLink('github', e.target.value)} className={inputCls} /></Field>
                  <Field label="linkedin"><input value={draft.links?.linkedin || ''} onChange={(e) => setLink('linkedin', e.target.value)} className={inputCls} /></Field>
                  <Field label="website"><input value={draft.links?.website || ''} onChange={(e) => setLink('website', e.target.value)} className={inputCls} /></Field>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {[
                    { icon: Code2, key: 'github' },
                    { icon: Link2, key: 'linkedin' },
                    { icon: Globe, key: 'website' },
                  ].map(({ icon: Icon, key }) => (
                    <a key={key} href="#" className="flex items-center gap-2.5 text-[13px] text-neutral-400 hover:text-emerald-300 transition group">
                      <Icon className="w-3.5 h-3.5 text-neutral-600 group-hover:text-emerald-400 transition" />
                      <span className="truncate">{user.links[key] || '—'}</span>
                    </a>
                  ))}
                </div>
              )}
            </Panel>

            {/* Verification */}
            <Panel delay={0.66} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <SectionLabel className="mb-3">verifications</SectionLabel>
              <div className="space-y-2.5">
                {[
                  { label: 'Email verified', ok: user.verified.email },
                  { label: 'Identity verified', ok: user.verified.identity },
                  { label: 'Payment method', ok: user.verified.payment },
                ].map((v) => (
                  <div key={v.label} className="flex items-center justify-between">
                    <span className="text-[13px] text-neutral-400">{v.label}</span>
                    <span className={`flex items-center gap-1 font-mono text-[10px] uppercase ${v.ok ? 'text-emerald-400' : 'text-neutral-600'}`}>
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
