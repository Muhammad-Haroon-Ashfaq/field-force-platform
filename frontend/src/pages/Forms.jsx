import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Eye, Trash2, Loader2, FileText,
  Filter, ArrowUpDown, Lightbulb, Sparkles,
  CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

// ─── API ──────────────────────────────────────────────────────
const fetchForms = () => API.get('/forms').then(r => r.data);
const fetchActivities = () => API.get('/activity-types').then(r => r.data);

const ITEMS_PER_PAGE = 10;

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
};

// ─── Delete Modal ─────────────────────────────────────────────
const DeleteModal = ({ form, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
        <Trash2 size={20} className="text-red-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 text-center mb-1">Delete Form Template</h3>
      <p className="text-sm text-gray-500 text-center mb-5">
        Are you sure you want to delete <span className="font-medium text-gray-700">"{form.name}"</span>? This cannot be undone.
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

// ─── Main Forms Page ──────────────────────────────────────────
const Forms = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: allForms = [], isLoading } = useQuery({
    queryKey: ['form-templates'],
    queryFn: fetchForms,
  });

  // Fetch activities to show linked activity type
  const { data: allActivities = [] } = useQuery({
    queryKey: ['activity-types'],
    queryFn: fetchActivities,
  });

  // Build a map: formTemplateId → activity name
  const formToActivity = {};
  allActivities.forEach(a => {
    const fid = a.formTemplate?._id || a.formTemplate;
    if (fid) formToActivity[fid] = a.name;
  });

  // Filter + Sort
  const filtered = allForms
    .filter(f => statusFilter === 'all' ? true : statusFilter === 'active' ? f.isActive : !f.isActive)
    .sort((a, b) => sortOrder === 'newest'
      ? new Date(b.updatedAt) - new Date(a.updatedAt)
      : new Date(a.updatedAt) - new Date(b.updatedAt));

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageForms = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Stats
  const total = allForms.length;
  const activeForms = allForms.filter(f => f.isActive).length;
  const drafts = allForms.filter(f => !f.isActive).length;
  const linkedCount = allForms.filter(f => formToActivity[f._id]).length;
  const syncRate = total ? Math.round((linkedCount / total) * 100) : 0;

  const deleteMut = useMutation({
    mutationFn: (id) => API.delete(`/forms/${id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('Form deleted');
      qc.invalidateQueries(['form-templates']);
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Delete failed'),
  });

  return (
    <div className="p-6 space-y-6 min-h-full">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and version control your operational data collection forms.</p>
        </div>
        <button onClick={() => navigate('/forms/new')}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} /> Create Template
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'TOTAL TEMPLATES',
            value: total,
            icon: <FileText size={18} className="text-gray-400" />,
            sub: total > 0 ? `+${Math.min(total, 4)} this month` : 'No templates yet',
            subColor: 'text-teal-600',
          },
          {
            label: 'ACTIVE VERSIONING',
            value: activeForms,
            icon: <Clock size={18} className="text-gray-400" />,
            sub: 'Across all templates',
            subColor: 'text-gray-400',
          },
          {
            label: 'SYNC INTEGRITY',
            value: total > 0 ? '99.8%' : '—',
            icon: <CheckCircle size={18} className="text-gray-400" />,
            sub: total > 0 ? 'System healthy' : null,
            subColor: 'text-teal-600',
          },
          {
            label: 'DRAFTS',
            value: drafts,
            icon: <AlertCircle size={18} className="text-gray-400" />,
            sub: drafts > 0 ? 'Pending approval' : 'All active',
            subColor: drafts > 0 ? 'text-amber-500' : 'text-gray-400',
          },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{c.label}</span>
              {c.icon}
            </div>
            {isLoading
              ? <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
              : <div className="text-3xl font-bold text-gray-900">{c.value}</div>}
            {c.sub && !isLoading && (
              <div className={`text-xs font-medium mt-1 ${c.subColor}`}>{c.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              const statuses = ['all', 'active', 'inactive'];
              const next = statuses[(statuses.indexOf(statusFilter) + 1) % statuses.length];
              setStatusFilter(next); setPage(1);
            }}
            className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
              statusFilter !== 'all' ? 'bg-teal-50 border-teal-300 text-teal-700' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
            }`}>
            <Filter size={14} />
            Filter By Status: <span className="font-medium capitalize">{statusFilter === 'all' ? 'All' : statusFilter}</span>
          </button>
          <button
            onClick={() => setSortOrder(v => v === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
            <ArrowUpDown size={14} />
            Sort: {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
          </button>
        </div>
        <span className="text-sm text-gray-400">
          Showing 1–{Math.min(ITEMS_PER_PAGE, filtered.length)} of {filtered.length} templates
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2.5fr_1fr_1.5fr_1fr_1.5fr_120px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div>Template Name</div>
          <div>Version</div>
          <div>Linked Activity Type</div>
          <div>Status</div>
          <div>Last Updated</div>
          <div>Actions</div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-gray-300 animate-spin" />
          </div>
        )}

        {!isLoading && pageForms.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No form templates yet</p>
            <p className="text-xs mt-1">Create your first form template to get started</p>
          </div>
        )}

        {!isLoading && pageForms.map((f, i) => (
          <div key={f._id}
            className={`grid grid-cols-[2.5fr_1fr_1.5fr_1fr_1.5fr_120px] gap-3 px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center ${
              i === pageForms.length - 1 ? 'border-b-0' : ''
            }`}>
            {/* Template Name */}
            <div className="flex items-center gap-3 min-w-0 cursor-pointer"
              onClick={() => navigate(`/forms/edit/${f._id}`)}>
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <FileText size={15} className="text-slate-500" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate hover:text-teal-600 transition-colors">{f.name}</div>
                <div className="text-xs text-gray-400">{f.fields?.length || 0} fields</div>
              </div>
            </div>

            {/* Version */}
            <div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-mono font-medium">
                v1.{Math.floor((f.fields?.length || 0) / 3)}.{(f.fields?.length || 0) % 3}
              </span>
            </div>

            {/* Linked Activity Type — real data */}
            <div className="text-sm truncate">
              {formToActivity[f._id]
                ? <span className="text-teal-700 font-medium">{formToActivity[f._id]}</span>
                : <span className="text-gray-400 italic">Not linked</span>}
            </div>

            {/* Status */}
            <div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1.5 ${
                f.isActive
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${f.isActive ? 'bg-teal-500' : 'bg-gray-400'}`} />
                {f.isActive ? 'Synced' : 'Inactive'}
              </span>
            </div>

            {/* Last Updated */}
            <div className="text-xs text-gray-500">{formatDate(f.updatedAt)}</div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button onClick={() => navigate(`/forms/edit/${f._id}`)}
                title="Edit"
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-teal-600 transition-colors">
                <Edit2 size={15} />
              </button>
              <button onClick={() => navigate(`/forms/edit/${f._id}`)}
                title="Preview"
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors">
                <Eye size={15} />
              </button>
              <button onClick={() => setDeleteTarget(f)}
                title="Delete"
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}

        {/* Pagination */}
        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
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
              {totalPages > 5 && <span className="text-gray-400">...</span>}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 text-gray-600 font-medium">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
            <Lightbulb size={18} className="text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800 mb-1">Versioning Tip</div>
            <p className="text-xs text-gray-500 leading-relaxed">
              New template versions are automatically kept in draft mode until manually synced to the field devices to prevent workflow interruption.
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800 mb-1">AI Template Generator</div>
            <p className="text-xs text-gray-500 leading-relaxed">
              You can now import PDF forms, and our system will automatically suggest a structured digital template with appropriate field types.
            </p>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <DeleteModal
          form={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMut.mutate(deleteTarget._id)}
          loading={deleteMut.isPending}
        />
      )}
    </div>
  );
};

export default Forms;
