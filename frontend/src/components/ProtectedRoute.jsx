import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, SearchX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ROLE_HOME = {
  CITIZEN: '/citizen',
  WORKER: '/worker',
  SUPERVISOR: '/supervisor',
  ADMIN: '/admin',
};

function LoadingGate() {
  return (
    <div className="flex items-center justify-center gap-2.5 py-20 text-sm font-semibold text-slate-600">
      <span className="h-4 w-4 rounded-full border-2 border-leaf-200 border-t-leaf-500 animate-spin" />
      Checking access…
    </div>
  );
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingGate />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export function RequireRole({ roles, children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingGate />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles.includes(role) || role === 'ADMIN') return children;
  return <Navigate to={ROLE_HOME[role] || '/'} replace />;
}

export function AccessDenied() {
  const { role } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="card space-y-4 p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600 ring-1 ring-rose-200/70">
          <ShieldAlert className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <span className="eyebrow">Access control</span>
        <h1 className="h-card text-2xl text-ink-950">Restricted area</h1>
        <p className="text-sm leading-relaxed text-slate-500">
          Your <strong className="font-bold text-ink-900">{role}</strong> account can't open this
          dashboard. Each role gets its own workspace — you'll find everything you need in yours.
        </p>
        <button
          onClick={() => navigate(ROLE_HOME[role] || '/')}
          className="btn-primary mx-auto"
        >
          <Home className="h-4 w-4" strokeWidth={2} /> Go to my dashboard
        </button>
      </div>
    </div>
  );
}

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="card space-y-4 p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-paper-2 to-white text-slate-500 ring-1 ring-black/[0.06]">
          <SearchX className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <span className="eyebrow">404</span>
        <h1 className="h-card text-2xl text-ink-950">Page not found</h1>
        <p className="text-sm leading-relaxed text-slate-500">
          This civic corner doesn't exist — let's get you back on route.
        </p>
        <button
          onClick={() => navigate('/')}
          className="btn-dark mx-auto"
        >
          <Home className="h-4 w-4" strokeWidth={2} /> Back to overview
        </button>
      </div>
    </div>
  );
}
