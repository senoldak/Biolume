import React, { useState, useEffect } from 'react';
import { Activity, Plus, Trash2, ArrowDownRight, ArrowUpRight, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../utils/audioAlerts';

export default function LimitOrdersTab({ lang = 'tr' }) {
  const [orders, setOrders] = useState([]);
  const [newOrder, setNewOrder] = useState({
    token_address: '',
    symbol: '',
    order_type: 'LIMIT_BUY',
    target_price_usd: '',
    amount_sol: '0.25'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/orders/limit');
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!newOrder.token_address || !newOrder.target_price_usd) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_address: newOrder.token_address,
          symbol: newOrder.symbol ? newOrder.symbol.toUpperCase() : 'TOKEN',
          order_type: newOrder.order_type,
          target_price_usd: parseFloat(newOrder.target_price_usd),
          amount_sol: parseFloat(newOrder.amount_sol)
        })
      });
      const data = await res.json();
      if (data) {
        soundManager.playBuySound();
        setSuccessMsg(lang === 'tr' ? 'Emir başarıyla oluşturuldu!' : 'Order created successfully!');
        setNewOrder({
          token_address: '',
          symbol: '',
          order_type: 'LIMIT_BUY',
          target_price_usd: '',
          amount_sol: '0.25'
        });
        loadOrders();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId })
      });
      loadOrders();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Info */}
      <div className="terminal-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--accent-cyan)" />
              <h2 style={{ fontSize: '16px', fontWeight: 800 }}>
                {lang === 'tr' ? 'Limit & DCA Emir İstasyonu' : 'Limit & DCA Order Station'}
              </h2>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {lang === 'tr' 
                ? 'Belirlediğiniz dip fiyattan otomatik alım yapın veya tepe fiyatta kar realizasyonu gerçekleştirin.' 
                : 'Set automated buy triggers at support dips or lock in profits at target peaks.'}
            </p>
          </div>
          <span className="badge badge-cyan font-mono" style={{ fontSize: '11px' }}>
            {orders.length} {lang === 'tr' ? 'Aktif Emir' : 'Active Orders'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px' }}>
        {/* Create Order Form */}
        <div className="terminal-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} color="var(--accent-emerald)" />
            {lang === 'tr' ? 'Yeni Limit Emir Gir' : 'Create New Limit Order'}
          </h3>

          <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                {lang === 'tr' ? 'Emir Tipi' : 'Order Type'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setNewOrder({ ...newOrder, order_type: 'LIMIT_BUY' })}
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: newOrder.order_type === 'LIMIT_BUY' ? '1px solid var(--accent-emerald-border)' : '1px solid var(--border-default)',
                    background: newOrder.order_type === 'LIMIT_BUY' ? 'var(--accent-emerald-subtle)' : 'var(--bg-app)',
                    color: newOrder.order_type === 'LIMIT_BUY' ? 'var(--accent-emerald)' : 'var(--text-secondary)'
                  }}
                >
                  🟢 {lang === 'tr' ? 'Limit Alış' : 'Limit Buy'}
                </button>
                <button
                  type="button"
                  onClick={() => setNewOrder({ ...newOrder, order_type: 'LIMIT_SELL' })}
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: newOrder.order_type === 'LIMIT_SELL' ? '1px solid var(--accent-rose-border)' : '1px solid var(--border-default)',
                    background: newOrder.order_type === 'LIMIT_SELL' ? 'var(--accent-rose-subtle)' : 'var(--bg-app)',
                    color: newOrder.order_type === 'LIMIT_SELL' ? 'var(--accent-rose)' : 'var(--text-secondary)'
                  }}
                >
                  🔴 {lang === 'tr' ? 'Limit Satış' : 'Limit Sell'}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                {lang === 'tr' ? 'Token Kontrat Adresi' : 'Token Mint Address'}
              </label>
              <input
                type="text"
                placeholder="e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
                value={newOrder.token_address}
                onChange={(e) => setNewOrder({ ...newOrder, token_address: e.target.value })}
                required
                style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  {lang === 'tr' ? 'Sembol (Opsiyonel)' : 'Symbol'}
                </label>
                <input
                  type="text"
                  placeholder="BONK"
                  value={newOrder.symbol}
                  onChange={(e) => setNewOrder({ ...newOrder, symbol: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', fontSize: '12px', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  {lang === 'tr' ? 'Miktar (SOL)' : 'Size (SOL)'}
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={newOrder.amount_sol}
                  onChange={(e) => setNewOrder({ ...newOrder, amount_sol: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                {lang === 'tr' ? 'Hedef Tetikleme Fiyatı ($)' : 'Target Trigger Price ($)'}
              </label>
              <input
                type="number"
                step="0.000001"
                placeholder="0.000250"
                value={newOrder.target_price_usd}
                onChange={(e) => setNewOrder({ ...newOrder, target_price_usd: e.target.value })}
                required
                style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}
              />
            </div>

            {successMsg && (
              <div style={{ color: 'var(--accent-emerald)', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={13} />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-action-primary"
              style={{ marginTop: '8px', padding: '10px', fontSize: '12px', width: '100%' }}
            >
              <Plus size={14} />
              <span>{isSubmitting ? (lang === 'tr' ? 'Ekleniyor...' : 'Submitting...') : (lang === 'tr' ? 'Emri Aktifleştir' : 'Arm Limit Order')}</span>
            </button>
          </form>
        </div>

        {/* Active Orders List */}
        <div className="terminal-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>
            {lang === 'tr' ? 'Bekleyen Limit & Tetik Emirleri' : 'Pending & Trigger Orders'} ({orders.length})
          </h3>

          {orders.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
              {lang === 'tr' ? 'Aktif bekleyen emir bulunmuyor. Soldaki formdan limit alış veya satış emri kurabilirsiniz.' : 'No active limit orders. Create one using the form on the left.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {orders.map((o, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-1)',
                    border: '1px solid var(--border-default)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 800,
                      background: o.order_type === 'LIMIT_BUY' ? 'var(--accent-emerald-subtle)' : 'var(--accent-rose-subtle)',
                      color: o.order_type === 'LIMIT_BUY' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                      border: o.order_type === 'LIMIT_BUY' ? '1px solid var(--accent-emerald-border)' : '1px solid var(--accent-rose-border)'
                    }}>
                      {o.order_type}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>
                        ${o.symbol} <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({o.token_address ? `${o.token_address.slice(0, 6)}...${o.token_address.slice(-4)}` : ''})</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {lang === 'tr' ? 'Tetikleme:' : 'Trigger:'} <span className="font-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>${o.target_price_usd}</span> | {lang === 'tr' ? 'Büyüklük:' : 'Size:'} <span className="font-mono">{o.amount_sol} SOL</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancelOrder(o.id)}
                    className="btn-action-danger"
                    style={{ fontSize: '11px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={12} />
                    <span>{lang === 'tr' ? 'İptal Et' : 'Cancel'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
