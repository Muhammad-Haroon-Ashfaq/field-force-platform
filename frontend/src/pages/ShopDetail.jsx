import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ChevronRight, Edit2, Trash2, Loader2, MapPin,
  Phone, User, Store, Calendar, Activity,
  CheckCircle, AlertTriangle, ToggleLeft, ToggleRight,
  ClipboardList, ArrowLeft
} from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { useState } from 'react';

// Fix leaflet marker
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', {
  year: 'numeric', month: 'short', day: 'numeric'
}) : '—';

const timeAgo = (date) => {
  if (!date) return '—';
  const diff = Date.now() - new Date(date);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ─── Delete Modal ─────────────────────────────────────────────
const DeleteModal = ({ shop, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Delete Shop</h3>
      <p className="text-sm text-gray-500 mb-5">
        Are you sure you want to delete <span className="font-medium text-gray-700">"{shop?.name}"</span>? This cannot be undone.
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

// ─── Info Row ─────────────────────────────────────────────────
const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs text-gray-400 font-medium mb-0.5">{label}</div>
      <div className="text-sm text-gray-800 font-medium">{value || '—'}</div>
    </div>
  </div>
);

// ─── Main ShopDetail Page ─────────────────────────────────────
const ShopDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);

  const { data: shop, isLoading } = useQuery({
    queryKey: ['shop', id],
    queryFn: () => API.get(`/shops/${id}`).then(r => r.data),
  });

  // Recent submissions for this shop
  const { data: submissionsData } = useQuery({
    queryKey: ['shop-submissions', id],
    queryFn: () => API.get('/submissions', { params: { shop: id, limit: 5 } }).then(r => r.data),
    enabled: !!id,
  });
  const submissions = submissionsData?.submissions || submissionsData || [];

  const toggleMut = useMutation({
    mutationFn: () => API.put(`/shops/${id}`, {
      status: shop.status === 'active' ? 'inactive' : 'active'
    }).then(r => r.data),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries(['shop', id]); qc.invalidateQueries(['shops']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: () => API.delete(`/shops/${id}`).then(r => r.data),
    onSuccess: () => { toast.success('Shop deleted'); qc.invalidateQueries(['shops']); navigate('/shops'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Delete failed'),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-gray-300" />
    </div>
  );

  if (!shop) return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <Store size={40} className="mb-3 opacity-30" />
      <p className="text-sm">Shop not found</p>
      <button onClick={() => navigate('/shops')} className="mt-3 text-teal-600 text-sm hover:underline">
        Back to Shops
      </button>
    </div>
  );

  const hasLocation = shop.latitude && shop.longitude;

  return (
    <div className="p-6 space-y-6 min-h-full">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <button onClick={() => navigate('/shops')} className="hover:text-teal-600 transition-colors flex items-center gap-1">
          <ArrowLeft size={14} /> Shops
        </button>
        <ChevronRight size={14} />
        <span className="text-gray-700 font-medium truncate">{shop.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 text-lg font-bold">
            {getInitials(shop.name)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-400">ID: {shop.shopCode || shop._id.slice(-6).toUpperCase()}</span>
              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[shop.status] || STATUS_STYLES.inactive}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[shop.status] || 'bg-gray-400'}`} />
                {shop.status?.charAt(0).toUpperCase() + shop.status?.slice(1) || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleMut.mutate()}
            disabled={toggleMut.isPending}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            {shop.status === 'active' ? <ToggleLeft size={15} /> : <ToggleRight size={15} />}
            {shop.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => navigate(`/shops/edit/${id}`)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Edit2 size={15} /> Edit
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-2 px-3 py-2 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left: Details */}
        <div className="space-y-4">

          {/* Shop Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Shop Information</h2>
            <InfoRow icon={<Store size={14} className="text-gray-500" />} label="Shop Type" value={shop.shopType ? shop.shopType.charAt(0).toUpperCase() + shop.shopType.slice(1) : null} />
            <InfoRow icon={<User size={14} className="text-gray-500" />} label="Shopkeeper" value={shop.ownerName} />
            <InfoRow icon={<Phone size={14} className="text-gray-500" />} label="Phone" value={shop.phone} />
            <InfoRow icon={<MapPin size={14} className="text-gray-500" />} label="Area" value={shop.area} />
            <InfoRow icon={<MapPin size={14} className="text-gray-500" />} label="City" value={shop.city} />
            <InfoRow icon={<MapPin size={14} className="text-gray-500" />} label="Address" value={shop.address} />
          </div>

          {/* Operational Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Operational Info</h2>
            <InfoRow
              icon={<Activity size={14} className="text-gray-500" />}
              label="Territory"
              value={shop.territory?.name || '—'}
            />
            <InfoRow
              icon={<User size={14} className="text-gray-500" />}
              label="Created By"
              value={shop.createdBy?.name || '—'}
            />
            <InfoRow
              icon={<Calendar size={14} className="text-gray-500" />}
              label="Created On"
              value={formatDate(shop.createdAt)}
            />
            <InfoRow
              icon={<Calendar size={14} className="text-gray-500" />}
              label="Last Updated"
              value={timeAgo(shop.updatedAt)}
            />
          </div>

          {/* GPS Coordinates */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">GPS Coordinates</h2>
            {hasLocation ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500 font-medium">Latitude</span>
                  <span className="text-sm font-mono text-gray-800">{shop.latitude?.toFixed(6)}</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500 font-medium">Longitude</span>
                  <span className="text-sm font-mono text-gray-800">{shop.longitude?.toFixed(6)}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle size={13} className="text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Location verified</span>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-amber-600">
                <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">No location set</p>
                  <p className="text-xs text-gray-400 mt-0.5">Edit this shop to add GPS coordinates</p>
                  <button onClick={() => navigate(`/shops/edit/${id}`)}
                    className="text-xs text-teal-600 font-medium mt-1 hover:underline">
                    Set location →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Map + Submissions */}
        <div className="xl:col-span-2 space-y-4">

          {/* Map */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-teal-600" />
                <h2 className="text-sm font-semibold text-gray-800">Shop Location</h2>
              </div>
              {hasLocation && (
                <span className="text-xs text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full font-medium border border-teal-100">
                  ● Location Set
                </span>
              )}
            </div>
            <div className="h-72">
              {hasLocation ? (
                <MapContainer
                  center={[shop.latitude, shop.longitude]}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[shop.latitude, shop.longitude]} />
                  <Circle
                    center={[shop.latitude, shop.longitude]}
                    radius={50}
                    pathOptions={{ color: '#14b8a6', fillColor: '#14b8a6', fillOpacity: 0.1 }}
                  />
                </MapContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                  <MapPin size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">No location data available</p>
                  <button onClick={() => navigate(`/shops/edit/${id}`)}
                    className="mt-2 text-xs text-teal-600 hover:underline font-medium">
                    Add location →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ClipboardList size={15} className="text-teal-600" />
                <h2 className="text-sm font-semibold text-gray-800">Recent Submissions</h2>
              </div>
              <button
                onClick={() => navigate(`/submissions?shop=${id}`)}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                View All →
              </button>
            </div>

            {submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <ClipboardList size={28} className="mb-2 opacity-30" />
                <p className="text-sm">No submissions yet for this shop</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {submissions.slice(0, 5).map((sub, i) => (
                  <div key={sub._id || i}
                    onClick={() => navigate(`/submissions/${sub._id}`)}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold flex-shrink-0">
                      {getInitials(sub.user?.name || 'U')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {sub.activityType?.name || 'Activity'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {sub.user?.name || '—'} · {timeAgo(sub.createdAt)}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      sub.syncStatus === 'synced' ? 'bg-teal-50 text-teal-600'
                      : sub.syncStatus === 'failed' ? 'bg-red-50 text-red-600'
                      : 'bg-amber-50 text-amber-600'
                    }`}>
                      {sub.syncStatus || 'pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showDelete && (
        <DeleteModal
          shop={shop}
          onClose={() => setShowDelete(false)}
          onConfirm={() => deleteMut.mutate()}
          loading={deleteMut.isPending}
        />
      )}
    </div>
  );
};

export default ShopDetail;