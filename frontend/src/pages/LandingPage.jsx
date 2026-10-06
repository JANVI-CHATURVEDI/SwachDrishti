import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Eye, Shield, Users, BarChart3, ArrowRight, CheckCircle2, Sparkles,
  MapPin, Truck, RefreshCw, User, HardHat, Compass, Activity,
  ScanEye, Radar, BadgeCheck, Zap, Route, ArrowUpRight, Quote, Play, Star,
} from 'lucide-react';
import { Reveal, CountUp, Marquee, Tilt, staggerContainer, fadeUp } from '../components/motion';

/* ------------------------------------------------------------------
   Content blocks (visual only — no behaviour lives here)
   ------------------------------------------------------------------ */

const PORTALS = [
  {
    role: 'CITIZEN', path: '/citizen', icon: User,
    title: 'Citizen Reports',
    desc: 'Report a dump with a photo and GPS, follow the cleanup live, then verify it yourself.',
    meta: 'Report · Track · Verify',
    tint: 'bg-leaf-100 text-leaf-700 ring-leaf-200',
    chip: 'bg-leaf-50 text-leaf-700 ring-leaf-200',
  },
  {
    role: 'WORKER', path: '/worker', icon: HardHat,
    title: 'Field Crew Route',
    desc: "Today's assigned stops, a priority-weighted ward route and before/after proof uploads.",
    meta: 'Route · Capture · Close',
    tint: 'bg-amber-100 text-amber-700 ring-amber-200',
    chip: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  {
    role: 'SUPERVISOR', path: '/supervisor', icon: Compass,
    title: 'Supervisor Ops',
    desc: 'Dispatch crews, audit the evidence and rebalance the roster as hotspots shift.',
    meta: 'Dispatch · Audit · Roster',
    tint: 'bg-sky-100 text-sky-700 ring-sky-200',
    chip: 'bg-sky-50 text-sky-700 ring-sky-200',
  },
  {
    role: 'ADMIN', path: '/admin', icon: Shield,
    title: 'City Command',
    desc: 'Cleanliness index, hotspot forecast, staff onboarding and natural-language search.',
    meta: 'KPIs · Forecast · Search',
    tint: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
    chip: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  },
];

const LOOP = [
  { step: 'Report', desc: 'Photo, GPS, AI classification' },
  { step: 'Verify', desc: 'Duplicate & proximity check' },
  { step: 'Prioritize', desc: 'Score based on 5 parameters' },
  { step: 'Assign', desc: 'Dynamic dispatch to field crew' },
  { step: 'Resolve', desc: 'Cleanup evidence & logs' },
  { step: 'Citizen Check', desc: 'Community audit & reopen' },
  { step: 'Prevent', desc: 'Hotspot mitigation policy' },
];

const FEATURES = [
  {
    icon: ScanEye, title: 'Smart Reports', tag: 'Capture',
    desc: 'AI-assisted categorization, duplicate detection and a pinpoint geolocation picker. Drafts are remembered locally, so a flaky network never loses a report.',
    art: 'map', tint: 'bg-leaf-100 text-leaf-700 ring-leaf-200',
  },
  {
    icon: BadgeCheck, title: 'Explainable Priority', tag: 'Decide',
    desc: 'Every score is a readable chain of five weighted factors — density, age, sensitive context, severity and hotspot recurrence.',
    art: 'score', tint: 'bg-lime-400/30 text-ink-900 ring-lime-500/40',
  },
  {
    icon: Radar, title: 'Hotspot AI', tag: 'Predict',
    desc: 'Recurring dump sites are clustered automatically into persistent hotspots with targeted operational advice.',
    tint: 'bg-rose-100 text-rose-700 ring-rose-200',
  },
  {
    icon: Users, title: 'Citizen Verification', tag: 'Close the loop',
    desc: 'Residents confirm the cleanup before a task is archived — or reopen it in one tap.',
    tint: 'bg-sky-100 text-sky-700 ring-sky-200',
  },
  {
    icon: Sparkles, title: 'AI Vision Audit', tag: 'Audit',
    desc: 'Before/after photographs are compared by a vision model into a 0–100 cleanup score with a written verdict.',
    tint: 'bg-violet-100 text-violet-700 ring-violet-200',
  },
  {
    icon: Zap, title: 'Gamified Impact', tag: 'Reward',
    desc: 'Points, streaks and gradient medals keep citizens and crews coming back to the same mission.',
    tint: 'bg-amber-100 text-amber-700 ring-amber-200',
  },
];

const TRUST = [
  { icon: BadgeCheck, label: 'Citizen-verified cleanups' },
  { icon: Truck, label: 'Same-day crew dispatch' },
  { icon: Shield, label: 'Zero-PII by design' },
  { icon: Eye, label: 'Open civic data' },
];

const CAPABILITIES = [
  'AI Triage', 'Hotspot Forecasting', 'Before / After Verification', 'Explainable Priority',
  'Citizen Audit', 'Crew Dispatch', 'Live Ward Map', 'Semantic Search', 'Cleanliness Index',
  'Zero-PII Design', 'On-demand Pickups', 'Reopen Power',
];

/* ------------------------------------------------------------------
   Shared bits
   ------------------------------------------------------------------ */

function SectionHead({ kicker, title, sub, center = false, tone = 'dark' }) {
  const dark = tone === 'dark';
  return (
    <Reveal className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <span className={`flex items-center gap-3 ${center ? 'justify-center' : ''}`}>
        <span className={`h-px w-10 shrink-0 ${dark ? 'bg-lime-400/70' : 'bg-leaf-500'}`} aria-hidden="true" />
        <span className={dark ? 'eyebrow-dark' : 'eyebrow'}>{kicker}</span>
      </span>
      <h2 className={`h-section mt-4 ${dark ? 'text-white' : 'text-ink-900'}`}>{title}</h2>
      {sub && (
        <p className={`mt-4 text-sm leading-relaxed sm:text-base ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
          {sub}
        </p>
      )}
    </Reveal>
  );
}

function HeroHeadline() {
  const reduced = useReducedMotion();
  const lines = ['See the waste.', 'Spark the action.'];
  return (
    <h1 className="h-display max-w-3xl">
      {lines.map((line, li) => (
        <motion.span
          key={line}
          className={`block ${li === 1 ? 'bg-gradient-to-r from-lime-300 via-lime-400 to-leaf-400 bg-clip-text text-transparent' : 'text-white'}`}
          initial={reduced ? undefined : { opacity: 0, y: 26, filter: 'blur(8px)' }}
          animate={reduced ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.75, delay: 0.12 + li * 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          {line}
        </motion.span>
      ))}
    </h1>
  );
}

/** Slim glass card that floats over the hero photo. */
function VerifiedCard({ className = '' }) {
  const pct = 94;
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className={`rounded-2xl border border-white/15 bg-ink-950/80 p-4 shadow-dark-soft backdrop-blur-xl ${className}`}>
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden="true">
            <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="6" />
            <motion.circle
              cx="32" cy="32" r={r} fill="none" stroke="url(#heroVerified)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${c} ${c}`}
              initial={{ strokeDashoffset: c }}
              whileInView={{ strokeDashoffset: c - (pct / 100) * c }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
            />
            <defs>
              <linearGradient id="heroVerified" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#BEF264" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </svg>
          <span className="mono absolute inset-0 grid place-items-center text-base font-semibold text-white">
            <CountUp value={pct} duration={1.6} />
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-lime-300">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} /> AI vision audit
          </div>
          <div className="mt-1 text-sm font-bold leading-tight text-white">Cleanup verified</div>
          <div className="mono mt-0.5 text-xs text-white/60">Before / after · 0–100</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- bento artwork (light surfaces) ---------- */

function FeatureArt({ kind }) {
  if (kind === 'map') {
    return (
      <div className="relative mt-5 h-44 overflow-hidden rounded-2xl border border-black/[0.06] bg-paper-2 bg-grid-dots [background-size:18px_18px]">
        <svg viewBox="0 0 420 176" className="h-full w-full" aria-hidden="true">
          <path d="M20 150 L90 120 L150 132 L215 78 L300 92 L392 40" fill="none" stroke="#059669" strokeWidth="3" strokeDasharray="9 9" strokeLinecap="round" />
          <path d="M20 40 H400 M20 96 H400 M120 12 V164 M268 12 V164" stroke="rgba(6,18,13,.06)" strokeWidth="1" />
        </svg>
        <span className="absolute left-[16%] top-[64%] grid h-7 w-7 place-items-center rounded-full bg-rose-500 text-white shadow-lift ring-2 ring-white">
          <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/60" />
          <MapPin className="relative h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
        <span className="absolute left-[46%] top-[36%] grid h-7 w-7 place-items-center rounded-full bg-amber-500 text-white shadow-lift ring-2 ring-white">
          <MapPin className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
        <span className="absolute left-[76%] top-[20%] grid h-7 w-7 place-items-center rounded-full bg-leaf-500 text-white shadow-lift ring-2 ring-white">
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
        <div className="absolute bottom-3 left-3 rounded-xl border border-black/[0.06] bg-white/90 px-3 py-2 text-xs font-bold text-ink-900 shadow-soft backdrop-blur">
          Zone 3 · <span className="mono text-rose-500">2 critical</span>
        </div>
      </div>
    );
  }
  if (kind === 'score') {
    return (
      <div className="mt-5 space-y-2 rounded-2xl border border-black/[0.06] bg-paper-2 p-4">
        {[['Hazard', 92, 'bg-rose-500'], ['Recurrence', 76, 'bg-amber-500'], ['Age', 54, 'bg-blue-500'], ['Density', 38, 'bg-leaf-500']].map(([l, w, c]) => (
          <div key={l} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs font-semibold text-slate-600">{l}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.08]">
              <motion.span
                className={`block h-full rounded-full ${c}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${w}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              />
            </span>
            <span className="mono w-8 text-right text-xs text-slate-600">{w}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

/* ------------------------------------------------------------------
   Page
   ------------------------------------------------------------------ */

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const reduced = useReducedMotion();
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const photoY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -60]);
  const heroTextY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 36]);

  useEffect(() => {
    let live = true;
    api.get('/api/analytics/overview/').catch(() => ({ data: null })).then(res => {
      if (live && res.data) setStats(res.data);
    });
    return () => { live = false; };
  }, []);

  const openPortal = (p) => {
    if (user && (user.role === p.role || user.role === 'ADMIN')) navigate(p.path);
    else navigate('/login');
  };

  const liveStats = [
    { icon: Activity, value: stats?.active_reports ?? 28, label: 'Active reports', trend: '+12%', tone: 'text-lime-300' },
    { icon: CheckCircle2, value: stats?.resolved_reports ?? stats?.resolved_reports_count ?? 142, label: 'Resolved', trend: '+9%', tone: 'text-leaf-300' },
    { icon: Users, value: stats?.active_workers ?? 8, label: 'Field workers', trend: 'on duty', tone: 'text-cyan-300' },
    { icon: BarChart3, value: stats?.resolution_rate ?? 88.5, suffix: '%', label: 'Resolution rate', trend: '+2.4', tone: 'text-sky-300' },
  ];

  const cards = [
    {
      title: 'Wards we serve', img: '/hero-crew.jpg',
      alt: 'Sanitation worker loading segregated recyclables into a collection truck',
      desc: 'Five pilot wards share one cleanliness index, one hotline and one verified cleanup trail.',
      chips: ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5'],
      cta: 'Open the city map', to: '/public',
    },
    {
      title: 'On-demand pickups', img: '/crew-team.jpg',
      alt: 'Sanitation crew beside a truck and colour-coded recycling bins',
      desc: 'Bulk or missed collection? Schedule a pickup and watch the assigned crew move through the route.',
      cta: 'Request a pickup', to: user ? '/citizen' : '/login',
    },
    {
      title: 'Explainable scoring', art: 'score',
      desc: 'No black box: hazard, recurrence, age, density and sensitive context are all shown as numbers.',
      cta: 'See the live numbers', to: '/public',
    },
    {
      title: 'Citizen verified', stars: true,
      desc: '“The crew came the same afternoon and sent me the before/after proof to confirm.” — pilot resident',
      cta: 'Know your waste', to: '/awareness',
    },
  ];

  return (
    <div className="grain relative isolate -mt-16 overflow-hidden bg-ink-950 text-white">
      {/* ============================================================
          HERO — dark forest-green stage with crew photography
          ============================================================ */}
      <section ref={heroRef} className="relative isolate overflow-hidden">
        <motion.div style={{ y: photoY }} className="absolute inset-0 -z-10" aria-hidden="true">
          <img
            src="/hero-crew.jpg"
            alt=""
            className="h-full w-full object-cover object-center opacity-45"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(100deg,#06120D 0%,rgba(6,18,13,.96) 34%,rgba(6,18,13,.86) 58%,rgba(6,18,13,.58) 100%)',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent to-ink-950" />
        </motion.div>

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-[6.5rem] sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pb-24 lg:pt-32">
          {/* ---- copy ---- */}
          <motion.div style={{ y: heroTextY }} className="lg:col-span-7">
            <Reveal delay={0}>
              <span className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-lime-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-400" />
                </span>
                #1 civic sanitation platform
              </span>
            </Reveal>

            <div className="mt-7">
              <HeroHeadline />
            </div>

            <Reveal delay={0.5}>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                SwachDrishti closes the loop between citizens, field sanitation teams, supervisors and city
                administrators — with explainable priority scoring, recurring hotspot detection and
                verifiable cleanup proofs.
              </p>
            </Reveal>

            <Reveal delay={0.62}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button onClick={() => navigate(user ? '/citizen' : '/login')} className="btn-primary">
                  {user ? 'Go to my dashboard' : 'Report an issue'}
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
                <button onClick={() => navigate('/public')} className="btn-white">
                  <Play className="h-4 w-4" strokeWidth={2} /> Watch live transparency
                </button>
                <button onClick={() => navigate('/login')} className="btn text-white/75 hover:text-white">
                  Sign in / Create account
                </button>
              </div>
            </Reveal>

            {/* trust badges */}
            <Reveal delay={0.74}>
              <ul className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {TRUST.map((t) => (
                  <li key={t.label} className="flex items-center gap-2.5 text-sm font-semibold text-slate-200">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lime-400/15 text-lime-300 ring-1 ring-lime-400/30">
                      <t.icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    {t.label}
                  </li>
                ))}
              </ul>
            </Reveal>
          </motion.div>

          {/* ---- photo frame ---- */}
          <div className="relative lg:col-span-5">
            <Reveal delay={0.4} className="relative">
              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 shadow-dark-soft">
                <img
                  src="/crew-team.jpg"
                  alt="Sanitation crew working beside a collection truck and colour-coded recycling bins"
                  className="h-[300px] w-full object-cover object-center sm:h-[380px] lg:h-[440px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-ink-950/25" />

                <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-ink-950/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-xl">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-leaf-400" />
                  </span>
                  Live · Ward 4 route
                </span>

                <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-2xl border border-white/15 bg-ink-950/70 px-4 py-3 backdrop-blur-xl">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-lime-400/15 text-lime-300 ring-1 ring-lime-400/30">
                    <Route className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-white">Priority-weighted route</span>
                    <span className="mono block text-xs text-white/60">8 stops · 4.2h median</span>
                  </span>
                </div>
              </div>

              <VerifiedCard className="absolute -left-6 bottom-16 hidden w-64 xl:block" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          LIVE STATS + CAPABILITY MARQUEE
          ============================================================ */}
      <section className="relative border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-7 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
          {liveStats.map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 0.06}
              className={`flex items-start gap-3 md:px-5 ${i % 2 === 1 ? 'pl-4 md:pl-5' : ''} ${i > 0 ? 'md:border-l md:border-white/10' : ''}`}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.07] text-white/70 ring-1 ring-white/10">
                <s.icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <div className={`stat-number text-2xl font-semibold leading-none sm:text-3xl ${s.tone}`}>
                  <CountUp value={s.value} duration={1.5} decimals={s.suffix ? 1 : 0} suffix={s.suffix || ''} />
                </div>
                <div className="mt-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">
                  {s.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative bg-ink-950 py-8">
        <div className="mx-auto mb-4 max-w-7xl px-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/55 sm:px-6 lg:px-8">
          One platform, twelve capabilities
        </div>
        <Marquee speed={44} className="[mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
          {CAPABILITIES.map((c) => (
            <span
              key={c}
              className="flex items-center gap-3 whitespace-nowrap font-display text-xl font-bold tracking-tight text-white/50 sm:text-2xl"
            >
              {c}
              <span className="h-1.5 w-1.5 rounded-full bg-lime-400/70" />
            </span>
          ))}
        </Marquee>
      </section>

      {/* ============================================================
          SERVICES — light paper, white cards with circular icons
          ============================================================ */}
      <section className="relative bg-paper py-20 sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-topo opacity-70" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead
            tone="light"
            kicker="What we do"
            title={
              <>
                One platform. Four <span className="text-leaf-600">mission controls.</span>
              </>
            }
            sub="Residents, crews, supervisors and city hall each sign into their own workspace — but they all read the same map, the same scores and the same proof."
          />

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PORTALS.map((p, i) => (
              <Reveal key={p.role} delay={i * 0.07} className="h-full">
                <Tilt max={6} className="h-full">
                  <button
                    onClick={() => openPortal(p)}
                    className="card card-hover group flex h-full w-full flex-col rounded-3xl p-6 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-500"
                  >
                    <span className={`grid h-14 w-14 place-items-center rounded-full ring-2 ${p.tint}`}>
                      <p.icon className="h-6 w-6" strokeWidth={1.75} />
                    </span>
                    <span className={`mt-5 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${p.chip}`}>
                      {p.role}
                    </span>
                    <span className="h-card mt-3 text-xl font-bold text-ink-900">{p.title}</span>
                    <span className="mt-2 text-sm leading-relaxed text-slate-600">{p.desc}</span>
                    <span className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {p.meta}
                    </span>
                    <span className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-bold text-leaf-700 transition-all duration-200 group-hover:gap-2.5">
                      Open workspace <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    </span>
                  </button>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          WHY CHOOSE US — photo + feature grid
          ============================================================ */}
      <section className="relative border-t border-black/[0.06] bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHead
                tone="light"
                kicker="Why choose SwachDrishti"
                title={
                  <>
                    Simple process.<br />
                    <span className="text-leaf-600">Stress-free cleanup.</span>
                  </>
                }
                sub="One shutter press starts a chain of events the whole city can watch: triage, scoring, dispatch, evidence and a citizen sign-off before anything is archived."
              />

              <Reveal delay={0.1}>
                <ul className="mt-7 space-y-3">
                  {[
                    'Photo, GPS and AI triage captured in under a minute.',
                    'Every priority score shows its five weighted factors.',
                    'Before/after evidence reviewed before a task closes.',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-leaf-600" strokeWidth={2} />
                      {t}
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={0.16}>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button onClick={() => navigate('/public')} className="btn-dark">
                    See it on the live map <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <button onClick={() => navigate('/awareness')} className="btn-outline">
                    Know your waste
                  </button>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.12}>
              <div className="relative">
                <div className="overflow-hidden rounded-[2rem] border border-black/[0.06] shadow-lift">
                  <img
                    src="/hero-crew.jpg"
                    alt="Sanitation worker loading segregated recyclables into a green collection truck"
                    loading="lazy"
                    decoding="async"
                    className="h-[280px] w-full object-cover object-center sm:h-[360px] lg:h-[440px]"
                  />
                </div>

                <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/90 px-3 py-1.5 text-xs font-bold text-ink-900 shadow-soft backdrop-blur-xl">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" strokeWidth={1.5} />
                  4.9 resident rating
                </span>

                <div className="absolute inset-x-4 bottom-4 flex items-center gap-4 rounded-2xl border border-white/15 bg-ink-950/80 px-4 py-3 shadow-dark-soft backdrop-blur-xl sm:inset-x-auto sm:left-5 sm:w-80">
                  <span className="stat-number text-3xl font-semibold leading-none text-lime-300">
                    <CountUp value={4.2} decimals={1} suffix="h" duration={1.6} />
                  </span>
                  <span className="text-xs font-semibold uppercase leading-snug tracking-[0.1em] text-white/70">
                    Median turnaround<br />
                    <span className="text-white/50">report → verified closure</span>
                  </span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* feature row */}
          <motion.div
            className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer(0, 0.07)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '0px 0px -80px 0px' }}
          >
            {FEATURES.map((f) => (
              <motion.div key={f.title} variants={fadeUp(18, 0.55)} className="h-full">
                <div className="card card-hover group flex h-full flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ring-2 ${f.tint}`}>
                      <f.icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="rounded-full border border-black/[0.06] bg-paper-2 px-3 py-1 text-xs font-semibold text-slate-600">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="h-card mt-4 text-lg font-bold text-ink-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
                  {f.art && <FeatureArt kind={f.art} />}
                  <span className="mt-auto flex items-center gap-1.5 pt-5 text-xs font-bold uppercase tracking-[0.12em] text-leaf-700 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    In every workspace <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS
          ============================================================ */}
      <section className="relative overflow-hidden bg-paper py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead
            tone="light"
            center
            kicker="The SwachDrishti core loop"
            title="From citizen lens to city strategy"
            sub="Seven steps, every one of them logged, scored and open to inspection."
          />

          <div className="relative mt-14">
            <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px lg:block">
              <motion.div
                className="h-px origin-left bg-gradient-to-r from-leaf-500/70 via-lime-500/60 to-transparent"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-7 lg:gap-4">
              {LOOP.map((s, idx) => (
                <Reveal key={s.step} delay={idx * 0.06}>
                  <div className="group relative flex gap-4 lg:block">
                    <div className="relative z-[1] grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-leaf-200 bg-white shadow-soft transition-all duration-300 group-hover:-translate-y-1 group-hover:border-leaf-500 group-hover:shadow-lift lg:mx-auto">
                      <span className="mono absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-leaf-600 text-xs font-bold text-white">
                        {idx + 1}
                      </span>
                      <Route className="h-5 w-5 text-leaf-600" strokeWidth={1.75} />
                    </div>
                    <div className="lg:mt-4 lg:text-center">
                      <div className="font-display text-base font-bold text-ink-900">{s.step}</div>
                      <div className="mt-1 text-xs leading-relaxed text-slate-600 lg:mt-1.5">{s.desc}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* supporting trio */}
          <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { icon: MapPin, title: 'Live ward map', desc: 'Every report, pickup and hotspot pinned with status colors.' },
              { icon: Truck, title: 'Crew accountability', desc: 'Before/after photo evidence on every completed job.' },
              { icon: RefreshCw, title: 'Reopen power', desc: 'Citizens can re-escalate incomplete cleanups anytime.' },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 0.07}>
                <div className="card card-hover flex h-full gap-4 rounded-3xl p-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-leaf-100 text-leaf-700 ring-2 ring-leaf-200">
                    <f.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <div className="font-display text-sm font-bold text-ink-900">{f.title}</div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-600">{f.desc}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          DARK CTA BAND with photography
          ============================================================ */}
      <section className="relative isolate overflow-hidden bg-ink-900">
        <div className="absolute inset-0 -z-10" aria-hidden="true">
          <img src="/crew-team.jpg" alt="" loading="lazy" decoding="async" className="h-full w-full object-cover object-right opacity-35" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(95deg,#0B1F17 0%,rgba(11,31,23,.97) 42%,rgba(11,31,23,.78) 72%,rgba(11,31,23,.45) 100%)',
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-2xl">
            <Reveal>
              <span className="eyebrow-dark">Need it gone today?</span>
              <h2 className="h-section mt-4 text-white">
                See a dump? <span className="text-lime-400">Report it in 60 seconds.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Open the camera, drop the pin, and the nearest crew is dispatched on a priority-weighted
                route. You get the before/after proof the same day.
              </p>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button onClick={() => navigate(user ? '/citizen' : '/login')} className="btn-primary">
                  Report an issue <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
                <button onClick={() => navigate('/public')} className="btn-white">
                  View the live map
                </button>
                <button onClick={() => navigate('/awareness')} className="btn text-white/75 hover:text-white">
                  Learn segregation
                </button>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-white/60">
                {['Photo + GPS capture', 'AI duplicate check', 'Same-day verification'].map((t) => (
                  <span key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-lime-400" strokeWidth={2} />
                    {t}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          FOUR PROOF CARDS
          ============================================================ */}
      <section className="relative bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead
            tone="light"
            center
            kicker="Proof, not promises"
            title="Everything you'd want to check before you trust a city app"
          />

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.07} className="h-full">
                <div className="card card-hover group flex h-full flex-col overflow-hidden">
                  {c.img && (
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={c.img}
                        alt={c.alt}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 ease-out-expo group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/55 to-transparent" />
                    </div>
                  )}
                  {!c.img && c.art && (
                    <div className="relative bg-paper-2 px-5 pt-5">
                      <FeatureArt kind={c.art} />
                    </div>
                  )}
                  {!c.img && !c.art && (
                    <div className="relative h-44 bg-leaf-50 px-5 pt-5">
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2, 3, 4].map((n) => (
                          <Star key={n} className="h-5 w-5 fill-amber-400 text-amber-500" strokeWidth={1.5} />
                        ))}
                        <span className="mono ml-1 text-sm font-semibold text-ink-800">4.9</span>
                      </div>
                      <div className="mt-4 space-y-2">
                        {['Verified closures', 'Crew punctuality', 'App ease of use'].map((l, n) => (
                          <div key={l} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-leaf-500" />
                            {l}
                            <span className="mono ml-auto text-slate-500">{[96, 92, 89][n]}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="h-card text-lg font-bold text-ink-900">{c.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.desc}</p>
                    {c.chips && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {c.chips.map((w) => (
                          <span key={w} className="rounded-full bg-paper-2 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-black/[0.05]">
                            {w}
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => navigate(c.to)}
                      className="mt-auto flex items-center gap-1.5 pt-5 text-left text-sm font-bold text-leaf-700 transition-all duration-200 group-hover:gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-500"
                    >
                      {c.cta} <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          IMPACT BAND + QUOTE
          ============================================================ */}
      <section className="relative border-t border-white/10 bg-gradient-to-b from-ink-900 to-ink-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              { value: 1420, suffix: '+', label: 'Reports triaged' },
              { value: 94, suffix: '%', label: 'Citizen-verified closures' },
              { value: 4.2, suffix: 'h', label: 'Median turnaround', decimals: 1 },
              { value: 5, suffix: '', label: 'Wards covered' },
            ].map((n, i) => (
              <Reveal key={n.label} delay={i * 0.07}>
                <div className="border-l border-lime-400/40 pl-5">
                  <div className="stat-number text-4xl font-semibold leading-none text-lime-300 sm:text-5xl">
                    <CountUp value={n.value} decimals={n.decimals || 0} suffix={n.suffix} />
                  </div>
                  <div className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/60">
                    {n.label}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15}>
            <figure className="relative mx-auto mt-16 max-w-3xl text-center">
              <Quote className="mx-auto h-8 w-8 text-lime-400/60" strokeWidth={1.5} />
              <blockquote className="mt-5 font-display text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl">
                “Why it matters: a missed heap is not a small thing — it is a signal nobody was
                watching. Making the signal visible is how a city starts caring again.”
              </blockquote>
              <figcaption className="mt-5 text-sm text-slate-400">
                — Ward sanitation lead, pilot deployment
              </figcaption>
            </figure>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => navigate(user ? '/citizen' : '/login')} className="btn-primary">
                Start reporting <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </button>
              <button onClick={() => navigate('/awareness')} className="btn-ghost">
                Take the waste quiz
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
