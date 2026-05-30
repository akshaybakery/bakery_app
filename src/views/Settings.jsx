import React from 'react';
import { useLiveState } from '../context/StateContext';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  RefreshCw, 
  Trash2, 
  Download, 
  ShieldAlert, 
  Key, 
  Store,
  Database
} from 'lucide-react';

export default function Settings({ theme, onToggleTheme }) {
  const { state, syncStatus, resetDatabase, fetchLiveState } = useLiveState();
  const { serverUrl, updateServerUrl } = useAuth();

  // Handle system database reset
  const handleResetDatabase = async () => {
    const confirm = window.confirm(
      '🚨 WARNING: This will permanently wipe all operational logs (Daily Entries, Orders, Bookings, Ledgers) from the LIVE SERVER. This action cannot be undone. \n\nAre you absolutely sure you want to reset?'
    );
    if (!confirm) return;

    // Standard pre-seeded schema
    const defaultSchema = {
      _version: 5,
      shops: [
        { id: 0, name: 'Highway Branch', code: 'highway' },
        { id: 1, name: 'Mainroad Branch', code: 'mainroad' }
      ],
      vendors: [
        { id: 'v1', name: 'Sri Flour Mills', phone: '9876543210', address: 'Industrial Area', is_active: true },
        { id: 'v2', name: 'Amul Dairy', phone: '9876543211', address: 'Dairy Road', is_active: true },
        { id: 'v3', name: 'Sugar World', phone: '9876543212', address: 'Market St', is_active: true },
        { id: 'v4', name: 'Fresh Eggs Farm', phone: '9876543213', address: 'Farm Lane', is_active: true },
        { id: 'v5', name: 'Spice Paradise', phone: '9876543214', address: 'Spice Market', is_active: true },
        { id: 'v6', name: 'Oil & Ghee Traders', phone: '9876543215', address: 'Wholesale Market', is_active: true },
        { id: 'v7', name: 'Packaging Plus', phone: '9876543216', address: 'Industrial Park', is_active: true },
        { id: 'v8', name: 'Cocoa & Cream Supplies', phone: '9876543217', address: 'Baker Street', is_active: true }
      ],
      staff: [
        { id: 'staff-owner', name: 'Akshay', role: 'owner', shopId: null, shop_id: null, shop_code: null, pin: '7736' },
        { id: 'staff-highway', name: 'Highway Teamlead', role: 'highway_staff', shopId: 0, shop_id: 'shop-highway', shop_code: 'highway', pin: '1234' },
        { id: 'staff-mainroad', name: 'Mainroad Teamlead', role: 'mainroad_staff', shopId: 1, shop_id: 'shop-mainroad', shop_code: 'mainroad', pin: '1234' },
        { id: 'staff-production', name: 'Production Staff', role: 'production', shopId: null, shop_id: null, shop_code: null, pin: '1234' },
        { id: 'staff-ordering', name: 'Ordering Staff', role: 'ordering', shopId: null, shop_id: null, shop_code: null, pin: '1234' },
        { id: 'staff-driver', name: 'Driver', role: 'driver', shopId: null, shop_id: null, shop_code: null, pin: '1234' }
      ],
      dailyEntries: [],
      expenses: [],
      orders: [],
      customerOrders: [],
      goodsInward: [],
      marketPurchases: [],
      wastage: [],
      rawMaterials: [],
      recipes: [
        { id: 'r1', name: 'Premium White Bread', yield_quantity: 10, yield_unit: 'Loaves', ingredients: [
          { name: 'Maida (Flour)', quantity: 3000, unit: 'g' },
          { name: 'Yeast', quantity: 60, unit: 'g' },
          { name: 'Sugar', quantity: 120, unit: 'g' },
          { name: 'Water', quantity: 1800, unit: 'ml' },
          { name: 'Salt', quantity: 45, unit: 'g' },
          { name: 'Butter', quantity: 150, unit: 'g' }
        ] },
        { id: 'r2', name: 'Chocolate Truffle Cake', yield_quantity: 4, yield_unit: 'kg', ingredients: [
          { name: 'Dark Chocolate', quantity: 1200, unit: 'g' },
          { name: 'Fresh Cream', quantity: 800, unit: 'ml' },
          { name: 'Cake Pre-mix', quantity: 1500, unit: 'g' },
          { name: 'Butter', quantity: 400, unit: 'g' },
          { name: 'Eggs', quantity: 12, unit: 'pcs' }
        ] },
        { id: 'r3', name: 'Butter Croissants', yield_quantity: 20, yield_unit: 'Pcs', ingredients: [
          { name: 'Maida (Flour)', quantity: 2000, unit: 'g' },
          { name: 'Butter (Lamination)', quantity: 1000, unit: 'g' },
          { name: 'Sugar', quantity: 200, unit: 'g' },
          { name: 'Yeast', quantity: 50, unit: 'g' },
          { name: 'Milk', quantity: 800, unit: 'ml' }
        ] }
      ],
      productionBatches: [],
      ledger: [],
      stockItems: [
        { id: 's1', name: 'Maida (Flour)', quantity: 120000, unit: 'g', min_threshold: 25000 },
        { id: 's2', name: 'Sugar', quantity: 45000, unit: 'g', min_threshold: 10000 },
        { id: 's3', name: 'Butter', quantity: 15000, unit: 'g', min_threshold: 5000 },
        { id: 's4', name: 'Yeast', quantity: 2500, unit: 'g', min_threshold: 1000 },
        { id: 's5', name: 'Dark Chocolate', quantity: 8000, unit: 'g', min_threshold: 3000 },
        { id: 's6', name: 'Fresh Cream', quantity: 12000, unit: 'ml', min_threshold: 4000 },
        { id: 's7', name: 'Eggs', quantity: 120, unit: 'pcs', min_threshold: 36 }
      ],
      stockTransactions: [],
      masterItems: [
        { id: 'm1', name: 'Premium White Bread', category: 'Bread', price: 45 },
        { id: 'm2', name: 'Brown Wheat Bread', category: 'Bread', price: 50 },
        { id: 'm3', name: 'Chocolate Truffle Cake', category: 'Cake', price: 650 },
        { id: 'm4', name: 'Black Forest Cake', category: 'Cake', price: 550 },
        { id: 'm5', name: 'Butter Croissants', category: 'Pastry', price: 60 },
        { id: 'm6', name: 'Veg Puff', category: 'Savory', price: 20 },
        { id: 'm7', name: 'Sweet Buns (Pack)', category: 'Bun', price: 30}
      ],
      savedProductNames: [],
      savedIngredientNames: []
    };

    try {
      await resetDatabase(defaultSchema);
      alert('Live server database has been fully wiped and reset to clean defaults.');
    } catch (err) {
      alert('Reset failed: ' + err.message);
    }
  };

  // Export database to browser download
  const handleDownloadBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bakery_store_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div style={{ width: '100%', animation: 'fade-in 0.3s ease-out' }}>
      
      {/* Title */}
      <div className="page-header-row">
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-title)' }}>⚙️ System Settings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configure themes, view credentials, and run server database backups</p>
        </div>
      </div>

      <div className="responsive-grid-2">
        
        {/* Left Side: System Information & Backups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Live Data Statistics */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-title)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={18} style={{ color: 'var(--primary)' }} /> Live Data Inventory
            </h3>
            
            <div className="responsive-grid-2" style={{ gap: '1rem', fontSize: '0.9rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Daily Sales Entries</span>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.15rem', color: '#fff' }}>{state.dailyEntries?.length || 0} Logs</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Branch Requisitions</span>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.15rem', color: '#fff' }}>{state.orders?.length || 0} Orders</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Advance Cake Bookings</span>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.15rem', color: '#fff' }}>{state.customerOrders?.length || 0} Bookings</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Live Server Connection</span>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', marginTop: '0.15rem', color: syncStatus === 'live' ? 'var(--primary)' : 'var(--danger)', textTransform: 'uppercase' }}>
                  {syncStatus.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Backup & System Reset Panel */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-title)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
              <ShieldAlert size={18} /> Danger Zone & Administrative Backups
            </h3>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Create full database offline exports, force live-sync updates, or perform server storage formatting.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDownloadBackup}
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                <Download size={16} style={{ color: 'var(--primary)' }} /> Download Offline JSON Backup
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fetchLiveState()}
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                <RefreshCw size={16} style={{ color: 'var(--secondary)' }} /> Force Re-Sync live server database
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={handleResetDatabase}
                style={{ width: '100%', justifyContent: 'flex-start', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', boxShadow: 'none' }}
              >
                <Trash2 size={16} /> Wipe all Live Logs & Reset Database
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Credentials Reference & UI Config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* PIN Credentials Directory */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-title)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={18} style={{ color: 'var(--accent)' }} /> Operational Security PIN Directory
            </h3>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Staff logging pins pre-seeded in the database for demonstration and access:
            </p>

            <div className="table-container">
              <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Assigned Role</th>
                    <th>Security PIN</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: '600' }}>Akshay (Owner)</td>
                    <td style={{ color: 'var(--primary)', fontWeight: '600' }}>owner</td>
                    <td style={{ fontWeight: '700', color: 'var(--accent)' }}>7736</td>
                  </tr>
                  <tr>
                    <td>Highway Teamlead</td>
                    <td style={{ color: 'var(--secondary)' }}>highway_staff</td>
                    <td style={{ fontWeight: '600' }}>1234</td>
                  </tr>
                  <tr>
                    <td>Mainroad Teamlead</td>
                    <td style={{ color: 'var(--secondary)' }}>mainroad_staff</td>
                    <td style={{ fontWeight: '600' }}>1234</td>
                  </tr>
                  <tr>
                    <td>Production Staff</td>
                    <td style={{ color: '#c084fc' }}>production</td>
                    <td style={{ fontWeight: '600' }}>1234</td>
                  </tr>
                  <tr>
                    <td>Ordering Staff</td>
                    <td style={{ color: '#fca5a5' }}>ordering</td>
                    <td style={{ fontWeight: '600' }}>1234</td>
                  </tr>
                  <tr>
                    <td>Driver</td>
                    <td style={{ color: 'var(--text-muted)' }}>driver</td>
                    <td style={{ fontWeight: '600' }}>1234</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Theme Preferences */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-title)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Store size={18} /> UI Display Preferences
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Active Screen Theme Mode</span>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onToggleTheme}
                style={{ fontSize: '0.85rem' }}
              >
                {theme === 'dark' ? '🌙 Switch to Light Theme' : '☀️ Switch to Dark Theme'}
              </button>
            </div>
          </div>

          {/* Mobile Server Sync settings */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-title)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={18} style={{ color: 'var(--primary)' }} /> Mobile App Sync Settings
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Point your staff's Android app to your live Express backend server URL:
            </p>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => updateServerUrl(e.target.value)}
                placeholder="e.g. http://192.168.1.100:5000 or https://my-bakery-api.com"
                className="form-input"
                style={{ fontSize: '0.85rem' }}
              />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Note: Updates take effect immediately. Keep blank to use default browser proxy address.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
