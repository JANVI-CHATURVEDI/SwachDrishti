import React, { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Save, AlertCircle, CheckCircle2, BellRing, Award } from 'lucide-react';

const ZONES = ['Zone 1 - Central', 'Zone 2 - South', 'Zone 3 - East', 'Zone 4 - West', 'Zone 5 - North'];

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    zone: user?.zone || ZONES[0],
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
      const res = await api.patch('/api/auth/me/', {
        ...form,
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      setUser(res.data.user);
      setOk(res.data.message || 'Profile updated.');
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === 'string' ? data
        : data?.email?.[0] || data?.detail || 'Could not save. Check the email format.'
      );
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'input';

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div>
        <div className="eyebrow">Account</div>
        <h1 className="h-section mt-2 text-ink-950">Profile &amp; notifications</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
          Report receipts, verification requests, pickup updates and dispatches reach you on the email below.
        </p>
      </div>

      <div className="card p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-black/[0.05] pb-4">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-lime-400 to-leaf-500 text-lg font-extrabold text-ink-950 shadow-glow ring-1 ring-white">
            {((form.first_name || user?.username) || 'U')[0].toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="h-card truncate text-sm text-ink-900">@{user?.username}</div>
            <div className="text-xs font-bold uppercase tracking-wide text-leaf-700">{user?.role}</div>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-leaf-200 bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-800">
            <Award className="h-3.5 w-3.5" strokeWidth={1.75} /> {user?.impact_points ?? 0} pts
          </span>
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}
          {ok && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> {ok}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">First name</label>
              <input value={form.first_name} onChange={set('first_name')} className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Last name</label>
              <input value={form.last_name} onChange={set('last_name')} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Email for alerts <span className="text-rose-500">*</span>
            </label>
            <input type="email" required value={form.email} onChange={set('email')} className={inputCls} autoComplete="email" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Phone for SMS</label>
              <input value={form.phone} onChange={set('phone')} placeholder="+919876543210" className={inputCls} autoComplete="tel" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Ward zone</label>
              <select value={form.zone} onChange={set('zone')} className={inputCls}>
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-xs font-semibold">
            <BellRing className="w-4 h-4 shrink-0 mt-0.5" />
            Dispatch pings, verification requests and the bell inbox all follow this address. Role and login id can only be changed by an administrator.
          </div>

          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full"
          >
            <Save className="w-4 h-4" /> {busy ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
