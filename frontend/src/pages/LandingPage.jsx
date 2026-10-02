import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Eye, Shield, Users, BarChart3, ArrowRight, CheckCircle2, Sparkles,
  MapPin, Truck, RefreshCw, User, HardHat, Compass, Activity,
  ScanEye, Radar, BadgeCheck, Zap, Route, ArrowUpRight, Quote, Play,
} from 'lucide-react';
import { Reveal, CountUp, Marquee, SpotlightCard, Tilt, staggerContainer, fadeUp } from '../components/motion';

const PORTALS = [
  {
    role: 'CITIZEN', path: '/citizen', icon: User,
    title: 'Citizen', desc: 'Report dumps with photo + GPS, track status live, verify cleanups.',
    tint: 'from-leaf-400 to-leaf-600', chip: 'bg-leaf-500/15 text-leaf-300 ring-leaf-400/30',
  },
  {
    role: 'WORKER', path: '/worker', icon: HardHat,
    title: 'Field Worker', desc: 'Daily route, task proof uploads, AI-verified completions.',
    tint: 'from-cyan-400 to-teal-600', chip: 'bg-cyan-400/15 text-cyan-200 ring-cyan-400/30',
  },
  {
    role: 'SUPERVISOR', path: '/supervisor', icon: Compass,
    title: 'Supervisor', desc: 'Dispatch crew, audit before/after evidence, manage roster.',
    tint: 'from-indigo-400 to-blue-600', chip: 'bg-indigo-400/15 text-indigo-200 ring-indigo-400/30',
  },
  {
    role: 'ADMIN', path: '/admin', icon: Shield,
    title: 'Administrator', desc: 'City KPIs, hotspot forecast, staff onboarding, NL search.',
    tint: 'from-lime-300 to-leaf-500', chip: 'bg-lime-400/15 text-lime-200 ring-lime-400/30',
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
    desc: 'AI-assisted categorization, duplicate detection and a pinpoint geolocation picker. Drafts are remembered locally so a flaky network never loses a report.',
    span: 'md:col-span-7 md:row-span-2', tone: 'from-leaf-400 to-leaf-600', art: 'map',
  },
  {
    icon: BadgeCheck, title: 'Explainable Priority', tag: 'Decide',
    desc: 'Every score is a readable chain of five weighted factors — density, age, sensitive context, severity and hotspot recurrence.',
    span: 'md:col-span-5', tone: 'from-lime-300 to-lime-500', art: 'score',
  },
  {
    icon: Radar, title: 'Hotspot AI', tag: 'Predict',
    desc: 'Recurring dump sites are clustered automatically into persistent hotspots with targeted operational advice.',
    span: 'md:col-span-5', tone: 'from-rose-400 to-rose-600', art: 'rings',
  },
  {
    icon: Users, title: 'Citizen Verification', tag: 'Close the loop',
    desc: 'Residents confirm the cleanup before a task is archived — or reopen it in one tap.',
    span: 'md:col-span-4', tone: 'from-sky-400 to-blue-600',
  },
  {
    icon: Sparkles, title: 'AI Vision', tag: 'Audit',
    desc: 'Before/after photographs are compared by a vision model into a 0–100 cleanup score with a written verdict.',
    span: 'md:col-span-4', tone: 'from-violet-400 to-purple-600',
  },
  {
    icon: Zap, title: 'Gamified Impact', tag: 'Reward',
    desc: 'Points, streaks and gradient medals keep citizens and crews coming back to the same mission.',
    span: 'md:col-span-4', tone: 'from-amber-300 to-amber-500',
  },
];

const CAPABILITIES = [
  'AI Triage', 'Hotspot Forecasting', 'Before / After Verification', 'Explainable Priority',
  'Citizen Audit', 'Crew Dispatch', 'Live Ward Map', 'Semantic Search', 'Cleanliness Index',
  'Zero-PII Design', 'On-demand Pickups', 'Reopen Power',
];

const HEADLINE = ['See', 'the', 'waste.', 'Spark', 'the', 'action.'];
const HIGHLIGHT_FROM = 3; // "Spark the action." gets the gradient

function HeroHeadline() {
  const reduced = useReducedMotion();
  return (
    <h1 className="h-display max-w-5xl text-white">
      {HEADLINE.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          className={`inline-block ${i >= HIGHLIGHT_FROM ? 'bg-gradient-to-r from-lime-300 via-lime-400 to-leaf-400 bg-clip-text text-transparent' : ''}`}
          initial={reduced ? undefined : { opacity: 0, y: 26, filter: 'blur(6px)' }}
          animate={reduced ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
        >
          {w}
          {i < HEADLINE.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </h1>
  );
}

/* ---------- floating product mockups ---------- */

function MiniMapCard({ className = '' }) {
  return (
    <div className={`glass rounded-3xl p-4 shadow-dark-soft ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-lime-300">Live ward map</span>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-white/60">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-leaf-400" />
          </span>
          Live
        </span>
      </div>
      <div
        className="mt-3 h-36 rounded-2xl border border-white/10 bg-ink-900/70"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,.12) 1px, transparent 0)',
          backgroundSize: '16px 16px',
        }}
      >
        <svg viewBox="0 0 240 144" className="h-full w-full" aria-hidden="true">
          <path d="M18 118 L62 92 L96 100 L134 58 L184 66 L222 30" fill="none" stroke="#BEF264" strokeWidth="2.5" strokeDasharray="7 7" strokeLinecap="round" opacity=".85" />
          <circle cx="62" cy="92" r="4" fill="#F43F5E" />
          <circle cx="134" cy="58" r="4" fill="#F59E0B" />
          <circle cx="222" cy="30" r="4" fill="#10B981" />
        </svg>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
        <Route className="h-3.5 w-3.5 text-lime-300" />
        <span className="mono">Priority-weighted route · 8 stops</span>
      </div>
    </div>
  );
}

function ScoreCard({ className = '' }) {
  const pct = 87;
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className={`glass rounded-3xl p-4 shadow-dark-soft ${className}`}>
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">Priority score</span>
      <div className="mt-2 flex items-center gap-3">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
            <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="7" />
            <motion.circle
              cx="40" cy="40" r={r} fill="none" stroke="url(#heroScore)" strokeWidth="7" strokeLinecap="round"
              strokeDasharray={`${c} ${c}`}
              initial={{ strokeDashoffset: c }}
              whileInView={{ strokeDashoffset: c - (pct / 100) * c }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
            />
            <defs>
              <linearGradient id="heroScore" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#BEF264" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </svg>
          <span className="mono absolute inset-0 grid place-items-center text-lg font-semibold text-white">
            <CountUp value={pct} duration={1.6} />
          </span>
        </div>
        <ul className="space-y-1.5 text-xs text-white/70">
          <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Hazard context</li>
          <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Recurring hotspot</li>
          <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-leaf-400" /> Cleared in 3.4h</li>
        </ul>
      </div>
    </div>
  );
}

function AiCard({ className = '' }) {
  return (
    <div className={`glass rounded-3xl p-4 shadow-dark-soft ${className}`}>
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-lime-300 to-leaf-500 text-ink-950">
          <Sparkles className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-bold leading-tight text-white">Cleanup verified</div>
          <div className="text-xs text-white/50">Vision model · before/after</div>
        </div>
        <span className="mono ml-auto text-2xl font-semibold text-lime-300">
          <CountUp value={94} duration={1.6} /><span className="text-sm text-white/50">/100</span>
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-lime-300 to-leaf-400"
          initial={{ width: 0 }}
          whileInView={{ width: '94%' }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-white/60 italic">
        “Surface cleared, no residual waste visible along the kerb line.”
      </p>
    </div>
  );
}

/* ---------- bento artwork ---------- */

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
          Zone 3 · <span className="mono text-rose-600">2 critical</span>
        </div>
      </div>
    );
  }
  if (kind === 'score') {
    return (
      <div className="mt-5 space-y-2">
        {[['Hazard', 92, 'bg-rose-500'], ['Recurrence', 76, 'bg-amber-500'], ['Age', 54, 'bg-blue-500'], ['Density', 38, 'bg-leaf-500']].map(([l, w, c]) => (
          <div key={l} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs font-semibold text-slate-500">{l}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
              <motion.span
                className={`block h-full rounded-full ${c}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${w}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              />
            </span>
            <span className="mono w-8 text-right text-xs text-slate-500">{w}</span>
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'rings') {
    return (
      <div className="relative mt-5 h-32 overflow-hidden rounded-2xl border border-rose-200/60 bg-gradient-to-br from-rose-50 to-white">
        <span className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-rose-400 bg-rose-500/10" />
        <span className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/20" />
        <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500 shadow-glow" />
        <span className="absolute right-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-rose-600 shadow-soft ring-1 ring-rose-200">
          +38% trend
        </span>
      </div>
    );
  }
  return null;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const reduced = useReducedMotion();
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const clusterY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -70]);
  const heroTextY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 40]);

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

  return (
    <div className="grain relative isolate overflow-hidden bg-ink-950 text-white">
      <div className="aurora" aria-hidden="true">
        <span className="aurora-blob-3" />
      </div>

      {/* ============ HERO ============ */}
      <section ref={heroRef} className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <motion.div style={{ y: heroTextY }} className="relative z-10">
          <Reveal delay={0}>
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-lime-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-400" />
              </span>
              Civic Sanitation OS
            </span>
          </Reveal>

          <div className="mt-7">
            <HeroHeadline />
          </div>

          <Reveal delay={0.5}>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              SwachDrishti closes the loop between citizens, field sanitation teams, supervisors and city
              administrators — with explainable priority scoring, recurring hotspot detection and
              verifiable cleanup proofs.
            </p>
          </Reveal>

          <Reveal delay={0.62}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button onClick={() => navigate(user ? '/citizen' : '/login')} className="btn-primary">
                {user ? 'Go to my dashboard' : 'Report an issue'}
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </button>
              <button onClick={() => navigate('/public')} className="btn-ghost">
                <Play className="h-4 w-4" strokeWidth={2} /> Watch live transparency
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn text-white/70 hover:text-white"
              >
                Sign in / Create account
              </button>
            </div>
          </Reveal>
        </motion.div>

        {/* mockup cluster */}
        <motion.div
          style={{ y: clusterY }}
          className="relative z-10 mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-12"
        >
          <Reveal delay={0.7} className="lg:col-span-5 lg:col-start-1">
            <div className="animate-float" style={{ animationDelay: '0s' }}>
              <MiniMapCard />
            </div>
          </Reveal>
          <Reveal delay={0.8} className="lg:col-span-4">
            <div className="animate-float" style={{ animationDelay: '1.4s' }}>
              <ScoreCard />
            </div>
          </Reveal>
          <Reveal delay={0.9} className="sm:col-span-2 lg:col-span-3">
            <div className="animate-float" style={{ animationDelay: '2.6s' }}>
              <AiCard />
            </div>
          </Reveal>
        </motion.div>
      </section>

      {/* ============ LIVE STATS ============ */}
      <section className="relative mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {liveStats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.07}>
              <div className="glass group rounded-3xl p-5 transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:border-white/20 hover:shadow-dark-soft">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.08] text-white/70">
                    <s.icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className="mono rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-semibold text-white/60">
                    {s.trend}
                  </span>
                </div>
                <div className={`stat-number mt-4 text-3xl font-semibold leading-none sm:text-4xl ${s.tone}`}>
                  <CountUp value={s.value} duration={1.5} decimals={s.suffix ? 1 : 0} suffix={s.suffix || ''} />
                </div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
                  {s.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ MARQUEE ============ */}
      <section className="relative py-14">
        <div className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
          One platform, twelve capabilities
        </div>
        <Marquee speed={44} className="[mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
          {CAPABILITIES.map((c) => (
            <span
              key={c}
              className="flex items-center gap-3 whitespace-nowrap font-display text-2xl font-bold tracking-tight text-white/35 sm:text-3xl"
            >
              {c}
              <span className="h-1.5 w-1.5 rounded-full bg-lime-400/70" />
            </span>
          ))}
        </Marquee>
      </section>

      {/* ============ BENTO ============ */}
      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-10 max-w-3xl">
            <span className="eyebrow-dark">Everything the city needs</span>
            <h2 className="h-section mt-3 text-white">
              Six systems that turn a photo into a{' '}
              <span className="bg-gradient-to-r from-lime-300 to-leaf-400 bg-clip-text text-transparent">
                closed loop
              </span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
              From the moment a resident taps the shutter to the day a supervisor signs off on the
              proof — every step is scored, logged and open to inspection.
            </p>
          </div>
        </Reveal>

        <motion.div
          className="grid grid-cols-1 gap-4 md:grid-cols-12 md:auto-rows-fr"
          variants={staggerContainer(0, 0.08)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '0px 0px -80px 0px' }}
        >
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={fadeUp(18, 0.55)} className={f.span}>
              <SpotlightCard className="group flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:border-white/20 hover:shadow-dark-soft">
                <div className="relative z-[1] flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${f.tone} text-ink-950 shadow-glow-leaf`}>
                      <f.icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/60">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="h-card mt-4 text-xl font-bold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
                  {f.art && <FeatureArt kind={f.art} />}
                  <div className="mt-auto flex items-center gap-1.5 pt-5 text-xs font-bold text-lime-300 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    See it in your workspace <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="relative overflow-hidden border-y border-white/10 bg-white/[0.03] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="eyebrow-dark">The SwachDrishti core loop</span>
              <h2 className="h-section mt-3 text-white">From citizen lens to city strategy</h2>
            </div>
          </Reveal>

          <div className="relative">
            {/* drawing line (desktop) */}
            <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px lg:block">
              <motion.div
                className="h-px origin-left bg-gradient-to-r from-lime-400/70 via-leaf-400/70 to-transparent"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-7 lg:gap-4">
              {LOOP.map((s, idx) => (
                <Reveal key={s.step} delay={idx * 0.08}>
                  <div className="group relative flex gap-4 lg:block">
                    <div className="relative z-[1] grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/10 bg-ink-900 shadow-dark-soft transition-all duration-300 group-hover:-translate-y-1 group-hover:border-lime-400/50 group-hover:shadow-glow lg:mx-auto">
                      <span className="mono absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-lime-400 text-xs font-bold text-ink-950">
                        {idx + 1}
                      </span>
                      <Route className="h-5 w-5 text-lime-300" strokeWidth={1.75} />
                    </div>
                    <div className="lg:mt-4 lg:text-center">
                      <div className="font-display text-base font-bold text-white">{s.step}</div>
                      <div className="mt-1 text-xs leading-relaxed text-slate-400 lg:mt-1.5">{s.desc}</div>
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
              <Reveal key={f.title} delay={i * 0.08}>
                <div className="flex h-full gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-leaf-500/15 text-leaf-300 ring-1 ring-leaf-400/20">
                    <f.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </span>
                  <div>
                    <div className="font-display text-sm font-bold text-white">{f.title}</div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-400">{f.desc}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ROLE WORKSPACES ============ */}
      <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow-dark">Role workspaces</span>
              <h2 className="h-section mt-3 text-white">One city, four mission controls</h2>
            </div>
            <span className="text-sm text-slate-400">Each role signs into its own guarded dashboard.</span>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PORTALS.map((p, i) => (
            <Reveal key={p.role} delay={i * 0.07}>
              <Tilt max={6} className="h-full">
                <button
                  onClick={() => openPortal(p)}
                  className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-6 text-left backdrop-blur-xl transition-all duration-300 ease-out-expo hover:-translate-y-1.5 hover:border-white/25 hover:shadow-dark-soft"
                >
                  <span className={`pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-gradient-to-br ${p.tint} opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-40`} />
                  <span className={`relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${p.tint} text-ink-950 shadow-glow-leaf`}>
                    <p.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className={`relative mt-4 self-start rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${p.chip}`}>
                    {p.role}
                  </span>
                  <span className="h-card relative mt-3 text-xl font-bold text-white">{p.title}</span>
                  <span className="relative mt-2 text-sm leading-relaxed text-slate-400">{p.desc}</span>
                  <span className="relative mt-5 flex items-center gap-1.5 text-sm font-bold text-lime-300 transition-all group-hover:gap-2.5">
                    Open workspace <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </span>
                </button>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ IMPACT BAND + QUOTE ============ */}
      <section className="relative border-t border-white/10 bg-gradient-to-b from-ink-900/60 to-ink-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              { value: 1420, suffix: '+', label: 'Reports triaged' },
              { value: 94, suffix: '%', label: 'Citizen-verified closures' },
              { value: 4.2, suffix: 'h', label: 'Median turnaround', decimals: 1 },
              { value: 5, suffix: '', label: 'Wards covered' },
            ].map((n, i) => (
              <Reveal key={n.label} delay={i * 0.07}>
                <div className="border-l border-white/10 pl-5">
                  <div className="stat-number text-4xl font-semibold leading-none text-lime-300 sm:text-5xl">
                    <CountUp value={n.value} decimals={n.decimals || 0} suffix={n.suffix} />
                  </div>
                  <div className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
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
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-lime-400 via-lime-300 to-leaf-400 p-8 text-ink-950 shadow-glow sm:p-14">
            <span className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-white/40 blur-3xl" />
            <span className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-leaf-500/40 blur-3xl" />
            <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-ink-900/60">
                  Ready when you are
                </span>
                <h2 className="h-display mt-3 text-[clamp(2.25rem,5vw,4rem)] text-ink-950">
                  See the waste.<br />Spark the action.
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-900/70 sm:text-base">
                  Join your ward's cleanup loop — report in under a minute, watch the crew resolve it,
                  verify the proof.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <button
                  onClick={() => navigate(user ? '/citizen' : '/login')}
                  className="btn bg-ink-950 font-bold text-white shadow-lift hover:bg-ink-900"
                >
                  Start reporting <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
                <button onClick={() => navigate('/awareness')} className="btn border border-ink-950/25 bg-white/50 font-bold text-ink-950 hover:bg-white/80">
                  Learn segregation
                </button>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-8 flex items-center justify-center gap-2.5 text-xs font-semibold text-white/40">
            <Eye className="h-3.5 w-3.5" />
            Open civic data · auditable priority scores · citizen-verified closures
          </div>
        </Reveal>
      </section>
    </div>
  );
}
