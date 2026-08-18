import React, { useState, useEffect } from 'react';
import { 
  Sliders, Server, Zap, ShieldAlert, Save, CheckCircle2, 
  Trash2, Radio, AlertTriangle 
} from 'lucide-react';
import { soundManager } from '../utils/audioAlerts';

export default function BotSettingsTab({ lang = 'tr' }) {
  // General Bot Settings
  const [settings, setSettings] = useState({
    buy_amount_sol: 0.20,
    webhook_url: '',
    paper_trading: true
  });
  const [saveStatus, setSaveStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Multi-RPC Status
  const [rpcStatus, setRpcStatus] = useState({ endpoints: [], active_rpc_name: 'Solana Official', active_latency: '45ms' });

  // Blacklist & Vault Status
  const [blacklistStatus, setBlacklistStatus] = useState({ active_cooldowns: {}, blacklisted_devs: {}, blacklisted_tokens: {} });
  const [vaultStatus, setVaultStatus] = useState({ auto_sweep_enabled: true, threshold_sol: 15.0, keep_balance_sol: 10.0, total_swept_sol: 0.0 });
  const [newBlacklistToken, setNewBlacklistToken] = useState({ address: '', reason: 'Suspected Cabal Dump' });
  const [vaultForm, setVaultForm] = useState({ auto_sweep_enabled: true, threshold_sol: 15.0, keep_balance_sol: 10.0, cold_wallet_address: '' });

  const loadData = async () => {
    try {
      const [sRes, rpcRes, vRes, blkRes] = await Promise.all([
        fetch('/api/autopilot/status').then(r => r.json()).catch(() => ({})),
        fetch('/api/rpc/status').then(r => r.json()).catch(() => ({ endpoints: [] })),
        fetch('/api/vault/status').then(r => r.json()).catch(() => ({})),
        fetch('/api/blacklist/status').then(r => r.json()).catch(() => ({}))
      ]);
      if (sRes) {
        setSettings({
          buy_amount_sol: sRes.buy_amount_sol || 0.20,
          webhook_url: sRes.webhook_url || '',
          paper_trading: true
        });
      }
      if (rpcRes) setRpcStatus(rpcRes);
      if (vRes) {
        setVaultStatus(vRes);
        setVaultForm(vRes);
      }
      if (blkRes) setBlacklistStatus(blkRes);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveStatus('');
    try {
      await fetch('/api/autopilot/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buy_amount_sol: parseFloat(settings.buy_amount_sol),
          webhook_url: settings.webhook_url
        })
      });
      soundManager.playProfitSound();
      setSaveStatus(lang === 'tr' ? 'Ayarlar başarıyla kaydedildi!' : 'Settings saved!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 2-Column Grid: Engine Settings + Vault */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* CARD 1: General Engine Settings */}
        <div className="terminal-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sliders size={16} color="var(--accent-sky)" />
            {lang === 'tr' ? 'Otopilot Motor Parametreleri' : 'Engine Parameters'}
          </h3>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
            <div>
              <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                {lang === 'tr' ? 'Standart Alım Büyüklüğü (SOL)' : 'Default Buy Size (SOL)'}
              </label>
              <input 
                type="number" 
                value={settings.buy_amount_sol}
                step="0.05" 
                onChange={(e) => setSettings({ ...settings, buy_amount_sol: e.target.value })}
                style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', padding: '9px 12px', borderRadius: 'var(--radius-sm)', outline: 'none', fontFamily: 'JetBrains Mono, monospace' }} 
              />
            </div>

            <div>
              <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                {lang === 'tr' ? 'Discord / Telegram Webhook URL' : 'Discord / Telegram Webhook URL'}
              </label>
              <input 
                type="url" 
                placeholder="https://discord.com/api/webhooks/..." 
                value={settings.webhook_url}
                onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', padding: '9px 12px', borderRadius: 'var(--radius-sm)', outline: 'none', fontFamily: 'JetBrains Mono, monospace' }} 
              />
            </div>

            {saveStatus && (
              <div style={{ color: 'var(--accent-emerald)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} />
                <span>{saveStatus}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="btn-action-primary" 
              style={{ padding: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}
            >
              <Save size={14} />
              <span>{loading ? (lang === 'tr' ? 'Kaydediliyor...' : 'Saving...') : (lang === 'tr' ? 'Ayarları Kaydet' : 'Save Settings')}</span>
            </button>
          </form>
        </div>

        {/* CARD 2: Profit Stash Vault */}
        <div className="terminal-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)' }}>
                <Zap size={16} />
                {lang === 'tr' ? 'Otomatik Kar Kasası (Profit Vault)' : 'Profit Stash & Cold Vault'}
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {lang === 'tr' ? 'Bot bakiyesi belirlenen eşiği aştığında fazla karı güvenli soğuk cüzdanınıza aktarır.' : 'Automatically sweeps excess profits to your cold storage wallet.'}
              </p>
            </div>
            <button onClick={handleSweepNow} className="btn-action-primary" style={{ fontSize: '11px', padding: '5px 12px' }}>
              ⚡ {lang === 'tr' ? 'Kasaya Çek' : 'Sweep Now'}
            </button>
          </div>

          <form onSubmit={handleSaveVaultSettings} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                {lang === 'tr' ? 'Soğuk Cüzdan Adresi (Hedef Kasa)' : 'Cold Storage Target Address'}
              </label>
              <input
                type="text"
                placeholder="Solana Cold Wallet Address"
                value={vaultForm.cold_wallet_address || ''}
                onChange={(e) => setVaultForm({ ...vaultForm, cold_wallet_address: e.target.value })}
                style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}
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
                  style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', fontSize: '12px', color: 'var(--text-primary)' }}
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
                  style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', fontSize: '12px', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-action-secondary" style={{ marginTop: '4px', padding: '8px', fontSize: '11px' }}>
              {lang === 'tr' ? 'Kasa Ayarlarını Kaydet' : 'Save Vault Settings'}
            </button>
          </form>
        </div>
      </div>

      {/* CARD 3: Solana Multi-RPC Router */}
      <div className="terminal-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={16} color="var(--accent-emerald)" />
              {lang === 'tr' ? 'Solana RPC Yönlendirici & Gecikme Takibi' : 'Solana Multi-RPC Router & Latency'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {lang === 'tr' ? 'Sistem milisaniyeler içinde en hızlı yanıt veren RPC node üzerinden işlemleri yönlendirir.' : 'System routes transactions through the lowest latency Solana node.'}
            </p>
          </div>
          <span className="badge badge-emerald font-mono">
            ACTIVE: {rpcStatus.active_latency || '35ms'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          {(rpcStatus.endpoints || [
            { name: 'Solana Official RPC', url: 'https://api.mainnet-beta.solana.com', latency_ms: 45, is_active: true },
            { name: 'Helius High-Speed RPC', url: 'https://mainnet.helius-rpc.com', latency_ms: 28, is_active: false },
            { name: 'QuickNode Turbo', url: 'https://solana-mainnet.quiknode.pro', latency_ms: 32, is_active: false },
            { name: 'Jito MEV Tip Node', url: 'https://mainnet.block-engine.jito.wtf', latency_ms: 18, is_active: false }
          ]).map((ep, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: ep.is_active ? 'var(--bg-surface-1)' : 'var(--bg-app)',
                border: ep.is_active ? '1px solid var(--accent-emerald-border)' : '1px solid var(--border-subtle)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>{ep.name}</span>
                  {ep.is_active && (
                    <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', color: 'var(--accent-emerald)', background: 'var(--bg-surface-0)', border: '1px solid var(--accent-emerald-border)' }}>
                      PRIMARY
                    </span>
                  )}
                </div>
                <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  {ep.url}
                </span>
              </div>
              <span className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: ep.latency_ms < 30 ? 'var(--accent-emerald)' : 'var(--accent-cyan)' }}>
                {ep.latency_ms}ms
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CARD 4: Blacklist & Dev Shield */}
      <div className="terminal-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-rose)' }}>
          <ShieldAlert size={16} />
          {lang === 'tr' ? 'Scam & Rug Puller Kara Liste Kalkanı' : 'Scam & Serial Rugger Shield'}
        </h3>

        <form onSubmit={handleAddBlacklistToken} style={{ display: 'flex', gap: '8px', marginBottom: '14px', maxWidth: '600px' }}>
          <input
            type="text"
            placeholder={lang === 'tr' ? 'Token Adresi (Engelle)' : 'Token Address to Block'}
            value={newBlacklistToken.address}
            onChange={(e) => setNewBlacklistToken({ ...newBlacklistToken, address: e.target.value })}
            style={{ flex: 1, background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '7px 10px', fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}
          />
          <button type="submit" className="btn-action-danger" style={{ fontSize: '11px', padding: '6px 14px' }}>
            + Engelle
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '700px' }}>
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
    </div>
  );
}
