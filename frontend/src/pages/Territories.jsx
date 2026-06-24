import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronRight, ChevronDown, MapPin, Globe, Navigation, Route, ToggleLeft, ToggleRight, Search, X, AlertTriangle } from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

// ── Type config ──────────────────────────────────────────────
const TYPE_CONFIG = {
  region: { label: 'Region', color: 'bg-purple-100 text-purple-700', icon: Globe },
  city:   { label: 'City',   color: 'bg-blue-100 text-blue-700',   icon: MapPin },
  zone:   { label: 'Zone',   color: 'bg-teal-100 text-teal-700',   icon: Navigation },
  route:  { label: 'Route',  color: 'bg-orange-100 text-orange-700', icon: Route },
};

// ── Delete Confirm Modal ─────────────────────────────────────
const DeleteModal = ({ territory, onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <AlertTriangle size={20} className="text-red-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">Delete Territory</h3>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Are you sure you want to delete <span className="font-semibold text-gray-800">"{territory.name}"</span>? This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <button onClick={onClose}
          className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors">
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ── Territory Form Modal ──────────────────────────────────────
const TerritoryModal = ({ territory, allTerritories, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: territory?.name || '',
    type: territory?.type || 'region',
    parent: territory?.parent?._id || territory?.parent || '',
    isActive: territory?.isActive !== false,
  });
  const [loading, setLoading] = useState(false);

  const isEdit = !!territory?._id;

  // Parent options — exclude self and own children
  const parentOptions = allTerritories.filter(t => t._id !== territory?._id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Territory name is required');
    if (!form.type) return toast.error('Type is required');

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        parent: form.parent || null,
        isActive: form.isActive,
      };

      if (isEdit) {
        await API.put(`/territories/${territory._id}`, payload);
        toast.success('Territory updated');
      } else {
        await API.post('/territories', payload);
        toast.success('Territory created');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Edit Territory' : 'Add Territory'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Lahore, Punjab, Zone A"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all bg-gray-50"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: key }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      form.type === key
                        ? 'border-teal-400 bg-teal-50 text-teal-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                    <Icon size={14} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Parent Territory <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={form.parent}
              onChange={e => setForm(f => ({ ...f, parent: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all bg-gray-50">
              <option value="">— No Parent —</option>
              {parentOptions.map(t => (
                <option key={t._id} value={t._id}>
                  {t.name} ({TYPE_CONFIG[t.type]?.label || t.type})
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <div className="text-sm font-medium text-gray-700">Active</div>
              <div className="text-xs text-gray-400">Territory will be visible and usable</div>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              className={`transition-colors ${form.isActive ? 'text-teal-500' : 'text-gray-300'}`}>
              {form.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : isEdit ? 'Save Changes' : 'Create Territory'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Territory Row (recursive) ─────────────────────────────────
const TerritoryRow = ({ territory, level, allTerritories, onEdit, onDelete, onToggle }) => {
  const [expanded, setExpanded] = useState(true);
  const children = allTerritories.filter(t =>
    (t.parent?._id || t.parent) === territory._id
  );
  const hasChildren = children.length > 0;
  const cfg = TYPE_CONFIG[territory.type] || { label: territory.type, color: 'bg-gray-100 text-gray-600', icon: MapPin };
  const Icon = cfg.icon;

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors group">
        <td className="px-6 py-3.5">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
            {/* Expand toggle */}
            <button
              onClick={() => hasChildren && setExpanded(e => !e)}
              className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
                hasChildren ? 'text-gray-400 hover:text-gray-600' : 'text-transparent'
              }`}>
              {hasChildren
                ? expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                : <span className="w-3.5 h-px bg-gray-200 block ml-1" />
              }
            </button>

            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
              <Icon size={13} className="text-slate-600" />
            </div>
            <span className="text-sm font-medium text-gray-800">{territory.name}</span>

            {children.length > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                {children.length}
              </span>
            )}
          </div>
        </td>

        <td className="px-6 py-3.5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.color}`}>
            <Icon size={11} />
            {cfg.label}
          </span>
        </td>

        <td className="px-6 py-3.5 text-sm text-gray-500">
          {(() => {
            const parentId = territory.parent?._id || territory.parent;
            if (!parentId) return <span className="text-gray-300">—</span>;
            const parent = allTerritories.find(t => t._id === parentId);
            return parent ? (
              <span className="flex items-center gap-1.5">
                <ChevronRight size={12} className="text-gray-300" />
                {parent.name}
              </span>
            ) : <span className="text-gray-300">—</span>;
          })()}
        </td>

        <td className="px-6 py-3.5">
          <button onClick={() => onToggle(territory)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              territory.isActive
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${territory.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {territory.isActive ? 'Active' : 'Inactive'}
          </button>
        </td>

        <td className="px-6 py-3.5">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(territory)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-teal-50 text-gray-400 hover:text-teal-600 transition-colors">
              <Edit2 size={14} />
            </button>
            <button onClick={() => onDelete(territory)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>

      {/* Children */}
      {hasChildren && expanded && children.map(child => (
        <TerritoryRow
          key={child._id}
          territory={child}
          level={level + 1}
          allTerritories={allTerritories}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggle={onToggle}
        />
      ))}
    </>
  );
};

// ── Main Page ─────────────────────────────────────────────────
const Territories = () => {
  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchTerritories = async () => {
    try {
      const { data } = await API.get('/territories');
      setTerritories(data);
    } catch (err) {
      toast.error('Failed to load territories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTerritories(); }, []);

  const handleEdit = (t) => { setEditTarget(t); setShowModal(true); };
  const handleAdd = () => { setEditTarget(null); setShowModal(true); };
  const handleModalClose = () => { setShowModal(false); setEditTarget(null); };
  const handleSaved = () => { handleModalClose(); fetchTerritories(); };

  const handleToggle = async (t) => {
    try {
      await API.put(`/territories/${t._id}`, { isActive: !t.isActive });
      toast.success(`${t.name} ${!t.isActive ? 'activated' : 'deactivated'}`);
      fetchTerritories();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await API.delete(`/territories/${deleteTarget._id}`);
      toast.success('Territory deleted');
      setDeleteTarget(null);
      fetchTerritories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  // Filter
  const filtered = territories.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || t.type === filterType;
    return matchSearch && matchType;
  });

  // Root territories (no parent, or parent not in filtered list for search mode)
  const roots = search || filterType
    ? filtered
    : filtered.filter(t => !t.parent || !territories.find(x => x._id === (t.parent?._id || t.parent)));

  // Stats
  const stats = Object.keys(TYPE_CONFIG).map(type => ({
    type,
    count: territories.filter(t => t.type === type).length,
    ...TYPE_CONFIG[type],
  }));

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Territories</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage regions, cities, zones and routes</p>
        </div>
        <button onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} />
          Add Territory
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ type, count, label, color, icon: Icon }) => (
          <div key={type} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium ${color}`}>
                <Icon size={10} />
                {label}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{count}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search territories..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all bg-gray-50"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                !filterType ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              All
            </button>
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setFilterType(filterType === key ? '' : key)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  filterType === key ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : roots.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MapPin size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">No territories found</p>
            <p className="text-xs text-gray-400 mt-1">
              {search || filterType ? 'Try different filters' : 'Add your first territory to get started'}
            </p>
            {!search && !filterType && (
              <button onClick={handleAdd}
                className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
                Add Territory
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Parent</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(search || filterType
                ? filtered
                : roots
              ).map(territory => (
                <TerritoryRow
                  key={territory._id}
                  territory={territory}
                  level={0}
                  allTerritories={territories}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                  onToggle={handleToggle}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <TerritoryModal
          territory={editTarget}
          allTerritories={territories}
          onClose={handleModalClose}
          onSave={handleSaved}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          territory={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default Territories;