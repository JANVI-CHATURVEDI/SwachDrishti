import React, { useEffect, useRef } from 'react';
import { Inbox, TrendingUp, TrendingDown, Minus } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Surfaces                                                           */
/* ------------------------------------------------------------------ */

export function Card({ className = '', children, hover = false, ...rest }) {
  return (
    <div className={`card ${hover ? 'card-hover' : ''} ${className}`} {...rest}>
      {children}
    </div>
  );
}

/** Gradient tile that holds a single icon (16 / 20 / 24px). */
export function IconBadge({ icon: Icon, className = '', tone = 'leaf', size = 'md' }) {
  const tones = {
    leaf: 'from-leaf-500/15 to-leaf-500/5 text-leaf-600 ring-leaf-500/20',
    lime: 'from-lime-400/25 to-lime-400/5 text-ink-900 ring-lime-500/30',
    blue: 'from-blue-500/15 to-blue-500/5 text-blue-600 ring-blue-500/20',
    amber: 'from-amber-500/15 to-amber-500/5 text-amber-600 ring-amber-500/20',
    rose: 'from-rose-500/15 to-rose-500/5 text-rose-600 ring-rose-500/20',
    violet: 'from-violet-500/15 to-violet-500/5 text-violet-600 ring-violet-500/20',
    ink: 'from-ink-800 to-ink-950 text-white ring-ink-700/40',
    white: 'from-white to-white/60 text-ink-900 ring-white/40',
  };
  const sizes = { sm: 'h-8 w-8 rounded-lg', md: 'h-10 w-10 rounded-xl', lg: 'h-12 w-12 rounded-2xl' };
  const iconSizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' };
  return (
    <span
      className={`inline-grid place-items-center bg-gradient-to-br ring-1 backdrop-blur-sm ${tones[tone] || tones.leaf} ${sizes[size] || sizes.md}`}
      aria-hidden="true"
    >
      {Icon && <Icon className={iconSizes[size] || iconSizes.md} strokeWidth={1.75} />}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Headers                                                            */
/* ------------------------------------------------------------------ */

export function PageHeader({ eyebrow, title, sub, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h1 className="h-card text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-900">
          {title}
        </h1>
        {sub && <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionHeader({ eyebrow, title, sub, actions, className = '', align = 'left' }) {
  return (
    <div
      className={`flex flex-wrap items-end justify-between gap-4 ${align === 'center' ? 'text-center flex-col items-center' : ''} ${className}`}
    >
      <div className={align === 'center' ? 'max-w-2xl' : 'min-w-0 max-w-2xl'}>
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h2 className="h-section text-ink-900">{title}</h2>
        {sub && <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">{sub}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feedback                                                           */
/* ------------------------------------------------------------------ */

export function EmptyState({ title = 'Nothing here yet', sub = '', action = null, icon: Icon = Inbox }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="relative mx-auto grid h-20 w-20 place-items-center">
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-leaf-400/25 to-lime-400/20 blur-xl" />
        <span className="relative grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-leaf-50 to-lime-100 text-leaf-600 ring-1 ring-leaf-500/15">
          <Icon className="h-7 w-7" strokeWidth={1.75} />
        </span>
      </div>
      <div className="h-card mt-5 text-base font-bold text-ink-900">{title}</div>
      {sub && <div className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">{sub}</div>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '', rounded = 'rounded-2xl' }) {
  return <div className={`shimmer ${rounded} ${className}`} aria-hidden="true" />;
}

export function SkeletonList({ rows = 4, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 shrink-0" rounded="rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" rounded="rounded-full" />
            <Skeleton className="h-3 w-1/3" rounded="rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-sm font-medium text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-leaf-200 border-t-leaf-600" />
      {label}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data display                                                       */
/* ------------------------------------------------------------------ */

export function StatChip({ icon: Icon, value, label, tone = 'leaf' }) {
  const tones = {
    leaf: 'bg-leaf-50 ring-leaf-200 text-leaf-700',
    emerald: 'bg-leaf-50 ring-leaf-200 text-leaf-700',
    blue: 'bg-blue-50 ring-blue-200 text-blue-700',
    amber: 'bg-amber-50 ring-amber-200 text-amber-800',
    rose: 'bg-rose-50 ring-rose-200 text-rose-700',
    slate: 'bg-paper-2 ring-black/[0.06] text-ink-700',
    violet: 'bg-violet-50 ring-violet-200 text-violet-700',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${tones[tone] || tones.slate}`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />}
      {value}
      {label && <span className="font-semibold opacity-80">{label}</span>}
    </span>
  );
}

export function Pill({ children, tone = 'neutral', className = '', icon: Icon = null }) {
  const tones = {
    neutral: 'bg-white text-ink-700 ring-black/[0.06]',
    leaf: 'bg-leaf-50 text-leaf-700 ring-leaf-200',
    lime: 'bg-lime-400 text-ink-950 ring-lime-500/40 font-bold',
    dark: 'bg-ink-900 text-white ring-ink-700',
    outline: 'bg-transparent text-slate-500 ring-black/10',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    rose: 'bg-rose-50 text-rose-700 ring-rose-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tones[tone] || tones.neutral} ${className}`}>
      {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />}
      {children}
    </span>
  );
}

/**
 * Big mono number + label + optional trend arrow.
 * `value` may be a string (e.g. "88.5%") — pass `countTo` + `suffix` for animation.
 */
export function Stat({ label, value, trend, icon: Icon = null, tone = 'neutral', className = '' }) {
  const trendDir = typeof trend === 'number' ? (trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat') : null;
  const TrendIcon = trendDir === 'up' ? TrendingUp : trendDir === 'down' ? TrendingDown : Minus;
  const trendTone =
    trendDir === 'up' ? 'text-leaf-600 bg-leaf-50' : trendDir === 'down' ? 'text-rose-600 bg-rose-50' : 'text-slate-500 bg-paper-2';
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <div className="stat-number text-3xl font-semibold leading-none text-ink-900">{value}</div>
        <div className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</div>
      </div>
      {trend !== undefined && trend !== null && (
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-2xs font-bold ${trendTone}`}>
          <TrendIcon className="h-3 w-3" strokeWidth={2} />
          {typeof trend === 'number' ? `${trend > 0 ? '+' : ''}${trend}` : trend}
        </span>
      )}
      {Icon && <Icon className="hidden h-5 w-5 shrink-0 text-slate-300 sm:block" strokeWidth={1.75} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hooks (behaviour unchanged)                                        */
/* ------------------------------------------------------------------ */

export function useLockBody(locked) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [locked]);
}

/** Dismiss popups on outside click/tap or Escape. Attach ref to the wrapper. */
export function useDismiss(active, onDismiss) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active) return;
    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onDismiss();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [active, onDismiss]);
  return ref;
}

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === undefined || parsed === null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
