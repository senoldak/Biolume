import React from 'react';
import { Play, Square, RotateCcw, Swords, Trophy, Activity, Flame, ShieldAlert, Sparkles, Terminal } from 'lucide-react';
import ArenaChart from './ArenaChart';
import ArenaLeaderboard from './ArenaLeaderboard';
import ArenaPositions from './ArenaPositions';
import { formatSOL } from '../utils/formatters';

export default function ArenaTab({
  arenaState,
  onStartArena,
  onStopArena,
  onResetArena,
  lang = 'tr'
}) {
  const isRunning = arenaState?.is_running || false;
  const bots = arenaState?.bots || [];
  const leader = bots[0] || null;
  const totalScanned = arenaState?.total_scanned || 0;
  const totalTrades = arenaState?.total_trades || 0;
  const recentEvents = arenaState?.recent_events || [];

  const botCount = bots.length || 16;

  // Calculate cumulative profit across all bots
  const totalCumulativeProfitSOL = bots.reduce((acc, b) => acc + (b.net_profit_sol || 0), 0);
  const avgWinRate = bots.length > 0 
    ? (bots.reduce((acc, b) => acc + (b.win_rate || 0), 0) / bots.length).toFixed(1)
    : '0.0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Arena Master Control Header Card */}
      <div className="terminal-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2))',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(6, 182, 212, 0.2)'
            }}>
              <Swords size={24} color="var(--accent-cyan)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  Multi-Bot Simulation Arena & Backtest Lab
                </h2>
                <span className={`badge ${isRunning ? 'badge-emerald' : 'badge-muted'}`} style={{ fontSize: '10px' }}>
                  {isRunning ? '● LIVE TOURNAMENT ACTIVE' : '○ SIMULATION PAUSED'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Run all {botCount} autonomous strategy bots concurrently against live Solana token stream • 10.0 SOL virtual bankroll per bot.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onResetArena}
              className="btn-action-secondary"
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RotateCcw size={14} />
              <span>Reset {botCount} Wallets (10 SOL)</span>
            </button>

            {isRunning ? (
              <button
                onClick={onStopArena}
                className="btn-action-primary"
                style={{
                  padding: '8px 18px',
                  fontSize: '12px',
                  background: 'var(--accent-rose)',
                  borderColor: 'var(--accent-rose)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Square size={14} />
                <span>Pause Simulation</span>
              </button>
            ) : (
              <button
                onClick={onStartArena}
                className="btn-action-primary"
                style={{
                  padding: '8px 20px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 0 16px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Play size={14} />
                <span>Start {botCount}-Bot Simulation</span>
              </button>
            )}
          </div>
        </div>

        {/* 60-Second Initial Arena Calibration / Deep Thinking Progress Banner */}
        {isRunning && arenaState?.is_warming_up && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="live-dot live-dot-pulse" style={{ background: 'var(--accent-amber)' }} />
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-amber)' }}>
                  🧠 Arena Botları 60s Piyasa Düşünme & Kalibrasyon Fazında ({Math.max(0, (arenaState?.warmup_total || 60) - (arenaState?.warmup_elapsed || 0))}s kaldı)
                </span>
              </div>
              <span className="font-mono" style={{ fontSize: '11px', color: 'var(--accent-amber)', fontWeight: 700 }}>
                {Math.round(((arenaState?.warmup_elapsed || 0) / (arenaState?.warmup_total || 60)) * 100)}%
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: '4px', background: 'var(--bg-app)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, Math.max(5, ((arenaState?.warmup_elapsed || 0) / (arenaState?.warmup_total || 60)) * 100))}%`,
                background: 'var(--accent-amber)',
                transition: 'width 1s linear'
              }} />
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Tüm {botCount} strateji botu canlı Solana token ve likidite akışını gözlemleyerek referans trend tabanını oluşturuyor. Süre bitiminde 15s onaylı simüle işlemler başlayacak.
            </span>
          </div>
        )}
      </div>

      {/* Arena Performance Ribbons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {/* Leader Bot */}
        <div className="terminal-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Tournament Leader (#1)
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <Trophy size={18} color="#eab308" />
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {leader ? leader.name : 'Waiting...'}
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 700, marginTop: '3px' }}>
            {leader ? `+${leader.net_profit_pct.toFixed(2)}% ROI (+${leader.net_profit_sol.toFixed(3)} SOL)` : '0.00% ROI'}
          </div>
        </div>

        {/* Aggregate Net SOL Profit */}
        <div className="terminal-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total {botCount}-Bot Net Profit
          </span>
          <div className="font-mono" style={{
            fontSize: '20px',
            fontWeight: 800,
            marginTop: '6px',
            color: totalCumulativeProfitSOL >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'
          }}>
            {totalCumulativeProfitSOL >= 0 ? `+${totalCumulativeProfitSOL.toFixed(4)}` : totalCumulativeProfitSOL.toFixed(4)} SOL
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Summed across all {botCount} virtual balances
          </div>
        </div>

        {/* Average Tournament Win Rate */}
        <div className="terminal-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Average Bot Win Rate
          </span>
          <div className="font-mono" style={{ fontSize: '20px', fontWeight: 800, marginTop: '6px', color: 'var(--accent-cyan)' }}>
            {avgWinRate}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Total Completed Trades: {totalTrades}
          </div>
        </div>

        {/* Tokens Evaluated */}
        <div className="terminal-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Live Tokens Ingested
          </span>
          <div className="font-mono" style={{ fontSize: '20px', fontWeight: 800, marginTop: '6px', color: 'var(--accent-violet)' }}>
            {totalScanned} Tokens
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Live Pump.fun & Raydium Stream
          </div>
        </div>
      </div>

      {/* Mega Multi-Bot Curve Chart */}
      <ArenaChart bots={bots} recentEvents={recentEvents} />

      {/* Two Column Section: Live Leaderboard + Arena Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Tournament Leaderboard */}
        <ArenaLeaderboard bots={bots} />

        {/* Live Arena Activity Console */}
        <div className="terminal-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={16} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '14px', fontWeight: 800 }}>Arena Telemetry Feed</h3>
            </div>
            <span className="badge badge-muted font-mono" style={{ fontSize: '10px' }}>
              {recentEvents.length} Events
            </span>
          </div>

          <div style={{
            background: 'var(--bg-app)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px',
            height: '400px',
            overflowY: 'auto',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            lineHeight: '1.6',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {recentEvents.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '160px' }}>
                Arena initialized. Start simulation to begin {botCount}-bot live telemetry.
              </div>
            ) : (
              recentEvents.map((evt, idx) => (
                <div key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px', color: 'var(--text-secondary)' }}>
                  {evt}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Open Positions Across All Bots */}
      <ArenaPositions bots={bots} />
    </div>
  );
}
