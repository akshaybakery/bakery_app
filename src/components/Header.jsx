import React from 'react';
import { Menu, Wifi, WifiOff, RefreshCw, Sun, Moon } from 'lucide-react';
import { useLiveState } from '../context/StateContext';

export default function Header({ user, onToggleSidebar, theme, onToggleTheme }) {
  const { syncStatus } = useLiveState();

  // Helper to format role names cleanly
  const formatRole = (role) => {
    if (!role) return '';
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <header className="app-header glass-panel" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          className="menu-btn" 
          onClick={onToggleSidebar}
          style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'rgba(255,255,255,0.02)' }}
        >
          <Menu size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-title)' }}>
            Welcome, {user?.name || 'Staff'}
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Role: <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{formatRole(user?.role)}</span>
            {user?.shop_code && ` | Shop: ${user.shop_code.toUpperCase()}`}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Sync / Live Status Badge */}
        <div>
          {syncStatus === 'live' && (
            <span className="status-badge live">
              <Wifi size={14} /> Live
            </span>
          )}
          {syncStatus === 'syncing' && (
            <span className="status-badge syncing">
              <RefreshCw size={14} className="spin" style={{ animation: 'spin 1.5s infinite linear' }} /> Syncing
            </span>
          )}
          {syncStatus === 'offline' && (
            <span className="status-badge offline">
              <WifiOff size={14} /> Offline
            </span>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            transition: 'var(--transition-fast)'
          }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
