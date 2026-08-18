import React from 'react';
import { 
  Cpu, 
  Play, 
  Square, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Crosshair, 
  BarChart2, 
  Terminal, 
  Flame,
  Radio,
  Layers,
  Compass,
  Radar,
  Sliders,
  Plus,
  Trash2
} from 'lucide-react';
import PositionCard from './PositionCard';
import PnLChart from './PnLChart';
import BenchmarkTable from './BenchmarkTable';
import TradeHistory from './TradeHistory';
import { formatSOL } from '../utils/formatters';

const iconMap = {
  Zap,
  TrendingUp,
  Crosshair,
  BarChart2,
  ShieldCheck,
  Activity,
  Flame,
  Radio,
  Layers,
  Compass,
  Radar,
  Cpu
};

const fallbackStrategies = [
  { id: 'scalper', name: 'Micro-Scalper', tagline: '+5% TP / -3% SL Rapid Scalp', icon: 'Zap', take_profit_pct: 5.0, stop_loss_pct: -3.0, min_score: 80, min_smart_money: 2, min_liquidity: 1500, max_bonding_prog: 1.0, color: 'var(--accent-sky)', trailing_stop_pct: 1.5, partial_tp_target: 3.0 },
  { id: 'trend', name: 'Trend Runner', tagline: 'Momentum Breakout (+50% Target)', icon: 'TrendingUp', take_profit_pct: 50.0, stop_loss_pct: -20.0, min_score: 75, min_smart_money: 2, min_liquidity: 1000, max_bonding_prog: 1.0, color: 'var(--accent-emerald)', trailing_stop_pct: 8.0, partial_tp_target: 25.0 },
  { id: 'moonshot', name: 'Moonshot Degen', tagline: 'Early Curve 2x-5x Hunter', icon: 'Crosshair', take_profit_pct: 150.0, stop_loss_pct: -30.0, min_score: 65, min_smart_money: 1, min_liquidity: 300, max_bonding_prog: 0.35, color: 'var(--accent-violet)', trailing_stop_pct: 15.0, partial_tp_target: 60.0 },
  { id: 'whale_shadow', name: 'Whale Shadow', tagline: '3+ Smart Money Copy Sniper', icon: 'BarChart2', take_profit_pct: 25.0, stop_loss_pct: -10.0, min_score: 80, min_smart_money: 3, min_liquidity: 1500, max_bonding_prog: 1.0, color: 'var(--accent-cyan)', trailing_stop_pct: 5.0, partial_tp_target: 15.0 },
  { id: 'ultra_safe', name: 'Fortress Guard', tagline: 'Zero-Tolerance Steel Shield', icon: 'ShieldCheck', take_profit_pct: 10.0, stop_loss_pct: -5.0, min_score: 90, min_smart_money: 2, min_liquidity: 5000, max_bonding_prog: 1.0, color: 'var(--accent-amber)', trailing_stop_pct: 2.5, partial_tp_target: 6.0 },
  { id: 'anti_cabal', name: 'Anti-Cabal Guard', tagline: '0% Bundled / 100% Fair Launch', icon: 'ShieldCheck', take_profit_pct: 30.0, stop_loss_pct: -10.0, min_score: 85, min_smart_money: 2, min_liquidity: 1200, max_bonding_prog: 1.0, color: 'var(--accent-cyan)', trailing_stop_pct: 6.0, partial_tp_target: 18.0 },
  { id: 'cabal_momentum', name: 'Wave Rider', tagline: 'Flash Flip Snipe (+40% / -8% SL)', icon: 'Activity', take_profit_pct: 40.0, stop_loss_pct: -8.0, min_score: 60, min_smart_money: 1, min_liquidity: 800, max_bonding_prog: 0.60, color: 'var(--accent-rose)', trailing_stop_pct: 5.0, partial_tp_target: 20.0 },
  { id: 'breakout', name: 'Breakout Velocity', tagline: 'Volume & Transaction Surge', icon: 'Flame', take_profit_pct: 35.0, stop_loss_pct: -15.0, min_score: 70, min_smart_money: 2, min_liquidity: 2000, max_bonding_prog: 1.0, color: 'var(--accent-rose)', trailing_stop_pct: 7.0, partial_tp_target: 20.0 },
  { id: 'bonding_apex', name: 'Bonding Apex', tagline: 'Raydium Migration Flip (+80% TP)', icon: 'Radio', take_profit_pct: 80.0, stop_loss_pct: -25.0, min_score: 75, min_smart_money: 2, min_liquidity: 2500, max_bonding_prog: 0.95, color: 'var(--accent-violet)', trailing_stop_pct: 10.0, partial_tp_target: 40.0 },
  { id: 'liquidity_vanguard', name: 'Liquidity Vanguard', tagline: 'High-Cap Pool Defense ($10k+ Liq)', icon: 'Layers', take_profit_pct: 18.0, stop_loss_pct: -7.0, min_score: 88, min_smart_money: 3, min_liquidity: 10000, max_bonding_prog: 1.0, color: 'var(--accent-emerald)', trailing_stop_pct: 4.0, partial_tp_target: 10.0 },
  { id: 'dip_rebound', name: 'Dip Rebound Hunter', tagline: 'Post-Dump Support Bounce (+20% TP)', icon: 'Compass', take_profit_pct: 20.0, stop_loss_pct: -8.0, min_score: 80, min_smart_money: 2, min_liquidity: 1800, max_bonding_prog: 1.0, color: 'var(--accent-sky)', trailing_stop_pct: 4.0, partial_tp_target: 12.0 },
  { id: 'stealth_sniper', name: 'Stealth Block Sniper', tagline: 'Sub-Second Slot Ingestion (+45% TP)', icon: 'Radar', take_profit_pct: 45.0, stop_loss_pct: -12.0, min_score: 82, min_smart_money: 2, min_liquidity: 1500, max_bonding_prog: 0.50, color: 'var(--accent-amber)', trailing_stop_pct: 6.0, partial_tp_target: 22.0 },
  { id: 'meteora_dlmm', name: 'Meteora DLMM Farmer', tagline: 'Dynamic Fee Concentrated LP (+35% TP)', icon: 'Layers', take_profit_pct: 35.0, stop_loss_pct: -7.0, min_score: 85, min_smart_money: 3, min_liquidity: 8000, max_bonding_prog: 1.0, color: 'var(--accent-emerald)', trailing_stop_pct: 4.0, partial_tp_target: 15.0 },
  { id: 'velocity_surge', name: 'Ticker Velocity Surge', tagline: 'High Tx/Sec & Volume Wave (+70% TP)', icon: 'Zap', take_profit_pct: 70.0, stop_loss_pct: -14.0, min_score: 78, min_smart_money: 2, min_liquidity: 1500, max_bonding_prog: 0.65, color: 'var(--accent-rose)', trailing_stop_pct: 8.0, partial_tp_target: 30.0 },
  { id: 'cluster_accumulator', name: 'Smart Cluster Accumulator', tagline: 'Anti-Cabal 4+ Whale Bottom (+28% TP)', icon: 'Crosshair', take_profit_pct: 28.0, stop_loss_pct: -6.0, min_score: 88, min_smart_money: 4, min_liquidity: 2500, max_bonding_prog: 1.0, color: 'var(--accent-cyan)', trailing_stop_pct: 3.5, partial_tp_target: 12.0 },
];

export default function AutopilotTab({
  autopilotRunning,
  toggleAutopilot,
  availableStrategies,
  activeStrategy,
  selectStrategy,
  onEditStrategy,
  onCreateStrategy,
  onDeleteStrategy,
  autopilotStats,
  positions,
  walletInfo,
  handlePanicCloseAll,
  handleClosePosition,
  pnlChartPoints,
  strategyBenchmarks,
  tradeHistory,
  autopilotLogs,
  pendingCandidates = {},
  warmupInfo = { is_warming_up: false, remaining_seconds: 0, total_seconds: 60 },
  lang = 'tr'
}) {
  const rawStrategies = availableStrategies.length > 0 ? availableStrategies : fallbackStrategies;
  
  const strategies = rawStrategies.map(s => {
    let resolvedIcon = Zap;
    if (typeof s.icon === 'function') {
      resolvedIcon = s.icon;
    } else if (typeof s.icon === 'string' && iconMap[s.icon]) {
      resolvedIcon = iconMap[s.icon];
    } else {
      if (s.id === 'trend') resolvedIcon = TrendingUp;
      else if (s.id === 'moonshot' || s.id === 'cluster_accumulator') resolvedIcon = Crosshair;
      else if (s.id === 'whale_shadow') resolvedIcon = BarChart2;
      else if (s.id === 'ultra_safe' || s.id === 'anti_cabal') resolvedIcon = ShieldCheck;
      else if (s.id === 'cabal_momentum') resolvedIcon = Activity;
      else if (s.id === 'breakout') resolvedIcon = Flame;
      else if (s.id === 'bonding_apex') resolvedIcon = Radio;
      else if (s.id === 'liquidity_vanguard' || s.id === 'meteora_dlmm') resolvedIcon = Layers;
      else if (s.id === 'dip_rebound') resolvedIcon = Compass;
      else if (s.id === 'stealth_sniper') resolvedIcon = Radar;
      else if (s.id === 'velocity_surge') resolvedIcon = Zap;
    }

    return {
      ...s,
      iconComponent: resolvedIcon
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Autopilot Master Controller */}
      <div className="terminal-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu size={18} color={autopilotRunning ? "var(--accent-emerald)" : "var(--text-muted)"} />
              <h2 style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Autopilot Execution & Rug Defense Engine
              </h2>
              <span className={`badge ${autopilotRunning ? (warmupInfo.is_warming_up ? 'badge-amber' : 'badge-emerald') : 'badge-rose'}`}>
                {autopilotRunning && <span className="live-dot live-dot-pulse" style={{ width: '5px', height: '5px' }} />}
                {autopilotRunning ? (warmupInfo.is_warming_up ? `KALİBRASYON: ${warmupInfo.remaining_seconds}s` : 'AUTONOMOUS ACTIVE') : 'DISENGAGED'}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Automated pipeline: Stream Ingestion &rarr; Security Verification &rarr; Smart Money Validation &rarr; Route Execution & TP/SL Exit
            </p>
          </div>

          <div>
            <button
              onClick={toggleAutopilot}
              className={autopilotRunning ? "btn-action-danger" : "btn-action-primary"}
              style={{ padding: '9px 18px', fontSize: '13px' }}
            >
              {autopilotRunning ? <Square size={14} /> : <Play size={14} />}
              <span>{autopilotRunning ? 'Disengage Engine' : 'Engage Autopilot'}</span>
            </button>
          </div>
        </div>

        {/* 60-Second Initial Calibration Progress Banner */}
        {autopilotRunning && warmupInfo.is_warming_up && (
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
                  🧠 Piyasa Kalibrasyon ve Momentum Tarama Fazı
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  (İlk 60 saniye boyunca tokenlar analiz edilir, fevri alım yapılmaz)
                </span>
              </div>
              <span className="font-mono" style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-amber)' }}>
                {warmupInfo.remaining_seconds}s Kaldı
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: '4px', background: 'var(--bg-app)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.max(5, ((warmupInfo.total_seconds - warmupInfo.remaining_seconds) / warmupInfo.total_seconds) * 100)}%`,
                background: 'var(--accent-amber)',
                transition: 'width 1s linear'
              }} />
            </div>
          </div>
        )}

        {/* 12 Strategy Profiles Grid + Custom Builder Button */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Autonomous Bot Strategy Profiles
              </span>
              <span className="badge badge-muted font-mono" style={{ fontSize: '10px' }}>
                {strategies.length} BOTS ACTIVE
              </span>
            </div>

            <button
              onClick={() => onCreateStrategy && onCreateStrategy()}
              className="btn-action-secondary"
              style={{
                padding: '5px 12px',
                fontSize: '11px',
                color: 'var(--accent-cyan)',
                borderColor: 'rgba(6, 182, 212, 0.3)'
              }}
            >
              <Plus size={13} />
              <span>+ Create Custom Strategy</span>
            </button>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '12px' 
          }}>
            {strategies.map(strat => {
              const isSelected = activeStrategy === strat.id;
              const Icon = strat.iconComponent || Zap;

              return (
                <div
                  key={strat.id}
                  onClick={() => selectStrategy(strat.id)}
                  style={{
                    background: isSelected ? 'var(--bg-surface-2)' : 'var(--bg-app)',
                    border: isSelected ? `1px solid ${strat.color}` : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? `0 0 16px rgba(16, 185, 129, 0.15)` : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '154px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-default)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <Icon size={15} color={strat.color} />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {/* Customize Bot Settings Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEditStrategy) onEditStrategy(strat);
                          }}
                          title={`Customize parameters for ${strat.name}`}
                          style={{
                            background: 'var(--bg-surface-1)',
                            border: '1px solid var(--border-default)',
                            borderRadius: '4px',
                            padding: '3px 6px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-surface-elevated)';
                            e.currentTarget.style.color = 'var(--accent-sky)';
                            e.currentTarget.style.borderColor = 'var(--accent-sky-border)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--bg-surface-1)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.borderColor = 'var(--border-default)';
                          }}
                        >
                          <Sliders size={11} />
                          <span>Edit</span>
                        </button>

                        {strat.is_custom && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onDeleteStrategy) onDeleteStrategy(strat.id);
                            }}
                            title="Delete custom strategy"
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(244, 63, 94, 0.3)',
                              borderRadius: '4px',
                              padding: '3px 5px',
                              color: 'var(--accent-rose)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}

                        <span style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: isSelected ? strat.color : 'var(--bg-surface-0)',
                          color: isSelected ? '#04141d' : 'var(--text-muted)'
                        }}>
                          {isSelected ? 'ACTIVE' : 'READY'}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                      {strat.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                      {strat.tagline}
                    </div>
                  </div>

                  {/* Advanced Indicators */}
                  <div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {strat.trailing_stop_pct > 0 && (
                        <span className="badge badge-sky font-mono" style={{ fontSize: '8px', padding: '1px 4px' }}>
                          TRAIL: -{strat.trailing_stop_pct}%
                        </span>
                      )}
                      {strat.partial_tp_target > 0 && (
                        <span className="badge badge-amber font-mono" style={{ fontSize: '8px', padding: '1px 4px' }}>
                          PARTIAL: +{strat.partial_tp_target}%
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px' }}>
                      <span className="font-mono" style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>TP: +{strat.take_profit_pct}%</span>
                      <span className="font-mono" style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>SL: {strat.stop_loss_pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Summary Ribbons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        <div className="terminal-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Net Realized Profit
          </span>
          <div className="font-mono" style={{
            fontSize: '22px',
            fontWeight: 700,
            marginTop: '6px',
            color: autopilotStats.total_profit_sol >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'
          }}>
            {autopilotStats.total_profit_sol >= 0 ? `+${formatSOL(autopilotStats.total_profit_sol, 3)}` : formatSOL(autopilotStats.total_profit_sol, 3)} SOL
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            ≈ ${(autopilotStats.total_profit_sol * 150.0).toFixed(2)} USD
          </div>
        </div>

        <div className="terminal-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Historical Win Rate
          </span>
          <div className="font-mono" style={{ fontSize: '22px', fontWeight: 700, marginTop: '6px', color: 'var(--accent-violet)' }}>
            {autopilotStats.winning_trades + autopilotStats.losing_trades > 0 
              ? ((autopilotStats.winning_trades / (autopilotStats.winning_trades + autopilotStats.losing_trades)) * 100).toFixed(1)
              : "0.0"}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            {autopilotStats.winning_trades} Win / {autopilotStats.losing_trades} Loss
          </div>
        </div>

        <div className="terminal-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Rugs Intercepted
          </span>
          <div className="font-mono" style={{ fontSize: '22px', fontWeight: 700, marginTop: '6px', color: 'var(--accent-rose)' }}>
            {autopilotStats.rejected_rug_count} Blocked
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Total Scanned: {autopilotStats.scanned_count}
          </div>
        </div>

        <div className="terminal-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Executed Entries
          </span>
          <div className="font-mono" style={{ fontSize: '22px', fontWeight: 700, marginTop: '6px', color: 'var(--accent-emerald)' }}>
            {autopilotStats.passed_count} Orders
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Pass Rate: {autopilotStats.scanned_count > 0 ? ((autopilotStats.passed_count / autopilotStats.scanned_count) * 100).toFixed(1) : "0"}%
          </div>
        </div>
      </div>

      {/* Stage 1: Active 15-Second Confirmation Watchlist */}
      {Object.keys(pendingCandidates).length > 0 && (
        <div className="terminal-card" style={{ padding: '16px 20px', border: '1px solid var(--accent-cyan-border)', background: 'rgba(6, 182, 212, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={16} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Akıllı Doğrulama ve Analiz İzleme Havuzu ({Object.keys(pendingCandidates).length} Token İnceleniyor)
              </h3>
            </div>
            <span className="badge badge-cyan font-mono" style={{ fontSize: '10px' }}>
              15-SECOND ANTI-DUMP VERIFICATION
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            {Object.values(pendingCandidates).map((cand, idx) => (
              <div key={idx} style={{ background: 'var(--bg-app)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '12.5px', color: 'var(--accent-cyan)' }}>
                    ${cand.symbol} <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({cand.token_address ? `${cand.token_address.slice(0, 6)}...${cand.token_address.slice(-4)}` : ''})</span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Skor: <strong style={{ color: 'var(--accent-emerald)' }}>{cand.safety_score}/100</strong> | Balina: <strong>{cand.smart_money}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="live-dot live-dot-pulse" style={{ background: 'var(--accent-cyan)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700 }}>İnceleniyor</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Positions Card */}
      <PositionCard
        positions={positions}
        walletInfo={walletInfo}
        availableStrategies={strategies}
        activeStrategy={activeStrategy}
        handlePanicCloseAll={handlePanicCloseAll}
        handleClosePosition={handleClosePosition}
        lang={lang}
      />

      {/* PnL Performance Chart */}
      <PnLChart
        pnlChartPoints={pnlChartPoints}
        walletInfo={walletInfo}
        positions={positions}
        lang={lang}
      />

      {/* Two Column Layout: Trade History | Terminal Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Closed Trade History */}
        <TradeHistory tradeHistory={tradeHistory} />

        {/* Live Terminal & Event Feed */}
        <div className="terminal-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={16} color="var(--accent-emerald)" />
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Telemetry & Autopilot Console</h3>
            </div>
            <span className="badge badge-muted font-mono">
              {autopilotLogs.length} Events
            </span>
          </div>

          <div style={{
            background: 'var(--bg-app)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px',
            height: '420px',
            overflowY: 'auto',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            lineHeight: '1.6',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {autopilotLogs.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '170px' }}>
                Console initialized. Start autopilot engine to begin live log streaming.
              </div>
            ) : (
              autopilotLogs.map((item, idx) => {
                const isObj = typeof item === 'object' && item !== null;
                const text = isObj ? item.text : item;
                const timestamp = isObj ? item.timestamp : '--:--:--';
                const level = isObj ? item.level : 'INFO';

                let badgeClass = 'badge-muted';
                let label = 'INFO';

                if (level === 'BUY_SIGNAL' || text.includes('OPPORTUNITY') || text.includes('BUYING')) {
                  badgeClass = 'badge-cyan';
                  label = 'SIGNAL';
                } else if (level === 'SUCCESS' || text.includes('BOUGHT') || text.includes('FILLED')) {
                  badgeClass = 'badge-emerald';
                  label = 'EXECUTE';
                } else if (level === 'PROFIT' || text.includes('TAKE PROFIT')) {
                  badgeClass = 'badge-emerald';
                  label = 'PROFIT';
                } else if (level === 'BLOCKED' || text.includes('BLOCKED') || text.includes('rejected') || text.includes('INTERCEPTED')) {
                  badgeClass = 'badge-rose';
                  label = 'DEFENSE';
                } else if (level === 'LOSS' || text.includes('STOP LOSS')) {
                  badgeClass = 'badge-rose';
                  label = 'STOP';
                } else if (level === 'STRATEGY_CUSTOMIZED') {
                  badgeClass = 'badge-cyan';
                  label = 'CONFIG';
                }

                return (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>[{timestamp}]</span>
                    <span className={`badge ${badgeClass}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                      {label}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', flex: 1, wordBreak: 'break-word' }}>
                      {text}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Benchmark Matrix (Moved to bottom of page) */}
      <BenchmarkTable
        availableStrategies={strategies}
        strategyBenchmarks={strategyBenchmarks}
        activeStrategy={activeStrategy}
        selectStrategy={selectStrategy}
      />
    </div>
  );
}
