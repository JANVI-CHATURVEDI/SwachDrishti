import React, { useState } from 'react';
import api from '../api/client';
import { UserPlus, AlertCircle, CheckCircle2, HardHat, Compass } from 'lucide-react';

const ZONES = ['Zone 1 - Central', 'Zone 2 - South', 'Zone 3 - East', 'Zone 4 - West', 'Zone 5 - North'];

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export default function StaffCreator({ onCreated, allowSupervisorRole = false }) {
  const [form, setForm] = useState({
    username: '', password: '', first_name: '', last_name: '',
    email: '', phone: '', zone: ZONES[0], role: 'WORKER',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setOk('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setOk('');
    try {
      const res = await api.post('/api/auth/staff/', form);
      setOk(`${res.data.user.username} joined as ${res.data.user.role} — live in the Crew Workload Roster.`);
      setForm({
        username: '', password: '', first_name: '', last_name: '',
        email: '', phone: '', zone: ZONES[0], role: 'WORKER',
      });
      if (onCreated) onCreated(res.data.user);
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === 'string' ? data
        : data?.username?.[0] || data?.password?.[0] || data?.role?.[0]
        || data?.email?.[0] || data?.detail || 'Could not create the account.'
      );
    } finally {
      setBusy(false);
    }
  };

  const roles = allowSupervisorRole
    ? [
        { id: 'WORKER', label: 'Sanitation Worker', icon: HardHat, hint: 'Route + proofs' },
        { id: 'SUPERVISOR', label: 'Supervisor', icon: Compass, hint: 'Dispatch + audit' },
      ]
    : [{ id: 'WORKER', label: 'Sanitation Worker', icon: HardHat, hint: 'Route + proofs' }];

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {ok && (
        <div className="flex items-start gap-2 rounded-xl border border-leaf-200 bg-leaf-50 p-3 text-xs font-semibold text-leaf-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {ok}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First name">
          <input placeholder="Ramesh" value={form.first_name} onChange={set('first_name')} className="input" />
        </Field>
        <Field label="Last name">
          <input placeholder="Kumar" value={form.last_name} onChange={set('last_name')} className="input" />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Username (login id)">
          <input
            placeholder="worker01"
            value={form.username}
            onChange={set('username')}
            className="input"
            required
            autoComplete="off"
          />
        </Field>
        <Field label="Password (min 8 chars)">
          <input
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
            className="input"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email (optional)">
          <input type="email" placeholder="crew@city.gov" value={form.email} onChange={set('email')} className="input" />
        </Field>
        <Field label="Phone">
          <input placeholder="+919876543210" value={form.phone} onChange={set('phone')} className="input" />
        </Field>
      </div>

      <Field label="Zone">
        <select value={form.zone} onChange={set('zone')} className="input">
          {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
        </select>
      </Field>

      <div>
        <span className="mb-1.5 block text-xs font-semibold text-slate-600">Role</span>
        <div className={`grid gap-2 rounded-2xl bg-paper-2 p-1 ring-1 ring-black/[0.05] ${roles.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {roles.map((r) => {
            const active = form.role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => { setForm(f => ({ ...f, role: r.id })); setOk(''); }}
                aria-pressed={active}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200
                  ${active
                    ? 'bg-white text-ink-900 shadow-soft ring-1 ring-black/[0.06]'
                    : 'text-slate-500 hover:text-ink-800'}`}
              >
                <r.icon className="h-4 w-4" strokeWidth={1.75} />
                <span className="truncate">{r.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          {roles.find(r => r.id === form.role)?.hint}
        </p>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="btn-dark w-full"
      >
        <UserPlus className="h-4 w-4" strokeWidth={1.75} />
        {busy ? 'Creating…' : `Create ${form.role === 'SUPERVISOR' ? 'supervisor' : 'worker'} account`}
      </button>
    </form>
  );
}
