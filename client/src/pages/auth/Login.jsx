import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Terminal, Shield, Briefcase, Code, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

const DEMO = {
  client: { email: 'maya@skillgrid.io', label: 'Client', desc: 'Post jobs, review proposals & release escrow', icon: Briefcase, color: 'teal' },
  freelancer: { email: 'alex@skillgrid.io', label: 'Freelancer', desc: 'Browse contracts, submit bids & track tasks', icon: Code, color: 'emerald' },
  admin: { email: 'admin@skillgrid.io', label: 'Admin', desc: 'Arbitrate disputes & audit platform health', icon: Shield, color: 'rose' },
};

const COLOR = {
  teal: { hover: 'hover:border-teal-400/50', text: 'group-hover:text-teal-400', icon: 'text-teal-400', arrow: 'group-hover:text-teal-400' },
  emerald: { hover: 'hover:border-emerald-400/50', text: 'group-hover:text-emerald-400', icon: 'text-emerald-400', arrow: 'group-hover:text-emerald-400' },
  rose: { hover: 'hover:border-rose-400/50', text: 'group-hover:text-rose-400', icon: 'text-rose-400', arrow: 'group-hover:text-rose-400' },
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const go = (role) => navigate(from || `/${role}`, { replace: true });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email.trim(), password);
      go(user.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const demoLogin = async (role) => {
    setError('');
    setBusy(true);
    try {
      await login(DEMO[role].email, 'password123');
      go(role);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 selection:bg-emerald-500 selection:text-black">
      <div className="w-full max-w-md p-8 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-2 mb-6">
          <Terminal className="w-6 h-6 text-emerald-400" />
          <span className="font-bold tracking-wider text-base uppercase">SKILLGRID PLATFORM</span>
        </div>

        <h2 className="text-2xl font-bold mb-2">Authenticate</h2>
        <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
          Sign in with your credentials, or jump straight into a demo workspace below.
        </p>

        <form onSubmit={submit} className="space-y-3 mb-5">
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@skillgrid.io"
              className="w-full bg-neutral-950/70 border border-neutral-800 rounded-lg pl-9 pr-3 py-2.5 text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/60 transition"
            />
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-neutral-950/70 border border-neutral-800 rounded-lg pl-9 pr-3 py-2.5 text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/60 transition"
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
            {busy ? 'Authenticating…' : 'Sign in'}
          </button>
        </form>

        <div className="flex items-center gap-3 mb-4">
          <span className="h-px flex-1 bg-neutral-800" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">demo access</span>
          <span className="h-px flex-1 bg-neutral-800" />
        </div>

        <div className="space-y-3">
          {Object.entries(DEMO).map(([role, cfg]) => {
            const Icon = cfg.icon;
            const c = COLOR[cfg.color];
            return (
              <button
                key={role}
                onClick={() => demoLogin(role)}
                disabled={busy}
                className={`w-full p-4 rounded-xl border border-neutral-800 bg-neutral-900 ${c.hover} flex items-center justify-between transition group disabled:opacity-60`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${c.icon}`} />
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${c.text} transition`}>Enter as {cfg.label}</p>
                    <p className="text-[11px] text-neutral-500">{cfg.desc}</p>
                  </div>
                </div>
                <span className={`text-xs font-mono text-neutral-600 ${c.arrow}`}>→</span>
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-neutral-500 text-center mt-5">
          No account yet?{' '}
          <Link to="/auth/register" className="text-emerald-400 hover:text-emerald-300 transition">
            Create one →
          </Link>
        </p>
      </div>
    </div>
  );
}
