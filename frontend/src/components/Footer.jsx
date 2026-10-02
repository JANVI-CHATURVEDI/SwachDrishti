import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Github, Linkedin, Mail, Twitter, Youtube } from 'lucide-react';
import { Eye } from 'lucide-react';

const PORTALS = [
  { tab: 'citizen', path: '/citizen', label: 'Citizen Report & Track' },
  { tab: 'worker', path: '/worker', label: 'Sanitation Route App' },
  { tab: 'supervisor', path: '/supervisor', label: 'Supervisor Operations' },
  { tab: 'admin', path: '/admin', label: 'Admin Command Center' },
];

const LEARN = [
  { tab: 'public', path: '/public', label: "Your City's Waste Picture" },
  { tab: 'awareness', path: '/awareness', label: 'Know Your Waste Guide' },
  { tab: 'awareness', path: '/awareness', label: 'Segregation Quiz' },
];

const SOCIAL = [
  { icon: Twitter, label: 'SwachDrishti on X' },
  { icon: Github, label: 'Open source repository' },
  { icon: Linkedin, label: 'SwachDrishti on LinkedIn' },
  { icon: Youtube, label: 'Product walkthrough' },
  { icon: Mail, label: 'Contact the team' },
];

export default function Footer({ setActiveTab }) {
  const navigate = useNavigate();

  const go = (tab, path) => {
    if (setActiveTab) setActiveTab(tab);
    navigate(path);
  };

  return (
    <footer className="relative isolate overflow-hidden bg-ink-950 text-slate-400">
      {/* aurora hint */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-60"
        style={{
          background:
            'radial-gradient(60% 100% at 20% 0%, rgb(16 185 129 / .35) 0%, transparent 65%),' +
            'radial-gradient(50% 100% at 85% 6%, rgb(190 242 100 / .18) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />
      <div className="grain pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* CTA strip */}
        <div className="-mt-px flex flex-col gap-5 border-b border-white/10 py-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <div className="eyebrow-dark mb-2">Stay in the loop</div>
            <h3 className="h-card text-2xl font-bold text-white sm:text-3xl">
              Your ward's cleanliness brief, every Monday.
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Turnaround times, open hotspots and verified cleanups — the same numbers city hall sees.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => go('public', '/public')} className="btn-primary">
              See live transparency <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </button>
            <button onClick={() => go('awareness', '/awareness')} className="btn-ghost">
              Take the waste quiz
            </button>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-1 gap-8 py-10 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-leaf-500 to-lime-400 text-ink-950 shadow-glow-leaf">
                <Eye className="h-[18px] w-[18px]" strokeWidth={2} />
              </span>
              <span className="h-card text-lg font-bold tracking-tight text-white">
                Swach<span className="text-leaf-400">Drishti</span>
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              Making civic action visible. Scattered citizen waste reports become location-aware,
              prioritized municipal operations.
            </p>
            <span className="inline-block rounded-full border border-leaf-500/30 bg-leaf-500/10 px-3 py-1 text-xs font-semibold text-leaf-300">
              Citizen-powered · Location-aware · Action-driven
            </span>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
              Operational Portals
            </h4>
            <ul className="space-y-1">
              {PORTALS.map(p => (
                <li key={p.label}>
                  <button
                    onClick={() => go(p.tab, p.path)}
                    className="rounded-lg py-1.5 text-left text-sm text-slate-400 transition-colors hover:text-lime-300"
                  >
                    {p.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
              Transparency & Learning
            </h4>
            <ul className="space-y-1">
              {LEARN.map(p => (
                <li key={p.label}>
                  <button
                    onClick={() => go(p.tab, p.path)}
                    className="rounded-lg py-1.5 text-left text-sm text-slate-400 transition-colors hover:text-lime-300"
                  >
                    {p.label}
                  </button>
                </li>
              ))}
              <li className="py-1.5 text-sm text-slate-500">Spectrum Cleanliness Index</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
              Civic Core
            </h4>
            <p className="text-sm leading-relaxed text-slate-400">
              “See the waste. Spark the action.” Built for resilient municipalities, dedicated
              sanitation workers, and proactive citizens.
            </p>
            <p className="mono mt-3 text-xs leading-relaxed text-slate-500">
              Deterministic priority · Hotspot clustering · Zero PII leak
            </p>

            <div className="mt-4 flex items-center gap-2">
              {SOCIAL.map((s, i) => (
                <span
                  key={i}
                  title={s.label}
                  aria-hidden="true"
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-400 transition-all duration-200 hover:-translate-y-0.5 hover:border-leaf-500/40 hover:text-leaf-300"
                >
                  <s.icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-slate-500 sm:flex-row">
          <div>© {new Date().getFullYear()} SwachDrishti. All rights reserved.</div>
          <div className="flex items-center gap-2">
            Designed for high-impact municipal waste operations.
          </div>
        </div>
      </div>

      {/* giant faded wordmark */}
      <div
        className="pointer-events-none relative -mb-[2vw] select-none overflow-hidden text-center leading-[0.8] text-white"
        aria-hidden="true"
      >
        <div
          className="whitespace-nowrap font-display font-extrabold tracking-[-0.04em] opacity-[0.04]"
          style={{ fontSize: '18vw' }}
        >
          SwachDrishti
        </div>
      </div>
    </footer>
  );
}
