import React, { useState, useEffect } from 'react';
import { Wallet, X, Lock, Key, Server, Percent, CheckCircle2, Sparkles, Shield, Copy, Check, Zap } from 'lucide-react';

export default function WalletModal({
  isOpen,
  onClose,
  walletForm,
  setWalletForm,
  handleSaveWalletSettings
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGenerateKeypair = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/wallet/generate-keypair', { method: 'POST' });
      const data = await res.json();
      if (data && data.public_key && data.private_key) {
        setWalletForm({
          ...walletForm,
          wallet_address: data.public_key,
          private_key: data.private_key
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySecret = () => {
    if (!walletForm.private_key) return;
    navigator.clipboard.writeText(walletForm.private_key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div 
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
    >
      <div 
        className="terminal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface-0)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={18} color="var(--accent-emerald)" />
            <h3 id="wallet-modal-title" style={{ fontSize: '15px', fontWeight: 800 }}>Dedicated Bot Sub-Wallet & 0-Click Execution</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* 0-Click Instant Buy Explanation Banner */}
        <div style={{
          background: 'rgba(6, 182, 212, 0.06)',
          border: '1px solid var(--accent-cyan-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          marginBottom: '16px',
          fontSize: '11.5px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '4px' }}>
            <Zap size={14} />
            <span>0-Click Autonomous Execution (No Browser Popup)</span>
          </div>
          To bypass manual MetaMask/Phantom popups and snipe memecoins in milliseconds, Biolume signs transactions locally via your dedicated bot keypair and routes directly to Jupiter V6 & Solana RPC.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 1-Click Generate Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Solana Bot Public Key (Address):
            </label>
            <button
              type="button"
              onClick={handleGenerateKeypair}
              disabled={isGenerating}
              className="btn-action-secondary"
              style={{
                fontSize: '10.5px',
                padding: '3px 8px',
                color: 'var(--accent-emerald)',
                borderColor: 'var(--accent-emerald-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Sparkles size={11} />
              <span>{isGenerating ? 'Generating...' : '+ Generate New Bot Wallet'}</span>
            </button>
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Key size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px' }} />
            <input
              type="text"
              placeholder="e.g. 7xKXtg...sAsU"
              value={walletForm.wallet_address}
              onChange={(e) => setWalletForm({ ...walletForm, wallet_address: e.target.value })}
              style={{
                width: '100%',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                padding: '9px 12px 9px 32px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono, monospace',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Private Key (Base58 / Secret Key):
              </label>
              {walletForm.private_key && (
                <button
                  type="button"
                  onClick={handleCopySecret}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedKey ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    fontSize: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedKey ? <Check size={11} /> : <Copy size={11} />}
                  <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                </button>
              )}
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px' }} />
              <input
                type="password"
                placeholder="Required for autonomous live trading (kept in local memory only)"
                value={walletForm.private_key}
                onChange={(e) => setWalletForm({ ...walletForm, private_key: e.target.value })}
                style={{
                  width: '100%',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '9px 12px 9px 32px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontFamily: 'JetBrains Mono, monospace',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                RPC Endpoint:
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Server size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px' }} />
                <input
                  type="text"
                  placeholder="https://api.mainnet-beta.solana.com"
                  value={walletForm.rpc_url}
                  onChange={(e) => setWalletForm({ ...walletForm, rpc_url: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '9px 10px 9px 30px',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono, monospace',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Max Slippage Tolerance (%):
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Percent size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px' }} />
                <input
                  type="number"
                  placeholder="1.0"
                  step="0.1"
                  value={walletForm.slippage_pct}
                  onChange={(e) => setWalletForm({ ...walletForm, slippage_pct: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '9px 10px 9px 30px',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono, monospace',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          <button
            onClick={onClose}
            className="btn-action-secondary"
            style={{ flex: 1, padding: '10px' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveWalletSettings}
            className="btn-action-primary"
            style={{ flex: 2, padding: '10px' }}
          >
            <CheckCircle2 size={14} />
            <span>Save & Apply Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
