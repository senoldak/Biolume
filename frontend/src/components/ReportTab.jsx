import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Trophy, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle, 
  ArrowUpRight, 
  Activity, 
  Sparkles, 
  Zap, 
  Crosshair, 
  Shield, 
  BarChart2, 
  Clock, 
  Layers 
} from 'lucide-react';
import { formatSOL, formatPrice } from '../utils/formatters';

export default function ReportTab({ onSelectStrategy, lang = 'tr' }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchReport = () => {
    setLoading(true);
    fetch("/api/arena/report")
      .then(res => res.json())
      .then(data => {
        setReport(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExportJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Biolume_Backtest_Report_${report.report_id || Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyChampion = (strategyId) => {
    if (onSelectStrategy) {
      onSelectStrategy(strategyId);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (loading && !report) {
    return (
      <div className="terminal-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Activity size={32} color="var(--accent-emerald)" className="spin" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Synthesizing Backtest Audit & Executive Analytics...</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Aggregating trade execution telemetry, expectancy matrices, and drawdown curves.
        </p>
      </div>
    );
  }

  const champ = report?.champion;
  const scorecards = report?.scorecards || [];
  const topWinners = report?.top_winners || [];
  const topLosers = report?.top_losers || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div className="terminal-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.2)'
            }}>
              <FileText size={24} color="var(--accent-emerald)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  Institutional Strategy Assessment & Backtest Report
                </h2>
                <span className="badge badge-emerald font-mono" style={{ fontSize: '10px' }}>
                  AUDIT ID: {report?.report_id || 'ACTIVE'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Generated at {report?.generated_at} • Evaluation Window: {report?.simulation_duration} • {report?.total_tokens_analyzed} On-Chain Pairs Ingested
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={fetchReport}
              className="btn-action-secondary"
              style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} />
              <span>Refresh Audit</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="btn-action-primary"
              style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={14} />
              <span>Export JSON Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Champion Strategy Spotlight Hero Card */}
      {champ && (
        <div className="terminal-card" style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(16, 185, 129, 0.08))',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(234, 179, 8, 0.15)',
                border: '2px solid #eab308',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(234, 179, 8, 0.3)'
              }}>
                <Trophy size={26} color="#eab308" />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-amber font-mono" style={{ fontSize: '10px', fontWeight: 800 }}>
                    #1 BACKTEST CHAMPION
                  </span>
                  <span className="badge badge-emerald font-mono" style={{ fontSize: '10px' }}>
                    {champ.live_readiness}
                  </span>
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {champ.name}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '650px' }}>
                  {champ.key_advantage}
                </p>
              </div>
            </div>

            {/* Quick Champion Metrics & Deploy Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Net ROI Achieved</span>
                <div className="font-mono" style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: champ.net_profit_pct >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                }}>
                  {champ.net_profit_pct >= 0 ? `+${champ.net_profit_pct.toFixed(2)}%` : `${champ.net_profit_pct.toFixed(2)}%`}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  Profit Factor: {champ.profit_factor.toFixed(2)}x &bull; Win Rate: {champ.win_rate.toFixed(1)}%
                </div>
              </div>

              <button
                onClick={() => handleApplyChampion(champ.strategy_id)}
                className="btn-action-primary"
                style={{
                  padding: '10px 18px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 16px rgba(16, 185, 129, 0.3)'
                }}
              >
                {copied ? <CheckCircle size={15} /> : <Sparkles size={15} />}
                <span>{copied ? 'Applied to Live Autopilot!' : 'Apply Champion to Live Autopilot'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Key Institutional Portfolio KPI Ribbons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        <div className="terminal-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Overall Profit Factor
          </span>
          <div className="font-mono" style={{ fontSize: '22px', fontWeight: 800, marginTop: '6px', color: 'var(--accent-emerald)' }}>
            {(report?.overall_profit_factor || 1.0).toFixed(2)}x
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Gross Gains vs Gross Drawdowns
          </div>
        </div>

        <div className="terminal-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Tournament Max Drawdown
          </span>
          <div className="font-mono" style={{ fontSize: '22px', fontWeight: 800, marginTop: '6px', color: 'var(--accent-amber)' }}>
            -{(report?.max_drawdown_pct || 0).toFixed(2)}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Peak-to-Trough Portfolio Retracement
          </div>
        </div>

        <div className="terminal-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Executed Orders
          </span>
          <div className="font-mono" style={{ fontSize: '22px', fontWeight: 800, marginTop: '6px', color: 'var(--accent-cyan)' }}>
            {report?.total_orders_executed || 0} Orders
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Across all 12 concurrent strategies
          </div>
        </div>

        <div className="terminal-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Cumulative SOL Net Realized
          </span>
          <div className="font-mono" style={{
            fontSize: '22px',
            fontWeight: 800,
            marginTop: '6px',
            color: (report?.cumulative_profit_sol || 0) >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'
          }}>
            {(report?.cumulative_profit_sol || 0) >= 0 ? `+${formatSOL(report?.cumulative_profit_sol || 0, 4)}` : formatSOL(report?.cumulative_profit_sol || 0, 4)} SOL
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Net realized after fees & slippage
          </div>
        </div>
      </div>

      {/* 3. 12-Strategy Deep Diagnostic & Scorecard Matrix */}
      <div className="terminal-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '14px', fontWeight: 800 }}>12-Strategy Performance Scorecards & Viability Index</h3>
          </div>
          <span className="badge badge-muted font-mono" style={{ fontSize: '10px' }}>
            Institutional Viability Model (0 - 100 Score)
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '14px'
        }}>
          {scorecards.map((card) => {
            const isProfit = card.net_profit_pct >= 0;
            const scoreColor = card.viability_score >= 75 ? 'var(--accent-emerald)' : (card.viability_score >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)');

            return (
              <div
                key={card.strategy_id}
                style={{
                  background: 'var(--bg-app)',
                  border: `1px solid ${card.rank === 1 ? 'rgba(234, 179, 8, 0.4)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: card.color || 'var(--accent-emerald)',
                      boxShadow: `0 0 6px ${card.color}`
                    }} />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      #{card.rank} {card.name}
                    </span>
                  </div>

                  <div style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    fontFamily: 'JetBrains Mono',
                    color: scoreColor,
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    SCORE: {card.viability_score}/100
                  </div>
                </div>

                {/* Metrics Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.015)',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Net ROI %</div>
                    <div className="font-mono" style={{ fontSize: '13px', fontWeight: 800, color: isProfit ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                      {isProfit ? `+${card.net_profit_pct.toFixed(2)}%` : `${card.net_profit_pct.toFixed(2)}%`}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Win Rate</div>
                    <div className="font-mono" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                      {card.win_rate.toFixed(1)}% ({card.winning_trades}W / {card.losing_trades}L)
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Profit Factor</div>
                    <div className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {card.profit_factor.toFixed(2)}x
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Max Drawdown</div>
                    <div className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-amber)' }}>
                      -{card.max_drawdown_pct.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Recommendation Tag */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Verdict:</span>
                  <span style={{
                    fontWeight: 700,
                    color: card.viability_score >= 75 ? 'var(--accent-emerald)' : 'var(--accent-secondary)'
                  }}>
                    {card.recommendation}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Top Winners & Losers Trade Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Top Winners */}
        <div className="terminal-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="var(--accent-emerald)" />
              <h3 style={{ fontSize: '14px', fontWeight: 800 }}>Hall of Fame (Top Standout Winners)</h3>
            </div>
            <span className="badge badge-emerald font-mono" style={{ fontSize: '10px' }}>
              Max PnL
            </span>
          </div>

          {topWinners.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-dim)', fontSize: '12px' }}>
              No winning trades recorded yet in this simulation.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topWinners.map((tr, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="font-mono" style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>
                        ${tr.symbol}
                      </span>
                      <span className="badge badge-subtle font-mono" style={{ fontSize: '9px' }}>
                        {tr.strategy_name}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                      Exit Reason: {tr.reason} &bull; Hold: {tr.holding_time_sec}s
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div className="font-mono" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                      +{tr.pnl_pct.toFixed(1)}%
                    </div>
                    <div className="font-mono" style={{ fontSize: '10px', color: 'var(--accent-emerald)' }}>
                      +{formatSOL(tr.pnl_sol, 4)} SOL
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Losers */}
        <div className="terminal-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingDown size={16} color="var(--accent-rose)" />
              <h3 style={{ fontSize: '14px', fontWeight: 800 }}>Risk Interceptions (Managed Stop-Losses)</h3>
            </div>
            <span className="badge badge-rose font-mono" style={{ fontSize: '10px' }}>
              Capital Preserved
            </span>
          </div>

          {topLosers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-dim)', fontSize: '12px' }}>
              No losing trades recorded yet in this simulation.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topLosers.map((tr, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="font-mono" style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>
                        ${tr.symbol}
                      </span>
                      <span className="badge badge-subtle font-mono" style={{ fontSize: '9px' }}>
                        {tr.strategy_name}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                      Exit Reason: {tr.reason} &bull; Hold: {tr.holding_time_sec}s
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div className="font-mono" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-rose)' }}>
                      {tr.pnl_pct.toFixed(1)}%
                    </div>
                    <div className="font-mono" style={{ fontSize: '10px', color: 'var(--accent-rose)' }}>
                      {formatSOL(tr.pnl_sol, 4)} SOL
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
