import React from 'react';
import { Award, Lock, Medal, ShieldCheck, Sparkles, Star, Trash2, Truck } from 'lucide-react';
import { CountUp } from './motion';

const BADGE_META = {
  'Waste Watcher': { icon: Trash2, from: 'from-leaf-400', to: 'to-emerald-600', ring: 'ring-leaf-500/30', text: 'text-leaf-700' },
  'Street Reporter': { icon: Medal, from: 'from-sky-400', to: 'to-blue-600', ring: 'ring-blue-500/30', text: 'text-blue-700' },
  'Neighborhood Guardian': { icon: ShieldCheck, from: 'from-teal-400', to: 'to-cyan-600', ring: 'ring-teal-500/30', text: 'text-teal-700' },
  'City Sentinel': { icon: Star, from: 'from-amber-300', to: 'to-amber-600', ring: 'ring-amber-500/30', text: 'text-amber-700' },
  'Verified Voice': { icon: Sparkles, from: 'from-violet-400', to: 'to-purple-600', ring: 'ring-violet-500/30', text: 'text-violet-700' },
  'Clean Street Contributor': { icon: Sparkles, from: 'from-lime-300', to: 'to-leaf-500', ring: 'ring-lime-500/40', text: 'text-leaf-700' },
  'First Fix': { icon: Truck, from: 'from-sky-400', to: 'to-indigo-600', ring: 'ring-indigo-500/30', text: 'text-indigo-700' },
  'Street Doctor': { icon: Medal, from: 'from-leaf-400', to: 'to-teal-600', ring: 'ring-leaf-500/30', text: 'text-leaf-700' },
  'Zone Champion': { icon: ShieldCheck, from: 'from-cyan-400', to: 'to-blue-600', ring: 'ring-cyan-500/30', text: 'text-cyan-700' },
  'City Healer': { icon: Star, from: 'from-amber-300', to: 'to-orange-600', ring: 'ring-amber-500/30', text: 'text-amber-700' },
  'Quality Star': { icon: Award, from: 'from-fuchsia-400', to: 'to-purple-600', ring: 'ring-violet-500/30', text: 'text-violet-700' },
};

const FALLBACK_META = { icon: Medal, from: 'from-leaf-400', to: 'to-emerald-600', ring: 'ring-leaf-500/30', text: 'text-leaf-700' };

const METRIC_LABEL = { reports: 'reports', verifications: 'confirmations', completions: 'cleanups', quality: 'quality cleanups' };

function RingProgress({ pct }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(6,18,13,.08)" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="url(#xpGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          style={{ transition: 'stroke-dasharray .8s cubic-bezier(.16,1,.3,1)' }}
        />
        <defs>
          <linearGradient id="xpGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#BEF264" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
      </svg>
      <span className="mono absolute inset-0 grid place-items-center text-xs font-semibold text-ink-900">
        {Math.round(pct)}%
      </span>
    </div>
  );
}

export default function ImpactCard({ user, stats, catalog, headline, subline }) {
  const badges = user?.badges || [];
  const points = user?.impact_points ?? 0;
  const rows = (catalog || []).map((b) => ({
    ...b,
    earned: badges.includes(b.name),
    progress: Math.min(100, Math.round(((stats?.[b.metric] || 0) / Math.max(1, b.threshold)) * 100)),
  }));
  const next = rows.find((b) => !b.earned);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-6 shadow-soft">
      <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-gradient-to-br from-lime-400/25 to-leaf-500/20 blur-2xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div className="min-w-0">
          <div className="eyebrow">{headline}</div>
          <div className="mt-2 flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-lime-400 to-leaf-500 text-ink-950 shadow-glow">
              <Award className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <div className="stat-number text-3xl font-semibold leading-none text-ink-900">
                <CountUp value={points} duration={1.2} />
              </div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                impact points
              </div>
            </div>
          </div>
          {subline && <p className="mt-2 text-sm text-slate-500">{subline}</p>}
        </div>

        {next && (
          <div className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl bg-paper-2/70 p-4 ring-1 ring-black/[0.04] sm:max-w-sm">
            <RingProgress pct={next.progress} />
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                Next badge
              </div>
              <div className="h-card truncate text-sm font-bold text-ink-900">{next.name}</div>
              <div className="mono mt-1 text-xs text-slate-500">
                {stats?.[next.metric] || 0}/{next.threshold} {METRIC_LABEL[next.metric]}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {rows.map((b) => {
          const meta = BADGE_META[b.name] || FALLBACK_META;
          const Icon = b.earned ? meta.icon : Lock;
          return (
            <div
              key={b.name}
              title={`${b.description} (${stats?.[b.metric] || 0}/${b.threshold})`}
              className={`group relative overflow-hidden rounded-2xl border p-3 text-center transition-all duration-300 ease-out-expo
                ${b.earned
                  ? `medal-shine border-transparent bg-gradient-to-br ${meta.from} ${meta.to} text-white shadow-soft hover:-translate-y-1 hover:shadow-lift`
                  : 'border-black/[0.06] bg-paper-2/60 text-slate-400 hover:bg-paper-2'
                }`}
            >
              <span
                className={`mx-auto grid h-9 w-9 place-items-center rounded-xl
                  ${b.earned ? 'bg-white/20 ring-1 ring-white/30' : 'bg-white/70 ring-1 ring-black/[0.06] backdrop-blur-sm'}`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </span>
              <div
                className={`mt-2 text-xs font-bold leading-tight ${b.earned ? 'text-white' : 'text-slate-500'}`}
              >
                {b.name}
              </div>
              <div
                className={`mono mt-1 text-xs ${b.earned ? 'text-white/85' : 'text-slate-400'}`}
              >
                {b.earned ? 'Earned' : `${stats?.[b.metric] || 0}/${b.threshold}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
