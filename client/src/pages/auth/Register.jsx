import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Terminal, User, Mail, Lock, AlertCircle, Loader2, Briefcase, Code } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'freelancer' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await register({ ...form, name: form.name.trim(), email: form.email.trim() });
      navigate(from || `/${user.role}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const inputCls =
    'w-full bg-neutral-950/70 border border-neutral-800 rounded-lg pl-9 pr-3 py-2.5 text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/60 transition';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 selection:bg-emerald-500 selection:text-black">
      <div className="w-full max-w-md p-8 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-2 mb-6">
          <Terminal className="w-6 h-6 text-emerald-400" />
          <span className="font-bold tracking-wider text-base uppercase">SKILLGRID PLATFORM</span>
        </div>

        <h2 className="text-2xl font-bold mb-2">Create account</h2>
        <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
          Join as a client posting work, or as a freelancer taking it.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, role: 'freelancer' }))}
              className={`p-3 rounded-xl border flex items-center gap-2 transition text-sm font-semibold ${
                form.role === 'freelancer'
                  ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-400'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Code className="w-4 h-4" /> Freelancer
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, role: 'client' }))}
              className={`p-3 rounded-xl border flex items-center gap-2 transition text-sm font-semibold ${
                form.role === 'client'
                  ? 'border-teal-400/60 bg-teal-500/10 text-teal-400'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Briefcase className="w-4 h-4" /> Client
            </button>
          </div>

          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
            <input required value={form.name} onChange={set('name')} placeholder="Full name" className={inputCls} />
          </div>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
            <input type="email" required value={form.email} onChange={set('email')} placeholder="you@skillgrid.io" className={inputCls} />
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={set('password')}
              placeholder="Password (min 6 chars)"
              className={inputCls}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-emerald-500 text-neutral-950 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60 transition flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-[11px] text-neutral-500 text-center mt-5">
          Already registered?{' '}
          <Link to="/auth/login" className="text-emerald-400 hover:text-emerald-300 transition">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
