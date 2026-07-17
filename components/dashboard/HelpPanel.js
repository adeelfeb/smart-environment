import React, { useState } from 'react';
import { Code, Globe, Smartphone, Rocket, Search, Mail, Send } from 'lucide-react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';

export default function HelpPanel() {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', text: string }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setStatus({ type: 'error', text: 'Please enter your request.' });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const payload = { message: trimmed };
      const res = await fetch('/api/help-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await safeParseJsonResponse(res).catch(() => ({}));
      if (res.ok && data.success) {
        setMessage('');
        setStatus({ type: 'success', text: data.message || 'Request submitted successfully. We will get back to you.' });
      } else {
        setStatus({ type: 'error', text: data.message || 'Failed to submit request. Please try again.' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="help-panel">
      <div className="help-header">
        <h2>Need Professional Development Services?</h2>
        <p>I'm a Software Engineer, Website Developer, Full Stack Developer, and App Developer ready to help bring your projects, ventures, and ideas to life.</p>
      </div>

      <div className="help-intro">
        <div className="help-intro-card">
          <div className="help-intro-icon">
            <Rocket size={32} />
          </div>
          <div className="help-intro-content">
            <h3>Let's Accomplish Your Goals</h3>
            <p>Let's accomplish your goals in the coming years with cutting-edge AI and functionality that you can sell and grow with. <strong>Send us a request below!</strong></p>
            <div className="help-offer">
              <span className="offer-badge">✨ Special Offer</span>
              <p>Get <strong>discounted prices</strong> and <strong>free guidance</strong> for your project workflow!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="help-request-section">
        <h3 className="request-title">Submit a request</h3>
        <p className="request-desc">Describe what you need and we’ll get back to you. Your request is saved to your account.</p>
        <form onSubmit={handleSubmit} className="help-request-form">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. I need help with a website, app, or deployment..."
            className="help-request-textarea"
            rows={4}
            maxLength={2000}
            disabled={submitting}
          />
          <div className="help-request-footer">
            <span className="help-request-count">{message.length} / 2000</span>
            <button type="submit" className="help-request-btn" disabled={submitting}>
              {submitting ? (
                <>Sending…</>
              ) : (
                <>
                  <Send size={18} />
                  Submit request
                </>
              )}
            </button>
          </div>
          {status && (
            <div className={`help-request-status ${status.type}`} role="alert">
              {status.text}
            </div>
          )}
        </form>
      </div>

      <div className="help-services">
        <h3 className="services-title">Our Services</h3>
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon">
              <Globe size={24} />
            </div>
            <h4>Website Development</h4>
            <p>Custom websites built with modern technologies</p>
          </div>
          <div className="service-card">
            <div className="service-icon">
              <Code size={24} />
            </div>
            <h4>Programming & Software</h4>
            <p>Full-stack software solutions tailored to your needs</p>
          </div>
          <div className="service-card">
            <div className="service-icon">
              <Smartphone size={24} />
            </div>
            <h4>App Development</h4>
            <p>Mobile and web applications for iOS, Android, and web</p>
          </div>
          <div className="service-card">
            <div className="service-icon">
              <Rocket size={24} />
            </div>
            <h4>Deployment</h4>
            <p>Seamless deployment and hosting solutions</p>
          </div>
          <div className="service-card">
            <div className="service-icon">
              <Search size={24} />
            </div>
            <h4>SEO</h4>
            <p>Search engine optimization to boost your visibility</p>
          </div>
          <div className="service-card">
            <div className="service-icon">
              <Mail size={24} />
            </div>
            <h4>Email Marketing</h4>
            <p>Effective email campaigns and automation</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .help-panel {
          display: grid;
          gap: 2.5rem;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.6) rgba(241, 245, 249, 0.8);
        }
        .help-header {
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
        }
        .help-header h2 {
          font-size: 2rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .help-header p {
          color: #64748b;
          font-size: 1.1rem;
          line-height: 1.7;
        }
        .help-intro {
          margin: 1rem 0;
        }
        .help-intro-card {
          background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
          border: 2px solid #3b82f6;
          border-radius: 1.5rem;
          padding: 2rem;
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
        }
        .help-intro-icon {
          width: 4rem;
          height: 4rem;
          border-radius: 1rem;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 8px 16px rgba(37, 99, 235, 0.3);
        }
        .help-intro-content {
          flex: 1;
        }
        .help-intro-content h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.75rem 0;
        }
        .help-intro-content p {
          color: #475569;
          font-size: 1rem;
          line-height: 1.7;
          margin: 0 0 1rem 0;
        }
        .help-intro-content strong {
          color: #1d4ed8;
          font-weight: 600;
        }
        .help-offer {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 2px solid #f59e0b;
          border-radius: 0.75rem;
          padding: 1rem 1.25rem;
          margin-top: 1rem;
        }
        .offer-badge {
          display: inline-block;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .help-offer p {
          color: #92400e;
          font-size: 0.95rem;
          margin: 0;
          line-height: 1.6;
        }
        .help-offer strong {
          color: #78350f;
        }
        .help-request-section {
          margin-top: 1rem;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 1.25rem;
          padding: 1.5rem 2rem;
        }
        .request-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
        }
        .request-desc {
          color: #64748b;
          font-size: 0.95rem;
          margin: 0 0 1.25rem 0;
          line-height: 1.5;
        }
        .help-request-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .help-request-textarea {
          width: 100%;
          min-height: 120px;
          padding: 1rem 1.25rem;
          border: 2px solid #cbd5e1;
          border-radius: 0.75rem;
          font-size: 1rem;
          font-family: inherit;
          resize: vertical;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .help-request-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
        .help-request-textarea:disabled {
          background: #f8fafc;
          cursor: not-allowed;
        }
        .help-request-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .help-request-count {
          font-size: 0.85rem;
          color: #64748b;
        }
        .help-request-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          border: none;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .help-request-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
        }
        .help-request-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .help-request-status {
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.95rem;
          font-weight: 500;
        }
        .help-request-status.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #6ee7b7;
        }
        .help-request-status.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }
        .help-services {
          margin-top: 1rem;
        }
        .services-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 1.5rem;
        }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.25rem;
        }
        .service-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          transition: all 0.3s ease;
        }
        .service-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.15);
          transform: translateY(-4px);
        }
        .service-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
        }
        .service-card h4 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }
        .service-card p {
          color: #64748b;
          font-size: 0.9rem;
          line-height: 1.6;
          margin: 0;
        }
        @media (max-width: 768px) {
          .help-header h2 {
            font-size: 1.75rem;
          }
          .help-intro-card {
            flex-direction: column;
            padding: 1.5rem;
          }
          .help-intro-icon {
            width: 3.5rem;
            height: 3.5rem;
          }
          .help-request-section {
            padding: 1.25rem 1.5rem;
          }
          .help-request-footer {
            flex-direction: column;
            align-items: stretch;
          }
          .help-request-btn {
            width: 100%;
            justify-content: center;
          }
          .services-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

