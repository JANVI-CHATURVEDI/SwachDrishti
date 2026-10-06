import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { MapPin, Camera, Sparkles, Pencil, UserCheck } from 'lucide-react';

export const COMPLETED_STATUSES = ['RESOLVED', 'CITIZEN_VERIFIED'];
const SUPERVISOR_STATUS_OPTIONS = ['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'];
const ADMIN_STATUS_OPTIONS = ['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED', 'CITIZEN_VERIFIED'];

export function canEditReport(report, role, currentUser) {
  if (!report) return false;
  if (role === 'ADMIN') return true;
  if (COMPLETED_STATUSES.includes(report.status)) return false;
  if (role === 'SUPERVISOR') return true;
  if (role === 'CITIZEN') {
    const ownerId = report.citizen ?? report.citizen_details?.id;
    if (ownerId && currentUser?.id && Number(ownerId) !== Number(currentUser.id)) return false;
    return report.status === 'REPORTED';
  }
  return false;
}

export function editableFieldsFor(role) {
  if (role === 'ADMIN') return ['title', 'description', 'address', 'zone', 'severity', 'category', 'status'];
  if (role === 'SUPERVISOR') return ['title', 'description', 'address', 'zone', 'severity', 'category', 'status'];
  if (role === 'CITIZEN') return ['title', 'description', 'address', 'severity', 'category'];
  return [];
}

export default function ReportDetailModal({
  report,
  onClose,
  role = 'CITIZEN',
  currentUser = null,
  categories: categoriesProp = null,
  workers = [],
  onUpdated = null,
  onAssign = null,
  showAssign = null,
  verifyAction = null,
}) {
  const [editMode, setEditMode] = useState(false);
  const [categories, setCategories] = useState(categoriesProp || []);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [assignWorkerId, setAssignWorkerId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState('');
  const [brokenPhoto, setBrokenPhoto] = useState(false);

  const canEdit = canEditReport(report, role, currentUser);
  const allowAssign = showAssign ?? (role === 'SUPERVISOR' || role === 'ADMIN');
  const isCompleted = report && COMPLETED_STATUSES.includes(report.status);

  useEffect(() => {
    setEditMode(false);
    setError('');
    setBrokenPhoto(false);
    setAssignWorkerId('');
    setAssignMsg('');
    if (report) {
      setForm({
        title: report.title || '',
        description: report.description || '',
        address: report.address || '',
        zone: report.zone || 'Zone 1 - Central',
        severity: report.severity || 'MEDIUM',
        category: report.category ?? report.category_details?.id ?? '',
        status: report.status || 'REPORTED',
      });
    }
  }, [report?.id]);

  useEffect(() => {
    if (categoriesProp) {
      setCategories(categoriesProp);
      return;
    }
    if (!report) return;
    if (!canEdit && role !== 'SUPERVISOR' && role !== 'ADMIN') return;
    api.get('/api/reports/categories/').catch(() => ({ data: [] })).then((res) => {
      const d = res.data?.results || res.data || [];
      if (Array.isArray(d)) setCategories(d);
    });
  }, [report?.id]);

  const statusOptions = useMemo(() => {
    if (role === 'ADMIN') return ADMIN_STATUS_OPTIONS;
    return SUPERVISOR_STATUS_OPTIONS;
  }, [role]);

  if (!report) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const allowed = editableFieldsFor(role);
      const payload = {};
      allowed.forEach((k) => {
        if (k === 'category') {
          if (form.category) payload.category = form.category;
        } else {
          payload[k] = form[k];
        }
      });
      const res = await api.patch(`/api/reports/${report.id}/`, payload);
      setEditMode(false);
      if (onUpdated) onUpdated(res.data);
      else if (onClose) onClose();
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!assignWorkerId) return;
    setAssigning(true);
    setAssignMsg('');
    try {
      if (onAssign) {
        await onAssign({ report, workerId: assignWorkerId });
      } else {
        await api.post('/api/operations/assign/', { report_id: report.id, worker_id: assignWorkerId });
      }
      const workerName = workers.find((w) => String(w.id) === String(assignWorkerId))?.username || 'worker';
      setAssignMsg(`Dispatched to ${workerName} ✓`);
      setAssignWorkerId('');
      const refreshed = await api.get(`/api/reports/${report.id}/`).catch(() => null);
      if (onUpdated && refreshed?.data) onUpdated(refreshed.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || err.message);
    } finally {
      setAssigning(false);
    }
  };

  const img = report.image_url || report.image;

  return (
    <Modal onClose={onClose}>
      <div className="modal-pop my-auto max-h-[90vh] w-full max-w-lg shrink-0 overflow-y-auto rounded-3xl bg-white shadow-lift">
        <div className="relative bg-slate-100">
          {img && !brokenPhoto ? (
            <img
              src={img}
              alt={report.title}
              className="h-52 w-full object-cover"
              onError={() => setBrokenPhoto(true)}
            />
          ) : (
            <div className="flex h-36 w-full items-center justify-center text-xs font-semibold text-slate-500">
              <Camera className="mr-2 h-5 w-5" />
              {img ? 'Photo could not be loaded' : 'No photo attached'}
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-soft transition hover:bg-white"
          >
            Close
          </button>
          <div className="absolute inset-x-4 bottom-3 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold leading-tight drop-shadow">{report.title}</span>
              <span className="rounded bg-white/25 px-1.5 py-0.5 text-xs font-black">#{report.id}</span>
            </div>
            <div className="mt-0.5 text-xs text-white/85">
              {report.category_details?.name || 'General'} • {report.created_at ? new Date(report.created_at).toLocaleString() : ''}
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={report.status} />
            <PriorityBadge level={report.priority_level} score={report.priority_score} factors={report.priority_factors} />
            {isCompleted && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">Locked · completed</span>
            )}
            {canEdit && !editMode && (
              <button onClick={() => setEditMode(true)} className="btn-soft btn-sm ml-auto">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            )}
          </div>

          {!editMode ? (
            <>
              <p className="leading-relaxed text-slate-700">{report.description || 'No extended description was provided for this issue.'}</p>

              {(report.after_image_url || report.after_image) && (
                <div className="overflow-hidden rounded-xl border border-emerald-200">
                  <img
                    src={report.after_image_url || report.after_image}
                    alt="Cleanup proof"
                    className="h-44 w-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div className="bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                    Cleanup proof · uploaded by field worker
                    {report.cleanup_score ? ` · AI score ${report.cleanup_score}/100` : ''}
                  </div>
                </div>
              )}

              {report.cleanup_verdict && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-700">
                  <strong>AI Audit Verdict:</strong> {report.cleanup_verdict}
                  {report.cleanup_observation && (
                    <div className="mt-1 leading-relaxed">AI saw: {report.cleanup_observation}</div>
                  )}
                </div>
              )}

              <div className="space-y-1.5 rounded-xl bg-slate-50 p-3">
                <div className="flex items-start gap-1.5 font-semibold text-slate-700">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>{report.address}</span>
                </div>
                <div className="pl-5 text-xs text-slate-500">
                  {Number(report.latitude).toFixed(5)}, {Number(report.longitude).toFixed(5)}
                  {report.zone ? ` • ${report.zone}` : ''}
                </div>
              </div>

              {Array.isArray(report.priority_factors) && report.priority_factors.length > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5 font-bold text-slate-900">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Why this priority?
                  </div>
                  <ul className="space-y-1 text-slate-600">
                    {report.priority_factors.map((f, i) => (
                      <li key={i} className="flex gap-1.5"><span className="text-emerald-500">•</span><span>{f}</span></li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-slate-50 p-2">
                  <div className="text-xs font-bold uppercase text-slate-500">Reported</div>
                  <div className="font-semibold text-slate-700">{report.created_at ? new Date(report.created_at).toLocaleString() : '—'}</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <div className="text-xs font-bold uppercase text-slate-500">Last update</div>
                  <div className="font-semibold text-slate-700">{report.updated_at ? new Date(report.updated_at).toLocaleString() : '—'}</div>
                </div>
                {report.resolved_at && (
                  <div className="col-span-2 rounded-lg bg-emerald-50 p-2">
                    <div className="text-xs font-bold uppercase text-emerald-500">Resolved</div>
                    <div className="font-semibold text-emerald-700">{new Date(report.resolved_at).toLocaleString()}</div>
                  </div>
                )}
              </div>

              {(report.citizen_verification || report.verification) ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-800">
                  ✓ Confirmed cleaned by a citizen{report.citizen_verification?.feedback ? ` — "${report.citizen_verification.feedback}"` : ''}
                </div>
              ) : report.status === 'RESOLVED' ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-600">
                  Waiting for a citizen to confirm this cleanup.
                </div>
              ) : null}
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Title</label>
                <input value={form.title} onChange={(e) => set('title', e.target.value)} className="input" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Description</label>
                <textarea rows="3" value={form.description} onChange={(e) => set('description', e.target.value)} className="input" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Severity</label>
                  <select value={form.severity} onChange={(e) => set('severity', e.target.value)} className="input">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Category</label>
                  <select value={form.category} onChange={(e) => set('category', e.target.value)} className="input">
                    <option value="">—</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Address / landmark</label>
                <input value={form.address} onChange={(e) => set('address', e.target.value)} className="input" />
              </div>
              {(role === 'SUPERVISOR' || role === 'ADMIN') && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Zone</label>
                    <input value={form.zone} onChange={(e) => set('zone', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Status</label>
                    <select value={form.status} onChange={(e) => set('status', e.target.value)} className="input">
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-rose-700">{error}</div>}
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditMode(false)} className="btn-outline btn-sm">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm">
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          )}

          {allowAssign && !isCompleted && workers.length > 0 && !editMode && (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <UserCheck className="h-3.5 w-3.5" /> Assign / reassign worker
              </div>
              <div className="flex gap-2">
                <select value={assignWorkerId} onChange={(e) => setAssignWorkerId(e.target.value)} className="input">
                  <option value="">— Choose operative —</option>
                  {workers.filter((w) => !w.is_blacklisted).map((w) => (
                    <option key={w.id} value={w.id}>{w.username} ({w.zone || w.ward || 'General'})</option>
                  ))}
                </select>
                <button onClick={handleAssign} disabled={!assignWorkerId || assigning} className="btn-dark btn-sm shrink-0">
                  {assigning ? '…' : 'Dispatch'}
                </button>
              </div>
              {assignMsg && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                  {assignMsg}
                </div>
              )}
              {error && <div className="text-xs font-semibold text-rose-600">{error}</div>}
            </div>
          )}

          {verifyAction && (
            <div className="flex justify-end gap-2 pt-1">
              {verifyAction}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
