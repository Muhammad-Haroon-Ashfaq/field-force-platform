import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  Save, Loader2, MapPin, Camera, MessageSquare,
  Store, Wifi, Shield, Settings as SettingsIcon,
  CheckCircle, Cloud, Activity, Sliders
} from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

// ─── API ──────────────────────────────────────────────────────
const fetchCompany = (id) => API.get(`/companies/${id}`).then(r => r.data);
const updateSettings = (id, data) => API.put(`/companies/${id}/settings`, data).then(r => r.data);

// ─── Toggle Row ───────────────────────────────────────────────
const ToggleRow = ({ label, sublabel, value, onChange }) => (
  <div className="flex items-start justify-between py-4 border-b border-gray-100 last:border-0">
    <div>
      <div className="text-sm font-medium text-gray-800">{label}</div>
      {sublabel && <div className="text-xs text-gray-400 mt-0.5">{sublabel}</div>}
    </div>
    <button type="button" onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-4 mt-0.5 ${value ? 'bg-teal-500' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  </div>
);

// ─── Section Card ─────────────────────────────────────────────
const SectionCard = ({ icon, title, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gray-50">
      <div className="text-teal-600">{icon}</div>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="px-5 py-2">{children}</div>
  </div>
);

// ─── Tab Button ───────────────────────────────────────────────
const TabBtn = ({ icon, label, active, onClick }) => (
  <button onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      active
        ? 'bg-teal-50 text-teal-700 border border-teal-200'
        : 'text-gray-600 hover:bg-gray-50'
    }`}>
    <span className={active ? 'text-teal-600' : 'text-gray-400'}>{icon}</span>
    {label}
  </button>
);

// ─── Main Settings Page ───────────────────────────────────────
const Settings = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState({
    submissionRadiusMeters: 50,
    isPhotoRequired: false,
    isCommentsRequired: false,
    allowEmployeeShopCreation: false,
    allowGalleryUpload: false,
    isLocationMandatory: true,
    isOfflineModeEnabled: true,
  });
  const [isDirty, setIsDirty] = useState(false);

  const companyId = user?.company?._id || user?.company;

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => fetchCompany(companyId),
    enabled: !!companyId,
  });

  useEffect(() => {
    if (company?.settings) {
      setForm({
        submissionRadiusMeters: company.settings.submissionRadiusMeters ?? 50,
        isPhotoRequired: company.settings.isPhotoRequired ?? false,
        isCommentsRequired: company.settings.isCommentsRequired ?? false,
        allowEmployeeShopCreation: company.settings.allowEmployeeShopCreation ?? false,
        allowGalleryUpload: company.settings.allowGalleryUpload ?? false,
        isLocationMandatory: company.settings.isLocationMandatory ?? true,
        isOfflineModeEnabled: company.settings.isOfflineModeEnabled ?? true,
      });
    }
  }, [company]);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setIsDirty(true); };

  const saveMut = useMutation({
    mutationFn: () => updateSettings(companyId, form),
    onSuccess: () => {
      toast.success('Settings saved successfully');
      qc.invalidateQueries(['company', companyId]);
      setIsDirty(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const tabs = [
    { id: 'general',   label: 'General',          icon: <Sliders size={16} /> },
    { id: 'validation',label: 'Validation',        icon: <Shield size={16} /> },
    { id: 'offline',   label: 'Offline Behavior',  icon: <Wifi size={16} /> },
    { id: 'branding',  label: 'Branding',          icon: <SettingsIcon size={16} /> },
  ];

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-gray-300" />
    </div>
  );

  return (
    <div className="p-6 min-h-full">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure global operational parameters and security defaults.</p>
        </div>
        <button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending || !isDirty}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-40">
          {saveMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-6">

        {/* Left Tabs */}
        <div className="space-y-1">
          {tabs.map(t => (
            <TabBtn key={t.id} icon={t.icon} label={t.label}
              active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
          ))}

          {/* Cloud Status */}
          <div className="mt-4 bg-teal-50 border border-teal-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Cloud size={14} className="text-teal-600" />
              <span className="text-xs font-semibold text-teal-700">Cloud Status</span>
            </div>
            <p className="text-xs text-teal-600 leading-relaxed">
              All configuration settings are synchronized with FieldOps Enterprise.
            </p>
          </div>
        </div>

        {/* Right Content */}
        <div className="space-y-5">

          {/* ── GENERAL TAB ── */}
          {activeTab === 'general' && (
            <>
              {/* Geofencing & Accuracy */}
              <SectionCard icon={<MapPin size={16} />} title="Geofencing & Accuracy">
                <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Default Submission Radius (m)
                    </label>
                    <p className="text-xs text-gray-400 mb-2">
                      Maximum distance allowed from shop location for valid entry.
                    </p>
                    <input
                      type="number"
                      value={form.submissionRadiusMeters}
                      onChange={e => set('submissionRadiusMeters', parseInt(e.target.value) || 50)}
                      min={10} max={1000}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                    />
                    <div className="mt-2">
                      <input type="range" min={10} max={500} value={form.submissionRadiusMeters}
                        onChange={e => set('submissionRadiusMeters', parseInt(e.target.value))}
                        className="w-full accent-teal-500" />
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>10m</span><span>500m</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Location Validation
                    </label>
                    <p className="text-xs text-gray-400 mb-3">
                      Required signal accuracy before allowing data submission.
                    </p>
                    <ToggleRow
                      label="Location Mandatory"
                      sublabel="Force GPS validation for all submissions"
                      value={form.isLocationMandatory}
                      onChange={v => set('isLocationMandatory', v)}
                    />
                  </div>
                </div>
              </SectionCard>

              {/* Media Control */}
              <SectionCard icon={<Camera size={16} />} title="Media Control">
                <ToggleRow
                  label="Force Camera Capture"
                  sublabel="Disable gallery selection for photos — camera only"
                  value={!form.allowGalleryUpload}
                  onChange={v => set('allowGalleryUpload', !v)}
                />
                <ToggleRow
                  label="Allow Gallery Upload"
                  sublabel="Permission for legacy document uploads from device gallery"
                  value={form.allowGalleryUpload}
                  onChange={v => set('allowGalleryUpload', v)}
                />
                <ToggleRow
                  label="Photo Required (Global)"
                  sublabel="Make photo mandatory for all activity submissions company-wide"
                  value={form.isPhotoRequired}
                  onChange={v => set('isPhotoRequired', v)}
                />
              </SectionCard>

              {/* Security & Access */}
              <SectionCard icon={<Shield size={16} />} title="Security & Access">
                <ToggleRow
                  label="Employee Shop Creation"
                  sublabel="Allow field staff to map and register new shop locations"
                  value={form.allowEmployeeShopCreation}
                  onChange={v => set('allowEmployeeShopCreation', v)}
                />
                <ToggleRow
                  label="Comments Required (Global)"
                  sublabel="Make written comments mandatory for all field submissions"
                  value={form.isCommentsRequired}
                  onChange={v => set('isCommentsRequired', v)}
                />
              </SectionCard>
            </>
          )}

          {/* ── VALIDATION TAB ── */}
          {activeTab === 'validation' && (
            <SectionCard icon={<Shield size={16} />} title="Submission Validation Rules">
              <div className="py-2 space-y-1">
                <ToggleRow
                  label="Location Mandatory"
                  sublabel="Reject submissions without valid GPS coordinates"
                  value={form.isLocationMandatory}
                  onChange={v => set('isLocationMandatory', v)}
                />
                <ToggleRow
                  label="Photo Required Globally"
                  sublabel="Block submission without at least one photo attachment"
                  value={form.isPhotoRequired}
                  onChange={v => set('isPhotoRequired', v)}
                />
                <ToggleRow
                  label="Comments Required Globally"
                  sublabel="Require text comment for every submission"
                  value={form.isCommentsRequired}
                  onChange={v => set('isCommentsRequired', v)}
                />
              </div>
              <div className="py-4 border-t border-gray-100">
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Geofence Radius (meters)
                </label>
                <p className="text-xs text-gray-400 mb-3">
                  Submission will be flagged if employee is beyond this radius from the shop.
                </p>
                <div className="flex items-center gap-4">
                  <input type="range" min={10} max={500} value={form.submissionRadiusMeters}
                    onChange={e => set('submissionRadiusMeters', parseInt(e.target.value))}
                    className="flex-1 accent-teal-500" />
                  <span className="text-sm font-semibold text-teal-700 w-16 text-right">
                    {form.submissionRadiusMeters}m
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>10m (strict)</span><span>500m (flexible)</span>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ── OFFLINE TAB ── */}
          {activeTab === 'offline' && (
            <SectionCard icon={<Wifi size={16} />} title="Offline Behavior">
              <div className="py-2">
                <ToggleRow
                  label="Offline Mode Enabled"
                  sublabel="Allow field agents to submit forms without internet — data will sync when connection is restored"
                  value={form.isOfflineModeEnabled}
                  onChange={v => set('isOfflineModeEnabled', v)}
                />
                <ToggleRow
                  label="Allow Gallery Upload"
                  sublabel="Allow uploading photos from gallery when offline sync resumes"
                  value={form.allowGalleryUpload}
                  onChange={v => set('allowGalleryUpload', v)}
                />
              </div>
              {!form.isOfflineModeEnabled && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700 font-medium">
                    ⚠ Disabling offline mode means field agents cannot submit without internet. This may affect data collection in low-connectivity areas.
                  </p>
                </div>
              )}
            </SectionCard>
          )}

          {/* ── BRANDING TAB ── */}
          {activeTab === 'branding' && (
            <SectionCard icon={<SettingsIcon size={16} />} title="Company Branding">
              <div className="py-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Company Name</label>
                  <input
                    value={company?.name || ''}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Contact support to change your company name.</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Company Code</label>
                  <input
                    value={company?.code || ''}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 font-mono cursor-not-allowed"
                  />
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Branding customization (logo, colors) is available in the Enterprise plan. Contact your account manager to upgrade.
                  </p>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Operational Health — shown on General tab */}
          {activeTab === 'general' && (
            <div className="bg-slate-900 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Operational Health</h3>
                  <p className="text-xs text-slate-400">
                    Global sync latency is currently <span className="text-teal-400 font-mono">84ms</span>. All systems operational.
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-teal-400">99.9%</div>
                    <div className="text-xs text-slate-400">Uptime</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">2.4k</div>
                    <div className="text-xs text-slate-400">Nodes</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dirty indicator */}
          {isDirty && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-700 font-medium">
                You have unsaved changes. Click "Save Changes" to apply.
              </p>
              <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800">
                {saveMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Save Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
