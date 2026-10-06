import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../api/client';
import MapView from '../components/MapView';
import StatusBadge from '../components/StatusBadge';
import ReportDetailModal from '../components/ReportDetailModal';
import PriorityBadge from '../components/PriorityBadge';
import ImpactCard from '../components/ImpactCard';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Clock, MapPin, Camera, Play, CheckCheck, RefreshCw, Navigation, Radio, Sparkles } from 'lucide-react';
import { Reveal } from '../components/motion';

export default function WorkerDashboard() {
  const { user, refreshUser } = useAuth();
  const [impact, setImpact] = useState({ stats: null, catalog: [] });
  const queueRef = useRef(null);
  const scrolledToRoute = useRef(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [notes, setNotes] = useState('');
  const [optimizeRoute, setOptimizeRoute] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [precheck, setPrecheck] = useState(null);
  const [prechecking, setPrechecking] = useState(false);
  const [detailReport, setDetailReport] = useState(null);

  const fetchTasks = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await api.get('/api/operations/tasks/');
      setTasks(res.data?.results || res.data || []);
      if (showLoading) {
        try {
          const meRes = await api.get('/api/auth/me/');
          if (meRes.data?.user) refreshUser(meRes.data.user);
          setImpact({ stats: meRes.data?.stats || null, catalog: meRes.data?.badge_catalog?.worker || [] });
        } catch {
          /* impact card stays hidden when logged out */
        }
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Land straight on the route queue after login / persona switch.
  useEffect(() => {
    if (!loading && !scrolledToRoute.current && queueRef.current) {
      scrolledToRoute.current = true;
      queueRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading]);

  useEffect(() => {
    if (!liveUpdates) return;
    const interval = setInterval(() => {
      fetchTasks(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [liveUpdates]);

  const runPrecheck = async (file) => {
    const reportId = getTaskReport(selectedTask)?.id;
    if (!file || !reportId) {
      setPrecheck(null);
      return;
    }
    setPrechecking(true);
    setPrecheck(null);
    try {
      const fd = new FormData();
      fd.append('report_id', reportId);
      fd.append('after_image', file);
      const res = await api.post('/api/ai/verify-cleanup/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPrecheck(res.data);
    } catch {
      setPrecheck(null);
    } finally {
      setPrechecking(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setTransitioning(true);
      let payload;
      let headers = {};
      if (afterPhoto && newStatus === 'COMPLETED') {
        payload = new FormData();
        payload.append('status', newStatus);
        payload.append('notes', notes || 'Sanitation team finished clearing and disinfecting site.');
        payload.append('after_image', afterPhoto);
        headers = { 'Content-Type': 'multipart/form-data' };
      } else {
        payload = {
          status: newStatus,
          notes: notes || undefined,
        };
      }

      const res = await api.post(`/api/operations/tasks/${taskId}/transition/`, payload, { headers });
      setNotes('');
      setAfterPhoto(null);
      setPhotoPreview(null);
      setPrecheck(null);
      await fetchTasks(false);
      if (newStatus === 'COMPLETED') {
        try {
          const meRes = await api.get('/api/auth/me/');
          if (meRes.data?.user) refreshUser(meRes.data.user);
          setImpact({ stats: meRes.data?.stats || null, catalog: meRes.data?.badge_catalog?.worker || [] });
        } catch {
          /* points refresh best-effort */
        }
      }
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => prev ? { 
          ...prev, 
          status: newStatus,
          report_details: res.data?.report_details || prev.report_details,
        } : null);
      }
    } catch (err) {
      alert('Error updating task: ' + (err.response?.data?.detail || err.message));
    } finally {
      setTransitioning(false);
    }
  };

  const getTaskReport = (t) => t.report_details || (typeof t.report === 'object' ? t.report : null);
  const getTaskPickup = (t) => t.pickup_details || (typeof t.pickup === 'object' ? t.pickup : null);

  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const orderedTasks = useMemo(() => {
    if (!optimizeRoute || tasks.length <= 1) return tasks;

    const unvisited = [...tasks];
    const pWeights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

    unvisited.sort((a, b) => {
      const repA = getTaskReport(a);
      const repB = getTaskReport(b);
      const wA = pWeights[repA?.priority_level] || 1;
      const wB = pWeights[repB?.priority_level] || 1;
      return wB - wA;
    });

    const route = [];
    let current = unvisited.shift();
    route.push(current);

    while (unvisited.length > 0) {
      const curRep = getTaskReport(current);
      const curLat = parseFloat(curRep?.latitude || 28.628);
      const curLng = parseFloat(curRep?.longitude || 77.218);

      let bestIdx = 0;
      let bestScore = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const nextRep = getTaskReport(unvisited[i]);
        const nextLat = parseFloat(nextRep?.latitude || curLat);
        const nextLng = parseFloat(nextRep?.longitude || curLng);
        const dist = getDistanceKm(curLat, curLng, nextLat, nextLng);
        const pWeight = pWeights[nextRep?.priority_level] || 1;
        const cost = dist / (pWeight * 1.5);
        if (cost < bestScore) {
          bestScore = cost;
          bestIdx = i;
        }
      }

      current = unvisited.splice(bestIdx, 1)[0];
      route.push(current);
    }
    return route;
  }, [tasks, optimizeRoute]);

  const routePolyline = useMemo(() => {
    if (!optimizeRoute) return null;
    return orderedTasks
      .map(t => {
        const rep = getTaskReport(t);
        return rep ? [parseFloat(rep.latitude), parseFloat(rep.longitude)] : null;
      })
      .filter(Boolean);
  }, [orderedTasks, optimizeRoute]);

  const taskReports = orderedTasks
    .map((t, idx) => {
      const rep = getTaskReport(t);
      if (!rep) return null;
      return {
        ...rep,
        id: rep.id,
        title: `[#${idx + 1} - Job #${t.id}] ${rep.title}`,
        priority_level: rep.priority_level,
        status: t.status,
        route_order: optimizeRoute ? `${idx + 1}` : '',
      };
    })
    .filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <Reveal>
        <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-6 shadow-soft sm:p-8 md:flex-row md:items-end">
          <div
            className="pointer-events-none absolute -right-14 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-cyan-400/30 to-leaf-400/20 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative">
            <span className="eyebrow">Field Sanitation Operative</span>
            <h1 className="h-section mt-2 text-ink-950">Today's Assigned Route</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
              Access assigned waste heaps, optimize your collection circuit, and log AI-verified before/after evidence.
            </p>
          </div>
          <div className="relative flex shrink-0 gap-3">
            <div className="rounded-2xl border border-black/[0.06] bg-paper-2/70 px-5 py-3 text-center">
              <div className="stat-number text-3xl font-semibold leading-none text-ink-900">{tasks.length}</div>
              <div className="mt-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Total Route Jobs</div>
            </div>
            <div className="rounded-2xl border border-black/[0.06] bg-gradient-to-br from-lime-400/40 to-leaf-500/25 px-5 py-3 text-center">
              <div className="stat-number text-3xl font-semibold leading-none text-ink-950">
                {tasks.filter(t => t.status === 'COMPLETED').length}
              </div>
              <div className="mt-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-ink-800/70">Cleared Today</div>
            </div>
          </div>
        </div>
      </Reveal>

      {user && impact.stats && (
        <ImpactCard
          user={user}
          stats={impact.stats}
          catalog={impact.catalog}
          headline="My Field Impact"
          subline={`${impact.stats.completions} cleanups · ${impact.stats.quality} AI-verified quality`}
        />
      )}

      <div className="space-y-3">
        <div className="flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-slate-800">Dispatch Map</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-500">
              {optimizeRoute ? 'Showing priority-weighted nearest-neighbour path' : 'Click a marker or job card to begin'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setOptimizeRoute(!optimizeRoute)}
              className={`chip font-bold transition-all ${
                optimizeRoute
                  ? 'border-transparent bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-soft'
                  : 'text-slate-600 hover:border-black/10 hover:bg-paper-2'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              {optimizeRoute ? 'Route Optimized (Active)' : 'Optimize Route (Nearest-First)'}
            </button>

            <button
              onClick={() => setLiveUpdates(!liveUpdates)}
              className={`chip font-semibold transition-all ${
                liveUpdates ? 'border-leaf-300 bg-leaf-50 text-leaf-700' : 'border-black/[0.06] bg-paper-2 text-slate-500'
              }`}
            >
              <Radio className={`w-3 h-3 ${liveUpdates ? 'animate-pulse text-emerald-600' : ''}`} />
              {liveUpdates ? 'Live Sync On' : 'Live Sync Off'}
            </button>
          </div>
        </div>

        <MapView
          height="390px"
          items={taskReports}
          routePolyline={routePolyline}
          onItemClick={(item) => {
            const matched = tasks.find(t => {
              const rep = getTaskReport(t);
              return rep && rep.id === item.id;
            });
            if (matched) setSelectedTask(matched);
            const rep = getTaskReport(matched || {}) || item;
            if (rep?.id) setDetailReport(rep);
          }}
        />
      </div>

      <div ref={queueRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 scroll-mt-20">
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-black/[0.05] bg-paper-2/50 px-6 py-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">Assigned Dispatch Queue</h3>
              {optimizeRoute && (
                <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  Sequential Route
                </span>
              )}
            </div>
            <button onClick={() => fetchTasks(true)} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-paper-2 hover:text-ink-900">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {orderedTasks.map((task, idx) => {
              const rep = getTaskReport(task);
              const pick = getTaskPickup(task);
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-5 cursor-pointer transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    selectedTask?.id === task.id ? 'border-l-4 border-leaf-500 bg-leaf-50/70' : 'hover:bg-paper-2/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {optimizeRoute && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">Job #{task.id}</span>
                        <StatusBadge status={task.status} />
                      </div>
                      <div className="text-xs text-slate-700 font-medium">
                        {rep ? rep.title : pick ? `Pickup: ${pick.waste_type}` : 'General Sanitation Job'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        <span>{rep?.address || pick?.address || 'Site Coordinates'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {rep?.priority_level && (
                      <PriorityBadge
                        level={rep.priority_level}
                        score={rep.priority_score}
                        factors={rep.priority_factors}
                      />
                    )}
                    {rep?.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setDetailReport(rep); }}
                        className="text-xs font-bold text-slate-500 hover:text-emerald-700"
                      >
                        Details →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {tasks.length === 0 && !loading && (
              <div className="p-8 text-center text-sm text-slate-500">No tasks assigned to this route.</div>
            )}
          </div>
        </div>

        <div className="card space-y-4 p-6">
          <h3 className="h-card border-b border-black/[0.05] pb-3 text-base text-ink-900">Field Action Panel</h3>

          {selectedTask ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="text-slate-500 text-xs font-semibold uppercase">Current Job</div>
                <div className="font-bold text-slate-900 text-sm">
                  #{selectedTask.id} - {getTaskReport(selectedTask)?.title || (getTaskPickup(selectedTask) ? `${(getTaskPickup(selectedTask).waste_type || 'BULK').replace(/_/g, ' ')} Pickup #${getTaskPickup(selectedTask).id}` : 'Sanitation Task')}
                </div>
                <div className="text-slate-600">{getTaskReport(selectedTask)?.address || getTaskPickup(selectedTask)?.address}</div>
                <div className="pt-2 flex items-center justify-between">
                  <StatusBadge status={selectedTask.status} />
                  <span className="text-xs text-slate-500">Updated {new Date(selectedTask.updated_at || Date.now()).toLocaleTimeString()}</span>
                </div>
              </div>

              {(getTaskReport(selectedTask)?.image_url || getTaskReport(selectedTask)?.image) && (
                <div>
                  <div className="text-xs font-bold text-slate-700 mb-1">Citizen Before Photo:</div>
                  <img
                    src={getTaskReport(selectedTask).image_url || getTaskReport(selectedTask).image}
                    alt="Before"
                    className="w-full h-32 object-cover rounded-lg border border-slate-200"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Field Cleanup Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Cleared 2 tons of mixed plastic using loader vehicle..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input"
                ></textarea>
              </div>

              <div className="space-y-3 pt-1">
                {selectedTask.status === 'ASSIGNED' && (
                  <button
                    onClick={() => handleStatusChange(selectedTask.id, 'IN_PROGRESS')}
                    disabled={transitioning}
                    className="btn-dark w-full"
                  >
                    <Play className="w-4 h-4" /> Start Cleaning Work
                  </button>
                )}

                {selectedTask.status === 'IN_PROGRESS' && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Completion Photo <span className="text-slate-500 font-normal">(Powers AI Cleanup Verification)</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setAfterPhoto(file);
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setPhotoPreview(ev.target.result);
                            reader.readAsDataURL(file);
                            runPrecheck(file);
                          } else {
                            setPhotoPreview(null);
                            setPrecheck(null);
                          }
                        }}
                        className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {photoPreview && (
                        <div className="mt-2 relative">
                          <img src={photoPreview} alt="After Preview" className="h-28 w-full object-cover rounded-lg border border-slate-200" />
                          <button
                            type="button"
                            onClick={() => { setAfterPhoto(null); setPhotoPreview(null); setPrecheck(null); }}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    {prechecking && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-emerald-600 animate-spin" />
                        AI is comparing before/after photos…
                      </div>
                    )}
                    {precheck && (
                      <div className={`p-3 rounded-xl border text-xs space-y-1 ${precheck.verified ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> AI pre-check: {precheck.cleanup_score}/100
                          </span>
                          <span className="font-black uppercase text-xs">
                            {precheck.verified ? 'Looks clean' : 'May need more work'}
                          </span>
                        </div>
                        <div className="italic">"{precheck.verdict}"</div>
                        {precheck.observation && (
                          <div className="leading-relaxed">AI sees: {precheck.observation}</div>
                        )}
                        {Array.isArray(precheck.reasons) && precheck.reasons.length > 0 && (
                          <ul className="space-y-0.5">
                            {precheck.reasons.map((r, i) => <li key={i}>• {r}</li>)}
                          </ul>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => handleStatusChange(selectedTask.id, 'COMPLETED')}
                      disabled={transitioning || !afterPhoto || (precheck?.source === 'gemini_vision' && !precheck?.verified)}
                      title={
                        !afterPhoto
                          ? 'Attach a completion photo first'
                          : precheck?.source === 'gemini_vision' && !precheck?.verified
                            ? 'AI has not verified this cleanup — retake the photo'
                            : undefined
                      }
                      className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckCheck className="w-4 h-4" /> {transitioning ? 'Verifying with AI...' : 'Submit Resolution with Evidence'}
                    </button>
                    {!afterPhoto && (
                      <div className="text-xs font-semibold text-slate-500">Attach a completion photo to enable submit.</div>
                    )}
                    {precheck?.source === 'gemini_vision' && !precheck?.verified && (
                      <div className="text-xs font-semibold text-rose-600">AI verification must pass before submit — retake the photo showing a cleaned site.</div>
                    )}
                    {precheck?.source !== 'gemini_vision' && afterPhoto && (
                      <div className="text-xs font-semibold text-amber-600">AI unavailable — submit allowed, supervisor will review manually.</div>
                    )}
                  </div>
                )}

                {selectedTask.status === 'COMPLETED' && (
                  <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl space-y-2 border border-emerald-200">
                    <div className="text-center font-bold text-emerald-800">✓ Job Completed & Submitted</div>
                    {getTaskReport(selectedTask)?.cleanup_score !== undefined && (
                      <div className="border-t border-emerald-200 pt-2 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> AI Cleanup Score:
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            getTaskReport(selectedTask)?.cleanup_verified ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {getTaskReport(selectedTask)?.cleanup_score}/100 - {getTaskReport(selectedTask)?.cleanup_verified ? 'Verified' : 'Manual Review'}
                          </span>
                        </div>
                        {getTaskReport(selectedTask)?.cleanup_verdict && (
                          <div className="text-slate-600 italic">"{getTaskReport(selectedTask).cleanup_verdict}"</div>
                        )}
                        {getTaskReport(selectedTask)?.cleanup_observation && (
                          <div className="text-slate-600">AI saw: {getTaskReport(selectedTask).cleanup_observation}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              Select a task from the list or map to start cleaning or mark resolution.
            </div>
          )}
        </div>
      </div>
      {detailReport && (
        <ReportDetailModal
          report={detailReport}
          onClose={() => setDetailReport(null)}
          role={user?.role || 'WORKER'}
          currentUser={user}
          showAssign={false}
        />
      )}
    </div>
  );
}
