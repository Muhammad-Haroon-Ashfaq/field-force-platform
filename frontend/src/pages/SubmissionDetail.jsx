import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Download, CheckCircle, AlertTriangle,
  XCircle, MapPin, Clock, Store,
  Loader2, ChevronRight, Camera, ClipboardList
} from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────
const SYNC_STYLES = {
  synced:    'bg-teal-50 text-teal-700 border border-teal-200',
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  failed:    'bg-red-50 text-red-600 border border-red-200',
  uploading: 'bg-blue-50 text-blue-600 border border-blue-200',
  draft:     'bg-gray-100 text-gray-500 border border-gray-200',
};

const LOC_STATUS = {
  valid:                  { label: 'Verified', color: 'text-teal-600', icon: <CheckCircle size={14} className="text-teal-500" /> },
  warning_outside_radius: { label: 'Outside Radius', color: 'text-amber-600', icon: <AlertTriangle size={14} className="text-amber-500" /> },
  invalid_no_location:    { label: 'No Location', color: 'text-red-600', icon: <XCircle size={14} className="text-red-500" /> },
  invalid_poor_accuracy:  { label: 'Poor Accuracy', color: 'text-red-600', icon: <AlertTriangle size={14} className="text-red-500" /> },
  not_required:           { label: 'Not Required', color: 'text-gray-500', icon: <MapPin size={14} className="text-gray-400" /> },
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—';
const formatDuration = (start, end) => {
  if (!start || !end) return '—';
  const diff = Math.floor((new Date(end) - new Date(start)) / 1000);
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${m}m ${s}s`;
};
const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

// ─── Info Row ─────────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
    <span className="text-sm text-gray-800 font-medium text-right">{value || '—'}</span>
  </div>
);

// ─── Main SubmissionDetail ────────────────────────────────────
const SubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: sub, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => API.get(`/submissions/${id}`).then(r => r.data),
  });

  const approveMut = useMutation({
    mutationFn: () => API.put(`/submissions/${id}`, { syncStatus: 'synced' }).then(r => r.data),
    onSuccess: () => { toast.success('Submission approved'); qc.invalidateQueries(['submission', id]); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const exportPDF = () => toast('PDF export — coming soon', { icon: '📄' });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-gray-300" />
    </div>
  );

  if (!sub) return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <ClipboardList size={40} className="mb-3 opacity-30" />
      <p className="text-sm">Submission not found</p>
      <button onClick={() => navigate('/submissions')} className="mt-3 text-teal-600 text-sm hover:underline">
        Back to Submissions
      </button>
    </div>
  );

  const locStatus = LOC_STATUS[sub.location?.validationStatus] || LOC_STATUS.not_required;
  const syncStyle = SYNC_STYLES[sub.syncStatus] || SYNC_STYLES.draft;
  const answers = sub.answers || {};
  const fields = sub.formTemplate?.fields || [];

  return (
    <div className="p-6 space-y-6 min-h-full">

      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <button onClick={() => navigate('/submissions')}
            className="hover:text-teal-600 transition-colors flex items-center gap-1">
            <ArrowLeft size={14} /> Submissions
          </button>
          <ChevronRight size={14} />
          <span className="text-gray-600 font-medium truncate">
            {sub.activityType?.name || 'Submission Detail'}
          </span>
        </div>

        {/* Title Row */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {sub.activityType?.name && (
                <span className="text-xs bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide">
                  {sub.activityType.name}
                </span>
              )}
              <span className="text-xs text-gray-400 font-mono">#{sub._id?.slice(-8).toUpperCase()}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {sub.formTemplate?.name || sub.activityType?.name || 'Submission Detail'}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
              <Clock size={13} />
              Submitted {formatDate(sub.createdAt)} · {formatTime(sub.createdAt)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors">
              <Download size={15} /> Export PDF
            </button>
            {sub.syncStatus !== 'synced' && (
              <button onClick={() => approveMut.mutate()} disabled={approveMut.isPending}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                {approveMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                Approve Submission
              </button>
            )}
            {sub.syncStatus === 'synced' && (
              <span className="flex items-center gap-2 px-4 py-2.5 bg-teal-50 text-teal-700 rounded-xl text-sm font-medium border border-teal-200">
                <CheckCircle size={15} /> Approved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="space-y-4">

          {/* Employee Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Employee</div>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {getInitials(sub.user?.name || 'U')}
              </div>
              <div>
                <div className="text-base font-semibold text-gray-900">{sub.user?.name || '—'}</div>
                <div className="text-xs text-gray-400">ID: {sub.user?.employeeCode || sub.user?._id?.slice(-6).toUpperCase() || '—'}</div>
              </div>
            </div>
            <InfoRow label="Role" value={sub.user?.role?.replace('_', ' ')} />
            <InfoRow label="Email" value={sub.user?.email} />
          </div>

          {/* Location Card */}
          {sub.shop && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Location</div>
              <div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Store size={16} className="text-gray-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{sub.shop.name}</div>
                  <div className="text-xs text-gray-400">Store #{sub.shop._id?.slice(-4).toUpperCase()}</div>
                </div>
              </div>
              {sub.shop.address && <div className="text-xs text-gray-500 mb-3">{sub.shop.address}</div>}
              {sub.shop.city && <div className="text-xs text-gray-400">{sub.shop.area}{sub.shop.area && sub.shop.city ? ', ' : ''}{sub.shop.city}</div>}
            </div>
          )}

          {/* Activity Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Activity Stats</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400 mb-1">Duration</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatDuration(sub.createdAt, sub.syncedAt)}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400 mb-1">Fields</div>
                <div className="text-lg font-bold text-gray-900">
                  {fields.length}/{fields.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column — Form Responses */}
        <div className="space-y-4">

          {/* Form Responses */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Form Responses</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${syncStyle}`}>
                {sub.syncStatus?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            <div className="p-5 space-y-5">
              {/* Comments */}
              {sub.comments && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="text-xs font-medium text-blue-600 mb-1">Comments</div>
                  <p className="text-sm text-gray-700">{sub.comments}</p>
                </div>
              )}

              {/* Dynamic answers from form fields */}
              {fields.length > 0 ? (
                fields.map((field, idx) => {
                  const answer = answers[field._id] || answers[field.label] || answers[idx];
                  return (
                    <div key={field._id || idx} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="text-xs text-gray-400 mb-1.5">{idx + 1}. {field.label}</div>
                      {field.type === 'photo' ? (
                        answer ? (
                          <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded font-medium">Photo attached</span>
                        ) : <span className="text-sm text-gray-400 italic">No photo</span>
                      ) : field.type === 'boolean' ? (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          answer ? 'bg-teal-50 text-teal-700' : 'bg-red-50 text-red-600'
                        }`}>{answer ? 'YES' : 'NO'}</span>
                      ) : field.type === 'rating' ? (
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(n => (
                            <span key={n} className={`text-lg ${n <= (answer || 0) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                          ))}
                        </div>
                      ) : typeof answer === 'number' && field.type === 'number' ? (
                        <div className="mt-1">
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(answer, 100)}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{answer}% Capacity</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-800 font-medium">{answer?.toString() || <span className="text-gray-400 italic">No answer</span>}</p>
                      )}
                    </div>
                  );
                })
              ) : (
                /* Raw answers if no form template */
                Object.keys(answers).length > 0 ? (
                  Object.entries(answers).map(([key, val], idx) => (
                    <div key={key} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="text-xs text-gray-400 mb-1.5">{idx + 1}. {key}</div>
                      <p className="text-sm text-gray-800 font-medium">{val?.toString() || '—'}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-sm">No form responses recorded</p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Product Audit if any product_checklist answers */}
          {fields.some(f => f.type === 'product_checklist') && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-800">Product Audit (SKU Scan)</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-[1fr_80px_60px_80px] gap-3 text-xs font-semibold text-gray-400 uppercase mb-3 px-1">
                  <div>Product Name</div><div>SKU</div><div>QTY</div><div>Status</div>
                </div>
                {/* Placeholder rows — real data comes from answers */}
                <div className="text-xs text-gray-400 italic text-center py-4">
                  Product checklist data from field agent
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Map + Verification + Media */}
        <div className="space-y-4">

          {/* Map / GPS */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {sub.location?.lat && sub.location?.lng ? (
              <>
                <div className="h-40 bg-slate-800 relative flex items-center justify-center">
                  <div className="text-center text-white">
                    <MapPin size={24} className="mx-auto mb-1 text-teal-400" />
                    <div className="text-xs font-mono text-slate-300">
                      {sub.location.lat.toFixed(4)}° N, {sub.location.lng.toFixed(4)}° W
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-40 bg-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <MapPin size={20} className="mx-auto mb-1 opacity-30" />
                  <p className="text-xs">No location data</p>
                </div>
              </div>
            )}
            <div className="px-4 py-3">
              <div className="flex items-center gap-2">
                {locStatus.icon}
                <span className={`text-xs font-medium ${locStatus.color}`}>{locStatus.label}</span>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Verification</div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin size={15} className="text-teal-500" />
                <div>
                  <div className="text-xs text-gray-400">GPS Accuracy</div>
                  <div className="text-sm font-medium text-gray-800">
                    {sub.location?.accuracyMeters
                      ? `± ${sub.location.accuracyMeters.toFixed(1)} meters (${sub.location.accuracyMeters <= 10 ? 'Valid' : 'Weak'})`
                      : 'Not available'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={15} className="text-teal-500" />
                <div>
                  <div className="text-xs text-gray-400">Check-in</div>
                  <div className="text-sm font-medium text-gray-800">
                    {formatTime(sub.createdAt)}
                    {sub.syncedAt && ` (Duration: ${formatDuration(sub.createdAt, sub.syncedAt)})`}
                  </div>
                </div>
              </div>
              {sub.location?.distanceFromShop && (
                <div className="flex items-center gap-3">
                  <Store size={15} className="text-teal-500" />
                  <div>
                    <div className="text-xs text-gray-400">Distance from Shop</div>
                    <div className="text-sm font-medium text-gray-800">
                      {sub.location.distanceFromShop.toFixed(0)}m
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Evidence Media */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Evidence Media ({sub.mediaFiles?.length || 0})
              </div>
            </div>
            {sub.mediaFiles?.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {sub.mediaFiles.slice(0, 3).map((media, i) => (
                    <div key={media._id || i} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      {media.url ? (
                        <img src={media.url} alt="Evidence" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera size={20} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                  ))}
                  {sub.mediaFiles.length > 3 && (
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Camera size={16} className="text-gray-400 mx-auto mb-1" />
                        <span className="text-xs text-gray-500">+{sub.mediaFiles.length - 3}</span>
                      </div>
                    </div>
                  )}
                </div>
                <button className="w-full py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 font-medium transition-colors">
                  View Full Gallery
                </button>
              </>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Camera size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">No media attached</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;
