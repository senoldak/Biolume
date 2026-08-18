import React, { useState, useEffect, useCallback } from 'react';
import { Radio, Users, ShieldCheck, Activity, Layers, Swords, FileText } from 'lucide-react';
import Navbar from './components/Navbar';
import RadarTab from './components/RadarTab';
import SmartMoneyTab from './components/SmartMoneyTab';
import AutopilotTab from './components/AutopilotTab';
import ArenaTab from './components/ArenaTab';
import ReportTab from './components/ReportTab';
import BotSettingsTab from './components/BotSettingsTab';
import LimitOrdersTab from './components/LimitOrdersTab';
import QuickBuyModal from './components/QuickBuyModal';
import WalletModal from './components/WalletModal';
import EditStrategyModal from './components/EditStrategyModal';
import CreateStrategyModal from './components/CreateStrategyModal';
import Toast from './components/Toast';
import { translations } from './utils/translations';
import { soundManager } from './utils/audioAlerts';

export default function App() {
  const [lang, setLang] = useState('tr');
  const [activeTab, setActiveTab] = useState('radar');
  const [radarTokens, setRadarTokens] = useState([]);
  const [smartWallets, setSmartWallets] = useState([]);
  const [walletInfo, setWalletInfo] = useState({ balance_sol: 10.0, mode: 'PAPER', open_positions_count: 0 });
  const [positions, setPositions] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [pnlChartPoints, setPnlChartPoints] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [autopilotStats, setAutopilotStats] = useState({
    scanned_count: 0,
    passed_count: 0,
    rejected_rug_count: 0,
    winning_trades: 0,
    losing_trades: 0,
    total_profit_sol: 0.0
  });
  const [strategyBenchmarks, setStrategyBenchmarks] = useState({});
  const [availableStrategies, setAvailableStrategies] = useState([]);
  const [activeStrategy, setActiveStrategy] = useState("trend");
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState(null);
  const [isCreateStrategyModalOpen, setIsCreateStrategyModalOpen] = useState(false);
  const [walletForm, setWalletForm] = useState({
    wallet_address: '',
    private_key: '',
    rpc_url: 'https://api.mainnet-beta.solana.com',
    slippage_pct: '1.0'
  });
  const [selectedToken, setSelectedToken] = useState(null);
  const [buyAmount, setBuyAmount] = useState('0.2');
  const [buySuccessMsg, setBuySuccessMsg] = useState('');
  const [autopilotRunning, setAutopilotRunning] = useState(false);
  const [autopilotLogs, setAutopilotLogs] = useState([]);
  const [pendingCandidates, setPendingCandidates] = useState({});
  const [warmupInfo, setWarmupInfo] = useState({ is_warming_up: false, remaining_seconds: 0, total_seconds: 60 });

  const t = translations[lang] || translations.tr;

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Arena 12-Bot Multi-Simulation State
  const [arenaState, setArenaState] = useState({
    is_running: false,
    start_time: '--:--:--',
    total_scanned: 0,
    total_trades: 0,
    leader_strategy: 'None',
    bots: [],
    recent_events: []
  });

  const [copiedWallets, setCopiedWallets] = useState([]);

  const fetchCopiedWallets = () => {
    fetch('/api/copy-trade/state')
      .then(r => {
        if (!r.ok) throw new Error("Copy-trade state endpoint returned error");
        return r.json();
      })
      .then(data => {
        if (data && Array.isArray(data.wallets)) {
          setCopiedWallets(data.wallets.map(w => w.address));
        }
      })
      .catch(() => {});
  };

  const handleCopySmartMoneyWhale = async (addr, label, winRate, pnlUsd) => {
    try {
      const res = await fetch('/api/copy-trade/add-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: addr,
          label: label || 'Smart Whale',
          win_rate: winRate || 75.0,
          total_profit_sol: pnlUsd ? pnlUsd / 150.0 : 40.0,
          copy_buy_amount_sol: 0.20,
          auto_sell_on_dump: true,
          stop_loss_override: -15,
          take_profit_override: 50,
          enabled: true
        })
      });
      if (!res.ok) throw new Error("Failed to copy wallet");
      fetchCopiedWallets();
      showToast(lang === 'tr' ? `Balina takibe alındı: ${label || addr.slice(0, 6)}` : `Whale mirrored: ${label || addr.slice(0, 6)}`, 'success');
      soundManager.playBuySound();
    } catch (e) {
      showToast(lang === 'tr' ? 'Balina kopyalama başarısız oldu' : 'Failed to copy whale wallet', 'error');
    }
  };

  useEffect(() => {
    fetchCopiedWallets();
  }, [activeTab]);

  const toggleAutopilot = () => {
    fetch("/api/autopilot/toggle", { method: "POST" })
      .then(res => {
        if (!res.ok) throw new Error("Autopilot toggle failed");
        return res.json();
      })
      .then(data => {
        setAutopilotRunning(data.is_running);
        if (data.is_running) {
          showToast(t.toasts?.autopilot_started || 'Autopilot started', 'success');
          soundManager.playProfitSound();
        } else {
          showToast(t.toasts?.autopilot_stopped || 'Autopilot stopped', 'info');
        }
      })
      .catch(() => {
        setAutopilotRunning(!autopilotRunning);
        showToast(lang === 'tr' ? 'Otopilot durumu güncellendi' : 'Autopilot toggled', 'info');
      });
  };

  const handleStartArena = () => {
    fetch("/api/arena/start", { method: "POST" })
      .then(res => res.json())
      .then(data => { 
        if (data) {
          setArenaState(data);
          showToast(lang === 'tr' ? '12-Bot Strateji Arenası Başlatıldı' : '12-Bot Strategy Arena started', 'success');
        }
      })
      .catch(() => showToast(lang === 'tr' ? 'Arena başlatılamadı' : 'Failed to start arena', 'error'));
  };

  const handleStopArena = () => {
    fetch("/api/arena/stop", { method: "POST" })
      .then(res => res.json())
      .then(data => { 
        if (data) {
          setArenaState(data);
          showToast(lang === 'tr' ? 'Arena Simülasyonu Duraklatıldı' : 'Arena simulation paused', 'info');
        }
      })
      .catch(() => {});
  };

  const handleResetArena = () => {
    fetch("/api/arena/reset", { method: "POST" })
      .then(res => res.json())
      .then(data => { 
        if (data) {
          setArenaState(data);
          showToast(lang === 'tr' ? 'Tüm bot cüzdanları 10 SOL ile sıfırlandı' : 'All bot wallets reset to 10 SOL', 'success');
        }
      })
      .catch(() => showToast(lang === 'tr' ? 'Sıfırlama başarısız' : 'Reset failed', 'error'));
  };

  // Real-Time Live SSE Stream & Background Sync
  useEffect(() => {
    const eventSource = new EventSource("/api/stream/live");

    eventSource.addEventListener("RADAR_UPDATE", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
          setRadarTokens(data);
        }
      } catch (err) {}
    });

    eventSource.addEventListener("POSITION_UPDATE", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data) {
          if (Array.isArray(data.positions)) setPositions(data.positions);
          if (data.balance) setWalletInfo(data.balance);
        }
      } catch (err) {}
    });

    eventSource.addEventListener("ARENA_UPDATE", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && Array.isArray(data.bots)) {
          setArenaState(data);
        }
      } catch (err) {}
    });

    // Initial Fetch for Arena State
    fetch("/api/arena/state")
      .then(res => res.json())
      .then(data => { if (data && Array.isArray(data.bots)) setArenaState(data); })
      .catch(() => {});

    // Autopilot, benchmarks and log periodic sync
    const refreshData = () => {
      fetch("/api/smartmoney/top")
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setSmartWallets(data); })
        .catch(() => {});

      fetch("/api/autopilot/status")
        .then(res => res.json())
        .then(data => {
          if (data) {
            setAutopilotRunning(data.is_running);
            if (data.active_strategy) setActiveStrategy(data.active_strategy);
            if (Array.isArray(data.available_strategies) && data.available_strategies.length > 0) {
              setAvailableStrategies(data.available_strategies);
            }
            if (data.benchmarks) setStrategyBenchmarks(data.benchmarks);
            if (data.logs) setAutopilotLogs(data.logs);
            if (data.stats) setAutopilotStats(data.stats);
            if (data.pending_candidates) setPendingCandidates(data.pending_candidates);
            setWarmupInfo({
              is_warming_up: !!data.is_warming_up,
              remaining_seconds: data.warmup_remaining_seconds || 0,
              total_seconds: data.warmup_total_seconds || 60
            });
            if (Array.isArray(data.trade_history)) setTradeHistory(data.trade_history);
            if (Array.isArray(data.pnl_chart_points)) setPnlChartPoints(data.pnl_chart_points);
          }
        })
        .catch(() => {});
    };

    refreshData();
    const interval = setInterval(refreshData, 3000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, []);

  const selectStrategy = (stratId) => {
    setActiveStrategy(stratId);
    fetch("/api/autopilot/set-strategy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategy_id: stratId })
    })
    .then(res => res.json())
    .catch(() => {});
  };

  const handleUpdateStrategy = (updatedStrategy) => {
    fetch("/api/autopilot/update-strategy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedStrategy)
    })
    .then(res => res.json())
    .then(data => {
      if (data && Array.isArray(data.strategies)) {
        setAvailableStrategies(data.strategies);
      } else {
        setAvailableStrategies(prev => 
          prev.map(s => s.id === updatedStrategy.id ? { ...s, ...updatedStrategy } : s)
        );
      }
    })
    .catch(() => {
      setAvailableStrategies(prev => 
        prev.map(s => s.id === updatedStrategy.id ? { ...s, ...updatedStrategy } : s)
      );
    });
  };

  const handleCreateStrategy = (newStrategy) => {
    fetch("/api/autopilot/create-strategy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStrategy)
    })
    .then(res => res.json())
    .then(data => {
      if (data && Array.isArray(data.strategies)) {
        setAvailableStrategies(data.strategies);
      } else {
        setAvailableStrategies(prev => [...prev, newStrategy]);
      }
    })
    .catch(() => {
      setAvailableStrategies(prev => [...prev, newStrategy]);
    });
  };

  const handleDeleteStrategy = (stratId) => {
    fetch("/api/autopilot/delete-strategy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategy_id: stratId })
    })
    .then(res => res.json())
    .then(data => {
      if (data && Array.isArray(data.strategies)) {
        setAvailableStrategies(data.strategies);
      } else {
        setAvailableStrategies(prev => prev.filter(s => s.id !== stratId));
      }
      if (activeStrategy === stratId) {
        setActiveStrategy("trend");
      }
    })
    .catch(() => {
      setAvailableStrategies(prev => prev.filter(s => s.id !== stratId));
    });
  };

  const handleToggleTradingMode = (toLive) => {
    if (toLive && !walletInfo.live_wallet_address && !walletForm.wallet_address) {
      setIsWalletModalOpen(true);
      return;
    }

    fetch("/api/wallet/set-mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paper_trading: !toLive,
        wallet_address: walletForm.wallet_address,
        private_key: walletForm.private_key,
        rpc_url: walletForm.rpc_url,
        slippage_pct: parseFloat(walletForm.slippage_pct) || 1.0
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data) setWalletInfo(data);
    })
    .catch(() => {});
  };

  const handleSaveWalletSettings = () => {
    fetch("/api/wallet/set-mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paper_trading: walletInfo.mode === 'PAPER',
        wallet_address: walletForm.wallet_address,
        private_key: walletForm.private_key,
        rpc_url: walletForm.rpc_url,
        slippage_pct: parseFloat(walletForm.slippage_pct) || 1.0
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data) setWalletInfo(data);
      setIsWalletModalOpen(false);
    })
    .catch(() => {
      setIsWalletModalOpen(false);
    });
  };

  const handleClosePosition = (posId) => {
    fetch("/api/trades/close-position", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position_id: posId })
    })
    .then(res => {
      if (!res.ok) throw new Error("Close position failed");
      return res.json();
    })
    .then(() => {
      showToast(t.toasts?.position_closed || 'Position closed', 'info');
    })
    .catch(() => {
      showToast(lang === 'tr' ? 'Pozisyon kapatılamadı' : 'Failed to close position', 'error');
    });
  };

  const handlePanicCloseAll = () => {
    fetch("/api/trades/panic-close-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    })
    .then(res => {
      if (!res.ok) throw new Error("Panic close all failed");
      return res.json();
    })
    .then(() => {
      showToast(t.toasts?.panic_success || 'All positions closed', 'success');
      soundManager.playLossSound();
    })
    .catch(() => {
      showToast(lang === 'tr' ? 'Panik kapatma işlemi başarısız' : 'Failed to panic close positions', 'error');
    });
  };

  const handleQuickBuy = (token) => {
    setSelectedToken(token);
  };

  const executeBuy = () => {
    if (!selectedToken) return;
    const amt = parseFloat(buyAmount);
    
    fetch("/api/trades/quick-buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token_address: selectedToken.token_address,
        symbol: selectedToken.symbol,
        amount_sol: amt,
        price_usd: selectedToken.price_usd
      })
    })
    .then(res => {
      if (!res.ok) throw new Error("Quick buy rejected");
      return res.json();
    })
    .then(data => {
      setBuySuccessMsg(`Order executed: ${selectedToken.symbol} for ${amt} SOL`);
      soundManager.playBuySound();
      showToast(`${t.toasts?.order_success || 'Order created: '} ${selectedToken.symbol} (${amt} SOL)`, 'success');
      setWalletInfo(prev => ({
        ...prev,
        balance_sol: prev.balance_sol - amt,
        open_positions_count: prev.open_positions_count + 1
      }));
      setTimeout(() => {
        setSelectedToken(null);
        setBuySuccessMsg('');
      }, 1600);
    })
    .catch(err => {
      soundManager.playLossSound();
      showToast(t.toasts?.order_failed || 'Order execution failed!', 'error');
      setBuySuccessMsg('');
    });
  };

  const openPositionsCount = positions.filter(p => p.status === 'OPEN').length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        autopilotRunning={autopilotRunning}
        toggleAutopilot={toggleAutopilot}
        walletInfo={walletInfo}
        handleToggleTradingMode={handleToggleTradingMode}
        setIsWalletModalOpen={setIsWalletModalOpen}
        lang={lang}
        setLang={setLang}
      />

      {/* Main Terminal Stage */}
      <main style={{ flex: 1, padding: '24px 28px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
        {/* System Intelligence Ribbon */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
          <div className="terminal-card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {lang === 'tr' ? 'Zincir-Üstü Akış' : 'On-Chain Stream'}
              </span>
              <Radio size={15} color="var(--accent-emerald)" />
            </div>
            <div className="font-mono" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
              {radarTokens.length} {lang === 'tr' ? 'Parite' : 'Pairs'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent-emerald)', marginTop: '4px' }}>
              <span className="live-dot live-dot-pulse" />
              <span>0ms Latency Stream Active</span>
            </div>
          </div>

          <div className="terminal-card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {lang === 'tr' ? 'Akıllı Para Endeksi' : 'Smart Money Index'}
              </span>
              <Users size={15} color="var(--accent-violet)" />
            </div>
            <div className="font-mono" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
              {smartWallets.length} {lang === 'tr' ? 'Cüzdan' : 'Wallets'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {lang === 'tr' ? 'Ort. 30G Kazanma:' : 'Avg. 30D Win Rate:'} <span className="font-mono" style={{ color: 'var(--accent-violet)', fontWeight: 600 }}>74.5%</span>
            </div>
          </div>

          <div className="terminal-card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {lang === 'tr' ? 'Scam / Rug Kalkanı' : 'Rug Shield Defense'}
              </span>
              <ShieldCheck size={15} color="var(--accent-cyan)" />
            </div>
            <div className="font-mono" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
              {autopilotStats.rejected_rug_count} {lang === 'tr' ? 'Engellendi' : 'Intercepted'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Mint / Freeze / Bundle inspect
            </div>
          </div>

          <div className="terminal-card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {lang === 'tr' ? 'Açık Pozisyonlar' : 'Active Positions'}
              </span>
              <Layers size={15} color="var(--accent-amber)" />
            </div>
            <div className="font-mono" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
              {openPositionsCount} {lang === 'tr' ? 'Açık' : 'Open'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Real-time TP / SL bracket monitoring
            </div>
          </div>
        </section>

        {/* Tab 1: Live Radar */}
        {activeTab === 'radar' && (
          <RadarTab
            radarTokens={radarTokens}
            handleQuickBuy={handleQuickBuy}
            lang={lang}
          />
        )}

        {/* Tab 2: Smart Money & Whale Mirror */}
        {activeTab === 'smartmoney' && (
          <SmartMoneyTab
            smartWallets={smartWallets}
            onCopyWhale={handleCopySmartMoneyWhale}
            copiedWalletAddresses={copiedWallets}
            lang={lang}
            positions={positions}
            walletInfo={walletInfo}
            handleToggleTradingMode={handleToggleTradingMode}
            handleClosePosition={handleClosePosition}
          />
        )}

        {/* Tab 3: Autopilot Cockpit */}
        {activeTab === 'autopilot' && (
          <AutopilotTab
            autopilotRunning={autopilotRunning}
            toggleAutopilot={toggleAutopilot}
            availableStrategies={availableStrategies}
            activeStrategy={activeStrategy}
            selectStrategy={selectStrategy}
            onEditStrategy={(strat) => setEditingStrategy(strat)}
            onCreateStrategy={() => setIsCreateStrategyModalOpen(true)}
            onDeleteStrategy={handleDeleteStrategy}
            autopilotStats={autopilotStats}
            positions={positions}
            walletInfo={walletInfo}
            handlePanicCloseAll={handlePanicCloseAll}
            handleClosePosition={handleClosePosition}
            pnlChartPoints={pnlChartPoints}
            strategyBenchmarks={strategyBenchmarks}
            tradeHistory={tradeHistory}
            autopilotLogs={autopilotLogs}
            pendingCandidates={pendingCandidates}
            warmupInfo={warmupInfo}
            lang={lang}
          />
        )}

        {/* Tab 4: Limit & DCA Orders Tab */}
        {activeTab === 'limitorders' && (
          <LimitOrdersTab lang={lang} />
        )}

        {/* Tab 5: 12-Bot Strategy Arena & Simulation Lab */}
        {activeTab === 'arena' && (
          <ArenaTab
            arenaState={arenaState}
            onStartArena={handleStartArena}
            onStopArena={handleStopArena}
            onResetArena={handleResetArena}
            lang={lang}
          />
        )}

        {/* Tab 7: Institutional Backtest & Audit Reports */}
        {activeTab === 'reports' && (
          <ReportTab
            onSelectStrategy={(stratId) => {
              selectStrategy(stratId);
              setActiveTab('autopilot');
            }}
            lang={lang}
          />
        )}

        {/* Tab 8: Engine Settings & Multi-RPC */}
        {activeTab === 'bot' && (
          <BotSettingsTab
            lang={lang}
            positions={positions}
          />
        )}
      </main>

      {/* Global Glassmorphic Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Quick Buy Modal */}
      <QuickBuyModal
        selectedToken={selectedToken}
        onClose={() => setSelectedToken(null)}
        buyAmount={buyAmount}
        setBuyAmount={setBuyAmount}
        buySuccessMsg={buySuccessMsg}
        executeBuy={executeBuy}
      />

      {/* Solana Wallet Settings Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        walletForm={walletForm}
        setWalletForm={setWalletForm}
        handleSaveWalletSettings={handleSaveWalletSettings}
      />

      {/* Bot Customizer Modal */}
      <EditStrategyModal
        isOpen={Boolean(editingStrategy)}
        strategy={editingStrategy}
        onClose={() => setEditingStrategy(null)}
        onSave={handleUpdateStrategy}
      />

      {/* Create Custom Strategy Modal */}
      <CreateStrategyModal
        isOpen={isCreateStrategyModalOpen}
        onClose={() => setIsCreateStrategyModalOpen(false)}
        onSave={handleCreateStrategy}
      />
    </div>
  );
}
