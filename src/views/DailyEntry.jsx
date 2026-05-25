import React, { useState, useEffect } from 'react';
import { useLiveState } from '../context/StateContext';
import { useAuth } from '../context/AuthContext';
import { 
  Calculator, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  IndianRupee 
} from 'lucide-react';

export default function DailyEntry() {
  const { state, addDailyEntry } = useLiveState();
  const { user } = useAuth();
  
  // Active shop is locked based on staff role, or editable for Owner
  const shopId = user?.role === 'owner' ? 0 : (user?.shopId !== null ? user.shopId : 0);
  const shopCode = state.shops.find(s => s.id === shopId)?.code || 'highway';
  
  const [step, setStep] = useState(1);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Step 1: Opening float
  const [openingCash, setOpeningCash] = useState(5000);
  
  // Step 2: Digital totals & operational counters
  const [walkIns, setWalkIns] = useState(0);
  const [upiTotal, setUpiTotal] = useState(0);
  const [declaredCashSales, setDeclaredCashSales] = useState(0);
  const [cashExpenses, setCashExpenses] = useState(0);
  const [cashVendorPayments, setCashVendorPayments] = useState(0);
  const [notes, setNotes] = useState('');

  // Step 3: Cash denominations
  const denominationsList = [
    { value: 2000, label: '₹2000 Note' },
    { value: 500, label: '₹500 Note' },
    { value: 200, label: '₹200 Note' },
    { value: 100, label: '₹100 Note' },
    { value: 50, label: '₹50 Note' },
    { value: 20, label: '₹20 Note' },
    { value: 10, label: '₹10 Note/Coin' },
    { value: 5, label: '₹5 Coin' },
    { value: 2, label: '₹2 Coin' },
    { value: 1, label: '₹1 Coin' }
  ];

  const [denominations, setDenominations] = useState(
    denominationsList.map(d => ({ denomination: d.value, count: 0 }))
  );

  // Success screen
  const [success, setSuccess] = useState(false);

  // Load existing entry if already logged for the selected date & shop
  useEffect(() => {
    const existing = state.dailyEntries.find(
      e => e.entry_date === entryDate && e.shop_id === shopId
    );
    if (existing) {
      setOpeningCash(existing.opening_cash || 0);
      setWalkIns(existing.walk_ins || 0);
      setUpiTotal(existing.upi_total || 0);
      setDeclaredCashSales(existing.total_sales - existing.upi_total || 0);
      setCashExpenses(existing.total_expenses || 0);
      setCashVendorPayments(existing.total_vendor_payments || 0);
      setNotes(existing.notes || '');
      
      const savedDenoms = existing.closing_denominations || [];
      setDenominations(
        denominationsList.map(d => {
          const match = savedDenoms.find(sd => sd.denomination === d.value);
          return { denomination: d.value, count: match ? match.count : 0 };
        })
      );
    } else {
      // Defaults
      setOpeningCash(5000);
      setWalkIns(0);
      setUpiTotal(0);
      setDeclaredCashSales(0);
      setCashExpenses(0);
      setCashVendorPayments(0);
      setNotes('');
      setDenominations(denominationsList.map(d => ({ denomination: d.value, count: 0 })));
    }
  }, [entryDate, shopId, state.dailyEntries]);

  // Denominations actual cash sum
  const closingCashTotal = denominations.reduce(
    (sum, d) => sum + d.denomination * d.count, 0
  );

  // Calculations
  const totalSales = Number(declaredCashSales) + Number(upiTotal);
  const expectedClosingCash = Number(openingCash) + Number(declaredCashSales) - Number(cashExpenses) - Number(cashVendorPayments);
  const cashVariance = closingCashTotal - expectedClosingCash;
  const netProfit = totalSales - Number(cashExpenses) - Number(cashVendorPayments);

  const handleDenominationChange = (val, countStr) => {
    const count = parseInt(countStr) || 0;
    setDenominations(prev => prev.map(d => d.denomination === val ? { ...d, count } : d));
  };

  const handleNext = () => {
    if (step < 4) setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  const handleSaveEntry = async () => {
    const entryPayload = {
      shop_id: shopId,
      entry_date: entryDate,
      opening_cash: Number(openingCash),
      closing_cash: closingCashTotal,
      cash_retained: closingCashTotal,
      upi_total: Number(upiTotal),
      walk_ins: Number(walkIns),
      total_sales: totalSales,
      total_expenses: Number(cashExpenses),
      total_vendor_payments: Number(cashVendorPayments),
      net_profit: netProfit,
      notes: notes,
      closing_denominations: denominations.filter(d => d.count > 0)
    };

    try {
      await addDailyEntry(entryPayload);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setStep(1);
      }, 3000);
    } catch (err) {
      alert('Failed to log entry: ' + err.message);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', animation: 'fade-in 0.3s ease-out' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-title)' }}>
          🥖 Daily Operations Log
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Reconciliation for <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{shopCode.toUpperCase()} BRANCH</span>
        </p>
      </div>

      {success ? (
        <div className="glass-panel text-center pulse-glowing" style={{ padding: '3rem', textAlign: 'center' }}>
          <CheckCircle2 size={64} style={{ color: 'var(--primary)', margin: '0 auto 1.5rem auto' }} />
          <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-title)', marginBottom: '0.5rem' }}>Reconciliation Saved!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Daily sales figures have been written to the server live.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          
          {/* Step nodes header */}
          <div className="wizard-steps">
            {[1, 2, 3, 4].map(s => (
              <div 
                key={s} 
                className={`wizard-step-node ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`}
              >
                {s}
              </div>
            ))}
          </div>

          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)' }}>
              {step === 1 && 'Step 1: Set Date & Opening Float'}
              {step === 2 && 'Step 2: Operations & Digital Sales'}
              {step === 3 && 'Step 3: Closing Denominations'}
              {step === 4 && 'Step 4: Audit & Save'}
            </h3>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <div className="form-group">
                <label className="form-label">Operations Date</label>
                <input 
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Opening Float Cash (₹)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>₹</span>
                  <input 
                    type="number"
                    value={openingCash}
                    onChange={(e) => setOpeningCash(Number(e.target.value))}
                    className="form-input"
                    style={{ paddingLeft: '2rem' }}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  The starting cash float in the register drawers.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group">
                <label className="form-label">Walk-in Customers</label>
                <input 
                  type="number"
                  value={walkIns}
                  onChange={(e) => setWalkIns(Number(e.target.value))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Digital UPI Sales (₹)</label>
                <input 
                  type="number"
                  value={upiTotal}
                  onChange={(e) => setUpiTotal(Number(e.target.value))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Declared Cash Sales (₹)</label>
                <input 
                  type="number"
                  value={declaredCashSales}
                  onChange={(e) => setDeclaredCashSales(Number(e.target.value))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cash Expenses paid (₹)</label>
                <input 
                  type="number"
                  value={cashExpenses}
                  onChange={(e) => setCashExpenses(Number(e.target.value))}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Vendor Payments paid from Register (₹)</label>
                <input 
                  type="number"
                  value={cashVendorPayments}
                  onChange={(e) => setCashVendorPayments(Number(e.target.value))}
                  className="form-input"
                />
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Denomination</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600' }}>
                  Total Value: ₹{closingCashTotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="table-container" style={{ maxHeight: '300px', padding: '0 1rem' }}>
                {denominationsList.map(item => {
                  const currentCount = denominations.find(d => d.denomination === item.value)?.count || 0;
                  return (
                    <div className="denomination-row" key={item.value}>
                      <span style={{ fontWeight: '600' }}>₹{item.value}</span>
                      <span style={{ color: 'var(--text-muted)' }}>×</span>
                      <input 
                        type="number"
                        min="0"
                        placeholder="0"
                        value={currentCount || ''}
                        onChange={(e) => handleDenominationChange(item.value, e.target.value)}
                        className="form-input"
                        style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}
                      />
                      <span style={{ color: 'var(--text-muted)' }}>=</span>
                      <span style={{ fontWeight: '500', color: currentCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        ₹{(item.value * currentCount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div>
              {/* Variance Alerts */}
              {Math.abs(cashVariance) > 0 ? (
                <div style={{
                  background: Math.abs(cashVariance) > 500 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  border: `1px solid ${Math.abs(cashVariance) > 500 ? 'var(--danger)' : 'var(--accent)'}`,
                  color: Math.abs(cashVariance) > 500 ? '#fca5a5' : '#fde047',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                  fontSize: '0.875rem'
                }}>
                  <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span style={{ fontWeight: '700' }}>
                      Cash Mismatch Detected (₹{cashVariance.toLocaleString('en-IN')})
                    </span>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', opacity: 0.85 }}>
                      Expected ₹{expectedClosingCash.toLocaleString('en-IN')} in drawer, but found ₹{closingCashTotal.toLocaleString('en-IN')}. Please verify cash counts or add comments below.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid var(--primary)',
                  color: '#a7f3d0',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                  fontSize: '0.875rem'
                }}>
                  <CheckCircle2 size={20} style={{ color: 'var(--primary)' }} />
                  <span>Drawer matches expected closing cash! Excellent reconciliation.</span>
                </div>
              )}

              {/* Summary table */}
              <div className="table-container" style={{ marginBottom: '1.5rem' }}>
                <table className="custom-table">
                  <tbody>
                    <tr>
                      <td style={{ color: 'var(--text-secondary)' }}>Opening Float</td>
                      <td style={{ textAlign: 'right', fontWeight: '500' }}>₹{openingCash.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-secondary)' }}>UPI / Digital Sales</td>
                      <td style={{ textAlign: 'right', fontWeight: '500', color: 'var(--secondary)' }}>₹{upiTotal.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-secondary)' }}>Declared Cash Sales</td>
                      <td style={{ textAlign: 'right', fontWeight: '500', color: 'var(--primary)' }}>₹{declaredCashSales.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-secondary)' }}>Drawer Deductions (Expenses + Payments)</td>
                      <td style={{ textAlign: 'right', fontWeight: '500', color: 'var(--danger)' }}>
                        -₹{(Number(cashExpenses) + Number(cashVendorPayments)).toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', fontWeight: '600' }}>
                      <td>Expected Drawer Cash</td>
                      <td style={{ textAlign: 'right' }}>₹{expectedClosingCash.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', fontWeight: '700' }}>
                      <td>Actual Drawer Cash (Denominated)</td>
                      <td style={{ textAlign: 'right', color: 'var(--primary)' }}>₹{closingCashTotal.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ fontWeight: '700', borderTop: '2px solid var(--border-color)' }}>
                      <td>Cash Discrepancy</td>
                      <td style={{ 
                        textAlign: 'right', 
                        color: cashVariance === 0 ? 'var(--primary)' : (cashVariance > 0 ? '#10b981' : 'var(--danger)')
                      }}>
                        {cashVariance > 0 ? '+' : ''}₹{cashVariance.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="form-group">
                <label className="form-label">Discrepancy / Reconciliation Notes</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input"
                  rows="3"
                  placeholder="State reasons for differences, cash drops, or notes..."
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBack}
              disabled={step === 1}
              style={{ opacity: step === 1 ? 0.4 : 1 }}
            >
              <ChevronLeft size={16} /> Back
            </button>

            {step < 4 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary pulse-glowing"
                onClick={handleSaveEntry}
                style={{ background: '#10b981' }}
              >
                <Save size={16} /> Submit Live Reconciliation
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
