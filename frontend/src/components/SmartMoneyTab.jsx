import React, { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, DollarSign, Wallet, ArrowUpRight, CheckCircle2, 
  Zap, Power, Trash2, Edit3, Plus, ShieldCheck, Play, Sliders, X, 
  AlertTriangle, RefreshCw 
} from 'lucide-react';
import { soundManager } from '../utils/audioAlerts';

export default function SmartMoneyTab({ 
  smartWallets, 
  onCopyWhale, 
  copiedWalletAddresses = [], 
  lang = 'tr',
  positions = [],
  walletInfo = { balance_sol: 10.0, mode: 'PAPER' },
  handleToggleTradingMode,
  handleClosePosition
}) {
  const [copyState, setCopyState] = useState({ is_enabled: true, wallets: [], copied_trades: [] });
  const [editingWhale, setEditingWhale] = useState(null); // Whale setup modal state
  const [newCustomWallet, setNewCustomWallet] = useState({ address: '', label: '', amount_sol: '0.20' });

  const loadCopyState = async () => {
    try {
      const res = await fetch('/api/copy-trade/state');
      const data = await res.json();
      if (data) setCopyState(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCopyState();
    const interval = setInterval(loadCopyState, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleEngine = async () => {
    try {
      const res = await fetch('/api/copy-trade/toggle-engine', { method: 'POST' });
      const data = await res.json();
      setCopyState(prev => ({ ...prev, is_enabled: data.is_enabled }));
      soundManager.playBuySound();
    } catch (e) {
      console.error(e);
    }
  };

  const openWhaleConfig = (w) => {
    setEditingWhale({
      address: w.wallet || w.address,
      label: w.label || 'Whale Alpha',
      win_rate: w.winrate_30d || w.win_rate || 75.0,
      total_profit_sol: w.pnl_usd ? w.pnl_usd / 150.0 : 30.0,
      copy_buy_amount_sol: 0.20,
      stop_loss_override: -15.0,
      take_profit_override: 50.0,
      auto_sell_on_dump: true
    });
  };

  const handleSaveWhaleConfig = async (e) => {
    e.preventDefault();
    if (!editingWhale) return;

    try {
      await fetch('/api/copy-trade/add-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: editingWhale.address,
          label: editingWhale.label,
          win_rate: editingWhale.win_rate,
          total_profit_sol: editingWhale.total_profit_sol,
          copy_buy_amount_sol: parseFloat(editingWhale.copy_buy_amount_sol) || 0.20,
          stop_loss_override: parseFloat(editingWhale.stop_loss_override) || -15.0,
          take_profit_override: parseFloat(editingWhale.take_profit_override) || 50.0,
          auto_sell_on_dump: editingWhale.auto_sell_on_dump,
          enabled: true
        })
      });
      soundManager.playBuySound();
      setEditingWhale(null);
      loadCopyState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleWallet = async (addr) => {
    try {
      await fetch('/api/copy-trade/toggle-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr })
      });
      loadCopyState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveWallet = async (addr) => {
    try {
      await fetch('/api/copy-trade/delete-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr })
      });
      loadCopyState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCustomWallet = async (e) => {
    e.preventDefault();
    if (!newCustomWallet.address) return;
    openWhaleConfig({
      wallet: newCustomWallet.address,
      label: newCustomWallet.label || 'Custom Whale',
      winrate_30d: 75.0,
      pnl_usd: 4500
    });
    setNewCustomWallet({ address: '', label: '', amount_sol: '0.20' });
  };

  const activeWallets = copyState.wallets || [];
  const openPositions = positions.filter(p => p.status === 'OPEN');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Cockpit: Engine Master + Mode Switcher */}
      <div className="terminal-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="var(--accent-violet)" />
              <h2 style={{ fontSize: '16px', fontWeight: 800 }}>
                {lang === 'tr' ? 'Akıllı Para & Balina Kopyalama İstasyonu' : 'Smart Money & Whale Mirror Station'}
              </h2>
              <span className={`badge ${copyState.is_enabled ? 'badge-emerald' : 'badge-rose'}`}>
                {copyState.is_enabled ? (lang === 'tr' ? 'KOPYALAMA AKTİF' : 'MIRROR ENGINE LIVE') : (lang === 'tr' ? 'DURAKLATILDI' : 'PAUSED')}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {lang === 'tr' 
                ? 'Seçtiğiniz balinaların alımlarını belirlediğiniz SOL büyüklüğü ve Stop-Loss korumasıyla anında kopyalayın.' 
                : 'Mirror high-winrate on-chain traders with customizable trade sizing and automated anti-dump exit.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Paper vs Live Mode Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-app)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
              <button
                onClick={() => handleToggleTradingMode && handleToggleTradingMode(true)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: walletInfo.mode === 'PAPER' ? 'var(--accent-cyan)' : 'transparent',
                  color: walletInfo.mode === 'PAPER' ? '#04141d' : 'var(--text-muted)'
                }}
              >
                🎮 {lang === 'tr' ? 'Sanal Sandbox' : 'Paper Sandbox'} ({walletInfo.balance_sol ? walletInfo.balance_sol.toFixed(2) : '10.0'} SOL)
              </button>
              <button
                onClick={() => handleToggleTradingMode && handleToggleTradingMode(false)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: walletInfo.mode === 'LIVE' ? 'var(--accent-emerald)' : 'transparent',
                  color: walletInfo.mode === 'LIVE' ? '#04141d' : 'var(--text-muted)'
                }}
              >
                🔥 {lang === 'tr' ? 'Canlı Cüzdan' : 'Live Mainnet'}
              </button>
            </div>

            {/* Master Engine Toggle */}
            <button
              onClick={handleToggleEngine}
              className={copyState.is_enabled ? "btn-action-danger" : "btn-action-primary"}
              style={{ fontSize: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Power size={14} />
              <span>{copyState.is_enabled ? (lang === 'tr' ? 'Motoru Duraklat' : 'Pause Engine') : (lang === 'tr' ? 'Motoru Başlat' : 'Start Engine')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Mirrored Positions Table */}
      {openPositions.length > 0 && (
        <div className="terminal-card" style={{ padding: '20px', border: '1px solid var(--accent-cyan-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} color="var(--accent-cyan)" />
              {lang === 'tr' ? 'Açık Kopyalanan Pozisyonlar' : 'Active Mirrored Trades'} ({openPositions.length})
            </h3>
            <span className="badge badge-cyan font-mono" style={{ fontSize: '10px' }}>
              AUTO-MONITORING TP / SL
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
            {openPositions.map((pos, idx) => (
              <div key={idx} style={{ background: 'var(--bg-app)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>
                    ${pos.symbol} <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({pos.token_address ? `${pos.token_address.slice(0, 6)}...${pos.token_address.slice(-4)}` : ''})</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {lang === 'tr' ? 'Giriş:' : 'Entry:'} <span className="font-mono">${pos.entry_price_usd.toFixed(6)}</span> | {lang === 'tr' ? 'Miktar:' : 'Size:'} <span className="font-mono">{pos.amount_sol} SOL</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="font-mono" style={{ fontSize: '13px', fontWeight: 800, color: pos.pnl_pct >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {pos.pnl_pct >= 0 ? `+${pos.pnl_pct.toFixed(1)}%` : `${pos.pnl_pct.toFixed(1)}%`}
                  </div>
                  <button
                    onClick={() => handleClosePosition && handleClosePosition(pos.id)}
                    className="btn-action-danger"
                    style={{ fontSize: '10.5px', padding: '4px 8px' }}
                  >
                    {lang === 'tr' ? 'Kapat' : 'Exit'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Configured Whales Grid */}
      <div className="terminal-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="var(--accent-emerald)" />
              {lang === 'tr' ? 'Aktif Takip Listenizdeki Balinalar' : 'Configured Whales for Copying'} ({activeWallets.length})
            </h3>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {lang === 'tr' ? 'Bu cüzdanlar alım yaptığında sistem belirlediğiniz ayarlarla otomatik alım yapar.' : 'Whenever these addresses buy, your dedicated bot executes the trade automatically.'}
            </p>
          </div>
        </div>

        {activeWallets.length === 0 ? (
          <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
            {lang === 'tr' ? 'Henüz kopyalanan balina cüzdanı eklenmedi. Aşağıdaki listeden istediğiniz balinayı seçip özel kurallarınızı belirleyin.' : 'No active copy wallets. Select a whale below to configure.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
            {activeWallets.map((w, idx) => (
              <div key={idx} style={{
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                border: w.enabled ? '1px solid var(--border-default)' : '1px solid rgba(244, 63, 94, 0.3)',
                background: w.enabled ? 'var(--bg-surface-1)' : 'rgba(244, 63, 94, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>{w.label}</span>
                      <span className={`badge ${w.enabled ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '8.5px', padding: '1px 5px' }}>
                        {w.enabled ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>
                    <span className="font-mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                      {w.address ? `${w.address.slice(0, 8)}...${w.address.slice(-6)}` : ''}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Win Rate</span>
                    <div className="font-mono" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                      {w.win_rate}%
                    </div>
                  </div>
                </div>

                {/* Parameters pill badges */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', background: 'var(--bg-app)', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>BOYUT</span>
                    <span className="font-mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)' }}>{w.copy_buy_amount_sol} SOL</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>STOP-LOSS</span>
                    <span className="font-mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-rose)' }}>{w.stop_loss_override || -15}%</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>KAR AL</span>
                    <span className="font-mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-emerald)' }}>+{w.take_profit_override || 50}%</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px' }}>
                  <button onClick={() => openWhaleConfig(w)} className="btn-action-secondary" style={{ fontSize: '10px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Edit3 size={10} />
                    <span>{lang === 'tr' ? 'Ayarları Düzenle' : 'Edit'}</span>
                  </button>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleToggleWallet(w.address)} className="btn-action-secondary" style={{ fontSize: '10px', padding: '3px 8px' }}>
                      {w.enabled ? (lang === 'tr' ? 'Duraklat' : 'Pause') : (lang === 'tr' ? 'Sürdür' : 'Resume')}
                    </button>
                    <button onClick={() => handleRemoveWallet(w.address)} className="btn-action-danger" style={{ fontSize: '10px', padding: '3px 8px' }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discovery Wallets Grid */}
      <div className="terminal-card" style={{ padding: '20px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={16} color="var(--accent-emerald)" />
              {lang === 'tr' ? 'Solana Zincir-Üstü Doğrulanmış Balinalar' : 'Solana On-Chain Audited Whales'}
            </h3>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {lang === 'tr' ? 'İstediğiniz balinanın üzerine tıklayarak alım miktarını ve koruma limitlerini belirleyip kopyalayın.' : 'Click any whale to configure trade amount and custom profit targets.'}
            </p>
          </div>

          <form onSubmit={handleAddCustomWallet} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder={lang === 'tr' ? 'Özel Cüzdan Adresi' : 'Custom Wallet Address'}
              value={newCustomWallet.address}
              onChange={(e) => setNewCustomWallet({ ...newCustomWallet, address: e.target.value })}
              style={{ width: '180px', background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '6px 8px', fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}
            />
            <button type="submit" className="btn-action-primary" style={{ fontSize: '11px', padding: '6px 10px' }}>
              + Ekle
            </button>
          </form>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
          {smartWallets.map((w, idx) => {
            const isCopied = activeWallets.some(aw => aw.address === w.wallet);

            return (
              <div 
                key={idx} 
                className="terminal-card-elevated"
                style={{ 
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px',
                  border: isCopied ? '1px solid var(--accent-cyan-border)' : '1px solid var(--border-default)',
                  background: isCopied ? 'rgba(6, 182, 212, 0.04)' : 'var(--bg-surface-1)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                        {w.label}
                      </span>
                      <span className="badge badge-violet" style={{ fontSize: '9px', padding: '1px 5px' }}>
                        WHALE
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {w.last_active}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-app)', padding: '5px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '10px' }}>
                    <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {w.wallet ? `${w.wallet.slice(0, 10)}...${w.wallet.slice(-8)}` : ''}
                    </span>
                    <a 
                      href={`https://solscan.io/account/${w.wallet}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ color: 'var(--text-muted)' }}
                      title="View on Solscan"
                    >
                      <ArrowUpRight size={13} />
                    </a>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ background: 'var(--bg-surface-0)', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>30D Win Rate</div>
                      <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '2px' }}>
                        {w.winrate_30d}%
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-surface-0)', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>30D Realized</div>
                      <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '2px' }}>
                        +${(w.pnl_usd || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button 
                    onClick={() => openWhaleConfig(w)}
                    className="btn-action-secondary"
                    style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Sliders size={11} />
                    <span>{lang === 'tr' ? 'Kişiselleştir' : 'Configure'}</span>
                  </button>

                  {isCopied ? (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} />
                      {lang === 'tr' ? 'Kopyalanıyor' : 'Active'}
                    </span>
                  ) : (
                    <button
                      onClick={() => openWhaleConfig(w)}
                      className="btn-action-primary"
                      style={{ padding: '4px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Zap size={12} />
                      <span>{lang === 'tr' ? 'Kopyala' : 'Copy'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Whale Customizer Modal */}
      {editingWhale && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(7, 9, 14, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div className="terminal-card" style={{ width: '100%', maxWidth: '440px', padding: '22px', background: 'var(--bg-surface-0)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} color="var(--accent-violet)" />
                <h3 style={{ fontSize: '15px', fontWeight: 800 }}>{editingWhale.label}</h3>
              </div>
              <button onClick={() => setEditingWhale(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveWhaleConfig} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
              <div>
                <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Cüzdan Adresi:</label>
                <input
                  type="text"
                  disabled
                  value={editingWhale.address}
                  style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '7px 10px', color: 'var(--text-dim)', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}
                />
              </div>

              <div>
                <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>İşlem Başına Alım Büyüklüğü (SOL):</label>
                <input
                  type="number"
                  step="0.05"
                  value={editingWhale.copy_buy_amount_sol}
                  onChange={(e) => setEditingWhale({ ...editingWhale, copy_buy_amount_sol: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Zarar Durdur (Stop-Loss %):</label>
                  <input
                    type="number"
                    step="1"
                    value={editingWhale.stop_loss_override}
                    onChange={(e) => setEditingWhale({ ...editingWhale, stop_loss_override: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', color: 'var(--accent-rose)', fontSize: '12px', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Kar Al (Take Profit %):</label>
                  <input
                    type="number"
                    step="5"
                    value={editingWhale.take_profit_override}
                    onChange={(e) => setEditingWhale({ ...editingWhale, take_profit_override: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', color: 'var(--accent-emerald)', fontSize: '12px', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', background: 'var(--bg-app)', padding: '8px 10px', borderRadius: '4px' }}>
                <input
                  type="checkbox"
                  id="antidump"
                  checked={editingWhale.auto_sell_on_dump}
                  onChange={(e) => setEditingWhale({ ...editingWhale, auto_sell_on_dump: e.target.checked })}
                />
                <label htmlFor="antidump" style={{ fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Balina tokenı sattığı an otomatik olarak pozisyonu kapat (Anti-Dump Koruması)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingWhale(null)} className="btn-action-secondary" style={{ flex: 1, padding: '8px' }}>
                  İptal
                </button>
                <button type="submit" className="btn-action-primary" style={{ flex: 2, padding: '8px' }}>
                  Kopyalamayı Başlat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
