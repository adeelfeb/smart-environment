import { useEffect, useMemo, useState } from 'react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';

export default function SettingsPanel({ user, onProfileUpdated }) {
  const [profileName, setProfileName] = useState(user?.name || '');
  useEffect(() => {
    setProfileName(user?.name || '');
  }, [user?.name]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  const disableProfileSubmit = useMemo(() => {
    const trimmed = profileName.trim();
    return profileLoading || !trimmed || trimmed === user?.name;
  }, [profileLoading, profileName, user?.name]);

  const disablePasswordSubmit = useMemo(() => {
    return (
      passwordLoading ||
      !passwords.currentPassword ||
      !passwords.newPassword ||
      passwords.newPassword.length < 5 ||
      passwords.newPassword !== passwords.confirm
    );
  }, [passwordLoading, passwords]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (disableProfileSubmit) return;
    setProfileLoading(true);
    setProfileMessage(null);

    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName.trim() }),
      });

      const result = await safeParseJsonResponse(response).catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.message || 'Unable to update profile');
      }

      setProfileMessage({ type: 'success', text: result?.message || 'Profile updated' });
      if (result?.data?.user && typeof onProfileUpdated === 'function') {
        onProfileUpdated(result.data.user);
      }
    } catch (error) {
      setProfileMessage({ type: 'error', text: error.message || 'Update failed' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (disablePasswordSubmit) return;
    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      const response = await fetch('/api/users/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      const result = await safeParseJsonResponse(response).catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.message || 'Unable to update password');
      }

      setPasswordMessage({ type: 'success', text: result?.message || 'Password updated' });
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error.message || 'Update failed' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className="settings-grid">
      <section className="settings-card">
        <h3 className="card-title">Account Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Full Name</span>
            <span className="info-value">{user?.name || '—'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Email</span>
            <span className="info-value">{user?.email || '—'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Role</span>
            <span className="info-value role-badge">{user?.role || '—'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Member Since</span>
            <span className="info-value">{formatDate(user?.createdAt)}</span>
          </div>
        </div>
      </section>

      <section className="settings-card">
        <h3 className="card-title">Edit Profile</h3>
        <form onSubmit={handleProfileSubmit} className="form">
          <label className="field">
            <span className="label">Display name</span>
            <input
              type="text"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
              placeholder="Your name"
            />
          </label>

          {profileMessage && (
            <p className={`message message--${profileMessage.type}`}>{profileMessage.text}</p>
          )}

          <button type="submit" disabled={disableProfileSubmit}>
            {profileLoading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </section>

      <section className="settings-card">
        <h3 className="card-title">Change Password</h3>
        <form onSubmit={handlePasswordSubmit} className="form">
          <label className="field">
            <span className="label">Current password</span>
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(event) =>
                setPasswords((prev) => ({ ...prev, currentPassword: event.target.value }))
              }
              placeholder="Enter current password"
            />
          </label>

          <label className="field">
            <span className="label">New password</span>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(event) =>
                setPasswords((prev) => ({ ...prev, newPassword: event.target.value }))
              }
              placeholder="At least 6 characters"
            />
          </label>

          <label className="field">
            <span className="label">Confirm password</span>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(event) =>
                setPasswords((prev) => ({ ...prev, confirm: event.target.value }))
              }
              placeholder="Re-enter new password"
            />
          </label>

          {passwords.newPassword &&
            passwords.confirm &&
            passwords.newPassword !== passwords.confirm && (
              <p className="message message--error">New passwords do not match.</p>
            )}

          {passwordMessage && (
            <p className={`message message--${passwordMessage.type}`}>{passwordMessage.text}</p>
          )}

          <button type="submit" disabled={disablePasswordSubmit}>
            {passwordLoading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>

      <style jsx>{`
        .settings-grid {
          display: grid;
          gap: 1.75rem;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .card-title {
          font-size: 1.05rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem;
          width: 100%;
          box-sizing: border-box;
        }

        .info-item {
          display: grid;
          gap: 0.35rem;
        }

        .info-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .info-value {
          font-size: 1rem;
          font-weight: 500;
          color: #1e293b;
          word-break: break-word;
        }

        .role-badge {
          display: inline-block;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          color: #1d4ed8;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: capitalize;
          width: fit-content;
        }

        .settings-card {
          background: white;
          border-radius: 1.1rem;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
          padding: 1.9rem;
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .form {
          display: grid;
          gap: 1.1rem;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .field {
          display: grid;
          gap: 0.5rem;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .label {
          font-size: 0.9rem;
          font-weight: 500;
          color: #1e293b;
        }

        input {
          width: 100%;
          max-width: 100%;
          border-radius: 0.75rem;
          border: 2px solid rgba(148, 163, 184, 0.3);
          padding: 0.875rem 1.125rem;
          font-size: 0.95rem;
          background: #ffffff;
          color: #1e293b;
          transition: all 0.3s ease;
          box-sizing: border-box;
          font-family: inherit;
        }

        input:hover {
          border-color: rgba(37, 99, 235, 0.4);
          background: #fefefe;
        }

        input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
          background: #ffffff;
        }

        input::placeholder {
          color: #94a3b8;
        }

        button {
          justify-self: start;
          border: none;
          border-radius: 0.75rem;
          padding: 0.75rem 1.4rem;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        }

        button:hover:not(:disabled),
        button:focus-visible:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 20px rgba(37, 99, 235, 0.25);
          outline: none;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .message {
          font-size: 0.9rem;
        }

        .message--success {
          color: #047857;
        }

        .message--error {
          color: #dc2626;
        }

        @media (max-width: 960px) {
          .settings-grid {
            gap: 1.25rem;
          }
          .settings-card {
            padding: 1.5rem;
            gap: 1rem;
          }
          .info-grid {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 1rem;
          }
        }

        @media (max-width: 640px) {
          .settings-grid {
            gap: 1rem;
          }
          .settings-card {
            padding: 1.25rem;
            gap: 1rem;
            border-radius: 0.9rem;
          }
          .form {
            gap: 0.95rem;
          }
          .field {
            gap: 0.45rem;
          }
          .label {
            font-size: 0.875rem;
          }
          input {
            padding: 0.7rem 0.875rem;
            font-size: 0.9rem;
            border-radius: 0.65rem;
          }
          button {
            width: 100%;
            justify-self: stretch;
            padding: 0.7rem 1.2rem;
            font-size: 0.9rem;
          }
          .message {
            font-size: 0.85rem;
          }
          .card-title {
            font-size: 0.95rem;
          }
          .info-grid {
            grid-template-columns: 1fr;
            gap: 0.875rem;
          }
          .info-value {
            font-size: 0.95rem;
          }
        }

        @media (max-width: 480px) {
          .settings-card {
            padding: 1rem;
            gap: 0.875rem;
            border-radius: 0.8rem;
          }
          .form {
            gap: 0.875rem;
          }
          input {
            padding: 0.65rem 0.8rem;
            font-size: 0.875rem;
          }
          button {
            padding: 0.65rem 1.1rem;
            font-size: 0.875rem;
          }
          .card-title {
            font-size: 0.9rem;
          }
          .info-label {
            font-size: 0.75rem;
          }
          .info-value {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}

