import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../components/designndev/Navbar';
import Footer from '../components/designndev/Footer';
import { safeParseJsonResponse } from '../utils/safeJsonResponse';

function formatErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  const detail =
    typeof payload.error === 'string'
      ? payload.error
      : Array.isArray(payload.error)
      ? payload.error.join(', ')
      : '';
  if (detail) {
    return `${payload.message || fallback}: ${detail}`;
  }
  return payload.message || fallback;
}

const ERROR_HINTS = {
  NO_DB_URI: 'The MONGODB_URI environment variable is not set on the server.',
  CONNECTION_TIMEOUT: 'The database server took too long to respond.',
  DNS_RESOLUTION_FAILED: 'The server cannot resolve the database hostname.',
  AUTHENTICATION_FAILED: 'The database rejected the credentials in MONGODB_URI.',
  DB_UNAVAILABLE: 'The database service is temporarily unreachable.',
  NO_JWT_SECRET: 'The JWT_SECRET environment variable is not set on the server.',
  TOKEN_SIGN_FAILED: 'The server could not generate an authentication token.',
  UNHANDLED_ERROR: 'The server encountered an unhandled error.',
};

const NON_JSON_ERROR_HINT =
  'The server returned an error page instead of a valid response. This usually means the serverless function crashed or failed to start. Common causes: missing environment variables (MONGODB_URI, JWT_SECRET), MongoDB Atlas IP access list blocking the deployment, or the function exceeded its time limit.';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [errorDetail, setErrorDetail] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const email = router.query.email || '';

  useEffect(() => {
    // If no email is provided, redirect back to login
    if (router.isReady && !email) {
      router.replace('/login');
    }
  }, [router.isReady, email, router]);

  // Initialize 40 second cooldown when component mounts
  useEffect(() => {
    if (router.isReady && email) {
      // Start with 40 second cooldown when page loads
      setResendCooldown(40);
    }
  }, [router.isReady, email]);

  // Handle resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const isDisabled = useMemo(() => {
    return loading || !otp.trim() || otp.trim().length < 4;
  }, [otp, loading]);

  async function onResend(e) {
    e.preventDefault();
    if (resending || !email || resendCooldown > 0) return;
    
    setResending(true);
    setError('');
    setErrorDetail('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await safeParseJsonResponse(res);
      
      if (!res.ok) {
        setError(data.message || 'Failed to resend code');
      } else {
        setSuccess('Verification code sent! Please check your email.');
        // Start 40 second cooldown timer
        setResendCooldown(40);
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (isDisabled) return;
    setLoading(true);
    setError('');
    setErrorDetail('');
    setSuccess('');
    
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp: otp.trim() }),
      });
      
      const text = await res.text();
      let data = {};
      
      if (text && text.trim()) {
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          if (res.status >= 500) {
            setError('Server error (HTTP ' + res.status + ')');
            setErrorDetail(NON_JSON_ERROR_HINT);
          } else {
            setError('Server error. Please try again.');
          }
          setLoading(false);
          return;
        }
      }
      
      if (!res.ok || !data.success) {
        setError(formatErrorMessage(data, 'Verification failed'));
        if (data.code && ERROR_HINTS[data.code]) {
          setErrorDetail(ERROR_HINTS[data.code]);
        } else if (res.status >= 500) {
          setErrorDetail('This is a server-side error. Check the deployment environment variables and server logs.');
        }
        setLoading(false);
        return;
      }
      
      // Success
      setSuccess('Email verified successfully!');
      
      if (data.data && data.data.token) {
        localStorage.setItem('token', data.data.token);
      }
      
      // Redirect immediately - cookies are set synchronously
      // Use window.location for hash navigation as Next.js router doesn't handle hashes well
      window.location.href = '/dashboard#overview';
      
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
      setErrorDetail('');
    } finally {
      setLoading(false);
    }
  }

  if (!router.isReady) return null;

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-shell">
        <div className="auth-card">
          <header className="card-header">
            <h1>Verify your email</h1>
            <p>We've sent a verification code to <strong>{email}</strong></p>
            {resendCooldown > 0 && (
              <p className="wait-note">
                Wait for a while if you haven't received it, then resend.
              </p>
            )}
          </header>

          {error && (
            <div className="alert" role="alert" aria-live="assertive">
              <p style={{ fontWeight: 500 }}>{error}</p>
              {errorDetail && (
                <p style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.4rem', lineHeight: 1.4 }}>{errorDetail}</p>
              )}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success" role="alert" aria-live="polite">
              {success}
            </div>
          )}

          <form onSubmit={onSubmit} className="form" noValidate>
            <label className="field">
              <span>Verification Code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                id="otp"
                name="otp"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={loading}
              />
            </label>
            
            <button type="submit" disabled={isDisabled}>
              {loading && <span className="spinner" aria-hidden="true" />}
              <span>{loading ? 'Verifying…' : 'Verify Email'}</span>
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <button 
                    type="button" 
                    onClick={onResend} 
                    disabled={resending || resendCooldown > 0}
                    className="text-btn"
                >
                    {resending 
                      ? 'Sending...' 
                      : resendCooldown > 0 
                        ? `Resend Code (${resendCooldown}s)` 
                        : 'Resend Code'}
                </button>
            </div>
          </form>

          <footer className="card-footer">
            <span>Wrong email?</span>
            <Link href="/signup" className="cta-link">
              Create a new account
            </Link>
          </footer>

        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .auth-shell {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8rem 1.5rem 4rem;
          flex: 1;
          background: radial-gradient(circle at top, rgba(0, 112, 243, 0.15), transparent 55%),
            radial-gradient(circle at bottom, rgba(35, 159, 255, 0.12), transparent 40%);
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          padding: 2.5rem 2.5rem 2rem;
          border-radius: 1.5rem;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 24px 60px rgba(15, 35, 95, 0.12);
          backdrop-filter: blur(6px);
          animation: fadeIn 0.45s ease 0.05s both;
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }
        .card-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #102a43;
          margin-bottom: 0.35rem;
        }
        .card-header p {
          color: #4b5d73;
          line-height: 1.5;
        }
        .wait-note {
          color: #64748b;
          font-size: 0.9rem;
          font-style: italic;
          margin-top: 0.5rem;
          padding: 0.75rem;
          background: rgba(0, 112, 243, 0.05);
          border-left: 3px solid #0070f3;
          border-radius: 0.5rem;
        }
        .alert {
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(220, 38, 38, 0.08);
          color: #b91c1c;
          border: 1px solid rgba(220, 38, 38, 0.24);
          font-weight: 500;
        }
        .alert-success {
          background: rgba(16, 185, 129, 0.08);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.22);
        }
        .form {
          display: grid;
          gap: 1.25rem;
        }
        .field {
          display: grid;
          gap: 0.55rem;
        }
        .field span {
          font-weight: 600;
          color: #0f1c2f;
          font-size: 0.94rem;
        }
        input {
          padding: 0.9rem 1rem;
          border-radius: 0.9rem;
          border: 1px solid rgba(15, 35, 95, 0.12);
          background: #fff;
          font-size: 1rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        input:focus {
          outline: none;
          border-color: rgba(0, 112, 243, 0.55);
          box-shadow: 0 0 0 4px rgba(0, 112, 243, 0.12);
        }
        input:disabled {
          background: #f5f7fb;
        }
        button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          padding: 0.95rem 1.25rem;
          border-radius: 0.95rem;
          border: none;
          background: linear-gradient(135deg, #0070f3, #3291ff);
          color: #fff;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
        }
        button:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(0, 112, 243, 0.25);
        }
        button:disabled {
          cursor: not-allowed;
          opacity: 0.72;
          box-shadow: none;
        }
        .text-btn {
            background: none;
            color: #0070f3;
            padding: 0.5rem;
            font-size: 0.9rem;
            box-shadow: none;
        }
        .text-btn:hover {
            text-decoration: underline;
            background: none;
            box-shadow: none;
            transform: none;
        }
        .spinner {
          width: 1rem;
          height: 1rem;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: #fff;
          animation: spin 0.65s linear infinite;
        }
        .card-footer {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.95rem;
          color: #4b5d73;
        }
        .cta-link {
          color: #0070f3;
          font-weight: 600;
          text-decoration: none;
        }
        .cta-link:hover {
          text-decoration: underline;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 600px) {
          .auth-shell {
            padding: 6rem 1rem 3rem;
          }
          .auth-card {
            padding: 2rem 1.65rem;
            border-radius: 1.25rem;
          }
          .card-header h1 {
            font-size: 1.75rem;
          }
          .card-header p {
            font-size: 0.9rem;
          }
        }
      `}</style>
      <Footer />
    </div>
  );
}

