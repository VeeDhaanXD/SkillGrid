import { useRef, useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { PanelLeftClose, PanelLeft, Bell, LogOut, ChevronRight, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchNotifications, markAllRead } from '../../services/dashboardService';

gsap.registerPlugin(useGSAP);

const KIND_TONE = {
  payment: 'text-emerald-400',
  proposal: 'text-sky-400',
  project: 'text-teal-400',
  alert: 'text-rose-400',
  system: 'text-neutral-400',
  review: 'text-amber-400',
};

export default function DashboardShell({ roleTitle, roleBadgeColor = 'text-emerald-400', navItems, children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [clock, setClock] = useState(() => new Date());
  const mainContentRef = useRef(null);
  const navRef = useRef(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notif, setNotif] = useState({ unread: 0, notifications: [] });
  const notifRef = useRef(null);

  const loadNotifs = useCallback(() => {
    fetchNotifications()
      .then(setNotif)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadNotifs();
  }, [loadNotifs]);

  useEffect(() => {
    if (!notifOpen) return;
    const onDocClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [notifOpen]);

  const onMarkAll = () => {
    markAllRead()
      .then(() => loadNotifs())
      .catch(() => {});
  };

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useGSAP(
    () => {
      gsap.fromTo(
        mainContentRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
      );
      gsap.fromTo(
        '.nav-item',
        { opacity: 0, x: -14 },
        { opacity: 1, x: 0, stagger: 0.05, duration: 0.35, ease: 'power2.out', delay: 0.05 }
      );
    },
    { scope: navRef, dependencies: [location.pathname] }
  );

  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const profilePath = user && (user.role === 'client' || user.role === 'freelancer') ? `/${user.role}/profile` : null;

  const activeBar =
    roleTitle === 'Client' ? 'bg-teal-400' : roleTitle === 'Admin' ? 'bg-rose-400' : 'bg-emerald-400';

  const handleLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };

  const crumb = location.pathname === `/${user?.role}` || location.pathname === `/${user?.role}/`
    ? 'overview'
    : location.pathname.split('/').filter(Boolean).slice(1).join(' / ') || 'overview';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex">
      {/* Sidebar */}
      <aside
        ref={navRef}
        className={`${isCollapsed ? 'w-[64px]' : 'w-60'} relative transition-all duration-300 border-r border-white/[0.06] flex flex-col py-5 px-3 z-20 bg-white/[0.008]`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between mb-8 px-1">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <span className="text-[10px] font-black text-neutral-950">S</span>
              </div>
              <span className="text-xs font-semibold tracking-wide text-neutral-300">SkillGrid</span>
              <span className="ml-auto font-mono text-[8px] text-neutral-600 border border-white/[0.08] rounded px-1 py-px">v2.4</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] transition ml-auto"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Role Label */}
        {!isCollapsed && (
          <div className="px-3 mb-4">
            <span className={`font-mono text-[10px] uppercase tracking-widest ${roleBadgeColor}`}>◆ {roleTitle}</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `nav-item relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-white/[0.06] text-white'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className={`absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full ${activeBar}`} />
                  )}
                  <item.icon className="w-4 h-4 flex-shrink-0 opacity-70 group-hover:opacity-100" />
                  {!isCollapsed && <span>{item.label}</span>}
                  {!isCollapsed && isActive && (
                    <ChevronRight className="ml-auto w-3 h-3 opacity-40" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="pt-4 border-t border-white/[0.06]">
          {profilePath ? (
            <NavLink
              to={profilePath}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition group"
              title="View profile"
            >
              <span className="relative">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/25 to-teal-500/25 border border-emerald-500/30 flex items-center justify-center text-[11px] font-semibold text-emerald-300 group-hover:border-emerald-400/60 transition">
                  {initials}
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-[#0a0a0a]" />
              </span>
              {!isCollapsed && (
                <span className="flex-1 min-w-0 text-left">
                  <span className="block text-[12px] font-medium text-neutral-300 truncate group-hover:text-white transition">{user?.name}</span>
                  <span className="block text-[10px] text-neutral-600 truncate">view profile →</span>
                </span>
              )}
            </NavLink>
          ) : (
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <span className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-[11px] font-semibold text-neutral-400">
                {initials}
              </span>
              {!isCollapsed && (
                <span className="flex-1 min-w-0">
                  <span className="block text-[12px] font-medium text-neutral-300 truncate">{user?.name}</span>
                  <span className="block text-[10px] text-neutral-600 truncate">{user?.email}</span>
                </span>
              )}
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-neutral-600 hover:text-rose-400 hover:bg-rose-500/[0.06] transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log out
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-12 shrink-0 border-b border-white/[0.06] px-6 flex items-center justify-between bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-10">
          <span className="font-mono text-[11px] text-neutral-600 flex items-center gap-1">
            ~/skillgrid
            <span className="text-neutral-700">/</span>
            <span className="text-neutral-400">{crumb}</span>
          </span>
          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-emerald-400/80">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              system online
            </span>
            <span className="font-mono text-[11px] text-neutral-500 tabular-nums">
              {clock.toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-1.5 rounded-md text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] transition"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {notif.unread > 0 && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1.5 right-1.5" />
                    <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-emerald-500 text-[9px] font-bold text-black flex items-center justify-center">
                      {notif.unread > 9 ? '9+' : notif.unread}
                    </span>
                  </>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/[0.08] bg-[#101211] shadow-2xl overflow-hidden z-30">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">notifications</span>
                    {notif.unread > 0 && (
                      <button
                        onClick={onMarkAll}
                        className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition"
                      >
                        <CheckCheck className="w-3 h-3" /> mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notif.notifications.length === 0 && (
                      <p className="px-4 py-6 text-center text-xs text-neutral-600">You're all caught up.</p>
                    )}
                    {notif.notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-white/[0.04] last:border-0 ${n.read ? 'opacity-50' : 'bg-white/[0.02]'}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.read ? 'bg-neutral-700' : KIND_TONE[n.kind] || 'bg-teal-400'}`} />
                          <div className="min-w-0">
                            <p className="text-[12px] leading-snug text-neutral-300">{n.text}</p>
                            <p className="font-mono text-[9px] text-neutral-700 mt-0.5">{n.t}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 relative p-6 lg:p-8 overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/[0.05] blur-[110px]"
            aria-hidden="true"
          />
          <div ref={mainContentRef} className="relative z-10 max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
