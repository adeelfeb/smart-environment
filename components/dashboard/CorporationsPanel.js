'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';
import Modal from '../Modal';

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    credentials: 'include',
  };
}

export default function CorporationsPanel({ user }) {
  const [corporations, setCorporations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingCorp, setEditingCorp] = useState(null);
  const [form, setForm] = useState({ name: '', state: '', district: '' });
  const [formStatus, setFormStatus] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showGuide, setShowGuide] = useState(false);
  const [search, setSearch] = useState('');

  const fetchCorporations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/corporations?includeInactive=true', {
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await safeParseJsonResponse(res);
      if (data.success && data.data) {
        setCorporations(data.data.corporations || data.data || []);
      } else {
        setError(data.message || 'Failed to load corporations');
      }
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCorporations(); }, [fetchCorporations]);

  const openAdd = () => {
    setEditingCorp(null);
    setForm({ name: '', state: '', district: '' });
    setFormStatus(true);
    setShowModal(true);
  };

  const openEdit = (corp) => {
    setEditingCorp(corp);
    setForm({ name: corp.name || '', state: corp.state || '', district: corp.district || '' });
    setFormStatus(corp.isActive !== false);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const isEdit = !!editingCorp;
      const url = isEdit ? `/api/corporations/${editingCorp._id || editingCorp.id}` : '/api/corporations';
      const method = isEdit ? 'PUT' : 'POST';
      const body = { name: form.name.trim(), state: form.state.trim(), district: form.district.trim() };
      if (isEdit) body.isActive = formStatus;
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await safeParseJsonResponse(res);
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save');
      setShowModal(false);
      fetchCorporations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (corp) => {
    try {
      const res = await fetch(`/api/corporations/${corp._id || corp.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ isActive: !corp.isActive }),
      });
      const data = await safeParseJsonResponse(res);
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update');
      fetchCorporations();
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = corporations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.state?.toLowerCase().includes(q) || c.district?.toLowerCase().includes(q);
  });

  const stats = {
    total: corporations.length,
    active: corporations.filter((c) => c.isActive !== false).length,
    inactive: corporations.filter((c) => c.isActive === false).length,
  };

  return (
    <div className="cp">
      {/* Header */}
      <div className="cp-header">
        <div>
          <h2 className="cp-title">Corporations</h2>
          <p className="cp-sub">Manage corporations and their administrative wards</p>
        </div>
        <div className="cp-header-actions">
          <button className="cp-btn" onClick={() => setShowGuide(!showGuide)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Guide
          </button>
          <button className="cp-btn" onClick={fetchCorporations} disabled={loading}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Refresh
          </button>
          <button className="cp-btn cp-btn-primary" onClick={openAdd}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Corporation
          </button>
        </div>
      </div>

      {/* Guide */}
      {showGuide && (
        <div className="cp-guide">
          <div className="cp-guide-head">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>How to use this module</span>
            <button className="cp-guide-close" onClick={() => setShowGuide(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="cp-guide-steps">
            <div className="cp-guide-step">
              <span className="cp-guide-num">1</span>
              <div>
                <strong>Add a Corporation</strong>
                <p>Click the <em>Add Corporation</em> button in the top-right. Fill in the name, state, and district. Click <em>Save</em> to create it.</p>
              </div>
            </div>
            <div className="cp-guide-step">
              <span className="cp-guide-num">2</span>
              <div>
                <strong>Edit or Update</strong>
                <p>Click any row in the table to open the edit modal. From there you can change the name, state, district, or toggle the status (Active/Inactive).</p>
              </div>
            </div>
            <div className="cp-guide-step">
              <span className="cp-guide-num">3</span>
              <div>
                <strong>Manage Status</strong>
                <p>Use the <em>Activate / Deactivate</em> button in the table, or toggle the status switch inside the edit modal. Deactivated corporations are hidden from public views.</p>
              </div>
            </div>
            <div className="cp-guide-step">
              <span className="cp-guide-num">4</span>
              <div>
                <strong>Manage Wards</strong>
                <p>Open the edit modal for any corporation, then scroll to the <em>Administrative Wards</em> section. Add new wards with a name and number, edit existing ones, or toggle their status.</p>
              </div>
            </div>
            <div className="cp-guide-step">
              <span className="cp-guide-num">5</span>
              <div>
                <strong>Search &amp; Filter</strong>
                <p>Use the search bar to filter corporations by name, state, or district. The stats bar at the top shows total, active, and inactive counts at a glance.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="cp-alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{error}</span>
          <button className="cp-alert-x" onClick={() => setError('')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="cp-toolbar">
        <div className="cp-stats">
          <div className="cp-stat"><span className="cp-stat-v">{stats.total}</span><span className="cp-stat-l">Total</span></div>
          <div className="cp-stat cp-stat-active"><span className="cp-stat-dot"/><span className="cp-stat-v">{stats.active}</span><span className="cp-stat-l">Active</span></div>
          <div className="cp-stat cp-stat-inactive"><span className="cp-stat-dot"/><span className="cp-stat-v">{stats.inactive}</span><span className="cp-stat-l">Inactive</span></div>
        </div>
        <div className="cp-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button className="cp-search-x" onClick={() => setSearch('')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="cp-loading"><div className="cp-spinner"/><span>Loading...</span></div>
      ) : filtered.length === 0 ? (
        <div className="cp-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01M9 12v.01M9 15v.01"/></svg>
          <h3>{search ? 'No results' : 'No corporations yet'}</h3>
          <p>{search ? 'Try a different search.' : 'Add your first corporation to get started.'}</p>
          {!search && <button className="cp-btn cp-btn-primary" onClick={openAdd}>Add Corporation</button>}
        </div>
      ) : (
        <div className="cp-table-wrap">
          <table className="cp-table">
            <thead>
              <tr>
                <th className="cp-th" data-col="name">Corporation</th>
                <th className="cp-th" data-col="state">State</th>
                <th className="cp-th" data-col="district">District</th>
                <th className="cp-th" data-col="status">Status</th>
                <th className="cp-th cp-th-right" data-col="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((corp) => {
                const active = corp.isActive !== false;
                return (
                  <tr key={corp._id || corp.id} className="cp-row" onClick={() => openEdit(corp)}>
                    <td className="cp-td cp-td-name">{corp.name}</td>
                    <td className="cp-td cp-td-loc">{corp.state || <span className="cp-td-na">--</span>}</td>
                    <td className="cp-td cp-td-loc">{corp.district || <span className="cp-td-na">--</span>}</td>
                    <td className="cp-td">
                      <span className={`cp-badge ${active ? 'cp-badge-on' : 'cp-badge-off'}`}>
                        <span className="cp-badge-dot"/>{active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="cp-td cp-td-actions">
                      <div className="cp-act">
                        <button className={`cp-act-btn cp-act-toggle ${active ? '' : 'is-off'}`} onClick={(e) => { e.stopPropagation(); toggleActive(corp); }} title={active ? 'Deactivate' : 'Activate'}>
                          {active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="cp-act-btn cp-act-edit" onClick={(e) => { e.stopPropagation(); openEdit(corp); }} title="Edit corporation">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Comprehensive Edit/Add Modal */}
      <CorporationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editingCorp={editingCorp}
        form={form}
        setForm={setForm}
        formStatus={formStatus}
        setFormStatus={setFormStatus}
        saving={saving}
        onSave={handleSave}
      />

      <style jsx>{`
        .cp { width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; overflow-y: auto; flex: 1; min-height: 0; scrollbar-width: thin; scrollbar-color: rgba(148, 163, 184, 0.6) rgba(241, 245, 249, 0.8); }

        /* Header */
        .cp-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 24px; flex-wrap: wrap; }
        .cp-title { font-size: 1.6rem; font-weight: 700; color: #0f172a; margin: 0; }
        .cp-sub { font-size: 0.88rem; color: #64748b; margin: 4px 0 0; }
        .cp-header-actions { display: flex; gap: 10px; flex-shrink: 0; }

        /* Buttons */
        .cp-btn { padding: 8px 16px; border-radius: 8px; font-size: 0.84rem; font-weight: 500; cursor: pointer; border: 1px solid #e2e8f0; background: #fff; color: #334155; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; line-height: 1.4; }
        .cp-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
        .cp-btn:active { transform: scale(0.98); }
        .cp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cp-btn-primary { background: #10b981; color: #fff; border-color: #10b981; }
        .cp-btn-primary:hover { background: #059669; border-color: #059669; }
        .cp-btn-primary:disabled { background: #6ee7b7; border-color: #6ee7b7; }
        .cp-btn-sm { padding: 5px 10px; font-size: 0.78rem; border-radius: 6px; }

        /* Guide */
        .cp-guide { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
        .cp-guide-head { display: flex; align-items: center; gap: 8px; font-size: 0.95rem; font-weight: 600; color: #0c4a6e; margin-bottom: 16px; }
        .cp-guide-head svg { color: #0284c7; flex-shrink: 0; }
        .cp-guide-close { margin-left: auto; background: none; border: none; color: #0c4a6e; cursor: pointer; padding: 4px; border-radius: 6px; display: flex; opacity: 0.6; }
        .cp-guide-close:hover { opacity: 1; background: rgba(0,0,0,0.05); }
        .cp-guide-steps { display: flex; flex-direction: column; gap: 12px; }
        .cp-guide-step { display: flex; gap: 12px; align-items: flex-start; }
        .cp-guide-num { width: 24px; height: 24px; border-radius: 50%; background: #0284c7; color: #fff; font-size: 0.72rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
        .cp-guide-step strong { font-size: 0.85rem; color: #0f172a; display: block; margin-bottom: 2px; }
        .cp-guide-step p { font-size: 0.8rem; color: #475569; margin: 0; line-height: 1.5; }
        .cp-guide-step em { font-style: normal; background: #e0f2fe; padding: 1px 5px; border-radius: 4px; color: #0369a1; font-weight: 500; }

        /* Alert */
        .cp-alert { display: flex; align-items: center; gap: 10px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 14px; margin-bottom: 20px; font-size: 0.84rem; }
        .cp-alert-x { margin-left: auto; background: none; border: none; color: #dc2626; cursor: pointer; padding: 2px; border-radius: 4px; display: flex; opacity: 0.6; }
        .cp-alert-x:hover { opacity: 1; }

        /* Toolbar */
        .cp-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
        .cp-stats { display: flex; gap: 8px; }
        .cp-stat { display: flex; align-items: center; gap: 6px; padding: 6px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.82rem; }
        .cp-stat-v { font-weight: 700; color: #0f172a; font-size: 0.9rem; }
        .cp-stat-l { color: #64748b; font-weight: 500; }
        .cp-stat-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .cp-stat-active .cp-stat-dot { background: #10b981; }
        .cp-stat-active .cp-stat-v { color: #059669; }
        .cp-stat-inactive .cp-stat-dot { background: #ef4444; }
        .cp-stat-inactive .cp-stat-v { color: #dc2626; }
        .cp-search { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 14px; min-width: 240px; transition: border-color 0.2s, box-shadow 0.2s; }
        .cp-search:focus-within { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
        .cp-search svg { color: #94a3b8; flex-shrink: 0; }
        .cp-search input { flex: 1; border: none; outline: none; font-size: 0.85rem; color: #0f172a; background: transparent; min-width: 0; }
        .cp-search input::placeholder { color: #94a3b8; }
        .cp-search-x { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 2px; border-radius: 4px; display: flex; }
        .cp-search-x:hover { color: #64748b; background: #f1f5f9; }

        /* Loading / Empty */
        .cp-loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 56px 0; color: #64748b; font-size: 0.88rem; }
        .cp-spinner { width: 20px; height: 20px; border: 2.5px solid #e2e8f0; border-top-color: #10b981; border-radius: 50%; animation: cp-spin 0.7s linear infinite; }
        @keyframes cp-spin { to { transform: rotate(360deg); } }
        .cp-empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 56px 32px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; }
        .cp-empty svg { color: #cbd5e1; margin-bottom: 12px; }
        .cp-empty h3 { font-size: 1rem; font-weight: 600; color: #1e293b; margin: 0 0 4px; }
        .cp-empty p { color: #64748b; font-size: 0.88rem; margin: 0 0 16px; }

        /* Table */
        .cp-table-wrap { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
        .cp-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .cp-th { text-align: left; padding: 12px 16px; font-weight: 600; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
        .cp-th-right { text-align: right; }
        .cp-table th[data-col="name"] { width: 30%; }
        .cp-table th[data-col="state"] { width: 18%; }
        .cp-table th[data-col="district"] { width: 18%; }
        .cp-table th[data-col="status"] { width: 14%; }
        .cp-table th[data-col="actions"] { width: 20%; }

        /* Row */
        .cp-row { border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.12s; }
        .cp-row:last-child { border-bottom: none; }
        .cp-row:hover { background: #f8fafc; }
        .cp-td { padding: 14px 16px; vertical-align: middle; color: #334155; font-size: 0.85rem; }
        .cp-td-name { font-weight: 600; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cp-td-loc { color: #475569; }
        .cp-td-na { color: #94a3b8; font-style: italic; font-weight: 400; }
        .cp-td-actions { text-align: right; white-space: nowrap; }

        /* Badge */
        .cp-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 99px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
        .cp-badge-dot { width: 6px; height: 6px; border-radius: 50%; }
        .cp-badge-on { background: #ecfdf5; color: #065f46; }
        .cp-badge-on .cp-badge-dot { background: #10b981; }
        .cp-badge-off { background: #fef2f2; color: #991b1b; }
        .cp-badge-off .cp-badge-dot { background: #ef4444; }

        /* Action buttons */
        .cp-act { display: inline-flex; align-items: center; gap: 6px; justify-content: flex-end; }
        .cp-act-btn { padding: 5px 10px; border-radius: 6px; font-size: 0.76rem; font-weight: 500; cursor: pointer; border: 1px solid #e2e8f0; background: #fff; color: #475569; transition: all 0.12s; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
        .cp-act-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
        .cp-act-toggle { color: #dc2626; border-color: #fecaca; }
        .cp-act-toggle:hover { background: #fef2f2; }
        .cp-act-toggle.is-off { color: #16a34a; border-color: #bbf7d0; }
        .cp-act-toggle.is-off:hover { background: #f0fdf4; }
        .cp-act-edit { color: #3b82f6; border-color: #bfdbfe; }
        .cp-act-edit:hover { background: #eff6ff; }

        /* Responsive */
        @media (min-width: 1400px) {
          .cp-table th[data-col="name"] { width: 28%; }
          .cp-table th[data-col="state"] { width: 18%; }
          .cp-table th[data-col="district"] { width: 20%; }
          .cp-table th[data-col="status"] { width: 12%; }
          .cp-table th[data-col="actions"] { width: 22%; }
        }
        @media (max-width: 900px) {
          .cp-table th[data-col="state"],
          .cp-table td:nth-child(2) { display: none; }
          .cp-table th[data-col="district"],
          .cp-table td:nth-child(3) { display: none; }
          .cp-table th[data-col="name"] { width: 40%; }
          .cp-table th[data-col="status"] { width: 25%; }
          .cp-table th[data-col="actions"] { width: 35%; }
        }
        @media (max-width: 768px) {
          .cp-header { flex-direction: column; align-items: stretch; }
          .cp-header-actions { justify-content: flex-start; flex-wrap: wrap; }
          .cp-toolbar { flex-direction: column; align-items: stretch; }
          .cp-search { min-width: 0; }
        }
        @media (max-width: 600px) {
          .cp-table th[data-col="actions"],
          .cp-table td.cp-td-actions { display: none; }
          .cp-table th[data-col="name"] { width: 60%; }
          .cp-table th[data-col="status"] { width: 40%; }
        }
      `}</style>
    </div>
  );
}

/* ─── Comprehensive Modal: Details + Status + Wards ─── */
function CorporationModal({ isOpen, onClose, editingCorp, form, setForm, formStatus, setFormStatus, saving, onSave }) {
  const isEdit = !!editingCorp;
  const corpId = editingCorp?._id || editingCorp?.id;

  const [wards, setWards] = useState([]);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [wardsErr, setWardsErr] = useState('');
  const [wardFormOpen, setWardFormOpen] = useState(false);
  const [wardForm, setWardForm] = useState({ name: '', wardNumber: '' });
  const [wardSaving, setWardSaving] = useState(false);
  const [editWardId, setEditWardId] = useState(null);
  const [editWardForm, setEditWardForm] = useState({ name: '', wardNumber: '' });

  const fetchWards = useCallback(async () => {
    if (!corpId) return;
    try {
      setWardsLoading(true);
      setWardsErr('');
      const res = await fetch(`/api/wards?corporation=${corpId}&includeInactive=true`, { headers: authHeaders(), credentials: 'include' });
      const data = await safeParseJsonResponse(res);
      if (data.success && data.data) setWards(data.data.wards || data.data || []);
      else setWardsErr(data.message || 'Failed to load wards');
    } catch { setWardsErr('Unable to load wards'); } finally { setWardsLoading(false); }
  }, [corpId]);

  useEffect(() => {
    if (isOpen && isEdit) {
      setWards([]);
      setWardsErr('');
      setWardFormOpen(false);
      setEditWardId(null);
      fetchWards();
    } else if (!isOpen) {
      setWards([]);
      setWardFormOpen(false);
      setEditWardId(null);
    }
  }, [isOpen, isEdit, fetchWards]);

  const addWard = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!wardForm.name.trim() || !wardForm.wardNumber.toString().trim()) return;
    setWardSaving(true);
    try {
      const res = await fetch('/api/wards', { method: 'POST', headers: authHeaders(), credentials: 'include', body: JSON.stringify({ name: wardForm.name.trim(), corporation: corpId, wardNumber: wardForm.wardNumber.toString().trim() }) });
      const data = await safeParseJsonResponse(res);
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to add ward');
      setWardForm({ name: '', wardNumber: '' }); setWardFormOpen(false); fetchWards();
    } catch (err) { setWardsErr(err.message); } finally { setWardSaving(false); }
  };

  const saveWard = async (wardId) => {
    if (!editWardForm.name.trim() || !editWardForm.wardNumber.toString().trim()) return;
    try {
      const res = await fetch(`/api/wards/${wardId}`, { method: 'PUT', headers: authHeaders(), credentials: 'include', body: JSON.stringify({ name: editWardForm.name.trim(), wardNumber: editWardForm.wardNumber.toString().trim() }) });
      const data = await safeParseJsonResponse(res);
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update');
      setEditWardId(null); fetchWards();
    } catch (err) { setWardsErr(err.message); }
  };

  const toggleWardActive = async (ward) => {
    try {
      const res = await fetch(`/api/wards/${ward._id || ward.id}`, { method: 'PUT', headers: authHeaders(), credentials: 'include', body: JSON.stringify({ isActive: !ward.isActive }) });
      const data = await safeParseJsonResponse(res);
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update');
      fetchWards();
    } catch (err) { setWardsErr(err.message); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Corporation' : 'New Corporation'} size="lg">
      <form onSubmit={onSave} className="cm">
        {/* Section: Details */}
        <div className="cm-section">
          <div className="cm-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>
            Corporation Details
          </div>
          <label className="cm-field">
            <span className="cm-label">Corporation Name <span className="cm-req">*</span></span>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Municipal Corporation of Greater Mumbai" required autoFocus />
          </label>
          <div className="cm-field-row">
            <label className="cm-field">
              <span className="cm-label">State</span>
              <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="e.g. Maharashtra" />
            </label>
            <label className="cm-field">
              <span className="cm-label">District</span>
              <input type="text" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="e.g. Mumbai" />
            </label>
          </div>
        </div>

        {/* Section: Status */}
        {isEdit && (
          <div className="cm-section">
            <div className="cm-section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/></svg>
              Status
            </div>
            <div className="cm-status-row">
              <div className="cm-status-info">
                <span className="cm-status-label">{formStatus ? 'Active' : 'Inactive'}</span>
                <span className="cm-status-desc">{formStatus ? 'This corporation is visible in public views and can receive complaints.' : 'This corporation is hidden from public views.'}</span>
              </div>
              <button type="button" className={`cm-toggle ${formStatus ? 'cm-toggle-on' : ''}`} onClick={() => setFormStatus(!formStatus)}>
                <span className="cm-toggle-knob"/>
              </button>
            </div>
          </div>
        )}

        {/* Section: Wards (only in edit mode) */}
        {isEdit && (
          <div className="cm-section">
            <div className="cm-section-title cm-section-title-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Administrative Wards
                {wards.length > 0 && <span className="cm-wards-count">{wards.length}</span>}
              </div>
              <button type="button" className="cp-btn cp-btn-sm cp-btn-primary" onClick={() => setWardFormOpen(!wardFormOpen)}>
                {wardFormOpen ? 'Cancel' : '+ Add Ward'}
              </button>
            </div>

            {wardFormOpen && (
              <form className="cm-ward-form" onSubmit={addWard}>
                <input type="text" placeholder="Ward name" value={wardForm.name} onChange={(e) => setWardForm({ ...wardForm, name: e.target.value })} required autoFocus />
                <input type="text" placeholder="Number" value={wardForm.wardNumber} onChange={(e) => setWardForm({ ...wardForm, wardNumber: e.target.value })} required style={{ maxWidth: 100 }} />
                <button type="button" className="cp-btn cp-btn-sm cp-btn-primary" onClick={addWard} disabled={wardSaving}>{wardSaving ? 'Saving...' : 'Add'}</button>
              </form>
            )}

            {wardsErr && <div className="cm-alert">{wardsErr}</div>}

            {wardsLoading ? (
              <div className="cm-wards-loading">Loading wards...</div>
            ) : wards.length === 0 ? (
              <div className="cm-wards-empty">No wards added yet. Click &quot;+ Add Ward&quot; to create one.</div>
            ) : (
              <ul className="cm-ward-list">
                {wards.map((w) => {
                  const wid = w._id || w.id;
                  const wActive = w.isActive !== false;
                  const isEditing = editWardId === wid;
                  return (
                    <li key={wid} className="cm-ward-item">
                      {isEditing ? (
                        <div className="cm-ward-edit">
                          <input type="text" value={editWardForm.name} onChange={(e) => setEditWardForm({ ...editWardForm, name: e.target.value })} placeholder="Name" autoFocus />
                          <input type="text" value={editWardForm.wardNumber} onChange={(e) => setEditWardForm({ ...editWardForm, wardNumber: e.target.value })} placeholder="No." style={{ width: 70 }} />
                          <button type="button" className="cp-btn cp-btn-sm cp-btn-primary" onClick={() => saveWard(wid)}>Save</button>
                          <button type="button" className="cp-btn cp-btn-sm" onClick={() => setEditWardId(null)}>Cancel</button>
                        </div>
                      ) : (
                        <>
                          <div className="cm-ward-info">
                            <span className="cm-ward-name">{w.name}</span>
                            <span className="cm-ward-num">#{w.wardNumber}</span>
                            <span className={`cp-badge ${wActive ? 'cp-badge-on' : 'cp-badge-off'}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                              <span className="cp-badge-dot"/>{wActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="cm-ward-acts">
                            <button type="button" className="cp-act-btn" onClick={() => { setEditWardId(wid); setEditWardForm({ name: w.name || '', wardNumber: w.wardNumber || '' }); }} title="Edit ward">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button type="button" className={`cp-act-btn cp-act-toggle ${wActive ? '' : 'is-off'}`} onClick={() => toggleWardActive(w)} title={wActive ? 'Deactivate' : 'Activate'}>
                              {wActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="cm-footer">
          <button type="button" className="cp-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="cp-btn cp-btn-primary" disabled={saving || !form.name.trim()}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Corporation'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .cm { display: flex; flex-direction: column; gap: 0; }

        /* Section */
        .cm-section { padding: 20px 0; border-bottom: 1px solid #f1f5f9; }
        .cm-section:first-child { padding-top: 0; }
        .cm-section:last-of-type { border-bottom: none; }
        .cm-section-title { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 600; color: #334155; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 14px; }
        .cm-section-title svg { color: #64748b; }
        .cm-section-title-between { justify-content: space-between; }

        /* Fields */
        .cm-field { display: block; margin-bottom: 14px; }
        .cm-label { display: block; font-size: 0.8rem; font-weight: 500; color: #475569; margin-bottom: 5px; }
        .cm-req { color: #dc2626; }
        .cm-field input { width: 100%; padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.88rem; color: #0f172a; background: #fff; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s; }
        .cm-field input:focus { outline: none; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
        .cm-field input::placeholder { color: #94a3b8; }
        .cm-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        /* Status toggle */
        .cm-status-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
        .cm-status-info { display: flex; flex-direction: column; gap: 2px; }
        .cm-status-label { font-size: 0.88rem; font-weight: 600; color: #0f172a; }
        .cm-status-desc { font-size: 0.78rem; color: #64748b; }
        .cm-toggle { width: 44px; height: 24px; border-radius: 12px; border: none; cursor: pointer; background: #e2e8f0; position: relative; transition: background 0.2s; padding: 0; flex-shrink: 0; }
        .cm-toggle-on { background: #10b981; }
        .cm-toggle-knob { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
        .cm-toggle-on .cm-toggle-knob { transform: translateX(20px); }

        /* Wards */
        .cm-wards-count { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 18px; padding: 0 6px; background: #e2e8f0; color: #475569; border-radius: 99px; font-size: 0.68rem; font-weight: 600; }
        .cm-ward-form { display: flex; gap: 8px; margin-bottom: 12px; }
        .cm-ward-form input { flex: 1; padding: 7px 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.8rem; background: #fff; color: #0f172a; }
        .cm-ward-form input:focus { outline: none; border-color: #10b981; box-shadow: 0 0 0 2px rgba(16,185,129,0.1); }
        .cm-ward-form input::placeholder { color: #94a3b8; }
        .cm-alert { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; font-size: 0.78rem; }
        .cm-wards-loading { text-align: center; color: #94a3b8; font-size: 0.82rem; padding: 16px 0; }
        .cm-wards-empty { text-align: center; color: #94a3b8; font-size: 0.82rem; padding: 20px 0; }
        .cm-ward-list { list-style: none; margin: 0; padding: 0; max-height: 220px; overflow-y: auto; }
        .cm-ward-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-radius: 6px; gap: 10px; transition: background 0.12s; border: 1px solid transparent; }
        .cm-ward-item:hover { background: #f8fafc; border-color: #e2e8f0; }
        .cm-ward-info { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
        .cm-ward-name { font-size: 0.82rem; font-weight: 500; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cm-ward-num { font-size: 0.75rem; color: #64748b; font-weight: 500; white-space: nowrap; }
        .cm-ward-acts { display: flex; gap: 4px; flex-shrink: 0; }
        .cm-ward-edit { display: flex; gap: 6px; align-items: center; width: 100%; }
        .cm-ward-edit input { padding: 5px 8px; border: 1px solid #e2e8f0; border-radius: 5px; font-size: 0.8rem; background: #fff; color: #0f172a; }
        .cm-ward-edit input:focus { outline: none; border-color: #10b981; }

        /* Footer */
        .cm-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5f9; }

        /* Reuse button styles from parent */
        .cp-btn { padding: 8px 16px; border-radius: 8px; font-size: 0.84rem; font-weight: 500; cursor: pointer; border: 1px solid #e2e8f0; background: #fff; color: #334155; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; line-height: 1.4; }
        .cp-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
        .cp-btn:active { transform: scale(0.98); }
        .cp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cp-btn-primary { background: #10b981; color: #fff; border-color: #10b981; }
        .cp-btn-primary:hover { background: #059669; border-color: #059669; }
        .cp-btn-primary:disabled { background: #6ee7b7; border-color: #6ee7b7; }
        .cp-btn-sm { padding: 5px 10px; font-size: 0.78rem; border-radius: 6px; }
        .cp-act-btn { padding: 5px 10px; border-radius: 6px; font-size: 0.76rem; font-weight: 500; cursor: pointer; border: 1px solid #e2e8f0; background: #fff; color: #475569; transition: all 0.12s; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
        .cp-act-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
        .cp-act-toggle { color: #dc2626; border-color: #fecaca; }
        .cp-act-toggle:hover { background: #fef2f2; }
        .cp-act-toggle.is-off { color: #16a34a; border-color: #bbf7d0; }
        .cp-act-toggle.is-off:hover { background: #f0fdf4; }
        .cp-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 99px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
        .cp-badge-dot { width: 6px; height: 6px; border-radius: 50%; }
        .cp-badge-on { background: #ecfdf5; color: #065f46; }
        .cp-badge-on .cp-badge-dot { background: #10b981; }
        .cp-badge-off { background: #fef2f2; color: #991b1b; }
        .cp-badge-off .cp-badge-dot { background: #ef4444; }

        @media (max-width: 640px) {
          .cm-field-row { grid-template-columns: 1fr; }
          .cm-ward-form { flex-direction: column; }
          .cm-ward-edit { flex-wrap: wrap; }
        }
      `}</style>
    </Modal>
  );
}
