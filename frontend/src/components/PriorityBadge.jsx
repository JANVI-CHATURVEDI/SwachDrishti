import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const priorityConfigs = {
  CRITICAL: {
    label: 'Critical Priority',
    cls: 'text-rose-700 bg-rose-500/10 ring-rose-500/30',
    bar: 'bg-rose-500',
    bars: 4,
    glow: 'shadow-[0_0_18px_-4px_rgba(244,63,94,.65)]',
  },
  HIGH: {
    label: 'High Priority',
    cls: 'text-amber-700 bg-amber-500/10 ring-amber-500/30',
    bar: 'bg-amber-500',
    bars: 3,
    glow: '',
  },
  MEDIUM: {
    label: 'Medium Priority',
    cls: 'text-blue-700 bg-blue-500/10 ring-blue-500/30',
    bar: 'bg-blue-500',
    bars: 2,
    glow: '',
  },
  LOW: {
    label: 'Low Priority',
    cls: 'text-slate-600 bg-slate-500/10 ring-slate-400/30',
    bar: 'bg-slate-400',
    bars: 1,
    glow: '',
  },
};

/** Decorative 0-100 weight per factor so the popover can draw a mini bar chart. */
function factorWeight(factor, idx) {
  const text = String(factor || '').toLowerCase();
  let score = 46 + ((text.length * 7) % 17);
  if (/critical|hazard|medical|school|hospital|toxic|blocked|overdue/.test(text)) score += 26;
  if (/recurring|hotspot|repeat|cluster/.test(text)) score += 18;
  if (/age|hours|old|stale/.test(text)) score += 12;
  if (/dense|density|population|traffic/.test(text)) score += 10;
  if (/low|minor|small/.test(text)) score -= 14;
  return Math.max(18, Math.min(98, score - idx * 4));
}

/** Segmented 4-bar "signal strength" indicator. */
function SignalBars({ level, className = '' }) {
  const cfg = priorityConfigs[level] || priorityConfigs.MEDIUM;
  return (
    <span className={`inline-flex h-3.5 w-4 items-end gap-[2px] ${className}`} aria-hidden="true">
      {[0, 1, 2, 3].map((i) => {
        const on = i < cfg.bars;
        return (
          <span
            key={i}
            className={`w-[3px] rounded-full transition-all ${on ? cfg.bar : 'bg-black/15'}`}
            style={{ height: `${(i + 1) * 25}%` }}
          />
        );
      })}
    </span>
  );
}

export default function PriorityBadge({ level = 'MEDIUM', score, factors = [], showDetails = false }) {
  const [expanded, setExpanded] = useState(showDetails && factors.length > 0);
  const norm = (level || 'MEDIUM').toUpperCase();
  const config = priorityConfigs[norm] || priorityConfigs.MEDIUM;
  const toggleable = factors.length > 0;

  const chart = factors
    .map((f, i) => ({ text: f, weight: factorWeight(f, i) }))
    .sort((a, b) => b.weight - a.weight);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={`${config.label}${score !== undefined ? `, score ${score}` : ''}${toggleable ? '. Why this priority?' : ''}`}
        onClick={() => toggleable && setExpanded(!expanded)}
        className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition-all duration-200
          ${config.cls} ${config.glow} ${toggleable ? 'cursor-pointer hover:brightness-95 hover:shadow-soft' : 'cursor-default'}`}
      >
        <SignalBars level={norm} />
        <span>{config.label}</span>
        {score !== undefined && <span className="mono opacity-75">({score})</span>}
        {toggleable && (
          <span className="opacity-60">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </span>
        )}
      </button>

      <AnimatePresence>
        {expanded && toggleable && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 z-30 mt-2 w-72 origin-top-left overflow-hidden rounded-2xl border border-black/10 bg-white/95 p-3.5 shadow-lift backdrop-blur-xl"
            role="tooltip"
          >
            <div className="mb-2.5 flex items-center gap-1.5 border-b border-black/[0.06] pb-2 text-xs font-bold text-ink-900">
              <Sparkles className="h-3.5 w-3.5 text-leaf-600" />
              Why this priority?
              <HelpCircle className="ml-auto h-3.5 w-3.5 text-slate-400" />
            </div>

            <div className="space-y-2">
              {chart.map((f, idx) => (
                <div key={idx}>
                  <div className="flex items-start gap-1.5 text-xs leading-snug text-slate-600">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-leaf-500" />
                    <span>{f.text}</span>
                  </div>
                  <div className="ml-3 mt-1 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                    <div
                      className={`h-full rounded-full ${config.bar}`}
                      style={{ width: `${f.weight}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mono mt-3 flex items-center justify-between border-t border-black/[0.06] pt-2 text-xs text-slate-500">
              <span>Weighted score</span>
              <span className="font-semibold text-ink-900">{score ?? '—'} / 100</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
