import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useLiveState } from './context/StateContext';

// Import shell components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Import views
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import DailyEntry from './views/DailyEntry';
import Production from './views/Production';
import Orders from './views/Orders';
import CustomerOrders from './views/CustomerOrders';
import Vendors from './views/Vendors';
import Wastage from './views/Wastage';
import Settings from './views/Settings';

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const { loading: stateLoading } = useLiveState();
  
  const [activeView, setActiveView] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    // Default to dark, or load from localStorage theme key
    return localStorage.getItem('bakery_theme') || 'dark';
  });

  // Toggle Theme mode
  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('bakery_theme', nextTheme);
  };

  // Sync theme attribute with document body
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle default landing view based on user role when logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'owner') {
        setActiveView('dashboard');
      } else if (user.role === 'highway_staff' || user.role === 'mainroad_staff') {
        setActiveView('daily-entry');
      } else if (user.role === 'production') {
        setActiveView('production');
      } else {
        setActiveView('orders');
      }
    }
  }, [user]);

  // Loading skeleton state
  if (authLoading || (user && stateLoading)) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #0c3a2d 0%, #051914 100%)',
        color: '#fff',
        gap: '1rem',
        fontFamily: 'var(--font-body)'
      }}>
        <img 
          src="/logo_icon.png" 
          alt="Akshay Bakery" 
          className="brand-logo-icon animate-pulse" 
          style={{ 
            height: '64px', 
            width: 'auto', 
            marginBottom: '0.5rem'
          }} 
        />
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: '600' }}>Loading Operational Database...</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Checking live server sync</p>
        
        {/* CSS Animations */}
        <style dangerouslySetInnerHTML={{__html: `
          .animate-pulse {
            animation: pulse 1.8s infinite ease-in-out;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.6; transform: scale(0.95); }
            50% { opacity: 1; transform: scale(1.05); }
          }
        `}} />
      </div>
    );
  }

  // Not Authenticated -> show Lockscreen
  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-container">
      {/* Floating Glass Sidebar */}
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        role={user.role} 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onLogout={logout}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Header 
          user={user} 
          onToggleSidebar={() => setSidebarOpen(prev => !prev)} 
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        <main style={{ padding: '2rem 0' }}>
          {activeView === 'dashboard' && user.role === 'owner' && <Dashboard />}
          
          {(activeView === 'daily-entry' && 
            ['owner', 'highway_staff', 'mainroad_staff'].includes(user.role)) && (
              <DailyEntry />
          )}

          {(activeView === 'production' && 
            ['owner', 'production'].includes(user.role)) && (
              <Production />
          )}

          {activeView === 'orders' && <Orders />}

          {activeView === 'customer-orders' && <CustomerOrders />}

          {activeView === 'vendors' && user.role === 'owner' && <Vendors />}

          {activeView === 'wastage' && <Wastage />}

          {activeView === 'settings' && user.role === 'owner' && (
            <Settings theme={theme} onToggleTheme={handleToggleTheme} />
          )}
        </main>
      </div>
    </div>
  );
}
