import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ChevronRight, Save, X, MapPin, Info,
  Settings2, Loader2, AlertTriangle
} from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

// Fix leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Map Click Handler ────────────────────────────────────────
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// ─── Map Recenter & Zoom Controller ───────────────────────────
const ChangeMapView = ({ center, zoom }) => {
  const map = useMapEvents({});
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, {
        animate: true,
        duration: 1.5, // smooth fly animation duration in seconds
      });
    }
  }, [center, zoom, map]);
  return null;
};

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
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-left bg-white flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400">
        <span className={selected ? 'text-gray-800' : 'text-gray-400'}>
          {isLoading ? 'Loading...' : selected ? selected.name : 'Select territory...'}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search territory..." autoFocus
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
          </div>
          <div className="max-h-48 overflow-y-auto">
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 italic border-b border-gray-100">
              — No Territory —
            </button>
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">No territories found</div>
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

// ─── Main ShopForm Page ───────────────────────────────────────
const ShopForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // edit mode
  const qc = useQueryClient();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '',
    ownerName: '',
    phone: '',
    address: '',
    area: '',
    city: '',
    shopType: '',
    territory: '',
    status: 'active',
    latitude: null,
    longitude: null,
  });

  const [mapCenter, setMapCenter] = useState([30.3753, 69.3451]); // Pakistan center
  const [markerPos, setMarkerPos] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Fetch shop data if edit mode
  const { isLoading: fetchLoading, data: shopData } = useQuery({
    queryKey: ['shop', id],
    queryFn: () => API.get(`/shops/${id}`).then(r => r.data),
    enabled: isEdit,
  });

  // Populate form when data loads
  useEffect(() => {
    if (shopData && isEdit) {
      setForm({
        name: shopData.name || '',
        ownerName: shopData.ownerName || '',
        phone: shopData.phone || '',
        address: shopData.address || '',
        area: shopData.area || '',
        city: shopData.city || '',
        shopType: shopData.shopType || '',
        territory: shopData.territory?._id || shopData.territory || '',
        status: shopData.status || 'active',
        latitude: shopData.latitude || null,
        longitude: shopData.longitude || null,
      });
      if (shopData.latitude && shopData.longitude) {
        setMapCenter([shopData.latitude, shopData.longitude]);
        setMarkerPos([shopData.latitude, shopData.longitude]);
      }
    }
  }, [shopData, isEdit]);

  const handleLocationSelect = (lat, lng) => {
    const roundedLat = Math.round(lat * 10000) / 10000;
    const roundedLng = Math.round(lng * 10000) / 10000;
    setMarkerPos([lat, lng]);
    setMapCenter([lat, lng]); // Map auto center update on click
    set('latitude', roundedLat);
    set('longitude', roundedLng);
  };

  const handleLatLngInput = (key, val) => {
    const num = parseFloat(val);
    set(key, isNaN(num) ? null : num);
    if (key === 'latitude' && form.longitude && !isNaN(num)) {
      setMapCenter([num, form.longitude]);
      setMarkerPos([num, form.longitude]);
    }
    if (key === 'longitude' && form.latitude && !isNaN(num)) {
      setMapCenter([form.latitude, num]);
      setMarkerPos([form.latitude, num]);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    toast.loading('Getting location...', { id: 'geo' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        handleLocationSelect(latitude, longitude);
        setMapCenter([latitude, longitude]);
        toast.success('Location set!', { id: 'geo' });
      },
      () => toast.error('Could not get location', { id: 'geo' })
    );
  };

  const saveMut = useMutation({
    mutationFn: (payload) => isEdit
      ? API.put(`/shops/${id}`, payload).then(r => r.data)
      : API.post('/shops', payload).then(r => r.data),
    onSuccess: () => {
      toast.success(isEdit ? 'Shop updated successfully' : 'Shop created successfully');
      qc.invalidateQueries(['shops']);
      navigate('/shops');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const handleSave = () => {
    if (!form.name.trim()) return toast.error('Shop name is required');
    saveMut.mutate(form);
  };

  if (fetchLoading) return (
    <div className="flex items-center justify-center h-full py-20">
      <Loader2 size={24} className="animate-spin text-gray-300" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 min-h-full">

      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <button onClick={() => navigate('/shops')} className="hover:text-teal-600 transition-colors">Shops</button>
          <ChevronRight size={14} />
          <span className="text-teal-600 font-medium">{isEdit ? 'Edit Shop' : 'Create New Shop'}</span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Shop Profile' : 'Establish Shop Profile'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isEdit ? 'Update shop details and location.' : 'Register a new shop with location and operational details.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/shops')}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors">
              <X size={15} /> Cancel
            </button>
            <button onClick={handleSave} disabled={saveMut.isPending}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
              {saveMut.isPending
                ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
                : <><Save size={15} /> {isEdit ? 'Save Changes' : 'Save Shop Details'}</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* Top Row: Core Logistics + Operational Parameters */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Core Logistics */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Info size={16} className="text-teal-600" />
            <h2 className="text-base font-semibold text-gray-800">Core Logistics</h2>
          </div>
          <div className="space-y-4">
            {/* Shop Name */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                Shop Name <span className="text-red-400">*</span>
              </label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. Downtown Central Hub"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
            </div>

            {/* Shopkeeper + Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Shopkeeper Name</label>
                <input value={form.ownerName} onChange={e => set('ownerName', e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Phone Number</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="+92 300 0000000"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
              </div>
            </div>

            {/* Area + City */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Area</label>
                <input value={form.area} onChange={e => set('area', e.target.value)}
                  placeholder="e.g. Gulberg Sector 4"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">City</label>
                <input value={form.city} onChange={e => set('city', e.target.value)}
                  placeholder="e.g. Lahore"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400" />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Full Physical Address</label>
              <textarea value={form.address} onChange={e => set('address', e.target.value)}
                placeholder="Street, Building, Suite No."
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 resize-none" />
            </div>

            {/* Shop Type */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Shop Type</label>
              <select value={form.shopType} onChange={e => set('shopType', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400">
                <option value="">— Select type —</option>
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="distributor">Distributor</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="grocery">Grocery</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Operational Parameters */}
        <div className="space-y-4">
          {/* Territory + Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Settings2 size={16} className="text-teal-600" />
              <h2 className="text-base font-semibold text-gray-800">Operational Parameters</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Territory Selector</label>
                <TerritorySelector value={form.territory} onChange={v => set('territory', v)} />
              </div>

              {/* Active Status Toggle */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-800">Active Status</div>
                  <div className="text-xs text-gray-400 mt-0.5">Enable shop for field operations</div>
                </div>
                <button
                  type="button"
                  onClick={() => set('status', form.status === 'active' ? 'inactive' : 'active')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    form.status === 'active' ? 'bg-teal-500' : 'bg-gray-300'
                  }`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    form.status === 'active' ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Operational Tip */}
          <div className="bg-slate-900 rounded-xl p-5 flex items-start gap-3">
            <div className="w-9 h-9 bg-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-teal-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Operational Tip</div>
              <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                Ensure latitude and longitude are precise to within 5 meters for accurate field routing and geofence validation.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Map Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-teal-600" />
            <h2 className="text-base font-semibold text-gray-800">Precise Geospatial Data</h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Lat/Lng inputs */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={form.latitude || ''}
                  onChange={e => handleLatLngInput('latitude', e.target.value)}
                  placeholder="e.g. 31.5204"
                  className="w-32 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={form.longitude || ''}
                  onChange={e => handleLatLngInput('longitude', e.target.value)}
                  placeholder="e.g. 74.3587"
                  className="w-32 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                />
              </div>
            </div>
            <button onClick={getCurrentLocation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors">
              <MapPin size={13} /> Use My Location
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="relative h-96">
          <MapContainer
            center={mapCenter}
            zoom={16} // Default zoom increased from 13 to 16 for better street view
            style={{ height: '100%', width: '100%' }}
            whenReady={() => setMapReady(true)}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Dynamic Map Recenter & Fly Controller */}
            <ChangeMapView center={mapCenter} zoom={16} />

            <MapClickHandler onLocationSelect={handleLocationSelect} />
            {markerPos && <Marker position={markerPos} />}
          </MapContainer>

          {/* Current Selection overlay */}
          {markerPos && (
            <div className="absolute bottom-4 left-4 z-[999] bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 max-w-xs">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={14} className="text-teal-600" />
                <span className="text-sm font-semibold text-gray-800">Current Selection</span>
              </div>
              <p className="text-xs text-gray-500">
                {form.latitude?.toFixed(4)}° N, {form.longitude?.toFixed(4)}° E
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Click map to recalibrate location</p>
            </div>
          )}

          {/* Click hint if no marker */}
          {!markerPos && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[999]">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 px-5 py-3 text-center">
                <MapPin size={20} className="text-teal-500 mx-auto mb-1" />
                <p className="text-sm font-medium text-gray-700">Click on the map to set shop location</p>
                <p className="text-xs text-gray-400 mt-0.5">Or use "Use My Location" button above</p>
              </div>
            </div>
          )}
        </div>

        {/* Warning if no location set */}
        {!form.latitude && !form.longitude && (
          <div className="flex items-center gap-2 px-6 py-3 bg-amber-50 border-t border-amber-100">
            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Location not set. Field agents will not be able to validate their position at this shop.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default ShopForm;
