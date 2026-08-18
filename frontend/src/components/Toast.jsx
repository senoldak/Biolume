import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none'
    }}>
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';

        let borderColor = 'var(--border-default)';
        let bgColor = 'var(--bg-surface-elevated)';
        let Icon = Info;
        let iconColor = 'var(--accent-cyan)';

        if (isError) {
          borderColor = 'var(--accent-rose-border)';
          bgColor = 'rgba(244, 63, 94, 0.15)';
          Icon = AlertTriangle;
          iconColor = 'var(--accent-rose)';
        } else if (isSuccess) {
          borderColor = 'var(--accent-emerald-border)';
          bgColor = 'rgba(16, 185, 129, 0.15)';
          Icon = CheckCircle2;
          iconColor = 'var(--accent-emerald)';
        }

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              minWidth: '280px',
              maxWidth: '420px',
              background: bgColor,
              border: `1px solid ${borderColor}`,
              backdropFilter: 'blur(16px)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              animation: 'toastSlideIn 0.25s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icon size={16} color={iconColor} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {toast.message}
              </span>
            </div>
            {onDismiss && (
              <button
                onClick={() => onDismiss(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
