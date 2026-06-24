import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus, ChevronLeft, ChevronRight,
  Edit2, Trash2, Loader2, Activity, Check, X,
  Lightbulb, Link2
} from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const fetchActivities = () => API.get('/activity-types').then(r => r.data);
const ITEMS_PER_PAGE = 8;

const BoolIcon = ({ value }) => value ? (
  <div className="w-7 h-7 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto">
    <Check size={13} className="text-teal-600" strokeWidth={2.5} />
  </div>
) : (
  <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto">
    <X size={13} className="text-gray-400" strokeWidth={2.5} />
  </div>
);

// ─── Delete Modal ─────────────────────────────────────────────
const DeleteModal = ({ activity, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
        <Trash2 size={20} className="text-red-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 text-center mb-1">Delete Activity Type</h3>
      <p className="text-sm text-gray-500 text-center mb-5">
        Are you sure you want to delete <span className="font-medium text-gray-700">"{activity.name}"</span>? This cannot be undone.
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

// ─── Main ActivityTypes Page ──────────────────────────────────
const ActivityTypes = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: allActivities = [], isLoading } = useQuery({
    queryKey: ['activity-types'],
    queryFn: fetchActivities,
  });

  const totalPages = Math.max(1, Math.ceil(allActivities.length / ITEMS_PER_PAGE));
  const pageActivities = allActivities.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const total = allActivities.length;
  const active = allActivities.filter(a => a.isActive).length;
  const requirePhoto = allActivities.filter(a => a.requiresPhoto).length;
  const photoPercent = total ? Math.round((requirePhoto / total) * 100) : 0;
  const linkedForm = allActivities.filter(a => a.formTemplate).length;
  const formSyncRate = total ? Math.round((linkedForm / total) * 100) : 0;

  const deleteMut = useMutation({
    mutationFn: (id) => API.delete(`/activity-types/${id}`).then(r => r.data),
    onSuccess: () => { toast.success('Activity deleted'); qc.invalidateQueries(['activity-types']); setDeleteTarget(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Delete failed'),
  });

  const toggleMut = useMutation({
    mutationFn: (id) => API.put(`/activity-types/${id}/toggle-status`).then(r => r.data),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['activity-types']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="p-6 space-y-6 min-h-full">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Types</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure operational workflows and task requirements.</p>
        </div>
        <button onClick={() => navigate('/activity-types/new')}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} /> Create Activity
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL TYPES', value: total, sub: total > 0 ? `+${Math.min(total, 3)} this month` : null, subColor: 'text-teal-600' },
          { label: 'ACTIVE', value: active },
          { label: 'REQUIRED PHOTOS', value: `${photoPercent}%` },
          { label: 'DRAFTS', value: total - active, sub: total - active > 0 ? 'Inactive types' : 'All active', subColor: 'text-gray-400' },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{c.label}</div>
            {isLoading
              ? <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
              : <div className="text-3xl font-bold text-gray-900">{c.value}</div>}
            {c.sub && !isLoading && (
              <div className={`text-xs font-medium mt-1 ${c.subColor || 'text-gray-400'}`}>{c.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-[2.5fr_1.5fr_1fr_1fr_1fr_1fr_120px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div>Activity Name</div>
          <div>Linked Form</div>
          <div className="text-center">Shop</div>
          <div className="text-center">Location</div>
          <div className="text-center">Photo</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-gray-300 animate-spin" />
          </div>
        )}

        {!isLoading && pageActivities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Activity size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No activity types yet</p>
            <p className="text-xs mt-1">Create your first activity type to get started</p>
          </div>
        )}

        {!isLoading && pageActivities.map((a, i) => (
          <div key={a._id}
            className={`grid grid-cols-[2.5fr_1.5fr_1fr_1fr_1fr_1fr_120px] gap-3 px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center ${
              i === pageActivities.length - 1 ? 'border-b-0' : ''
            }`}>
            {/* Activity Name — click to configure */}
            <div className="min-w-0 cursor-pointer" onClick={() => navigate(`/activity-types/edit/${a._id}`)}>
              <div className="text-sm font-medium text-gray-800 truncate hover:text-teal-600 transition-colors">{a.name}</div>
              {a.description && <div className="text-xs text-gray-400 truncate mt-0.5">{a.description}</div>}
            </div>
            {/* Linked Form */}
            <div className="flex items-center gap-1.5 min-w-0">
              {a.formTemplate ? (
                <>
                  <Link2 size={12} className="text-teal-500 flex-shrink-0" />
                  <span className="text-xs text-teal-700 font-mono truncate">{a.formTemplate?.name || a.formTemplate}</span>
                </>
              ) : (
                <span className="text-xs text-gray-400 italic">No form</span>
              )}
            </div>
            <div className="flex justify-center"><BoolIcon value={a.requiresShop} /></div>
            <div className="flex justify-center"><BoolIcon value={a.requiresLocation} /></div>
            <div className="flex justify-center"><BoolIcon value={a.requiresPhoto} /></div>
            {/* Status — clickable toggle */}
            <div>
              <button onClick={() => toggleMut.mutate(a._id)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                  a.isActive
                    ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                    : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                }`}>
                {a.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-1">
              <button onClick={() => navigate(`/activity-types/edit/${a._id}`)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-teal-600 transition-colors">
                <Edit2 size={15} />
              </button>
              <button onClick={() => setDeleteTarget(a)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}

        {/* Pagination */}
        {!isLoading && allActivities.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, total)} to {Math.min(page * ITEMS_PER_PAGE, total)} of {total} activity types
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

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
            <Lightbulb size={18} className="text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800 mb-1">Operational Tip</div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Enabling "Requires Photo" significantly improves audit reliability. Aim for at least 60% photo coverage across your activity fleet for best performance data.
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-semibold text-gray-800 mb-3">Form Sync Rate</div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${formSyncRate}%` }} />
          </div>
          <p className="text-xs text-gray-500">
            {linkedForm > 0 ? `${formSyncRate}% of activities are currently linked to active forms.` : 'No activities are linked to forms yet.'}
          </p>
        </div>
      </div>

      {deleteTarget && (
        <DeleteModal
          activity={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMut.mutate(deleteTarget._id)}
          loading={deleteMut.isPending}
        />
      )}
    </div>
  );
};

export default ActivityTypes;
