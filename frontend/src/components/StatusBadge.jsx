import React from 'react';

const statusConfigs = {
  REPORTED: { label: 'Reported', cls: 'text-amber-700 bg-amber-500/10 ring-amber-500/25', dot: 'bg-amber-500' },
  VERIFIED: { label: 'Verified', cls: 'text-blue-700 bg-blue-500/10 ring-blue-500/25', dot: 'bg-blue-500' },
  ASSIGNED: { label: 'Assigned', cls: 'text-indigo-700 bg-indigo-500/10 ring-indigo-500/25', dot: 'bg-indigo-500' },
  IN_PROGRESS: { label: 'In Progress', cls: 'text-sky-700 bg-sky-500/10 ring-sky-500/25', dot: 'bg-sky-500', pulse: true },
  RESOLVED: { label: 'Resolved (Pending Verification)', cls: 'text-leaf-700 bg-leaf-500/10 ring-leaf-500/25', dot: 'bg-leaf-500' },
  CITIZEN_VERIFIED: { label: 'Citizen Verified ✓', cls: 'text-leaf-800 bg-leaf-500/15 ring-leaf-500/35', dot: 'bg-leaf-600' },
  REOPENED: { label: 'Reopened', cls: 'text-rose-700 bg-rose-500/10 ring-rose-500/25', dot: 'bg-rose-500', pulse: true },
  REQUESTED: { label: 'Requested', cls: 'text-ink-700 bg-ink-900/[0.06] ring-black/10', dot: 'bg-ink-600' },
  SCHEDULED: { label: 'Scheduled', cls: 'text-purple-700 bg-purple-500/10 ring-purple-500/25', dot: 'bg-purple-500' },
  COLLECTED: { label: 'Collected', cls: 'text-leaf-700 bg-leaf-500/10 ring-leaf-500/25', dot: 'bg-leaf-500' },
  // Task / pickup lifecycle values used by operations endpoints
  COMPLETED: { label: 'Completed', cls: 'text-leaf-700 bg-leaf-500/10 ring-leaf-500/25', dot: 'bg-leaf-500' },
};

export default function StatusBadge({ status }) {
  const norm = (status || 'REPORTED').toUpperCase();
  const config = statusConfigs[norm] || {
    label: status,
    cls: 'text-slate-600 bg-slate-500/10 ring-slate-400/25',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex max-w-[16rem] items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${config.cls}`}
    >
      <span className={`relative h-1.5 w-1.5 shrink-0 rounded-full ${config.dot}`}>
        {config.pulse && (
          <span className={`absolute inset-0 rounded-full ${config.dot} animate-ping opacity-75`} />
        )}
      </span>
      <span className="truncate">{config.label}</span>
    </span>
  );
}
