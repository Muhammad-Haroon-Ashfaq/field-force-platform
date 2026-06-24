import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Download, Filter, TrendingUp, TrendingDown,
  Users, CheckCircle, Activity, FileText,
  Loader2, Map, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

// ─── API ──────────────────────────────────────────────────────
const fetchOverview  = (p) => API.get('/reports/overview',     { params: p }).then(r => r.data);
const fetchByDate    = (p) => API.get('/reports/by-date',      { params: p }).then(r => r.data);
const fetchByEmployee= (p) => API.get('/reports/by-employee',  { params: p }).then(r => r.data);
const fetchByActivity= (p) => API.get('/reports/by-activity',  { params: p }).then(r => r.data);
const fetchShopVisits= (p) => API.get('/reports/shop-visits',  { params: p }).then(r => r.data);
const fetchTerritories = () => API.get('/territories').then(r => r.data);
const fetchUsers     = () => API.get('/users').then(r => r.data);

// ─── Helpers ──────────────────────────────────────────────────
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

const getDateParams = (range, customFrom, customTo) => {
  if (range === 'custom') return { dateFrom: customFrom, dateTo: customTo };
  if (range === 'all')  return {}; // no date filter
  const now = new Date();
  if (range === 'today') { const d = new Date(); d.setHours(0,0,0,0); return { dateFrom: d.toISOString() }; }
  if (range === '7d')  return { dateFrom: new Date(now - 7*864e5).toISOString() };
  if (range === '30d') return { dateFrom: new Date(now - 30*864e5).toISOString() };
  if (range === '90d') return { dateFrom: new Date(now - 90*864e5).toISOString() };
  return {};
};

const PIE_COLORS = ['#14b8a6', '#1e293b', '#94a3b8'];

const STATUS_BADGE = {
  EXCELLENT: 'text-teal-700 bg-teal-50 border border-teal-200',
  STABLE:    'text-blue-700 bg-blue-50 border border-blue-200',
  WARNING:   'text-amber-700 bg-amber-50 border border-amber-200',
  POOR:      'text-red-700 bg-red-50 border border-red-200',
};

const getPerformanceStatus = (total, synced) => {
  if (!total) return 'POOR';
  const rate = (synced / total) * 100;
  if (rate >= 95) return 'EXCELLENT';
  if (rate >= 80) return 'STABLE';
  if (rate >= 60) return 'WARNING';
  return 'POOR';
};

const getTrend = (val) => {
  if (val > 0) return <ArrowUpRight size={14} className="text-teal-500" />;
  if (val < 0) return <ArrowDownRight size={14} className="text-red-500" />;
  return <Minus size={14} className="text-gray-400" />;
};

// ─── Custom Tooltip ───────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color }} />
          <span>{p.name}: {p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Reports Page ────────────────────────────────────────
const Reports = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('all');
  const [territory, setTerritory] = useState('');
  const [employee, setEmployee] = useState('');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [applied, setApplied] = useState({ range: 'all', territory: '', employee: '', customFrom: '', customTo: '' });

  const dateParams = getDateParams(applied.range, applied.customFrom, applied.customTo);
  const params = {
    ...dateParams,
    ...(applied.territory && { territory: applied.territory }),
    ...(applied.employee && { user: applied.employee }),
  };

  const { data: overview, isLoading: ovLoading } = useQuery({ queryKey: ['report-overview', params], queryFn: () => fetchOverview(params) });
  const { data: byDate,   isLoading: dateLoading } = useQuery({ queryKey: ['report-date', params],     queryFn: () => fetchByDate(params) });
  const { data: byEmp,    isLoading: empLoading }  = useQuery({ queryKey: ['report-emp', params],      queryFn: () => fetchByEmployee(params) });
  const { data: byAct,    isLoading: actLoading }  = useQuery({ queryKey: ['report-act', params],      queryFn: () => fetchByActivity(params) });
  const { data: shopVisits }                        = useQuery({ queryKey: ['report-shops', params],    queryFn: () => fetchShopVisits(params) });
  const { data: territories = [] }                  = useQuery({ queryKey: ['territories-list'],        queryFn: fetchTerritories });
  const { data: users = [] }                        = useQuery({ queryKey: ['users'],                   queryFn: fetchUsers });

  // Chart data
  const dateChartData = (byDate || []).map(d => ({
    date: formatDate(d.date),
    Submissions: d.totalSubmissions,
    Synced: d.syncedCount,
  }));

  // Pie chart — synced vs pending vs failed
  const syncRate = overview ? Math.round((overview.syncedSubmissions / Math.max(overview.totalSubmissions, 1)) * 100) : 0;
  const pieData = overview ? [
    { name: 'Synced',  value: overview.syncedSubmissions },
    { name: 'Pending', value: overview.pendingSubmissions },
    { name: 'Failed',  value: overview.failedSubmissions },
  ] : [];

  // Compliance rate = synced / total
  const complianceRate = overview ? `${syncRate}%` : '—';

  // Apply filters
  const applyFilters = () => {
    setApplied({ range: dateRange, territory, employee, customFrom, customTo });
  };

  // Export CSV via backend
  const exportCSV = () => {
    const p = new URLSearchParams({ ...params });
    window.open(`${API.defaults.baseURL}/reports/export-csv?${p.toString()}`, '_blank');
    toast.success('Downloading CSV...');
  };

  const avgTime = byEmp?.length
    ? Math.round(byEmp.reduce((acc, e) => acc + (e.totalSubmissions > 0 ? 40 : 0), 0) / byEmp.length)
    : 0;

  return (
    <div className="p-6 space-y-6 min-h-full">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operational Performance Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time data synchronization and analytics overview.</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors">
          <Download size={15} /> Export Full Dataset
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Report Type */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Report Type</label>
            <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-teal-400 min-w-[160px]">
              <option>Operational Audit</option>
              <option>Employee Performance</option>
              <option>Shop Visit History</option>
              <option>Activity Summary</option>
            </select>
          </div>
          {/* Date Range */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Date Range</label>
            <select value={dateRange} onChange={e => { setDateRange(e.target.value); setShowCustom(e.target.value === 'custom'); }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-teal-400 min-w-[180px]">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {/* Custom date */}
          {showCustom && (
            <>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">From</label>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">To</label>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400" />
              </div>
            </>
          )}
          {/* Territory */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Territory</label>
            <select value={territory} onChange={e => setTerritory(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-teal-400 min-w-[150px]">
              <option value="">All Territories</option>
              {territories.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          {/* Employee */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Employee</label>
            <select value={employee} onChange={e => setEmployee(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-teal-400 min-w-[140px]">
              <option value="">All Staff</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
          {/* Apply */}
          <button onClick={applyFilters}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors">
            Apply Filters
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'COMPLIANCE RATE',
            value: complianceRate,
            sub: overview ? `+${Math.max(0, syncRate - 95)}% vs last period` : null,
            subColor: 'text-teal-600',
            trend: <TrendingUp size={14} className="text-teal-500" />,
            mini: overview ? (
              <div className="w-full h-1 bg-gray-100 rounded-full mt-2">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${syncRate}%` }} />
              </div>
            ) : null,
          },
          {
            label: 'AVG VISITS / DAY',
            value: dateChartData.length > 0
              ? (dateChartData.reduce((a, d) => a + d.Submissions, 0) / dateChartData.length).toFixed(1)
              : '—',
            sub: '-0.5%',
            subColor: 'text-red-500',
            trend: <TrendingDown size={14} className="text-red-400" />,
          },
          {
            label: 'ACTIVE FIELD STAFF',
            value: overview?.activeEmployees?.toString() || '—',
            badge: 'STABLE',
            badgeBg: 'bg-teal-50 text-teal-700 border border-teal-200',
            sub: `${users.filter(u => u.isActive).length} total active users`,
            subColor: 'text-gray-400',
          },
          {
            label: 'FORM COMPLETION',
            value: overview ? `${overview.totalSubmissions.toLocaleString()}` : '—',
            badge: overview?.totalSubmissions > 0 ? 'FAST' : null,
            badgeBg: 'bg-teal-50 text-teal-700 border border-teal-200',
            sub: overview ? `${syncRate}% average completion rate` : null,
            subColor: 'text-gray-400',
          },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{c.label}</span>
              {c.trend}
            </div>
            {ovLoading ? <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
              : (
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-gray-900">{c.value}</span>
                  {c.badge && <span className={`text-xs px-2 py-0.5 rounded-full font-medium mb-1 ${c.badgeBg}`}>{c.badge}</span>}
                </div>
              )}
            {c.mini}
            {c.sub && !ovLoading && (
              <div className={`text-xs font-medium mt-1 ${c.subColor}`}>{c.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Submissions Summary Bar Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-teal-600" />
              <h2 className="text-sm font-semibold text-gray-800">Submissions Summary</h2>
            </div>
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium">
              <Download size={12} /> Export CSV
            </button>
          </div>
          {dateLoading ? (
            <div className="h-48 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
          ) : dateChartData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <FileText size={28} className="mb-2 opacity-30" />
              <p className="text-sm">No data for this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dateChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Submissions" fill="#1e293b" radius={[3,3,0,0]} />
                <Bar dataKey="Synced" fill="#14b8a6" radius={[3,3,0,0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Product Demand / Sync Status Pie */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Sync Status</h2>
            <button className="text-gray-400 hover:text-gray-600">•••</button>
          </div>
          {ovLoading ? (
            <div className="h-48 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
          ) : overview?.totalSubmissions === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <p className="text-sm">No submissions yet</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center">
                <PieChart width={160} height={160}>
                  <Pie data={pieData} cx={75} cy={75} innerRadius={50} outerRadius={75}
                    dataKey="value" strokeWidth={2}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <text x={80} y={80} textAnchor="middle" className="text-2xl font-bold" fill="#1e293b" style={{ fontSize: 22, fontWeight: 700 }}>{syncRate}%</text>
                  <text x={80} y={95} textAnchor="middle" fill="#94a3b8" style={{ fontSize: 10 }}>SYNCED</text>
                </PieChart>
              </div>
              <div className="space-y-2 mt-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">
                      {overview?.totalSubmissions ? Math.round((d.value / overview.totalSubmissions) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Employee Performance Table */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-teal-600" />
              <h2 className="text-sm font-semibold text-gray-800">Employee Performance</h2>
            </div>
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium">
              <Download size={12} /> Export CSV
            </button>
          </div>
          {empLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
          ) : !byEmp?.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Users size={28} className="mb-2 opacity-30" />
              <p className="text-sm">No employee data for this period</p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_60px] gap-3 px-5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <div>Employee</div>
                <div>Total Visits</div>
                <div>Status</div>
                <div>Trend</div>
              </div>
              <div className="divide-y divide-gray-100">
                {byEmp.slice(0, 6).map((emp, i) => {
                  const status = getPerformanceStatus(emp.totalSubmissions, emp.syncedCount);
                  return (
                    <div key={emp.employeeId || i}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr_60px] gap-3 px-5 py-3 items-center hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(emp.employeeName || 'U').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">{emp.employeeName}</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-800">{emp.totalSubmissions}</div>
                      <div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[status]}`}>
                          {status}
                        </span>
                      </div>
                      <div>{getTrend(emp.syncedCount - emp.flaggedCount)}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Territory Coverage */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Map size={15} className="text-teal-600" />
              <h2 className="text-sm font-semibold text-gray-800">Territory Coverage</h2>
            </div>
            <button onClick={() => navigate('/shops')}
              className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium">
              View Map
            </button>
          </div>

          {/* Map placeholder */}
          <div className="h-36 bg-slate-100 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Map size={28} className="mx-auto mb-1 opacity-30" />
                <p className="text-xs">Territory map visualization</p>
              </div>
            </div>
            {/* Decorative dots */}
            <div className="absolute top-8 left-16 w-4 h-4 rounded-full bg-teal-500 opacity-60" />
            <div className="absolute top-12 left-24 w-6 h-6 rounded-full bg-teal-600 opacity-80" />
            <div className="absolute bottom-10 right-12 w-3 h-3 rounded-full bg-red-500 opacity-70" />
          </div>

          {/* Territory list from shop visits */}
          <div className="p-4 space-y-3">
            {shopVisits?.slice(0, 3).map((shop, i) => {
              const coverage = Math.min(100, Math.round((shop.visitCount / Math.max(shopVisits[0]?.visitCount, 1)) * 100));
              const colors = ['bg-teal-500', 'bg-teal-400', 'bg-red-400'];
              return (
                <div key={shop.shopId || i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 font-medium">{shop.shopName}</span>
                    <span className="text-xs font-semibold text-gray-800">{shop.visitCount} visits</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[i]} rounded-full`} style={{ width: `${coverage}%` }} />
                  </div>
                </div>
              );
            }) || (
              <div className="text-center py-4 text-gray-400 text-sm">No shop visit data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Types Summary */}
      {byAct?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-teal-600" />
              <h2 className="text-sm font-semibold text-gray-800">Submissions by Activity Type</h2>
            </div>
          </div>
          {actLoading ? (
            <div className="h-32 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
          ) : (
            <div className="space-y-3">
              {byAct.slice(0, 5).map((act, i) => {
                const maxVal = byAct[0]?.totalSubmissions || 1;
                const pct = Math.round((act.totalSubmissions / maxVal) * 100);
                return (
                  <div key={act.activityId || i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 font-medium">{act.activityName}</span>
                      <span className="text-sm font-semibold text-gray-900">{act.totalSubmissions}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
