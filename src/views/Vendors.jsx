import React, { useState, useMemo } from 'react';
import { useLiveState } from '../context/StateContext';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  FileSpreadsheet, 
  IndianRupee, 
  Plus, 
  TrendingUp, 
  AlertCircle,
  FolderMinus,
  CheckCircle,
  Truck
} from 'lucide-react';

export default function Vendors() {
  const { state, addGoodsInward, addVendorPayment } = useLiveState();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('payable'); // 'payable', 'goods', 'vendors'
  
  // Goods Inward Form State
  const [showInwardForm, setShowInwardForm] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(state.vendors[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStockId, setSelectedStockId] = useState(state.stockItems[0]?.id || '');
  const [receivedQty, setReceivedQty] = useState('');
  const [totalCost, setTotalCost] = useState('');

  // Payment Form State
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payVendorId, setPayVendorId] = useState(state.vendors[0]?.id || '');
  const [payAmount, setPayAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI / GPay');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');

  // 1. Calculate Real-Time Outstanding Balance per Vendor
  // Debit = invoice cost (what we owe them), Credit = what we paid them
  // Outstanding = sum(debits) - sum(credits)
  const vendorBalances = useMemo(() => {
    const balances = {};
    
    // Initialize
    state.vendors.forEach(v => {
      balances[v.id] = { vendor: v, debits: 0, credits: 0, balance: 0 };
    });

    // Compute from double-entry ledger
    state.ledger.forEach(entry => {
      if (entry.vendor_id && balances[entry.vendor_id]) {
        if (entry.entry_type === 'debit') {
          balances[entry.vendor_id].debits += Number(entry.amount) || 0;
        } else if (entry.entry_type === 'credit') {
          balances[entry.vendor_id].credits += Number(entry.amount) || 0;
        }
      }
    });

    Object.keys(balances).forEach(id => {
      balances[id].balance = balances[id].debits - balances[id].credits;
    });

    return Object.values(balances);
  }, [state.vendors, state.ledger]);

  const totalOutstandingAll = useMemo(() => {
    return vendorBalances.reduce((sum, v) => sum + v.balance, 0);
  }, [vendorBalances]);

  // Handlers
  const handleInwardSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVendorId || !selectedStockId || !receivedQty || !totalCost) {
      alert('Please fill out all required invoice fields.');
      return;
    }

    const stockItem = state.stockItems.find(s => s.id === selectedStockId);
    const vendor = state.vendors.find(v => v.id === selectedVendorId);
    if (!stockItem || !vendor) return;

    const inwardPayload = {
      vendor_id: selectedVendorId,
      vendor_name: vendor.name,
      invoice_number: invoiceNumber,
      bill_date: billDate,
      total_amount: Number(totalCost),
      items: [
        {
          name: stockItem.name,
          quantity: Number(receivedQty),
          unit: stockItem.unit,
          price: Number(totalCost) / Number(receivedQty)
        }
      ]
    };

    try {
      await addGoodsInward(inwardPayload);
      setShowInwardForm(false);
      setInvoiceNumber('');
      setReceivedQty('');
      setTotalCost('');
      alert('Goods Inward registered! Raw materials added to live stock & Ledger debited.');
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!payVendorId || !payAmount) {
      alert('Please enter payment details.');
      return;
    }

    const paymentPayload = {
      vendor_id: payVendorId,
      amount: Number(payAmount),
      payment_date: payDate,
      payment_mode: paymentMode,
      notes: payNotes
    };

    try {
      await addVendorPayment(paymentPayload);
      setShowPaymentForm(false);
      setPayAmount('');
      setPayNotes('');
      alert('Payment registered! Accounts Payable ledger updated.');
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  return (
    <div style={{ animation: 'fade-in 0.3s ease-out' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-title)' }}>🌾 Supplier Registry & Ledgers</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Accounts payable, vendor double-entry ledgers, and goods inward raw material invoices</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => { setShowPaymentForm(true); setShowInwardForm(false); }}
            className="btn btn-secondary"
            style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
          >
            <IndianRupee size={16} /> Record Payment
          </button>
          
          <button 
            onClick={() => { setShowInwardForm(true); setShowPaymentForm(false); }}
            className="btn btn-primary"
          >
            <Plus size={16} /> Log Inward Invoice
          </button>
        </div>
      </div>

      {/* POPUP FORMS */}
      {showInwardForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={20} style={{ color: 'var(--primary)' }} /> Log Inbound Supplier Invoice (Goods Inward)
          </h3>
          <form onSubmit={handleInwardSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Vendor / Supplier</label>
              <select value={selectedVendorId} onChange={(e) => setSelectedVendorId(e.target.value)} className="form-input">
                {state.vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Invoice / Bill Number</label>
              <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="e.g. GST-908" className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Invoice Date</label>
              <input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Raw Material Received</label>
              <select value={selectedStockId} onChange={(e) => setSelectedStockId(e.target.value)} className="form-input">
                {state.stockItems.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity Received</label>
              <input type="number" value={receivedQty} onChange={(e) => setReceivedQty(e.target.value)} placeholder="e.g. 50" className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Total Invoice Cost (₹)</label>
              <input type="number" value={totalCost} onChange={(e) => setTotalCost(e.target.value)} placeholder="e.g. 2400" className="form-input" />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <button type="button" onClick={() => setShowInwardForm(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary">Process Goods Inward</button>
            </div>
          </form>
        </div>
      )}

      {showPaymentForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IndianRupee size={20} style={{ color: 'var(--primary)' }} /> Log Vendor Cash/UPI Payment Outflow
          </h3>
          <form onSubmit={handlePaymentSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Pay To Vendor</label>
              <select value={payVendorId} onChange={(e) => setPayVendorId(e.target.value)} className="form-input">
                {state.vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount Paid (₹)</label>
              <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="e.g. 5000" className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="form-input">
                <option value="UPI / GPay">UPI / GPay / PhonePe</option>
                <option value="Cash Register">Cash from Drawer</option>
                <option value="Bank Transfer">RTGS / NEFT / IMPS</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Date</label>
              <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="form-input" />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Reference Notes (Ref Number / Remarks)</label>
              <input type="text" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="e.g. Ref: 2209123891 or Month-end settlement" className="form-input" />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <button type="button" onClick={() => setShowPaymentForm(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary">Publish Payment Entry</button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER CONTROL TABS */}
      <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', width: 'fit-content' }}>
        {[
          { id: 'payable', label: '📊 Accounts Payable' },
          { id: 'goods', label: '🧾 Goods Inward Bills' },
          { id: 'vendors', label: '📇 Supplier Directory' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="btn btn-secondary"
            style={{ 
              padding: '0.4rem 0.85rem', 
              fontSize: '0.85rem',
              background: activeTab === tab.id ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              borderColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TABS VIEWS */}
      
      {/* 1. Accounts Payable & Balances */}
      {activeTab === 'payable' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Summary Box */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-title)', marginBottom: '1rem' }}>Accounts Balance Summary</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Outstanding Accounts Payable</span>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', color: totalOutstandingAll > 0 ? 'var(--accent)' : 'var(--primary)', marginTop: '0.2rem' }}>
                ₹{totalOutstandingAll.toLocaleString('en-IN')}
              </h2>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '6px' }}>
              <AlertCircle size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
              <span>Outstanding balance matches cumulative supplier invoices minus recorded payments. All figures sync in real-time.</span>
            </div>
          </div>

          {/* Individual Vendor Balances Table */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-title)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} /> Outstandings by Vendor
            </h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th style={{ textAlign: 'right' }}>Total Billed</th>
                    <th style={{ textAlign: 'right' }}>Total Paid</th>
                    <th style={{ textAlign: 'right' }}>Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorBalances.map(v => (
                    <tr key={v.vendor.id}>
                      <td style={{ fontWeight: '600' }}>{v.vendor.name}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>₹{v.debits.toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>₹{v.credits.toLocaleString('en-IN')}</td>
                      <td style={{ 
                        textAlign: 'right', 
                        fontWeight: '700', 
                        color: v.balance > 0 ? 'var(--accent)' : 'var(--primary)'
                      }}>
                        ₹{v.balance.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Goods Inward History */}
      {activeTab === 'goods' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-title)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileSpreadsheet size={22} style={{ color: 'var(--primary)' }} /> Raw Material Invoice Logs
          </h3>

          {state.goodsInward.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              <p>🧾 No inbound vendor invoices logged yet. Use "Log Inward Invoice" above to register purchases.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Invoice Date</th>
                    <th>Supplier</th>
                    <th>Bill Number</th>
                    <th>Material & Qty Received</th>
                    <th>Total Billed</th>
                  </tr>
                </thead>
                <tbody>
                  {state.goodsInward.map(bill => (
                    <tr key={bill.id}>
                      <td style={{ fontWeight: '600' }}>{bill.bill_date}</td>
                      <td style={{ fontWeight: '500' }}>{bill.vendor_name}</td>
                      <td style={{ color: 'var(--secondary)', fontWeight: '600' }}>{bill.invoice_number || 'N/A'}</td>
                      <td>
                        {bill.items?.map((item, idx) => (
                          <div key={idx} style={{ fontWeight: '500', color: '#f3f4f6' }}>
                            {item.name}: {item.quantity} {item.unit}
                          </div>
                        ))}
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--accent)' }}>
                        ₹{bill.total_amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. Vendor Directory */}
      {activeTab === 'vendors' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-title)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={22} style={{ color: 'var(--primary)' }} /> Supplier Directory
          </h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Contact Details</th>
                  <th>Warehouse Address</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {state.vendors.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: '700', fontSize: '1.05rem', color: '#f3f4f6' }}>{v.name}</td>
                    <td>
                      <div style={{ fontWeight: '500' }}>📞 {v.phone}</div>
                      {v.gst_number && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>GST: {v.gst_number}</div>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{v.address || 'N/A'}</td>
                    <td>
                      <span style={{ 
                        background: 'rgba(16, 185, 129, 0.12)', 
                        color: 'var(--primary)', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
