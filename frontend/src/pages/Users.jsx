import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, Search, Download, Filter, MoreVertical,
  ChevronLeft, ChevronRight, CheckSquare, Square,
  Edit2, Trash2, KeyRound,
  Loader2, Users as UsersIcon, Zap, BriefcaseIcon, Mail,
  Eye, EyeOff
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

const ROLES = ['company_admin', 'manager', 'employee', 'auditor'];

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
  const [step, setStep] = useState('confirm'); // confirm | enter
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

// ─── Territory Selector Component ────────────────────────────
const TerritorySelector = ({ value, onChange }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data: territories, isLoading } = useQuery({
    queryKey: ['territories-list'],
    queryFn: () => API.get('/territories').then(r => r.data),
  });

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = (territories || []).filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const selected = (territories || []).find(t => t._id === value);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 bg-white flex items-center justify-between">
        <span className={selected ? 'text-gray-800' : 'text-gray-400'}>
          {isLoading ? 'Loading...' : selected ? `${selected.name} (${selected.type})` : 'Select territory...'}
        </span>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[999] overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search territory..." autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {/* Clear option */}
            <button type="button" onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
              className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 italic border-b border-gray-100">
              — No Territory —
            </button>
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={16} className="animate-spin text-gray-300" />
              </div>
            )}
            {!isLoading && filtered.length === 0 && (
              <div className="px-3 py-6 text-sm text-gray-400 text-center">
                {territories?.length === 0
                  ? 'No territories added yet. Add from Territories page first.'
                  : 'No match found'}
              </div>
            )}
            {filtered.map(t => (
              <button key={t._id} type="button"
                onClick={() => { onChange(t._id); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-teal-50 hover:text-teal-700 transition-colors flex items-center justify-between ${
                  value === t._id ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'
                }`}>
                <span>{t.name}</span>
                <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded-full">{t.type}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Add/Edit User Modal ──────────────────────────────────────
const UserModal = ({ user, onClose, onSave, loading }) => {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'employee',
    password: '',
    isActive: user?.isActive ?? true,
    territory: user?.territory?._id || user?.territory || '',
  });
  const isEdit = !!user;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isEdit ? 'Edit User' : 'Add New User'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Full Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
              <input value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="user@company.com" type="email"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+92 300 0000000"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Role</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 bg-white">
                {ROLES.map(r => <option key={r} value={r}>{formatRole(r)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
              <select value={form.isActive ? 'active' : 'inactive'} onChange={e => set('isActive', e.target.value === 'active')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 bg-white">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Territory */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Territory</label>
            <TerritorySelector
              value={form.territory}
              onChange={v => set('territory', v)}
            />
          </div>

          {!isEdit && (
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Password</label>
              <input value={form.password} onChange={e => set('password', e.target.value)}
                type="password" placeholder="Min. 8 characters"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium">
            Cancel
          </button>
          <button onClick={() => onSave(form)} disabled={loading || !form.name || !form.email || (!isEdit && !form.password)}
            className="flex-1 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-40 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add User'}
          </button>
        </div>
      </div>
    </div>
  );
};

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

  // const [modalUser, setModalUser] = useState(null);   // null=closed, false=new, obj=edit
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);

  // Debounce search
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

  // Client-side pagination (backend returns array)
  const allUsers = usersRaw || [];
  const totalPages = Math.max(1, Math.ceil(allUsers.length / ITEMS_PER_PAGE));
  const pageUsers = allUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Stat cards
  const totalUsers = allUsers.length;
  const activeNow = allUsers.filter(u => u.isActive).length;
  const fieldAgents = allUsers.filter(u => u.role === 'employee').length;
  const pendingInvite = allUsers.filter(u => !u.isActive).length;

  // Mutations
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

  // const saveMut = useMutation({
  //   mutationFn: (payload) => modalUser?._id
  //     ? API.put(`/users/${modalUser._id}`, payload).then(r => r.data)
  //     : API.post('/users', payload).then(r => r.data),
  //   onSuccess: () => {
  //     toast.success(modalUser?._id ? 'User updated' : 'User created');
  //     qc.invalidateQueries(['users']);
  //     setModalUser(null);
  //   },
  //   onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  // });

  // Select all on page
  const allSelected = pageUsers.length > 0 && pageUsers.every(u => selected.includes(u._id));
  const toggleAll = () => {
    if (allSelected) setSelected(s => s.filter(id => !pageUsers.find(u => u._id === id)));
    else setSelected(s => [...new Set([...s, ...pageUsers.map(u => u._id)])]);
  };
  const toggleOne = (id) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  // Export CSV
  const exportCSV = () => {
    const rows = [['Name', 'Email', 'Role', 'Phone', 'Status', 'Territory']];
    allUsers.forEach(u => rows.push([u.name, u.email, u.role, u.phone || '', u.isActive ? 'Active' : 'Inactive', u.territory?.name || '']));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = 'users.csv'; a.click();
  };

  return (
    <div className="p-6 space-y-6 min-h-full">

      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage organization members, roles, and field permissions.</p>
        </div>
        {/* <button onClick={() => setModalUser(false)} */}
        <button onClick={() => navigate('/users/new')}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: totalUsers, icon: <UsersIcon size={18} className="text-teal-500" />, sub: null },
          { label: 'Active Now', value: activeNow, icon: <Zap size={18} className="text-teal-500" />, sub: `${totalUsers ? Math.round(activeNow/totalUsers*100) : 0}% active rate` },
          { label: 'Field Agents', value: fieldAgents, icon: <BriefcaseIcon size={18} className="text-teal-500" />, sub: 'Employees' },
          { label: 'Inactive', value: pendingInvite, icon: <Mail size={18} className="text-teal-500" />, sub: 'Deactivated accounts' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm text-gray-500 font-medium">{c.label}</span>
              {c.icon}
            </div>
            {isLoading
              ? <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
              : <div className="text-3xl font-bold text-gray-900">{c.value.toLocaleString()}</div>}
            {c.sub && <div className="text-xs text-gray-400 mt-1">{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or ID..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all" />
          </div>
          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Role:</span>
            <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-white text-gray-700">
              <option value="">All Roles</option>
              {ROLES.map(r => <option key={r} value={r}>{formatRole(r)}</option>)}
            </select>
          </div>
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Status:</span>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-white text-gray-700">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {selected.length > 0 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {selected.length} selected
              </span>
            )}
            <button onClick={exportCSV}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Export CSV">
              <Download size={16} />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Filters">
              <Filter size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table Header */}
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

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-gray-300 animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && pageUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <UsersIcon size={36} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No users found</p>
            <p className="text-xs mt-1">Try adjusting your filters or add a new user</p>
          </div>
        )}

        {/* Rows */}
        {!isLoading && pageUsers.map((u, i) => (
          <div key={u._id}
            className={`grid grid-cols-[40px_2fr_1fr_2fr_1.5fr_1fr_1fr_60px] gap-3 px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center ${i === pageUsers.length - 1 ? 'border-b-0' : ''}`}>
            {/* Checkbox */}
            <button onClick={() => toggleOne(u._id)}>
              {selected.includes(u._id)
                ? <CheckSquare size={16} className="text-teal-500" />
                : <Square size={16} className="text-gray-300" />}
            </button>
            {/* Name + ID */}
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-full ${getAvatarColor(u.name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {getInitials(u.name)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{u.name}</div>
                <div className="text-xs text-gray-400">ID: {u.employeeCode || u._id.slice(-6).toUpperCase()}</div>
              </div>
            </div>
            {/* Role */}
            <div className="text-sm text-gray-600 capitalize">{formatRole(u.role)}</div>
            {/* Contact */}
            <div className="min-w-0">
              <div className="text-sm text-gray-700 truncate">{u.email}</div>
              <div className="text-xs text-gray-400">{u.phone || '—'}</div>
            </div>
            {/* Territory */}
            <div className="text-sm text-gray-600">
              {u.territory?.name || (typeof u.territory === 'string' && u.territory) || '—'}
            </div>
            {/* Status */}
            <div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.isActive ? STATUS_STYLES.active : STATUS_STYLES.inactive}`}>
                {u.isActive ? '● Active' : '● Inactive'}
              </span>
            </div>
            {/* Last Activity */}
            <div className="text-sm text-gray-500">{timeAgo(u.updatedAt)}</div>
            {/* Actions */}
            <div className="flex justify-center">
              <ActionMenu
                user={u}
                // onEdit={(usr) => setModalUser(usr)}
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
              {totalPages > 5 && page < totalPages - 2 && (
                <><span className="text-gray-400 px-1">...</span>
                <button onClick={() => setPage(totalPages)}
                  className="w-8 h-8 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">{totalPages}</button></>
              )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-500">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {/* {modalUser !== null && (
        <UserModal
          user={modalUser || null}
          onClose={() => setModalUser(null)}
          onSave={(form) => saveMut.mutate(form)}
          loading={saveMut.isPending}
        />
      )} */}
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