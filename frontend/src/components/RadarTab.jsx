import React, { useState, useMemo } from 'react';
import { 
  Radio, 
  Search, 
  ExternalLink, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Filter,
  ArrowUpRight,
  Flame
} from 'lucide-react';
import { formatPrice } from '../utils/formatters';
import { soundManager } from '../utils/audioAlerts';

export default function RadarTab({ radarTokens, handleQuickBuy }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [minLiquidity, setMinLiquidity] = useState('0');
  const [onlySafe, setOnlySafe] = useState(false);
  const [hideBundled, setHideBundled] = useState(false);
  const [onlySurging, setOnlySurging] = useState(false);
  const [onlyGraduating, setOnlyGraduating] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(!soundManager.getMuted());

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    soundManager.setMuted(!nextState);
  };

  const filteredTokens = useMemo(() => {
    return radarTokens.filter(token => {
      const matchesSearch = searchTerm === '' ||
        (token.symbol && token.symbol.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (token.token_address && token.token_address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (token.name && token.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesLiq = (token.liquidity_usd || 0) >= parseFloat(minLiquidity || 0);
      const matchesSafe = !onlySafe || token.is_safe;
      const matchesBundled = !hideBundled || (!token.is_bundled && (token.bundled_ratio || 0) < 0.20);
      const matchesSurge = !onlySurging || token.is_surging;
      const matchesGrad = !onlyGraduating || token.is_graduating;

      return matchesSearch && matchesLiq && matchesSafe && matchesBundled && matchesSurge && matchesGrad;
    });
  }, [radarTokens, searchTerm, minLiquidity, onlySafe, hideBundled, onlySurging, onlyGraduating]);

  return (
    <div className="terminal-card" style={{ padding: '20px' }}>
      {/* Header & Filter Controls Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={16} color="var(--accent-emerald)" />
            <h2 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>
              Live Liquidity & Smart Money Radar
            </h2>
            <span className="badge badge-emerald font-mono">
              <span className="live-dot live-dot-pulse" style={{ width: '5px', height: '5px' }} />
              STREAMING
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Direct Solana token pairs verified with mint & freeze security parameters
          </p>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px' }} />
            <input
              type="text"
              placeholder="Filter by symbol / mint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '6px 12px 6px 30px',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
                width: '210px',
                transition: 'border-color 0.15s ease'
              }}
            />
          </div>

          {/* Min Liquidity Selector */}
          <select
            value={minLiquidity}
            onChange={(e) => setMinLiquidity(e.target.value)}
            style={{
              padding: '6px 10px',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="0">All Liquidity</option>
            <option value="1000">&gt; $1,000 Liq</option>
            <option value="5000">&gt; $5,000 Liq</option>
            <option value="15000">&gt; $15,000 Liq</option>
          </select>

          {/* Safe Only Filter Button */}
          <button
            onClick={() => setOnlySafe(!onlySafe)}
            style={{
              padding: '6px 11px',
              background: onlySafe ? 'var(--accent-emerald-subtle)' : 'var(--bg-app)',
              border: `1px solid ${onlySafe ? 'var(--accent-emerald-border)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-sm)',
              color: onlySafe ? 'var(--accent-emerald)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease'
            }}
          >
            <ShieldCheck size={14} />
            <span>Verified Safe</span>
          </button>

          {/* Anti-Bundle Filter */}
          <button
            onClick={() => setHideBundled(!hideBundled)}
            style={{
              padding: '6px 11px',
              background: hideBundled ? 'var(--accent-rose-subtle)' : 'var(--bg-app)',
              border: `1px solid ${hideBundled ? 'var(--accent-rose-border)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-sm)',
              color: hideBundled ? 'var(--accent-rose)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease'
            }}
          >
            <Filter size={13} />
            <span>Filter Bundles</span>
          </button>

          {/* Volume Surge Momentum Filter */}
          <button
            onClick={() => setOnlySurging(!onlySurging)}
            style={{
              padding: '6px 11px',
              background: onlySurging ? 'var(--accent-amber-subtle)' : 'var(--bg-app)',
              border: `1px solid ${onlySurging ? 'var(--accent-amber-border)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-sm)',
              color: onlySurging ? 'var(--accent-amber)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease'
            }}
          >
            <Flame size={13} color="var(--accent-amber)" />
            <span>Vol Surge</span>
          </button>

          {/* Raydium Graduation Target Filter */}
          <button
            onClick={() => setOnlyGraduating(!onlyGraduating)}
            style={{
              padding: '6px 11px',
              background: onlyGraduating ? 'var(--accent-cyan-subtle)' : 'var(--bg-app)',
              border: `1px solid ${onlyGraduating ? 'var(--accent-cyan-border)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-sm)',
              color: onlyGraduating ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease'
            }}
          >
            <Zap size={13} color="var(--accent-cyan)" />
            <span>90%+ Graduation</span>
          </button>

          {/* Audio Alerts Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Audio Alerts: Active' : 'Audio Alerts: Muted'}
            style={{
              padding: '6px 9px',
              background: 'var(--bg-app)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: soundEnabled ? 'var(--accent-amber)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>

      {/* Main Radar Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '11px', letterSpacing: '0.04em' }}>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>PAIR / TOKEN</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>UNIT PRICE</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>MARKET CAP</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>POOL LIQUIDITY</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>SMART MONEY</th>
              <th style={{ padding: '10px 12px', fontWeight: 600 }}>SECURITY AUDIT</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>EXECUTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredTokens.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  {radarTokens.length === 0 ? "Connecting to Solana on-chain stream..." : "No tokens matching current filters."}
                </td>
              </tr>
            ) : (
              filteredTokens.map((token, idx) => (
                <tr 
                  key={token.token_address || idx} 
                  style={{ 
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 0.12s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Token Identity */}
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                        {token.symbol}
                      </span>
                      <a 
                        href={`https://gmgn.ai/sol/token/${token.token_address}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ color: 'var(--text-muted)', display: 'inline-flex' }}
                        title="View on GMGN"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {token.name}
                    </div>
                  </td>

                  {/* Price */}
                  <td className="font-mono" style={{ padding: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                    ${formatPrice(token.price_usd)}
                  </td>

                  {/* Market Cap */}
                  <td className="font-mono" style={{ padding: '12px', color: 'var(--text-primary)' }}>
                    ${(token.market_cap || 0).toLocaleString()}
                  </td>

                  {/* Liquidity */}
                  <td className="font-mono" style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                    ${(token.liquidity_usd || 0).toLocaleString()}
                  </td>

                  {/* Smart Money Inflow */}
                  <td style={{ padding: '12px' }}>
                    <span className="badge badge-violet font-mono">
                      <TrendingUp size={12} />
                      {token.smart_money_buyers} Buyers
                    </span>
                  </td>

                  {/* Security Analysis */}
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {token.is_safe ? (
                        <ShieldCheck size={15} color="var(--accent-emerald)" />
                      ) : (
                        <AlertTriangle size={15} color="var(--accent-rose)" />
                      )}
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        color: token.is_safe ? 'var(--accent-emerald)' : 'var(--accent-rose)' 
                      }}>
                        {token.is_safe ? 'Pass' : 'Risk'} ({100 - (token.risk_score || 0)}/100)
                      </span>
                    </div>

                    {token.is_bundled && (
                      <div className="badge badge-rose" style={{ marginTop: '4px', fontSize: '10px' }}>
                        Bundled Snipe {Math.round((token.bundled_ratio || 0.35) * 100)}%
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {token.is_surging && (
                        <span className="badge badge-amber font-mono" style={{ fontSize: '9px', padding: '1px 5px' }}>
                          ⚡ SURGE 2.8x
                        </span>
                      )}
                      {token.is_graduating && (
                        <span className="badge badge-cyan font-mono" style={{ fontSize: '9px', padding: '1px 5px' }}>
                          🎓 GRADUATING
                        </span>
                      )}
                    </div>

                    {token.bonding_curve_progress && (
                      <div style={{ fontSize: '11px', color: 'var(--accent-amber)', marginTop: '2px', fontFamily: 'monospace' }}>
                        Curve: {Math.round(token.bonding_curve_progress * 100)}%
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <a 
                        href={`https://dexscreener.com/solana/${token.token_address}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn-action-secondary"
                        style={{ padding: '5px 9px', fontSize: '11px' }}
                      >
                        <span>Chart</span>
                        <ArrowUpRight size={12} />
                      </a>
                      <button 
                        onClick={() => handleQuickBuy(token)}
                        className="btn-action-primary"
                        style={{ padding: '5px 11px', fontSize: '11px' }}
                      >
                        <Zap size={13} />
                        <span>Buy</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
