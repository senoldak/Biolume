import React, { useState, useRef, useMemo } from 'react';
import { Layers, Eye, EyeOff, Trophy, Sparkles, TrendingUp } from 'lucide-react';
import { formatSOL } from '../utils/formatters';

export default function ArenaChart({ bots = [], recentEvents = [] }) {
  // State for toggling individual bot visibility on chart
  const [hiddenBots, setHiddenBots] = useState({});
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL', 'TOP3', 'PROFIT'
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);

  // Toggle single bot
  const toggleBot = (stratId) => {
    setHiddenBots(prev => ({ ...prev, [stratId]: !prev[stratId] }));
  };

  // Quick filter presets
  const activeBots = useMemo(() => {
    if (!bots || bots.length === 0) return [];
    if (filterMode === 'TOP3') {
      return bots.slice(0, 3);
    }
    if (filterMode === 'PROFIT') {
      return bots.filter(b => b.net_profit_pct > 0);
    }
    return bots.filter(b => !hiddenBots[b.strategy_id]);
  }, [bots, filterMode, hiddenBots]);

  // Extract timeline points
  const { maxTimelineLength, timeLabels } = useMemo(() => {
    let maxLen = 0;
    let longestHistory = [];
    bots.forEach(b => {
      if (b.pnl_history && b.pnl_history.length > maxLen) {
        maxLen = b.pnl_history.length;
        longestHistory = b.pnl_history;
      }
    });
    const labels = longestHistory.map(p => p.time);
    return { maxTimelineLength: maxLen, timeLabels: labels };
  }, [bots]);

  // Calculate global min/max for chart scale across active bots
  const { minBal, maxBal, range, chartPaths } = useMemo(() => {
    if (activeBots.length === 0 || maxTimelineLength < 2) {
      return { minBal: 8.0, maxBal: 12.0, range: 4.0, chartPaths: [] };
    }

    let globalMin = 10.0;
    let globalMax = 10.0;

    activeBots.forEach(b => {
      if (b.pnl_history) {
        b.pnl_history.forEach(p => {
          if (p.balance_sol < globalMin) globalMin = p.balance_sol;
          if (p.balance_sol > globalMax) globalMax = p.balance_sol;
        });
      }
    });

    const padding = Math.max((globalMax - globalMin) * 0.15, 0.15);
    const minB = Math.max(0, globalMin - padding);
    const maxB = globalMax + padding;
    const r = maxB - minB || 1.0;

    const VW = 1200;
    const VH = 300;
    const padLeft = 12;
    const padRight = 65;
    const padTop = 25;
    const padBottom = 35;
    const chartW = VW - padLeft - padRight;
    const chartH = VH - padTop - padBottom;

    const paths = activeBots.map(b => {
      const history = b.pnl_history || [];
      if (history.length < 2) return null;

      const coords = history.map((p, i) => {
        const x = padLeft + (i / Math.max(1, maxTimelineLength - 1)) * chartW;
        const y = padTop + chartH - ((p.balance_sol - minB) / r) * chartH;
        return { x, y, point: p };
      });

      let pathD = `M ${coords[0].x} ${coords[0].y}`;
      for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[i];
        const p1 = coords[i + 1];
        const mx = (p0.x + p1.x) / 2;
        pathD += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
      }

      const lastCoord = coords[coords.length - 1];

      return {
        strategy_id: b.strategy_id,
        name: b.name,
        color: b.color || 'var(--accent-emerald)',
        pathD,
        lastCoord,
        coords,
        currentBalance: b.balance_sol,
        netProfitPct: b.net_profit_pct,
        rank: b.current_rank
      };
    }).filter(Boolean);

    return { minBal: minB, maxBal: maxB, range: r, chartPaths: paths };
  }, [activeBots, maxTimelineLength]);

  const handleMouseMove = (e) => {
    if (!svgRef.current || maxTimelineLength === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
    const targetIdx = Math.round(ratio * (maxTimelineLength - 1));
    setHoverIndex(targetIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div className="terminal-card" style={{ padding: '20px' }}>
      {/* Chart Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'var(--bg-surface-0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-subtle)'
          }}>
            <Layers size={17} color="var(--accent-cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Mega Multi-Bot Equity Race (12 Simultaneous Curves)
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Real-time comparative performance • 10.0 SOL Initial Bankroll per Bot • Zero-Latency Stream
            </span>
          </div>
        </div>

        {/* Preset Quick Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {[
            { id: 'ALL', label: 'All 12 Bots' },
            { id: 'TOP3', label: 'Top 3 Leaders' },
            { id: 'PROFIT', label: 'Profitable Only' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => { setFilterMode(btn.id); setHiddenBots({}); }}
              style={{
                background: filterMode === btn.id ? 'var(--bg-surface-2)' : 'var(--bg-app)',
                border: `1px solid ${filterMode === btn.id ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                color: filterMode === btn.id ? 'var(--accent-cyan)' : 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Legend / Toggle Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        marginBottom: '14px',
        padding: '10px 12px',
        background: 'var(--bg-app)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)'
      }}>
        {bots.map(bot => {
          const isHidden = hiddenBots[bot.strategy_id] || (filterMode === 'TOP3' && bot.current_rank > 3) || (filterMode === 'PROFIT' && bot.net_profit_pct <= 0);
          return (
            <button
              key={bot.strategy_id}
              onClick={() => { setFilterMode('CUSTOM'); toggleBot(bot.strategy_id); }}
              style={{
                background: isHidden ? 'transparent' : 'var(--bg-surface-1)',
                border: `1px solid ${isHidden ? 'var(--border-subtle)' : bot.color || 'var(--accent-emerald)'}`,
                borderRadius: '4px',
                padding: '3px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                opacity: isHidden ? 0.45 : 1.0,
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: bot.color || 'var(--accent-emerald)',
                boxShadow: isHidden ? 'none' : `0 0 6px ${bot.color}`
              }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                #{bot.current_rank} {bot.name}
              </span>
              <span className="font-mono" style={{
                fontSize: '10px',
                fontWeight: 700,
                color: bot.net_profit_pct >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'
              }}>
                {bot.net_profit_pct >= 0 ? `+${bot.net_profit_pct.toFixed(1)}%` : `${bot.net_profit_pct.toFixed(1)}%`}
              </span>
            </button>
          );
        })}
      </div>

      {/* SVG Canvas Area */}
      <div style={{
        background: 'var(--bg-app)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Live Hover Inspector Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
          padding: '4px 10px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '4px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Timeline Checkpoint: <strong style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
                {timeLabels[hoverIndex] || 'Live Continuous Stream'}
              </strong>
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Active Curves: <strong style={{ color: 'var(--accent-cyan)' }}>{chartPaths.length} / 12</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Leading Strategy: <strong style={{ color: 'var(--accent-emerald)' }}>
                {bots[0] ? `#1 ${bots[0].name} (${bots[0].net_profit_pct >= 0 ? `+${bots[0].net_profit_pct.toFixed(2)}%` : `${bots[0].net_profit_pct.toFixed(2)}%`})` : 'Calculating...'}
              </strong>
            </span>
          </div>
        </div>

        {/* Interactive Multi-Line SVG */}
        <div 
          style={{ position: 'relative', height: '280px', width: '100%', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <svg 
            ref={svgRef}
            viewBox="0 0 1200 300" 
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const gridY = 25 + (300 - 25 - 35) * ratio;
              const priceVal = maxBal - ratio * range;
              return (
                <g key={idx}>
                  <line
                    x1={12}
                    y1={gridY}
                    x2={1200 - 65}
                    y2={gridY}
                    stroke="var(--border-subtle)"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                    opacity="0.6"
                  />
                  <text
                    x={1200 - 60}
                    y={gridY + 3}
                    fill="var(--text-dim)"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {priceVal.toFixed(2)} SOL
                  </text>
                </g>
              );
            })}

            {/* Baseline 10.0 SOL Initial Mark */}
            {(() => {
              const baselineY = 25 + (300 - 25 - 35) - ((10.0 - minBal) / range) * (300 - 25 - 35);
              if (baselineY >= 25 && baselineY <= 265) {
                return (
                  <g>
                    <line
                      x1={12}
                      y1={baselineY}
                      x2={1200 - 65}
                      y2={baselineY}
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeDasharray="2 2"
                      strokeWidth="1.5"
                    />
                    <text
                      x={16}
                      y={baselineY - 4}
                      fill="var(--text-dim)"
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      INITIAL BASELINE: 10.00 SOL
                    </text>
                  </g>
                );
              }
              return null;
            })()}

            {/* Render 12 Trajectory Paths */}
            {chartPaths.map((item) => (
              <g key={item.strategy_id}>
                {/* Curve Stroke */}
                <path
                  d={item.pathD}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={item.rank === 1 ? 1.0 : 0.82}
                />

                {/* Endpoint Circle */}
                {item.lastCoord && (
                  <g>
                    <circle
                      cx={item.lastCoord.x}
                      cy={item.lastCoord.y}
                      r="4"
                      fill="#07090e"
                      stroke={item.color}
                      strokeWidth="2.5"
                    />
                  </g>
                )}
              </g>
            ))}

            {/* Vertical Hover Crosshair */}
            {hoverIndex !== null && chartPaths.length > 0 && chartPaths[0].coords[hoverIndex] && (
              <line
                x1={chartPaths[0].coords[hoverIndex].x}
                y1={25}
                x2={chartPaths[0].coords[hoverIndex].x}
                y2={265}
                stroke="var(--accent-cyan)"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />
            )}
          </svg>
        </div>

        {/* Timeline Bottom Axis */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '6px',
          padding: '0 4px',
          fontSize: '10px',
          color: 'var(--text-dim)',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          <span>{timeLabels[0] || 'T-0 Start'}</span>
          <span>{timeLabels[Math.floor(timeLabels.length / 2)] || 'Mid'}</span>
          <span style={{ color: 'var(--accent-cyan)' }}>{timeLabels[timeLabels.length - 1] || 'Current (Live)'}</span>
        </div>
      </div>
    </div>
  );
}
