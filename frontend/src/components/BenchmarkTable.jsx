import React from 'react';
import { BarChart3, TrendingUp, Check, ArrowRight } from 'lucide-react';
import { formatSOL } from '../utils/formatters';

export default function BenchmarkTable({ availableStrategies, strategyBenchmarks, activeStrategy, selectStrategy }) {
  const strategies = availableStrategies.length > 0 ? availableStrategies : [
    { id: 'scalper', name: 'Micro-Scalper', tagline: '+5% TP / -3% SL Rapid In-Out', take_profit_pct: 5.0, stop_loss_pct: -3.0, color: 'var(--accent-sky)' },
    { id: 'trend', name: 'Trend Runner', tagline: 'Momentum Breakout Sniper (+50%)', take_profit_pct: 50.0, stop_loss_pct: -20.0, color: 'var(--accent-emerald)' },
    { id: 'moonshot', name: 'Moonshot Degen', tagline: 'Early Bonding Curve Hunter', take_profit_pct: 150.0, stop_loss_pct: -30.0, color: 'var(--accent-violet)' },
    { id: 'whale_shadow', name: 'Whale Shadow', tagline: 'Multi-Whale Copy Tracker', take_profit_pct: 25.0, stop_loss_pct: -10.0, color: 'var(--accent-cyan)' },
    { id: 'ultra_safe', name: 'Fortress Guard', tagline: 'Maximum Security Filter', take_profit_pct: 10.0, stop_loss_pct: -5.0, color: 'var(--accent-amber)' },
    { id: 'breakout', name: 'Breakout Velocity', tagline: 'Volume Surge Detector', take_profit_pct: 35.0, stop_loss_pct: -15.0, color: 'var(--accent-rose)' },
  ];

  return (
    <div className="terminal-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={16} color="var(--accent-violet)" />
          <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Strategy Performance Matrix</h3>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Autonomous Backtest & Live Execution Comparison
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '11px', letterSpacing: '0.04em' }}>
              <th style={{ padding: '10px 8px', fontWeight: 600 }}>STRATEGY PROFILE</th>
              <th style={{ padding: '10px 8px', fontWeight: 600 }}>TARGET BRACKET</th>
              <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600 }}>TOTAL EXECUTIONS</th>
              <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600 }}>WIN / LOSS</th>
              <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600 }}>WIN RATE</th>
              <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600 }}>NET PnL (SOL)</th>
              <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600 }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {strategies.map((strat, idx) => {
              const bm = strategyBenchmarks[strat.id] || { total_trades: 0, winning_trades: 0, losing_trades: 0, win_rate: 0, total_pnl_sol: 0 };
              const isCurrent = activeStrategy === strat.id;

              return (
                <tr 
                  key={idx} 
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isCurrent ? 'var(--accent-emerald-subtle)' : 'transparent',
                    transition: 'background 0.12s ease'
                  }}
                >
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {strat.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {strat.tagline}
                    </div>
                  </td>

                  <td className="font-mono" style={{ padding: '12px 8px' }}>
                    <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>+{strat.take_profit_pct}%</span>
                    <span style={{ color: 'var(--text-dim)', margin: '0 4px' }}>/</span>
                    <span style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>{strat.stop_loss_pct}%</span>
                  </td>

                  <td className="font-mono" style={{ padding: '12px 8px', textAlign: 'center' }}>
                    {bm.total_trades}
                  </td>

                  <td className="font-mono" style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <span style={{ color: 'var(--accent-emerald)' }}>{bm.winning_trades}W</span>
                    <span style={{ color: 'var(--text-dim)', margin: '0 4px' }}>-</span>
                    <span style={{ color: 'var(--accent-rose)' }}>{bm.losing_trades}L</span>
                  </td>

                  <td className="font-mono" style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: bm.win_rate >= 50 ? 'var(--accent-emerald)' : 'var(--text-secondary)' }}>
                    {bm.win_rate.toFixed(1)}%
                  </td>

                  <td className="font-mono" style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: bm.total_pnl_sol >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {bm.total_pnl_sol >= 0 ? `+${formatSOL(bm.total_pnl_sol, 3)}` : formatSOL(bm.total_pnl_sol, 3)} SOL
                  </td>

                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                    {isCurrent ? (
                      <span className="badge badge-emerald font-mono" style={{ fontSize: '10px' }}>
                        ACTIVE
                      </span>
                    ) : (
                      <button
                        onClick={() => selectStrategy(strat.id)}
                        className="btn-action-secondary"
                        style={{ padding: '3px 8px', fontSize: '10px' }}
                      >
                        <span>Select</span>
                        <ArrowRight size={10} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
