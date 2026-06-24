import React, { useState } from 'react';
import { BookOpen, Layers, Cpu, CheckCircle, Smartphone, Sliders, ArrowRight } from 'lucide-react';

const Docs = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const menuItems = [
    { id: 'overview', label: '1. Platform Overview', icon: BookOpen },
    { id: 'mvp', label: '2. MVP Feature Scope', icon: Layers },
    { id: 'architecture', label: '3. System Architecture', icon: Cpu },
    { id: 'dod', label: '4. Definition of Done', icon: CheckCircle },
  ];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-gray-50 text-gray-800">
      {/* ─── SIDEBAR NAVIGATION ─── */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-1 flex-shrink-0">
        <div className="px-3 py-2 mb-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">FieldOps Documentation</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Platform Manual v1.0</p>
        </div>
        
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === item.id
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={16} className={activeTab === item.id ? 'text-teal-600' : 'text-gray-400'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── CONTENT AREA ─── */}
      <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto">
        
        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wide">Module 1</span>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">Platform Overview & Purpose</h1>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                FieldOps is a configurable field-force data collection and monitoring platform designed for organizations that deploy personnel to markets for retail audits, surveys, merchandising evaluation, and operational compliance tracking.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Sliders size={16} className="text-teal-600" /> Core Business Challenges Solved
              </h3>
              <ul className="space-y-2.5 text-xs text-gray-600 pl-1">
                <li className="flex gap-2">
                  <span className="text-teal-500 font-bold">✓</span>
                  <div><strong>Trust & Traceability:</strong> Replaces inaccurate manual processes with location-aware validation, time evidence, and mandatory photo proof for active field visits.</div>
                </li>
                <li className="flex gap-2">
                  <span className="text-teal-500 font-bold">✓</span>
                  <div><strong>Offline Reliability:</strong> Ensures smooth business workflows even in low or zero internet connectivity environments by leveraging local storage mechanisms.</div>
                </li>
                <li className="flex gap-2">
                  <span className="text-teal-500 font-bold">✓</span>
                  <div><strong>Client-to-Client Configurability:</strong> Adapts to multiple dynamic forms and business rules without requiring system recoding or engineering rebuilds.</div>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ─── TAB 2: MVP SCOPE ─── */}
        {activeTab === 'mvp' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wide">Module 2</span>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">MVP Feature Scope</h1>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                The Minimum Viable Product (MVP) core focuses on establishing baseline multi-tenant operational security and validation protocols across platforms.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <Smartphone size={16} className="text-teal-600" /> Mobile Application Scope
                </h3>
                <ul className="space-y-2 text-xs text-gray-600 list-disc list-inside">
                  <li>Secure Multi-tenant Sign-in & Device Authentication</li>
                  <li>Geofenced Shop Check-In / Check-Out Actions</li>
                  <li>Dynamic Form Rendering Engine based on Admin configs</li>
                  <li>Local Storage Queue & Background Sync Engine</li>
                </ul>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <Layers size={16} className="text-teal-600" /> Web Dashboard Scope
                </h3>
                <ul className="space-y-2 text-xs text-gray-600 list-disc list-inside">
                  <li>Role-Based Access Control (Admin, Manager, Surveyor)</li>
                  <li>Hierarchical Shop Profiling & Territorry Assignment</li>
                  <li>Dynamic Form Builder & Schema Template Management</li>
                  <li>Submission Monitoring Stream & CSV/Excel Data Extraction</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: ARCHITECTURE ─── */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wide">Module 3</span>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">System Architecture & Sync Strategy</h1>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                The platform relies on a distributed multi-tenant layout optimized for local-first execution using a flexible MERN core.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Cpu size={16} className="text-teal-600" /> Synchronization Logic
              </h3>
              <div className="space-y-3 text-xs text-gray-600">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="font-semibold text-gray-700 flex items-center gap-1.5"><ArrowRight size={12} className="text-teal-600" /> Upward Sync (Submissions)</p>
                  <p className="mt-1 text-gray-500">Submissions are locally queued with high-precision UUIDs and sequential timestamps. Once connectivity is established, a network interceptor safely processes the pipeline to guarantee zero duplication.</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="font-semibold text-gray-700 flex items-center gap-1.5"><ArrowRight size={12} className="text-teal-600" /> Downward Sync (Configuration)</p>
                  <p className="mt-1 text-gray-500">Devices query the server with a `last_sync_timestamp`. The backend evaluates the record and delivers Delta Sync updates (forms, assignments, rules) to maximize efficiency.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: DEFINITION OF DONE ─── */}
        {activeTab === 'dod' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wide">Module 4</span>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">MVP Definition of Done (DoD)</h1>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                A milestone release is considered qualified for implementation or production handover once the following assertions pass:
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
              <div className="p-4 flex items-start gap-3">
                <input type="checkbox" checked readOnly className="mt-1 rounded text-teal-600 focus:ring-teal-500" />
                <div>
                  <h4 className="text-xs font-semibold text-gray-800">Dynamic Template Builder Integrity</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Admins must be able to design, structure, and deploy a complex form with up to 10 distinct input configurations directly to target groups.</p>
                </div>
              </div>
              <div className="p-4 flex items-start gap-3">
                <input type="checkbox" checked readOnly className="mt-1 rounded text-teal-600 focus:ring-teal-500" />
                <div>
                  <h4 className="text-xs font-semibold text-gray-800">Offline Queue Resiliency</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Field users must be capable of processing and storing at least 5 structured submissions without crashes or system exceptions when disconnected from network streams.</p>
                </div>
              </div>
              <div className="p-4 flex items-start gap-3">
                <input type="checkbox" checked readOnly className="mt-1 rounded text-teal-600 focus:ring-teal-500" />
                <div>
                  <h4 className="text-xs font-semibold text-gray-800">Idempotent Sync Verification</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">When online signals restore, background execution threads must process local queues into backend datasets with authenticated alignment and no data duplication.</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Docs;