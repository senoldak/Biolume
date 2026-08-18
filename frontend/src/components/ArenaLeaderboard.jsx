import React from 'react';
import { Trophy, Award, Medal, TrendingUp, TrendingDown, Target, Shield, Zap } from 'lucide-react';
import { formatSOL } from '../utils/formatters';

export default function ArenaLeaderboard({ bots = [] }) {
  const botCount = bots.length || 16;
  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(234, 179, 8, 0.15)',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          borderRadius: '4px',
          padding: '2px 6px',
          color: '#eab308',
          fontWeight: 800,
          fontSize: '11px'
        }}>
          <Trophy size={13} color="#eab308" />
          <span>#1 GOLD</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(148, 163, 184, 0.15)',
          border: '1px solid rgba(148, 163, 184, 0.4)',
          borderRadius: '4px',
          padding: '2px 6px',
          color: '#cbd5e1',
          fontWeight: 700,
          fontSize: '11px'
        }}>
          <Award size={13} color="#cbd5e1" />
          <span>#2 SILVER</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(217, 119, 6, 0.15)',
          border: '1px solid rgba(217, 119, 6, 0.4)',
          borderRadius: '4px',
          padding: '2px 6px',
          color: '#d97706',
          fontWeight: 700,
          fontSize: '11px'
        }}>
          <Medal size={13} color="#d97706" />
          <span>#3 BRONZE</span>
        </div>
      );
    }
    return (
      <span className="font-mono" style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px' }}>
        #{rank}
      </span>
    );
  };

  return (
    <div className="terminal-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={16} color="var(--accent-amber)" />
          <h3 style={{ fontSize: '14px', fontWeight: 800 }}>{botCount}-Bot Real-Time Tournament Leaderboard</h3>
        </div>
        <span className="badge badge-muted font-mono" style={{ fontSize: '11px' }}>
          Sorted by Net ROI %
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '8px 10px', width: '90px' }}>Rank</th>
              <th style={{ padding: '8px 10px' }}>Strategy Profile</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Bankroll (SOL)</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Net Profit (SOL)</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Net ROI %</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Win Rate</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Trades (W/L)</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Open</th>
            </tr>
          </thead>
          <tbody>
            {bots.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                  Arena leaderboard initializing... Start simulation to populate rankings.
                </td>
              </tr>
            ) : (
              bots.map((bot) => {
                const isPositive = bot.net_profit_sol >= 0;
                const roiColor = isPositive ? 'var(--accent-emerald)' : 'var(--accent-rose)';

                return (
                  <tr
                    key={bot.strategy_id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s ease',
                      background: bot.current_rank === 1 ? 'rgba(234, 179, 8, 0.03)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '10px' }}>
                      {getRankBadge(bot.current_rank)}
                    </td>

                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: bot.color || 'var(--accent-emerald)',
                          boxShadow: `0 0 6px ${bot.color}`
                        }} />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {bot.name}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            TP +{bot.profile.take_profit_pct}% / SL {bot.profile.stop_loss_pct}% / Trail -{bot.profile.trailing_stop_pct || 0}%
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="font-mono" style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>
                      {bot.balance_sol ? bot.balance_sol.toFixed(3) : '10.000'} SOL
                    </td>

                    <td className="font-mono" style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: roiColor }}>
                      {isPositive ? `+${bot.net_profit_sol.toFixed(4)}` : bot.net_profit_sol.toFixed(4)} SOL
                    </td>

                    <td className="font-mono" style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: roiColor }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span>{isPositive ? `+${bot.net_profit_pct.toFixed(2)}` : bot.net_profit_pct.toFixed(2)}%</span>
                      </div>
                    </td>

                    <td className="font-mono" style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {bot.win_rate ? bot.win_rate.toFixed(1) : '0.0'}%
                    </td>

                    <td className="font-mono" style={{ padding: '10px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--accent-emerald)' }}>{bot.winning_trades}W</span> / <span style={{ color: 'var(--accent-rose)' }}>{bot.losing_trades}L</span> ({bot.total_trades})
                    </td>

                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span className={`badge ${bot.open_positions?.length > 0 ? 'badge-cyan' : 'badge-muted'}`} style={{ fontSize: '10px' }}>
                        {bot.open_positions?.length || 0}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
