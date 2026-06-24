import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight, Save, X, Loader2, Plus, Trash2,
  GripVertical, Clock, Info, Smartphone, Check
} from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

// ─── Field Types (per backend enum + requirement) ─────────────
const FIELD_TYPES = [
  { value: 'short_text',       label: 'Short Text' },
  { value: 'long_text',        label: 'Long Text' },
  { value: 'single_select',    label: 'Single Select' },
  { value: 'multi_select',     label: 'Multi Select' },
  { value: 'number',           label: 'Number' },
  { value: 'date',             label: 'Date' },
  { value: 'boolean',         label: 'Yes / No' },
  { value: 'photo',            label: 'Photo' },
  { value: 'product_checklist',label: 'Product Checklist' },
  { value: 'rating',           label: 'Rating' },
];

const TYPE_LABEL = Object.fromEntries(FIELD_TYPES.map(t => [t.value, t.label]));

let tempId = 0;
const newField = (order) => ({
  _tempId: ++tempId,
  label: '',
  type: 'short_text',
  placeholder: '',
  required: false,
  order,
  options: [],
  validationRules: {},
  conditionalLogic: false,
});

// ─── Drag-to-Reorder Field List ───────────────────────────────
const DraggableFieldList = ({ fields, selectedIdx, onSelect, onReorder, onAdd }) => {
  const dragIdx = useRef(null);
  const dragOverIdx = useRef(null);

  const handleDragStart = (i) => { dragIdx.current = i; };
  const handleDragEnter = (i) => { dragOverIdx.current = i; };
  const handleDragEnd = () => {
    if (dragIdx.current === null || dragOverIdx.current === null) return;
    if (dragIdx.current === dragOverIdx.current) return;
    const updated = [...fields];
    const dragged = updated.splice(dragIdx.current, 1)[0];
    updated.splice(dragOverIdx.current, 0, dragged);
    onReorder(updated.map((f, i) => ({ ...f, order: i })));
    const newSelected = dragOverIdx.current;
    dragIdx.current = null;
    dragOverIdx.current = null;
    onSelect(newSelected);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      {fields.map((f, i) => (
        <div
          key={f._tempId || f._id || i}
          draggable
          onDragStart={() => handleDragStart(i)}
          onDragEnter={() => handleDragEnter(i)}
          onDragEnd={handleDragEnd}
          onDragOver={e => e.preventDefault()}
          onClick={() => onSelect(i)}
          className={`flex items-center gap-2.5 p-3 rounded-xl cursor-pointer border transition-all select-none ${
            selectedIdx === i
              ? 'bg-teal-50 border-teal-300'
              : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}>
          <GripVertical size={14} className="text-gray-300 flex-shrink-0 cursor-grab" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">
              {f.label || 'Untitled Field'}
            </div>
            <div className="text-xs text-gray-400">{TYPE_LABEL[f.type] || f.type}</div>
          </div>
          {selectedIdx === i && (
            <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
              <Check size={11} className="text-white" strokeWidth={3} />
            </div>
          )}
        </div>
      ))}

      {/* Add Field */}
      <button onClick={onAdd}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 transition-all">
        <Plus size={16} /> Add New Field
      </button>
    </div>
  );
};

// ─── Field Settings Panel ─────────────────────────────────────
const FieldSettings = ({ field, onChange, onDelete }) => {
  const [optionInput, setOptionInput] = useState('');
  const needsOptions = ['single_select', 'multi_select'].includes(field.type);
  const needsCharLimit = ['short_text', 'long_text'].includes(field.type);

  const addOption = () => {
    if (!optionInput.trim()) return;
    onChange({ ...field, options: [...(field.options || []), optionInput.trim()] });
    setOptionInput('');
  };

  const removeOption = (i) => {
    const opts = [...(field.options || [])];
    opts.splice(i, 1);
    onChange({ ...field, options: opts });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Field Settings</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure properties for '{field.label || 'New Field'}'
          </p>
        </div>
        <button onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="p-5 space-y-5">

        {/* Label + Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Field Label</label>
            <input
              value={field.label}
              onChange={e => onChange({ ...field, label: e.target.value })}
              placeholder="e.g. Warehouse Location"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Field Type</label>
            <select
              value={field.type}
              onChange={e => onChange({ ...field, type: e.target.value, options: [] })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400">
              {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {/* Required + Conditional Logic */}
        <div className="flex items-center gap-6 flex-wrap">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <button type="button" onClick={() => onChange({ ...field, required: !field.required })}
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${field.required ? 'bg-teal-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${field.required ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className="text-sm text-gray-700">Required field</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <button type="button" onClick={() => onChange({ ...field, conditionalLogic: !field.conditionalLogic })}
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${field.conditionalLogic ? 'bg-teal-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${field.conditionalLogic ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className="text-sm text-gray-700">Enable conditional logic</span>
          </label>
        </div>

        {/* Options for select types */}
        {needsOptions && (
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-2">
              Options <span className="text-gray-400 font-normal">(press Enter to add)</span>
            </label>
            <div className="space-y-1.5 mb-2">
              {(field.options || []).map((opt, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-700 flex-1">{opt}</span>
                  <button onClick={() => removeOption(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={optionInput}
                onChange={e => setOptionInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addOption()}
                placeholder="Type option and press Enter..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
              />
              <button onClick={addOption}
                className="px-3 py-2 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors">
                + Add
              </button>
            </div>
          </div>
        )}

        {/* Input Rules */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-gray-500">Input Rules</label>
            <span className="text-xs text-teal-600 font-medium">+ Add Rule</span>
          </div>
          <div className="space-y-2">
            {needsCharLimit && (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-base leading-none">≡</span> Character Limit
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={field.validationRules?.maxLength || ''}
                    onChange={e => onChange({
                      ...field,
                      validationRules: { ...field.validationRules, maxLength: parseInt(e.target.value) || undefined }
                    })}
                    placeholder="120"
                    className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center focus:outline-none focus:border-teal-400"
                  />
                  <span className="text-xs text-gray-400">max</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-base leading-none font-bold">A</span> Validation Pattern
              </div>
              <select
                value={field.validationRules?.pattern || ''}
                onChange={e => onChange({
                  ...field,
                  validationRules: { ...field.validationRules, pattern: e.target.value }
                })}
                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-teal-400 text-gray-600">
                <option value="">None</option>
                <option value="alphanumeric">Alphanumeric</option>
                <option value="numeric">Numeric only</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </div>
          </div>
        </div>

        {/* Help Text / Placeholder */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Help Text / Placeholder</label>
          <textarea
            value={field.placeholder}
            onChange={e => onChange({ ...field, placeholder: e.target.value })}
            placeholder="e.g. Enter the zone and aisle number (Ex: A-42)"
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">This text will appear beneath the field to guide field operators.</p>
        </div>
      </div>
    </div>
  );
};

// ─── Main FormEditor ──────────────────────────────────────────
const FormEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const qc = useQueryClient();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [fields, setFields] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);

  // Fetch form if edit
  const { isLoading: fetchLoading, data: formData } = useQuery({
    queryKey: ['form-template', id],
    queryFn: () => API.get(`/forms/${id}`).then(r => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (formData && isEdit) {
      setName(formData.name || '');
      setIsActive(formData.isActive ?? true);
      const loaded = (formData.fields || [])
        .sort((a, b) => a.order - b.order)
        .map((f, i) => ({ ...f, _tempId: f._id || i, conditionalLogic: false }));
      setFields(loaded);
      setSelectedIdx(loaded.length > 0 ? 0 : null);
    }
  }, [formData, isEdit]);

  const addField = () => {
    const f = newField(fields.length);
    setFields(prev => [...prev, f]);
    setSelectedIdx(fields.length);
  };

  const updateField = (idx, updated) => {
    setFields(prev => prev.map((f, i) => i === idx ? updated : f));
  };

  const deleteField = (idx) => {
    const updated = fields.filter((_, i) => i !== idx);
    setFields(updated);
    setSelectedIdx(updated.length > 0 ? Math.max(0, idx - 1) : null);
  };

  const estTime = Math.max(1, fields.length * 2);
  const version = `v${Math.floor(fields.length / 5) + 1}.${Math.floor(fields.length / 2) % 3}.${fields.length % 3}`;

  const saveMut = useMutation({
    mutationFn: (payload) => isEdit
      ? API.put(`/forms/${id}`, payload).then(r => r.data)
      : API.post('/forms', payload).then(r => r.data),
    onSuccess: () => {
      toast.success(isEdit ? 'Template updated' : 'Template created');
      qc.invalidateQueries(['form-templates']);
      navigate('/forms');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const handleSave = () => {
    if (!name.trim()) return toast.error('Template name is required');
    if (fields.length === 0) return toast.error('Add at least one field');
    const invalid = fields.find(f => !f.label.trim());
    if (invalid) return toast.error('All fields must have a label');

    saveMut.mutate({
      name,
      isActive,
      fields: fields.map((f, i) => ({
        label: f.label,
        type: f.type,
        placeholder: f.placeholder || '',
        required: f.required,
        order: i,
        options: f.options || [],
        validationRules: f.validationRules || {},
      })),
    });
  };

  if (fetchLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-gray-300" />
    </div>
  );

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 flex-wrap gap-3 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <button onClick={() => navigate('/forms')} className="hover:text-teal-600 transition-colors">Forms</button>
            <ChevronRight size={14} />
            <span className="text-gray-600 font-medium">Template Editor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-300 text-lg">≡</span>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter template name..."
              className="text-xl font-bold text-gray-900 border-none outline-none bg-transparent placeholder-gray-300 w-80"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/forms')}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors">
            Discard Changes
          </button>
          <button onClick={handleSave} disabled={saveMut.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
            {saveMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Template
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Form Structure */}
        <div className="w-72 flex-shrink-0 flex flex-col bg-white border-r border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-700">Form Structure</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
              {fields.length} {fields.length === 1 ? 'Field' : 'Fields'}
            </span>
          </div>

          <DraggableFieldList
            fields={fields}
            selectedIdx={selectedIdx}
            onSelect={setSelectedIdx}
            onReorder={setFields}
            onAdd={addField}
          />

          {/* Estimated Time */}
          <div className="p-3 flex-shrink-0 border-t border-gray-100">
            <div className="bg-slate-900 rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-1">Estimated Completion Time</div>
              <div className="text-2xl font-bold text-white mb-2">~{estTime} minutes</div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                  {fields.length > 5 ? 'High Density' : 'Standard'}
                </span>
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">Field Only</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Field Settings */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {selectedIdx !== null && fields[selectedIdx] ? (
            <div className="flex-1 overflow-hidden flex flex-col bg-white">
              <FieldSettings
                field={fields[selectedIdx]}
                onChange={(updated) => updateField(selectedIdx, updated)}
                onDelete={() => deleteField(selectedIdx)}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Plus size={24} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium">No field selected</p>
              <p className="text-xs mt-1">Add a field or click one to configure it</p>
              <button onClick={addField}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                <Plus size={14} /> Add First Field
              </button>
            </div>
          )}

          {/* Bottom Tips */}
          <div className="grid grid-cols-3 gap-4 p-5 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-teal-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">
                Use <span className="font-semibold">Product Checklist</span> for inventory counts to ensure barcodes are scanned correctly.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Clock size={14} className="text-teal-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">
                Templates are version-controlled. Saving will create <span className="font-semibold">{version}</span> automatically.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Smartphone size={14} className="text-teal-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">
                Preview on <span className="font-semibold">Mobile</span> to ensure text labels aren't cut off in portrait mode.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormEditor;
