import React, { useState } from 'react';
import { useLiveState } from '../context/StateContext';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  CheckCircle, 
  Clock, 
  IndianRupee, 
  Smile, 
  Cake 
} from 'lucide-react';

export default function CustomerOrders() {
  const { state, addCustomerOrder, updateCustomerOrder } = useLiveState();
  const { user } = useAuth();

  const [filter, setFilter] = useState('active'); // 'active', 'delivered', 'cancelled', 'all'
  const [showAddForm, setShowAddForm] = useState(false);

  // New order form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [productName, setProductName] = useState('Birthday Cake');
  const [flavor, setFlavor] = useState('Chocolate Truffle');
  const [weight, setWeight] = useState(1); // in kg
  const [isEggless, setIsEggless] = useState(true);
  const [shape, setShape] = useState('Round');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('Evening (4 PM - 7 PM)');
  const [totalAmount, setTotalAmount] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [notes, setNotes] = useState('');

  const activeShopId = user?.role === 'owner' ? 0 : (user?.shopId !== null ? user.shopId : 0);

  // Filter orders list
  const filteredOrders = state.customerOrders.filter(o => {
    // If shop filter applies to active user
    const shopMatches = user?.role === 'owner' ? true : o.shop_id === activeShopId;
    if (!shopMatches) return false;

    if (filter === 'active') return o.status === 'pending' || o.status === 'in_progress';
    if (filter === 'delivered') return o.status === 'delivered';
    if (filter === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerName || !customerPhone || !deliveryDate || !totalAmount || !advanceAmount) {
      alert('Please fill in all required fields.');
      return;
    }

    const orderPayload = {
      shop_id: activeShopId,
      customer_name: customerName,
      customer_phone: customerPhone,
      product_name: productName,
      cake_description: `${flavor} Cake (${weight}kg, ${shape}, ${isEggless ? 'Eggless' : 'With Egg'})`,
      delivery_date: deliveryDate,
      delivery_slot: deliverySlot,
      total_amount: Number(totalAmount),
      advance_amount: Number(advanceAmount),
      status: 'pending', // pending, in_progress, delivered, cancelled
      notes: notes,
      created_by: user?.name || ''
    };

    try {
      await addCustomerOrder(orderPayload);
      setShowAddForm(false);
      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setProductName('Birthday Cake');
      setFlavor('Chocolate Truffle');
      setWeight(1);
      setIsEggless(true);
      setShape('Round');
      setDeliveryDate('');
      setTotalAmount('');
      setAdvanceAmount('');
      setNotes('');
    } catch (err) {
      alert('Failed to log booking: ' + err.message);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateCustomerOrder(orderId, { status: newStatus });
    } catch (err) {
      alert('Failed to update booking status: ' + err.message);
    }
  };

  const handleDeliverAndPayFull = async (orderId, total, advance) => {
    try {
      // Mark as delivered and declare full outstanding payment received
      await updateCustomerOrder(orderId, { 
        status: 'delivered',
        advance_amount: total // means fully paid
      });
      alert('Cake delivered & remaining balance settled to live accounts!');
    } catch (err) {
      alert('Failed to complete booking: ' + err.message);
    }
  };

  return (
    <div style={{ animation: 'fade-in 0.3s ease-out' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-title)' }}>🎂 Custom Cake & Advance Bookings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Wedding/Birthday cake reservations, advance payments, and delivery schedule</p>
        </div>

        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          {showAddForm ? 'Close Scheduler' : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> New Cake Reservation
            </span>
          )}
        </button>
      </div>

      {showAddForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cake size={20} style={{ color: 'var(--primary)' }} /> Book Customized Bakery Order
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div className="form-group">
              <label className="form-label">Customer Full Name *</label>
              <input 
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input 
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="10 digit number"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Item / Product Category</label>
              <select 
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="form-input"
              >
                <option value="Birthday Cake">Custom Birthday Cake</option>
                <option value="Wedding Cake">Designer Wedding Cake</option>
                <option value="Cupcake Platter">Bulk Cupcake Platter</option>
                <option value="Wholesale Pastry Pack">Wholesale Pastry Order</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Cake Flavor / Frosting</label>
              <input 
                type="text"
                value={flavor}
                onChange={(e) => setFlavor(e.target.value)}
                placeholder="e.g. Red Velvet, Pineapple, Truffle"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Size / Weight (kg)</label>
              <input 
                type="number"
                step="0.5"
                min="0.5"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Shape</label>
              <select value={shape} onChange={(e) => setShape(e.target.value)} className="form-input">
                <option value="Round">Round</option>
                <option value="Square">Square</option>
                <option value="Heart">Heart-shaped</option>
                <option value="Custom 3D">Custom 3D Shape</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: 'span 2', background: 'rgba(255,255,255,0.01)', padding: '0.5rem', borderRadius: '8px' }}>
              <input 
                type="checkbox"
                id="eggless"
                checked={isEggless}
                onChange={(e) => setIsEggless(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="eggless" style={{ fontWeight: '600', cursor: 'pointer' }}>🍰 100% Pure Vegetarian Eggless Cake</label>
            </div>

            <div className="form-group">
              <label className="form-label">Delivery Date *</label>
              <input 
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Delivery / Pickup Slot</label>
              <select value={deliverySlot} onChange={(e) => setDeliverySlot(e.target.value)} className="form-input">
                <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                <option value="Evening (4 PM - 7 PM)">Evening (4 PM - 7 PM)</option>
                <option value="Night (7 PM - 10 PM)">Night (7 PM - 10 PM)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Total Booking Price (₹) *</label>
              <input 
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="e.g. 1500"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Advance Deposit Paid (₹) *</label>
              <input 
                type="number"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                placeholder="e.g. 500"
                className="form-input"
                required
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Custom Design / Frosting Notes</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write custom lettering, color preference, eggless or design options..."
                className="form-input"
                rows="3"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Confirm Booking Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER CONTROL TAB */}
      <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', width: 'fit-content' }}>
        {[
          { id: 'active', label: '⏳ Active Bookings' },
          { id: 'delivered', label: '✅ Delivered' },
          { id: 'cancelled', label: '❌ Cancelled' },
          { id: 'all', label: '🗂️ All History' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className="btn btn-secondary"
            style={{ 
              padding: '0.4rem 0.85rem', 
              fontSize: '0.85rem',
              background: filter === tab.id ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              borderColor: filter === tab.id ? 'var(--primary)' : 'transparent',
              color: filter === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ORDERS LIST */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-title)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingBag size={22} style={{ color: 'var(--primary)' }} /> Customer Reservation Ledger
        </h3>

        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            <p>📅 No bookings matching filter criteria were found for this branch.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Customer Info</th>
                  <th>Cake & Description</th>
                  <th>Delivery Date / Slot</th>
                  <th>Financial Ledger</th>
                  <th>Status</th>
                  <th>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const balanceDue = order.total_amount - order.advance_amount;
                  return (
                    <tr key={order.id} style={{ background: order.status === 'cancelled' ? 'rgba(239, 68, 68, 0.02)' : 'transparent' }}>
                      <td>
                        <div style={{ fontWeight: '700', color: '#f3f4f6' }}>{order.customer_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📞 {order.customer_phone}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Logged by {order.created_by}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--primary)' }}>{order.product_name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{order.cake_description}</div>
                        {order.notes && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--text-muted)', 
                            background: 'rgba(255,255,255,0.01)', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px',
                            borderLeft: '2px solid var(--accent)',
                            marginTop: '0.25rem',
                            maxWidth: '300px'
                          }}>
                            "{order.notes}"
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: '600' }}>📅 {order.delivery_date}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>🕒 {order.delivery_slot}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total: <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>₹{order.total_amount}</span></div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Deposit: <span style={{ fontWeight: '600', color: 'var(--secondary)' }}>₹{order.advance_amount}</span></div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: balanceDue > 0 ? 'var(--accent)' : 'var(--primary)' }}>
                          {balanceDue > 0 ? `Due: ₹${balanceDue}` : 'Fully Settled'}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          background: 
                            order.status === 'pending' ? 'rgba(245, 158, 11, 0.12)' :
                            order.status === 'in_progress' ? 'rgba(14, 165, 233, 0.12)' :
                            order.status === 'delivered' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color:
                            order.status === 'pending' ? 'var(--accent)' :
                            order.status === 'in_progress' ? 'var(--secondary)' :
                            order.status === 'delivered' ? 'var(--primary)' : 'var(--danger)',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          textTransform: 'uppercase'
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'in_progress')}
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px' }}
                            >
                              ⏳ Bake Active
                            </button>
                          )}
                          {(order.status === 'pending' || order.status === 'in_progress') && (
                            <>
                              <button
                                onClick={() => handleDeliverAndPayFull(order.id, order.total_amount, order.advance_amount)}
                                className="btn btn-primary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', background: '#10b981', boxShadow: 'none' }}
                              >
                                Deliver & Settle
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                                className="btn btn-danger"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', boxShadow: 'none' }}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {order.status === 'delivered' && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              <Smile size={16} style={{ display: 'inline', marginRight: '4px' }} /> Happy Customer
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
