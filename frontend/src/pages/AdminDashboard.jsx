import React, { useState, useEffect } from 'react';
import api from '../api/client';
import MapView from '../components/MapView';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import StaffCreator from '../components/StaffCreator';
import { BarChart3, TrendingUp, Sparkles, AlertOctagon, CheckCircle2, ShieldAlert, Search, RefreshCw, Users } from 'lucide-react';
import { Reveal } from '../components/motion';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [cleanliness, setCleanliness] = useState([]);
  const [reports, setReports] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [pickupWorker, setPickupWorker] = useState({});
  const [assigningPickup, setAssigningPickup] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [ovRes, clRes, repRes, hotRes, staffRes, pickRes] = await Promise.all([
        api.get('/api/analytics/overview/').catch(() => ({ data: null })),
        api.get('/api/analytics/cleanliness-index/').catch(() => ({ data: [] })),
        api.get('/api/reports/'),
        api.get('/api/hotspots/'),
        api.get('/api/auth/workers/').catch(() => ({ data: [] })),
        api.get('/api/pickups/').catch(() => ({ data: [] })),
      ]);
      setOverview(ovRes.data);
      setCleanliness(clRes.data?.zones || clRes.data?.results || (Array.isArray(clRes.data) ? clRes.data : []));
      setReports(repRes.data?.results || repRes.data || []);
      setPickups(pickRes.data?.results || pickRes.data || []);
      setHotspots(hotRes.data?.results || hotRes.data || []);
      setStaff(staffRes.data || []);
      setLoading(false);

      const [aiRes, forecastRes] = await Promise.all([
        api.get('/api/ai/insights/').catch(() => ({ data: null })),
        api.get('/api/ai/forecast/').catch(() => ({ data: null })),
      ]);
      setForecast(forecastRes.data);
      setAiInsights(aiRes.data);
    } catch (err) {
      console.error('Admin data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handlePickupAssign = async (pickupId) => {
    const workerId = pickupWorker[pickupId];
    if (!workerId) {
      alert('Choose a worker first.');
      return;
    }
    setAssigningPickup(pickupId);
    try {
      await api.post('/api/operations/assign/', { pickup_id: pickupId, worker_id: workerId });
      const pickRes = await api.get('/api/pickups/').catch(() => ({ data: [] }));
      setPickups(pickRes.data?.results || pickRes.data || []);
    } catch (err) {
      alert('Error assigning pickup: ' + (err.response?.data?.detail || err.message));
    } finally {
      setAssigningPickup(null);
    }
  };

  const refreshStaff = async () => {
    try {
      const res = await api.get('/api/auth/workers/');
      setStaff(res.data || []);
    } catch {}
  };

  const handleNlSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.get(`/api/ai/search/?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data?.results || res.data || []);
    } catch (err) {
      alert('Search failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <Reveal>
        <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-6 shadow-soft sm:p-8 md:flex-row md:items-end">
          <div
            className="pointer-events-none absolute -right-16 -top-24 h-60 w-60 rounded-full bg-gradient-to-br from-lime-400/35 to-leaf-500/25 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative">
            <span className="eyebrow">Municipal Command Center</span>
            <h1 className="h-section mt-2 text-ink-950">City Waste Intelligence &amp; Policy</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
              Holistic urban sanitation telemetry, AI predictive hotspot mitigation, and ward cleanliness scoring.
            </p>
          </div>

          <div className="relative grid shrink-0 grid-cols-1 gap-3 rounded-2xl bg-ink-950 p-3 sm:grid-cols-3">
            {[
              { value: overview?.resolved_reports_count ?? 142, label: 'Resolved Heaps', tone: 'text-lime-300' },
              { value: hotspots.length ?? 8, label: 'Recurrent Spots', tone: 'text-rose-400' },
              { value: overview?.average_resolution_hours ? `${overview.average_resolution_hours}h` : '4.2h', label: 'Avg Turnaround', tone: 'text-cyan-300' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-center">
                <div className={`stat-number text-xl font-semibold ${s.tone}`}>{s.value}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="card p-4">
        <form onSubmit={handleNlSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Ask anything in plain English: 'Show critical road blockage reports near Central Delhi unresolved for 6 hours'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="btn-primary"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {searching ? 'Querying...' : 'Semantic Query'}
          </button>
        </form>

        {searchResults && (
          <div className="mt-4 p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-indigo-900">Found {searchResults.length} matching incidents</span>
              <button onClick={() => setSearchResults(null)} className="text-xs text-indigo-600 font-semibold hover:underline">Clear</button>
            </div>
            <div className="space-y-2">
              {searchResults.slice(0, 4).map(item => (
                <div key={item.id} className="p-2 bg-white rounded-lg border border-indigo-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{item.title}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <span className="text-slate-500 text-xs">{item.address}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {aiInsights && (
        <div className="rounded-3xl border border-leaf-200 bg-gradient-to-br from-leaf-50 via-white to-lime-50/60 p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Sparkles className="w-5 h-5 text-emerald-700" />
            <h3 className="h-card text-base text-ink-900">Municipal AI Intelligence & Operational Advice</h3>
            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald-700">
              {aiInsights.source === 'gemini' ? 'Gemini' : 'Heuristic fallback'}
            </span>
            {aiInsights.cached && (
              <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500">
                cached 15m
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 leading-relaxed mb-4">
            {aiInsights.summary || "No insights generated yet."}
          </p>

          {aiInsights.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-center">
              {[
                { label: 'This week', value: aiInsights.stats.reports_this_week },
                { label: 'vs last week', value: `${aiInsights.stats.week_over_week_pct > 0 ? '+' : ''}${aiInsights.stats.week_over_week_pct}%` },
                { label: 'Avg resolution', value: `${aiInsights.stats.avg_resolution_hours}h` },
                { label: 'Overdue >6h', value: aiInsights.stats.overdue_reports },
              ].map((s) => (
                <div key={s.label} className="p-2 bg-white/80 rounded-xl border border-emerald-100">
                  <div className="text-sm font-black text-slate-900">{s.value}</div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {(aiInsights.actions?.length ? aiInsights.actions : [
              { title: 'Deploy Smart Sensor Bin', detail: 'Targeting the busiest market junction', priority: 'HIGH' },
              { title: 'Route Frequency Shift', detail: 'Advance morning sweep to 6:30 AM', priority: 'MEDIUM' },
              { title: 'Citizen Segregation Drive', detail: 'Reward top community verifiers', priority: 'LOW' },
            ]).map((a, i) => (
              <div key={i} className={`p-3 bg-white/80 rounded-xl border ${
                a.priority === 'HIGH' ? 'border-rose-200' : a.priority === 'MEDIUM' ? 'border-teal-200' : 'border-blue-200'
              }`}>
                <span className={`text-xs font-bold uppercase ${
                  a.priority === 'HIGH' ? 'text-rose-700' : a.priority === 'MEDIUM' ? 'text-teal-700' : 'text-blue-700'
                }`}>
                  Action {i + 1}{a.priority ? ` · ${a.priority}` : ''}
                </span>
                <div className="font-semibold text-slate-900 mt-0.5">{a.title}</div>
                <div className="text-xs text-slate-500">{a.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Complete city incident density & active hotspots</span>
          <span className="font-semibold text-slate-700">Displaying all municipal layers</span>
        </div>
        <MapView
          height="420px"
          items={reports}
          hotspots={hotspots}
          pickups={pickups}
        />
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h3 className="h-card text-base text-ink-900">Pickup Operations</h3>
          <div className="flex gap-2 text-xs font-bold">
            {['REQUESTED', 'ASSIGNED', 'IN_PROGRESS', 'COLLECTED'].map((s) => {
              const n = pickups.filter((p) => p.status === s).length;
              return (
                <span key={s} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {s.replace(/_/g, ' ')} · {n}
                </span>
              );
            })}
          </div>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {pickups.map((p) => (
            <div key={p.id} className="flex flex-col gap-2 rounded-xl border border-black/[0.04] bg-paper-2/70 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-xs">
                  #{p.id} · {(p.waste_type || 'BULK').replace(/_/g, ' ')}
                </div>
                <div className="text-xs text-slate-500 truncate">{p.address}</div>
                <div className="text-xs text-slate-500">
                  {p.estimated_volume || p.volume || 'Standard load'} · {p.latitude?.toFixed ? `${Number(p.latitude).toFixed(4)}, ${Number(p.longitude).toFixed(4)}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={p.status} />
                {(p.status === 'REQUESTED' || p.status === 'SCHEDULED') && (
                  <>
                    <select
                      value={pickupWorker[p.id] || ''}
                      onChange={(e) => setPickupWorker((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      className="input min-h-9 px-2.5 py-1.5 text-xs"
                    >
                      <option value="">Worker…</option>
                      {staff.map((w) => (
                        <option key={w.id} value={w.id}>{w.username}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handlePickupAssign(p.id)}
                      disabled={assigningPickup === p.id}
                      className="btn-dark btn-sm"
                    >
                      {assigningPickup === p.id ? '…' : 'Assign'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {pickups.length === 0 && (
            <div className="py-4 text-center text-xs text-slate-500">No pickup requests yet.</div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="h-card mb-4 text-base text-ink-900">Ward Cleanliness Index (Swachh Index)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {cleanliness.map((c, i) => (
            <div key={c.id || i} className="space-y-2 rounded-2xl border border-black/[0.04] bg-paper-2/60 p-4">
              <div className="flex justify-between items-start">
                <span className="font-bold text-slate-900 text-sm">{c.ward_name || `Ward ${i + 1}`}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-black ${
                  (c.score || 80) >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {c.score || 82}/100
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Resolution Rate: <strong>{c.resolution_rate || '94%'}</strong>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lime-400 to-leaf-500"
                  style={{ width: `${c.score || 82}%` }}
                ></div>
              </div>
            </div>
          ))}
          {cleanliness.length === 0 && (
            <div className="col-span-4 py-4 text-center text-xs text-slate-500">
              Cleanliness scores updated dynamically based on incident density.
            </div>
          )}
        </div>
      </div>

      {forecast && forecast.forecasts?.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
            <h3 className="h-card flex items-center gap-2 text-base text-ink-900">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              Predicted Overflow Risk — next {forecast.horizon_hours}h
            </h3>
            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {forecast.likely_count} likely to overflow
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Method: {forecast.method}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {forecast.forecasts.slice(0, 6).map((f, i) => (
              <div key={i} className={`p-3 rounded-xl border ${
                f.likely_to_overflow ? 'border-rose-200 bg-rose-50/60' : 'border-slate-200 bg-slate-50/60'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">{f.zone || 'Unknown zone'}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-black ${
                    f.likely_to_overflow ? 'bg-rose-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}>{f.risk_score}</span>
                </div>
                <div className="text-xs text-slate-600 mb-1">
                  {f.open_reports} open · {f.critical_reports} critical · oldest {f.oldest_age_hours}h
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{f.explanation}</p>
                <div className={`mt-1.5 text-xs font-semibold ${f.likely_to_overflow ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {f.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="card p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <h3 className="h-card flex items-center gap-2 text-base text-ink-900">
            <Users className="w-4 h-4 text-emerald-600" />
            Staff Management
          </h3>
          <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {staff.length} field accounts
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Issue worker and supervisor logins here. Public signup stays citizen-only. New crew
          appears instantly in the supervisor's Crew Workload Roster and can be dispatched.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StaffCreator onCreated={refreshStaff} allowSupervisorRole />
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {staff.map(w => (
              <div key={w.id} className="flex items-center justify-between gap-2 rounded-xl border border-black/[0.04] bg-paper-2/70 p-3">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-xs truncate">
                    {[w.first_name, w.last_name].filter(Boolean).join(' ') || w.username}
                    <span className="font-semibold text-slate-500"> · @{w.username}</span>
                  </div>
                  <div className="text-xs text-slate-500">{w.zone || 'Zone 1 - Central'}{w.phone ? ` · ${w.phone}` : ''}</div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  {w.role}
                </span>
              </div>
            ))}
            {staff.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500">No field accounts yet — create the first one.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
