import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  CookingPot, 
  ArrowLeftRight, 
  CalendarDays, 
  Users, 
  Trash2, 
  Settings, 
  LogOut, 
  X, 
  Menu
} from 'lucide-react';

export default function Sidebar({ activeView, setActiveView, role, isOpen, setIsOpen, onLogout }) {
  // Navigation mapping by role
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner'] },
    { id: 'daily-entry', label: 'Daily Entry', icon: ClipboardList, roles: ['owner', 'highway_staff', 'mainroad_staff'] },
    { id: 'production', label: 'Production & Recipes', icon: CookingPot, roles: ['owner', 'production'] },
    { id: 'orders', label: 'Branch Orders', icon: ArrowLeftRight, roles: ['owner', 'highway_staff', 'mainroad_staff', 'ordering'] },
    { id: 'customer-orders', label: 'Customer Bookings', icon: CalendarDays, roles: ['owner', 'highway_staff', 'mainroad_staff', 'ordering'] },
    { id: 'vendors', label: 'Vendors & Ledgers', icon: Users, roles: ['owner'] },
    { id: 'wastage', label: 'Wastage Tracker', icon: Trash2, roles: ['owner', 'highway_staff', 'mainroad_staff', 'production'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['owner'] }
  ];

  // Filter items that match the user's role
  const filteredItems = navItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 95,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.6rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.8rem' }}>🥖</span> Akshay Bakery
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Operations Shell
            </p>
          </div>
          <button 
            className="menu-btn" 
            onClick={() => setIsOpen(false)}
            style={{ padding: '0.25rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <nav style={{ flex: 1 }}>
          {filteredItems.map(item => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`nav-link ${activeView === item.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveView(item.id);
                  setIsOpen(false);
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: 'auto' }}>
          <button
            onClick={onLogout}
            className="nav-link"
            style={{ 
              width: '100%', 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              textAlign: 'left',
              color: 'var(--danger)',
              marginBottom: 0
            }}
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
