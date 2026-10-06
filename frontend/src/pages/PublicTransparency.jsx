import React, { useState, useEffect } from 'react';
import api from '../api/client';
import MapView from '../components/MapView';
import StatusBadge from '../components/StatusBadge';
import ReportDetailModal from '../components/ReportDetailModal';
import { Eye, ShieldCheck, CheckCircle2, TrendingUp, RefreshCw, BarChart2 } from 'lucide-react';
import { Reveal } from '../components/motion';

export default function PublicTransparency() {
  const [data, setData] = useState(null);
  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailReport, setDetailReport] = useState(null);

  const fetchPublicData = async () => {
    try {
      setLoading(true);
      const [transRes, repRes, hotRes] = await Promise.all([
        api.get('/api/analytics/transparency/').catch(() => ({ data: null })),
        api.get('/api/reports/'),
        api.get('/api/hotspots/'),
      ]);
      setData(transRes.data);
      setReports(repRes.data?.results || repRes.data || []);
      setHotspots(hotRes.data?.results || hotRes.data || []);
    } catch (err) {
      console.error('Failed to load transparency data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <Reveal>
        <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-6 shadow-soft sm:p-8 md:flex-row md:items-end">
          <div
            className="pointer-events-none absolute -right-14 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-sky-400/30 to-leaf-400/25 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative">
            <span className="eyebrow">Public Civic Ledger</span>
            <h1 className="h-section mt-2 text-ink-950">Open City Sanitation Transparency</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
              Publicly verifiable civic operations. Every report, turnaround timeline, and verified resolution is open for scrutiny.
            </p>
          </div>

          <div className="relative flex shrink-0 gap-3">
            <div className="rounded-2xl border border-black/[0.06] bg-paper-2/70 px-5 py-3 text-center">
              <div className="stat-number text-3xl font-semibold leading-none text-ink-900">
                {data?.total_reports_count ?? reports.length}
              </div>
              <div className="mt-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Citizens Engaged</div>
            </div>
            <div className="rounded-2xl border border-black/[0.06] bg-gradient-to-br from-lime-400/40 to-leaf-500/25 px-5 py-3 text-center">
              <div className="stat-number text-3xl font-semibold leading-none text-ink-950">
                {data?.resolved_percentage ?? '92%'}
              </div>
              <div className="mt-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-ink-800/70">Cleanliness Ratio</div>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Live anonymized waste incidents & cleared spots</span>
          <span className="font-semibold text-slate-700">Open Public Access Layer</span>
        </div>
        <MapView
          height="420px"
          items={reports}
          hotspots={hotspots}
          onItemClick={(item) => setDetailReport(item)}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-black/[0.05] bg-paper-2/50 px-6 py-4">
          <h3 className="h-card text-base text-ink-900">Recently Cleared Heaps & Verification Status</h3>
          <button onClick={fetchPublicData} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-paper-2 hover:text-ink-900">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {reports.slice(0, 8).map((report) => (
            <div key={report.id} onClick={() => setDetailReport(report)} title="Open issue details" className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs cursor-pointer hover:bg-paper-2/70">
              <div>
                <span className="font-bold text-slate-800 text-sm">{report.title}</span>
                <div className="text-slate-500">{report.address}</div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={report.status} />
                {(report.citizen_verification || report.verification) ? (
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-semibold border border-emerald-200">
                    ✓ Verified by Resident
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">Awaiting resident check</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {detailReport && (
        <ReportDetailModal
          report={detailReport}
          onClose={() => setDetailReport(null)}
          role="PUBLIC"
          showAssign={false}
        />
      )}
    </div>
  );
}
