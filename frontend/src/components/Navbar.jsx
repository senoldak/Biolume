import React from 'react';
import { 
  Radio, 
  Users, 
  Cpu, 
  Sliders, 
  Wallet, 
  Activity, 
  ShieldCheck, 
  Zap, 
  Swords, 
  FileText,
  Globe
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  autopilotRunning,
  toggleAutopilot,
  walletInfo,
  handleToggleTradingMode,
  setIsWalletModalOpen,
  lang = 'tr',
  setLang
}) {
  const tabs = [
    { id: 'radar', label: lang === 'tr' ? 'Canlı Radar' : 'Live Radar', icon: Radio, accent: 'var(--accent-emerald)' },
    { id: 'smartmoney', label: lang === 'tr' ? 'Balina Kopyalama' : 'Whale Mirror', icon: Users, accent: 'var(--accent-violet)' },
    { id: 'autopilot', label: lang === 'tr' ? 'Otopilot' : 'Autopilot', icon: Cpu, accent: 'var(--accent-cyan)' },
    { id: 'limitorders', label: lang === 'tr' ? 'Limit Emirleri' : 'Limit Orders', icon: Activity, accent: 'var(--accent-cyan)' },
    { id: 'arena', label: lang === 'tr' ? 'Strateji Arenası' : 'Arena', icon: Swords, accent: 'var(--accent-amber)' },
    { id: 'reports', label: lang === 'tr' ? 'Raporlar' : 'Reports', icon: FileText, accent: 'var(--accent-emerald)' },
    { id: 'bot', label: lang === 'tr' ? 'Ayarlar' : 'Settings', icon: Sliders, accent: 'var(--accent-sky)' }
  ];

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 24px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'linear-gradient(180deg, rgba(16, 22, 34, 0.95) 0%, rgba(11, 15, 23, 0.98) 100%)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)'
    }}>
      {/* Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
          width: '34px',
          height: '34px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(6, 182, 212, 0.35)'
        }}>
          <Activity size={18} color="#04141d" strokeWidth={2.8} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              BIOLUME
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: 800,
              color: 'var(--accent-cyan)',
              background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.28)',
              padding: '1px 5px',
              borderRadius: '4px'
            }}>
              v2.0
            </span>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '0px' }}>
            Solana Intelligence
          </p>
        </div>
      </div>

      {/* Navigation Tabs (Centrally aligned & polished) */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        background: 'rgba(7, 9, 14, 0.75)',
        border: '1px solid var(--border-subtle)',
        padding: '3px',
        borderRadius: '10px'
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: isActive ? 700 : 500,
                fontSize: '11.5px',
                background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
            >
              <Icon size={14} color={isActive ? tab.accent : 'var(--text-muted)'} />
              <span>{tab.label}</span>
              {tab.id === 'autopilot' && autopilotRunning && (
                <span className="live-dot live-dot-pulse" style={{ marginLeft: '2px' }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Action Hub & Quick Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Language Switcher Button */}
        <div style={{
          display: 'flex',
          background: 'rgba(7, 9, 14, 0.75)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '7px',
          padding: '2px'
        }}>
          <button
            onClick={() => setLang && setLang('tr')}
            style={{
              border: 'none',
              borderRadius: '5px',
              padding: '4px 7px',
              fontSize: '10.5px',
              fontWeight: 800,
              cursor: 'pointer',
              background: lang === 'tr' ? 'var(--accent-cyan-subtle)' : 'transparent',
              color: lang === 'tr' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            TR
          </button>
          <button
            onClick={() => setLang && setLang('en')}
            style={{
              border: 'none',
              borderRadius: '5px',
              padding: '4px 7px',
              fontSize: '10.5px',
              fontWeight: 800,
              cursor: 'pointer',
              background: lang === 'en' ? 'var(--accent-cyan-subtle)' : 'transparent',
              color: lang === 'en' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            EN
          </button>
        </div>

        {/* Mode Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(7, 9, 14, 0.75)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '7px',
          padding: '2px'
        }}>
          <button
            onClick={() => handleToggleTradingMode(false)}
            style={{
              border: 'none',
              borderRadius: '5px',
              padding: '4px 8px',
              fontSize: '10.5px',
              fontWeight: 700,
              cursor: 'pointer',
              background: walletInfo.mode === 'PAPER' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: walletInfo.mode === 'PAPER' ? 'var(--accent-sky)' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            SIM
          </button>
          <button
            onClick={() => handleToggleTradingMode(true)}
            style={{
              border: 'none',
              borderRadius: '5px',
              padding: '4px 8px',
              fontSize: '10.5px',
              fontWeight: 700,
              cursor: 'pointer',
              background: walletInfo.mode === 'LIVE' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: walletInfo.mode === 'LIVE' ? 'var(--accent-emerald)' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            LIVE
          </button>
        </div>

        {/* Wallet Balance Widget */}
        <div 
          onClick={() => setIsWalletModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            background: 'rgba(16, 22, 34, 0.85)',
            border: '1px solid var(--border-default)',
            padding: '5px 10px',
            borderRadius: '7px',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease'
          }}
          title="Wallet Config"
        >
          <Wallet size={14} color="var(--accent-emerald)" />
          <span className="font-mono" style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {(walletInfo.balance_sol || 0).toFixed(2)} SOL
          </span>
        </div>

        {/* Quick Autopilot Toggle Switch */}
        <button
          onClick={toggleAutopilot}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 12px',
            borderRadius: '7px',
            border: autopilotRunning ? '1px solid var(--accent-rose-border)' : '1px solid var(--accent-emerald-border)',
            background: autopilotRunning ? 'var(--accent-rose-subtle)' : 'var(--accent-emerald-subtle)',
            color: autopilotRunning ? 'var(--accent-rose)' : 'var(--accent-emerald)',
            fontSize: '11.5px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Zap size={13} />
          <span>{autopilotRunning ? (lang === 'tr' ? 'Durdur' : 'Stop') : (lang === 'tr' ? 'Otopilot' : 'Start')}</span>
        </button>
      </div>
    </header>
  );
}
