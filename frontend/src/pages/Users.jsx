import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, Search, Download, Filter, MoreVertical,
  ChevronLeft, ChevronRight, CheckSquare, Square,
  Edit2, Trash2, KeyRound,
  Loader2, Users as UsersIcon, Zap, BriefcaseIcon, Mail,
  Eye, EyeOff, Phone, MapPin, Shield
} from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

// ─── API ──────────────────────────────────────────────────────
const fetchUsers = (params) => API.get('/users', { params }).then(r => r.data);
const deleteUser = (id) => API.delete(`/users/${id}`).then(r => r.data);
const toggleStatus = (id) => API.put(`/users/${id}/toggle-status`).then(r => r.data);
const resetPassword = (id, newPassword) =>
  API.put(`/users/${id}/reset-password`, { newPassword }).then(r => r.data);

// ─── Helpers ──────────────────────────────────────────────────
const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const avatarColors = [
  'bg-teal-600', 'bg-emerald-600', 'bg-violet-500',
  'bg-blue-500', 'bg-rose-500', 'bg-amber-500', 'bg-slate-500'
];
const getAvatarColor = (name = '') => {
  const i = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[i];
};

const STATUS_STYLES = {
  active:   'bg-teal-50 text-teal-700 border border-teal-200',
  inactive: 'bg-gray-100 text-gray-500 border border-gray-200',
};

const ROLES = ['company_admin', 'manager', 'employee'];

const formatRole = (r = '') => r.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
const timeAgo = (date) => {
  if (!date) return '—';
  const diff = Date.now() - new Date(date);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
};

const ITEMS_PER_PAGE = 10;

// ─── Row Action Menu ──────────────────────────────────────────
const ActionMenu = ({ user, onEdit, onDelete, onResetPw }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
          <button onClick={() => { onEdit(user); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Edit2 size={14} /> Edit User
          </button>
          <button onClick={() => { onResetPw(user); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <KeyRound size={14} /> Reset Password
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button onClick={() => { onDelete(user); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
            <Trash2 size={14} /> Delete User
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Reset Password Modal ─────────────────────────────────────
const ResetPasswordModal = ({ user, onClose, onConfirm, loading }) => {
  const [step, setStep] = useState('confirm');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        {step === 'confirm' ? (
          <>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <KeyRound size={22} className="text-amber-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-1">Reset Password?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              Are you sure you want to reset the password for{' '}
              <span className="font-semibold text-gray-700">{user.name}</span>?
            </p>
            <div className="flex gap-2">
              <button onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium">
                Cancel
              </button>
              <button onClick={() => setStep('enter')}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors">
                Yes, Reset
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Set New Password</h3>
            <p className="text-sm text-gray-500 mb-4">
              Enter new password for <span className="font-medium text-gray-700">{user.name}</span>
            </p>
            <div className="relative mb-4">
              <input
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                autoFocus
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('confirm')}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium">
                Back
              </button>
              <button onClick={() => onConfirm(pw)} disabled={pw.length < 8 || loading}
                className="flex-1 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-40 flex items-center justify-center gap-2">
                {loading && <Loader2 size={14} className="animate-spin" />} Confirm Reset
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────
const DeleteModal = ({ user, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Delete User</h3>
      <p className="text-sm text-gray-500 mb-5">
        Are you sure you want to delete <span className="font-medium text-gray-700">{user.name}</span>? This action cannot be undone.
      </p>
      <div className="flex gap-2">
        <button onClick={onClose}
          className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40 flex items-center justify-center gap-2">
          {loading && <Loader2 size={14} className="animate-spin" />} Delete
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Users Page ──────────────────────────────────────────
const Users = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(roleFilter && { role: roleFilter }),
    ...(statusFilter && { isActive: statusFilter === 'active' }),
  };

  const { data: usersRaw, isLoading } = useQuery({
    queryKey: ['users', queryParams],
    queryFn: () => fetchUsers(queryParams),
  });

  const allUsers = usersRaw || [];
  const totalPages = Math.max(1, Math.ceil(allUsers.length / ITEMS_PER_PAGE));
  const pageUsers = allUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const totalUsers = allUsers.length;
  const activeNow = allUsers.filter(u => u.isActive).length;
  const fieldAgents = allUsers.filter(u => u.role === 'employee').length;
  const pendingInvite = allUsers.filter(u => !u.isActive).length;

  const deleteMut = useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => { toast.success('User deleted'); qc.invalidateQueries(['users']); setDeleteTarget(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Delete failed'),
  });

  const toggleMut = useMutation({
    mutationFn: (id) => toggleStatus(id),
    onSuccess: (data) => { toast.success(data.message); qc.invalidateQueries(['users']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const resetPwMut = useMutation({
    mutationFn: ({ id, pw }) => resetPassword(id, pw),
    onSuccess: () => { toast.success('Password reset successfully'); setResetTarget(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Reset failed'),
  });

  const allSelected = pageUsers.length > 0 && pageUsers.every(u => selected.includes(u._id));
  const toggleAll = () => {
    if (allSelected) setSelected(s => s.filter(id => !pageUsers.find(u => u._id === id)));
    else setSelected(s => [...new Set([...s, ...pageUsers.map(u => u._id)])]);
  };
  const toggleOne = (id) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const exportCSV = () => {
    const rows = [['Name', 'Email', 'Role', 'Phone', 'Status', 'Territory']];
    allUsers.forEach(u => rows.push([u.name, u.email, u.role, u.phone || '', u.isActive ? 'Active' : 'Inactive', u.territory?.name || '']));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = 'users.csv'; a.click();
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-full">

      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage organization members, roles, and field permissions.</p>
        </div>
        <button onClick={() => navigate('/users/new')}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Users', value: totalUsers, icon: <UsersIcon size={18} className="text-teal-500" />, sub: null },
          { label: 'Active Now', value: activeNow, icon: <Zap size={18} className="text-teal-500" />, sub: `${totalUsers ? Math.round(activeNow/totalUsers*100) : 0}% active rate` },
          { label: 'Field Agents', value: fieldAgents, icon: <BriefcaseIcon size={18} className="text-teal-500" />, sub: 'Employees' },
          { label: 'Inactive', value: pendingInvite, icon: <Mail size={18} className="text-teal-500" />, sub: 'Deactivated accounts' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm text-gray-500 font-medium">{c.label}</span>
              {c.icon}
            </div>
            {isLoading
              ? <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" />
              : <div className="text-2xl sm:text-3xl font-bold text-gray-900">{c.value.toLocaleString()}</div>}
            {c.sub && <div className="text-xs text-gray-400 mt-1 hidden sm:block">{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or ID..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Role Filter */}
            <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
              className="flex-1 sm:flex-none px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-white text-gray-700">
              <option value="">All Roles</option>
              {ROLES.map(r => <option key={r} value={r}>{formatRole(r)}</option>)}
            </select>
            {/* Status Filter */}
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="flex-1 sm:flex-none px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-white text-gray-700">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="flex items-center gap-1 ml-auto sm:ml-0">
              {selected.length > 0 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {selected.length} selected
                </span>
              )}
              <button onClick={exportCSV}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Export CSV">
                <Download size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── DESKTOP TABLE (md+) ── */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-[40px_2fr_1fr_2fr_1.5fr_1fr_1fr_60px] gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div className="flex items-center">
            <button onClick={toggleAll}>
              {allSelected ? <CheckSquare size={16} className="text-teal-500" /> : <Square size={16} className="text-gray-400" />}
            </button>
          </div>
          <div>Name</div>
          <div>Role</div>
          <div>Contact</div>
          <div>Territory</div>
          <div>Status</div>
          <div>Last Activity</div>
          <div>Actions</div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-gray-300 animate-spin" />
          </div>
        )}

        {!isLoading && pageUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <UsersIcon size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No users found</p>
            <p className="text-xs mt-1">Try adjusting your filters or add a new user</p>
          </div>
        )}

        {!isLoading && pageUsers.map((u, i) => (
          <div key={u._id}
            className={`grid grid-cols-[40px_2fr_1fr_2fr_1.5fr_1fr_1fr_60px] gap-3 px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center ${i === pageUsers.length - 1 ? 'border-b-0' : ''}`}>
            <button onClick={() => toggleOne(u._id)}>
              {selected.includes(u._id)
                ? <CheckSquare size={16} className="text-teal-500" />
                : <Square size={16} className="text-gray-300" />}
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-full ${getAvatarColor(u.name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {getInitials(u.name)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{u.name}</div>
                <div className="text-xs text-gray-400">ID: {u.employeeCode || u._id.slice(-6).toUpperCase()}</div>
              </div>
            </div>
            <div className="text-sm text-gray-600 capitalize">{formatRole(u.role)}</div>
            <div className="min-w-0">
              <div className="text-sm text-gray-700 truncate">{u.email}</div>
              <div className="text-xs text-gray-400">{u.phone || '—'}</div>
            </div>
            <div className="text-sm text-gray-600">
              {u.territory?.name || (typeof u.territory === 'string' && u.territory) || '—'}
            </div>
            <div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.isActive ? STATUS_STYLES.active : STATUS_STYLES.inactive}`}>
                {u.isActive ? '● Active' : '● Inactive'}
              </span>
            </div>
            <div className="text-sm text-gray-500">{timeAgo(u.updatedAt)}</div>
            <div className="flex justify-center">
              <ActionMenu
                user={u}
                onEdit={(usr) => navigate(`/users/edit/${usr._id}`)}
                onDelete={(usr) => setDeleteTarget(usr)}
                onToggle={(usr) => toggleMut.mutate(usr._id)}
                onResetPw={(usr) => setResetTarget(usr)}
              />
            </div>
          </div>
        ))}

        {/* Pagination */}
        {!isLoading && allUsers.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, allUsers.length)} of {allUsers.length} entries
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
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-500">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MOBILE CARDS (below md) ── */}
      <div className="md:hidden space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-gray-300 animate-spin" />
          </div>
        )}

        {!isLoading && pageUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
            <UsersIcon size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No users found</p>
            <p className="text-xs mt-1">Try adjusting your filters or add a new user</p>
          </div>
        )}

        {!isLoading && pageUsers.map(u => (
          <div key={u._id} className="bg-white rounded-xl border border-gray-200 p-4">
            {/* Top row: avatar + name + action menu */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-full ${getAvatarColor(u.name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {getInitials(u.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{u.name}</div>
                  <div className="text-xs text-gray-400">ID: {u.employeeCode || u._id.slice(-6).toUpperCase()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? STATUS_STYLES.active : STATUS_STYLES.inactive}`}>
                  {u.isActive ? 'Active' : 'Inactive'}
                </span>
                <ActionMenu
                  user={u}
                  onEdit={(usr) => navigate(`/users/edit/${usr._id}`)}
                  onDelete={(usr) => setDeleteTarget(usr)}
                  onToggle={(usr) => toggleMut.mutate(usr._id)}
                  onResetPw={(usr) => setResetTarget(usr)}
                />
              </div>
            </div>

            {/* Info rows */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Shield size={12} className="text-gray-400 flex-shrink-0" />
                <span className="capitalize">{formatRole(u.role)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Mail size={12} className="text-gray-400 flex-shrink-0" />
                <span className="truncate">{u.email}</span>
              </div>
              {u.phone && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone size={12} className="text-gray-400 flex-shrink-0" />
                  <span>{u.phone}</span>
                </div>
              )}
              {(u.territory?.name || u.territory) && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                  <span>{u.territory?.name || u.territory}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Mobile Pagination */}
        {!isLoading && allUsers.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500">
              {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, allUsers.length)} of {allUsers.length}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 text-gray-500 bg-white">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 text-gray-500 bg-white">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMut.mutate(deleteTarget._id)}
          loading={deleteMut.isPending}
        />
      )}
      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onConfirm={(pw) => resetPwMut.mutate({ id: resetTarget._id, pw })}
          loading={resetPwMut.isPending}
        />
      )}
    </div>
  );
};

export default Users;

