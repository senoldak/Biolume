import React, { useState, useRef, useMemo } from 'react';
import { LineChart as ChartIcon, ZoomIn, ZoomOut, RotateCcw, Calendar, TrendingUp, Info } from 'lucide-react';
import { formatSOL, formatPrice } from '../utils/formatters';

export default function PnLChart({ pnlChartPoints, walletInfo, positions }) {
  const openPositions = positions.filter(p => p.status === 'OPEN');
  const netPortfolio = (walletInfo.balance_sol || 0) + (openPositions.length * 0.2) + (openPositions.reduce((acc, p) => acc + (p.pnl_sol || 0), 0));

  // Timeframe filter state: 'ALL', '50', '20', '10'
  const [timeframe, setTimeframe] = useState('ALL');
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);

  // Prepare full data list
  const rawPoints = useMemo(() => {
    if (!pnlChartPoints || pnlChartPoints.length === 0) return [];
    if (pnlChartPoints.length === 1) {
      return [{ time: 'Start', balance_sol: 10.0, profit_sol: 0 }, ...pnlChartPoints];
    }
    return pnlChartPoints;
  }, [pnlChartPoints]);

  // Filtered dataset based on timeframe selector
  const displayPoints = useMemo(() => {
    if (rawPoints.length === 0) return [];
    if (timeframe === '10') return rawPoints.slice(-10);
    if (timeframe === '25') return rawPoints.slice(-25);
    if (timeframe === '50') return rawPoints.slice(-50);
    return rawPoints;
  }, [rawPoints, timeframe]);

  // Calculations for scale
  const { pathD, areaD, coords, minBal, maxBal, range, strokeColor, currentBal, startBal, totalChangeSOL, totalChangePct } = useMemo(() => {
    if (displayPoints.length === 0) {
      return { pathD: '', areaD: '', coords: [], minBal: 0, maxBal: 0, range: 1, strokeColor: '#10b981', currentBal: 10, startBal: 10, totalChangeSOL: 0, totalChangePct: 0 };
    }

    const vals = displayPoints.map(p => p.balance_sol);
    const minRaw = Math.min(...vals);
    const maxRaw = Math.max(...vals);
    const padding = Math.max((maxRaw - minRaw) * 0.15, 0.02);
    const minB = Math.max(0, minRaw - padding);
    const maxB = maxRaw + padding;
    const r = maxB - minB || 0.1;

    const VW = 1200;
    const VH = 240;
    const padLeft = 8;
    const padRight = 65;
    const padTop = 20;
    const padBottom = 30;
    const chartW = VW - padLeft - padRight;
    const chartH = VH - padTop - padBottom;

    const crds = displayPoints.map((p, i) => {
      const x = padLeft + (i / Math.max(1, displayPoints.length - 1)) * chartW;
      const y = padTop + chartH - ((p.balance_sol - minB) / r) * chartH;
      return { x, y, point: p, index: i };
    });

    let pD = `M ${crds[0].x} ${crds[0].y}`;
    for (let i = 0; i < crds.length - 1; i++) {
      const p0 = crds[i];
      const p1 = crds[i + 1];
      const mx = (p0.x + p1.x) / 2;
      pD += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const last = crds[crds.length - 1];
    const first = crds[0];
    const aD = `${pD} L ${last.x} ${padTop + chartH} L ${first.x} ${padTop + chartH} Z`;

    const startB = displayPoints[0]?.balance_sol || 10.0;
    const currB = displayPoints[displayPoints.length - 1]?.balance_sol || 10.0;
    const diffSOL = currB - startB;
    const diffPct = startB > 0 ? (diffSOL / startB) * 100 : 0;
    const isProfit = diffSOL >= 0;
    const sColor = isProfit ? '#10b981' : '#f43f5e';

    return {
      pathD: pD,
      areaD: aD,
      coords: crds,
      minBal: minB,
      maxBal: maxB,
      range: r,
      strokeColor: sColor,
      currentBal: currB,
      startBal: startB,
      totalChangeSOL: diffSOL,
      totalChangePct: diffPct
    };
  }, [displayPoints]);

  const handleMouseMove = (e) => {
    if (!svgRef.current || coords.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
    const targetIdx = Math.round(ratio * (coords.length - 1));
    setHoverIndex(targetIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const hoveredPoint = hoverIndex !== null && coords[hoverIndex] ? coords[hoverIndex] : null;

  return (
    <div className="terminal-card" style={{ padding: '20px' }}>
      {/* Header with Title and Quick Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-subtle)'
          }}>
            <ChartIcon size={16} color="var(--accent-emerald)" />
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 800 }}>Real-Time PnL Trajectory & Equity Curve</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Interactive balance timeline • Full range historical tracking ({rawPoints.length} checkpoints)
            </span>
          </div>
        </div>

        {/* Controls & Timeframe Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            background: 'var(--bg-app)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '2px',
            gap: '2px'
          }}>
            {[
              { id: '10', label: 'Last 10' },
              { id: '25', label: 'Last 25' },
              { id: '50', label: 'Last 50' },
              { id: 'ALL', label: `All (${rawPoints.length})` }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id)}
                style={{
                  background: timeframe === t.id ? 'var(--bg-surface-2)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  color: timeframe === t.id ? 'var(--accent-emerald)' : 'var(--text-muted)',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{
            background: 'var(--bg-app)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Net Equity:</span>
            <span className="font-mono" style={{ fontSize: '13px', color: 'var(--accent-emerald)', fontWeight: 800 }}>
              {netPortfolio.toFixed(3)} SOL
            </span>
          </div>
        </div>
      </div>

      {rawPoints.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
          Real-time balance curve will plot continuously as autopilot executes scans & trades.
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-app)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Hover Metric Overlay Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
            padding: '4px 8px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '4px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ fontSize: '11px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Timeline Focus: </span>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {hoveredPoint ? hoveredPoint.point.time : 'Live Continuous'}
                </span>
              </div>
              <div style={{ fontSize: '11px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Balance at Point: </span>
                <span className="font-mono" style={{ fontWeight: 700, color: hoveredPoint ? 'var(--accent-sky)' : 'var(--accent-emerald)' }}>
                  {hoveredPoint ? `${hoveredPoint.point.balance_sol.toFixed(4)} SOL` : `${currentBal.toFixed(4)} SOL`}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ fontSize: '11px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Period PnL: </span>
                <span className="font-mono" style={{ fontWeight: 700, color: totalChangeSOL >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                  {totalChangeSOL >= 0 ? `+${totalChangeSOL.toFixed(4)}` : totalChangeSOL.toFixed(4)} SOL ({totalChangePct >= 0 ? `+${totalChangePct.toFixed(2)}` : totalChangePct.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          {/* SVG Canvas (Full width & Edge to Edge) */}
          <div 
            style={{ position: 'relative', height: '220px', width: '100%', cursor: 'crosshair' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <svg 
              ref={svgRef}
              viewBox="0 0 1200 240" 
              preserveAspectRatio="none"
              style={{ width: '100%', height: '100%', display: 'block' }}
            >
              <defs>
                <linearGradient id="pnlGradHighRes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
                  <stop offset="60%" stopColor={strokeColor} stopOpacity="0.08" />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines & Price Labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const gridY = 20 + (240 - 20 - 30) * ratio;
                const priceVal = maxBal - ratio * range;
                return (
                  <g key={idx}>
                    <line
                      x1={8}
                      y1={gridY}
                      x2={1200 - 65}
                      y2={gridY}
                      stroke="var(--border-subtle)"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                      opacity="0.7"
                    />
                    <text
                      x={1200 - 60}
                      y={gridY + 3}
                      fill="var(--text-dim)"
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {priceVal.toFixed(3)}
                    </text>
                  </g>
                );
              })}

              {/* Area Under Curve */}
              <path d={areaD} fill="url(#pnlGradHighRes)" />

              {/* Smooth Equity Line */}
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Crosshair and Hover Cursor */}
              {hoveredPoint && (
                <g>
                  {/* Vertical Crosshair */}
                  <line
                    x1={hoveredPoint.x}
                    y1={20}
                    x2={hoveredPoint.x}
                    y2={210}
                    stroke="var(--accent-sky)"
                    strokeDasharray="2 2"
                    strokeWidth="1.2"
                  />
                  {/* Horizontal Crosshair */}
                  <line
                    x1={8}
                    y1={hoveredPoint.y}
                    x2={1200 - 65}
                    y2={hoveredPoint.y}
                    stroke="var(--accent-sky)"
                    strokeDasharray="2 2"
                    strokeWidth="1.2"
                    opacity="0.6"
                  />
                  {/* Hover Point Highlight */}
                  <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r="5.5"
                    fill="#04141d"
                    stroke="var(--accent-sky)"
                    strokeWidth="3"
                  />
                </g>
              )}

              {/* Last Value Endpoint Glow (If not hovering) */}
              {!hoveredPoint && coords.length > 0 && (
                <g>
                  <circle
                    cx={coords[coords.length - 1].x}
                    cy={coords[coords.length - 1].y}
                    r="6"
                    fill={strokeColor}
                    fillOpacity="0.25"
                  />
                  <circle
                    cx={coords[coords.length - 1].x}
                    cy={coords[coords.length - 1].y}
                    r="3.5"
                    fill="#07090e"
                    stroke={strokeColor}
                    strokeWidth="2.2"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Timeline Axis Labels */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '6px',
            padding: '0 4px',
            fontSize: '10px',
            color: 'var(--text-dim)',
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            <span>{displayPoints[0]?.time || 'Start'}</span>
            <span>{displayPoints[Math.floor(displayPoints.length / 2)]?.time || 'Mid'}</span>
            <span style={{ color: 'var(--accent-emerald)' }}>{displayPoints[displayPoints.length - 1]?.time || 'Current'} (Live)</span>
          </div>
        </div>
      )}
    </div>
  );
}
