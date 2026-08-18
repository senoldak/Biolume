import React from 'react';
import { Target, Activity, ShieldCheck, Zap, ArrowUpRight } from 'lucide-react';
import { formatSOL, formatPrice } from '../utils/formatters';

export default function ArenaPositions({ bots = [] }) {
  const botCount = bots.length || 16;
  // Aggregate all open positions across all bots
  const allOpenPositions = [];
  bots.forEach(bot => {
    if (bot.open_positions && bot.open_positions.length > 0) {
      bot.open_positions.forEach(pos => {
        allOpenPositions.push({
          ...pos,
          botName: bot.name,
          botColor: bot.color,
          botRank: bot.current_rank
        });
      });
    }
  });

  return (
    <div className="terminal-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={16} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '14px', fontWeight: 800 }}>Simulated Open Positions Across All {botCount} Bots</h3>
        </div>
        <span className="badge badge-cyan font-mono" style={{ fontSize: '11px' }}>
          {allOpenPositions.length} Total Open In Arena
        </span>
      </div>

      {allOpenPositions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-dim)', fontSize: '12px' }}>
          No active positions in the arena. Bots will automatically execute simulated snipes on radar signals.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px'
        }}>
          {allOpenPositions.map(pos => {
            const isProfit = pos.pnl_pct >= 0;
            const pnlColor = isProfit ? 'var(--accent-emerald)' : 'var(--accent-rose)';

            return (
              <div
                key={pos.id}
                style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  position: 'relative'
                }}
              >
                {/* Bot Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: pos.botColor || 'var(--accent-emerald)',
                      boxShadow: `0 0 6px ${pos.botColor}`
                    }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      #{pos.botRank} {pos.botName}
                    </span>
                  </div>

                  <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    0.20 SOL
                  </span>
                </div>

                {/* Token & Price */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      ${pos.symbol}
                    </h4>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                      Entry: ${formatPrice(pos.entry_price_usd)}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div className="font-mono" style={{ fontSize: '14px', fontWeight: 800, color: pnlColor }}>
                      {isProfit ? `+${pos.pnl_pct.toFixed(1)}%` : `${pos.pnl_pct.toFixed(1)}%`}
                    </div>
                    <div className="font-mono" style={{ fontSize: '10px', color: pnlColor }}>
                      {isProfit ? `+${pos.pnl_sol.toFixed(4)}` : pos.pnl_sol.toFixed(4)} SOL
                    </div>
                  </div>
                </div>

                {/* Trailing & DCA Badges */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '9px', marginTop: '6px' }}>
                  {pos.highest_price_usd > pos.entry_price_usd && (
                    <span className="badge badge-muted" style={{ padding: '1px 5px' }}>
                      ATH: ${formatPrice(pos.highest_price_usd)}
                    </span>
                  )}
                  {pos.partial_tp_effected && (
                    <span className="badge badge-emerald" style={{ padding: '1px 5px' }}>
                      50% DCA Realized
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
