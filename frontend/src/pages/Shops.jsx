import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, MoreVertical, ChevronLeft, ChevronRight,
  Edit2, Trash2, Loader2, Store, AlertTriangle,
  CheckCircle, Filter, ToggleLeft, ToggleRight, RefreshCw
} from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

// ─── API ──────────────────────────────────────────────────────
const fetchShops = (params) => API.get('/shops', { params }).then(r => r.data);
const fetchTerritories = () => API.get('/territories').then(r => r.data);

// ─── Helpers ──────────────────────────────────────────────────
const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const avatarColors = [
  'bg-teal-100 text-teal-700', 'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700', 'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700', 'bg-emerald-100 text-emerald-700',
];
const getAvatarColor = (name = '') => avatarColors[name.charCodeAt(0) % avatarColors.length];

const STATUS_STYLES = {
  active:   'bg-teal-50 text-teal-700 border border-teal-200',
  pending:  'bg-amber-50 text-amber-700 border border-amber-200',
  failed:   'bg-red-50 text-red-600 border border-red-200',
  inactive: 'bg-gray-100 text-gray-500 border border-gray-200',
};
const STATUS_DOT = {
  active: 'bg-teal-500', pending: 'bg-amber-400',
  failed: 'bg-red-500', inactive: 'bg-gray-400',
};

const ITEMS_PER_PAGE = 10;

// ─── Action Menu ──────────────────────────────────────────────
const ActionMenu = ({ shop, onEdit, onDelete, onToggleStatus }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative" data-action="menu">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
          <button onClick={(e) => { e.stopPropagation(); onEdit(shop); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Edit2 size={14} /> Edit Shop
          </button>
          <button onClick={(e) => { e.stopPropagation(); onToggleStatus(shop); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            {shop.status === 'active'
              ? <><ToggleLeft size={14} /> Deactivate</>
              : <><ToggleRight size={14} /> Activate</>}
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button onClick={(e) => { e.stopPropagation(); onDelete(shop); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
            <Trash2 size={14} /> Delete Shop
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Delete Modal ─────────────────────────────────────────────
const DeleteModal = ({ shop, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Delete Shop</h3>
      <p className="text-sm text-gray-500 mb-5">
        Are you sure you want to delete <span className="font-medium text-gray-700">"{shop.name}"</span>? This cannot be undone.
      </p>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium">Cancel</button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40 flex items-center justify-center gap-2">
          {loading && <Loader2 size={14} className="animate-spin" />} Delete
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Shops Page ──────────────────────────────────────────
const Shops = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [territoryFilter, setTerritoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [shopTypeFilter, setShopTypeFilter] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(territoryFilter && { territory: territoryFilter }),
    ...(statusFilter && { status: statusFilter }),
    ...(cityFilter && { city: cityFilter }),
  };

  const { data: allShops = [], isLoading } = useQuery({
    queryKey: ['shops', queryParams],
    queryFn: () => fetchShops(queryParams),
  });

  const { data: territories = [] } = useQuery({
    queryKey: ['territories-list'],
    queryFn: fetchTerritories,
  });

  // Client-side shopType filter
  const filteredShops = shopTypeFilter
    ? allShops.filter(s => s.shopType === shopTypeFilter)
    : allShops;
  const activeFiltersCount = [cityFilter, shopTypeFilter].filter(Boolean).length;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredShops.length / ITEMS_PER_PAGE));
  const pageShops = filteredShops.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Stats
  const totalShops = allShops.length;
  const activeShops = allShops.filter(s => s.status === 'active').length;
  const pendingShops = allShops.filter(s => s.status === 'pending').length;
  const failedShops = allShops.filter(s => s.status === 'failed').length;

  // Mutations
  const deleteMut = useMutation({
    mutationFn: (id) => API.delete(`/shops/${id}`).then(r => r.data),
    onSuccess: () => { toast.success('Shop deleted'); qc.invalidateQueries(['shops']); setDeleteTarget(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Delete failed'),
  });

  const toggleMut = useMutation({
    mutationFn: (shop) => API.put(`/shops/${shop._id}`, {
      status: shop.status === 'active' ? 'inactive' : 'active'
    }).then(r => r.data),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['shops']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="p-6 space-y-6 min-h-full">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shops</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and monitor field-registered store locations and their operators.</p>
        </div>
        <button
          onClick={() => navigate('/shops/new')}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} /> Add Shop
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Shops', value: totalShops,
            sub: '+12% this month',
            subIcon: <CheckCircle size={12} className="text-teal-500" />,
            subColor: 'text-teal-600',
          },
          {
            label: 'Active Shops', value: activeShops,
            progress: totalShops ? Math.round((activeShops / totalShops) * 100) : 0,
            sub: totalShops ? `${Math.round((activeShops / totalShops) * 100)}% of total` : '0%',
            subColor: 'text-gray-500',
          },
          {
            label: 'Pending Verification', value: pendingShops,
            sub: pendingShops > 0 ? 'Awaiting approval' : 'All verified',
            subIcon: pendingShops > 0
              ? <RefreshCw size={12} className="text-amber-500" />
              : <CheckCircle size={12} className="text-green-500" />,
            subColor: pendingShops > 0 ? 'text-amber-600' : 'text-green-600',
            valueColor: pendingShops > 0 ? 'text-amber-600' : 'text-gray-900',
          },
          {
            label: 'Failed / Alerts', value: failedShops,
            sub: failedShops > 0 ? 'Requires attention' : 'No alerts',
            subIcon: failedShops > 0
              ? <AlertTriangle size={12} className="text-red-500" />
              : <CheckCircle size={12} className="text-green-500" />,
            subColor: failedShops > 0 ? 'text-red-500' : 'text-green-600',
            valueColor: failedShops > 0 ? 'text-red-500' : 'text-gray-900',
          },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
            <div className="text-sm text-gray-500 font-medium">{c.label}</div>
            {isLoading
              ? <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
              : <div className={`text-3xl font-bold ${c.valueColor || 'text-gray-900'}`}>{c.value.toLocaleString()}</div>}
            {c.progress !== undefined && !isLoading && (
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${c.progress}%` }} />
              </div>
            )}
            {c.sub && !isLoading && (
              <div className={`flex items-center gap-1.5 text-xs font-medium ${c.subColor}`}>
                {c.subIcon}{c.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, owner, or area..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Territory:</span>
            <select value={territoryFilter} onChange={e => { setTerritoryFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700">
              <option value="">All Territories</option>
              {territories.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Status:</span>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button
            onClick={() => setShowMoreFilters(v => !v)}
            className={`ml-auto flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
              showMoreFilters || activeFiltersCount > 0
                ? 'bg-teal-50 border-teal-300 text-teal-700'
                : 'text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            <Filter size={14} /> More Filters
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-bold ml-1">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {showMoreFilters && (
          <div className="border-t border-gray-100 pt-3 mt-3 flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">City</label>
              <input value={cityFilter} onChange={e => { setCityFilter(e.target.value); setPage(1); }}
                placeholder="e.g. Lahore"
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 w-44" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Shop Type</label>
              <select value={shopTypeFilter} onChange={e => { setShopTypeFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700 w-44">
                <option value="">All Types</option>
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="distributor">Distributor</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="grocery">Grocery</option>
                <option value="other">Other</option>
              </select>
            </div>
            {activeFiltersCount > 0 && (
              <button onClick={() => { setCityFilter(''); setShopTypeFilter(''); setPage(1); }}
                className="px-3 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors">
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-[2.5fr_1.5fr_1.5fr_2fr_1.5fr_1.2fr_60px] gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div>Shop Name</div>
          <div>Shopkeeper</div>
          <div>Phone</div>
          <div>Area</div>
          <div>Created By</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-gray-300 animate-spin" />
          </div>
        )}

        {!isLoading && pageShops.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Store size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No shops found</p>
            <p className="text-xs mt-1">Try adjusting your filters or add a new shop</p>
          </div>
        )}

        {!isLoading && pageShops.map((shop, i) => (
          <div key={shop._id}
            onClick={() => navigate(`/shops/${shop._id}`)}
            className={`grid grid-cols-[2.5fr_1.5fr_1.5fr_2fr_1.5fr_1.2fr_60px] gap-3 px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center cursor-pointer ${
              i === pageShops.length - 1 ? 'border-b-0' : ''
            }`}>
            {/* Shop Name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${getAvatarColor(shop.name)}`}>
                {getInitials(shop.name)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{shop.name}</div>
                <div className="text-xs text-gray-400">ID: {shop.shopCode || shop._id.slice(-6).toUpperCase()}</div>
              </div>
            </div>
            <div className="text-sm text-gray-600 truncate">{shop.ownerName || '—'}</div>
            <div className="text-sm text-gray-600">{shop.phone || '—'}</div>
            <div className="min-w-0">
              <div className="text-sm text-gray-700 truncate">{shop.area || '—'}</div>
              {shop.city && <div className="text-xs text-gray-400">{shop.city}</div>}
            </div>
            <div className="flex items-center gap-2">
              {shop.createdBy ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold flex-shrink-0">
                    {getInitials(shop.createdBy.name || '')}
                  </div>
                  <span className="text-sm text-gray-600 truncate">{shop.createdBy.name}</span>
                </>
              ) : <span className="text-sm text-gray-400">—</span>}
            </div>
            <div>
              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[shop.status] || STATUS_STYLES.inactive}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[shop.status] || 'bg-gray-400'}`} />
                {shop.status ? shop.status.charAt(0).toUpperCase() + shop.status.slice(1) : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-center" onClick={e => e.stopPropagation()}>
              <ActionMenu
                shop={shop}
                onEdit={(s) => navigate(`/shops/edit/${s._id}`)}
                onDelete={(s) => setDeleteTarget(s)}
                onToggleStatus={(s) => toggleMut.mutate(s)}
              />
            </div>
          </div>
        ))}

        {/* Pagination */}
        {!isLoading && allShops.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, filteredShops.length)} of {filteredShops.length} results
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-500">
                <ChevronLeft size={16} />
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
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-500">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          shop={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMut.mutate(deleteTarget._id)}
          loading={deleteMut.isPending}
        />
      )}
    </div>
  );
};

export default Shops;
