import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Download, ChevronLeft, ChevronRight, MoreVertical,
  Loader2, ClipboardList, MapPin, CheckCircle,
  AlertTriangle, XCircle, RefreshCw, Cloud
} from 'lucide-react';
import API from '../api/axios';

// ─── API ──────────────────────────────────────────────────────
const fetchSubmissions = (params) =>
  API.get('/submissions', { params }).then(r => r.data);
const fetchUsers = () => API.get('/users').then(r => r.data);
const fetchActivities = () => API.get('/activity-types').then(r => r.data);
const fetchTerritories = () => API.get('/territories').then(r => r.data);
const fetchShops = () => API.get('/shops').then(r => r.data);

// ─── Helpers ──────────────────────────────────────────────────
const SYNC_STATUS = {
  synced:    { label: 'Synced',    bg: 'bg-teal-50 text-teal-700 border border-teal-200',    dot: 'bg-teal-500' },
  pending:   { label: 'Pending',   bg: 'bg-amber-50 text-amber-700 border border-amber-200',  dot: 'bg-amber-400' },
  failed:    { label: 'Failed',    bg: 'bg-red-50 text-red-600 border border-red-200',        dot: 'bg-red-500' },
  uploading: { label: 'Uploading', bg: 'bg-blue-50 text-blue-600 border border-blue-200',     dot: 'bg-blue-500' },
  draft:     { label: 'Draft',     bg: 'bg-gray-100 text-gray-500 border border-gray-200',    dot: 'bg-gray-400' },
};

const LOCATION_STATUS = {
  valid:                  { label: 'Verified',        icon: <CheckCircle size={13} className="text-teal-500" /> },
  warning_outside_radius: { label: 'Outside Radius',  icon: <AlertTriangle size={13} className="text-amber-500" /> },
  invalid_no_location:    { label: 'No Location',     icon: <XCircle size={13} className="text-red-500" /> },
  invalid_poor_accuracy:  { label: 'Poor Accuracy',   icon: <AlertTriangle size={13} className="text-red-500" /> },
  not_required:           { label: 'Not Required',    icon: <MapPin size={13} className="text-gray-400" /> },
};

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const formatTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};
const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
const avatarColors = ['bg-teal-600','bg-violet-500','bg-blue-500','bg-emerald-600','bg-rose-500','bg-amber-500'];
const getAvatarColor = (name = '') => avatarColors[name.charCodeAt(0) % avatarColors.length];

// ─── Main Submissions Page ────────────────────────────────────
const Submissions = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);

  // Filters
  const [dateRange, setDateRange] = useState('All Time');
  const [employeeFilter, setEmployeeFilter] = useState(searchParams.get('user') || '');
  const [activityFilter, setActivityFilter] = useState('');
  const [territoryFilter, setTerritoryFilter] = useState('');
  const [shopFilter, setShopFilter] = useState(searchParams.get('shop') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  // Date range compute
  const getDateFrom = () => {
    if (dateRange === 'Today') { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString(); }
    if (dateRange === 'Last 7 Days') return new Date(Date.now() - 7*24*60*60*1000).toISOString();
    if (dateRange === 'Last 30 Days') return new Date(Date.now() - 30*24*60*60*1000).toISOString();
    if (dateRange === 'Last 90 Days') return new Date(Date.now() - 90*24*60*60*1000).toISOString();
    return undefined; // All Time — no filter
  };

  const queryParams = {
    page,
    limit: 10,
    ...(employeeFilter && { user: employeeFilter }),
    ...(activityFilter && { activityType: activityFilter }),
    ...(shopFilter && { shop: shopFilter }),
    ...(statusFilter && { syncStatus: statusFilter }),
    ...(getDateFrom() && { dateFrom: getDateFrom() }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['submissions', queryParams],
    queryFn: () => fetchSubmissions(queryParams),
    keepPreviousData: true,
  });

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  const { data: activities = [] } = useQuery({ queryKey: ['activity-types'], queryFn: fetchActivities });
  const { data: territories = [] } = useQuery({ queryKey: ['territories-list'], queryFn: fetchTerritories });
  const { data: shops = [] } = useQuery({ queryKey: ['shops'], queryFn: fetchShops });

  const submissions = data?.submissions || [];
  const total = data?.total || 0;
  const totalPages = data?.pages || 1;

  // Stats from current result
  const syncRate = submissions.length > 0
    ? Math.round((submissions.filter(s => s.syncStatus === 'synced').length / submissions.length) * 100)
    : 0;
  const failedCount = submissions.filter(s => s.syncStatus === 'failed').length;

  // Export CSV
  const exportCSV = () => {
    const rows = [['Date', 'Time', 'Employee', 'Activity', 'Shop', 'Territory', 'Location Status', 'Sync Status']];
    submissions.forEach(s => {
      rows.push([
        formatDate(s.createdAt),
        formatTime(s.createdAt),
        s.user?.name || '',
        s.activityType?.name || '',
        s.shop?.name || '',
        '',
        s.location?.validationStatus || '',
        s.syncStatus || '',
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = 'submissions.csv';
    a.click();
  };

  return (
    <div className="p-6 space-y-6 min-h-full">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and manage field operational data entries.</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Date Range */}
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1">Date Range</label>
            <select value={dateRange} onChange={e => { setDateRange(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-gray-700">
              <option>All Time</option>
              <option>Today</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>
          {/* Employee */}
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1">Employee</label>
            <select value={employeeFilter} onChange={e => { setEmployeeFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-gray-700">
              <option value="">All Employees</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
          {/* Activity Type */}
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1">Activity Type</label>
            <select value={activityFilter} onChange={e => { setActivityFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-gray-700">
              <option value="">All Activities</option>
              {activities.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
          {/* Territory */}
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1">Territory</label>
            <select value={territoryFilter} onChange={e => { setTerritoryFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-gray-700">
              <option value="">All Territories</option>
              {territories.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          {/* Shop */}
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1">Shop</label>
            <select value={shopFilter} onChange={e => { setShopFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-gray-700">
              <option value="">All Shops</option>
              {shops.slice(0,50).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          {/* Status */}
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1">Status</label>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 text-gray-700">
              <option value="">All Statuses</option>
              <option value="synced">Synced</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="uploading">Uploading</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1.5fr_1.5fr_1.5fr_1.5fr_1.2fr_1.3fr_1.3fr] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div>Submitted At</div>
          <div>Employee</div>
          <div>Activity</div>
          <div>Shop</div>
          <div>Territory</div>
          <div>Location Status</div>
          <div>Status</div>
          <div></div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-gray-300 animate-spin" />
          </div>
        )}

        {!isLoading && submissions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ClipboardList size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No submissions found</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </div>
        )}

        {!isLoading && submissions.map((s, i) => {
          const sync = SYNC_STATUS[s.syncStatus] || SYNC_STATUS.draft;
          const loc = LOCATION_STATUS[s.location?.validationStatus] || LOCATION_STATUS.not_required;
          const isFailed = s.syncStatus === 'failed';
          const isGPSMismatch = s.location?.validationStatus === 'warning_outside_radius';

          return (
            <div key={s._id}
              onClick={() => navigate(`/submissions/${s._id}`)}
              className={`grid grid-cols-[1.5fr_1.5fr_1.5fr_1.5fr_1.2fr_1.3fr_1.3fr] gap-3 px-5 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center cursor-pointer ${
                i === submissions.length - 1 ? 'border-b-0' : ''
              }`}>
              {/* Submitted At */}
              <div>
                <div className="text-sm font-medium text-gray-800">{formatDate(s.createdAt)}</div>
                <div className="text-xs text-gray-400">{formatTime(s.createdAt)}</div>
              </div>
              {/* Employee */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-full ${getAvatarColor(s.user?.name || '')} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {getInitials(s.user?.name || 'U')}
                </div>
                <span className="text-sm text-gray-700 truncate">{s.user?.name || '—'}</span>
              </div>
              {/* Activity */}
              <div>
                {s.activityType?.name ? (
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                    {s.activityType.name}
                  </span>
                ) : <span className="text-gray-400 text-sm">—</span>}
              </div>
              {/* Shop */}
              <div className="min-w-0">
                <div className="text-sm text-gray-700 truncate">{s.shop?.name || '—'}</div>
                {s.shop?.area && <div className="text-xs text-gray-400 truncate">{s.shop.area}</div>}
              </div>
              {/* Territory */}
              <div className="text-sm text-gray-600">{s.shop?.city || '—'}</div>
              {/* Location Status */}
              <div>
                {isGPSMismatch ? (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-red-500" />
                    <span className="text-xs text-red-600 font-medium">GPS Mismatch</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {loc.icon}
                    <span className="text-xs text-gray-600">{loc.label}</span>
                  </div>
                )}
              </div>
              {/* Sync Status */}
              <div>
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${sync.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sync.dot}`} />
                  {sync.label}
                </span>
              </div>
              {/* Actions */}
              {/* <div onClick={e => e.stopPropagation()} className="flex justify-center">
                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <MoreVertical size={15} />
                </button>
              </div> */}
            </div>
          );
        })}

        {/* Pagination */}
        {!isLoading && total > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Showing 1 – {Math.min(page * 10, total)} of {total} submissions
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 text-gray-600 font-medium">
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pg = i + 1;
                if (totalPages > 5 && page > 3) pg = page - 2 + i;
                if (pg > totalPages) return null;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === pg ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}>{pg}</button>
                );
              })}
              {totalPages > 5 && page < totalPages - 2 && (
                <><span className="text-gray-400 px-1">...</span>
                  <button onClick={() => setPage(totalPages)}
                    className="w-8 h-8 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">{totalPages}</button>
                </>
              )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 text-gray-600 font-medium">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Sync Rate',
            value: `${syncRate}%`,
            icon: <Cloud size={20} className="text-teal-500" />,
            bg: 'bg-teal-50',
          },
          {
            label: 'Queue Depth',
            value: `${submissions.filter(s => s.syncStatus === 'pending').length} Entries`,
            icon: <ClipboardList size={20} className="text-amber-500" />,
            bg: 'bg-amber-50',
          },
          {
            label: 'Avg. Upload',
            value: '1.4s',
            icon: <RefreshCw size={20} className="text-blue-500" />,
            bg: 'bg-blue-50',
          },
          {
            label: 'Validation Failures',
            value: `${failedCount > 0 ? ((failedCount / Math.max(submissions.length, 1)) * 100).toFixed(1) : 0}%`,
            icon: <AlertTriangle size={20} className="text-red-500" />,
            bg: 'bg-red-50',
          },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
              {c.icon}
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">{c.label}</div>
              <div className="text-lg font-bold text-gray-900">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
          Last sync: just now
        </div>
        <span>© 2024 FieldOps Operational Intelligence</span>
      </div>
    </div>
  );
};

export default Submissions;
