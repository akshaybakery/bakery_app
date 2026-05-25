import React, { useState, useMemo, useEffect } from 'react';
import { useLiveState } from '../context/StateContext';
import { useAuth } from '../context/AuthContext';
import { 
  CookingPot, 
  Scale, 
  Flame, 
  IceCream, 
  PackageCheck, 
  CheckCircle, 
  Play, 
  AlertTriangle,
  ClipboardList
} from 'lucide-react';

export default function Production() {
  const { state, addProductionBatch, updateProductionBatch, addRecipe } = useLiveState();
  const { user } = useAuth();

  // Recipe scaling state
  const [selectedRecipeId, setSelectedRecipeId] = useState(state.recipes[0]?.id || '');
  const [targetYield, setTargetYield] = useState('');

  // New recipe addition state (modal or simple form toggle)
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newRecipeYield, setNewRecipeYield] = useState(10);
  const [newRecipeUnit, setNewRecipeUnit] = useState('Loaves');

  // active recipe object
  const activeRecipe = useMemo(() => {
    return state.recipes.find(r => r.id === selectedRecipeId);
  }, [state.recipes, selectedRecipeId]);

  // Set default target yield to default recipe yield on load
  useEffect(() => {
    if (activeRecipe && !targetYield) {
      setTargetYield(activeRecipe.yield_quantity);
    }
  }, [activeRecipe]);

  // Scaled ingredients list
  const scaledIngredients = useMemo(() => {
    if (!activeRecipe || !targetYield) return [];
    const factor = Number(targetYield) / activeRecipe.yield_quantity;
    
    return activeRecipe.ingredients.map(ing => {
      const required = ing.quantity * factor;
      
      // Cross reference with active inventory stock items
      const stockItem = state.stockItems.find(
        s => s.name.toLowerCase() === ing.name.toLowerCase()
      );
      const stockAvailable = stockItem ? stockItem.quantity : 0;
      const isShortage = stockAvailable < required;

      return {
        ...ing,
        quantityRequired: required,
        quantityAvailable: stockAvailable,
        isShortage,
        stockUnit: stockItem ? stockItem.unit : ing.unit
      };
    });
  }, [activeRecipe, targetYield, state.stockItems]);

  // Check if any ingredient is short in inventory
  const hasShortage = useMemo(() => {
    return scaledIngredients.some(ing => ing.isShortage);
  }, [scaledIngredients]);

  // Trigger baking batch
  const handleStartBake = async () => {
    if (!activeRecipe || !targetYield) return;

    const newBatch = {
      recipe_id: activeRecipe.id,
      recipe_name: activeRecipe.name,
      target_yield: Number(targetYield),
      yield_unit: activeRecipe.yield_unit,
      status: 'planned', // planned, baking, cooling, packaging, completed
      ingredients: scaledIngredients.map(ing => ({
        name: ing.name,
        quantity: ing.quantityRequired,
        unit: ing.unit
      })),
      logs: [{ timestamp: new Date().toISOString(), note: 'Batch planned.' }],
      created_by: user?.name || ''
    };

    try {
      await addProductionBatch(newBatch);
      alert(`Baking batch of ${targetYield} ${activeRecipe.yield_unit} for ${activeRecipe.name} started successfully! Ingredients deducted from inventory.`);
    } catch (err) {
      alert('Failed to start batch: ' + err.message);
    }
  };

  const handleAdvanceStatus = async (batchId, currentStatus) => {
    let nextStatus = '';
    let logNote = '';

    if (currentStatus === 'planned') {
      nextStatus = 'baking';
      logNote = 'Moved to Oven (Baking).';
    } else if (currentStatus === 'baking') {
      nextStatus = 'cooling';
      logNote = 'Baking completed, moved to Cooling.';
    } else if (currentStatus === 'cooling') {
      nextStatus = 'packaging';
      logNote = 'Cooled, moved to Packaging.';
    } else if (currentStatus === 'packaging') {
      nextStatus = 'completed';
      logNote = 'Packaged and sent to storefront stock.';
    }

    if (nextStatus) {
      try {
        await updateProductionBatch(batchId, nextStatus, logNote);
      } catch (err) {
        alert('Failed to update status: ' + err.message);
      }
    }
  };

  return (
    <div style={{ animation: 'fade-in 0.3s ease-out' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-title)' }}>🧑‍🍳 Production & Recipe scaling</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Bake batch scaling, bill-of-materials audit, and live bake logs</p>
      </div>

      <div className="recipe-scaler-panel" style={{ marginBottom: '2.5rem' }}>
        
        {/* Left Side: Recipe Selector & Yield Input */}
        <div className="glass-panel scale-input-wrapper">
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Scale size={20} style={{ color: 'var(--primary)' }} /> Recipe BOM Scaler
          </h3>

          <div className="form-group">
            <label className="form-label">Select Recipe</label>
            <select
              value={selectedRecipeId}
              onChange={(e) => {
                setSelectedRecipeId(e.target.value);
                setTargetYield('');
              }}
              className="form-input"
            >
              {state.recipes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} (Base Yield: {r.yield_quantity} {r.yield_unit})
                </option>
              ))}
            </select>
          </div>

          {activeRecipe && (
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label className="form-label">Target Production Yield ({activeRecipe.yield_unit})</label>
              <input
                type="number"
                value={targetYield}
                onChange={(e) => setTargetYield(e.target.value)}
                placeholder={`e.g. ${activeRecipe.yield_quantity * 5}`}
                className="form-input"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Enter the desired baking quantity. All ingredients scale in real-time.
              </p>
            </div>
          )}

          {activeRecipe && (
            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              {hasShortage ? (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid var(--danger)',
                  color: '#fca5a5',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  marginBottom: '1rem'
                }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <span>Warning: Stock levels insufficient to complete this baking batch.</span>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid var(--primary)',
                  color: '#a7f3d0',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  marginBottom: '1rem'
                }}>
                  <CheckCircle size={18} style={{ color: 'var(--primary)' }} />
                  <span>All ingredients are available in inventory. Ready to bake.</span>
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartBake}
                disabled={!targetYield || Number(targetYield) <= 0}
                style={{ width: '100%' }}
              >
                <Play size={16} /> Start Baking Batch & Deduct Inventory
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Scaled Ingredient Checklist */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={20} style={{ color: 'var(--secondary)' }} /> Scaled Bill of Materials
          </h3>

          {scaledIngredients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              <p>Please enter a target yield to scale recipe details.</p>
            </div>
          ) : (
            <div className="table-container" style={{ maxHeight: '350px' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th style={{ textAlign: 'right' }}>Required</th>
                    <th style={{ textAlign: 'right' }}>In Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {scaledIngredients.map((ing, i) => (
                    <tr key={i} style={{ background: ing.isShortage ? 'rgba(239, 68, 68, 0.04)' : 'transparent' }}>
                      <td style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {ing.isShortage && <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />}
                        {ing.name}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>
                        {ing.unit === 'g' && ing.quantityRequired >= 1000 
                          ? `${(ing.quantityRequired / 1000).toFixed(2)} kg` 
                          : ing.unit === 'ml' && ing.quantityRequired >= 1000 
                          ? `${(ing.quantityRequired / 1000).toFixed(2)} L` 
                          : `${ing.quantityRequired.toFixed(0)} ${ing.unit}`}
                      </td>
                      <td style={{ 
                        textAlign: 'right', 
                        fontWeight: '600', 
                        color: ing.isShortage ? 'var(--danger)' : 'var(--text-secondary)'
                      }}>
                        {ing.stockUnit === 'g' && ing.quantityAvailable >= 1000 
                          ? `${(ing.quantityAvailable / 1000).toFixed(1)} kg` 
                          : ing.stockUnit === 'ml' && ing.quantityAvailable >= 1000 
                          ? `${(ing.quantityAvailable / 1000).toFixed(1)} L` 
                          : `${ing.quantityAvailable.toFixed(0)} ${ing.stockUnit}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE BATCHES TRACKER */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-title)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CookingPot size={22} style={{ color: 'var(--primary)' }} /> Live Oven & Baking Log
        </h3>

        {state.productionBatches.filter(b => b.status !== 'completed').length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            <p>🥖 No active baking batches logged. Plan a batch above to start production!</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product / Batch</th>
                  <th>Target Quantity</th>
                  <th>Stage Status</th>
                  <th>Latest Log</th>
                  <th>Workflow Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.productionBatches
                  .filter(b => b.status !== 'completed')
                  .map(batch => (
                    <tr key={batch.id}>
                      <td>
                        <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#f3f4f6' }}>{batch.recipe_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created by {batch.created_by}</div>
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        {batch.target_yield} {batch.yield_unit}
                      </td>
                      <td>
                        <span style={{ 
                          background: 
                            batch.status === 'planned' ? 'rgba(255,255,255,0.05)' :
                            batch.status === 'baking' ? 'rgba(245, 158, 11, 0.12)' :
                            batch.status === 'cooling' ? 'rgba(14, 165, 233, 0.12)' :
                            batch.status === 'packaging' ? 'rgba(168, 85, 247, 0.12)' : 'transparent',
                          color:
                            batch.status === 'planned' ? 'var(--text-secondary)' :
                            batch.status === 'baking' ? 'var(--accent)' :
                            batch.status === 'cooling' ? 'var(--secondary)' :
                            batch.status === 'packaging' ? '#c084fc' : '#fff',
                          padding: '0.3rem 0.65rem',
                          borderRadius: '50px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          border: `1px solid ${
                            batch.status === 'planned' ? 'var(--border-color)' :
                            batch.status === 'baking' ? 'rgba(245,158,11,0.2)' :
                            batch.status === 'cooling' ? 'rgba(14,165,233,0.2)' :
                            batch.status === 'packaging' ? 'rgba(168,85,247,0.2)' : 'transparent'
                          }`
                        }}>
                          {batch.status === 'planned' && '📋 Planned'}
                          {batch.status === 'baking' && '🔥 In Oven (Bake)'}
                          {batch.status === 'cooling' && '❄️ Cooling'}
                          {batch.status === 'packaging' && '📦 Packaging'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {batch.logs?.[batch.logs.length - 1]?.note || 'Baking scheduled.'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ 
                            padding: '0.4rem 0.85rem', 
                            fontSize: '0.8rem',
                            borderRadius: '4px',
                            background: 
                              batch.status === 'planned' ? '#d97706' : 
                              batch.status === 'baking' ? '#0ea5e9' :
                              batch.status === 'cooling' ? '#8b5cf6' : '#10b981',
                            boxShadow: 'none'
                          }}
                          onClick={() => handleAdvanceStatus(batch.id, batch.status)}
                        >
                          {batch.status === 'planned' && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Flame size={12} /> Move to Oven
                            </span>
                          )}
                          {batch.status === 'baking' && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <IceCream size={12} /> Move to Cooling
                            </span>
                          )}
                          {batch.status === 'cooling' && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <PackageCheck size={12} /> Move to Packaging
                            </span>
                          )}
                          {batch.status === 'packaging' && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle size={12} /> Complete Bake
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
