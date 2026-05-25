import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, getBaseURL } from './AuthContext';

const StateContext = createContext(null);

export function StateProvider({ children }) {
  const { user } = useAuth();
  
  // Entire live bakery operational state
  const [state, setState] = useState({
    shops: [],
    vendors: [],
    dailyEntries: [],
    expenses: [],
    orders: [],
    customerOrders: [],
    goodsInward: [],
    marketPurchases: [],
    wastage: [],
    rawMaterials: [],
    recipes: [],
    productionBatches: [],
    ledger: [],
    stockItems: [],
    stockTransactions: [],
    masterItems: []
  });

  const [syncStatus, setSyncStatus] = useState('live'); // 'live', 'syncing', 'offline'
  const [loading, setLoading] = useState(true);
  const pollingTimerRef = useRef(null);

  // Helper to generate UUIDs locally
  const generateUUID = () => {
    return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
  };

  // Fetch the live database state from server
  const fetchLiveState = useCallback(async (isSilent = false) => {
    if (!isSilent) setSyncStatus('syncing');
    const baseUrl = getBaseURL();
    try {
      const response = await fetch(`${baseUrl}/api/store`);
      if (response.ok) {
        const data = await response.json();
        setState(prevState => ({
          ...prevState,
          ...data
        }));
        setSyncStatus('live');
      } else {
        console.error('Failed to load server store data:', response.status);
        if (response.status === 401) {
          // session expired
        } else {
          setSyncStatus('offline');
        }
      }
    } catch (err) {
      console.error('Error fetching live server state:', err);
      setSyncStatus('offline');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Save the full state to the server
  const saveStateToServer = async (updatedState) => {
    setSyncStatus('syncing');
    const baseUrl = getBaseURL();
    try {
      const response = await fetch(`${baseUrl}/api/store`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ data: updatedState })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Update local state with the official server-merged data
          setState(prevState => ({
            ...prevState,
            ...result.data
          }));
          setSyncStatus('live');
          return true;
        }
      }
      setSyncStatus('offline');
      return false;
    } catch (err) {
      console.error('Error updating live database state on server:', err);
      setSyncStatus('offline');
      return false;
    }
  };

  // Fetch on mount or when user changes
  useEffect(() => {
    if (user) {
      fetchLiveState();
      
      // Start short-polling every 10 seconds for real-time live sharing across staff
      pollingTimerRef.current = setInterval(() => {
        fetchLiveState(true);
      }, 10000);
    } else {
      setLoading(false);
    }

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [user, fetchLiveState]);

  // ----------------------------------------------------
  // MUTATIONS (Saves instantly to live backend)
  // ----------------------------------------------------

  // 1. Add/Update Daily Entry (Branch lead logs sales & cash)
  const addDailyEntry = useCallback(async (entry) => {
    const updatedEntry = {
      ...entry,
      id: entry.id || `${entry.shop_id}:${entry.entry_date}`,
      updated_at: new Date().toISOString(),
      created_at: entry.created_at || new Date().toISOString()
    };

    const newEntries = [...state.dailyEntries];
    const index = newEntries.findIndex(
      e => e.entry_date === updatedEntry.entry_date && e.shop_id === updatedEntry.shop_id
    );

    if (index >= 0) {
      newEntries[index] = updatedEntry;
    } else {
      newEntries.unshift(updatedEntry);
    }

    const updatedState = { ...state, dailyEntries: newEntries };
    setState(updatedState);
    await saveStateToServer(updatedState);
  }, [state]);

  // 2. Add Expense
  const addExpense = useCallback(async (expense) => {
    const newExpense = {
      ...expense,
      id: generateUUID(),
      created_at: new Date().toISOString()
    };

    const updatedState = {
      ...state,
      expenses: [newExpense, ...state.expenses]
    };
    setState(updatedState);
    await saveStateToServer(updatedState);
  }, [state]);

  // 3. Add Internal Branch Requisition or Supplier Order
  const addOrder = useCallback(async (order) => {
    const newOrder = {
      ...order,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedState = {
      ...state,
      orders: [newOrder, ...state.orders]
    };
    setState(updatedState);
    await saveStateToServer(updatedState);
  }, [state]);

  // 4. Update Internal Branch or Supplier Order
  const updateOrder = useCallback(async (orderId, updates) => {
    const newOrders = state.orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          ...updates,
          updated_at: new Date().toISOString()
        };
      }
      return o;
    });

    const updatedState = { ...state, orders: newOrders };
    setState(updatedState);
    await saveStateToServer(updatedState);
  }, [state]);

  // 5. Add Customer Advance Booking
  const addCustomerOrder = useCallback(async (customerOrder) => {
    const newCustomerOrder = {
      ...customerOrder,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedState = {
      ...state,
      customerOrders: [newCustomerOrder, ...state.customerOrders]
    };
    setState(updatedState);
    await saveStateToServer(updatedState);
  }, [state]);

  // 6. Update Customer Advance Booking
  const updateCustomerOrder = useCallback(async (orderId, updates) => {
    const newCustomerOrders = state.customerOrders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          ...updates,
          updated_at: new Date().toISOString()
        };
      }
      return o;
    });

    const updatedState = { ...state, customerOrders: newCustomerOrders };
    setState(updatedState);
    await saveStateToServer(updatedState);
  }, [state]);

  // 7. Add Goods Inward & update ledger + inventory
  const addGoodsInward = useCallback(async (receipt) => {
    const newReceipt = {
      ...receipt,
      id: generateUUID(),
      created_at: new Date().toISOString()
    };

    // Add receipt
    const newGoodsList = [newReceipt, ...state.goodsInward];

    // Log double-entry ledger debit (account payable decreases / cost recorded)
    const newLedgerEntry = {
      id: generateUUID(),
      vendor_id: receipt.vendor_id,
      shop_id: receipt.shop_id || null,
      section: 'purchase',
      entry_date: receipt.bill_date,
      entry_type: 'debit',
      amount: receipt.total_amount,
      reference_type: 'goods_inward',
      reference_id: newReceipt.id,
      description: `Invoice ${receipt.invoice_number || 'N/A'}`,
      created_by: user?.name || '',
      created_at: new Date().toISOString()
    };
    const newLedger = [...state.ledger, newLedgerEntry];

    // Automatically update inventory counts for received materials
    const newStockItems = state.stockItems.map(item => {
      const match = receipt.items.find(i => i.name.toLowerCase() === item.name.toLowerCase());
      if (match) {
        return {
          ...item,
          quantity: item.quantity + match.quantity
        };
      }
      return item;
    });

    const updatedState = {
      ...state,
      goodsInward: newGoodsList,
      ledger: newLedger,
      stockItems: newStockItems
    };
    setState(updatedState);
    await saveStateToServer(updatedState);
  }, [state, user]);

  // 8. Add Vendor Cash/UPI Payment & update ledger
  const addVendorPayment = useCallback(async (payment) => {
    const newLedgerEntry = {
      id: generateUUID(),
      vendor_id: payment.vendor_id,
      shop_id: payment.shop_id || null,
      section: 'payment',
      entry_date: payment.payment_date,
      entry_type: 'credit', // credit means we paid off our accounts payable
      amount: payment.amount,
      reference_type: 'vendor_payment',
      reference_id: generateUUID(),
      description: `Paid via ${payment.payment_mode}${payment.notes ? ' — ' + payment.notes : ''}`,
      created_by: user?.name || '',
      created_at: new Date().toISOString()
    };

    const newLedger = [...state.ledger, newLedgerEntry];
    const updatedState = { ...state, ledger: newLedger };
    setState(updatedState);
    await saveStateToServer(updatedState);
  }, [state, user]);

  // 9. Add Wastage Log
  const addWastage = useCallback(async (wastageLog) => {
    const newWastageLog = {
      ...wastageLog,
      id: generateUUID(),
      created_at: new Date().toISOString()
    };

    const updatedState = {
      ...state,
      wastage: [newWastageLog, ...state.wastage]
    };
    setState(updatedState);
    await saveStateToServer(updatedState);
  }, [state]);

  // 10. Record Production Batch & deduct ingredients from stock
  const addProductionBatch = useCallback(async (batch) => {
    const newBatch = {
      ...batch,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Automatically deduct ingredients from inventory
    const newStockItems = state.stockItems.map(stock => {
      const match = batch.ingredients.find(i => i.name.toLowerCase() === stock.name.toLowerCase());
      if (match) {
        return {
          ...stock,
          quantity: Math.max(0, stock.quantity - match.quantity)
        };
      }
      return stock;
    });

    const updatedState = {
      ...state,
      productionBatches: [newBatch, ...state.productionBatches],
      stockItems: newStockItems
    };
    setState(updatedState);
    await saveStateToServer(updatedState);
  }, [state]);

  // 11. Update Production Batch Status
  const updateProductionBatch = useCallback(async (batchId, status, logs) => {
    const newBatches = state.productionBatches.map(b => {
      if (b.id === batchId) {
        return {
          ...b,
          status,
          logs: [...(b.logs || []), { timestamp: new Date().toISOString(), note: logs }],
          updated_at: new Date().toISOString()
        };
      }
      return b;
    });

    const updatedState = { ...state, productionBatches: newBatches };
    setState(updatedState);
    await saveStateToServer(updatedState);
  }, [state]);

  // 12. Add/Edit Recipes
  const addRecipe = useCallback(async (recipe) => {
    const newRecipe = {
      ...recipe,
      id: recipe.id || generateUUID()
    };
    const newRecipes = [...state.recipes];
    const index = newRecipes.findIndex(r => r.id === newRecipe.id);
    if (index >= 0) {
      newRecipes[index] = newRecipe;
    } else {
      newRecipes.unshift(newRecipe);
    }
    const updatedState = { ...state, recipes: newRecipes };
    setState(updatedState);
    await saveStateToServer(updatedState);
  }, [state]);

  // 13. System State Reset (for debug or settings)
  const resetDatabase = useCallback(async (defaultSchema) => {
    setState(defaultSchema);
    await saveStateToServer(defaultSchema);
  }, []);

  return (
    <StateContext.Provider value={{
      state,
      loading,
      syncStatus,
      fetchLiveState,
      addDailyEntry,
      addExpense,
      addOrder,
      updateOrder,
      addCustomerOrder,
      updateCustomerOrder,
      addGoodsInward,
      addVendorPayment,
      addWastage,
      addProductionBatch,
      updateProductionBatch,
      addRecipe,
      resetDatabase
    }}>
      {children}
    </StateContext.Provider>
  );
}

export function useLiveState() {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useLiveState must be used within a StateProvider');
  }
  return context;
}
