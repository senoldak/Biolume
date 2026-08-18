import React from 'react';
import { Layers, AlertOctagon, XCircle, ExternalLink } from 'lucide-react';
import { formatPrice, formatPct, formatSOL } from '../utils/formatters';
import { translations } from '../utils/translations';

export default function PositionCard({ positions, walletInfo, availableStrategies, activeStrategy, handlePanicCloseAll, handleClosePosition, lang = 'tr' }) {
  const t = translations[lang] || translations.tr;
  const pDict = t.positions || {};

  const openPositions = positions
    .filter(p => p.status === 'OPEN')
    .sort((a, b) => (a.id || '').localeCompare(b.id || ''));

  return (
    <div className="terminal-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} color="var(--accent-amber)" />
          <h3 style={{ fontSize: '14px', fontWeight: 700 }}>
            {pDict.open_positions || 'Open Autopilot Positions'}
          </h3>
          <span className="badge badge-amber font-mono">
            {openPositions.length} {lang === 'tr' ? 'AKTİF' : 'ACTIVE'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {pDict.allocated || 'Allocated'}: {(openPositions.length * 0.2).toFixed(2)} SOL &bull; {pDict.free || 'Free'}: {(walletInfo.balance_sol || 0).toFixed(2)} SOL
          </span>

          {openPositions.length > 0 && (
            <button
              onClick={handlePanicCloseAll}
              className="btn-action-danger"
              style={{ padding: '5px 10px', fontSize: '11px' }}
            >
              <AlertOctagon size={13} />
              <span>{t.buttons?.panic_close || 'Panic Close All (Market)'}</span>
            </button>
          )}
        </div>
      </div>

      {openPositions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
          {pDict.no_positions || 'No active open positions. Radar scanner and autopilot will populate entries here.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
          {openPositions.map((pos, idx) => {
            const pnlPct = pos.pnl_pct || 0;
            const pnlSol = pos.pnl_sol || 0;
            const isProfit = pnlPct >= 0;

            return (
              <div 
                key={pos.id || pos.token_address || idx} 
                className="terminal-card-elevated"
                style={{
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="font-mono" style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                        {pos.symbol}
                      </span>
                      <a 
                        href={`https://gmgn.ai/sol/token/${pos.token_address}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ color: 'var(--text-muted)', display: 'inline-flex' }}
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      {pos.token_address ? `${pos.token_address.slice(0, 6)}...${pos.token_address.slice(-4)}` : ''}
                    </span>
                  </div>

                  <div className={`badge ${isProfit ? 'badge-emerald' : 'badge-rose'} font-mono`} style={{ fontSize: '12px', padding: '3px 8px' }}>
                    {formatPct(pnlPct)}
                  </div>
                </div>

                {/* Price Matrix */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', background: 'var(--bg-app)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{pDict.entry || 'Entry'}</div>
                    <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      ${formatPrice(pos.entry_price_usd)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{pDict.peak || 'Peak (ATH)'}</div>
                    <div className="font-mono" style={{ fontSize: '11px', color: 'var(--accent-amber)', fontWeight: 600 }}>
                      ${formatPrice(pos.highest_price_usd || pos.entry_price_usd)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{pDict.current || 'Current'}</div>
                    <div className="font-mono" style={{ fontSize: '11px', color: isProfit ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 600 }}>
                      ${formatPrice(pos.current_price_usd || pos.entry_price_usd)}
                    </div>
                  </div>
                </div>

                {/* Trailing & Partial Indicators */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {pos.partial_tp_effected && (
                    <span className="badge badge-emerald font-mono" style={{ fontSize: '9px', padding: '1px 5px' }}>
                      50% {pDict.tp_secured || 'TP SECURED'} (+{formatSOL(pos.realized_pnl_sol || 0, 4)} SOL)
                    </span>
                  )}
                  {pos.trailing_stop_target > 0 && (
                    <span className="badge badge-sky font-mono" style={{ fontSize: '9px', padding: '1px 5px' }}>
                      TRAIL STOP: ${formatPrice(pos.trailing_stop_target)}
                    </span>
                  )}
                  <span className="badge badge-subtle font-mono" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    SIZE: {formatSOL(pos.amount_sol || 0.2, 2)} SOL
                  </span>
                </div>

                {/* Profit Breakdown and Manual Exit */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: isProfit ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {isProfit ? `+${formatSOL(pnlSol, 4)}` : formatSOL(pnlSol, 4)} SOL
                  </div>

                  <button
                    onClick={() => handleClosePosition(pos.id)}
                    className="btn-action-secondary"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                  >
                    <XCircle size={12} />
                    <span>{pDict.close_position || 'Close Position'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
