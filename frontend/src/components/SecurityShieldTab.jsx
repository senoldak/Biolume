import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Zap, Radio, Trash2, Plus, Download, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { soundManager } from '../utils/audioAlerts';

export default function SecurityShieldTab({ lang = 'tr' }) {
  const [blacklistStatus, setBlacklistStatus] = useState({ active_cooldowns: {}, blacklisted_devs: {}, blacklisted_tokens: {} });
  const [vaultStatus, setVaultStatus] = useState({ auto_sweep_enabled: true, threshold_sol: 15.0, keep_balance_sol: 10.0, total_swept_sol: 0.0 });
  const [migrationStatus, setMigrationStatus] = useState({ is_enabled: true, snipe_amount_sol: 0.35, graduating_count: 0, graduating_tokens: [], graduated_history: [] });
  
  const [newBlacklistToken, setNewBlacklistToken] = useState({ address: '', reason: 'Suspected Cabal Dump' });
  const [newBlacklistDev, setNewBlacklistDev] = useState({ address: '', reason: 'Serial Rug Puller' });
  const [vaultForm, setVaultForm] = useState({ auto_sweep_enabled: true, threshold_sol: 15.0, keep_balance_sol: 10.0, cold_wallet_address: '' });

  const loadData = async () => {
    try {
      const [vRes, migRes, blkRes] = await Promise.all([
        fetch('/api/vault/status').then(r => r.json()).catch(() => ({})),
        fetch('/api/migration/status').then(r => r.json()).catch(() => ({})),
        fetch('/api/blacklist/status').then(r => r.json()).catch(() => ({}))
      ]);
      setVaultStatus(vRes || {});
      if (vRes) setVaultForm(vRes);
      setMigrationStatus(migRes || { is_enabled: true, graduating_tokens: [], graduated_history: [] });
      setBlacklistStatus(blkRes || { active_cooldowns: {}, blacklisted_devs: {}, blacklisted_tokens: {} });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSweepNow = async () => {
    try {
      const res = await fetch('/api/vault/sweep-now', { method: 'POST' });
      const data = await res.json();
      if (data.success) soundManager.playProfitSound();
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveVaultSettings = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/vault/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vaultForm)
      });
      soundManager.playBuySound();
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddBlacklistToken = async (e) => {
    e.preventDefault();
    if (!newBlacklistToken.address) return;
    try {
      await fetch('/api/blacklist/add-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlacklistToken)
      });
      setNewBlacklistToken({ address: '', reason: 'Suspected Cabal Dump' });
      soundManager.playPanicSound();
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddBlacklistDev = async (e) => {
    e.preventDefault();
    if (!newBlacklistDev.address) return;
    try {
      await fetch('/api/blacklist/add-dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlacklistDev)
      });
      setNewBlacklistDev({ address: '', reason: 'Serial Rug Puller' });
      soundManager.playPanicSound();
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveBlacklistToken = async (addr) => {
    try {
      await fetch('/api/blacklist/remove-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr })
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveBlacklistDev = async (addr) => {
    try {
      await fetch('/api/blacklist/remove-dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr })
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        <div className="terminal-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {lang === 'tr' ? 'Kara Liste Engelleri' : 'Blacklist Block Count'}
            </span>
            <ShieldAlert size={16} color="var(--accent-rose)" />
          </div>
          <div className="font-mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '6px' }}>
            {Object.keys(blacklistStatus.blacklisted_tokens || {}).length + Object.keys(blacklistStatus.blacklisted_devs || {}).length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {Object.keys(blacklistStatus.blacklisted_tokens || {}).length} Token | {Object.keys(blacklistStatus.blacklisted_devs || {}).length} Dev
          </div>
        </div>

        <div className="terminal-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {lang === 'tr' ? 'Güvenli Kasa Aktarımı' : 'Profit Vault Stash'}
            </span>
            <Zap size={16} color="var(--accent-emerald)" />
          </div>
          <div className="font-mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '6px' }}>
            {vaultStatus.total_swept_sol || 0.0} SOL
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {lang === 'tr' ? 'Soğuk Cüzdana Güvenle Çekildi' : 'Secured to Cold Storage'}
          </div>
        </div>

        <div className="terminal-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {lang === 'tr' ? 'Raydium Mezuniyetleri' : 'Raydium Migrations'}
            </span>
            <Radio size={16} color="var(--accent-violet)" />
          </div>
          <div className="font-mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-violet)', marginTop: '6px' }}>
            {migrationStatus.graduated_history ? migrationStatus.graduated_history.length : 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {lang === 'tr' ? 'Otomatik Yakalanan Havuzlar' : 'Auto-detected Pools'}
          </div>
        </div>
      </div>

      {/* Grid of Security Tools */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Blacklist Manager */}
        <div className="terminal-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-rose)' }}>
            <ShieldAlert size={16} />
            {lang === 'tr' ? 'Scam & Dev Kara Liste Kalkanı' : 'Scam & Serial Rugger Shield'}
          </h3>

          <form onSubmit={handleAddBlacklistToken} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder={lang === 'tr' ? 'Token Adresi (Engelle)' : 'Token Address to Block'}
              value={newBlacklistToken.address}
              onChange={(e) => setNewBlacklistToken({ ...newBlacklistToken, address: e.target.value })}
              style={{ flex: 1, background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '7px 10px', fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}
            />
            <button type="submit" className="btn-action-danger" style={{ fontSize: '11px', padding: '6px 12px' }}>
              + Engelle
            </button>
          </form>

          {/* Blocked Tokens List */}
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.keys(blacklistStatus.blacklisted_tokens || {}).length === 0 ? (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '16px', textAlign: 'center', background: 'var(--bg-app)', borderRadius: '4px' }}>
                {lang === 'tr' ? 'Kara listede kayıtlı token yok.' : 'No blacklisted tokens.'}
              </div>
            ) : (
              Object.entries(blacklistStatus.blacklisted_tokens).map(([addr, reason], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-surface-1)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <span className="font-mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {addr.slice(0, 8)}...{addr.slice(-6)}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--accent-rose)', marginLeft: '8px' }}>{reason}</span>
                  </div>
                  <button onClick={() => handleRemoveBlacklistToken(addr)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Profit Stash Vault */}
        <div className="terminal-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)' }}>
              <Zap size={16} />
              {lang === 'tr' ? 'Otomatik Kar Kasası (Profit Vault)' : 'Profit Stash & Cold Vault'}
            </h3>
            <button onClick={handleSweepNow} className="btn-action-primary" style={{ fontSize: '11px', padding: '5px 12px' }}>
              ⚡ {lang === 'tr' ? 'Şimdi Kasaya Aktar' : 'Sweep Now'}
            </button>
          </div>

          <form onSubmit={handleSaveVaultSettings} style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                {lang === 'tr' ? 'Soğuk Cüzdan Adresi (Hedef Kasa)' : 'Cold Storage Target Address'}
              </label>
              <input
                type="text"
                placeholder="Solana Cold Wallet Address"
                value={vaultForm.cold_wallet_address || ''}
                onChange={(e) => setVaultForm({ ...vaultForm, cold_wallet_address: e.target.value })}
                style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '7px 10px', fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'tr' ? 'Tetikleme Eşiği (SOL)' : 'Sweep Threshold (SOL)'}
                </label>
                <input
                  type="number"
                  step="1.0"
                  value={vaultForm.threshold_sol || 15.0}
                  onChange={(e) => setVaultForm({ ...vaultForm, threshold_sol: parseFloat(e.target.value) })}
                  style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '7px 10px', fontSize: '12px', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'tr' ? 'Botta Bırakılacak Bakiye (SOL)' : 'Keep on Bot (SOL)'}
                </label>
                <input
                  type="number"
                  step="1.0"
                  value={vaultForm.keep_balance_sol || 10.0}
                  onChange={(e) => setVaultForm({ ...vaultForm, keep_balance_sol: parseFloat(e.target.value) })}
                  style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '7px 10px', fontSize: '12px', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-action-secondary" style={{ marginTop: '6px', padding: '8px', fontSize: '11px' }}>
              {lang === 'tr' ? 'Kasa Ayarlarını Kaydet' : 'Save Vault Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
