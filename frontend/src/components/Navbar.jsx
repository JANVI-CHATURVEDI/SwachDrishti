import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Eye, Shield, User, HardHat, Compass, ChevronDown,
  Award, LogOut, FlaskConical, Menu, X, Bell, ArrowRight, Sun, Moon,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useDismiss, useLockBody } from './ui';

const PERSONAS = [
  { id: 'citizen', label: 'Citizen', icon: User, desc: 'Report & track neighborhood waste', ring: 'ring-leaf-500/40', tint: 'bg-leaf-50 text-leaf-700' },
  { id: 'worker', label: 'Sanitation Worker', icon: HardHat, desc: "Manage today's route & upload proof", ring: 'ring-cyan-500/40', tint: 'bg-cyan-50 text-cyan-700' },
  { id: 'supervisor', label: 'Supervisor', icon: Compass, desc: 'Operations dispatch & team rebalancing', ring: 'ring-indigo-500/40', tint: 'bg-indigo-50 text-indigo-700' },
  { id: 'admin', label: 'Administrator', icon: Shield, desc: 'City Command Center & analytics', ring: 'ring-rose-500/40', tint: 'bg-rose-50 text-rose-700' },
];

const PERSONA_HOME = { citizen: '/citizen', worker: '/worker', supervisor: '/supervisor', admin: '/admin' };

const ROLE_RING = {
  CITIZEN: 'ring-leaf-500/50 from-leaf-400 to-leaf-600',
  WORKER: 'ring-cyan-500/50 from-cyan-400 to-cyan-600',
  SUPERVISOR: 'ring-indigo-500/50 from-indigo-400 to-indigo-600',
  ADMIN: 'ring-rose-500/50 from-rose-400 to-rose-600',
};

const LINKS = [
  { tab: 'landing', path: '/', label: 'Overview', active: 'bg-slate-100 text-slate-900 font-semibold', roles: null },
  { tab: 'citizen', path: '/citizen', label: 'Citizen', active: 'bg-emerald-50 text-emerald-700 font-semibold', roles: ['CITIZEN'] },
  { tab: 'worker', path: '/worker', label: 'Route', active: 'bg-emerald-50 text-emerald-700 font-semibold', roles: ['WORKER'] },
  { tab: 'supervisor', path: '/supervisor', label: 'Operations', active: 'bg-emerald-50 text-emerald-700 font-semibold', roles: ['SUPERVISOR'] },
  { tab: 'admin', path: '/admin', label: 'Command Center', active: 'bg-emerald-50 text-emerald-700 font-semibold', roles: ['ADMIN'] },
  { tab: 'public', path: '/public', label: 'City Transparency', active: 'bg-blue-50 text-blue-700 font-semibold', roles: null },
  { tab: 'awareness', path: '/awareness', label: 'Know Your Waste', active: 'bg-teal-50 text-teal-700 font-semibold', roles: null },
];

const dropdownMotion = {
  initial: { opacity: 0, y: -6, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.97 },
  transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
};

function LogoMark({ className = '' }) {
  return (
    <span
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-leaf-500 via-leaf-500 to-lime-400 text-ink-950 shadow-glow-leaf ring-1 ring-white/20 ${className}`}
      aria-hidden="true"
    >
      <Eye className="h-[18px] w-[18px]" strokeWidth={2.25} />
    </span>
  );
}

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, role, token, switchRole, logout } = useAuth();
  const [demoOpen, setDemoOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [wsOpen, setWsOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('swachdrishti.theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });
  const navigate = useNavigate();
  const location = useLocation();

  const notifRef = useDismiss(notifOpen, () => setNotifOpen(false));
  const userRef = useDismiss(userOpen, () => setUserOpen(false));
  const demoRef = useDismiss(demoOpen, () => setDemoOpen(false));
  const wsRef = useDismiss(wsOpen, () => setWsOpen(false));
  useLockBody(mobileOpen);

  const isLanding = location.pathname === '/';
  const dark = isLanding;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('swachdrishti.theme', next);
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
    setUserOpen(false);
    setDemoOpen(false);
    setWsOpen(false);
  }, [location.pathname]);

  const handlePersona = async (roleId) => {
    await switchRole(roleId);
    setDemoOpen(false);
    setMobileOpen(false);
    setActiveTab(roleId);
    navigate(PERSONA_HOME[roleId]);
  };

  const handleNav = (tab, path) => {
    setActiveTab(tab);
    setMobileOpen(false);
    setNotifOpen(false);
    setWsOpen(false);
    navigate(path);
  };

  useEffect(() => {
    if (!token) {
      setNotifs([]);
      setUnread(0);
      return;
    }
    let live = true;
    const load = async () => {
      try {
        const [cRes, lRes] = await Promise.all([
          api.get('/api/notifications/unread-count/').catch(() => ({ data: { unread: 0 } })),
          api.get('/api/notifications/').catch(() => ({ data: { results: [] } })),
        ]);
        if (!live) return;
        setUnread(cRes.data?.unread || 0);
        setNotifs(lRes.data?.results || lRes.data || []);
      } catch {}
    };
    load();
    const t = setInterval(load, 30000);
    return () => { live = false; clearInterval(t); };
  }, [token]);

  const openNotif = async (n) => {
    setNotifOpen(false);
    try {
      await api.post('/api/notifications/mark-read/', { ids: [n.id] });
    } catch {}
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    setUnread(u => Math.max(0, u - 1));
    if (n.link) navigate(n.link);
  };

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-read/', {});
    } catch {}
    setNotifs(prev => prev.map(x => ({ ...x, is_read: true })));
    setUnread(0);
  };

  const handleLogout = () => {
    logout();
    setUserOpen(false);
    handleNav('landing', '/');
  };

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username
    : '';

  const visibleLinks = LINKS.filter(l => !l.roles || !user || role === 'ADMIN' || l.roles.includes(role));
  const isAdmin = role === 'ADMIN';
  const primaryLinks = visibleLinks.filter(l => !l.roles || (isAdmin && l.roles.includes('ADMIN')));
  const roleLinks = visibleLinks.filter(l => Boolean(l.roles) && !isAdmin);
  const workspacesActive = roleLinks.some(l => location.pathname === l.path);

  const surface = !dark
    ? 'glass-light text-ink-900 shadow-soft'
    : scrolled
      ? 'bg-ink-950/75 border-white/15 text-white shadow-dark-soft backdrop-blur-xl'
      : 'bg-transparent border-transparent text-white';
  const navIdle = dark
    ? 'text-white/70 hover:text-white'
    : 'text-ink-700 hover:text-ink-950';
  const navActivePill = dark ? 'bg-white/15' : 'bg-white shadow-soft ring-1 ring-black/[0.05]';
  const navActiveText = dark ? 'text-white' : 'text-ink-950';

  return (
    <header className={`sticky top-0 z-navbar ${isLanding ? '' : 'bg-paper'}`}>
      <div className="mx-auto max-w-7xl px-3 pt-4 sm:px-4">
        <div className={`flex h-14 items-center gap-2 rounded-2xl border px-3 transition-all duration-300 ease-out-expo sm:gap-3 sm:px-4 ${surface}`}>
          <button
            onClick={() => handleNav('landing', '/')}
            className="flex shrink-0 items-center gap-2.5 rounded-xl py-1 pr-1 text-left"
            aria-label="SwachDrishti home"
          >
            <LogoMark />
            <span className="hidden whitespace-nowrap leading-none sm:block">
              <span className="font-display text-lg font-extrabold tracking-tight">
                <span className={dark ? 'text-white' : 'text-ink-950'}>Swach</span>
                <span className={dark ? 'text-lime-400' : 'text-leaf-500'}>Drishti</span>
              </span>
              <span className={`mt-0.5 block text-xs font-semibold uppercase tracking-[0.14em] ${dark ? 'text-white/60' : 'text-slate-500'}`}>
                Civic Operations
              </span>
            </span>
          </button>

          <nav className="hidden min-w-0 flex-1 items-center gap-0.5 xl:flex" aria-label="Primary">
            {primaryLinks.map(l => {
              const active = location.pathname === l.path;
              return (
                <button
                  key={l.tab}
                  onClick={() => handleNav(l.tab, l.path)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-200 ${active ? navActiveText : navIdle}`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className={`absolute inset-0 rounded-xl ${navActivePill}`}
                      transition={{ type: 'spring', stiffness: 450, damping: 38 }}
                    />
                  )}
                  <span className="relative">{l.label}</span>
                </button>
              );
            })}

            {roleLinks.length > 0 && (
              <div className="relative" ref={wsRef}>
                <button
                  onClick={() => { setWsOpen(o => !o); setNotifOpen(false); setUserOpen(false); }}
                  aria-haspopup="true"
                  aria-expanded={wsOpen}
                  className={`relative flex items-center gap-1 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-200 ${
                    workspacesActive ? `${navActivePill} ${navActiveText}` : navIdle
                  }`}
                >
                  <span className="relative">Workspaces</span>
                  <ChevronDown
                    className={`relative h-3.5 w-3.5 transition-transform duration-200 ${wsOpen ? 'rotate-180' : ''}`}
                    strokeWidth={2}
                  />
                </button>

                <AnimatePresence>
                  {wsOpen && (
                    <motion.div
                      {...dropdownMotion}
                      className="absolute left-0 top-full z-dropdown mt-2 w-72 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-black/[0.06] bg-white/95 p-2 shadow-lift backdrop-blur-xl"
                    >
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <span className="eyebrow">Role portals</span>
                        <span className="text-xs font-semibold text-slate-500">Pick a workspace</span>
                      </div>
                      {roleLinks.map(l => {
                        const persona = PERSONAS.find(p => p.id === l.tab);
                        const Icon = persona ? persona.icon : Shield;
                        const activeLink = location.pathname === l.path;
                        return (
                          <button
                            key={l.tab}
                            onClick={() => handleNav(l.tab, l.path)}
                            className={`flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
                              activeLink ? 'bg-leaf-50 text-leaf-900 ring-1 ring-leaf-200' : 'text-ink-800 hover:bg-paper-2'
                            }`}
                          >
                            <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1 ${persona ? persona.tint : 'bg-leaf-50 text-leaf-700 ring-leaf-200'}`}>
                              <Icon className="h-4 w-4" strokeWidth={1.75} />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-bold">{l.label}</span>
                              {persona && <span className="block text-xs text-slate-500">{persona.desc}</span>}
                            </span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>

          <span
            aria-hidden="true"
            className={`hidden h-6 w-px shrink-0 xl:block ${dark ? 'bg-white/15' : 'bg-black/10'}`}
          />

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setNotifOpen(o => !o); setUserOpen(false); setDemoOpen(false); }}
                  aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
                  aria-expanded={notifOpen}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${
                    dark ? 'border-white/15 bg-white/[0.06] text-white/80 hover:text-white' : 'border-black/[0.06] bg-white/70 text-ink-700 hover:text-ink-950'
                  }`}
                >
                  <Bell className="h-4 w-4" strokeWidth={1.75} />
                  {unread > 0 && (
                    <>
                      <span className="pointer-events-none absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white/70" />
                      </span>
                      <span className="mono absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold leading-none text-white shadow">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      {...dropdownMotion}
                      className="absolute right-0 top-full z-dropdown mt-2 max-h-96 w-[calc(100vw-2.5rem)] max-w-80 overflow-y-auto rounded-2xl border border-black/[0.06] bg-white/95 p-2 shadow-lift backdrop-blur-xl"
                    >
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <span className="eyebrow">Notifications</span>
                        <button onClick={markAllRead} className="text-xs font-bold text-leaf-700 hover:text-leaf-800 hover:underline">
                          Mark all read
                        </button>
                      </div>
                      {notifs.length === 0 && (
                        <div className="px-3 py-8 text-center text-sm text-slate-500">All caught up.</div>
                      )}
                      {notifs.slice(0, 12).map(n => (
                        <button
                          key={n.id}
                          onClick={() => openNotif(n)}
                          className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-paper-2 ${n.is_read ? '' : 'bg-leaf-50/70'}`}
                        >
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.is_read ? 'bg-slate-200' : 'bg-leaf-500'}`} />
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-bold text-ink-900">{n.title}</span>
                            <span className="block text-xs text-slate-500 line-clamp-2">{n.body}</span>
                            <span className="mono block text-xs text-slate-500">{new Date(n.created_at).toLocaleString()}</span>
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {user && (role === 'CITIZEN' || role === 'WORKER') && (
              <span className={`hidden items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1 min-[420px]:flex ${
                dark ? 'bg-lime-400/15 text-lime-300 ring-lime-400/30' : 'bg-leaf-50 text-leaf-700 ring-leaf-200'
              }`}>
                <Award className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span className="mono">{user.impact_points ?? 0} pts</span>
              </span>
            )}

            {user ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => { setUserOpen(o => !o); setDemoOpen(false); setNotifOpen(false); }}
                  aria-expanded={userOpen}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-xl border py-1 pl-1 pr-2 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 ${
                    dark ? 'border-white/15 bg-white/[0.08] text-white' : 'border-black/[0.06] bg-white/80 text-ink-900'
                  }`}
                >
                  <span className={`grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-white/90 to-white/60 text-xs font-extrabold text-ink-950 ring-2 ${(ROLE_RING[role] || ROLE_RING.CITIZEN).split(' ')[0]}`}>
                    {(displayName[0] || 'U').toUpperCase()}
                  </span>
                  <span className="hidden max-w-24 truncate xl:inline">{displayName}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>

                <AnimatePresence>
                  {userOpen && (
                    <motion.div
                      {...dropdownMotion}
                      className="absolute right-0 top-full z-dropdown mt-2 w-60 rounded-2xl border border-black/[0.06] bg-white/95 p-2 shadow-lift backdrop-blur-xl"
                    >
                      <div className="rounded-xl bg-paper-2/70 px-3 py-2.5">
                        <div className="text-xs text-slate-500">
                          Signed in as <strong className="block truncate text-sm text-ink-900">{displayName}</strong>
                        </div>
                        <span className="mt-1.5 inline-block rounded-full bg-ink-900 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                          {role}
                        </span>
                      </div>
                      <button
                        onClick={() => { setUserOpen(false); handleNav('profile', '/profile'); }}
                        className="mt-1.5 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink-800 transition hover:bg-paper-2"
                      >
                        <User className="h-4 w-4" strokeWidth={1.75} /> Profile & notifications
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        <LogOut className="h-4 w-4" strokeWidth={1.75} /> Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => handleNav('login', '/login')}
                className={`hidden whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 sm:inline-flex ${
                  dark ? 'bg-lime-400 text-ink-950 shadow-glow hover:bg-lime-300' : 'bg-ink-900 text-white shadow-soft hover:bg-ink-800'
                }`}
              >
                Login / Sign up
              </button>
            )}

            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${
                dark ? 'border-white/15 bg-white/[0.06] text-white/80 hover:text-white' : 'border-black/[0.06] bg-white/70 text-ink-700 hover:text-ink-950'
              }`}
            >
              {theme === 'dark'
                ? <Sun className="h-4 w-4" strokeWidth={1.75} />
                : <Moon className="h-4 w-4" strokeWidth={1.75} />}
            </button>

            <div className="relative" ref={demoRef}>
              <button
                onClick={() => { setDemoOpen(o => !o); setUserOpen(false); setNotifOpen(false); }}
                title="One-click demo personas for evaluation"
                aria-expanded={demoOpen}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-extrabold transition-all duration-200 hover:-translate-y-0.5 ${
                  dark
                    ? 'border border-white/15 bg-white/[0.06] text-lime-300 hover:bg-white/[0.12]'
                    : 'border border-leaf-200 bg-leaf-50 text-leaf-700 hover:bg-leaf-100'
                }`}
              >
                <FlaskConical className="h-3.5 w-3.5" strokeWidth={2} />
                <span className="hidden sm:inline">Demo</span>
              </button>

              <AnimatePresence>
                {demoOpen && (
                  <motion.div
                    {...dropdownMotion}
                    className="absolute right-0 top-full z-dropdown mt-2 w-72 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-black/[0.06] bg-white/95 p-2 shadow-lift backdrop-blur-xl"
                  >
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <span className="eyebrow">Switch persona</span>
                      <span className="rounded-full bg-lime-400 px-2 py-0.5 text-xs font-extrabold text-ink-950">
                        Demo mode
                      </span>
                    </div>
                    {PERSONAS.map((r) => {
                      const Icon = r.icon;
                      const isCurrent = user && role.toLowerCase() === r.id;
                      return (
                        <button
                          key={r.id}
                          onClick={() => handlePersona(r.id)}
                          className={`flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
                            isCurrent ? 'bg-leaf-50 text-leaf-900 ring-1 ring-leaf-200' : 'text-ink-800 hover:bg-paper-2'
                          }`}
                        >
                          <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1 ${r.tint} ${r.ring}`}>
                            <Icon className="h-4 w-4" strokeWidth={1.75} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-bold">
                              {r.label} {isCurrent && <span className="text-leaf-700">✓</span>}
                            </span>
                            <span className="block text-xs text-slate-500">{r.desc}</span>
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition xl:hidden ${
                dark ? 'border-white/15 bg-white/[0.06] text-white' : 'border-black/[0.06] bg-white/70 text-ink-800'
              }`}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-dropdown flex flex-col bg-ink-950/95 backdrop-blur-xl xl:hidden"
            aria-label="Mobile"
          >
            <div className="flex h-14 shrink-0 items-center justify-between px-4">
              <div className="flex items-center gap-2.5">
                <LogoMark />
                <span className="font-display text-lg font-extrabold tracking-tight text-white">
                  Swach<span className="text-lime-400">Drishti</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white"
                >
                  {theme === 'dark'
                    ? <Sun className="h-5 w-5" strokeWidth={1.75} />
                    : <Moon className="h-5 w-5" strokeWidth={1.75} />}
                </button>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation menu"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-8">
              <div className="space-y-1.5 pt-2">
                {visibleLinks.map((l, i) => {
                  const active = location.pathname === l.path;
                  return (
                    <motion.button
                      key={l.tab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 + i * 0.035, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => handleNav(l.tab, l.path)}
                      className={`flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-base font-bold transition ${
                        active ? 'bg-lime-400 text-ink-950' : 'bg-white/[0.05] text-white/85 hover:bg-white/[0.1]'
                      }`}
                    >
                      {l.label}
                      <ArrowRight className="h-4 w-4 opacity-60" strokeWidth={2} />
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-2 border-t border-white/10 pt-5">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.05] p-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-leaf-400 to-leaf-600 text-base font-extrabold text-ink-950">
                        {(displayName[0] || 'U').toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-white">{displayName}</div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-leaf-400">{role}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => { setMobileOpen(false); handleNav('profile', '/profile'); }}
                      className="w-full rounded-2xl bg-white/[0.05] px-4 py-3.5 text-left text-sm font-bold text-white/85"
                    >
                      Profile & notifications
                    </button>
                    <button onClick={handleLogout} className="w-full rounded-2xl bg-rose-500/15 px-4 py-3.5 text-left text-sm font-bold text-rose-300">
                      Sign out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleNav('login', '/login')}
                    className="btn-primary w-full"
                  >
                    Login / Sign up
                  </button>
                )}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
