import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import DashboardShell from '../../../components/layout/DashboardShell';
import { clientNav } from '../../../components/layout/navConfig';
import { SectionLabel, Field, inputCls, Panel } from '../../../components/common/TechUI';
import { createProject } from '../../../services/projectService';
import { Rocket, Eye, CheckCircle2, Clock, Users, Loader2 } from 'lucide-react';

gsap.registerPlugin(useGSAP);

const CATEGORIES = ['Frontend', 'Backend', 'Full Stack', 'Web3', 'Data Viz', 'AI / ML'];

export default function CreateProject() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    duration: '2 weeks',
    category: 'Full Stack',
    tags: '',
  });
  const [phase, setPhase] = useState('form'); // form | success
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef(null);
  const successRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useGSAP(() => {
    gsap.fromTo('.form-section', { opacity: 0, y: 16 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.45, ease: 'power3.out' });
    gsap.fromTo('.preview-card', { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out', delay: 0.25 });
  }, { scope: formRef });

  useGSAP(() => {
    if (phase === 'success' && successRef.current) {
      gsap.fromTo(successRef.current, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.5)' });
      const path = successRef.current.querySelector('svg path');
      if (path) {
        const len = path.getTotalLength();
        gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.6, delay: 0.2, ease: 'power2.out' });
      }
    }
  }, [phase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await createProject({
        title: form.title.trim(),
        description: form.description.trim(),
        budget: Number(form.budget),
        duration: form.duration,
        category: form.category,
        skills: form.tags,
      });
      setPhase('success');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);

  if (phase === 'success') {
    return (
      <DashboardShell roleTitle="Client" roleBadgeColor="text-teal-400" navItems={clientNav}>
        <div ref={successRef} className="max-w-lg mx-auto mt-10 rounded-2xl border border-teal-500/20 bg-[#0d1110] p-8 text-center shadow-[0_0_80px_-30px_rgba(45,212,191,0.5)]">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10">
            <CheckCircle2 className="h-7 w-7 text-teal-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Project published</h2>
          <p className="mt-1.5 text-sm text-neutral-500">
            <span className="font-mono text-teal-300">{form.title || 'Untitled project'}</span> is now live — freelancers can start pitching right away.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link to="/client/manage" className="rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-black hover:bg-teal-400 transition">
              Manage projects
            </Link>
            <button
              onClick={() => {
                setForm({ title: '', description: '', budget: '', duration: '2 weeks', category: 'Full Stack', tags: '' });
                setPhase('form');
              }}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs font-medium text-neutral-400 hover:bg-white/[0.05] transition"
            >
              Post another
            </button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell roleTitle="Client" roleBadgeColor="text-teal-400" navItems={clientNav}>
      <div ref={formRef} className="space-y-6">
        {/* Header */}
        <div className="form-section">
          <SectionLabel>new listing · draft mode</SectionLabel>
          <h1 className="mt-1.5 text-xl font-semibold text-white">Create Project</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Define requirements and attract top talent</p>
          {error && (
            <p className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{error}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="form-section">
              <Field label="title">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Full Stack MERN Dashboard with GSAP"
                  required
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="form-section">
              <Field label="description">
                <textarea
                  rows="6"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Describe scope, milestones, and deliverables..."
                  required
                  className={`${inputCls} resize-none leading-relaxed`}
                />
              </Field>
            </div>

            <div className="form-section">
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-neutral-500">category</span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('category', c)}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${
                      form.category === c
                        ? 'bg-teal-500 text-black'
                        : 'border border-white/[0.08] text-neutral-400 hover:bg-white/[0.05]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-section grid grid-cols-2 gap-4">
              <Field label="budget (usd)">
                <input type="number" value={form.budget} onChange={(e) => set('budget', e.target.value)} placeholder="1200" required className={inputCls} />
              </Field>
              <Field label="duration">
                <select value={form.duration} onChange={(e) => set('duration', e.target.value)} className={inputCls}>
                  {['1 week', '2 weeks', '3 weeks', '4 weeks', '2 months'].map((d) => (
                    <option key={d} value={d} className="bg-[#111]">{d}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="form-section">
              <Field label="skill tags (comma separated)">
                <input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="React, Node, GSAP" className={inputCls} />
              </Field>
            </div>

            <div className="form-section flex items-center justify-between pt-2">
              <span className="font-mono text-[10px] text-neutral-700">autosaved · draft</span>
              <button type="submit" disabled={busy} className="group flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-teal-400 transition shadow-[0_0_28px_-8px_rgba(45,212,191,0.7)] disabled:opacity-50">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
                {busy ? 'Publishing…' : 'Publish project'}
              </button>
            </div>
          </form>

          {/* Live preview */}
          <div className="lg:col-span-2 lg:sticky lg:top-20 space-y-3">
            <div className="preview-card">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-3.5 h-3.5 text-teal-400" />
                <SectionLabel>live preview</SectionLabel>
              </div>
              <div className="rounded-xl border border-teal-500/20 bg-[#0d0f0f] p-4 transition-all duration-300 hover:border-teal-500/40">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-mono text-[9px] uppercase border border-teal-500/25 bg-teal-500/10 text-teal-400 rounded px-1.5 py-0.5">{form.category}</span>
                  <span className="text-[10px] text-neutral-600 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{form.duration}</span>
                  <span className="text-[10px] text-neutral-600 flex items-center gap-1"><Users className="w-2.5 h-2.5" />new</span>
                </div>
                <h3 className="text-sm font-medium text-neutral-200 min-h-[1.25rem]">
                  {form.title || <span className="text-neutral-700">Your project title appears here…</span>}
                </h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-600 min-h-[2.75rem]">
                  {form.description || 'Description preview — tell freelancers what success looks like, list milestones and deliverables.'}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5 min-h-[1.25rem]">
                  {tags.length
                    ? tags.map((t) => (
                        <span key={t} className="font-mono text-[9px] text-neutral-500 border border-white/[0.06] rounded px-1.5 py-0.5">{t}</span>
                      ))
                    : <span className="font-mono text-[9px] text-neutral-700">#skill-tags</span>}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <span className="font-mono text-base font-semibold text-teal-400">
                    {form.budget ? `$${Number(form.budget).toLocaleString()}` : '$—'}
                  </span>
                  <span className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-[11px] text-neutral-500">Pitch</span>
                </div>
              </div>
            </div>

            <Panel delay={0.5} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <SectionLabel className="mb-2.5">publish checklist</SectionLabel>
              <ul className="space-y-2 text-[12px]">
                {[
                  { ok: !!form.title, text: 'Clear, specific title' },
                  { ok: form.description.length > 40, text: 'Detailed scope (40+ chars)' },
                  { ok: !!form.budget, text: 'Budget defined' },
                  { ok: tags.length >= 2, text: 'At least 2 skill tags' },
                ].map((c) => (
                  <li key={c.text} className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${c.ok ? 'bg-teal-400' : 'bg-neutral-700'}`} />
                    <span className={c.ok ? 'text-neutral-300' : 'text-neutral-600'}>{c.text}</span>
                    {c.ok && <CheckCircle2 className="ml-auto w-3 h-3 text-teal-400" />}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
