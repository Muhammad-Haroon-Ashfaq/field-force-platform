import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import {
  FileText, AlertTriangle, RefreshCw, CheckCircle,
  Calendar, Loader2, X
} from 'lucide-react';
import API from '../api/axios';

// ─── API Fetchers ─────────────────────────────────────────────
const fetchOverview = (dateFrom, dateTo) =>
  API.get('/reports/overview', { params: { dateFrom, dateTo } }).then(r => r.data);

const fetchTrend = (range, customFrom, customTo) => {
  let dateFrom, dateTo;
  if (range === 'custom') {
    dateFrom = customFrom;
    dateTo = customTo;
  } else {
    const now = new Date();
    dateTo = now.toISOString();
    if (range === 'Last 7 Days') dateFrom = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    else if (range === 'Last 30 Days') dateFrom = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    else { const d = new Date(); d.setHours(0,0,0,0); dateFrom = d.toISOString(); }
  }
  return API.get('/reports/by-date', { params: { dateFrom, dateTo } }).then(r => r.data);
};

const fetchTopEmployees = (dateFrom, dateTo) =>
  API.get('/reports/by-employee', { params: { dateFrom, dateTo } }).then(r => r.data.slice(0, 3));

const fetchTopActivities = (dateFrom, dateTo) =>
  API.get('/reports/by-activity', { params: { dateFrom, dateTo } }).then(r => r.data.slice(0, 4));

const fetchExceptions = () =>
  API.get('/submissions', { params: { syncStatus: 'failed', limit: 3 } })
    .then(r => r.data?.submissions || r.data || []);

// ─── Helpers ──────────────────────────────────────────────────
const formatTrendData = (raw) => (raw || []).map(item => ({
  time: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  submissions: item.totalSubmissions,
  synced: item.syncedCount,
}));
const getAccPct = (emp) => emp.totalSubmissions
  ? `${Math.round((emp.syncedCount / emp.totalSubmissions) * 100)}%` : '0%';
const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
const avatarColors = ['bg-teal-600', 'bg-emerald-600', 'bg-slate-500', 'bg-violet-600'];
const toInputDate = (d) => new Date(d).toISOString().split('T')[0];
const todayStr = () => new Date().toISOString().split('T')[0];

// ─── Date Range Picker ────────────────────────────────────────
const DateRangePicker = ({ onApply, onClose }) => {
  const today = todayStr();
  const thirtyAgo = toInputDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [from, setFrom] = useState(thirtyAgo);
  const [to, setTo] = useState(today);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const presets = [
    { label: 'Last 7 days',   days: 7 },
    { label: 'Last 30 days',  days: 30 },
    { label: 'Last 90 days',  days: 90 },
    { label: 'Last 6 months', days: 180 },
    { label: 'Last 1 year',   days: 365 },
  ];

  const applyPreset = (days) => {
    const f = toInputDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
    setFrom(f);
    setTo(today);
  };

  const handleApply = () => {
    if (!from || !to) return;
    onApply(new Date(from).toISOString(), new Date(to + 'T23:59:59').toISOString());
  };

  return (
    <div ref={ref}
      className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[999] w-80"
      style={{ overflow: 'visible' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-800">Custom Date Range</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      {/* Presets */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-2 font-medium">Quick Select</p>
        <div className="flex flex-wrap gap-1.5">
          {presets.map(p => (
            <button key={p.days} onClick={() => applyPreset(p.days)}
              className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Inputs */}
      <div className="px-4 py-3 space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">From</label>
          <input type="date" value={from} max={to || today}
            onChange={e => setFrom(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">To</label>
          <input type="date" value={to} min={from} max={today}
            onChange={e => setTo(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
        <button onClick={onClose}
          className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
          Cancel
        </button>
        <button onClick={handleApply} disabled={!from || !to}
          className="flex-1 py-2 text-sm bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-40 transition-colors">
          Apply Range
        </button>
      </div>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────
const StatCard = ({ title, value, badge, badgeColor, sub, subIcon, progress, loading }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between">
      <span className="text-sm text-gray-500 font-medium">{title}</span>
      {badge && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>{badge}</span>}
    </div>
    {loading ? <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" /> :
      <div className="text-3xl font-bold text-gray-900 leading-none">{value ?? '—'}</div>}
    {progress && !loading && (
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-teal-500 rounded-full" style={{ width: progress }} />
      </div>
    )}
    {sub && !loading && (
      <div className="flex items-center gap-1.5 text-xs text-gray-500">{subIcon}<span>{sub}</span></div>
    )}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name === 'submissions' ? 'Submissions' : 'Synced'}: {p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────
const Dashboard = () => {
  const [activeRange, setActiveRange] = useState('Today');
  const [showPicker, setShowPicker] = useState(false);
  const [customFrom, setCustomFrom] = useState(null);
  const [customTo, setCustomTo] = useState(null);
  const navigate = useNavigate();

  // Computed date params for all queries
  const isCustom = activeRange === 'custom';
  const dateParams = isCustom
    ? { dateFrom: customFrom, dateTo: customTo }
    : activeRange === 'Last 7 Days'
      ? { dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
      : activeRange === 'Last 30 Days'
        ? { dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
        : { dateFrom: (() => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString(); })() };

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['dashboard-overview', activeRange, customFrom, customTo],
    queryFn: () => fetchOverview(dateParams.dateFrom, dateParams.dateTo),
    refetchInterval: 60000,
  });
  const { data: trendRaw, isLoading: trendLoading } = useQuery({
    queryKey: ['dashboard-trend', activeRange, customFrom, customTo],
    queryFn: () => fetchTrend(activeRange, customFrom, customTo),
  });
  const { data: employees, isLoading: empLoading } = useQuery({
    queryKey: ['dashboard-employees', activeRange, customFrom, customTo],
    queryFn: () => fetchTopEmployees(dateParams.dateFrom, dateParams.dateTo),
    refetchInterval: 60000,
  });
  const { data: activities, isLoading: actLoading } = useQuery({
    queryKey: ['dashboard-activities', activeRange, customFrom, customTo],
    queryFn: () => fetchTopActivities(dateParams.dateFrom, dateParams.dateTo),
  });
  const { data: exceptions, isLoading: excLoading } = useQuery({
    queryKey: ['dashboard-exceptions'],
    queryFn: fetchExceptions,
    refetchInterval: 30000,
  });

  const trendData = formatTrendData(trendRaw);
  const maxSubmissions = Math.max(...(activities?.map(a => a.totalSubmissions) || [1]), 1);

  const handleApplyCustom = (from, to) => {
    setCustomFrom(from);
    setCustomTo(to);
    setActiveRange('custom');
    setShowPicker(false);
  };

  const customLabel = isCustom && customFrom && customTo
    ? `${toInputDate(customFrom)} → ${toInputDate(customTo)}`
    : null;

  return (
    <div className="p-6 space-y-6 min-h-full overflow-visible">

      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time operational health and field data metrics.</p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 relative" style={{ overflow: 'visible' }}>
          {['Today', 'Last 7 Days', 'Last 30 Days'].map(r => (
            <button key={r} onClick={() => { setActiveRange(r); setCustomFrom(null); setCustomTo(null); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeRange === r ? 'bg-slate-900 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}>{r}</button>
          ))}

          {/* Custom label pill */}
          {customLabel && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-600 text-white rounded-md text-xs font-medium">
              <span>{customLabel}</span>
              <button onClick={() => { setActiveRange('Today'); setCustomFrom(null); setCustomTo(null); }}
                className="hover:text-teal-200 ml-0.5"><X size={11} /></button>
            </div>
          )}

          {/* Calendar button */}
          <button
            onClick={() => setShowPicker(v => !v)}
            className={`p-1.5 rounded-md ml-1 transition-colors ${
              showPicker ? 'bg-teal-50 text-teal-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            title="Custom date range">
            <Calendar size={16} />
          </button>

          {/* Picker dropdown */}
          {showPicker && (
            <DateRangePicker
              onApply={handleApplyCustom}
              onClose={() => setShowPicker(false)}
            />
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Submissions" value={overview?.totalSubmissions?.toLocaleString()}
          badge={overview?.pendingSubmissions > 0 ? `${overview.pendingSubmissions} pending` : undefined}
          badgeColor="bg-teal-50 text-teal-600" loading={overviewLoading}
          progress={overview ? `${Math.min(Math.round((overview.totalSubmissions / Math.max(overview.totalSubmissions + 100, 1)) * 100), 100)}%` : undefined} />
        <StatCard title="Active Field Users" value={overview?.activeEmployees?.toLocaleString()}
          badge="Live" badgeColor="bg-green-50 text-green-600"
          sub="Employees currently active" subIcon={<CheckCircle size={12} className="text-green-500" />}
          loading={overviewLoading} />
        <StatCard title="Pending Sync Items" value={overview?.pendingSubmissions?.toLocaleString()}
          badge={overview?.pendingSubmissions > 0 ? 'Priority' : undefined}
          badgeColor="bg-red-50 text-red-500"
          sub={`${overview?.failedSubmissions ?? 0} failed submissions`}
          subIcon={<RefreshCw size={12} className="text-gray-400" />} loading={overviewLoading} />
        <StatCard title="Active Shops" value={overview?.totalShops?.toLocaleString()}
          badge={overview?.flaggedSubmissions > 0 ? `${overview.flaggedSubmissions} flagged` : undefined}
          badgeColor="bg-amber-50 text-amber-600" sub="GPS-flagged submissions" loading={overviewLoading} />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Trend Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-800">Submissions Trend</h2>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />Submissions</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-300 inline-block" />Synced</span>
            </div>
          </div>
          {trendLoading ? (
            <div className="h-[220px] flex items-center justify-center"><Loader2 size={24} className="text-gray-300 animate-spin" /></div>
          ) : trendData.length === 0 ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-gray-400">
              <FileText size={32} className="mb-2 opacity-30" />
              <span className="text-sm">No submissions for this period</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSynced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="synced" stroke="#34d399" strokeWidth={1.5} fill="url(#colorSynced)" dot={false} strokeDasharray="4 3" />
                <Area type="monotone" dataKey="submissions" stroke="#14b8a6" strokeWidth={2} fill="url(#colorSub)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Exceptions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Pending & Exceptions</h2>
          {excLoading ? (
            <div className="flex-1 flex items-center justify-center"><Loader2 size={20} className="text-gray-300 animate-spin" /></div>
          ) : !exceptions?.length ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
              <CheckCircle size={28} className="text-green-400" />
              <span className="text-sm">No exceptions found</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3 flex-1">
              {exceptions.slice(0, 3).map((ex, i) => (
                <div key={ex._id || i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                  <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={16} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800">
                      {ex.syncStatus === 'failed' ? 'Sync Failed' : 'Pending Sync'}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {ex.shop?.name || 'Unknown Shop'} · {ex.user?.name || 'Unknown User'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate('/submissions?status=failed')}
            className="mt-4 w-full py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium transition-all">
            View All Exceptions
          </button>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Top Employees */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Top Active Employees</h2>
            <span className="text-xs bg-slate-900 text-white px-2.5 py-1 rounded-full font-medium">Real-time</span>
          </div>
          {empLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-100 rounded w-32" />
                    <div className="h-2 bg-gray-100 rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : !employees?.length ? (
            <div className="py-8 text-center text-gray-400 text-sm">No employee data yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {employees.map((emp, i) => (
                <div key={emp.employeeId || i} onClick={() => navigate('/users')}
                  className="flex items-center gap-3 py-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                  <div className={`w-9 h-9 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {getInitials(emp.employeeName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800">{emp.employeeName}</div>
                    <div className="text-xs text-gray-400">{emp.totalSubmissions} Submissions</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-teal-600">
                    <CheckCircle size={13} />{getAccPct(emp)} Acc.
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Activity Types */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Top Activity Types</h2>
            <button onClick={() => navigate('/reports')}
              className="text-xs text-teal-600 font-medium hover:text-teal-700 transition-colors">
              View Analytics →
            </button>
          </div>
          {actLoading ? (
            <div className="space-y-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="space-y-1.5 animate-pulse">
                  <div className="h-3 bg-gray-100 rounded w-40" />
                  <div className="h-1.5 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : !activities?.length ? (
            <div className="py-8 text-center text-gray-400 text-sm">No activity data yet</div>
          ) : (
            <div className="space-y-4">
              {activities.map((act, i) => (
                <div key={act.activityId || i} onClick={() => navigate('/activity-types')}
                  className="cursor-pointer group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700 font-medium group-hover:text-teal-600 transition-colors">{act.activityName}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{act.totalSubmissions}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full transition-all"
                      style={{ width: `${Math.round((act.totalSubmissions / maxSubmissions) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 pb-2">
        © 2026 FieldOps Management Systems | Developed & Marketing by <span class="text-teal-500 font-semibold">Bytecraft</span>
        {/* System version 4.12.0 · Data refreshed just now */}
      </div>
    </div>
  );
};

export default Dashboard;
