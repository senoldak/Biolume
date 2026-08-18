import React from 'react';
import { History, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatPrice, formatSOL, formatPct } from '../utils/formatters';

export default function TradeHistory({ tradeHistory }) {
  return (
    <div className="terminal-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={16} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Closed Trade History</h3>
        </div>
        <span className="badge badge-muted font-mono">
          {tradeHistory.length} TRADES
        </span>
      </div>

      <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {tradeHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
            No closed trades recorded yet. Completed TP/SL executions will archive here.
          </div>
        ) : (
          tradeHistory.map((t, idx) => {
            const isProfit = (t.pnl_sol || 0) >= 0;
            let badgeClass = 'badge-rose';
            let badgeLabel = 'STOP LOSS';

            if (t.status === 'CLOSED_PROFIT') {
              badgeClass = 'badge-emerald';
              badgeLabel = 'TAKE PROFIT';
            } else if (t.status === 'CLOSED_MANUAL') {
              badgeClass = 'badge-amber';
              badgeLabel = 'MANUAL CLOSE';
            }

            return (
              <div 
                key={idx} 
                className="terminal-card-elevated"
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="font-mono" style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                      {t.symbol}
                    </span>
                    <span className={`badge ${badgeClass}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                      {badgeLabel}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    Entry: ${formatPrice(t.entry_price_usd)} &rarr; Exit: ${formatPrice(t.exit_price_usd)}
                  </div>
                </div>

                <div className="font-mono" style={{ textAlign: 'right' }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: isProfit ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                  }}>
                    {isProfit ? `+${formatSOL(t.pnl_sol, 4)}` : formatSOL(t.pnl_sol, 4)} SOL
                  </div>
                  <div style={{ fontSize: '11px', color: isProfit ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {formatPct(t.pnl_pct, 2)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
