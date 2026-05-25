import React, { useState, useMemo } from 'react';
import { useLiveState } from '../context/StateContext';
import { useAuth } from '../context/AuthContext';
import { 
  Trash2, 
  Plus, 
  IndianRupee, 
  TrendingDown, 
  AlertTriangle,
  ClipboardList,
  Store
} from 'lucide-react';

export default function Wastage() {
  const { state, addWastage } = useLiveState();
  const { user } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form fields
  const [selectedProductId, setSelectedProductId] = useState(state.masterItems[0]?.id || '');
  const [wastageDate, setWastageDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('Expired');
  const [notes, setNotes] = useState('');

  const activeShopId = user?.role === 'owner' ? 0 : (user?.shopId !== null ? user.shopId : 0);
  const activeShopCode = state.shops.find(s => s.id === activeShopId)?.code || 'highway';

  // Filter wastage logs
  const filteredLogs = useMemo(() => {
    // Owners see all, staff see their own shop's logs
    if (user?.role === 'owner') return state.wastage;
    return state.wastage.filter(w => w.shop_id === activeShopId);
  }, [state.wastage, activeShopId, user]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const totalLoss = filteredLogs.reduce((sum, w) => sum + (Number(w.estimated_loss) || 0), 0);
    const totalQuantity = filteredLogs.reduce((sum, w) => sum + (Number(w.quantity) || 0), 0);
    
    // Group by reason
    const reasonsMap = {};
    filteredLogs.forEach(w => {
      reasonsMap[w.reason] = (reasonsMap[w.reason] || 0) + (Number(w.estimated_loss) || 0);
    });

    return {
      totalLoss,
      totalQuantity,
      reasonsMap
    };
  }, [filteredLogs]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProductId || quantity <= 0) {
      alert('Please select a product and enter a positive quantity.');
      return;
    }

    const product = state.masterItems.find(m => m.id === selectedProductId);
    if (!product) return;

    // Calculate loss = qty * product sales price
    const estimatedLoss = Number(quantity) * (product.price || 0);

    const wastagePayload = {
      shop_id: activeShopId,
      shop_code: activeShopCode,
      product_id: product.id,
      product_name: product.name,
      category: product.category,
      quantity: Number(quantity),
      wastage_date: wastageDate,
      reason: reason,
      estimated_loss: estimatedLoss,
      notes: notes,
      logged_by: user?.name || ''
    };

    try {
      await addWastage(wastagePayload);
      setShowAddForm(false);
      setQuantity(1);
      setNotes('');
      alert('Wastage log submitted live to operational database!');
    } catch (err) {
      alert('Failed to log wastage: ' + err.message);
    }
  };

  return (
    <div style={{ animation: 'fade-in 0.3s ease-out' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-title)' }}>🗑️ Spillage & Wastage Tracker</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Log expired products, damaged items, kitchen spillages, and track operational losses</p>
        </div>

        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
          style={{ background: 'var(--danger)', boxShadow: '0 4px 14px 0 var(--danger-glow)' }}
        >
          {showAddForm ? 'Close Panel' : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Log Damaged Stock
            </span>
          )}
        </button>
      </div>

      {showAddForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
            <Trash2 size={20} /> Log Product Damage / Spillage
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div className="form-group">
              <label className="form-label">Wasted Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="form-input"
              >
                {state.masterItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} (Unit Price: ₹{item.price})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Wastage Date</label>
              <input 
                type="date"
                value={wastageDate}
                onChange={(e) => setWastageDate(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Wasted Quantity (Units / Pcs)</label>
              <input 
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reason for Wastage</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="form-input">
                <option value="Expired">Product Expired</option>
                <option value="Damaged Storefront">Damaged on Storefront</option>
                <option value="Kitchen Spillage">Kitchen Spillage / Bake error</option>
                <option value="Overproduction">Unsold / Overproduced</option>
                <option value="Customer Return">Customer Return / Refund</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Detailed Notes</label>
              <input 
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Mold detected, dropping in transit, oven overheated..."
                className="form-input"
              />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ background: 'var(--danger)' }}>
                Publish Loss Log
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AGGREGATED CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem' }}>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Operational Loss</p>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--danger)', marginTop: '0.2rem' }}>
              ₹{aggregateStats.totalLoss.toLocaleString('en-IN')}
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Wasted items value based on selling prices
            </p>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)' }}>
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem' }}>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Quantity Wasted</p>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {aggregateStats.totalQuantity} <span style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Pcs</span>
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Sum of all damaged logs
            </p>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-secondary)' }}>
            <Trash2 size={24} />
          </div>
        </div>
      </div>

      {/* REASONS BREAKDOWN */}
      {filteredLogs.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-title)', marginBottom: '1rem' }}>Losses by Reason</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {Object.entries(aggregateStats.reasonsMap).map(([reason, amount]) => (
              <div 
                key={reason} 
                style={{ 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px', 
                  padding: '0.75rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{reason}</span>
                <span style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--danger)', marginTop: '0.15rem' }}>
                  ₹{amount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WASTAGE LOGS LIST */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-title)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ClipboardList size={22} style={{ color: 'var(--primary)' }} /> Damaged Stock Audit Ledger
        </h3>

        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            <p>🗑️ No product wastage or damage logs registered yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Wastage Date</th>
                  <th>Shop Branch</th>
                  <th>Product & Category</th>
                  <th>Qty Wasted</th>
                  <th>Financial Loss</th>
                  <th>Reason / Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  return (
                    <tr key={log.id}>
                      <td style={{ fontWeight: '600' }}>{log.wastage_date}</td>
                      <td>
                        <span style={{ 
                          background: log.shop_id === 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(14, 165, 233, 0.12)',
                          color: log.shop_id === 0 ? 'var(--primary)' : 'var(--secondary)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          textTransform: 'uppercase'
                        }}>
                          {log.shop_code.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700', color: '#f3f4f6' }}>{log.product_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Category: {log.category}</div>
                      </td>
                      <td style={{ fontWeight: '700' }}>
                        {log.quantity} Pcs
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--danger)' }}>
                        ₹{log.estimated_loss.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span style={{ 
                          background: 'rgba(239, 68, 68, 0.08)',
                          color: '#fca5a5',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {log.reason}
                        </span>
                        {log.notes && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            "{log.notes}"
                          </div>
                        )}
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          By {log.logged_by}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
