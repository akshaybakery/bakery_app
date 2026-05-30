import React, { useState, useMemo } from 'react';
import { useLiveState } from '../context/StateContext';
import { 
  TrendingUp, 
  IndianRupee, 
  Trash2, 
  Calendar, 
  AlertTriangle, 
  Store, 
  ShoppingBag,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';

export default function Dashboard() {
  const { state } = useLiveState();
  const [shopFilter, setShopFilter] = useState('all'); // 'all', '0' (highway), '1' (mainroad)

  // 1. Filter daily entries and records based on active shop filter
  const filteredEntries = useMemo(() => {
    if (shopFilter === 'all') return state.dailyEntries;
    return state.dailyEntries.filter(e => String(e.shop_id) === shopFilter);
  }, [state.dailyEntries, shopFilter]);

  const filteredCustomerOrders = useMemo(() => {
    if (shopFilter === 'all') return state.customerOrders;
    return state.customerOrders.filter(e => String(e.shop_id) === shopFilter);
  }, [state.customerOrders, shopFilter]);

  const filteredWastage = useMemo(() => {
    if (shopFilter === 'all') return state.wastage;
    return state.wastage.filter(e => String(e.shop_id) === shopFilter);
  }, [state.wastage, shopFilter]);

  // 2. Calculate active aggregates
  const todayStr = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    // Sales and profitability calculations
    const totalSales = filteredEntries.reduce((sum, e) => sum + (Number(e.total_sales) || 0), 0);
    const totalExpenses = filteredEntries.reduce((sum, e) => sum + (Number(e.total_expenses) || 0), 0);
    const totalPayments = filteredEntries.reduce((sum, e) => sum + (Number(e.total_vendor_payments) || 0), 0);
    const netProfit = filteredEntries.reduce((sum, e) => sum + (Number(e.net_profit) || 0), 0);
    const totalWalkins = filteredEntries.reduce((sum, e) => sum + (Number(e.walk_ins) || 0), 0);

    // Wastage calculations
    const totalWastageLoss = filteredWastage.reduce((sum, w) => sum + (Number(w.estimated_loss) || 0), 0);
    const todayWastage = filteredWastage
      .filter(w => w.wastage_date === todayStr)
      .reduce((sum, w) => sum + (Number(w.estimated_loss) || 0), 0);

    // Customer advance orders
    const pendingBookings = filteredCustomerOrders.filter(o => o.status === 'pending' || o.status === 'in_progress').length;
    const activeBookingsValue = filteredCustomerOrders
      .filter(o => o.status === 'pending' || o.status === 'in_progress')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    // Stock alerts (items below threshold)
    const activeStockAlerts = state.stockItems.filter(item => item.quantity <= item.min_threshold);

    return {
      totalSales,
      netProfit,
      totalWastageLoss,
      todayWastage,
      pendingBookings,
      activeBookingsValue,
      totalWalkins,
      activeStockAlerts
    };
  }, [filteredEntries, filteredCustomerOrders, filteredWastage, state.stockItems, todayStr]);

  // 3. Prepare timeline chart data (Revenue vs Expenses vs Profit)
  const chartData = useMemo(() => {
    const dates = {};
    
    // Aggregate by date
    filteredEntries.forEach(entry => {
      const d = entry.entry_date;
      if (!dates[d]) dates[d] = { date: d, revenue: 0, expenses: 0, profit: 0 };
      dates[d].revenue += Number(entry.total_sales) || 0;
      dates[d].expenses += (Number(entry.total_expenses) || 0) + (Number(entry.total_vendor_payments) || 0);
      dates[d].profit += Number(entry.net_profit) || 0;
    });

    // If no data exists, load placeholder visual data to demonstrate the dashboard
    if (Object.keys(dates).length === 0) {
      return [
        { date: 'Mon', revenue: 15000, expenses: 8000, profit: 7000 },
        { date: 'Tue', revenue: 18500, expenses: 9500, profit: 9000 },
        { date: 'Wed', revenue: 22000, expenses: 11000, profit: 11000 },
        { date: 'Thu', revenue: 16000, expenses: 10000, profit: 6000 },
        { date: 'Fri', revenue: 25000, expenses: 12000, profit: 13000 },
        { date: 'Sat', revenue: 32000, expenses: 15000, profit: 17000 },
        { date: 'Sun', revenue: 28000, expenses: 13500, profit: 14500 }
      ];
    }

    // Sort by date string ascending
    return Object.values(dates).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredEntries]);

  // 4. Prepare branch share chart data
  const pieData = useMemo(() => {
    if (shopFilter !== 'all') return [];

    let highwaySales = 0;
    let mainroadSales = 0;

    state.dailyEntries.forEach(e => {
      if (String(e.shop_id) === '0') highwaySales += Number(e.total_sales) || 0;
      if (String(e.shop_id) === '1') mainroadSales += Number(e.total_sales) || 0;
    });

    if (highwaySales === 0 && mainroadSales === 0) {
      return [
        { name: 'Highway Branch', value: 45000 },
        { name: 'Mainroad Branch', value: 55000 }
      ];
    }

    return [
      { name: 'Highway Branch', value: highwaySales },
      { name: 'Mainroad Branch', value: mainroadSales }
    ];
  }, [state.dailyEntries, shopFilter]);

  const PIE_COLORS = ['#10b981', '#0ea5e9'];

  return (
    <div style={{ width: '100%', animation: 'fade-in 0.4s ease-out' }}>
      {/* Top action row */}
      <div className="page-header-row">
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-title)' }}>Operations Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Real-time business performance overview</p>
        </div>

        {/* Shop Select Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Store size={18} style={{ color: 'var(--primary)' }} />
          <select 
            value={shopFilter}
            onChange={(e) => setShopFilter(e.target.value)}
            className="form-input"
            style={{ width: '220px', padding: '0.6rem 1rem' }}
          >
            <option value="all">All Branches</option>
            <option value="0">Highway Branch</option>
            <option value="1">Mainroad Branch</option>
          </select>
        </div>
      </div>

      {/* Grid statistics widgets */}
      <div className="stats-grid">
        <div className="glass-card stat-widget">
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Total Revenue</p>
            <h3 className="stat-val" style={{ color: 'var(--primary)' }}>
              ₹{stats.totalSales.toLocaleString('en-IN')}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Sales logged in system
            </p>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--primary)' }}>
            <IndianRupee size={24} />
          </div>
        </div>

        <div className="glass-card stat-widget">
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Net Profit Margin</p>
            <h3 className="stat-val" style={{ color: '#67e8f9' }}>
              ₹{stats.netProfit.toLocaleString('en-IN')}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Revenue minus expenses
            </p>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9' }}>
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="glass-card stat-widget">
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Total Wastage Loss</p>
            <h3 className="stat-val" style={{ color: 'var(--danger)' }}>
              ₹{stats.totalWastageLoss.toLocaleString('en-IN')}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Today: ₹{stats.todayWastage.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)' }}>
            <Trash2 size={24} />
          </div>
        </div>

        <div className="glass-card stat-widget">
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Active Cake Bookings</p>
            <h3 className="stat-val" style={{ color: 'var(--accent)' }}>
              {stats.pendingBookings}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Value: ₹{stats.activeBookingsValue.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent)' }}>
            <Calendar size={24} />
          </div>
        </div>
      </div>

      {/* Main Charts & Visualizations */}
      <div className={`responsive-grid-2-1 ${shopFilter !== 'all' ? 'single-col' : ''}`} style={{ marginBottom: '2.5rem' }}>
        {/* Timeline Area Chart */}
        <div className="glass-panel chart-panel">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--primary)' }} /> Sales & Profitability Trends
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(6,26,21,0.95)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8rem', marginTop: '10px' }} />
                <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch Share Pie Chart (Only visible on 'All Branches') */}
        {shopFilter === 'all' && (
          <div className="glass-panel chart-panel">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Store size={18} style={{ color: 'var(--secondary)' }} /> Branch Contribution
            </h3>
            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.75rem', marginTop: '0.5rem' }}>
              {pieData.map((item, index) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: PIE_COLORS[index] }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Critical Stock Alerts & Recent Bookings */}
      <div className="responsive-grid-2">
        {/* Stock Alerts Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: stats.activeStockAlerts.length > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
            <AlertTriangle size={18} /> Raw Material Stock Warnings
          </h3>
          
          {stats.activeStockAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
              <p>🟢 All inventory levels are above minimum thresholds.</p>
            </div>
          ) : (
            <div className="table-container" style={{ maxHeight: '220px' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Material Name</th>
                    <th>Remaining Qty</th>
                    <th>Min Limit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.activeStockAlerts.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: '500' }}>{item.name}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: '600' }}>
                        {(item.quantity / 1000).toFixed(1)} {item.unit === 'g' ? 'kg' : item.unit === 'ml' ? 'L' : item.unit}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {(item.min_threshold / 1000).toFixed(1)} {item.unit === 'g' ? 'kg' : item.unit === 'ml' ? 'L' : item.unit}
                      </td>
                      <td>
                        <span style={{ 
                          background: 'rgba(239, 68, 68, 0.12)', 
                          color: 'var(--danger)', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          REORDER
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Active Cake Bookings */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={18} style={{ color: 'var(--accent)' }} /> Active Customer Advance Bookings
          </h3>
          
          {filteredCustomerOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
              <p>📅 No pending advance cake bookings logged.</p>
            </div>
          ) : (
            <div className="table-container" style={{ maxHeight: '220px' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Required Date</th>
                    <th>Cake / Flavor</th>
                    <th>Deposit Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomerOrders
                    .filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
                    .slice(0, 4)
                    .map(order => (
                      <tr key={order.id}>
                        <td>
                          <div style={{ fontWeight: '500' }}>{order.customer_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{order.customer_phone}</div>
                        </td>
                        <td style={{ fontWeight: '600' }}>{order.delivery_date}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{order.cake_description || order.product_name}</td>
                        <td>
                          <span style={{ 
                            background: order.total_amount - order.advance_amount === 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', 
                            color: order.total_amount - order.advance_amount === 0 ? 'var(--primary)' : 'var(--accent)', 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {order.total_amount - order.advance_amount === 0 ? 'PAID FULL' : `OWES ₹${order.total_amount - order.advance_amount}`}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
