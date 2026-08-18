import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  CheckCircle2, 
  Zap, 
  TrendingUp, 
  ShieldCheck, 
  Flame, 
  Crosshair, 
  BarChart2, 
  Activity, 
  Radio, 
  Layers, 
  Compass, 
  Radar,
  Percent,
  Shield,
  Users,
  DollarSign,
  TrendingDown,
  Layers as LayersIcon
} from 'lucide-react';

const availableIcons = [
  { id: 'Zap', name: 'Zap', icon: Zap },
  { id: 'TrendingUp', name: 'TrendingUp', icon: TrendingUp },
  { id: 'Crosshair', name: 'Crosshair', icon: Crosshair },
  { id: 'BarChart2', name: 'BarChart2', icon: BarChart2 },
  { id: 'ShieldCheck', name: 'ShieldCheck', icon: ShieldCheck },
  { id: 'Activity', name: 'Activity', icon: Activity },
  { id: 'Flame', name: 'Flame', icon: Flame },
  { id: 'Radio', name: 'Radio', icon: Radio },
  { id: 'Layers', name: 'Layers', icon: Layers },
  { id: 'Compass', name: 'Compass', icon: Compass },
  { id: 'Radar', name: 'Radar', icon: Radar }
];

const availableColors = [
  { name: 'Cyan', value: 'var(--accent-cyan)' },
  { name: 'Emerald', value: 'var(--accent-emerald)' },
  { name: 'Sky', value: 'var(--accent-sky)' },
  { name: 'Violet', value: 'var(--accent-violet)' },
  { name: 'Rose', value: 'var(--accent-rose)' },
  { name: 'Amber', value: 'var(--accent-amber)' }
];

export default function CreateStrategyModal({
  isOpen,
  onClose,
  onSave
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const [form, setForm] = useState({
    name: '',
    tagline: '',
    icon: 'Flame',
    color: 'var(--accent-cyan)',
    take_profit_pct: 35.0,
    stop_loss_pct: -12.0,
    trailing_stop_pct: 6.0,
    trailing_activation: 15.0,
    partial_tp_pct: 50.0,
    partial_tp_target: 20.0,
    max_open_positions: 3,
    min_score: 75,
    min_smart_money: 2,
    min_liquidity: 1200,
    max_bonding_prog: 0.85
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);

    const stratId = 'custom_' + Date.now().toString().slice(-6);
    const payload = {
      id: stratId,
      name: form.name || 'Custom Alpha Sniper',
      tagline: form.tagline || 'User Defined Autonomous Strategy',
      icon: form.icon,
      color: form.color,
      take_profit_pct: parseFloat(form.take_profit_pct),
      stop_loss_pct: parseFloat(form.stop_loss_pct),
      trailing_stop_pct: parseFloat(form.trailing_stop_pct) || 0,
      trailing_activation: parseFloat(form.trailing_activation) || 0,
      partial_tp_pct: parseFloat(form.partial_tp_pct) || 0,
      partial_tp_target: parseFloat(form.partial_tp_target) || 0,
      max_open_positions: parseInt(form.max_open_positions, 10) || 3,
      min_score: parseInt(form.min_score, 10),
      min_smart_money: parseInt(form.min_smart_money, 10),
      min_liquidity: parseFloat(form.min_liquidity),
      max_bonding_prog: parseFloat(form.max_bonding_prog),
      is_custom: true
    };

    onSave(payload);
    setSuccessMsg('Custom strategy created & ready for execution!');
    setTimeout(() => {
      setSaving(false);
      onClose();
    }, 900);
  };

  return (
    <div 
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-strategy-title"
    >
      <div 
        className="terminal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-surface-0)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-subtle)'
            }}>
              <Plus size={18} color="var(--accent-cyan)" />
            </div>
            <div>
              <h3 id="create-strategy-title" style={{ fontSize: '16px', fontWeight: 800 }}>Create Custom Strategy</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Build your own autonomous execution logic with customized triggers</p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {successMsg ? (
          <div className="badge badge-emerald" style={{ padding: '20px', width: '100%', justifyContent: 'center', fontSize: '13px' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Strategy Identity & Theme */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Strategy Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hyper Dynamic Scalp"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Tagline / Description:
                </label>
                <input
                  type="text"
                  placeholder="e.g. +35% TP / -12% SL with Trailing"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Icon & Color Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Select Icon:
                </label>
                <select
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                >
                  {availableIcons.map(ic => (
                    <option key={ic.id} value={ic.id}>{ic.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Accent Color:
                </label>
                <select
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                >
                  {availableColors.map(c => (
                    <option key={c.name} value={c.value}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Primary TP / SL Thresholds */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--bg-app)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px', fontWeight: 700 }}>
                  <Percent size={12} /> Target Profit (+%):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={form.take_profit_pct}
                  onChange={(e) => setForm({ ...form, take_profit_pct: e.target.value })}
                  className="font-mono"
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface-0)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    color: 'var(--accent-emerald)',
                    fontSize: '12px',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px', fontWeight: 700 }}>
                  <Percent size={12} /> Stop Loss (-%):
                </label>
                <input
                  type="number"
                  step="0.5"
                  max="-0.5"
                  value={form.stop_loss_pct}
                  onChange={(e) => setForm({ ...form, stop_loss_pct: e.target.value })}
                  className="font-mono"
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface-0)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    color: 'var(--accent-rose)',
                    fontSize: '12px',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                  required
                />
              </div>
            </div>

            {/* Dynamic Trailing Stop & Partial Take Profit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--bg-app)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--accent-sky)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px', fontWeight: 700 }}>
                  <TrendingDown size={12} /> Trailing Stop (% from ATH):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="e.g. 6.0"
                  value={form.trailing_stop_pct}
                  onChange={(e) => setForm({ ...form, trailing_stop_pct: e.target.value })}
                  className="font-mono"
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface-0)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    color: 'var(--accent-sky)',
                    fontSize: '12px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  Activates after +{form.trailing_activation || 15}% profit
                </span>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px', fontWeight: 700 }}>
                  <LayersIcon size={12} /> Partial TP (50% at +%):
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g. 20.0"
                  value={form.partial_tp_target}
                  onChange={(e) => setForm({ ...form, partial_tp_target: e.target.value })}
                  className="font-mono"
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface-0)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    color: 'var(--accent-amber)',
                    fontSize: '12px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  Sells 50% & locks profit to zero risk
                </span>
              </div>
            </div>

            {/* Filter Criteria & Concurrent Limit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  <Shield size={11} /> Min Score:
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.min_score}
                  onChange={(e) => setForm({ ...form, min_score: e.target.value })}
                  className="font-mono"
                  style={{
                    width: '100%',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  <Users size={11} /> Min Whales:
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={form.min_smart_money}
                  onChange={(e) => setForm({ ...form, min_smart_money: e.target.value })}
                  className="font-mono"
                  style={{
                    width: '100%',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Max Open Pos:
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={form.max_open_positions}
                  onChange={(e) => setForm({ ...form, max_open_positions: e.target.value })}
                  className="font-mono"
                  style={{
                    width: '100%',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                  required
                />
              </div>
            </div>

            {/* Min Liquidity & Bonding Curve */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  <DollarSign size={11} /> Min Liquidity (USD):
                </label>
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={form.min_liquidity}
                  onChange={(e) => setForm({ ...form, min_liquidity: e.target.value })}
                  className="font-mono"
                  style={{
                    width: '100%',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Max Curve Progress (0.1 - 1.0):
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  max="1.0"
                  value={form.max_bonding_prog}
                  onChange={(e) => setForm({ ...form, max_bonding_prog: e.target.value })}
                  className="font-mono"
                  style={{
                    width: '100%',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                  required
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-action-secondary"
                style={{ flex: 1, padding: '10px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-action-primary"
                disabled={saving}
                style={{ flex: 2, padding: '10px' }}
              >
                <Plus size={14} />
                <span>{saving ? 'Creating Strategy...' : 'Create & Add to Grid'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
