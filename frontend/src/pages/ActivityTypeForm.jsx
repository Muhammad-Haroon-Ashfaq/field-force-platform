import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight, Save, X, Loader2, Shield,
  Info, CheckCircle, AlertTriangle, Smartphone
} from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const fetchForms = () => API.get('/form-templates').then(r => r.data);

// ─── Toggle Row ───────────────────────────────────────────────
const ToggleRow = ({ label, sublabel, field, form, set, icon }) => (
  <div className="flex items-start justify-between p-4 bg-white rounded-xl border border-gray-200">
    <div className="flex items-start gap-3">
      {icon && <div className="mt-0.5 text-gray-400">{icon}</div>}
      <div>
        <div className="text-sm font-medium text-gray-800">{label}</div>
        {sublabel && <div className="text-xs text-gray-400 mt-0.5">{sublabel}</div>}
      </div>
    </div>
    <button type="button" onClick={() => set(field, !form[field])}
      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${form[field] ? 'bg-teal-500' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form[field] ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  </div>
);

// ─── Main ActivityTypeForm ────────────────────────────────────
const ActivityTypeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const qc = useQueryClient();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '',
    description: '',
    requiresShop: true,
    requiresLocation: true,
    requiresPhoto: false,
    requiresComments: false,
    allowedOffline: true,
    formTemplate: '',
    isActive: true,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Fetch existing activity if edit
  const { isLoading: fetchLoading, data: activityData } = useQuery({
    queryKey: ['activity-type', id],
    queryFn: () => API.get(`/activity-types/${id}`).then(r => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (activityData && isEdit) {
      setForm({
        name: activityData.name || '',
        description: activityData.description || '',
        requiresShop: activityData.requiresShop ?? true,
        requiresLocation: activityData.requiresLocation ?? true,
        requiresPhoto: activityData.requiresPhoto ?? false,
        requiresComments: activityData.requiresComments ?? false,
        allowedOffline: activityData.allowedOffline ?? true,
        formTemplate: activityData.formTemplate?._id || activityData.formTemplate || '',
        isActive: activityData.isActive ?? true,
      });
    }
  }, [activityData, isEdit]);

  // Fetch form templates
  const { data: forms = [] } = useQuery({
    queryKey: ['form-templates'],
    queryFn: fetchForms,
  });

  const saveMut = useMutation({
    mutationFn: (payload) => isEdit
      ? API.put(`/activity-types/${id}`, payload).then(r => r.data)
      : API.post('/activity-types', payload).then(r => r.data),
    onSuccess: () => {
      toast.success(isEdit ? 'Activity type updated' : 'Activity type created');
      qc.invalidateQueries(['activity-types']);
      navigate('/activity-types');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const handleSave = () => {
    if (!form.name.trim()) return toast.error('Activity name is required');
    const payload = { ...form };
    if (!payload.formTemplate) delete payload.formTemplate;
    saveMut.mutate(payload);
  };

  // Configuration health checks
  const healthChecks = [
    { label: 'Linked to active form schema', ok: !!form.formTemplate },
    { label: 'Location tracking enabled', ok: form.requiresLocation },
    { label: 'Offline mode may delay reporting', ok: false, warning: form.allowedOffline },
  ];
  const healthScore = healthChecks.filter(h => h.ok).length;
  const healthLabel = healthScore >= 2 ? 'Optimized' : healthScore === 1 ? 'Moderate' : 'Needs Setup';
  const healthColor = healthScore >= 2 ? 'text-teal-600' : healthScore === 1 ? 'text-amber-500' : 'text-red-500';
  const healthBarColor = healthScore >= 2 ? 'bg-teal-500' : healthScore === 1 ? 'bg-amber-400' : 'bg-red-400';

  // Linked form details
  const linkedForm = forms.find(f => f._id === form.formTemplate);

  if (fetchLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-gray-300" />
    </div>
  );

  return (
    <div className="p-6 min-h-full">

      {/* Breadcrumb + Header */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
        <button onClick={() => navigate('/activity-types')} className="hover:text-teal-600 transition-colors">Activity Types</button>
        <ChevronRight size={14} />
        <span className="text-teal-600 font-medium">Configuration</span>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configure Activity Type</h1>
          <p className="text-sm text-gray-500 mt-0.5">Define operational logic and validation rules for field activities.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Toggle */}
          <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
            <button type="button" onClick={() => set('isActive', !form.isActive)}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? 'bg-teal-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <div>
              <div className="text-xs text-gray-400 leading-none">Status</div>
              <div className={`text-sm font-semibold ${form.isActive ? 'text-teal-600' : 'text-gray-500'}`}>
                {form.isActive ? 'ACTIVE' : 'INACTIVE'}
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/activity-types')}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors">
            <X size={15} /> Discard
          </button>
          <button onClick={handleSave} disabled={saveMut.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
            {saveMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left: Basic Info + Operational Rules */}
        <div className="xl:col-span-2 space-y-5">

          {/* Basic Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Info size={16} className="text-teal-600" />
              <h2 className="text-base font-semibold text-gray-800">Basic Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Activity Name <span className="text-red-400">*</span></label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Monthly Inventory Audit"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Standard recurring audit for shelf inventory and stock discrepancy reporting."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Linked Form</label>
                <select value={form.formTemplate} onChange={e => set('formTemplate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all text-gray-700">
                  <option value="">— No Form Linked —</option>
                  {forms.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                </select>
                {linkedForm && (
                  <p className="text-xs text-gray-400 mt-1.5 italic">
                    Data captured during this activity will populate the selected form.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Operational Rules */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Shield size={16} className="text-teal-600" />
              <h2 className="text-base font-semibold text-gray-800">Operational Rules</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ToggleRow field="requiresShop" label="Requires Shop" sublabel="Must link to a location" form={form} set={set} />
              <ToggleRow field="requiresLocation" label="Requires Location" sublabel="Force GPS coordinates" form={form} set={set} />
              <ToggleRow field="requiresPhoto" label="Requires Photo" sublabel="Camera input mandatory" form={form} set={set} />
              <ToggleRow field="requiresComments" label="Requires Comments" sublabel="Mandatory text feedback" form={form} set={set} />
              <div className="sm:col-span-2">
                <ToggleRow field="allowedOffline" label="Allow Offline Submission" sublabel="Sync data when connectivity is restored" form={form} set={set} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Advanced Validation + Config Health + Mobile Preview */}
        <div className="space-y-5">

          {/* Configuration Health */}
          <div className="bg-slate-900 rounded-xl p-5">
            <div className="text-sm font-semibold text-white mb-3">Configuration Health</div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Operational Complexity</span>
              <span className={`text-xs font-semibold ${healthColor}`}>{healthLabel}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-4">
              <div className={`h-full ${healthBarColor} rounded-full transition-all`}
                style={{ width: `${(healthScore / healthChecks.length) * 100}%` }} />
            </div>
            <div className="space-y-2">
              {healthChecks.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  {h.warning ? (
                    <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
                  ) : h.ok ? (
                    <CheckCircle size={13} className="text-teal-400 flex-shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-slate-500 flex-shrink-0" />
                  )}
                  <span className="text-xs text-slate-300">{h.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Preview */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone size={15} className="text-gray-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mobile Preview</span>
            </div>
            <div className="border-2 border-gray-200 rounded-2xl p-5 bg-gray-50">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                  <Shield size={18} className="text-gray-500" />
                </div>
                <div className="text-sm font-semibold text-gray-800 text-center">
                  {form.name || 'Activity Name'}
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                  {form.requiresLocation && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">LOCATION REQ.</span>
                  )}
                  {form.requiresPhoto ? (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">PHOTO REQ.</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">PHOTO OPT.</span>
                  )}
                  {form.requiresComments && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">COMMENTS REQ.</span>
                  )}
                  {form.allowedOffline && (
                    <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full font-medium">OFFLINE OK</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Info note */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Changes to activity rules apply immediately to all future field submissions. Existing submissions will not be affected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityTypeForm;