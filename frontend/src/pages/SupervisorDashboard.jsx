import React, { useState, useEffect } from 'react';
import api from '../api/client';
import MapView from '../components/MapView';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import StaffCreator from '../components/StaffCreator';
import Modal from '../components/Modal';
import ReportDetailModal from '../components/ReportDetailModal';
import { useAuth } from '../context/AuthContext';
import { Users, AlertCircle, CheckCircle, Flame, UserCheck, ArrowRight, RefreshCw, Radio, Sparkles, ShieldCheck } from 'lucide-react';
import { Reveal } from '../components/motion';
import { motion } from 'framer-motion';

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const [teamSummary, setTeamSummary] = useState(null);
  const [reports, setReports] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dispatch'); 
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [detailReport, setDetailReport] = useState(null);
  const [expandedWorkerId, setExpandedWorkerId] = useState(null);
  const [workerTasks, setWorkerTasks] = useState({});
  const [loadingWorkerTasks, setLoadingWorkerTasks] = useState(null);

  const toggleBlacklist = async (worker) => {
    if (!worker.id) return;
    if (!worker.is_blacklisted && !window.confirm(`Blacklist @${worker.username}? They will be logged out and hidden from dispatch.`)) return;
    try {
      await api.post(`/api/auth/staff/${worker.id}/blacklist/`, { blacklisted: !worker.is_blacklisted });
      fetchSupervisorData(false);
    } catch (err) {
      alert(err.response?.data?.detail || err.message);
    }
  };

  const toggleWorkerTasks = async (worker) => {
    const id = worker.id;
    if (!id) return;
    if (expandedWorkerId === id) {
      setExpandedWorkerId(null);
      return;
    }
    setExpandedWorkerId(id);
    if (workerTasks[id]) return;
    setLoadingWorkerTasks(id);
    try {
      const res = await api.get(`/api/operations/tasks/?worker_id=${id}`);
      const tasks = res.data?.results || res.data || [];
      setWorkerTasks((prev) => ({ ...prev, [id]: tasks }));
    } catch (err) {
      console.error('Worker tasks fetch error:', err);
      setWorkerTasks((prev) => ({ ...prev, [id]: [] }));
    } finally {
      setLoadingWorkerTasks(null);
    }
  };

  const [assignTarget, setAssignTarget] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchSupervisorData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [sumRes, repRes, hotRes, workRes, pickRes] = await Promise.all([
        api.get('/api/operations/team-summary/').catch(() => ({ data: null })),
        api.get('/api/reports/'),
        api.get('/api/hotspots/'),
        api.get('/api/auth/workers/').catch(() => ({ data: [] })),
        api.get('/api/pickups/').catch(() => ({ data: [] })),
      ]);
      setTeamSummary(sumRes.data);
      setReports(repRes.data?.results || repRes.data || []);
      setPickups(pickRes.data?.results || pickRes.data || []);
      setHotspots(hotRes.data?.results || hotRes.data || []);
      setWorkers(workRes.data || []);
    } catch (err) {
      console.error('Supervisor data fetch error:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisorData();
  }, []);

  useEffect(() => {
    if (!liveUpdates) return;
    const interval = setInterval(() => {
      fetchSupervisorData(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [liveUpdates]);

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!selectedWorkerId || !assignTarget) return;
    setAssigning(true);
    try {
      const payload = { worker_id: selectedWorkerId };
      if (assignTarget.kind === 'pickup') {
        payload.pickup_id = assignTarget.id;
      } else {
        payload.report_id = assignTarget.id;
        payload.priority = assignTarget.priority_level || 'MEDIUM';
      }
      await api.post('/api/operations/assign/', payload);
      setAssignTarget(null);
      setSelectedWorkerId('');
      fetchSupervisorData();
    } catch (err) {
      alert('Error assigning task: ' + (err.response?.data?.detail || err.message));
    } finally {
      setAssigning(false);
    }
  };

  const completedReports = reports.filter(r =>
    r.status === 'RESOLVED' ||
    r.status === 'CITIZEN_VERIFIED' ||
    r.after_image_url || r.after_image ||
    (r.cleanup_score !== null && r.cleanup_score !== undefined)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <Reveal>
        <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-6 shadow-soft sm:p-8 md:flex-row md:items-end">
          <div
            className="pointer-events-none absolute -right-14 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-400/30 to-sky-400/25 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative">
            <span className="eyebrow">Ward &amp; Operations Supervisor</span>
            <h1 className="h-section mt-2 text-ink-950">Fleet &amp; Dispatch Control</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
              Monitor real-time crew capacity, identify critical unassigned waste heaps, and balance ward tasks.
            </p>
          </div>
          <div className="relative flex shrink-0 gap-3">
            <div className="rounded-2xl border border-black/[0.06] bg-paper-2/70 px-5 py-3 text-center">
              <div className="stat-number text-3xl font-semibold leading-none text-ink-900">
                {teamSummary?.total_workers || workers.length || 6}
              </div>
              <div className="mt-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Active Field Workers</div>
            </div>
            <div className="rounded-2xl border border-black/[0.06] bg-gradient-to-br from-lime-400/40 to-leaf-500/25 px-5 py-3 text-center">
              <div className="stat-number text-3xl font-semibold leading-none text-ink-950">
                {teamSummary?.in_progress_tasks || 8}
              </div>
              <div className="mt-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-ink-800/70">Live Cleans in Progress</div>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Active ward overview with recurrent hotspot clusters</span>
          <span className="font-semibold text-slate-700">Click a marker to dispatch crew</span>
        </div>
        <MapView
          height="400px"
          items={reports}
          hotspots={hotspots}
          pickups={pickups}
          onItemClick={(item) => setDetailReport({ ...item, kind: 'report' })}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-white p-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-xl bg-paper-2/70 p-1">
          {[
            { key: 'dispatch', label: `Pending Dispatch Queue (${reports.filter(r => r.status === 'REPORTED' || r.status === 'VERIFIED').length})` },
            { key: 'pickups', label: `Pickup Requests (${pickups.filter(p => p.status === 'REQUESTED' || p.status === 'SCHEDULED').length})` },
            { key: 'verifications', label: `AI Cleanup Verifications (${completedReports.length})`, icon: Sparkles },
          ].map(t => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                aria-pressed={active}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors duration-200 ${active ? 'text-ink-950' : 'text-slate-500 hover:text-ink-800'}`}
              >
                {active && (
                  <motion.span
                    layoutId="sup-tab"
                    className={`absolute inset-0 rounded-lg shadow-soft ${t.key === 'verifications' ? 'bg-gradient-to-br from-lime-400 to-leaf-400' : 'bg-gradient-to-br from-sky-500 to-blue-600'}`}
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <span className={`relative flex items-center gap-1.5 ${active && t.key !== 'verifications' ? 'text-white' : ''}`}>
                  {t.icon && <t.icon className="h-3.5 w-3.5" strokeWidth={2} />}
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLiveUpdates(!liveUpdates)}
            className={`chip font-semibold transition-all ${
              liveUpdates ? 'border-leaf-300 bg-leaf-50 text-leaf-700' : 'border-black/[0.06] bg-paper-2 text-slate-500'
            }`}
          >
            <Radio className={`h-3 w-3 ${liveUpdates ? 'animate-pulse text-leaf-600' : ''}`} />
            {liveUpdates ? 'Live Sync On' : 'Live Sync Off'}
          </button>

          <button onClick={() => fetchSupervisorData(true)} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-paper-2 hover:text-ink-900">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTab === 'dispatch' ? (
          <div className="card overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-between border-b border-black/[0.05] bg-paper-2/50 px-6 py-4">
              <h3 className="font-bold text-slate-900 text-base">Unassigned & Priority Reports</h3>
            </div>

            <div className="divide-y divide-slate-100">
              {reports.filter(r => r.status === 'REPORTED' || r.status === 'VERIFIED').map((report) => (
                <div key={report.id} onClick={() => setDetailReport(report)} title="Open issue details" className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:bg-paper-2/70 cursor-pointer">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{report.title}</span>
                      <StatusBadge status={report.status} />
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-1">{report.address}</div>
                    <div className="text-xs text-slate-500">Severity: {report.severity} • {new Date(report.created_at).toLocaleDateString()}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <PriorityBadge level={report.priority_level} score={report.priority_score} factors={report.priority_factors} />
                    <button
                      onClick={(e) => { e.stopPropagation(); setDetailReport(report); }}
                      className="btn-primary btn-sm"
                    >
                      <span>Dispatch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {reports.filter(r => r.status === 'REPORTED' || r.status === 'VERIFIED').length === 0 && !loading && (
                <div className="p-8 text-center text-sm text-slate-500">All pending reports currently dispatched!</div>
              )}
            </div>
          </div>
        ) : activeTab === 'pickups' ? (
          <div className="card overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-between border-b border-black/[0.05] bg-paper-2/50 px-6 py-4">
              <h3 className="font-bold text-slate-900 text-base">Unassigned Pickup Requests</h3>
            </div>

            <div className="divide-y divide-slate-100">
              {pickups.filter(p => p.status === 'REQUESTED' || p.status === 'SCHEDULED').map((pickup) => (
                <div key={pickup.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:bg-paper-2/70">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">#{pickup.id} · {(pickup.waste_type || 'BULK').replace(/_/g, ' ')}</span>
                      <StatusBadge status={pickup.status} />
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-1">{pickup.address}</div>
                    <div className="text-xs text-slate-500">
                      {pickup.estimated_volume || pickup.volume || 'Standard load'} · {pickup.preferred_slot || pickup.preferred_time || 'Any slot'} · {pickup.created_at ? new Date(pickup.created_at).toLocaleDateString() : ''}
                    </div>
                  </div>

                  <button
                    onClick={() => setAssignTarget({ ...pickup, kind: 'pickup', title: `${(pickup.waste_type || 'BULK').replace(/_/g, ' ')} pickup #${pickup.id}` })}
                    className="btn-primary btn-sm"
                  >
                    <span>Dispatch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {pickups.filter(p => p.status === 'REQUESTED' || p.status === 'SCHEDULED').length === 0 && !loading && (
                <div className="p-8 text-center text-sm text-slate-500">No pending pickup requests — all assigned!</div>
              )}
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-between border-b border-black/[0.05] bg-paper-2/50 px-6 py-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Field Resolutions & AI Verification Evidence
                </h3>
                <p className="text-xs text-slate-500">Gemini vision comparison of before & after cleanup photographs</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {completedReports
                .map((report) => (
                  <div key={report.id} onClick={() => setDetailReport(report)} title="Open issue details" className="p-5 space-y-3 transition hover:bg-paper-2/70 cursor-pointer">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">#{report.id} · {report.title}</div>
                        <div className="text-xs text-slate-500">{report.address}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={report.status} />
                        {report.cleanup_score !== undefined && report.cleanup_score !== null && (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 ${
                            report.cleanup_verified ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {report.cleanup_score}/100 {report.cleanup_verified ? 'Verified' : 'Audit Needed'}
                          </span>
                        )}
                      </div>
                    </div>

                    {report.cleanup_verdict && (
                      <div className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700">
                        <strong>AI Audit Verdict:</strong> {report.cleanup_verdict}
                        {report.cleanup_observation && (
                          <div className="mt-1 leading-relaxed">AI saw: {report.cleanup_observation}</div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase text-slate-500">Before (Citizen Report)</span>
                        {(report.image_url || report.image) ? (
                          <img src={report.image_url || report.image} alt="Before" className="h-32 w-full object-cover rounded-lg border border-slate-200" />
                        ) : (
                          <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-500">No before photo</div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase text-slate-500">After (Worker Resolution)</span>
                        {(report.after_image_url || report.after_image) ? (
                          <img src={report.after_image_url || report.after_image} alt="After" className="h-32 w-full object-cover rounded-lg border border-emerald-300" />
                        ) : (
                          <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-500">Resolution photo pending</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              {completedReports.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500">No completed tasks submitted with verification evidence yet.</div>
              )}
            </div>
          </div>
        )}

        <div className="card space-y-4 p-6">
          <h3 className="h-card border-b border-black/[0.05] pb-3 text-base text-ink-900">Crew Workload Roster</h3>
          <div className="space-y-3">
            {(teamSummary?.workers_status || workers).map((worker, idx) => {
              const wid = worker.id || idx;
              const expanded = expandedWorkerId === worker.id;
              const tasks = workerTasks[worker.id] || [];
              return (
                <div key={wid} className={`overflow-hidden rounded-xl ring-1 ring-black/[0.04] ${worker.is_blacklisted ? 'bg-rose-50/60' : 'bg-paper-2/70'}`}>
                  <button
                    onClick={() => toggleWorkerTasks(worker)}
                    title={worker.id ? 'Click to view assigned tasks' : undefined}
                    className="flex w-full items-center justify-between p-3 text-left transition hover:bg-paper-2"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                        {worker.username || worker.name || `Worker ${idx + 1}`}
                        {worker.is_blacklisted ? (
                          <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-black text-white">BLACKLISTED</span>
                        ) : worker.status && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${worker.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : worker.status === 'Busy' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                            {worker.status}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {worker.zone || worker.ward || 'Central Ward'}
                        {worker.completed_today !== undefined && ` · ${worker.completed_today} done today`}
                        {worker.overdue_tasks ? ` · ${worker.overdue_tasks} overdue` : ''}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-blue-100/70 px-2 py-0.5 text-xs font-bold text-blue-700">
                        {worker.active_tasks_count ?? worker.active_tasks ?? (idx % 3 + 1)} tasks
                      </span>
                      {worker.id && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); toggleBlacklist(worker); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleBlacklist(worker); } }}
                          title={worker.is_blacklisted ? 'Unblock worker' : 'Blacklist worker'}
                          className={`rounded-lg px-2 py-1 text-xs font-bold transition ${worker.is_blacklisted ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
                        >
                          {worker.is_blacklisted ? 'Unblock' : 'Blacklist'}
                        </span>
                      )}
                      {worker.id && <span className="text-xs font-bold text-slate-400">{expanded ? '▲' : '▼'}</span>}
                    </div>
                  </button>
                  {expanded && (
                    <div className="space-y-2 border-t border-black/[0.05] bg-white/60 p-3">
                      {loadingWorkerTasks === worker.id && (
                        <div className="py-2 text-center text-xs text-slate-500">Loading tasks…</div>
                      )}
                      {loadingWorkerTasks !== worker.id && tasks.length === 0 && (
                        <div className="py-2 text-center text-xs text-slate-500">No tasks assigned.</div>
                      )}
                      {tasks.map((t) => {
                        const rep = t.report_details || t.report;
                        const pick = t.pickup_details || t.pickup;
                        const label = rep?.title || (pick ? `${(pick.waste_type || 'BULK').replace(/_/g, ' ')} Pickup #${pick.id}` : `Task #${t.id}`);
                        return (
                          <div
                            key={t.id}
                            onClick={() => rep?.id && setDetailReport(rep)}
                            title={rep?.id ? 'Open issue details' : undefined}
                            className={`flex items-center justify-between gap-2 rounded-lg border border-black/[0.04] bg-white p-2 text-xs ${rep?.id ? 'cursor-pointer hover:bg-leaf-50/60' : ''}`}
                          >
                            <div className="min-w-0">
                              <div className="truncate font-bold text-slate-800">Job #{t.id} · {label}</div>
                              <div className="truncate text-slate-500">{rep?.address || pick?.address || ''}</div>
                            </div>
                            <StatusBadge status={t.status} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <details className="rounded-xl border border-dashed border-slate-300 overflow-hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-xs font-bold text-leaf-700 transition hover:bg-leaf-50">
              <span>+ Onboard a field worker</span>
              <span className="text-slate-500">opens form</span>
            </summary>
            <div className="p-4 border-t border-slate-100">
              <StaffCreator onCreated={() => fetchSupervisorData(false)} />
            </div>
          </details>
        </div>
      </div>

      {detailReport && (
        <ReportDetailModal
          report={detailReport}
          onClose={() => setDetailReport(null)}
          role={user?.role || 'SUPERVISOR'}
          currentUser={user}
          workers={workers}
          onUpdated={(updated) => {
            setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            setDetailReport(updated);
            fetchSupervisorData(false);
          }}
        />
      )}

      {assignTarget && (
        <Modal onClose={() => setAssignTarget(null)}>
          <div className="modal-pop my-auto max-h-[90vh] w-full max-w-md shrink-0 overflow-y-auto rounded-3xl bg-white p-6 shadow-lift space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Dispatch Task to Field Worker</h3>
            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <strong>{assignTarget.kind === 'pickup' ? `Pickup #${assignTarget.id} · ${(assignTarget.waste_type || 'BULK').replace(/_/g, ' ')}` : assignTarget.title}</strong>
              <div className="text-slate-500">{assignTarget.address}</div>
              {assignTarget.kind !== 'pickup' && (
                <div className="pt-1">
                  <PriorityBadge level={assignTarget.priority_level} score={assignTarget.priority_score} factors={assignTarget.priority_factors} />
                </div>
              )}
            </div>

            <form onSubmit={handleAssignTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Field Worker</label>
                <select
                  required
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="input"
                >
                  <option value="">-- Choose Operative --</option>
                  {workers.filter((w) => !w.is_blacklisted).map((w) => (
                    <option key={w.id} value={w.id}>{w.username} ({w.zone || w.ward || 'General'})</option>
                  ))}
                  {workers.length === 0 && <option value="2">Ramesh Kumar (Central Ward)</option>}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignTarget(null)}
                  className="btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="btn-primary btn-sm"
                >
                  {assigning ? 'Dispatching...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
