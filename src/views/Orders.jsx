import React, { useState } from 'react';
import { useLiveState } from '../context/StateContext';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeftRight, 
  Plus, 
  Clock, 
  Truck, 
  CheckCircle, 
  ArrowUpRight, 
  CalendarDays,
  ShoppingBag
} from 'lucide-react';

export default function Orders() {
  const { state, addOrder, updateOrder } = useLiveState();
  const { user } = useAuth();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(state.masterItems[0]?.id || '');
  const [quantity, setQuantity] = useState(10);
  const [neededBy, setNeededBy] = useState('');
  const [notes, setNotes] = useState('');

  const activeShopId = user?.role === 'owner' ? 0 : (user?.shopId !== null ? user.shopId : 0);
  const activeShopCode = state.shops.find(s => s.id === activeShopId)?.code || 'highway';

  // Filter orders by role and branch
  const filteredOrders = state.orders.filter(o => {
    // Owners see all, branch staff only see their own shop orders
    if (user?.role === 'owner') return true;
    return o.shop_id === activeShopId;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProductId || !neededBy || quantity <= 0) {
      alert('Please fill out all fields correctly.');
      return;
    }

    const prod = state.masterItems.find(m => m.id === selectedProductId);
    if (!prod) return;

    const orderPayload = {
      shop_id: activeShopId,
      shop_code: activeShopCode,
      product_id: prod.id,
      product_name: prod.name,
      category: prod.category,
      quantity: Number(quantity),
      needed_by: neededBy,
      status: 'pending', // pending, in_progress, in_transit, fulfilled, cancelled
      notes: notes,
      created_by: user?.name || '',
      order_date: new Date().toISOString().split('T')[0]
    };

    try {
      await addOrder(orderPayload);
      setShowAddForm(false);
      setQuantity(10);
      setNeededBy('');
      setNotes('');
    } catch (err) {
      alert('Failed to log branch order: ' + err.message);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    let logMsg = '';
    if (newStatus === 'in_progress') logMsg = 'Kitchen accepted order, starting bake.';
    if (newStatus === 'in_transit') logMsg = 'Baking complete, loaded with driver for dispatch.';
    if (newStatus === 'fulfilled') logMsg = 'Order arrived at branch storefront & added to stock.';
    if (newStatus === 'cancelled') logMsg = 'Order cancelled.';

    try {
      await updateOrder(orderId, { status: newStatus, comments: logMsg });
    } catch (err) {
      alert('Failed to update branch order status: ' + err.message);
    }
  };

  return (
    <div style={{ width: '100%', animation: 'fade-in 0.3s ease-out' }}>
      
      {/* Title */}
      <div className="page-header-row">
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-title)' }}>🥖 Branch Stock Requisitions</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Internal stock orders between branch storefronts and central baking kitchen</p>
        </div>

        {/* Staff can request new stock */}
        {(user?.role !== 'production' && user?.role !== 'driver') && (
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
          >
            {showAddForm ? 'Close Order Panel' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={16} /> Requisition Stock
              </span>
            )}
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeftRight size={20} style={{ color: 'var(--primary)' }} /> Order Stock from Central Kitchen
          </h3>

          <form onSubmit={handleSubmit} className="responsive-grid-2" style={{ gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Product to Requisition</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="form-input"
              >
                {state.masterItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity Needed</label>
              <input 
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Needed By Date & Time *</label>
              <input 
                type="datetime-local"
                value={neededBy}
                onChange={(e) => setNeededBy(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Dispatch / Recipe Scaling Notes</label>
              <input 
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Sliced, double packaging, extra soft..."
                className="form-input"
              />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Send Requisition Live
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REQUISITION LIST */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-title)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingBag size={22} style={{ color: 'var(--primary)' }} /> Live Requisitions Board
        </h3>

        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            <p>🥖 No branch stock requisitions have been logged yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Branch Requesting</th>
                  <th>Product & Details</th>
                  <th>Quantity Requested</th>
                  <th>Needed By Schedule</th>
                  <th>Status</th>
                  <th>Kitchen / Driver Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  return (
                    <tr key={order.id}>
                      <td>
                        <span style={{ 
                          background: order.shop_id === 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(14, 165, 233, 0.12)',
                          color: order.shop_id === 0 ? 'var(--primary)' : 'var(--secondary)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          textTransform: 'uppercase'
                        }}>
                          {order.shop_code.toUpperCase()} BRANCH
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          By {order.created_by} on {order.order_date}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700', color: '#f3f4f6' }}>{order.product_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Category: {order.category}</div>
                        {order.notes && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                            "{order.notes}"
                          </div>
                        )}
                        {order.comments && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: '500', marginTop: '0.2rem' }}>
                            💬 {order.comments}
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: '700', fontSize: '1.05rem' }}>
                        {order.quantity} Pcs
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                          📅 {new Date(order.needed_by).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          🕒 {new Date(order.needed_by).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          background: 
                            order.status === 'pending' ? 'rgba(255, 255, 255, 0.05)' :
                            order.status === 'in_progress' ? 'rgba(245, 158, 11, 0.12)' :
                            order.status === 'in_transit' ? 'rgba(14, 165, 233, 0.12)' :
                            order.status === 'fulfilled' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color:
                            order.status === 'pending' ? 'var(--text-secondary)' :
                            order.status === 'in_progress' ? 'var(--accent)' :
                            order.status === 'in_transit' ? 'var(--secondary)' :
                            order.status === 'fulfilled' ? 'var(--primary)' : 'var(--danger)',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          textTransform: 'uppercase'
                        }}>
                          {order.status === 'pending' && '📋 Pending'}
                          {order.status === 'in_progress' && '🔥 Baking'}
                          {order.status === 'in_transit' && '🚚 In Transit'}
                          {order.status === 'fulfilled' && '✅ Arrived'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {/* Central Kitchen (Production) accepts pending */}
                          {order.status === 'pending' && (user?.role === 'owner' || user?.role === 'production') && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'in_progress')}
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px' }}
                            >
                              👨‍🍳 Accept & Bake
                            </button>
                          )}
                          
                          {/* Central Kitchen dispatches to driver */}
                          {order.status === 'in_progress' && (user?.role === 'owner' || user?.role === 'production') && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'in_transit')}
                              className="btn btn-primary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', background: '#0ea5e9', boxShadow: 'none' }}
                            >
                              🚚 Load to Driver
                            </button>
                          )}
                          
                          {/* Driver or Branch Lead confirms receipt */}
                          {order.status === 'in_transit' && (user?.role === 'owner' || user?.role === 'driver' || user?.role === 'highway_staff' || user?.role === 'mainroad_staff') && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'fulfilled')}
                              className="btn btn-primary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', background: '#10b981', boxShadow: 'none' }}
                            >
                              ✅ Confirmed Fulfill
                            </button>
                          )}

                          {order.status === 'fulfilled' && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle size={14} style={{ color: 'var(--primary)' }} /> Added to Storefront
                            </span>
                          )}
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
