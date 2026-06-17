import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, MoreVertical, ChevronLeft, ChevronRight,
  Edit2, Trash2, Loader2, Package, Download,
  RefreshCw, ToggleLeft, ToggleRight, CheckCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import API from '../api/axios';
import toast from 'react-hot-toast';

// ─── API ──────────────────────────────────────────────────────
const fetchProducts = (params) => API.get('/products', { params }).then(r => r.data);

// ─── Helpers ──────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;

const CATEGORY_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700', 'bg-emerald-100 text-emerald-700',
  'bg-orange-100 text-orange-700', 'bg-indigo-100 text-indigo-700',
];
const getCategoryColor = (cat = '') =>
  CATEGORY_COLORS[cat.charCodeAt(0) % CATEGORY_COLORS.length];

// ─── Action Menu ──────────────────────────────────────────────
const ActionMenu = ({ product, onEdit, onDelete, onToggle }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
          <button onClick={() => { onEdit(product); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Edit2 size={14} /> Edit Product
          </button>
          <button onClick={() => { onToggle(product); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            {product.status === 'active'
              ? <><ToggleLeft size={14} /> Deactivate</>
              : <><ToggleRight size={14} /> Activate</>}
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button onClick={() => { onDelete(product); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Delete Modal ─────────────────────────────────────────────
const DeleteModal = ({ product, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Delete Product</h3>
      <p className="text-sm text-gray-500 mb-5">
        Are you sure you want to delete <span className="font-medium text-gray-700">"{product.name}"</span>? This cannot be undone.
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

// ─── Product Modal ────────────────────────────────────────────
const ProductModal = ({ product, onClose, onSave, loading }) => {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    brand: product?.brand || '',
    category: product?.category || '',
    status: product?.status || 'active',
    sortOrder: product?.sortOrder ?? 0,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Product Name <span className="text-red-400">*</span></label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Safety Helmet G2"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">SKU</label>
              <input value={form.sku} onChange={e => set('sku', e.target.value)}
                placeholder="e.g. SH-404-BETA"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Brand</label>
              <input value={form.brand} onChange={e => set('brand', e.target.value)}
                placeholder="e.g. SecureShield"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Category</label>
              <input value={form.category} onChange={e => set('category', e.target.value)}
                placeholder="e.g. Safety, Tools"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={e => set('sortOrder', parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium">Cancel</button>
          <button onClick={() => onSave(form)} disabled={loading || !form.name}
            className="flex-1 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-40 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Products Page ───────────────────────────────────────
const Products = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalProduct, setModalProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(categoryFilter && { category: categoryFilter }),
    ...(statusFilter && { status: statusFilter }),
  };

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => fetchProducts(queryParams),
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(allProducts.length / ITEMS_PER_PAGE));
  const pageProducts = allProducts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Stats
  const totalProducts = allProducts.length;
  const activeProducts = allProducts.filter(p => p.status === 'active').length;
  const inactiveProducts = allProducts.filter(p => p.status === 'inactive').length;
  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];

  // Chart data — products per category
  const chartData = categories.slice(0, 7).map(cat => ({
    name: cat.length > 10 ? cat.slice(0, 10) + '...' : cat,
    count: allProducts.filter(p => p.category === cat).length,
  }));

  // Mutations
  const saveMut = useMutation({
    mutationFn: (payload) => modalProduct?._id
      ? API.put(`/products/${modalProduct._id}`, payload).then(r => r.data)
      : API.post('/products', payload).then(r => r.data),
    onSuccess: () => {
      toast.success(modalProduct?._id ? 'Product updated' : 'Product added');
      qc.invalidateQueries(['products']);
      setModalProduct(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => API.delete(`/products/${id}`).then(r => r.data),
    onSuccess: () => { toast.success('Product deleted'); qc.invalidateQueries(['products']); setDeleteTarget(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Delete failed'),
  });

  const toggleMut = useMutation({
    mutationFn: (p) => API.put(`/products/${p._id}`, {
      status: p.status === 'active' ? 'inactive' : 'active'
    }).then(r => r.data),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['products']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  // Export CSV
  const exportCSV = () => {
    const rows = [['Name', 'SKU', 'Brand', 'Category', 'Status', 'Sort Order']];
    allProducts.forEach(p => rows.push([p.name, p.sku || '', p.brand || '', p.category || '', p.status, p.sortOrder]));
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = 'products.csv';
    a.click();
    toast.success('CSV exported');
  };

  return (
    <div className="p-6 space-y-6 min-h-full">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track global inventory across all field locations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 font-medium transition-colors">
            <Download size={15} /> Export CSV
          </button>
          <button onClick={() => setModalProduct(false)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Products',
            value: totalProducts,
            sub: '+12% this month',
            subIcon: <CheckCircle size={12} className="text-teal-500" />,
            subColor: 'text-teal-600',
          },
          {
            label: 'Active Products',
            value: activeProducts,
            progress: totalProducts ? Math.round((activeProducts / totalProducts) * 100) : 0,
            sub: totalProducts ? `${Math.round((activeProducts / totalProducts) * 100)}% of total` : '0%',
            subColor: 'text-gray-500',
          },
          {
            label: 'Categories',
            value: categories.length,
            sub: categories.length > 0 ? 'Balanced distribution' : 'No categories yet',
            subIcon: <CheckCircle size={12} className="text-teal-500" />,
            subColor: 'text-teal-600',
          },
          {
            label: 'Inactive Products',
            value: inactiveProducts,
            sub: inactiveProducts > 0 ? 'Requires review' : 'All active',
            subIcon: inactiveProducts > 0
              ? <RefreshCw size={12} className="text-amber-500" />
              : <CheckCircle size={12} className="text-green-500" />,
            subColor: inactiveProducts > 0 ? 'text-amber-600' : 'text-green-600',
            valueColor: inactiveProducts > 0 ? 'text-amber-600' : 'text-gray-900',
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
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filter by Name or SKU..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all" />
          </div>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700 min-w-[140px]">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white text-gray-700 min-w-[130px]">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={() => { setSearch(''); setDebouncedSearch(''); setCategoryFilter(''); setStatusFilter(''); setPage(1); }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Reset filters">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2.5fr_1.2fr_1.5fr_1.5fr_1fr_60px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div>Product Name</div>
          <div>SKU</div>
          <div>Brand</div>
          <div>Category</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-gray-300 animate-spin" />
          </div>
        )}

        {!isLoading && pageProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No products found</p>
            <p className="text-xs mt-1">Add a product or adjust your filters</p>
          </div>
        )}

        {!isLoading && pageProducts.map((p, i) => (
          <div key={p._id}
            className={`grid grid-cols-[2.5fr_1.2fr_1.5fr_1.5fr_1fr_60px] gap-3 px-5 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center ${
              i === pageProducts.length - 1 ? 'border-b-0' : ''
            }`}>
            {/* Product Name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Package size={16} className="text-gray-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{p.name}</div>
                {p.category && <div className="text-xs text-gray-400 truncate">{p.category}</div>}
              </div>
            </div>
            {/* SKU */}
            <div className="text-sm font-mono text-gray-600">{p.sku || '—'}</div>
            {/* Brand */}
            <div className="text-sm text-gray-600 truncate">{p.brand || '—'}</div>
            {/* Category */}
            <div>
              {p.category ? (
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide ${getCategoryColor(p.category)}`}>
                  {p.category}
                </span>
              ) : <span className="text-gray-400 text-sm">—</span>}
            </div>
            {/* Status */}
            <div>
              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                p.status === 'active'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'active' ? 'bg-teal-500' : 'bg-gray-400'}`} />
                {p.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
            {/* Actions */}
            <div className="flex justify-center" onClick={e => e.stopPropagation()}>
              <ActionMenu
                product={p}
                onEdit={(prod) => setModalProduct(prod)}
                onDelete={(prod) => setDeleteTarget(prod)}
                onToggle={(prod) => toggleMut.mutate(prod)}
              />
            </div>
          </div>
        ))}

        {/* Pagination */}
        {!isLoading && allProducts.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Showing {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, allProducts.length)} of {allProducts.length} results
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

      {/* Bottom: Chart */}
      {!isLoading && chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Products by Category</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="count" name="Products" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Modals */}
      {modalProduct !== null && (
        <ProductModal
          product={modalProduct || null}
          onClose={() => setModalProduct(null)}
          onSave={(form) => saveMut.mutate(form)}
          loading={saveMut.isPending}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          product={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMut.mutate(deleteTarget._id)}
          loading={deleteMut.isPending}
        />
      )}
    </div>
  );
};

export default Products;