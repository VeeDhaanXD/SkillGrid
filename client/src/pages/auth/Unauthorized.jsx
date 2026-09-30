import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4">
        <ShieldAlert className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Access Restricted</h1>
      <p className="text-neutral-400 text-sm max-w-sm mb-6">
        Your active security credentials do not have permission to inspect or mutate this dashboard.
      </p>
      <Link
        to="/auth/login"
        className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold inline-flex items-center gap-2 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Switch Role / Return
      </Link>
    </div>
  );
}