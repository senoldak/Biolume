import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
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
  DollarSign
} from 'lucide-react';

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
  Radar
};

export default function EditStrategyModal({
  strategy,
  isOpen,
  onClose,
  onSave
}) {
  if (!isOpen || !strategy) return null;

  const [form, setForm] = useState({
    id: strategy.id,
    name: strategy.name || '',
    tagline: strategy.tagline || '',
    take_profit_pct: strategy.take_profit_pct || 10,
    stop_loss_pct: strategy.stop_loss_pct || -5,
    trailing_stop_pct: strategy.trailing_stop_pct || 0,
    trailing_activation: strategy.trailing_activation || 0,
    partial_tp_pct: strategy.partial_tp_pct || 0,
    partial_tp_target: strategy.partial_tp_target || 0,
    max_open_positions: strategy.max_open_positions || 3,
    min_score: strategy.min_score || 70,
    min_smart_money: strategy.min_smart_money || 2,
    min_liquidity: strategy.min_liquidity || 1000,
    max_bonding_prog: strategy.max_bonding_prog || 1.0,
    color: strategy.color || 'var(--accent-emerald)'
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (strategy) {
      setForm({
        id: strategy.id,
        name: strategy.name || '',
        tagline: strategy.tagline || '',
        take_profit_pct: strategy.take_profit_pct || 10,
        stop_loss_pct: strategy.stop_loss_pct || -5,
        trailing_stop_pct: strategy.trailing_stop_pct || 0,
        trailing_activation: strategy.trailing_activation || 0,
        partial_tp_pct: strategy.partial_tp_pct || 0,
        partial_tp_target: strategy.partial_tp_target || 0,
        max_open_positions: strategy.max_open_positions || 3,
        min_score: strategy.min_score || 70,
        min_smart_money: strategy.min_smart_money || 2,
        min_liquidity: strategy.min_liquidity || 1000,
        max_bonding_prog: strategy.max_bonding_prog || 1.0,
        color: strategy.color || 'var(--accent-emerald)'
      });
      setSuccessMsg('');
    }
  }, [strategy]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      id: form.id,
      name: form.name,
      tagline: form.tagline,
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
      color: form.color
    };

    onSave(payload);
    setSuccessMsg('Bot configuration updated & saved!');
    setTimeout(() => {
      setSaving(false);
      onClose();
    }, 1000);
  };

  const Icon = (typeof strategy.icon === 'string' && iconMap[strategy.icon]) ? iconMap[strategy.icon] : Zap;

  return (
    <div 
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-strategy-title"
    >
      <div 
        className="terminal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '540px',
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
              <Icon size={18} color={strategy.color || 'var(--accent-emerald)'} />
            </div>
            <div>
              <h3 id="edit-strategy-title" style={{ fontSize: '16px', fontWeight: 800 }}>Edit Strategy: {strategy.name}</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Configure real-time trading parameters and execution triggers</p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        {successMsg ? (
          <div className="badge badge-emerald" style={{ padding: '16px', width: '100%', justifyContent: 'center', fontSize: '13px' }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Bot Name & Tagline */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
                  Bot Profile Name:
                </label>
                <input
                  type="text"
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
                  Strategy Tagline:
                </label>
                <input
                  type="text"
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

            {/* TP / SL Thresholds */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--bg-app)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px', fontWeight: 700 }}>
                  <Percent size={12} /> Take Profit Target (+%):
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
                  <Percent size={12} /> Stop Loss Limit (-%):
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

            {/* Dynamic Trailing Stop & Partial TP */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'var(--bg-app)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--accent-sky)', display: 'block', marginBottom: '5px', fontWeight: 700 }}>
                  Trailing Stop (% Drop):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="e.g. 6.0"
                  value={form.trailing_stop_pct || ''}
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
                <label style={{ fontSize: '11px', color: 'var(--accent-amber)', display: 'block', marginBottom: '5px', fontWeight: 700 }}>
                  Partial TP Target (+%):
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g. 25.0"
                  value={form.partial_tp_target || ''}
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
                  Sells 50% at target level
                </span>
              </div>
            </div>

            {/* Security Score & Smart Money Count */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px', fontWeight: 600 }}>
                  <Shield size={12} /> Min. Safety Score (0-100):
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
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px', fontWeight: 600 }}>
                  <Users size={12} /> Min. Whale / Smart Buyers:
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
            </div>

            {/* Min Liquidity & Max Bonding Progress */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px', fontWeight: 600 }}>
                  <DollarSign size={12} /> Min. Liquidity (USD):
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

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-action-secondary"
                style={{ flex: 1, padding: '9px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-action-primary"
                disabled={saving}
                style={{ flex: 2, padding: '9px' }}
              >
                <CheckCircle2 size={14} />
                <span>{saving ? 'Applying...' : 'Save & Apply Config'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
