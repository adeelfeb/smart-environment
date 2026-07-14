'use client';

import { useState, useEffect } from 'react';

const COMPLAINT_CATEGORIES = [
  'Overflowing Dustbin',
  'Unauthorized Garbage Dumping',
  'Damaged Dustbin',
  'Missing Dustbin',
];

const DEFAULT_SLA_DAYS = 7;

const CORPORATION_DATA = [
  { name: 'Greater Chennai Corporation', wards: 200 },
  { name: 'Coimbatore City Municipal Corporation', wards: 100 },
  { name: 'Madurai Municipal Corporation', wards: 75 },
  { name: 'Tiruchirappalli City Corporation', wards: 65 },
  { name: 'Salem City Municipal Corporation', wards: 60 },
];

export default function SystemSettingsPanel({ user, onNavigate }) {
  const [slaDays, setSlaDays] = useState(DEFAULT_SLA_DAYS);
  const [slaSaved, setSlaSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('system_sla_days');
    if (stored !== null) {
      const parsed = Number(stored);
      if (!isNaN(parsed) && parsed > 0) {
        setSlaDays(parsed);
      }
    }
  }, []);

  const handleSlaChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setSlaDays('');
      return;
    }
    const num = Number(val);
    if (!isNaN(num) && num >= 1 && num <= 365) {
      setSlaDays(num);
    }
  };

  const handleSlaSave = () => {
    const num = Number(slaDays);
    if (num >= 1 && num <= 365) {
      localStorage.setItem('system_sla_days', String(num));
      setSlaSaved(true);
      setTimeout(() => setSlaSaved(false), 2500);
    }
  };

  return (
    <div className="system-settings">
      <header className="ss-header">
        <div>
          <h2 className="ss-title">System Settings</h2>
          <p className="ss-sub">Manage platform-wide configuration</p>
        </div>
      </header>

      {/* Complaint Categories */}
      <section className="ss-card">
        <div className="ss-card-head">
          <h3 className="ss-card-title">Complaint Categories</h3>
          <span className="ss-card-badge ss-card-badge--static">Read-only</span>
        </div>
        <p className="ss-card-desc">
          These are the fixed categories available for citizens when submitting complaints.
        </p>
        <div className="ss-chip-group">
          {COMPLAINT_CATEGORIES.map((cat) => (
            <span key={cat} className="ss-chip">{cat}</span>
          ))}
        </div>
      </section>

      {/* SLA Settings */}
      <section className="ss-card">
        <div className="ss-card-head">
          <h3 className="ss-card-title">SLA Settings</h3>
          <span className="ss-card-badge ss-card-badge--local">Local Storage</span>
        </div>
        <p className="ss-card-desc">
          Set the target resolution time (in days) for complaints. This value is stored locally
          and will be used for escalation alerts.
        </p>
        <div className="ss-sla-row">
          <label className="ss-sla-label">
            <span>Target Resolution Time</span>
            <div className="ss-sla-input-wrap">
              <input
                type="number"
                className="ss-sla-input"
                value={slaDays}
                onChange={handleSlaChange}
                min={1}
                max={365}
              />
              <span className="ss-sla-unit">days</span>
            </div>
          </label>
          <button
            className="ss-btn ss-btn--green"
            onClick={handleSlaSave}
            disabled={!slaDays || Number(slaDays) < 1}
          >
            {slaSaved ? 'Saved' : 'Save Setting'}
          </button>
        </div>
        {slaSaved && (
          <p className="ss-toast">SLA setting saved successfully.</p>
        )}
      </section>

      {/* Ward / Jurisdiction Mapping */}
      <section className="ss-card">
        <div className="ss-card-head">
          <h3 className="ss-card-title">Ward / Jurisdiction Mapping</h3>
        </div>
        <p className="ss-card-desc">
          Overview of corporations and their ward counts. Manage detailed mappings from the Corporations panel.
        </p>
        <div className="ss-table-wrap">
          <table className="ss-table">
            <thead>
              <tr>
                <th>Corporation</th>
                <th>Wards Count</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {CORPORATION_DATA.map((corp) => (
                <tr key={corp.name}>
                  <td className="ss-table-name">{corp.name}</td>
                  <td className="ss-table-wards">{corp.wards}</td>
                  <td>
                    {onNavigate && (
                      <button
                        className="ss-link-btn"
                        onClick={() => onNavigate('corporations')}
                      >
                        Manage
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Admin Account Assignment */}
      <section className="ss-card">
        <div className="ss-card-head">
          <h3 className="ss-card-title">Admin Account Assignment</h3>
        </div>
        <p className="ss-card-desc">
          Administrator accounts are automatically assigned to specific corporations during the account
          creation process. Each admin operates within the jurisdiction of their assigned corporation.
        </p>
        <div className="ss-info-box">
          <span className="ss-info-icon">i</span>
          <div className="ss-info-text">
            <strong className="ss-info-title">How assignment works</strong>
            <p className="ss-info-body">
              When creating a new admin account, you will be prompted to select the corporation
              they will manage. The admin will have access to all complaints, wards, and data
              within that corporation's jurisdiction. To reassign an admin to a different
              corporation, contact the system owner or use the Corporations management panel.
            </p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .system-settings {
          padding: 24px;
          max-width: 1080px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .ss-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .ss-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #02201a;
          margin: 0;
        }
        .ss-sub {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 0.9rem;
        }

        /* Card */
        .ss-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.03);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ss-card-head {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ss-card-title {
          font-size: 1.05rem;
          font-weight: 600;
          color: #02201a;
          margin: 0;
        }
        .ss-card-badge {
          font-size: 0.65rem;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 99px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .ss-card-badge--static {
          background: #f1f5f9;
          color: #64748b;
        }
        .ss-card-badge--local {
          background: #ecfdf5;
          color: #047857;
        }
        .ss-card-desc {
          margin: 0;
          color: #64748b;
          font-size: 0.875rem;
          line-height: 1.6;
        }

        /* Chips */
        .ss-chip-group {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .ss-chip {
          padding: 8px 16px;
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          border-radius: 99px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        /* SLA */
        .ss-sla-row {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          flex-wrap: wrap;
        }
        .ss-sla-label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          color: #334155;
        }
        .ss-sla-input-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ss-sla-input {
          width: 100px;
          padding: 10px 14px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 500;
          color: #02201a;
          background: #fff;
          font-family: inherit;
          transition: border-color 0.15s;
        }
        .ss-sla-input:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
        }
        .ss-sla-unit {
          font-size: 0.85rem;
          color: #64748b;
        }
        .ss-toast {
          margin: 0;
          font-size: 0.8rem;
          color: #047857;
          font-weight: 500;
        }

        /* Table */
        .ss-table-wrap {
          overflow-x: auto;
          border: 1px solid #f1f5f9;
          border-radius: 8px;
        }
        .ss-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }
        .ss-table th {
          text-align: left;
          padding: 12px 16px;
          background: #f8fafc;
          color: #64748b;
          font-weight: 600;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border-bottom: 1px solid #e2e8f0;
        }
        .ss-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
        }
        .ss-table tr:last-child td {
          border-bottom: none;
        }
        .ss-table-name {
          font-weight: 500;
          color: #02201a;
        }
        .ss-table-wards {
          font-weight: 600;
          color: #047857;
        }
        .ss-link-btn {
          background: none;
          border: none;
          color: #2563eb;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          font-family: inherit;
        }
        .ss-link-btn:hover {
          text-decoration: underline;
        }

        /* Info box */
        .ss-info-box {
          display: flex;
          gap: 14px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 10px;
          padding: 18px;
        }
        .ss-info-icon {
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #10b981;
          color: #fff;
          font-size: 0.8rem;
          font-weight: 700;
          margin-top: 1px;
        }
        .ss-info-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ss-info-title {
          font-size: 0.9rem;
          color: #02201a;
          font-weight: 600;
        }
        .ss-info-body {
          margin: 0;
          font-size: 0.84rem;
          color: #475569;
          line-height: 1.65;
        }

        /* Button */
        .ss-btn {
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: transform 0.12s, opacity 0.12s;
        }
        .ss-btn:active {
          transform: scale(0.97);
        }
        .ss-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .ss-btn--green {
          background: #10b981;
          color: #fff;
        }
        .ss-btn--green:hover:not(:disabled) {
          background: #059669;
        }

        @media (max-width: 768px) {
          .system-settings { padding: 16px; gap: 18px; }
          .ss-card { padding: 18px; }
          .ss-sla-row { flex-direction: column; align-items: stretch; }
          .ss-sla-input { width: 100%; }
        }
        @media (max-width: 480px) {
          .system-settings { padding: 12px; gap: 14px; }
          .ss-card { padding: 14px; gap: 12px; }
          .ss-title { font-size: 1.3rem; }
          .ss-chip { font-size: 0.78rem; padding: 6px 12px; }
        }
      `}</style>
    </div>
  );
}
