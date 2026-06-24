import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight, Save, X, Loader2, AlertCircle,
  User, Shield, Lock, Info, Network, BookOpen
} from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

// ─── Territory Selector ───────────────────────────────────────
const TerritorySelector = ({ value, onChange }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data: territories = [], isLoading } = useQuery({
    queryKey: ['territories-list'],
    queryFn: () => API.get('/territories').then(r => r.data),
  });

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = territories.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  const selected = territories.find(t => t._id === value);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-left bg-white flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all">
        <span className={selected ? 'text-gray-800' : 'text-gray-400'}>
          {isLoading ? 'Loading...' : selected ? selected.name : 'Select territory...'}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[999] overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search territory..." autoFocus
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
          </div>
          <div className="max-h-48 overflow-y-auto">
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 italic border-b border-gray-100">
              — No Territory —
            </button>
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">
                {territories.length === 0 ? 'No territories added yet' : 'No match found'}
              </div>
            )}
            {filtered.map(t => (
              <button key={t._id} type="button" onClick={() => { onChange(t._id); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-teal-50 hover:text-teal-700 transition-colors flex items-center justify-between ${
                  value === t._id ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'
                }`}>
                <span>{t.name}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full capitalize">{t.type}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ROLES = [
  { value: 'company_admin', label: 'Company Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employee' },
  { value: 'auditor', label: 'Auditor' },
];

// ─── Main UserForm ────────────────────────────────────────────
const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const qc = useQueryClient();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    territory: '',
    password: '',
    isActive: true,
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Fetch user if edit
  const { isLoading: fetchLoading, data: userData } = useQuery({
    queryKey: ['user', id],
    queryFn: () => API.get(`/users/${id}`).then(r => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (userData && isEdit) {
      setForm({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        role: userData.role || '',
        territory: userData.territory?._id || userData.territory || '',
        password: '',
        isActive: userData.isActive ?? true,
      });
    }
  }, [userData, isEdit]);

  const saveMut = useMutation({
    mutationFn: (payload) => isEdit
      ? API.put(`/users/${id}`, payload).then(r => r.data)
      : API.post('/users', payload).then(r => r.data),
    onSuccess: () => {
      toast.success(isEdit ? 'User updated successfully' : 'User created successfully');
      qc.invalidateQueries(['users']);
      navigate('/users');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const saveAndAddMut = useMutation({
    mutationFn: (payload) => API.post('/users', payload).then(r => r.data),
    onSuccess: () => {
      toast.success('User created! Add another.');
      qc.invalidateQueries(['users']);
      setForm({ name: '', email: '', phone: '', role: '', territory: '', password: '', isActive: true });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const doSave = (addAnother = false) => {
    const payload = { ...form };
    if (isEdit) delete payload.password;
    if (addAnother) saveAndAddMut.mutate(payload);
    else saveMut.mutate(payload);
  };

  // Input sanitizer for phone numbers (allows only digits and +)
  const handlePhoneChange = (val) => {
    const sanitized = val.replace(/[^0-9+]/g, '');
    set('phone', sanitized);
  };

  const validateAndSave = (addAnother = false) => {
    if (!form.name.trim()) return toast.error('Full name is required');
    
    // Email regex validation
    if (!form.email.trim()) return toast.error('Email is required');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) return toast.error('Please enter a valid email address');

    // Phone registration validation (Pakistan numbers format check)
    if (!form.phone.trim()) return toast.error('Phone number is required');
    const cleanPhone = form.phone.trim();
    if (cleanPhone.startsWith('+92')) {
      if (cleanPhone.length !== 13) return toast.error('International format phone number must be exactly 13 characters (e.g., +923001234567)');
    } else if (cleanPhone.startsWith('03') || cleanPhone.startsWith('3')) {
      if (cleanPhone.replace(/^0/, '3').length !== 10) return toast.error('Local phone number must be exactly 11 digits (e.g., 03001234567)');
    } else {
      return toast.error('Invalid phone number format');
    }

    // Role validation
    if (!form.role) return toast.error('Please select a user role');

    // Password rules check (Only on create mode)
    if (!isEdit) {
      if (!form.password) return toast.error('Password is required');
      if (form.password.length < 8) return toast.error('Password must be at least 8 characters long');
      
      const hasUppercase = /[A-Z]/.test(form.password);
      const hasLowercase = /[a-z]/.test(form.password);
      const hasNumber = /[0-9]/.test(form.password);
      
      if (!hasUppercase || !hasLowercase || !hasNumber) {
        return toast.error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      }
    }

    if (isEdit) { setShowConfirm(true); return; }
    doSave(addAnother);
  };

  const loading = saveMut.isPending || saveAndAddMut.isPending;

  if (fetchLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-gray-300" />
    </div>
  );

  return (
    <div className="p-6 min-h-full">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
        <button onClick={() => navigate('/users')} className="hover:text-teal-600 transition-colors">Users</button>
        <ChevronRight size={14} />
        <span className="text-teal-600 font-medium">{isEdit ? 'Edit User' : 'Create New User'}</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Configuration</h1>
        <p className="text-sm text-gray-500 mt-0.5">Assign roles, territories, and credentials for operational staff.</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">

        {/* Action Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 flex-wrap gap-3">
          <button onClick={() => navigate('/users')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 transition-colors">
            <X size={15} /> Cancel
          </button>
          <div className="flex items-center gap-3">
            {!isEdit && (
              <button onClick={() => validateAndSave(true)} disabled={loading}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-white font-medium transition-colors disabled:opacity-40 flex items-center gap-2">
                {saveAndAddMut.isPending && <Loader2 size={14} className="animate-spin" />}
                Save & Add Another
              </button>
            )}
            <button onClick={() => validateAndSave(false)} disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-40">
              {saveMut.isPending && <Loader2 size={14} className="animate-spin" />}
              <Save size={15} />
              {isEdit ? 'Save Changes' : 'Save User'}
            </button>
          </div>
        </div>

        {/* Identity */}
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] border-b border-gray-100">
          <div className="px-6 py-6 bg-gray-50/50 border-r border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <User size={15} className="text-teal-600" />
              <h2 className="text-sm font-semibold text-gray-800">Identity</h2>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">Core identification and contact details for the user account.</p>
          </div>
          <div className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. Alexander Pierce"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email / Username</label>
                <input value={form.email} onChange={e => set('email', e.target.value)}
                  type="email" placeholder="alex@fieldops.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input value={form.phone} onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="e.g. 03001234567 or +923001234567"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all" />
              </div>
            </div>
          </div>
        </div>

        {/* Authorization */}
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] border-b border-gray-100">
          <div className="px-6 py-6 bg-gray-50/50 border-r border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={15} className="text-teal-600" />
              <h2 className="text-sm font-semibold text-gray-800">Authorization</h2>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">Define system permissions and regional assignment.</p>
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role Level</label>
                <select value={form.role} onChange={e => set('role', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all text-gray-700">
                  <option value="">Select a role...</option>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Territory</label>
                <TerritorySelector value={form.territory} onChange={v => set('territory', v)} />
              </div>
            </div>
          </div>
        </div>

        {/* Security / Account */}
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
          <div className="px-6 py-6 bg-gray-50/50 border-r border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={15} className="text-teal-600" />
              <h2 className="text-sm font-semibold text-gray-800">Account</h2>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">Set status active or inactive and credentials.</p>
          </div>
          <div className="px-6 py-6 space-y-4">
            <div className="flex items-start gap-6 flex-wrap">
              {/* Password — only for new user */}
              {!isEdit && (
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Min. 8 chars (A-Z, a-z, 0-9)"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                  />
                </div>
              )}
              {/* Account Active Toggle */}
              <div className="flex items-center gap-3 pt-7">
                <button type="button"
                  onClick={() => set('isActive', !form.isActive)}
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${form.isActive ? 'bg-teal-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
                <span className="text-sm font-medium text-gray-700">Account Active</span>
              </div>
            </div>

            {!isEdit && (
              <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  Password requirement: Minimum 8 characters with at least one uppercase letter, one lowercase letter, and a number.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={15} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-gray-800">Permissions</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">Default permissions for selected role: full CRUD for territories, data export enabled.</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={15} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-gray-800">Audit Log</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">Changes to user profiles are logged for 24 months. Admin approval may be required for role upgrades.</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Network size={15} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-gray-800">Network</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">User will be discoverable in the directory and automatically added to relevant communication channels.</p>
        </div>
      </div>

      {/* Save Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={22} className="text-teal-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Save Changes?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to update the details for{' '}
              <span className="font-semibold text-gray-700">{userData?.name}</span>?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium">
                Cancel
              </button>
              <button onClick={() => { setShowConfirm(false); doSave(false); }}
                disabled={saveMut.isPending}
                className="flex-1 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-40 flex items-center justify-center gap-2">
                {saveMut.isPending && <Loader2 size={14} className="animate-spin" />}
                Yes, Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserForm;
