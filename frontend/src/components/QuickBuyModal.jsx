import React, { useEffect } from 'react';
import { Zap, X, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '../utils/formatters';

export default function QuickBuyModal({
  selectedToken,
  onClose,
  buyAmount,
  setBuyAmount,
  buySuccessMsg,
  executeBuy
}) {
  useEffect(() => {
    if (!selectedToken) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedToken, onClose]);

  if (!selectedToken) return null;

  return (
    <div 
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quickbuy-modal-title"
    >
      <div 
        className="terminal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          width: '100%',
          maxWidth: '420px', 
          padding: '24px', 
          boxShadow: 'var(--shadow-lg)',
          background: 'var(--bg-surface-0)',
          border: '1px solid var(--border-default)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="var(--accent-emerald)" />
            <h3 id="quickbuy-modal-title" style={{ fontSize: '15px', fontWeight: 800 }}>
              Quick Order: {selectedToken.symbol}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', background: 'var(--bg-app)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div>Unit Price: <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>${formatPrice(selectedToken.price_usd)}</span></div>
          <div style={{ marginTop: '2px' }}>Liquidity: <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>${(selectedToken.liquidity_usd || 0).toLocaleString()}</span></div>
        </div>

        {buySuccessMsg ? (
          <div className="badge badge-emerald" style={{ padding: '12px', width: '100%', justifyContent: 'center', fontSize: '12px' }}>
            <CheckCircle2 size={14} />
            <span>{buySuccessMsg}</span>
          </div>
        ) : (
          <>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Select Order Size (SOL):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '16px' }}>
              {['0.1', '0.2', '0.5', '1.0'].map(val => (
                <button
                  key={val}
                  onClick={() => setBuyAmount(val)}
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    border: buyAmount === val ? '1px solid var(--accent-emerald-border)' : '1px solid var(--border-subtle)',
                    background: buyAmount === val ? 'var(--accent-emerald-subtle)' : 'var(--bg-app)',
                    color: buyAmount === val ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono, monospace',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {val} SOL
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={onClose}
                className="btn-action-secondary"
                style={{ flex: 1, padding: '10px' }}
              >
                Cancel
              </button>
              <button
                onClick={executeBuy}
                className="btn-action-primary"
                style={{ flex: 2, padding: '10px' }}
              >
                <Zap size={14} />
                <span>Execute Order</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
