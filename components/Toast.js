import { useEffect, useState } from 'react';

/**
 * Individual Toast Item Component
 */
export function ToastItem({ toast, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // Match animation duration
  };

  const getIcon = () => {
    const icons = {
      success: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      ),
      error: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      ),
      warning: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      ),
      info: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      ),
    };
    return icons[toast.type] || icons.info;
  };

  const typeStyles = {
    success: {
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.08))',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      iconColor: '#10b981',
      textColor: '#065f46',
    },
    error: {
      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.08))',
      borderColor: 'rgba(239, 68, 68, 0.3)',
      iconColor: '#ef4444',
      textColor: '#991b1b',
    },
    warning: {
      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.08))',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      iconColor: '#f59e0b',
      textColor: '#92400e',
    },
    info: {
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.08))',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      iconColor: '#3b82f6',
      textColor: '#1e40af',
    },
  };

  const style = typeStyles[toast.type] || typeStyles.info;

  return (
    <div
      className={`toast-item ${isExiting ? 'toast-item--exiting' : ''}`}
      style={{
        background: style.background,
        borderColor: style.borderColor,
      }}
      onClick={handleRemove}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-icon" style={{ color: style.iconColor }}>
        {getIcon()}
      </div>
      <div className="toast-content">
        {toast.title && <div className="toast-title" style={{ color: style.textColor }}>{toast.title}</div>}
        {toast.message && <div className="toast-message">{toast.message}</div>}
      </div>
      <button
        type="button"
        className="toast-close"
        onClick={(e) => {
          e.stopPropagation();
          handleRemove();
        }}
        aria-label="Close notification"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <style jsx>{`
        .toast-item {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.625rem 0.875rem;
          border-radius: 8px;
          border: 1px solid;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(148, 163, 184, 0.08);
          min-width: 240px;
          max-width: 360px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .toast-item:hover {
          transform: translateX(-2px);
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(148, 163, 184, 0.12);
        }

        .toast-item--exiting {
          animation: slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
          transform: translateX(100%);
        }

        .toast-icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toast-content {
          flex: 1;
          min-width: 0;
        }

        .toast-title {
          font-weight: 600;
          font-size: 0.85rem;
          margin: 0;
          line-height: 1.3;
        }

        .toast-message {
          font-size: 0.8rem;
          color: #475569;
          line-height: 1.4;
          margin: 0;
        }

        .toast-close {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          border: none;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s ease;
          padding: 0;
        }

        .toast-close:hover {
          background: rgba(148, 163, 184, 0.15);
          color: #64748b;
        }

        .toast-close:active {
          transform: scale(0.9);
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideOutRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }

        @media (max-width: 480px) {
          .toast-item {
            min-width: 200px;
            max-width: calc(100vw - 1.5rem);
            padding: 0.5rem 0.75rem;
          }

          .toast-title {
            font-size: 0.8rem;
          }

          .toast-message {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Toast Container Component
 */
export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
      <style jsx>{`
        .toast-container {
          position: fixed;
          top: 0.75rem;
          right: 0.75rem;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-width: calc(100vw - 1.5rem);
          pointer-events: none;
        }

        .toast-container :global(.toast-item) {
          pointer-events: auto;
        }

        @media (max-width: 640px) {
          .toast-container {
            top: 0.5rem;
            right: 0.5rem;
            left: 0.5rem;
            max-width: none;
          }

          .toast-container :global(.toast-item) {
            max-width: 100%;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

