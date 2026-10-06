import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, FlaskConical, AlertCircle, Eye, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

const ROLE_HOME = { CITIZEN: '/citizen', WORKER: '/worker', SUPERVISOR: '/supervisor', ADMIN: '/admin' };

const DEMO_ROLES = [
  { id: 'citizen', label: 'Citizen' },
  { id: 'worker', label: 'Worker' },
  { id: 'supervisor', label: 'Supervisor' },
  { id: 'admin', label: 'Admin' },
];

const QUICK_FILL = [
  { label: 'citizen', u: 'citizen', p: 'citizen123' },
  { label: 'worker', u: 'worker', p: 'worker123' },
  { label: 'supervisor', u: 'supervisor', p: 'supervisor123' },
  { label: 'admin', u: 'admin', p: 'admin123' },
];

const PROOF = [
  { icon: ShieldCheck, title: 'Explainable priority', desc: 'Five weighted factors, readable by anyone.' },
  { icon: Sparkles, title: 'AI-verified cleanup', desc: 'Before/after photographs scored 0–100.' },
  { icon: Eye, title: 'Citizen audit', desc: 'You confirm the fix — or reopen it in one tap.' },
];

function BrandPanel({ mode }) {
  const reduced = useReducedMotion();
  const register = mode === 'register';

  return (
    <aside className="grain relative isolate flex min-h-[340px] flex-col justify-between overflow-hidden rounded-3xl bg-ink-950 p-7 text-white shadow-lift sm:p-8 lg:p-9">
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-leaf-500/35 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-lime-400/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-leaf-500 to-lime-400 text-ink-950 shadow-glow-leaf ring-1 ring-white/20">
            <Eye className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <span className="leading-none">
            <span className="font-display text-xl font-extrabold tracking-tight">
              Swach<span className="text-lime-400">Drishti</span>
            </span>
            <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
              Civic Operations
            </span>
          </span>
        </div>

        <motion.h1
          key={mode}
          initial={reduced ? undefined : { opacity: 0, y: 14 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 max-w-md font-display text-[clamp(1.9rem,3.2vw,2.6rem)] font-extrabold leading-[0.95] tracking-[-0.03em]"
        >
          {register ? (
            <>Join the loop.<br /><span className="bg-gradient-to-r from-lime-300 to-leaf-400 bg-clip-text text-transparent">Spark the action.</span></>
          ) : (
            <>Welcome back.<br /><span className="bg-gradient-to-r from-lime-300 to-leaf-400 bg-clip-text text-transparent">The city kept working.</span></>
          )}
        </motion.h1>

        <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
          {register
            ? 'Create a citizen account — report issues and verify cleanups in your ward.'
            : 'Sign in to report issues, track cleanups and earn impact points.'}
        </p>

        <ul className="mt-5 space-y-2.5">
          {PROOF.map((p) => (
            <li key={p.title} className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.07] text-lime-300 ring-1 ring-white/10">
                <p.icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span>
                <span className="block text-sm font-bold text-white">{p.title}</span>
                <span className="block text-xs text-slate-400">{p.desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        {[
          { k: '142', l: 'resolved' },
          { k: '88.5%', l: 'resolution rate' },
          { k: '8', l: 'workers on duty' },
          { k: '5', l: 'wards covered' },
        ].map((s) => (
          <span
            key={s.l}
            className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/70 backdrop-blur"
          >
            <span className="mono mr-1.5 font-semibold text-lime-300">{s.k}</span>
            {s.l}
          </span>
        ))}
      </div>
    </aside>
  );
}

export default function Login() {
  const { user, loading, login, register, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const reduced = useReducedMotion();
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    username: '', password: '', email: '', first_name: '', last_name: '', phone: '',
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const goHome = (user) => {
    const from = location.state?.from;
    navigate(from && from !== '/login' ? from : (ROLE_HOME[user?.role] || '/citizen'));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') {
        const user = await login(form.username.trim(), form.password);
        goHome(user);
      } else {
        const user = await register({
          username: form.username.trim(),
          password: form.password,
          email: form.email.trim(),
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone: form.phone.trim(),
        });
        goHome(user);
      }
    } catch (err) {
      const data = err.response?.data;
      const msg = typeof data === 'string' ? data
        : data?.non_field_errors?.[0] || data?.username?.[0] || data?.password?.[0]
        || data?.email?.[0] || data?.detail || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const demoLogin = async (roleId) => {
    setBusy(true);
    setError('');
    try {
      const user = await switchRole(roleId);
      if (user) goHome(user);
    } catch {
      setError('Demo login failed. Is the backend running?');
    } finally {
      setBusy(false);
    }
  };

  if (!loading && user) {
    return <Navigate to={ROLE_HOME[user.role] || '/citizen'} replace />;
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl items-stretch gap-5 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:content-center lg:gap-7 lg:min-h-[calc(100svh-72px)]">
      <BrandPanel mode={mode} />

      <motion.div
        initial={reduced ? undefined : { opacity: 0, y: 18 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-soft"
      >
        {/* mode tabs */}
        <div className="m-3 grid grid-cols-2 gap-1 rounded-2xl bg-paper-2 p-1 ring-1 ring-black/[0.05]">
          {['login', 'register'].map(m => {
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                aria-pressed={active}
                className={`relative rounded-xl px-3 py-2.5 text-sm font-bold transition-colors duration-200 ${active ? 'text-ink-950' : 'text-slate-500 hover:text-ink-800'}`}
              >
                {active && (
                  <motion.span
                    layoutId="auth-tab"
                    className="absolute inset-0 rounded-xl bg-white shadow-soft ring-1 ring-black/[0.05]"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <span className="relative flex items-center justify-center gap-2">
                  {m === 'login' ? <LogIn className="h-4 w-4" strokeWidth={1.75} /> : <UserPlus className="h-4 w-4" strokeWidth={1.75} />}
                  {m === 'login' ? 'Sign in' : 'Create account'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="px-5 pb-6 sm:px-7">
          <div className="mb-5">
            <span className="eyebrow">{mode === 'login' ? 'Authenticate' : 'New resident'}</span>
            <h2 className="h-section mt-2 text-2xl text-ink-950 sm:text-3xl">
              {mode === 'login' ? 'Welcome back' : 'Join SwachDrishti'}
            </h2>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} /> {error}
              </div>
            )}

            {mode === 'register' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">First name</span>
                  <input placeholder="Asha" value={form.first_name} onChange={set('first_name')} className="input" autoComplete="given-name" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">Last name</span>
                  <input placeholder="Verma" value={form.last_name} onChange={set('last_name')} className="input" autoComplete="family-name" />
                </label>
              </div>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Username</span>
              <input
                placeholder="citizen"
                value={form.username} onChange={set('username')}
                className="input" required autoComplete="username"
              />
            </label>

            {mode === 'register' && (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">Email</span>
                  <input
                    placeholder="you@example.com (for report + verification alerts)"
                    type="email" value={form.email} onChange={set('email')}
                    className="input" required autoComplete="email"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">Phone (optional)</span>
                  <input
                    placeholder="+919876543210 (for SMS alerts)"
                    value={form.phone} onChange={set('phone')}
                    className="input" autoComplete="tel"
                  />
                </label>
              </>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Password</span>
              <input
                placeholder={mode === 'register' ? 'Minimum 6 characters' : '••••••••'}
                type="password" value={form.password} onChange={set('password')}
                className="input" required minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </label>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="w-full text-xs font-semibold text-slate-500">
                Seeded accounts — tap to fill, then sign in:
              </span>
              {QUICK_FILL.map(q => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setForm(f => ({ ...f, username: q.u, password: q.p })); }}
                  className="chip hover:bg-leaf-50 hover:text-leaf-700 hover:ring-leaf-300"
                >
                  {q.label}
                </button>
              ))}
            </div>

            <button
              type="submit" disabled={busy}
              className="btn-primary w-full"
            >
              {mode === 'login' ? <LogIn className="h-4 w-4" strokeWidth={2} /> : <UserPlus className="h-4 w-4" strokeWidth={2} />}
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create citizen account'}
              {!busy && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
            </button>
          </form>
        </div>

        {/* demo shortcuts */}
        <div className="mt-auto border-t border-black/[0.06] bg-paper-2/60 px-5 py-5 sm:px-7">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            <FlaskConical className="h-3.5 w-3.5 text-lime-600" strokeWidth={2} />
            <span>Demo shortcuts</span>
            <span className="h-px flex-1 bg-black/[0.07]" />
            <span className="rounded-full bg-lime-400 px-2 py-0.5 text-xs font-extrabold uppercase text-ink-950">
              Demo mode
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DEMO_ROLES.map(r => (
              <button
                key={r.id} onClick={() => demoLogin(r.id)} disabled={busy}
                className="btn-soft justify-center"
              >
                <FlaskConical className="h-3.5 w-3.5" strokeWidth={2} /> {r.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
