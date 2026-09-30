import { useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import DashboardShell from '../../../components/layout/DashboardShell';
import { adminNav } from '../../../components/layout/navConfig';
import { listUsers, setUserStatus } from '../../../services/adminService';
import { Toast, SkeletonBlock } from '../../../components/common/TechUI';
import { Search, Loader2, Ban, RotateCcw } from 'lucide-react';

gsap.registerPlugin(useGSAP);

const ROLES = ['All', 'client', 'freelancer', 'admin'];

export default function UserManagement() {
  const [users, setUsers] = useState(null);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('All');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');

  const load = useCallback((params) => {
    listUsers(params)
      .then(setUsers)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load({ search: query, role }), 300);
    return () => clearTimeout(t);
  }, [query, role, load]);

  const loaded = !!users;

  useGSAP(() => {
    if (!loaded) return;
    gsap.fromTo('.user-row', { opacity: 0, y: 6 }, { opacity: 1, y: 0, stagger: 0.04, duration: 0.3, ease: 'power2.out' });
  }, [loaded]);

  const toggle = async (u) => {
    const next = u.status === 'Active' ? 'suspended' : 'active';
    setBusyId(u.dbId);
    try {
      await setUserStatus(u.dbId, next);
      setToast(next === 'suspended' ? `${u.name} suspended` : `${u.name} reactivated`);
      load({ search: query, role });
    } catch (e) {
      setToast(e.message);
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(''), 3000);
    }
  };

  const roleStyle = (r) => {
    if (r === 'client') return 'text-teal-400 bg-teal-500/10';
    if (r === 'admin') return 'text-rose-400 bg-rose-500/10';
    return 'text-emerald-400 bg-emerald-500/10';
  };

  return (
    <DashboardShell roleTitle="Admin" roleBadgeColor="text-rose-400" navItems={adminNav}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-white mb-1">Users</h1>
            <p className="text-sm text-neutral-500">Manage platform accounts</p>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email…"
              className="pl-8 pr-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-xs text-white placeholder:text-neutral-600 focus:border-emerald-500/50 outline-none w-56 transition"
            />
          </div>
        </div>

        {/* Role filter */}
        <div className="flex flex-wrap gap-1.5">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                role === r ? 'bg-emerald-500 text-black' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] border hover:border-white/[0.06] border-transparent'
              }`}
            >
              {r}
            </button>
          ))}
          {loaded && <span className="ml-auto self-center font-mono text-[10px] text-neutral-600">{users.length} accounts</span>}
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-400">Failed to load users: {error}</div>
        )}

        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-neutral-500 text-[11px] font-medium uppercase tracking-wide">
                <th className="px-4 py-2.5">User</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Projects</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {!loaded && !error && (
                <tr>
                  <td colSpan={5} className="p-4">
                    <div className="space-y-2">
                      <SkeletonBlock className="h-12 w-full" />
                      <SkeletonBlock className="h-12 w-full" />
                      <SkeletonBlock className="h-12 w-full" />
                    </div>
                  </td>
                </tr>
              )}
              {loaded && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-500">No accounts match this filter.</td>
                </tr>
              )}
              {(users || []).map((u) => (
                <tr key={u.dbId} className="user-row border-b border-white/[0.04] hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-neutral-200">{u.name}</p>
                    <p className="text-[11px] text-neutral-600">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md capitalize ${roleStyle(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-400">{u.projects}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium ${u.status === 'Active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {u.status}
                    </span>
                    <span className="block font-mono text-[9px] text-neutral-700">{u.joined}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === 'admin' ? (
                      <span className="font-mono text-[10px] text-neutral-700">—</span>
                    ) : (
                      <button
                        disabled={busyId === u.dbId}
                        onClick={() => toggle(u)}
                        className={`ml-auto flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition disabled:opacity-40 ${
                          u.status === 'Active'
                            ? 'border-white/[0.08] text-neutral-400 hover:text-rose-400 hover:border-rose-500/30'
                            : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black'
                        }`}
                      >
                        {busyId === u.dbId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : u.status === 'Active' ? (
                          <Ban className="w-3 h-3" />
                        ) : (
                          <RotateCcw className="w-3 h-3" />
                        )}
                        {busyId === u.dbId ? '…' : u.status === 'Active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Toast show={!!toast} message={toast} />
    </DashboardShell>
  );
}
